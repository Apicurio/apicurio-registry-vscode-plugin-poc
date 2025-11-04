import * as YAML from 'yaml';
import { Library, Document } from '@apicurio/data-models';

/**
 * Supported document types for the visual editor.
 * Using generic Document type - @apicurio/data-models handles all spec types internally.
 */
export type SupportedDocument = Document;

/**
 * Document format (JSON or YAML).
 */
export type DocumentFormat = 'json' | 'yaml';

/**
 * Result of document parsing operation.
 */
export interface ParseResult {
    success: boolean;
    document?: SupportedDocument;
    format?: DocumentFormat;
    error?: string;
}

/**
 * Result of document serialization operation.
 */
export interface SerializeResult {
    success: boolean;
    content?: string;
    error?: string;
}

/**
 * Service for parsing and serializing API specification documents.
 *
 * This service provides:
 * - Parsing JSON/YAML content into @apicurio/data-models objects
 * - Serializing data-models objects back to JSON/YAML
 * - Document type detection (OpenAPI 2.0, 3.0, 3.1, AsyncAPI)
 * - Format detection (JSON vs YAML)
 * - Validation and error handling
 *
 * **Portability**: This service is framework-agnostic and can be used
 * in both VSCode webview and web environments.
 */
export class DocumentService {
    /**
     * Parse API specification content into a document model.
     *
     * Supports:
     * - OpenAPI 2.0 (Swagger)
     * - OpenAPI 3.0.x
     * - OpenAPI 3.1.x
     * - AsyncAPI 2.x
     *
     * @param content - Raw content (JSON or YAML string)
     * @returns Parse result with document or error
     */
    public parse(content: string): ParseResult {
        try {
            // Detect format and parse to JS object
            const { jsObject, format } = this.parseToObject(content);

            // Create document model using @apicurio/data-models Library
            // The library automatically detects the document type
            const document = Library.readDocument(jsObject) as SupportedDocument;

            if (!document) {
                return {
                    success: false,
                    error: 'Failed to create document model from content.'
                };
            }

            return {
                success: true,
                document,
                format
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Serialize a document model back to JSON or YAML string.
     *
     * @param document - The document model to serialize
     * @param format - Target format (json or yaml)
     * @returns Serialize result with content or error
     */
    public serialize(document: SupportedDocument, format: DocumentFormat): SerializeResult {
        try {
            // Convert document to JS object using @apicurio/data-models Library
            const jsObject = Library.writeNode(document);

            // Serialize to string based on format
            let content: string;
            if (format === 'json') {
                content = JSON.stringify(jsObject, null, 2);
            } else {
                content = YAML.stringify(jsObject, {
                    indent: 2,
                    lineWidth: 0 // Disable line wrapping
                });
            }

            return {
                success: true,
                content
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Parse content string to JavaScript object, detecting format.
     *
     * @param content - Raw content string
     * @returns Object and detected format
     */
    private parseToObject(content: string): { jsObject: any; format: DocumentFormat } {
        // Trim whitespace
        const trimmed = content.trim();

        // Detect format by first character
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            // JSON format
            try {
                const jsObject = JSON.parse(content);
                return { jsObject, format: 'json' };
            } catch (error) {
                throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
            }
        } else {
            // YAML format (default)
            try {
                const jsObject = YAML.parse(content);
                return { jsObject, format: 'yaml' };
            } catch (error) {
                throw new Error(`Invalid YAML: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }


    /**
     * Get human-readable document type name.
     *
     * @param document - The document model
     * @returns Document type name (e.g., "OpenAPI 3.0")
     */
    public getDocumentTypeName(document: SupportedDocument): string {
        const jsObj: any = Library.writeNode(document);

        if (jsObj.swagger === '2.0') {
            return 'OpenAPI 2.0 (Swagger)';
        }
        if (jsObj.openapi) {
            const version = jsObj.openapi;
            if (version.startsWith('3.0')) {
                return 'OpenAPI 3.0';
            }
            if (version.startsWith('3.1')) {
                return 'OpenAPI 3.1';
            }
            return `OpenAPI ${version}`;
        }
        if (jsObj.asyncapi) {
            return `AsyncAPI ${jsObj.asyncapi}`;
        }
        return 'Unknown';
    }

    /**
     * Check if document is OpenAPI (any version).
     */
    public isOpenApi(document: Document): boolean {
        const jsObj: any = Library.writeNode(document);
        return !!jsObj.swagger || !!jsObj.openapi;
    }

    /**
     * Check if document is AsyncAPI.
     */
    public isAsyncApi(document: Document): boolean {
        const jsObj: any = Library.writeNode(document);
        return !!jsObj.asyncapi;
    }

    /**
     * Get document version string.
     */
    public getDocumentVersion(document: Document): string | null {
        const jsObj: any = Library.writeNode(document);
        return jsObj.swagger || jsObj.openapi || jsObj.asyncapi || null;
    }

    /**
     * Validate that a document has required fields.
     *
     * @param document - Document to validate
     * @returns Validation result with errors if any
     */
    public validate(document: SupportedDocument): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const jsObj: any = Library.writeNode(document);

        // Basic validation for all document types
        if (this.isOpenApi(document)) {
            // OpenAPI validation
            if (!jsObj.info) {
                errors.push('Missing required "info" object');
            } else {
                if (!jsObj.info.title) {
                    errors.push('Missing required "info.title"');
                }
                if (!jsObj.info.version) {
                    errors.push('Missing required "info.version"');
                }
            }

            if (!jsObj.paths && !jsObj.webhooks) {
                errors.push('Document must have either "paths" or "webhooks"');
            }

        } else if (this.isAsyncApi(document)) {
            // AsyncAPI validation
            if (!jsObj.info) {
                errors.push('Missing required "info" object');
            } else {
                if (!jsObj.info.title) {
                    errors.push('Missing required "info.title"');
                }
                if (!jsObj.info.version) {
                    errors.push('Missing required "info.version"');
                }
            }

            if (!jsObj.channels || Object.keys(jsObj.channels).length === 0) {
                errors.push('AsyncAPI document must have at least one channel');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

/**
 * Singleton instance of DocumentService.
 * Use this for convenience, or create new instances if needed.
 */
export const documentService = new DocumentService();
