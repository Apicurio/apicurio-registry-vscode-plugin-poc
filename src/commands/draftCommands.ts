import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryItem } from '../models/registryModels';

export async function createDraftVersionCommand(
    registryService: RegistryService,
    refresh: () => void,
    artifactNode: RegistryItem
): Promise<void> {
    const groupId = artifactNode.groupId;
    const artifactId = artifactNode.id;

    if (!groupId || !artifactId) {
        vscode.window.showErrorMessage('Cannot create draft: missing group or artifact ID');
        return;
    }

    // Get latest version content to use as template
    let latestContent: string = '';
    let contentType: string = 'application/json';

    try {
        const versions = await registryService.getVersions(groupId, artifactId);
        if (versions.length > 0) {
            // Get the latest version's content
            const latestVersion = versions[0].version || 'latest';
            const content = await registryService.getArtifactContent(groupId, artifactId, latestVersion);
            latestContent = content.content;
            contentType = content.contentType;
        }
    } catch (error) {
        console.warn('Could not fetch latest version content:', error);
        // Continue with empty content
    }

    // Prompt for version name (optional)
    const versionName = await vscode.window.showInputBox({
        prompt: 'Enter version number (optional, leave empty for auto-generated)',
        placeHolder: '1.0.1, v2, etc.',
        ignoreFocusOut: true
    });

    if (versionName === undefined) {
        return; // User cancelled
    }

    // Prompt for version description
    const description = await vscode.window.showInputBox({
        prompt: 'Enter version description (optional)',
        placeHolder: 'Draft version for review',
        ignoreFocusOut: true
    });

    if (description === undefined) {
        return; // User cancelled
    }

    // Create the draft version
    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Creating draft version for ${artifactId}...`,
                cancellable: false
            },
            async () => {
                await registryService.createDraftVersion(groupId, artifactId, {
                    version: versionName || undefined,
                    content: {
                        content: latestContent,
                        contentType: contentType
                    },
                    description: description || undefined,
                    isDraft: true
                });
            }
        );

        vscode.window.showInformationMessage(
            `Draft version created for artifact "${artifactId}"`
        );
        refresh();
    } catch (error: any) {
        vscode.window.showErrorMessage(
            `Failed to create draft version: ${error.message}`
        );
    }
}

export async function finalizeDraftCommand(
    registryService: RegistryService,
    refresh: () => void,
    versionNode: RegistryItem
): Promise<void> {
    const groupId = versionNode.groupId;
    const artifactId = versionNode.parentId;
    const version = versionNode.id;

    if (!groupId || !artifactId || !version) {
        vscode.window.showErrorMessage('Cannot finalize draft: missing version information');
        return;
    }

    // Confirm finalization
    const confirmed = await vscode.window.showWarningMessage(
        `Finalize draft version "${version}"?\n\nThis will make the version immutable and apply validation rules.`,
        { modal: true },
        'Finalize'
    );

    if (!confirmed) {
        return;
    }

    // Select target state
    const targetState = await vscode.window.showQuickPick(
        [
            {
                label: 'Enabled',
                value: 'ENABLED',
                description: 'Active and available for use',
                picked: true
            },
            {
                label: 'Disabled',
                value: 'DISABLED',
                description: 'Inactive but preserved'
            },
            {
                label: 'Deprecated',
                value: 'DEPRECATED',
                description: 'Marked as deprecated'
            }
        ],
        {
            title: 'Select target state for finalized version',
            placeHolder: 'Choose the state for the published version'
        }
    );

    if (!targetState) {
        return;
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Finalizing draft "${version}"...`,
                cancellable: false
            },
            async () => {
                await registryService.finalizeDraftVersion(
                    groupId,
                    artifactId,
                    version,
                    targetState.value as any
                );
            }
        );

        vscode.window.showInformationMessage(
            `Draft version "${version}" finalized successfully`
        );
        refresh();
    } catch (error: any) {
        vscode.window.showErrorMessage(
            `Failed to finalize draft: ${error.message}`
        );
    }
}

export async function discardDraftCommand(
    registryService: RegistryService,
    refresh: () => void,
    versionNode: RegistryItem
): Promise<void> {
    const groupId = versionNode.groupId;
    const artifactId = versionNode.parentId;
    const version = versionNode.id;

    if (!groupId || !artifactId || !version) {
        vscode.window.showErrorMessage('Cannot discard draft: missing version information');
        return;
    }

    // Confirm deletion
    const confirmed = await vscode.window.showWarningMessage(
        `Discard draft version "${version}"?\n\nThis action cannot be undone.`,
        { modal: true },
        'Discard'
    );

    if (!confirmed) {
        return;
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Discarding draft "${version}"...`,
                cancellable: false
            },
            async () => {
                await registryService.discardDraftVersion(groupId, artifactId, version);
            }
        );

        vscode.window.showInformationMessage(
            `Draft version "${version}" discarded successfully`
        );
        refresh();
    } catch (error: any) {
        vscode.window.showErrorMessage(
            `Failed to discard draft: ${error.message}`
        );
    }
}

export async function editDraftMetadataCommand(
    registryService: RegistryService,
    refresh: () => void,
    versionNode: RegistryItem
): Promise<void> {
    const groupId = versionNode.groupId;
    const artifactId = versionNode.parentId;
    const version = versionNode.id;

    if (!groupId || !artifactId || !version) {
        vscode.window.showErrorMessage('Cannot edit metadata: missing version information');
        return;
    }

    // Get current metadata
    const currentName = versionNode.metadata?.name || '';
    const currentDescription = versionNode.metadata?.description || '';

    // Prompt for name
    const name = await vscode.window.showInputBox({
        title: 'Edit Draft Metadata - Name',
        prompt: 'Enter version name (optional)',
        value: currentName,
        placeHolder: 'Version name'
    });

    if (name === undefined) {
        return; // User cancelled
    }

    // Prompt for description
    const description = await vscode.window.showInputBox({
        title: 'Edit Draft Metadata - Description',
        prompt: 'Enter version description (optional)',
        value: currentDescription,
        placeHolder: 'Version description'
    });

    if (description === undefined) {
        return; // User cancelled
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Updating draft metadata...`,
                cancellable: false
            },
            async () => {
                await registryService.updateDraftMetadata(groupId, artifactId, version, {
                    name: name || undefined,
                    description: description || undefined
                });
            }
        );

        vscode.window.showInformationMessage(
            `Draft metadata updated successfully`
        );
        refresh();
    } catch (error: any) {
        vscode.window.showErrorMessage(
            `Failed to update metadata: ${error.message}`
        );
    }
}
