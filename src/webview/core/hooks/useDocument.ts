import { useEffect, useCallback } from 'react';
import { useEnvironment } from './useEnvironment';
import {
    DocumentService,
    SupportedDocument,
    documentService
} from '../services/documentService';
import { useDocumentStore } from '../stores/documentStore';
import { useValidationStore } from '../stores/validationStore';

/**
 * React hook for managing API specification documents.
 *
 * This hook integrates with Zustand stores for state management and
 * provides a clean API for document operations.
 *
 * **Features:**
 * - Automatic parsing of document content from environment
 * - Integration with documentStore for centralized state
 * - Integration with validationStore for document validation
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

    // Get state from Zustand stores
    const documentStore = useDocumentStore();
    const validationStore = useValidationStore();

    /**
     * Parse content and update store.
     */
    const parseContent = useCallback((uri: string, content: string) => {
        documentStore.setLoading(true);
        validationStore.clearProblems();

        const result = service.parse(content);

        if (result.success && result.document && result.format) {
            const documentType = service.getDocumentTypeName(result.document);

            // Update document store
            documentStore.setDocument(result.document, result.format, uri, documentType);

            // Validate document
            const validation = service.validate(result.document);
            if (!validation.valid) {
                // Add validation problems to store
                const problems = validation.errors.map((error, index) => ({
                    id: `validation-${index}`,
                    severity: 'warning' as const,
                    message: error
                }));
                validationStore.addProblems(problems);

                env.showWarning(
                    `Document validation warnings: ${validation.errors.join(', ')}`
                );
            }

        } else {
            documentStore.setError(result.error || 'Unknown parsing error');
            env.showError(`Failed to parse document: ${result.error}`);
        }
    }, [service, env, documentStore, validationStore]);

    /**
     * Update document content in the environment.
     *
     * This serializes the document and sends it to the environment
     * for persistence (e.g., writing to VSCode document).
     */
    const updateDocument = useCallback((document: SupportedDocument) => {
        if (!documentStore.format || !documentStore.uri) {
            env.showError('Cannot update document: format or URI not set');
            return;
        }

        const result = service.serialize(document, documentStore.format);

        if (result.success && result.content) {
            // Update document store (marks as dirty)
            documentStore.updateDocument(document);

            // Send to environment for persistence
            env.writeFile(documentStore.uri, result.content);

            // Re-validate after update
            const validation = service.validate(document);
            validationStore.clearProblems();

            if (!validation.valid) {
                const problems = validation.errors.map((error, index) => ({
                    id: `validation-${index}`,
                    severity: 'warning' as const,
                    message: error
                }));
                validationStore.addProblems(problems);
            }

        } else {
            env.showError(`Failed to serialize document: ${result.error}`);
        }
    }, [service, env, documentStore, validationStore]);

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
        // State from store
        document: documentStore.document,
        format: documentStore.format,
        uri: documentStore.uri,
        isLoading: documentStore.isLoading,
        error: documentStore.error,
        documentType: documentStore.documentType,
        isDirty: documentStore.isDirty,

        // Actions
        updateDocument,
        markSaved: documentStore.markSaved,

        // Service methods (for convenience)
        service
    };
}
