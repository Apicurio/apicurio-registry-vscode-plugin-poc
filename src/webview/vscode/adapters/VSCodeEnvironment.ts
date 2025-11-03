import {
    IEditorEnvironment,
    EditorTheme,
    EditorMessage,
    EnvironmentMessage
} from '../../core/interfaces/IEditorEnvironment';

/**
 * VSCode-specific implementation of IEditorEnvironment.
 *
 * This adapter uses the VSCode WebView API to provide environment services
 * to the core editor components.
 *
 * Key features:
 * - Message passing via postMessage API
 * - Theme detection via CSS classes
 * - State persistence via VSCode state API
 */
export class VSCodeEnvironment implements IEditorEnvironment {
    private vscode: any;
    private messageHandlers: Array<(msg: EnvironmentMessage) => void> = [];
    private themeHandlers: Array<(theme: EditorTheme) => void> = [];
    private themeObserver: MutationObserver | null = null;

    constructor() {
        // Acquire VSCode API (only available in webview)
        this.vscode = this.acquireVsCodeApi();

        // Listen for messages from VSCode extension
        window.addEventListener('message', this.handleExtensionMessage.bind(this));

        // Set up theme change detection
        this.setupThemeObserver();
    }

    // ========================================
    // VSCode API Acquisition
    // ========================================

    private acquireVsCodeApi(): any {
        // @ts-ignore - VSCode injects this function
        if (typeof acquireVsCodeApi !== 'undefined') {
            // @ts-ignore
            return acquireVsCodeApi();
        }

        // Fallback for development/testing
        console.warn('VSCode API not available - using mock');
        return {
            postMessage: (msg: any) => console.log('[Mock VSCode] postMessage:', msg),
            setState: (state: any) => console.log('[Mock VSCode] setState:', state),
            getState: () => null
        };
    }

    // ========================================
    // File Operations
    // ========================================

    async readFile(uri: string): Promise<string> {
        return new Promise((resolve, reject) => {
            // Request file content from extension
            this.postMessage({ type: 'request-save', payload: { action: 'read', uri } });

            // Listen for response
            const handler = (msg: EnvironmentMessage) => {
                if (msg.type === 'init' && msg.payload?.uri === uri) {
                    resolve(msg.payload.content);
                    // Remove this one-time handler
                    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
                }
            };

            this.messageHandlers.push(handler);

            // Timeout after 10 seconds
            setTimeout(() => {
                this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
                reject(new Error(`Timeout reading file: ${uri}`));
            }, 10000);
        });
    }

    async writeFile(uri: string, content: string): Promise<void> {
        // Notify extension to save file
        this.postMessage({
            type: 'change',
            payload: { uri, content, action: 'write' }
        });
    }

    // ========================================
    // Messaging
    // ========================================

    postMessage(message: EditorMessage): void {
        this.vscode.postMessage(message);
    }

    onMessage(handler: (message: EnvironmentMessage) => void): () => void {
        this.messageHandlers.push(handler);

        // Return dispose function
        return () => {
            this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
        };
    }

    private handleExtensionMessage(event: MessageEvent): void {
        const message = event.data as EnvironmentMessage;

        // Notify all registered handlers
        this.messageHandlers.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('Error in message handler:', error);
            }
        });
    }

    // ========================================
    // Notifications
    // ========================================

    showInfo(message: string): void {
        this.postMessage({
            type: 'request-save',
            payload: { action: 'notification', level: 'info', message }
        });
    }

    showWarning(message: string): void {
        this.postMessage({
            type: 'request-save',
            payload: { action: 'notification', level: 'warning', message }
        });
    }

    showError(message: string): void {
        this.postMessage({
            type: 'request-save',
            payload: { action: 'notification', level: 'error', message }
        });
    }

    // ========================================
    // Theming
    // ========================================

    getTheme(): EditorTheme {
        const body = document.body;

        if (body.classList.contains('vscode-dark')) {
            return 'dark';
        }

        if (body.classList.contains('vscode-high-contrast') ||
            body.classList.contains('vscode-high-contrast-light')) {
            return 'high-contrast';
        }

        return 'light';
    }

    onThemeChange(handler: (theme: EditorTheme) => void): () => void {
        this.themeHandlers.push(handler);

        // Return dispose function
        return () => {
            this.themeHandlers = this.themeHandlers.filter(h => h !== handler);
        };
    }

    private setupThemeObserver(): void {
        // Observe changes to body class (VSCode changes theme by modifying body classes)
        this.themeObserver = new MutationObserver(() => {
            const newTheme = this.getTheme();

            // Notify all theme handlers
            this.themeHandlers.forEach(handler => {
                try {
                    handler(newTheme);
                } catch (error) {
                    console.error('Error in theme handler:', error);
                }
            });
        });

        this.themeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // ========================================
    // State Persistence
    // ========================================

    getState<T = any>(key: string): T | undefined {
        const state = this.vscode.getState() || {};
        return state[key];
    }

    setState<T = any>(key: string, value: T): void {
        const state = this.vscode.getState() || {};
        state[key] = value;
        this.vscode.setState(state);
    }

    // ========================================
    // Cleanup
    // ========================================

    /**
     * Clean up resources (call when editor is disposed)
     */
    dispose(): void {
        // Disconnect theme observer
        if (this.themeObserver) {
            this.themeObserver.disconnect();
            this.themeObserver = null;
        }

        // Clear handlers
        this.messageHandlers = [];
        this.themeHandlers = [];
    }
}
