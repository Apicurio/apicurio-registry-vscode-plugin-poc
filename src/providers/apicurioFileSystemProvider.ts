import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { ApicurioUriBuilder } from '../utils/uriBuilder';
import { ConflictDetector, ConflictResolution } from '../services/conflictDetector';
import { ConflictResolutionDialog } from '../ui/conflictResolutionDialog';

/**
 * File System Provider for Apicurio Registry artifacts.
 * Enables reading and writing artifact content directly in VSCode.
 *
 * - Draft versions: Content is editable and can be saved back to registry
 * - Published versions: Content is read-only
 * - Concurrent edit detection: Checks for conflicts before saving drafts
 */
export class ApicurioFileSystemProvider implements vscode.FileSystemProvider {
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile = this._emitter.event;

    // In-memory cache of file contents
    private fileCache = new Map<string, Uint8Array>();

    constructor(
        private registryService: RegistryService,
        private conflictDetector: ConflictDetector
    ) {}

    // Required FileSystemProvider methods

    watch(): vscode.Disposable {
        // We don't implement file watching for now
        return new vscode.Disposable(() => {});
    }

    stat(uri: vscode.Uri): vscode.FileStat {
        return {
            type: vscode.FileType.File,
            ctime: Date.now(),
            mtime: Date.now(),
            size: this.fileCache.get(uri.toString())?.length || 0
        };
    }

    readDirectory(): [string, vscode.FileType][] {
        throw new Error('readDirectory not supported');
    }

    createDirectory(): void {
        throw new Error('createDirectory not supported');
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        // Check cache first
        const cached = this.fileCache.get(uri.toString());
        if (cached) {
            return cached;
        }

        // Fetch from registry
        const metadata = ApicurioUriBuilder.parseVersionUri(uri);
        if (!metadata) {
            console.error('[FileSystemProvider] Failed to parse URI:', uri.toString());
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        try {
            const content = await this.registryService.getArtifactContent(
                metadata.groupId,
                metadata.artifactId,
                metadata.version
            );

            const data = Buffer.from(content.content, 'utf-8');
            this.fileCache.set(uri.toString(), data);

            // Track when draft is opened for conflict detection
            if (ApicurioUriBuilder.isDraft(uri)) {
                try {
                    const versionMeta = await this.registryService.getVersionMetadata(
                        metadata.groupId,
                        metadata.artifactId,
                        metadata.version
                    );
                    if (versionMeta.modifiedOn) {
                        this.conflictDetector.trackOpened(uri, versionMeta.modifiedOn);
                    }
                } catch (error) {
                    // Ignore tracking errors - don't block file opening
                    console.warn('Failed to track draft opening for conflict detection:', error);
                }
            }

            return data;
        } catch (error: any) {
            console.error('Failed to fetch content from registry:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                response: error.response
            });
            throw vscode.FileSystemError.FileNotFound(uri);
        }
    }

    async writeFile(
        uri: vscode.Uri,
        content: Uint8Array,
        options: { create: boolean; overwrite: boolean }
    ): Promise<void> {
        // Check if this is a draft version
        if (!ApicurioUriBuilder.isDraft(uri)) {
            throw vscode.FileSystemError.NoPermissions(
                'Cannot save published version content. Create a draft to edit content.'
            );
        }

        const metadata = ApicurioUriBuilder.parseVersionUri(uri);
        if (!metadata) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        // Check for conflicts before saving
        try {
            const conflict = await this.conflictDetector.checkForConflict(
                uri,
                content.toString()
            );

            if (conflict) {
                // Conflict detected - show resolution dialog
                const resolution = await ConflictResolutionDialog.show(conflict);

                switch (resolution) {
                    case ConflictResolution.Cancel:
                        // User cancelled - don't save
                        throw vscode.FileSystemError.Unavailable('Save cancelled due to conflict');

                    case ConflictResolution.Discard:
                        // Discard local changes - reload remote content
                        this.fileCache.delete(uri.toString());
                        const remoteContent = Buffer.from(conflict.remoteContent, 'utf-8');
                        this.fileCache.set(uri.toString(), remoteContent);

                        // Update timestamp to remote
                        this.conflictDetector.updateTimestamp(uri, conflict.remoteModifiedOn);

                        // Fire change event to reload editor
                        this._emitter.fire([{
                            type: vscode.FileChangeType.Changed,
                            uri
                        }]);

                        vscode.window.showInformationMessage('Local changes discarded. Reloaded remote version.');
                        return;

                    case ConflictResolution.Overwrite:
                        // User chose to overwrite - proceed with save
                        vscode.window.showWarningMessage('Saving changes and overwriting remote version...');
                        break;
                }
            }
        } catch (error: any) {
            // Edge case: Draft might have been deleted or published
            if (error.message && error.message.includes('404')) {
                const choice = await vscode.window.showErrorMessage(
                    `Draft "${ApicurioUriBuilder.getDisplayName(metadata.groupId, metadata.artifactId, metadata.version)}" has been deleted. Cannot save changes.`,
                    { modal: true },
                    'Discard Changes',
                    'Cancel'
                );

                if (choice === 'Discard Changes') {
                    // Close the document
                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    return;
                }
                throw vscode.FileSystemError.Unavailable('Draft was deleted');
            }

            // Network error during conflict check
            const choice = await vscode.window.showWarningMessage(
                `Cannot check for conflicts: ${error.message}\n\nDo you want to save anyway? This may overwrite changes made by other users.`,
                { modal: true },
                'Retry',
                'Force Save',
                'Cancel'
            );

            if (choice === 'Retry') {
                // Retry the whole save operation
                return this.writeFile(uri, content, options);
            } else if (choice !== 'Force Save') {
                // User cancelled
                throw vscode.FileSystemError.Unavailable('Save cancelled - could not verify conflicts');
            }
            // If 'Force Save', continue with save operation
        }

        try {
            // Save to registry
            await this.registryService.updateDraftContent(
                metadata.groupId,
                metadata.artifactId,
                metadata.version,
                content.toString()
            );

            // Fetch updated metadata to get new modifiedOn timestamp
            const updatedMeta = await this.registryService.getVersionMetadata(
                metadata.groupId,
                metadata.artifactId,
                metadata.version
            );

            // Update tracked timestamp
            if (updatedMeta.modifiedOn) {
                this.conflictDetector.updateTimestamp(uri, updatedMeta.modifiedOn);
            }

            // Update cache
            this.fileCache.set(uri.toString(), content);

            // Fire change event
            this._emitter.fire([{
                type: vscode.FileChangeType.Changed,
                uri
            }]);

            vscode.window.showInformationMessage(
                `Saved ${ApicurioUriBuilder.getDisplayName(metadata.groupId, metadata.artifactId, metadata.version)}`
            );
        } catch (error: any) {
            const message = error.message || 'Unknown error';

            // Check if draft was published (state changed)
            if (message.includes('published version') || message.includes('405') || message.includes('400')) {
                const choice = await vscode.window.showErrorMessage(
                    `Draft "${ApicurioUriBuilder.getDisplayName(metadata.groupId, metadata.artifactId, metadata.version)}" has been published. Cannot save content to published versions.`,
                    { modal: true },
                    'Create New Draft',
                    'Discard Changes',
                    'Cancel'
                );

                if (choice === 'Create New Draft') {
                    // TODO: Could automatically create a new draft version
                    vscode.window.showInformationMessage('Please create a new draft version manually to continue editing.');
                    return;
                } else if (choice === 'Discard Changes') {
                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    return;
                }
                throw vscode.FileSystemError.NoPermissions('Draft was published - cannot save');
            }

            // Other errors
            vscode.window.showErrorMessage(`Failed to save: ${message}`);
            throw vscode.FileSystemError.Unavailable(message);
        }
    }

    delete(uri: vscode.Uri): void {
        this.fileCache.delete(uri.toString());
    }

    rename(): void {
        throw new Error('rename not supported');
    }
}
