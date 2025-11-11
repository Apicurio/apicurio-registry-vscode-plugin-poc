import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryItem } from '../models/registryModels';

/**
 * Export all registry artifacts to a ZIP file.
 * Uses the /admin/export endpoint.
 */
export async function exportAllCommand(
    registryService: RegistryService
): Promise<void> {
    try {
        // Step 1: Prompt for save location
        const defaultFilename = `registry-export-${new Date().toISOString().split('T')[0]}.zip`;
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultFilename),
            filters: {
                'ZIP Archive': ['zip']
            },
            saveLabel: 'Export Registry'
        });

        if (!uri) {
            return; // User cancelled
        }

        // Step 2: Show progress and perform export
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Exporting registry',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Fetching artifacts from registry...' });

            // Step 3: Call export API
            const zipContent = await registryService.exportAll();

            progress.report({ message: `Saving file (${formatBytes(zipContent.length)})...` });

            // Step 4: Save to file system
            await vscode.workspace.fs.writeFile(uri, zipContent);

            progress.report({ message: 'Complete!' });
        });

        // Step 5: Show success with option to reveal file
        const action = await vscode.window.showInformationMessage(
            `Registry exported successfully to ${uri.fsPath}`,
            'Reveal in Finder'
        );

        if (action === 'Reveal in Finder') {
            await vscode.commands.executeCommand('revealFileInOS', uri);
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(
            `Export failed: ${error.message || String(error)}`
        );
    }
}

/**
 * Export a specific group to a ZIP file.
 * Note: Currently shows "not implemented" message.
 * Future enhancement: Filter export to specific group.
 */
export async function exportGroupCommand(
    registryService: RegistryService,
    node: RegistryItem
): Promise<void> {
    // TODO: Implement group-specific export
    // For now, suggest using exportAll
    const action = await vscode.window.showInformationMessage(
        `Group-specific export not yet implemented.\n\nUse "Export All Artifacts" to export the entire registry, then filter manually.`,
        'Export All Instead'
    );

    if (action === 'Export All Instead') {
        await exportAllCommand(registryService);
    }
}

/**
 * Format bytes to human-readable string.
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
