import * as vscode from 'vscode';
import { createArtifactCommand } from './createArtifactCommand';
import { createGroupCommand } from './groupCommands';
import { RegistryService } from '../services/registryService';
import { RegistryTreeDataProvider } from '../providers/registryTreeProvider';

/**
 * Unified create command that lets users choose between creating an artifact or a group
 */
export async function createCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    // Show QuickPick to choose what to create
    const choice = await vscode.window.showQuickPick(
        [
            {
                label: '$(file-code) Create Artifact',
                description: 'Create a new artifact (API schema, AsyncAPI, Protobuf, etc.)',
                value: 'artifact'
            },
            {
                label: '$(folder) Create Group',
                description: 'Create a new group to organize artifacts',
                value: 'group'
            }
        ],
        {
            title: 'Create',
            placeHolder: 'What would you like to create?',
            ignoreFocusOut: true
        }
    );

    if (!choice) {
        return; // User cancelled
    }

    // Call the appropriate command based on selection
    // Errors are handled by the underlying commands, so we don't need to catch them here
    if (choice.value === 'artifact') {
        await createArtifactCommand(registryService, treeProvider);
    } else if (choice.value === 'group') {
        await createGroupCommand(registryService, treeProvider);
    }
}
