import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { SupportedDocument, DocumentFormat } from '../services/documentService';

/**
 * Document state interface.
 */
export interface DocumentState {
    /** The parsed document model */
    document: SupportedDocument | null;
    /** Original format (json or yaml) */
    format: DocumentFormat | null;
    /** Document URI */
    uri: string | null;
    /** Document type name (e.g., "OpenAPI 3.0") */
    documentType: string | null;
    /** Is document currently loading? */
    isLoading: boolean;
    /** Parse/load error if any */
    error: string | null;
    /** Has document been modified? */
    isDirty: boolean;
}

/**
 * Document store actions.
 */
export interface DocumentActions {
    /** Set the document and metadata */
    setDocument: (
        document: SupportedDocument,
        format: DocumentFormat,
        uri: string,
        documentType: string
    ) => void;

    /** Update the document (marks as dirty) */
    updateDocument: (document: SupportedDocument) => void;

    /** Set loading state */
    setLoading: (isLoading: boolean) => void;

    /** Set error state */
    setError: (error: string | null) => void;

    /** Mark document as saved (clears dirty flag) */
    markSaved: () => void;

    /** Clear document state */
    clear: () => void;
}

/**
 * Combined document store type.
 */
export type DocumentStore = DocumentState & DocumentActions;

/**
 * Initial state for document store.
 */
const initialState: DocumentState = {
    document: null,
    format: null,
    uri: null,
    documentType: null,
    isLoading: false,
    error: null,
    isDirty: false
};

/**
 * Zustand store for document state management.
 *
 * This store manages:
 * - Current document model (@apicurio/data-models Document)
 * - Document metadata (format, URI, type)
 * - Loading and error states
 * - Dirty flag (unsaved changes)
 *
 * Uses Immer middleware for immutable updates.
 *
 * **Usage:**
 * ```tsx
 * const { document, isDirty, updateDocument } = useDocumentStore();
 *
 * const handleEdit = () => {
 *   updateDocument(modifiedDoc); // Automatically marks as dirty
 * };
 * ```
 */
export const useDocumentStore = create<DocumentStore>()(
    immer((set) => ({
        // State
        ...initialState,

        // Actions
        setDocument: (document, format, uri, documentType) =>
            set((state) => {
                state.document = document;
                state.format = format;
                state.uri = uri;
                state.documentType = documentType;
                state.isLoading = false;
                state.error = null;
                state.isDirty = false;
            }),

        updateDocument: (document) =>
            set((state) => {
                state.document = document;
                state.isDirty = true;
            }),

        setLoading: (isLoading) =>
            set((state) => {
                state.isLoading = isLoading;
                if (isLoading) {
                    state.error = null;
                }
            }),

        setError: (error) =>
            set((state) => {
                state.error = error;
                state.isLoading = false;
            }),

        markSaved: () =>
            set((state) => {
                state.isDirty = false;
            }),

        clear: () =>
            set((state) => {
                Object.assign(state, initialState);
            })
    }))
);
