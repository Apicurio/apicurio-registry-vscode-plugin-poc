import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { ApicurioUriBuilder } from '../utils/uriBuilder';

/**
 * File System Provider for Apicurio Registry artifacts.
 * Enables reading and writing artifact content directly in VSCode.
 *
 * - Draft versions: Content is editable and can be saved back to registry
 * - Published versions: Content is read-only
 */
export class ApicurioFileSystemProvider implements vscode.FileSystemProvider {
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile = this._emitter.event;

    // In-memory cache of file contents
    private fileCache = new Map<string, Uint8Array>();

    constructor(private registryService: RegistryService) {}

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
            return data;
        } catch (error: any) {
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

        try {
            // Save to registry
            await this.registryService.updateDraftContent(
                metadata.groupId,
                metadata.artifactId,
                metadata.version,
                content.toString()
            );

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
