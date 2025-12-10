import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryTreeDataProvider } from '../providers/registryTreeProvider';
import { RegistryItem, Role } from '../models/registryModels';

/**
 * Command to create a new role mapping
 */
export async function createRoleMappingCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    try {
        // Step 1: Prompt for principal ID
        const principalId = await vscode.window.showInputBox({
            title: 'Create Role Mapping - Step 1/4: Enter Principal ID',
            prompt: 'Enter the principal ID (email, username, or service account)',
            placeHolder: 'e.g., user@example.com, service-account-name',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Principal ID cannot be empty';
                }
                return null;
            },
            ignoreFocusOut: true
        });

        if (!principalId) {
            return; // User cancelled
        }

        // Step 2: Select role
        const roleItems = [
            {
                label: 'Admin',
                description: 'Full access to all registry operations',
                value: Role.ADMIN
            },
            {
                label: 'Developer',
                description: 'Read/write access to artifacts and versions',
                value: Role.DEVELOPER
            },
            {
                label: 'Read-Only',
                description: 'Read-only access to registry',
                value: Role.READ_ONLY
            }
        ];

        const selectedRole = await vscode.window.showQuickPick(roleItems, {
            title: 'Create Role Mapping - Step 2/4: Select Role',
            placeHolder: 'Choose the role to assign',
            ignoreFocusOut: true
        });

        if (!selectedRole) {
            return; // User cancelled
        }

        // Step 3: Prompt for principal name (optional)
        const principalName = await vscode.window.showInputBox({
            title: 'Create Role Mapping - Step 3/4: Principal Name (optional)',
            prompt: 'Enter a display name for this principal',
            placeHolder: 'e.g., John Doe',
            ignoreFocusOut: true
        });

        if (principalName === undefined) {
            return; // User cancelled
        }

        // Step 4: Confirm creation
        const summary = [
            `Principal: ${principalId}`,
            `Role: ${selectedRole.label}`,
            principalName ? `Name: ${principalName}` : null
        ].filter(Boolean).join('\n');

        const confirmation = await vscode.window.showQuickPick(
            [
                { label: 'Yes', value: true },
                { label: 'No', value: false }
            ],
            {
                title: 'Create Role Mapping - Step 4/4: Confirm',
                placeHolder: `Create role mapping with the following details?\n\n${summary}`,
                ignoreFocusOut: true
            }
        );

        if (!confirmation || !confirmation.value) {
            return;
        }

        // Create the role mapping
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Creating role mapping for "${principalId}"...`,
                cancellable: false
            },
            async (progress) => {
                progress.report({ message: 'Creating role mapping' });

                await registryService.createRoleMapping(
                    principalId,
                    selectedRole.value,
                    principalName && principalName.trim().length > 0 ? principalName : undefined
                );

                progress.report({ message: 'Refreshing tree view' });
            }
        );

        // Refresh the tree and show success message
        treeProvider.refresh();
        vscode.window.showInformationMessage(
            `Role mapping created: ${principalId} → ${selectedRole.label}`
        );
    } catch (error: any) {
        if (error.response?.status === 409) {
            vscode.window.showErrorMessage(
                `Role mapping already exists for this principal.`
            );
        } else if (error.response?.status === 403) {
            vscode.window.showErrorMessage(
                `You don't have permission to create role mappings. Admin role required.`
            );
        } else {
            vscode.window.showErrorMessage(
                `Failed to create role mapping: ${error.message || error}`
            );
        }
    }
}

/**
 * Command to update an existing role mapping
 */
export async function updateRoleMappingCommand(
    node: RegistryItem,
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    try {
        const principalId = node.metadata?.principalId;
        const currentRole = node.metadata?.role;

        if (!principalId) {
            vscode.window.showErrorMessage('No principal ID available');
            return;
        }

        // Step 1: Select new role
        const roleItems = [
            {
                label: 'Admin',
                description: currentRole === Role.ADMIN ? '(Current)' : 'Full access to all registry operations',
                value: Role.ADMIN
            },
            {
                label: 'Developer',
                description: currentRole === Role.DEVELOPER ? '(Current)' : 'Read/write access to artifacts and versions',
                value: Role.DEVELOPER
            },
            {
                label: 'Read-Only',
                description: currentRole === Role.READ_ONLY ? '(Current)' : 'Read-only access to registry',
                value: Role.READ_ONLY
            }
        ];

        const selectedRole = await vscode.window.showQuickPick(roleItems, {
            title: `Update Role for ${principalId}`,
            placeHolder: `Current role: ${currentRole}. Select new role:`,
            ignoreFocusOut: true
        });

        if (!selectedRole) {
            return; // User cancelled
        }

        // Step 2: Confirm update
        const confirmation = await vscode.window.showQuickPick(
            [
                { label: 'Yes', value: true },
                { label: 'No', value: false }
            ],
            {
                title: 'Confirm Role Update',
                placeHolder: `Change role from ${currentRole} to ${selectedRole.label}?`,
                ignoreFocusOut: true
            }
        );

        if (!confirmation || !confirmation.value) {
            return;
        }

        // Update the role mapping
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Updating role for "${principalId}"...`,
                cancellable: false
            },
            async (progress) => {
                progress.report({ message: 'Updating role mapping' });

                await registryService.updateRoleMapping(principalId, selectedRole.value);

                progress.report({ message: 'Refreshing tree view' });
            }
        );

        // Refresh the tree and show success message
        treeProvider.refresh();
        vscode.window.showInformationMessage(
            `Role updated: ${principalId} → ${selectedRole.label}`
        );
    } catch (error: any) {
        if (error.response?.status === 404) {
            vscode.window.showErrorMessage(
                `Role mapping not found for this principal.`
            );
        } else if (error.response?.status === 403) {
            vscode.window.showErrorMessage(
                `You don't have permission to update role mappings. Admin role required.`
            );
        } else {
            vscode.window.showErrorMessage(
                `Failed to update role mapping: ${error.message || error}`
            );
        }
    }
}

/**
 * Command to delete a role mapping
 */
export async function deleteRoleMappingCommand(
    node: RegistryItem,
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    try {
        const principalId = node.metadata?.principalId;
        const role = node.metadata?.role;

        if (!principalId) {
            vscode.window.showErrorMessage('No principal ID available');
            return;
        }

        // Confirm deletion
        const confirmation = await vscode.window.showWarningMessage(
            `Delete role mapping for "${principalId}"?`,
            { modal: true, detail: `This will remove the ${role} role from this principal.` },
            'Delete'
        );

        if (confirmation !== 'Delete') {
            return; // User cancelled
        }

        // Delete the role mapping
        await registryService.deleteRoleMapping(principalId);

        // Refresh the tree and show success message
        treeProvider.refresh();
        vscode.window.showInformationMessage(
            `Role mapping deleted for ${principalId}`
        );
    } catch (error: any) {
        if (error.response?.status === 404) {
            vscode.window.showErrorMessage(
                `Role mapping not found for "${node.metadata?.principalId}".`
            );
        } else if (error.response?.status === 403) {
            vscode.window.showErrorMessage(
                `You don't have permission to delete role mappings. Admin role required.`
            );
        } else {
            vscode.window.showErrorMessage(
                `Failed to delete role mapping: ${error.message || error}`
            );
        }
    }
}

/**
 * Command to view the current user's role
 */
export async function viewCurrentUserRoleCommand(
    registryService: RegistryService
): Promise<void> {
    try {
        const roleMapping = await registryService.getCurrentUserRole();

        if (!roleMapping) {
            vscode.window.showWarningMessage(
                'You currently have no role assigned in this registry.'
            );
            return;
        }

        const roleDescriptions = {
            [Role.ADMIN]: 'Full access to all registry operations',
            [Role.DEVELOPER]: 'Read/write access to artifacts and versions',
            [Role.READ_ONLY]: 'Read-only access to registry'
        };

        const message = [
            `Your Role: ${roleMapping.role}`,
            `Principal: ${roleMapping.principalId}`,
            roleMapping.principalName ? `Name: ${roleMapping.principalName}` : null,
            '',
            `Permissions: ${roleDescriptions[roleMapping.role]}`
        ].filter(Boolean).join('\n');

        vscode.window.showInformationMessage(message, { modal: false });
    } catch (error: any) {
        vscode.window.showErrorMessage(
            `Failed to retrieve your role: ${error.message || error}`
        );
    }
}
