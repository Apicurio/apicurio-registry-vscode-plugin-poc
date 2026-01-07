import * as vscode from 'vscode';
import YAML, { YAMLParseError } from 'yaml';

/**
 * The apicurio URI scheme for registry documents.
 */
const APICURIO_SCHEME = 'apicurio';

/**
 * Debounce delay in milliseconds for validation.
 */
const DEBOUNCE_DELAY = 500;

/**
 * Service for providing real-time validation diagnostics for API specification documents.
 *
 * This service:
 * - Validates documents as users type (with debouncing)
 * - Detects syntax errors in JSON/YAML
 * - Validates schema requirements (OpenAPI, AsyncAPI)
 * - Integrates with VSCode's diagnostics system (Problems panel, squiggly lines)
 */
export class ValidationDiagnosticsService implements vscode.Disposable {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private pendingValidations = new Map<string, NodeJS.Timeout>();
    private _isValidating = false;
    private _isDisposed = false;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('apicurio');
    }

    /**
     * Schedule a debounced validation for a document.
     *
     * @param uri - The document URI
     * @param content - The document content
     */
    public validateDocument(uri: vscode.Uri, content: string): void {
        if (this._isDisposed) {
            return;
        }

        // Only validate apicurio:// scheme documents
        if (uri.scheme !== APICURIO_SCHEME) {
            return;
        }

        const uriString = uri.toString();

        // Cancel any pending validation for this URI
        const pending = this.pendingValidations.get(uriString);
        if (pending) {
            clearTimeout(pending);
        }

        // Schedule new validation after debounce delay
        const timeout = setTimeout(() => {
            this.pendingValidations.delete(uriString);
            this.performValidation(uri, content);
        }, DEBOUNCE_DELAY);

        this.pendingValidations.set(uriString, timeout);
    }

    /**
     * Perform the actual validation.
     *
     * @param uri - The document URI
     * @param content - The document content
     */
    private performValidation(uri: vscode.Uri, content: string): void {
        if (this._isDisposed) {
            return;
        }

        this._isValidating = true;
        const diagnostics: vscode.Diagnostic[] = [];

        try {
            // Step 1: Parse the content (detect syntax errors)
            const parseResult = this.parseContent(content);

            if (!parseResult.success) {
                // Syntax error - add diagnostic
                const range = new vscode.Range(
                    new vscode.Position(parseResult.line || 0, parseResult.column || 0),
                    new vscode.Position(parseResult.line || 0, (parseResult.column || 0) + 10)
                );

                diagnostics.push(new vscode.Diagnostic(
                    range,
                    parseResult.error!,
                    vscode.DiagnosticSeverity.Error
                ));
            } else if (parseResult.data) {
                // Step 2: Validate schema
                const schemaErrors = this.validateSchema(parseResult.data, content);
                diagnostics.push(...schemaErrors);
            }

        } catch (error) {
            // Unexpected error - add generic diagnostic
            diagnostics.push(new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 1),
                `Validation error: ${error instanceof Error ? error.message : String(error)}`,
                vscode.DiagnosticSeverity.Error
            ));
        }

        // Update diagnostics collection
        this.diagnosticCollection.set(uri, diagnostics);
        this._isValidating = false;
    }

    /**
     * Parse content as JSON or YAML.
     */
    private parseContent(content: string): {
        success: boolean;
        data?: Record<string, unknown>;
        format?: 'json' | 'yaml';
        error?: string;
        line?: number;
        column?: number;
    } {
        const trimmed = content.trim();

        // Try JSON first if it looks like JSON
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                const data = JSON.parse(content);
                return { success: true, data, format: 'json' };
            } catch (error) {
                // Try to extract line/column from JSON parse error
                const message = error instanceof Error ? error.message : String(error);
                const posMatch = message.match(/position\s+(\d+)/i);
                let line = 0;
                let column = 0;

                if (posMatch) {
                    const position = parseInt(posMatch[1], 10);
                    const lines = content.substring(0, position).split('\n');
                    line = lines.length - 1;
                    column = lines[lines.length - 1].length;
                }

                return {
                    success: false,
                    error: `Invalid JSON: ${message}`,
                    line,
                    column
                };
            }
        }

        // Try YAML
        try {
            const data = YAML.parse(content);
            return { success: true, data, format: 'yaml' };
        } catch (error) {
            // YAML errors often have line info
            let line = 0;
            let column = 0;
            const message = error instanceof Error ? error.message : String(error);

            // Check for YAMLParseError with line position info
            if (error instanceof YAMLParseError && error.linePos) {
                line = error.linePos[0]?.line ? error.linePos[0].line - 1 : 0;
                column = error.linePos[0]?.col ? error.linePos[0].col - 1 : 0;
            }

            return {
                success: false,
                error: `Invalid YAML: ${message}`,
                line,
                column
            };
        }
    }

    /**
     * Validate schema requirements for OpenAPI/AsyncAPI documents.
     */
    private validateSchema(data: Record<string, unknown>, content: string): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

        // Detect document type
        const isOpenApi = !!(data.swagger || data.openapi);
        const isAsyncApi = !!data.asyncapi;

        if (isOpenApi) {
            diagnostics.push(...this.validateOpenApi(data, content));
        } else if (isAsyncApi) {
            diagnostics.push(...this.validateAsyncApi(data, content));
        }

        return diagnostics;
    }

    /**
     * Validate OpenAPI document.
     */
    private validateOpenApi(data: Record<string, unknown>, content: string): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

        // Check for info object
        if (!data.info) {
            diagnostics.push(this.createDiagnostic(
                'Missing required "info" object',
                this.findKeyPosition(content, 'openapi') || this.findKeyPosition(content, 'swagger') || { line: 0, column: 0 },
                vscode.DiagnosticSeverity.Error
            ));
        } else {
            const info = data.info as Record<string, unknown>;

            // Check for info.title
            if (!info.title) {
                diagnostics.push(this.createDiagnostic(
                    'Missing required "info.title"',
                    this.findKeyPosition(content, 'info') || { line: 0, column: 0 },
                    vscode.DiagnosticSeverity.Error
                ));
            }

            // Check for info.version
            if (!info.version) {
                diagnostics.push(this.createDiagnostic(
                    'Missing required "info.version"',
                    this.findKeyPosition(content, 'info') || { line: 0, column: 0 },
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }

        // Check for paths or webhooks
        if (!data.paths && !data.webhooks) {
            diagnostics.push(this.createDiagnostic(
                'Document must have either "paths" or "webhooks"',
                { line: 0, column: 0 },
                vscode.DiagnosticSeverity.Error
            ));
        }

        return diagnostics;
    }

    /**
     * Validate AsyncAPI document.
     */
    private validateAsyncApi(data: Record<string, unknown>, content: string): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

        // Check for info object
        if (!data.info) {
            diagnostics.push(this.createDiagnostic(
                'Missing required "info" object',
                this.findKeyPosition(content, 'asyncapi') || { line: 0, column: 0 },
                vscode.DiagnosticSeverity.Error
            ));
        } else {
            const info = data.info as Record<string, unknown>;

            // Check for info.title
            if (!info.title) {
                diagnostics.push(this.createDiagnostic(
                    'Missing required "info.title"',
                    this.findKeyPosition(content, 'info') || { line: 0, column: 0 },
                    vscode.DiagnosticSeverity.Error
                ));
            }

            // Check for info.version
            if (!info.version) {
                diagnostics.push(this.createDiagnostic(
                    'Missing required "info.version"',
                    this.findKeyPosition(content, 'info') || { line: 0, column: 0 },
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }

        // Check for channels
        const channels = data.channels as Record<string, unknown> | undefined;
        if (!channels || Object.keys(channels).length === 0) {
            diagnostics.push(this.createDiagnostic(
                'AsyncAPI document must have at least one channel',
                { line: 0, column: 0 },
                vscode.DiagnosticSeverity.Error
            ));
        }

        return diagnostics;
    }

    /**
     * Find the position of a key in the content.
     */
    private findKeyPosition(content: string, key: string): { line: number; column: number } | null {
        const lines = content.split('\n');
        const patterns = [
            new RegExp(`^\\s*"${key}"\\s*:`),    // JSON: "key":
            new RegExp(`^\\s*${key}\\s*:`),       // YAML: key:
            new RegExp(`^\\s*'${key}'\\s*:`)      // YAML: 'key':
        ];

        for (let i = 0; i < lines.length; i++) {
            for (const pattern of patterns) {
                if (pattern.test(lines[i])) {
                    const match = lines[i].match(pattern);
                    return {
                        line: i,
                        column: match ? lines[i].indexOf(key) : 0
                    };
                }
            }
        }

        return null;
    }

    /**
     * Create a diagnostic at the specified position.
     */
    private createDiagnostic(
        message: string,
        position: { line: number; column: number },
        severity: vscode.DiagnosticSeverity
    ): vscode.Diagnostic {
        const range = new vscode.Range(
            new vscode.Position(position.line, position.column),
            new vscode.Position(position.line, position.column + 20)
        );

        const diagnostic = new vscode.Diagnostic(range, message, severity);
        diagnostic.source = 'Apicurio Registry';
        return diagnostic;
    }

    /**
     * Get diagnostics for a specific URI.
     */
    public getDiagnostics(uri: vscode.Uri): vscode.Diagnostic[] | undefined {
        return this.diagnosticCollection.get(uri) as vscode.Diagnostic[] | undefined;
    }

    /**
     * Clear diagnostics for a specific URI.
     */
    public clearDiagnostics(uri: vscode.Uri): void {
        this.diagnosticCollection.delete(uri);
    }

    /**
     * Clear all diagnostics.
     */
    public clearAllDiagnostics(): void {
        this.diagnosticCollection.clear();
    }

    /**
     * Check if currently validating.
     */
    public isValidating(): boolean {
        return this._isValidating;
    }

    /**
     * Dispose of resources.
     */
    public dispose(): void {
        this._isDisposed = true;

        // Cancel all pending validations
        for (const timeout of this.pendingValidations.values()) {
            clearTimeout(timeout);
        }
        this.pendingValidations.clear();

        // Dispose of diagnostic collection
        this.diagnosticCollection.dispose();
    }
}
