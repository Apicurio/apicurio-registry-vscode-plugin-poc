import YAML from 'yaml';

/**
 * Document format types.
 */
export type DocumentFormat = 'json' | 'yaml';

/**
 * Formatting options.
 */
export interface FormatOptions {
    /** Indent size in spaces (default: 2) */
    indentSize?: number;
    /** Line width for YAML (default: 0 = no wrapping) */
    lineWidth?: number;
}

/**
 * Result of a format operation.
 */
export interface FormatResult {
    /** Whether formatting succeeded */
    success: boolean;
    /** Formatted content (if success) */
    formatted?: string;
    /** Detected or specified format */
    format?: DocumentFormat;
    /** Error message (if failed) */
    error?: string;
}

/**
 * Default formatting options.
 */
const DEFAULT_OPTIONS: Required<FormatOptions> = {
    indentSize: 2,
    lineWidth: 0
};

/**
 * Service for formatting API specification documents.
 *
 * This service:
 * - Detects document format (JSON/YAML)
 * - Formats with consistent indentation
 * - Preserves document content
 * - Handles errors gracefully
 */
export class FormatService {

    /**
     * Detect the format of a document.
     *
     * @param content - Document content
     * @returns Detected format ('json' or 'yaml')
     */
    public detectFormat(content: string): DocumentFormat {
        const trimmed = content.trim();

        // JSON starts with { or [
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return 'json';
        }

        // Default to YAML
        return 'yaml';
    }

    /**
     * Format a document.
     *
     * @param content - Document content to format
     * @param format - Optional format override (auto-detected if not specified)
     * @param options - Formatting options
     * @returns Format result with formatted content or error
     */
    public format(
        content: string,
        format?: DocumentFormat,
        options?: FormatOptions
    ): FormatResult {
        const opts = { ...DEFAULT_OPTIONS, ...options };

        // Handle empty or whitespace content
        const trimmed = content.trim();
        if (!trimmed) {
            return {
                success: true,
                formatted: content,
                format: format || 'yaml'
            };
        }

        // Detect format if not specified
        const detectedFormat = format || this.detectFormat(content);

        try {
            if (detectedFormat === 'json') {
                return this.formatJson(content, opts);
            } else {
                return this.formatYaml(content, opts);
            }
        } catch (error) {
            return {
                success: false,
                format: detectedFormat,
                error: `Format error: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Format JSON content.
     */
    private formatJson(content: string, options: Required<FormatOptions>): FormatResult {
        try {
            const parsed = JSON.parse(content);
            const formatted = JSON.stringify(parsed, null, options.indentSize);

            return {
                success: true,
                formatted,
                format: 'json'
            };
        } catch (error) {
            return {
                success: false,
                format: 'json',
                error: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Format YAML content.
     */
    private formatYaml(content: string, options: Required<FormatOptions>): FormatResult {
        try {
            const parsed = YAML.parse(content);
            const formatted = YAML.stringify(parsed, {
                indent: options.indentSize,
                lineWidth: options.lineWidth || 0
            });

            return {
                success: true,
                formatted,
                format: 'yaml'
            };
        } catch (error) {
            return {
                success: false,
                format: 'yaml',
                error: `Invalid YAML: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
}
