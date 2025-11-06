import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryItem, RegistryItemType } from '../models/registryModels';
import {
    parseLabelInput,
    validateLabelInput,
    isDuplicateLabelKey,
    formatLabelsForDisplay,
    mergeLabels,
    removeLabel
} from '../utils/metadataUtils';

/**
 * Unified metadata editing command for groups, artifacts, and versions.
 * Handles name, description, and label management.
 *
 * @param registryService - Registry service for API calls
 * @param refresh - Function to refresh the tree view
 * @param node - The tree node to edit (group/artifact/version)
 */
export async function editMetadataCommand(
    registryService: RegistryService,
    refresh: () => void,
    node: RegistryItem
): Promise<void> {
    // Validate node
    if (!node || !node.id) {
        vscode.window.showErrorMessage('Invalid node: Missing ID');
        return;
    }

    try {
        // Determine entity type and delegate to specific handler
        switch (node.type) {
            case RegistryItemType.Group:
                await editGroupMetadata(registryService, refresh, node);
                break;

            case RegistryItemType.Artifact:
                await editArtifactMetadata(registryService, refresh, node);
                break;

            case RegistryItemType.Version:
                await editVersionMetadata(registryService, refresh, node);
                break;

            default:
                vscode.window.showErrorMessage(`Cannot edit metadata for ${node.type}`);
        }
    } catch (error) {
        console.error('Error editing metadata:', error);
        vscode.window.showErrorMessage(
            `Failed to update metadata: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Edit group metadata (description and labels).
 */
async function editGroupMetadata(
    registryService: RegistryService,
    refresh: () => void,
    node: RegistryItem
): Promise<void> {
    const groupId = node.id!;

    // Fetch current metadata
    const currentMetadata = await registryService.getGroupMetadataDetailed(groupId);
    let labels = currentMetadata.labels || {};
    let description = currentMetadata.description;

    // Show edit menu
    const action = await vscode.window.showQuickPick([
        { label: 'Edit Description', value: 'description' },
        { label: 'Manage Labels', value: 'labels' }
    ], {
        title: `Edit Group: ${groupId}`,
        placeHolder: 'Choose what to edit...'
    });

    if (!action) {
        return; // User cancelled
    }

    if (action.value === 'description') {
        // Edit description
        const newDescription = await vscode.window.showInputBox({
            title: 'Edit Group Description',
            prompt: 'Enter new description (leave empty to clear)',
            value: description || '',
            placeHolder: 'e.g., Production APIs'
        });

        if (newDescription === undefined) {
            return; // User cancelled
        }

        description = newDescription;
    } else if (action.value === 'labels') {
        // Manage labels
        labels = await manageLabels(labels);
    }

    // Update metadata
    await registryService.updateGroupMetadata(groupId, { description, labels });

    vscode.window.showInformationMessage(`Group ${groupId} metadata updated successfully`);
    refresh();
}

/**
 * Edit artifact metadata (name, description, and labels).
 */
async function editArtifactMetadata(
    registryService: RegistryService,
    refresh: () => void,
    node: RegistryItem
): Promise<void> {
    const groupId = node.groupId!;
    const artifactId = node.id!;

    // Fetch current metadata
    const currentMetadata = await registryService.getArtifactMetadataDetailed(groupId, artifactId);
    let name = currentMetadata.name;
    let description = currentMetadata.description;
    let labels = currentMetadata.labels || {};

    // Show edit menu
    const action = await vscode.window.showQuickPick([
        { label: 'Edit Name', value: 'name' },
        { label: 'Edit Description', value: 'description' },
        { label: 'Manage Labels', value: 'labels' }
    ], {
        title: `Edit Artifact: ${artifactId}`,
        placeHolder: 'Choose what to edit...'
    });

    if (!action) {
        return; // User cancelled
    }

    if (action.value === 'name') {
        // Edit name
        const newName = await vscode.window.showInputBox({
            title: 'Edit Artifact Name',
            prompt: 'Enter new name',
            value: name || '',
            placeHolder: 'e.g., User Management API'
        });

        if (newName === undefined) {
            return; // User cancelled
        }

        name = newName;
    } else if (action.value === 'description') {
        // Edit description
        const newDescription = await vscode.window.showInputBox({
            title: 'Edit Artifact Description',
            prompt: 'Enter new description (leave empty to clear)',
            value: description || '',
            placeHolder: 'e.g., API for managing user accounts'
        });

        if (newDescription === undefined) {
            return; // User cancelled
        }

        description = newDescription;
    } else if (action.value === 'labels') {
        // Manage labels
        labels = await manageLabels(labels);
    }

    // Update metadata
    await registryService.updateArtifactMetadata(groupId, artifactId, {
        name,
        description,
        labels
    });

    vscode.window.showInformationMessage(`Artifact ${artifactId} metadata updated successfully`);
    refresh();
}

/**
 * Edit version metadata (name, description, and labels).
 */
async function editVersionMetadata(
    registryService: RegistryService,
    refresh: () => void,
    node: RegistryItem
): Promise<void> {
    const groupId = node.groupId!;
    const artifactId = node.parentId!;
    const version = node.id!;

    // Fetch current metadata
    const currentMetadata = await registryService.getVersionMetadataDetailed(groupId, artifactId, version);
    let name = (currentMetadata as any).name; // SearchedVersion doesn't have name but API does
    let description = (currentMetadata as any).description;
    let labels = currentMetadata.labels || {};

    // Show edit menu
    const action = await vscode.window.showQuickPick([
        { label: 'Edit Name', value: 'name' },
        { label: 'Edit Description', value: 'description' },
        { label: 'Manage Labels', value: 'labels' }
    ], {
        title: `Edit Version: ${version}`,
        placeHolder: 'Choose what to edit...'
    });

    if (!action) {
        return; // User cancelled
    }

    if (action.value === 'name') {
        // Edit name
        const newName = await vscode.window.showInputBox({
            title: 'Edit Version Name',
            prompt: 'Enter new name',
            value: name || '',
            placeHolder: 'e.g., Version 1.0.0 - Stable'
        });

        if (newName === undefined) {
            return; // User cancelled
        }

        name = newName;
    } else if (action.value === 'description') {
        // Edit description
        const newDescription = await vscode.window.showInputBox({
            title: 'Edit Version Description',
            prompt: 'Enter new description (leave empty to clear)',
            value: description || '',
            placeHolder: 'e.g., First stable release'
        });

        if (newDescription === undefined) {
            return; // User cancelled
        }

        description = newDescription;
    } else if (action.value === 'labels') {
        // Manage labels
        labels = await manageLabels(labels);
    }

    // Update metadata
    await registryService.updateVersionMetadata(groupId, artifactId, version, {
        name,
        description,
        labels
    });

    vscode.window.showInformationMessage(`Version ${version} metadata updated successfully`);
    refresh();
}

/**
 * Manage labels workflow: add, edit, remove labels.
 * Returns updated labels object.
 */
async function manageLabels(currentLabels: Record<string, string>): Promise<Record<string, string>> {
    let labels = { ...currentLabels };

    while (true) {
        // Show current labels and actions
        const actions = [
            { label: 'Add Label', value: 'add', description: 'Add a new label' },
            { label: 'Remove Label', value: 'remove', description: 'Remove an existing label' },
            { label: vscode.QuickPickItemKind.Separator as any },
            { label: 'Done', value: 'done', description: formatLabelsForDisplay(labels) }
        ];

        const action = await vscode.window.showQuickPick(actions, {
            title: 'Manage Labels',
            placeHolder: Object.keys(labels).length > 0
                ? `Current labels: ${Object.keys(labels).length}`
                : 'No labels yet'
        });

        if (!action || action.value === 'done') {
            break;
        }

        if (action.value === 'add') {
            // Add new label
            const labelInput = await vscode.window.showInputBox({
                title: 'Add Label',
                prompt: 'Enter label in format: key=value',
                placeHolder: 'e.g., environment=production',
                validateInput: validateLabelInput
            });

            if (!labelInput) {
                continue; // User cancelled or invalid
            }

            const parsed = parseLabelInput(labelInput);
            if (!parsed) {
                vscode.window.showErrorMessage('Invalid label format. Use key=value');
                continue;
            }

            // Check for duplicate keys
            if (isDuplicateLabelKey(labels, parsed.key)) {
                vscode.window.showErrorMessage(`Label key "${parsed.key}" already exists. Remove it first to change the value.`);
                continue;
            }

            labels = mergeLabels(labels, { [parsed.key]: parsed.value });

        } else if (action.value === 'remove') {
            // Remove existing label
            if (Object.keys(labels).length === 0) {
                vscode.window.showInformationMessage('No labels to remove');
                continue;
            }

            const labelOptions = Object.entries(labels).map(([key, value]) => ({
                label: `${key}=${value}`,
                value: key
            }));

            const labelToRemove = await vscode.window.showQuickPick(labelOptions, {
                title: 'Remove Label',
                placeHolder: 'Select label to remove...'
            });

            if (!labelToRemove) {
                continue; // User cancelled
            }

            labels = removeLabel(labels, labelToRemove.value);
        }
    }

    return labels;
}
