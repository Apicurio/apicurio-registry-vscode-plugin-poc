import * as vscode from 'vscode';
import { RegistryItem, RegistryItemType } from '../models/registryModels';

/**
 * Copy group ID to clipboard
 */
export async function copyGroupIdCommand(node: RegistryItem): Promise<void> {
    if (!node.id) {
        vscode.window.showErrorMessage('No group ID available');
        return;
    }

    await vscode.env.clipboard.writeText(node.id);
    vscode.window.showInformationMessage(`Copied group ID: ${node.id}`);
}

/**
 * Copy artifact ID to clipboard
 */
export async function copyArtifactIdCommand(node: RegistryItem): Promise<void> {
    if (!node.id) {
        vscode.window.showErrorMessage('No artifact ID available');
        return;
    }

    await vscode.env.clipboard.writeText(node.id);
    vscode.window.showInformationMessage(`Copied artifact ID: ${node.id}`);
}

/**
 * Copy version to clipboard
 */
export async function copyVersionCommand(node: RegistryItem): Promise<void> {
    if (!node.id) {
        vscode.window.showErrorMessage('No version available');
        return;
    }

    await vscode.env.clipboard.writeText(node.id);
    vscode.window.showInformationMessage(`Copied version: ${node.id}`);
}

/**
 * Copy full reference (group:artifact or group:artifact:version) to clipboard
 */
export async function copyFullReferenceCommand(node: RegistryItem): Promise<void> {
    // For artifacts: group:artifact
    if (node.type === RegistryItemType.Artifact) {
        const groupId = node.parentId;
        const artifactId = node.id;

        if (!groupId || !artifactId) {
            vscode.window.showErrorMessage('Missing required information for full reference');
            return;
        }

        const reference = `${groupId}:${artifactId}`;
        await vscode.env.clipboard.writeText(reference);
        vscode.window.showInformationMessage(`Copied reference: ${reference}`);
        return;
    }

    // For versions: group:artifact:version
    if (node.type === RegistryItemType.Version) {
        const groupId = node.groupId;
        const artifactId = node.parentId;
        const version = node.id;

        if (!groupId || !artifactId || !version) {
            vscode.window.showErrorMessage('Missing required information for full reference');
            return;
        }

        const reference = `${groupId}:${artifactId}:${version}`;
        await vscode.env.clipboard.writeText(reference);
        vscode.window.showInformationMessage(`Copied reference: ${reference}`);
        return;
    }

    vscode.window.showErrorMessage('Can only copy full reference for artifacts and versions');
}
