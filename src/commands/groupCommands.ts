import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryTreeDataProvider } from '../providers/registryTreeProvider';
import { RegistryItem } from '../models/registryModels';

/**
 * Command to create a new group in the registry
 */
export async function createGroupCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    try {
        // Step 1: Prompt for group ID
        const groupId = await vscode.window.showInputBox({
            title: 'Create Group - Step 1/4: Enter Group ID',
            prompt: 'Enter a unique group identifier',
            placeHolder: 'e.g., api-schemas, events, services',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Group ID cannot be empty';
                }
                if (!/^[a-z0-9._-]+$/i.test(value)) {
                    return 'Group ID can only contain letters, numbers, dots, dashes, and underscores';
                }
                if (value.length > 512) {
                    return 'Group ID is too long (max 512 characters)';
                }
                return null;
            },
            ignoreFocusOut: true
        });

        if (!groupId) {
            return; // User cancelled
        }

        // Step 2: Prompt for description (optional)
        const description = await vscode.window.showInputBox({
            title: 'Create Group - Step 2/4: Description (optional)',
            prompt: 'Enter a description for this group',
            placeHolder: 'e.g., REST API schema definitions',
            ignoreFocusOut: true
        });

        if (description === undefined) {
            return; // User cancelled
        }

        // Step 3: Add labels (optional)
        const labels = await collectLabels();
        if (labels === null) {
            return; // User cancelled
        }

        // Step 4: Confirm creation
        const confirmed = await confirmGroupCreation(groupId, description, labels);
        if (!confirmed) {
            return;
        }

        // Create the group
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Creating group "${groupId}"...`,
                cancellable: false
            },
            async (progress) => {
                progress.report({ message: 'Validating metadata' });

                const metadata: any = {};
                if (description && description.trim().length > 0) {
                    metadata.description = description;
                }
                if (labels && Object.keys(labels).length > 0) {
                    metadata.labels = labels;
                }

                progress.report({ message: 'Creating group in registry' });

                await registryService.createGroup(groupId, metadata);

                progress.report({ message: 'Group created successfully' });
            }
        );

        // Refresh tree view
        treeProvider.refresh();

        // Show success message
        vscode.window.showInformationMessage(
            `Group "${groupId}" created successfully`
        );

    } catch (error: any) {
        // Handle 409 Conflict error (group already exists)
        if (error.response?.status === 409) {
            vscode.window.showErrorMessage(
                `Group already exists. Please choose a different group ID.`
            );
        } else {
            vscode.window.showErrorMessage(
                `Failed to create group: ${error.message || String(error)}`
            );
        }
    }
}

/**
 * Collect labels from user (reused pattern from metadata editor)
 */
async function collectLabels(): Promise<Record<string, string> | null> {
    const labels: Record<string, string> = {};

    while (true) {
        const currentLabelsText = Object.keys(labels).length === 0
            ? '(none)'
            : Object.entries(labels).map(([k, v]) => `  ${k}=${v}`).join('\n');

        const action = await vscode.window.showQuickPick(
            [
                {
                    label: '$(add) Add label',
                    value: 'add'
                },
                {
                    label: '$(arrow-right) Continue',
                    value: 'continue',
                    description: Object.keys(labels).length > 0
                        ? `${Object.keys(labels).length} label(s) added`
                        : 'Skip adding labels'
                }
            ],
            {
                title: 'Create Group - Step 3/4: Add Labels (optional)',
                placeHolder: `Current labels:\n${currentLabelsText}`,
                ignoreFocusOut: true
            }
        );

        if (!action || action.value === 'continue') {
            return labels;
        }

        if (action.value === 'add') {
            const labelInput = await vscode.window.showInputBox({
                title: 'Add Label',
                prompt: 'Enter label in key=value format',
                placeHolder: 'e.g., env=production, team=platform',
                validateInput: (value) => {
                    if (!value || !value.includes('=')) {
                        return 'Label must be in format: key=value';
                    }
                    const [key] = value.split('=');
                    if (!key || key.trim().length === 0) {
                        return 'Label key cannot be empty';
                    }
                    return null;
                },
                ignoreFocusOut: true
            });

            if (!labelInput) {
                continue; // User cancelled label input, show menu again
            }

            const [key, ...valueParts] = labelInput.split('=');
            const value = valueParts.join('='); // Handle values with = in them
            labels[key.trim()] = value.trim();
        }
    }
}

/**
 * Show confirmation dialog for group creation
 */
async function confirmGroupCreation(
    groupId: string,
    description: string | undefined,
    labels: Record<string, string>
): Promise<boolean> {
    const labelsText = labels && Object.keys(labels).length > 0
        ? Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(', ')
        : '(none)';

    const items = [
        `Group ID:     ${groupId}`,
        description && description.trim() ? `Description:  ${description}` : null,
        `Labels:       ${labelsText}`,
        '',
        'Create this group?'
    ].filter(Boolean);

    const result = await vscode.window.showQuickPick(
        [
            {
                label: '$(check) Create Group',
                value: true
            },
            {
                label: '$(x) Cancel',
                value: false
            }
        ],
        {
            title: 'Create Group - Step 4/4: Confirm',
            placeHolder: items.join('\n'),
            ignoreFocusOut: true
        }
    );

    return result?.value === true;
}

/**
 * Command to delete a group from the registry
 */
export async function deleteGroupCommand(
    registryService: RegistryService,
    refresh: () => void,
    groupNode: RegistryItem
): Promise<void> {
    const groupId = groupNode.id;

    if (!groupId) {
        vscode.window.showErrorMessage('Cannot delete group: missing group ID');
        return;
    }

    const artifactCount = groupNode.metadata?.artifactCount || 0;

    // Show warning dialog with artifact count
    let warningMessage: string;
    if (artifactCount > 0) {
        warningMessage = `⚠️  Warning: This action cannot be undone\n\n` +
            `Group "${groupId}" contains ${artifactCount} artifact${artifactCount > 1 ? 's' : ''}.\n` +
            `Deleting the group will also delete all artifacts.\n\n` +
            `Are you sure you want to delete this group?`;
    } else {
        warningMessage = `Delete group "${groupId}"?\n\n` +
            `This action cannot be undone.`;
    }

    const confirmed = await vscode.window.showWarningMessage(
        warningMessage,
        { modal: true },
        artifactCount > 0 ? 'Delete Group' : 'Delete'
    );

    if (!confirmed) {
        return;
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Deleting group "${groupId}"...`,
                cancellable: false
            },
            async () => {
                await registryService.deleteGroup(groupId);
            }
        );

        vscode.window.showInformationMessage(
            `Group "${groupId}" deleted successfully`
        );
        refresh();
    } catch (error: any) {
        // Handle 404 error (group not found)
        if (error.response?.status === 404) {
            vscode.window.showErrorMessage(
                `Group "${groupId}" not found. It may have already been deleted.`
            );
        } else {
            vscode.window.showErrorMessage(
                `Failed to delete group: ${error.message || String(error)}`
            );
        }
    }
}
