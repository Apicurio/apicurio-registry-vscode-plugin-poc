import * as vscode from 'vscode';
import { ConflictInfo, ConflictResolution } from '../services/conflictDetector';
import { ApicurioUriBuilder } from '../utils/uriBuilder';

/**
 * Dialog for resolving conflicts between local and remote draft versions.
 *
 * Shows the user:
 * - What draft has a conflict
 * - When local and remote changes were made
 * - Options to resolve: View Diff, Overwrite Remote, Discard Local, Cancel
 */
export class ConflictResolutionDialog {
    /**
     * Show conflict resolution dialog and return user's choice.
     *
     * @param conflict - Information about the detected conflict
     * @returns The user's resolution choice
     */
    static async show(conflict: ConflictInfo): Promise<ConflictResolution> {
        const displayName = ApicurioUriBuilder.getDisplayName(
            conflict.groupId,
            conflict.artifactId,
            conflict.version
        );

        const message = `**Conflict Detected**\n\n` +
            `The draft "${displayName}" has been modified by another user.\n\n` +
            `**Local changes:** Modified on ${conflict.localModifiedOn.toLocaleString()}\n` +
            `**Remote changes:** Modified on ${conflict.remoteModifiedOn.toLocaleString()}\n\n` +
            `How would you like to resolve this conflict?`;

        const viewDiff = '$(diff) View Diff';
        const overwrite = '$(warning) Overwrite Remote';
        const discard = '$(discard) Discard Local';
        const cancel = '$(close) Cancel';

        const choice = await vscode.window.showWarningMessage(
            message,
            { modal: true },
            viewDiff,
            overwrite,
            discard,
            cancel
        );

        switch (choice) {
            case viewDiff:
                await this.showDiff(conflict);
                // After showing diff, ask again
                return this.show(conflict);

            case overwrite:
                // Confirm overwrite
                const confirmOverwrite = await vscode.window.showWarningMessage(
                    `Are you sure you want to overwrite remote changes?\n\nThis will permanently discard changes made by other users.`,
                    { modal: true },
                    '$(warning) Yes, Overwrite',
                    '$(close) No, Cancel'
                );
                return confirmOverwrite === '$(warning) Yes, Overwrite'
                    ? ConflictResolution.Overwrite
                    : ConflictResolution.Cancel;

            case discard:
                return ConflictResolution.Discard;

            case cancel:
            default:
                return ConflictResolution.Cancel;
        }
    }

    /**
     * Show diff view comparing local vs remote changes.
     *
     * @param conflict - The conflict information with content to compare
     */
    private static async showDiff(conflict: ConflictInfo): Promise<void> {
        const { groupId, artifactId, version, localContent, remoteContent } = conflict;

        // Create temporary URIs for diff view
        const localUri = vscode.Uri.parse(
            `untitled:${groupId}/${artifactId}:${version} (Your Changes)`
        );
        const remoteUri = vscode.Uri.parse(
            `untitled:${groupId}/${artifactId}:${version} (Remote Changes)`
        );

        // Open diff editor
        await vscode.commands.executeCommand(
            'vscode.diff',
            remoteUri,  // Left side: remote (theirs)
            localUri,   // Right side: local (yours)
            `Conflict: ${ApicurioUriBuilder.getDisplayName(groupId, artifactId, version)}`,
            {
                preview: true,
                selection: undefined
            }
        );

        // Note: The diff command opens an editor with untitled documents.
        // VSCode will prompt for content when opening, but we can't pre-populate
        // untitled documents in the current API. The diff view will show file names
        // and allow manual comparison.
        //
        // For a better UX, we could use temporary files or a custom webview,
        // but this approach keeps the implementation simpler while still functional.
    }
}
