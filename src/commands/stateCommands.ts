import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryItem } from '../models/registryModels';

interface StateOption {
    label: string;
    value: string;
}

const STATE_OPTIONS: StateOption[] = [
    { label: 'ENABLED', value: 'ENABLED' },
    { label: 'DISABLED', value: 'DISABLED' },
    { label: 'DEPRECATED', value: 'DEPRECATED' }
];

export async function changeArtifactStateCommand(
    registryService: RegistryService,
    refresh: () => void,
    node: RegistryItem
): Promise<void> {
    try {
        // Validate node has required properties
        if (!node.groupId || !node.id) {
            vscode.window.showErrorMessage('Cannot change state: missing group or artifact ID');
            return;
        }

        const groupId = node.groupId;
        const artifactId = node.id;

        // Show quick pick for state selection
        const selected = await vscode.window.showQuickPick(STATE_OPTIONS, {
            placeHolder: `Select new state for artifact ${artifactId}`
        });

        // User cancelled
        if (!selected) {
            return;
        }

        // Update artifact state
        await registryService.updateArtifactState(groupId, artifactId, selected.value);

        // Refresh tree to show state change
        refresh();

        // Show success message
        vscode.window.showInformationMessage(`Artifact state changed to ${selected.value}`);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to change artifact state: ${error.message}`);
    }
}

export async function changeVersionStateCommand(
    registryService: RegistryService,
    refresh: () => void,
    node: RegistryItem
): Promise<void> {
    try {
        // Validate node has required properties
        if (!node.groupId || !node.parentId || !node.id) {
            vscode.window.showErrorMessage('Cannot change state: missing group, artifact, or version ID');
            return;
        }

        const groupId = node.groupId;
        const artifactId = node.parentId;
        const version = node.id;

        // Show quick pick for state selection
        const selected = await vscode.window.showQuickPick(STATE_OPTIONS, {
            placeHolder: `Select new state for version ${version}`
        });

        // User cancelled
        if (!selected) {
            return;
        }

        // Update version state
        await registryService.updateVersionState(groupId, artifactId, version, selected.value);

        // Refresh tree to show state change
        refresh();

        // Show success message
        vscode.window.showInformationMessage(`Version state changed to ${selected.value}`);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to change version state: ${error.message}`);
    }
}
