/**
 * Environment abstraction for Apicurio Visual Editor.
 *
 * This interface abstracts all environment-specific operations,
 * allowing the core editor to run in different environments:
 * - VSCodeEnvironment: VSCode extension webview
 * - WebEnvironment: Apicurio Studio web application
 *
 * The core editor components use this interface exclusively,
 * never directly accessing VSCode APIs or browser APIs.
 */

export type EditorTheme = 'light' | 'dark' | 'high-contrast';

export interface EditorMessage {
    type: 'change' | 'ready' | 'error' | 'request-save';
    payload?: any;
}

export interface EnvironmentMessage {
    type: 'init' | 'save' | 'undo' | 'redo' | 'reload';
    payload?: any;
}

/**
 * Core interface that all environment adapters must implement.
 */
export interface IEditorEnvironment {
    // ========================================
    // File Operations
    // ========================================

    /**
     * Read file content from the environment.
     * @param uri - Resource URI
     * @returns File content as string
     */
    readFile(uri: string): Promise<string>;

    /**
     * Write file content to the environment.
     * @param uri - Resource URI
     * @param content - Content to write
     */
    writeFile(uri: string, content: string): Promise<void>;

    // ========================================
    // Messaging (Environment ↔ Editor)
    // ========================================

    /**
     * Post a message to the environment (editor → environment).
     * @param message - Message to send
     */
    postMessage(message: EditorMessage): void;

    /**
     * Register a handler for messages from the environment (environment → editor).
     * @param handler - Message handler callback
     * @returns Dispose function to unregister the handler
     */
    onMessage(handler: (message: EnvironmentMessage) => void): () => void;

    // ========================================
    // Notifications
    // ========================================

    /**
     * Show an informational notification to the user.
     * @param message - Notification message
     */
    showInfo(message: string): void;

    /**
     * Show a warning notification to the user.
     * @param message - Warning message
     */
    showWarning(message: string): void;

    /**
     * Show an error notification to the user.
     * @param message - Error message
     */
    showError(message: string): void;

    // ========================================
    // Theming
    // ========================================

    /**
     * Get the current theme.
     * @returns Current theme
     */
    getTheme(): EditorTheme;

    /**
     * Register a handler for theme changes.
     * @param handler - Theme change callback
     * @returns Dispose function to unregister the handler
     */
    onThemeChange(handler: (theme: EditorTheme) => void): () => void;

    // ========================================
    // State Persistence (Optional)
    // ========================================

    /**
     * Get persisted state from the environment.
     * @param key - State key
     * @returns Persisted value or undefined
     */
    getState<T = any>(key: string): T | undefined;

    /**
     * Set persisted state in the environment.
     * @param key - State key
     * @param value - Value to persist
     */
    setState<T = any>(key: string, value: T): void;
}

/**
 * Factory function type for creating environment instances.
 */
export type EnvironmentFactory = () => IEditorEnvironment;
