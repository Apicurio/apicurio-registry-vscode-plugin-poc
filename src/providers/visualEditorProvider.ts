/**
 * Visual Editor Provider (POC)
 *
 * VSCode Custom Editor Provider for the Apicurio Visual Editor.
 * This is a proof-of-concept implementation to validate the integration approach.
 */

import * as vscode from 'vscode';
import * as path from 'path';

export class VisualEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'apicurio.visualEditor';

    /**
     * Register the visual editor provider
     */
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new VisualEditorProvider(context);
        const options: vscode.WebviewPanelOptions & vscode.WebviewOptions = {
            retainContextWhenHidden: true,
            enableScripts: true,
        };

        return vscode.window.registerCustomEditorProvider(
            VisualEditorProvider.viewType,
            provider,
            { webviewOptions: options }
        );
    }

    constructor(private readonly context: vscode.ExtensionContext) {}

    /**
     * Called when a custom editor is opened
     */
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Set up webview
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        // Set webview HTML
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        // Parse and send initial document content
        try {
            const content = JSON.parse(document.getText());
            webviewPanel.webview.postMessage({
                type: 'loadDocument',
                payload: { content },
            });
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        // Handle messages from webview
        webviewPanel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'ready':
                    // Webview is ready - send document again to be sure
                    try {
                        const content = JSON.parse(document.getText());
                        webviewPanel.webview.postMessage({
                            type: 'loadDocument',
                            payload: { content },
                        });
                    } catch (error) {
                        console.error('Failed to send document:', error);
                    }
                    break;

                case 'documentChanged':
                    // Document changed in editor - we could update dirty state here
                    console.log('Document changed:', message.payload);
                    break;

                case 'saveComplete':
                    // Save the document content
                    const content = message.payload.content;
                    if (content) {
                        const edit = new vscode.WorkspaceEdit();
                        const fullRange = new vscode.Range(
                            document.positionAt(0),
                            document.positionAt(document.getText().length)
                        );
                        edit.replace(
                            document.uri,
                            fullRange,
                            JSON.stringify(content, null, 2)
                        );
                        await vscode.workspace.applyEdit(edit);
                        await document.save();
                        vscode.window.showInformationMessage('Document saved');
                    }
                    break;

                case 'error':
                    vscode.window.showErrorMessage(
                        `Editor error: ${message.payload?.message || 'Unknown error'}`
                    );
                    break;
            }
        });
    }

    /**
     * Get the HTML content for the webview
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        // Get paths to bundled assets
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.context.extensionUri,
                'out',
                'webview',
                'assets',
                'visualEditor.js'
            )
        );

        const baseStyleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.context.extensionUri,
                'out',
                'webview',
                'assets',
                'base.css'
            )
        );

        const mainStyleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.context.extensionUri,
                'out',
                'webview',
                'assets',
                'main.css'
            )
        );

        const baseScriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.context.extensionUri,
                'out',
                'webview',
                'assets',
                'base.js'
            )
        );

        const mainScriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.context.extensionUri,
                'out',
                'webview',
                'assets',
                'main.js'
            )
        );

        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data:;">
    <title>Apicurio Visual Editor</title>

    <link href="${baseStyleUri}" rel="stylesheet">
    <link href="${mainStyleUri}" rel="stylesheet">

    <style>
        * {
            box-sizing: border-box;
        }

        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            overflow: hidden;
        }

        #root {
            height: 100%;
            width: 100%;
        }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="module" nonce="${nonce}" src="${baseScriptUri}"></script>
    <script type="module" nonce="${nonce}" src="${mainScriptUri}"></script>
    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
