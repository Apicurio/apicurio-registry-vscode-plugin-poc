import * as vscode from 'vscode';
import { ApicurioUriBuilder } from '../utils/uriBuilder';

/**
 * Manages the status bar item for Apicurio documents.
 * Shows version state and editability status.
 */
export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
    }

    /**
     * Update status bar for active editor.
     * Shows different messages for drafts vs published versions.
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
            // Draft version - editable
            this.statusBarItem.text = `$(edit) Editing draft: ${displayName}`;
            this.statusBarItem.tooltip = 'This draft version content is editable. Changes will be saved to the registry.';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
            // Published version - read-only
            this.statusBarItem.text = `$(lock) Read-only content: ${displayName} (${metadata.state})`;
            this.statusBarItem.tooltip = 'Published version content cannot be edited. Metadata can still be updated via context menu. Create a draft to edit content.';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        }

        this.statusBarItem.show();
    }

    dispose(): void {
        this.statusBarItem.dispose();
    }
}
