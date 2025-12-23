import * as vscode from 'vscode';
import * as fs from 'fs';
import { RegistryService } from '../services/registryService';
import { RegistryItem } from '../models/registryModels';
import { CreateVersion } from '../models/registryModels';

/**
 * Increments the patch version of a semantic version string
 * Examples: 1.0.0 -> 1.0.1, 2.5.3 -> 2.5.4
 */
function incrementVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length === 3) {
        const patch = parseInt(parts[2], 10);
        if (!isNaN(patch)) {
            parts[2] = (patch + 1).toString();
            return parts.join('.');
        }
    }
    return version;
}

/**
 * Validates semantic version format
 */
function validateVersionFormat(value: string): string | undefined {
    if (!value || value.trim() === '') {
        return 'Version is required';
    }

    // Simple semver validation (major.minor.patch)
    const semverPattern = /^\d+\.\d+\.\d+$/;
    if (!semverPattern.test(value)) {
        return 'Invalid version format. Use semver (e.g., 1.0.0)';
    }

    return undefined;
}

/**
 * Gets the next suggested version by fetching existing versions
 * and incrementing the latest one
 */
async function getSuggestedVersion(
    registryService: RegistryService,
    groupId: string,
    artifactId: string
): Promise<string> {
    try {
        const versions = await registryService.getVersions(groupId, artifactId);

        if (versions.length === 0) {
            return '1.0.0';
        }

        // Get the first version (API returns sorted, latest first)
        const latestVersion = versions[0].version || '1.0.0';
        return incrementVersion(latestVersion);
    } catch (error) {
        console.error('Error fetching versions for suggestion:', error);
        return '1.0.0';
    }
}

export async function addVersionCommand(
    registryService: RegistryService,
    refresh: () => void,
    node: RegistryItem
): Promise<void> {
    try {
        // Validate node has required properties
        if (!node.groupId || !node.id) {
            vscode.window.showErrorMessage('Cannot add version: missing group or artifact ID');
            return;
        }

        const groupId = node.groupId;
        const artifactId = node.id;

        // Step 1: Get suggested version
        const suggestedVersion = await getSuggestedVersion(registryService, groupId, artifactId);

        // Step 2: Ask for version number
        const version = await vscode.window.showInputBox({
            prompt: 'Version number',
            placeHolder: 'e.g., 1.0.0',
            value: suggestedVersion,
            validateInput: validateVersionFormat
        });

        if (!version) {
            return; // User cancelled
        }

        // Step 3: Ask for optional name
        const name = await vscode.window.showInputBox({
            prompt: 'Version name (optional)',
            placeHolder: 'e.g., Initial Release'
        });

        // Step 4: Ask for optional description
        const description = await vscode.window.showInputBox({
            prompt: 'Description (optional)',
            placeHolder: 'e.g., Initial version with basic features'
        });

        // Step 5: Select file
        const fileUris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: 'Select File',
            filters: {
                'All files': ['*']
            }
        });

        if (!fileUris || fileUris.length === 0) {
            return; // User cancelled
        }

        const filePath = fileUris[0].fsPath;

        // Step 6: Read file content
        const content = fs.readFileSync(filePath, 'utf8');

        // Step 7: Create version with progress indicator
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Creating version...',
                cancellable: false
            },
            async () => {
                const createVersionData: CreateVersion = {
                    version,
                    content: {
                        content,
                        contentType: 'application/json'
                    }
                };

                // Add optional fields only if provided
                if (name) {
                    createVersionData.name = name;
                }
                if (description) {
                    createVersionData.description = description;
                }

                await registryService.createVersion(groupId, artifactId, createVersionData);
            }
        );

        // Refresh tree to show new version
        refresh();

        // Show success message
        vscode.window.showInformationMessage(`Version ${version} created successfully`);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to add version: ${error.message}`);
    }
}
