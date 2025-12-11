import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Provider for Apicurio Visual Editor custom text editor.
 *
 * This provider implements VSCode's CustomTextEditorProvider interface
 * to provide a React-based visual editor for OpenAPI/AsyncAPI specifications.
 *
 * Architecture:
 * - Extension (this file) ↔ WebView (React app)
 * - Uses message passing for bidirectional communication
 * - WebView content built by Vite (out/webview/index.html + assets)
 */
export class ApicurioVisualEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'apicurio.visualEditor';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) {}

    /**
     * Called when a custom text editor is opened.
     *
     * @param document - The text document being edited
     * @param webviewPanel - The webview panel to populate
     * @param token - Cancellation token
     */
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): Promise<void> {
        // Set up webview options
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview')
            ]
        };

        // Set up webview HTML content
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        // Set up message passing
        this.setupMessageHandling(document, webviewPanel);

        // Send initial document content to webview
        this.sendDocumentToWebview(document, webviewPanel.webview);

        // Listen for document changes (from other editors or external sources)
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                // Document changed externally, update webview
                this.sendDocumentToWebview(document, webviewPanel.webview);
            }
        });

        // Clean up subscription when panel is closed
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }

    /**
     * Set up bidirectional message handling between extension and webview.
     */
    private setupMessageHandling(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel
    ): void {
        webviewPanel.webview.onDidReceiveMessage(
            async message => {
                switch (message.type) {
                    case 'ready':
                        // Webview is ready, send initial document
                        this.sendDocumentToWebview(document, webviewPanel.webview);
                        break;

                    case 'change':
                        // Webview sent content change, update document
                        await this.updateDocument(document, message.payload.content);
                        break;

                    case 'request-save':
                        // Webview requested save operation
                        await this.handleSaveRequest(document, webviewPanel, message.payload);
                        break;

                    default:
                        console.warn(`Unknown message type: ${message.type}`);
                }
            }
        );
    }

    /**
     * Send current document content to webview.
     */
    private sendDocumentToWebview(document: vscode.TextDocument, webview: vscode.Webview): void {
        const content = document.getText();
        const uri = document.uri.toString();

        webview.postMessage({
            type: 'init',
            payload: {
                uri,
                content
            }
        });
    }

    /**
     * Update document with new content from webview.
     */
    private async updateDocument(document: vscode.TextDocument, content: string): Promise<void> {
        const edit = new vscode.WorkspaceEdit();

        // Replace entire document content
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            content
        );

        await vscode.workspace.applyEdit(edit);
    }

    /**
     * Handle save requests from webview.
     */
    private async handleSaveRequest(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        payload: any
    ): Promise<void> {
        const { action } = payload;

        switch (action) {
            case 'write':
                // Update document and save
                await this.updateDocument(document, payload.content);
                await document.save();
                break;

            case 'read':
                // Re-send current document content
                this.sendDocumentToWebview(document, webviewPanel.webview);
                break;

            case 'notification':
                // Show notification to user
                this.showNotification(payload.level, payload.message);
                break;

            default:
                console.warn(`Unknown save action: ${action}`);
        }
    }

    /**
     * Show notification to user based on level.
     */
    private showNotification(level: 'info' | 'warning' | 'error', message: string): void {
        switch (level) {
            case 'info':
                vscode.window.showInformationMessage(message);
                break;
            case 'warning':
                vscode.window.showWarningMessage(message);
                break;
            case 'error':
                vscode.window.showErrorMessage(message);
                break;
        }
    }

    /**
     * Get HTML content for webview, loading Vite-built assets.
     *
     * Vite generates hashed filenames (e.g., index-abc123.js), so we read
     * the built index.html and transform all asset paths to webview URIs.
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        // Path to Vite-built visual-editor index.html
        const htmlPath = path.join(
            this.context.extensionPath,
            'out',
            'webview',
            'visual-editor',
            'index.html'
        );

        // Read Vite-generated HTML
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Base URI for webview assets
        const webviewUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview')
        );

        // Replace relative paths with webview URIs
        // Vite generates paths like: ./assets/index-abc123.js
        html = html.replace(
            /(<link[^>]+href="|<script[^>]+src="|<img[^>]+src=")\.?\//g,
            `$1${webviewUri}/`
        );

        // Generate nonce for CSP
        const nonce = this.getNonce();

        // Replace CSP placeholder with actual CSP
        const csp = `default-src 'none';
                     script-src ${webview.cspSource} 'nonce-${nonce}';
                     style-src ${webview.cspSource} 'unsafe-inline';
                     font-src ${webview.cspSource};
                     img-src ${webview.cspSource} https: data:;`;

        // Update CSP meta tag
        if (html.includes('{{cspSource}}')) {
            // If template has placeholder, replace it
            html = html.replace(/\{\{cspSource\}\}/g, webview.cspSource);
        } else {
            // Otherwise inject CSP meta tag
            html = html.replace(
                '<meta charset="UTF-8">',
                `<meta charset="UTF-8">\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`
            );
        }

        // Add nonce to all script tags
        html = html.replace(/<script/g, `<script nonce="${nonce}"`);

        return html;
    }

    /**
     * Generate random nonce for CSP.
     */
    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
