import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryItem } from '../models/registryModels';

export async function deleteGroupCommand(
    registryService: RegistryService,
    refresh: () => void,
    groupNode: RegistryItem
): Promise<void> {
    // Validate required fields
    const groupId = groupNode.groupId;
    if (!groupId) {
        vscode.window.showErrorMessage('Cannot delete group: missing group ID');
        return;
    }

    // Get group details
    const artifactCount = groupNode.metadata?.artifactCount || 0;

    // Show confirmation dialog
    const message = `Delete group "${groupId}"?\n\nThis will delete ${artifactCount} artifact(s) and all their versions. This action cannot be undone.`;
    const confirm = await vscode.window.showWarningMessage(
        message,
        { modal: true },
        'Delete'
    );

    if (confirm !== 'Delete') {
        return;
    }

    // Delete via API
    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Deleting group ${groupId}...`,
                cancellable: false
            },
            async () => {
                await registryService.deleteGroup(groupId);
            }
        );

        vscode.window.showInformationMessage(`Group "${groupId}" deleted successfully`);
        refresh();
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to delete group: ${error.message}`);
    }
}

export async function deleteArtifactCommand(
    registryService: RegistryService,
    refresh: () => void,
    artifactNode: RegistryItem
): Promise<void> {
    // Validate required fields
    const groupId = artifactNode.groupId;
    const artifactId = artifactNode.id;

    if (!groupId || !artifactId) {
        vscode.window.showErrorMessage('Cannot delete artifact: missing group or artifact ID');
        return;
    }

    // Get version count
    let versionCount = 0;
    try {
        const versions = await registryService.getVersions(groupId, artifactId);
        versionCount = versions.length;
    } catch (error) {
        // Continue even if can't get count
    }

    // Show confirmation
    const message = `Delete artifact "${artifactId}"?\n\nThis will delete ${versionCount} version(s). This action cannot be undone.`;
    const confirm = await vscode.window.showWarningMessage(
        message,
        { modal: true },
        'Delete'
    );

    if (confirm !== 'Delete') {
        return;
    }

    // Delete
    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Deleting artifact ${artifactId}...`,
                cancellable: false
            },
            async () => {
                await registryService.deleteArtifact(groupId, artifactId);
            }
        );

        vscode.window.showInformationMessage(`Artifact "${artifactId}" deleted successfully`);
        refresh();
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to delete artifact: ${error.message}`);
    }
}

export async function deleteVersionCommand(
    registryService: RegistryService,
    refresh: () => void,
    versionNode: RegistryItem
): Promise<void> {
    // Validate required fields
    const groupId = versionNode.groupId;
    const artifactId = versionNode.parentId;
    const version = versionNode.id;

    if (!groupId || !artifactId || !version) {
        vscode.window.showErrorMessage('Cannot delete version: missing group, artifact, or version ID');
        return;
    }

    // Check if it's the last version
    let isLastVersion = false;
    try {
        const versions = await registryService.getVersions(groupId, artifactId);
        isLastVersion = versions.length === 1;
    } catch (error) {
        // Continue - if we can't check, let the API decide
    }

    if (isLastVersion) {
        const message = `Cannot delete version "${version}".\n\nThis is the last version of the artifact. Delete the entire artifact instead.`;
        vscode.window.showWarningMessage(message);
        return;
    }

    // Show confirmation
    const message = `Delete version "${version}" of artifact "${artifactId}"?\n\nThis action cannot be undone.`;
    const confirm = await vscode.window.showWarningMessage(
        message,
        { modal: true },
        'Delete'
    );

    if (confirm !== 'Delete') {
        return;
    }

    // Delete
    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Deleting version ${version}...`,
                cancellable: false
            },
            async () => {
                await registryService.deleteVersion(groupId, artifactId, version);
            }
        );

        vscode.window.showInformationMessage(`Version "${version}" deleted successfully`);
        refresh();
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to delete version: ${error.message}`);
    }
}
