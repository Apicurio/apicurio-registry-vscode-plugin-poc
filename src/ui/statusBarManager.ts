import * as vscode from 'vscode';
import { ApicurioUriBuilder } from '../utils/uriBuilder';
import { AutoSaveManager } from '../services/autoSaveManager';

/**
 * Manages the status bar item for Apicurio documents.
 * Shows version state, editability status, saving indicators, and last saved time.
 */
export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private autoSaveManager?: AutoSaveManager;

    constructor(autoSaveManager?: AutoSaveManager) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.autoSaveManager = autoSaveManager;
    }

    /**
     * Update status bar for active editor.
     * Shows different messages for drafts vs published versions, with save status.
     */
    updateStatusBar(editor: vscode.TextEditor | undefined): void {
        if (!editor) {
            this.statusBarItem.hide();
            return;
        }

        const uri = editor.document.uri;
        const metadata = ApicurioUriBuilder.parseVersionUri(uri);

        if (!metadata) {
            this.statusBarItem.hide();
            return;
        }

        const displayName = ApicurioUriBuilder.getDisplayName(
            metadata.groupId,
            metadata.artifactId,
            metadata.version
        );

        if (metadata.state === 'DRAFT') {
            // Check if currently saving
            const isSaving = this.autoSaveManager?.isSaving(uri);
            const lastSaveTime = this.autoSaveManager?.getLastSaveTime(uri);

            let text = `$(edit) Editing draft: ${displayName}`;
            let tooltip = 'This draft version content is editable. Changes will be saved to the registry.';

            if (isSaving) {
                text = `$(sync~spin) Saving: ${displayName}`;
                tooltip = 'Saving changes to registry...';
            } else if (lastSaveTime) {
                const timeSince = this.getTimeSince(lastSaveTime);
                text += ` (saved ${timeSince})`;
                tooltip += `\nLast saved: ${lastSaveTime.toLocaleString()}`;
            }

            this.statusBarItem.text = text;
            this.statusBarItem.tooltip = tooltip;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
            // Published version - read-only
            this.statusBarItem.text = `$(lock) Read-only content: ${displayName} (${metadata.state})`;
            this.statusBarItem.tooltip = 'Published version content cannot be edited. Metadata can still be updated via context menu. Create a draft to edit content.';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        }

        this.statusBarItem.show();
    }

    /**
     * Get human-readable time since a date.
     */
    private getTimeSince(date: Date): string {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

        if (seconds < 10) {
            return 'just now';
        } else if (seconds < 60) {
            return `${seconds}s ago`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes}m ago`;
        } else {
            const hours = Math.floor(seconds / 3600);
            return `${hours}h ago`;
        }
    }

    dispose(): void {
        this.statusBarItem.dispose();
    }
}
