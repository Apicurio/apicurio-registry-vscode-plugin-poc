import * as vscode from 'vscode';
import { ApicurioError } from '../errors/apicurioErrors';

/**
 * Centralized error handling service for the Apicurio Registry extension.
 *
 * Features:
 * - Output channel for detailed error logs
 * - User-friendly error messages
 * - "Show Details" action for complex errors
 * - Consistent error formatting
 */
export class ErrorHandlerService implements vscode.Disposable {
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Apicurio Registry');
    }

    /**
     * Handle an error by logging it and showing a message to the user.
     *
     * @param error - The error to handle (Error, ApicurioError, or string)
     */
    public async handleError(error: Error | ApicurioError | string | unknown): Promise<void> {
        const { code, message, userMessage, stack } = this.normalizeError(error);

        // Log to output channel
        this.logError(code, message, stack);

        // Show error message to user with "Show Details" action
        const action = await vscode.window.showErrorMessage(userMessage, 'Show Details');

        if (action === 'Show Details') {
            this.outputChannel.show();
        }
    }

    /**
     * Handle a warning by logging it and showing a warning message.
     *
     * @param message - The warning message
     */
    public async handleWarning(message: string): Promise<void> {
        this.logWarning(message);
        await vscode.window.showWarningMessage(message);
    }

    /**
     * Show an informational message to the user.
     *
     * @param message - The info message
     */
    public async handleInfo(message: string): Promise<void> {
        await vscode.window.showInformationMessage(message);
    }

    /**
     * Log a message to the output channel without showing to user.
     *
     * @param message - The message to log
     */
    public log(message: string): void {
        const timestamp = this.getTimestamp();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }

    /**
     * Show the output channel.
     */
    public showOutputChannel(): void {
        this.outputChannel.show();
    }

    /**
     * Clear the output channel.
     */
    public clearLog(): void {
        this.outputChannel.clear();
    }

    /**
     * Dispose of the output channel.
     */
    public dispose(): void {
        this.outputChannel.dispose();
    }

    /**
     * Normalize different error types to a consistent format.
     */
    private normalizeError(error: Error | ApicurioError | string | unknown): {
        code: string;
        message: string;
        userMessage: string;
        stack?: string;
    } {
        if (typeof error === 'string') {
            return {
                code: 'UNKNOWN',
                message: error,
                userMessage: error
            };
        }

        if (error instanceof ApicurioError) {
            return {
                code: error.code,
                message: error.message,
                userMessage: error.userMessage,
                stack: error.stack
            };
        }

        if (error instanceof Error) {
            return {
                code: 'ERROR',
                message: error.message,
                userMessage: error.message,
                stack: error.stack
            };
        }

        // Unknown error type
        return {
            code: 'UNKNOWN',
            message: String(error),
            userMessage: 'An unexpected error occurred'
        };
    }

    /**
     * Log an error to the output channel.
     */
    private logError(code: string, message: string, stack?: string): void {
        const timestamp = this.getTimestamp();
        this.outputChannel.appendLine(`[${timestamp}] ERROR [${code}]: ${message}`);

        if (stack) {
            this.outputChannel.appendLine(`Stack Trace:`);
            this.outputChannel.appendLine(stack);
        }

        this.outputChannel.appendLine('---');
    }

    /**
     * Log a warning to the output channel.
     */
    private logWarning(message: string): void {
        const timestamp = this.getTimestamp();
        this.outputChannel.appendLine(`[${timestamp}] WARNING: ${message}`);
    }

    /**
     * Get a formatted timestamp.
     */
    private getTimestamp(): string {
        return new Date().toISOString();
    }
}

// Singleton instance for global access
let errorHandlerInstance: ErrorHandlerService | undefined;

/**
 * Get the global error handler instance.
 * Creates a new instance if one doesn't exist.
 */
export function getErrorHandler(): ErrorHandlerService {
    if (!errorHandlerInstance) {
        errorHandlerInstance = new ErrorHandlerService();
    }
    return errorHandlerInstance;
}

/**
 * Set the global error handler instance.
 * Used for dependency injection and testing.
 */
export function setErrorHandler(handler: ErrorHandlerService): void {
    errorHandlerInstance = handler;
}
