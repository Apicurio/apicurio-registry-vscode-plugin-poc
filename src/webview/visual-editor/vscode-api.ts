/**
 * VSCode API wrapper for webview
 *
 * This module provides a type-safe interface to the VSCode webview API.
 * The acquireVsCodeApi() function is only available inside VSCode webviews.
 */

// VSCode API type definition
interface VSCodeApi {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
}

// Acquire the VS Code API (only available in webview context)
declare function acquireVsCodeApi(): VSCodeApi;

// Singleton instance
let vscodeApi: VSCodeApi | undefined;

/**
 * Get the VSCode API instance
 * Safe to call multiple times - returns the same instance
 */
export function getVSCodeAPI(): VSCodeApi {
    if (!vscodeApi) {
        vscodeApi = acquireVsCodeApi();
    }
    return vscodeApi;
}

/**
 * Message types sent FROM webview TO extension
 */
export interface WebviewMessage {
    type: 'ready' | 'documentChanged' | 'saveComplete' | 'error';
    payload?: any;
}

/**
 * Message types sent FROM extension TO webview
 */
export interface ExtensionMessage {
    type: 'loadDocument' | 'saveDocument' | 'themeChanged';
    payload?: any;
}

/**
 * Post a message to the VSCode extension
 */
export function postMessageToExtension(message: WebviewMessage): void {
    getVSCodeAPI().postMessage(message);
}

/**
 * Listen for messages from the VSCode extension
 */
export function onMessageFromExtension(
    handler: (message: ExtensionMessage) => void
): void {
    window.addEventListener('message', (event) => {
        handler(event.data as ExtensionMessage);
    });
}
