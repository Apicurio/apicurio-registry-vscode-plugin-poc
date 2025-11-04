import { useState, useEffect, useCallback } from 'react';
import { useEnvironment } from './useEnvironment';
import {
    DocumentService,
    SupportedDocument,
    DocumentFormat,
    documentService
} from '../services/documentService';

/**
 * Document state managed by the hook.
 */
export interface DocumentState {
    /** The parsed document model (null if not loaded or parse failed) */
    document: SupportedDocument | null;
    /** Original content format (json or yaml) */
    format: DocumentFormat | null;
    /** Document URI */
    uri: string | null;
    /** Loading state */
    isLoading: boolean;
    /** Error message if parse failed */
    error: string | null;
    /** Document type name (e.g., "OpenAPI 3.0") */
    documentType: string | null;
}

/**
 * React hook for managing API specification documents.
 *
 * This hook provides:
 * - Automatic parsing of document content from environment
 * - Document state management (document, format, loading, errors)
 * - Content update handling (serialize and send to environment)
 * - Document type detection and validation
 *
 * **Usage Example:**
 * ```tsx
 * const MyEditor = () => {
 *   const { document, format, isLoading, error, updateDocument } = useDocument();
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Alert variant="danger">{error}</Alert>;
 *   if (!document) return <Alert>No document loaded</Alert>;
 *
 *   // Use document for editing...
 *   const handleChange = () => {
 *     // Modify document...
 *     updateDocument(document);
 *   };
 * };
 * ```
 *
 * @param service - Optional custom DocumentService instance
 * @returns Document state and update function
 */
export function useDocument(service: DocumentService = documentService) {
    const env = useEnvironment();

    // Document state
    const [state, setState] = useState<DocumentState>({
        document: null,
        format: null,
        uri: null,
        isLoading: true,
        error: null,
        documentType: null
    });

    /**
     * Parse content and update state.
     */
    const parseContent = useCallback((uri: string, content: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = service.parse(content);

        if (result.success && result.document && result.format) {
            const documentType = service.getDocumentTypeName(result.document);

            setState({
                document: result.document,
                format: result.format,
                uri,
                isLoading: false,
                error: null,
                documentType
            });

            // Validate document
            const validation = service.validate(result.document);
            if (!validation.valid) {
                env.showWarning(
                    `Document validation warnings: ${validation.errors.join(', ')}`
                );
            }

        } else {
            setState({
                document: null,
                format: null,
                uri,
                isLoading: false,
                error: result.error || 'Unknown parsing error',
                documentType: null
            });

            env.showError(`Failed to parse document: ${result.error}`);
        }
    }, [service, env]);

    /**
     * Update document content in the environment.
     *
     * This serializes the document and sends it to the environment
     * for persistence (e.g., writing to VSCode document).
     */
    const updateDocument = useCallback((document: SupportedDocument) => {
        if (!state.format || !state.uri) {
            env.showError('Cannot update document: format or URI not set');
            return;
        }

        const result = service.serialize(document, state.format);

        if (result.success && result.content) {
            // Update local state
            setState(prev => ({ ...prev, document }));

            // Send to environment for persistence
            env.writeFile(state.uri, result.content);

        } else {
            env.showError(`Failed to serialize document: ${result.error}`);
        }
    }, [service, env, state.format, state.uri]);

    /**
     * Listen for document initialization from environment.
     */
    useEffect(() => {
        const dispose = env.onMessage(message => {
            if (message.type === 'init' && message.payload) {
                const { uri, content } = message.payload;
                if (uri && content) {
                    parseContent(uri, content);
                }
            }
        });

        return dispose;
    }, [env, parseContent]);

    return {
        // State
        document: state.document,
        format: state.format,
        uri: state.uri,
        isLoading: state.isLoading,
        error: state.error,
        documentType: state.documentType,

        // Actions
        updateDocument,

        // Service methods (for convenience)
        service
    };
}
