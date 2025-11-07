import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryItem } from '../models/registryModels';

/**
 * Create a new branch for an artifact
 */
export async function createBranchCommand(
    registryService: RegistryService,
    refresh: () => void,
    node: RegistryItem
): Promise<void> {
    try {
        const groupId = node.parentId;
        const artifactId = node.id;

        if (!groupId || !artifactId) {
            vscode.window.showErrorMessage('Invalid artifact node');
            return;
        }

        // Step 1: Get branch ID
        const branchId = await vscode.window.showInputBox({
            title: 'Create Branch - Step 1/3: Enter Branch ID',
            prompt: 'Enter a unique branch identifier',
            placeHolder: 'e.g., develop, release, v1.x, v2.x',
            validateInput: (value) => {
                if (!value) {
                    return 'Branch ID is required';
                }
                // Validate format: alphanumeric, dots, dashes, underscores
                if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
                    return 'Branch ID can only contain letters, numbers, dots, dashes, and underscores';
                }
                if (value.length > 256) {
                    return 'Branch ID must be 256 characters or less';
                }
                return null;
            }
        });

        if (!branchId) {
            return; // User cancelled
        }

        // Step 2: Get description (optional)
        const description = await vscode.window.showInputBox({
            title: 'Create Branch - Step 2/3: Description (optional)',
            prompt: 'Enter a description for this branch',
            placeHolder: 'e.g., Development branch, Version 1.x maintenance'
        });

        if (description === undefined) {
            return; // User cancelled
        }

        // Step 3: Confirmation
        const confirmationItems = [
            {
                label: '$(check) Create Branch',
                description: 'Create the branch'
            },
            {
                label: '$(x) Cancel',
                description: 'Cancel branch creation'
            }
        ];

        const confirmationMessage = description
            ? `Branch ID: ${branchId}\nDescription: ${description}\nArtifact: ${artifactId}`
            : `Branch ID: ${branchId}\nArtifact: ${artifactId}`;

        const confirmation = await vscode.window.showQuickPick(confirmationItems, {
            title: 'Create Branch - Step 3/3: Confirm',
            placeHolder: confirmationMessage,
            ignoreFocusOut: true
        });

        if (!confirmation || confirmation.label.includes('Cancel')) {
            return;
        }

        // Create the branch
        await registryService.createBranch(
            groupId,
            artifactId,
            branchId,
            description || undefined
        );

        refresh();
        vscode.window.showInformationMessage(`Branch '${branchId}' created successfully`);

    } catch (error: any) {
        vscode.window.showErrorMessage(error.message || `Failed to create branch: ${error}`);
    }
}

/**
 * Edit branch metadata (description)
 */
export async function editBranchMetadataCommand(
    registryService: RegistryService,
    refresh: () => void,
    node: RegistryItem
): Promise<void> {
    try {
        const groupId = node.groupId;
        const artifactId = node.parentId;
        const branchId = node.id;

        if (!groupId || !artifactId || !branchId) {
            vscode.window.showErrorMessage('Invalid branch node');
            return;
        }

        const currentDescription = node.metadata?.description || '';

        const newDescription = await vscode.window.showInputBox({
            title: `Edit Branch Metadata: ${branchId}`,
            prompt: 'Enter new description',
            value: currentDescription,
            placeHolder: 'Branch description'
        });

        if (newDescription === undefined) {
            return; // User cancelled
        }

        await registryService.updateBranchMetadata(
            groupId,
            artifactId,
            branchId,
            { description: newDescription }
        );

        refresh();
        vscode.window.showInformationMessage(`Branch '${branchId}' metadata updated`);

    } catch (error: any) {
        vscode.window.showErrorMessage(error.message || `Failed to update branch metadata: ${error}`);
    }
}

/**
 * Add version(s) to a branch
 */
export async function addVersionToBranchCommand(
    registryService: RegistryService,
    refresh: () => void,
    node: RegistryItem
): Promise<void> {
    try {
        const groupId = node.groupId;
        const artifactId = node.parentId;
        const branchId = node.id;

        if (!groupId || !artifactId || !branchId) {
            vscode.window.showErrorMessage('Invalid branch node');
            return;
        }

        // Get all versions for the artifact
        const allVersions = await registryService.getVersions(groupId, artifactId);

        // Get versions already in this branch
        const branchVersions = await registryService.getBranchVersions(groupId, artifactId, branchId);
        const branchVersionIds = new Set(branchVersions.map(v => v.version));

        // Filter out versions already in branch
        const availableVersions = allVersions.filter(v => !branchVersionIds.has(v.version));

        if (availableVersions.length === 0) {
            vscode.window.showInformationMessage(`All versions are already in branch '${branchId}'`);
            return;
        }

        // Show multi-select quick pick
        const items = availableVersions.map(version => ({
            label: version.version || 'unknown',
            description: version.state || '',
            picked: false
        }));

        const selected = await vscode.window.showQuickPick(items, {
            title: `Add Versions to Branch: ${branchId}`,
            placeHolder: 'Select versions to add (use space to select multiple)',
            canPickMany: true,
            ignoreFocusOut: true
        });

        if (!selected || selected.length === 0) {
            return; // User cancelled or no selection
        }

        // Add each selected version to the branch
        for (const item of selected) {
            await registryService.addVersionToBranch(
                groupId,
                artifactId,
                branchId,
                item.label
            );
        }

        refresh();
        vscode.window.showInformationMessage(
            `Added ${selected.length} version(s) to branch '${branchId}'`
        );

    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to add versions: ${error.message || error}`);
    }
}

/**
 * Delete a branch
 */
export async function deleteBranchCommand(
    registryService: RegistryService,
    refresh: () => void,
    node: RegistryItem
): Promise<void> {
    try {
        const groupId = node.groupId;
        const artifactId = node.parentId;
        const branchId = node.id;

        if (!groupId || !artifactId || !branchId) {
            vscode.window.showErrorMessage('Invalid branch node');
            return;
        }

        // Prevent deletion of system-defined branches
        if (node.metadata?.systemDefined) {
            vscode.window.showErrorMessage(`Cannot delete system-defined branch '${branchId}'`);
            return;
        }

        // Confirmation dialog
        const confirmation = await vscode.window.showWarningMessage(
            `Delete branch '${branchId}'?\n\nThis will remove the branch but versions will remain in the artifact.\nThis action cannot be undone.`,
            { modal: true },
            'Delete'
        );

        if (confirmation !== 'Delete') {
            return;
        }

        await registryService.deleteBranch(groupId, artifactId, branchId);

        refresh();
        vscode.window.showInformationMessage(`Branch '${branchId}' deleted successfully`);

    } catch (error: any) {
        vscode.window.showErrorMessage(error.message || `Failed to delete branch: ${error}`);
    }
}
