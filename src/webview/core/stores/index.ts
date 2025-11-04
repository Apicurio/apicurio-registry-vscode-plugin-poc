/**
 * Central export for all Zustand stores.
 *
 * **Available Stores:**
 * - `useDocumentStore` - Document state and operations
 * - `useSelectionStore` - Selection and navigation
 * - `useValidationStore` - Validation problems and status
 * - `useEditorStore` - Editor UI state
 * - `useCommandHistoryStore` - Command history (undo/redo)
 */

export * from './documentStore';
export * from './selectionStore';
export * from './validationStore';
export * from './editorStore';
export * from './commandHistoryStore';

/**
 * Combined hook for accessing all stores.
 *
 * This is a convenience hook that provides access to all stores
 * in one call. Use individual store hooks for better performance
 * if you only need a subset of the state.
 *
 * **Usage:**
 * ```tsx
 * const stores = useStores();
 *
 * // Access any store
 * const document = stores.document.document;
 * const selection = stores.selection.current;
 * const problems = stores.validation.problems;
 * const viewMode = stores.editor.viewMode;
 * const canUndo = stores.commandHistory.canUndo();
 *
 * // Dispatch actions
 * stores.document.updateDocument(newDoc);
 * stores.selection.select({ type: 'path', path: '/users' });
 * stores.commandHistory.undo();
 * ```
 */
export const useStores = () => {
    // Import hooks here to avoid circular dependencies
    const { useDocumentStore } = require('./documentStore');
    const { useSelectionStore } = require('./selectionStore');
    const { useValidationStore } = require('./validationStore');
    const { useEditorStore } = require('./editorStore');
    const { useCommandHistoryStore } = require('./commandHistoryStore');

    return {
        document: useDocumentStore(),
        selection: useSelectionStore(),
        validation: useValidationStore(),
        editor: useEditorStore(),
        commandHistory: useCommandHistoryStore()
    };
};
