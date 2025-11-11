import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';

/**
 * Import artifacts from a ZIP file.
 * Uses the /admin/import endpoint.
 */
export async function importArtifactsCommand(
    registryService: RegistryService,
    refreshCallback: () => void
): Promise<void> {
    try {
        // Step 1: Prompt for ZIP file
        const uris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'ZIP Archive': ['zip']
            },
            openLabel: 'Import Registry'
        });

        if (!uris || uris.length === 0) {
            return; // User cancelled
        }

        const uri = uris[0];

        // Step 2: Confirm import (destructive operation)
        const confirm = await vscode.window.showWarningMessage(
            `Import artifacts from ${uri.fsPath}?\n\n` +
            `⚠️ Warning: This may overwrite existing artifacts with the same IDs.`,
            { modal: true },
            'Import',
            'Cancel'
        );

        if (confirm !== 'Import') {
            return;
        }

        // Step 3: Read ZIP file
        const zipContent = await vscode.workspace.fs.readFile(uri);

        // Step 4: Show progress and perform import
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Importing artifacts',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: `Reading ZIP file (${formatBytes(zipContent.length)})...` });

            try {
                progress.report({ message: 'Uploading to registry...' });

                await registryService.importArtifacts(zipContent);

                progress.report({ message: 'Complete!' });

            } catch (error: any) {
                // Detailed error handling
                if (error.message.includes('already exist')) {
                    throw new Error(
                        'Import failed: Some artifacts already exist.\n\n' +
                        'To resolve:\n' +
                        '1. Delete conflicting artifacts first, or\n' +
                        '2. Export current registry as backup before importing'
                    );
                } else if (error.message.includes('Invalid ZIP')) {
                    throw new Error(
                        'Import failed: Invalid or corrupted ZIP file.\n\n' +
                        'Ensure the ZIP file was created by Apicurio Registry export.'
                    );
                } else {
                    throw error;
                }
            }
        });

        // Step 5: Success - refresh tree and show message
        refreshCallback();

        vscode.window.showInformationMessage(
            'Artifacts imported successfully',
            'OK'
        );

    } catch (error: any) {
        vscode.window.showErrorMessage(
            error.message || `Import failed: ${String(error)}`
        );
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
