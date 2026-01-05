import * as vscode from 'vscode';
import { FormatService } from '../services/formatService';
import { ApicurioUriBuilder } from '../utils/uriBuilder';

/**
 * Document formatting provider for Apicurio Registry documents.
 *
 * This provider:
 * - Formats API specifications (OpenAPI/AsyncAPI) in JSON or YAML
 * - Works with the standard Shift+Alt+F shortcut
 * - Preserves document format (JSON stays JSON, YAML stays YAML)
 */
export class ApicurioFormattingProvider implements vscode.DocumentFormattingEditProvider {
    private formatService: FormatService;

    constructor() {
        this.formatService = new FormatService();
    }

    /**
     * Provide formatting edits for a document.
     *
     * @param document - The document to format
     * @param options - Formatting options (tab size, etc.)
     * @param token - Cancellation token
     * @returns Array of text edits to apply, or null if formatting fails
     */
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        // Only format apicurio:// documents
        if (document.uri.scheme !== ApicurioUriBuilder.SCHEME) {
            return null;
        }

        // Check for cancellation
        if (token.isCancellationRequested) {
            return null;
        }

        const content = document.getText();
        const result = this.formatService.format(content, undefined, {
            indentSize: options.tabSize
        });

        if (!result.success) {
            vscode.window.showErrorMessage(`Format failed: ${result.error}`);
            return null;
        }

        // If content is the same, no edits needed
        if (result.formatted === content) {
            return [];
        }

        // Create a single edit that replaces the entire document
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(content.length)
        );

        return [vscode.TextEdit.replace(fullRange, result.formatted!)];
    }
}

/**
 * Format the current document command.
 * This is an alternative to using Shift+Alt+F.
 */
export async function formatDocumentCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
    }

    if (editor.document.uri.scheme !== ApicurioUriBuilder.SCHEME) {
        vscode.window.showWarningMessage('Format is only available for Apicurio Registry documents');
        return;
    }

    // Execute the built-in format document command
    await vscode.commands.executeCommand('editor.action.formatDocument');
}
