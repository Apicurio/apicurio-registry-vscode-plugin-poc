import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * Selection type - what kind of element is selected.
 */
export type SelectionType =
    | 'none'
    | 'info'
    | 'server'
    | 'path'
    | 'operation'
    | 'parameter'
    | 'requestBody'
    | 'response'
    | 'schema'
    | 'component'
    | 'securityScheme'
    | 'channel'      // AsyncAPI
    | 'message';     // AsyncAPI

/**
 * Selection context - identifies the selected element.
 */
export interface Selection {
    /** Type of selected element */
    type: SelectionType;
    /** Path to the selected element (e.g., "/users/{id}", "get", etc.) */
    path?: string;
    /** Additional context (e.g., HTTP method for operation) */
    context?: Record<string, any>;
}

/**
 * Selection state interface.
 */
export interface SelectionState {
    /** Current selection */
    current: Selection;
    /** Selection history (for navigation) */
    history: Selection[];
    /** Current position in history */
    historyIndex: number;
}

/**
 * Selection store actions.
 */
export interface SelectionActions {
    /** Select an element */
    select: (selection: Selection) => void;

    /** Clear selection */
    clearSelection: () => void;

    /** Navigate back in selection history */
    goBack: () => void;

    /** Navigate forward in selection history */
    goForward: () => void;

    /** Check if can navigate back */
    canGoBack: () => boolean;

    /** Check if can navigate forward */
    canGoForward: () => boolean;
}

/**
 * Combined selection store type.
 */
export type SelectionStore = SelectionState & SelectionActions;

/**
 * Initial selection (nothing selected).
 */
const initialSelection: Selection = {
    type: 'none'
};

/**
 * Initial state for selection store.
 */
const initialState: SelectionState = {
    current: initialSelection,
    history: [initialSelection],
    historyIndex: 0
};

/**
 * Zustand store for selection state management.
 *
 * This store manages:
 * - Current selection (what part of the API spec is being viewed/edited)
 * - Selection history (for back/forward navigation)
 * - Selection context (additional metadata)
 *
 * Uses Immer middleware for immutable updates.
 *
 * **Usage:**
 * ```tsx
 * const { current, select } = useSelectionStore();
 *
 * const handleSelectPath = (path: string) => {
 *   select({ type: 'path', path });
 * };
 *
 * if (current.type === 'path') {
 *   // Render path editor
 * }
 * ```
 */
export const useSelectionStore = create<SelectionStore>()(
    immer((set, get) => ({
        // State
        ...initialState,

        // Actions
        select: (selection) =>
            set((state) => {
                // Don't add to history if same as current
                if (
                    state.current.type === selection.type &&
                    state.current.path === selection.path
                ) {
                    return;
                }

                // Truncate history after current index
                state.history = state.history.slice(0, state.historyIndex + 1);

                // Add new selection to history
                state.history.push(selection);
                state.historyIndex = state.history.length - 1;
                state.current = selection;

                // Limit history size to 50 items
                if (state.history.length > 50) {
                    state.history.shift();
                    state.historyIndex = state.history.length - 1;
                }
            }),

        clearSelection: () =>
            set((state) => {
                state.current = initialSelection;
            }),

        goBack: () =>
            set((state) => {
                if (state.historyIndex > 0) {
                    state.historyIndex--;
                    state.current = state.history[state.historyIndex];
                }
            }),

        goForward: () =>
            set((state) => {
                if (state.historyIndex < state.history.length - 1) {
                    state.historyIndex++;
                    state.current = state.history[state.historyIndex];
                }
            }),

        canGoBack: () => {
            const state = get();
            return state.historyIndex > 0;
        },

        canGoForward: () => {
            const state = get();
            return state.historyIndex < state.history.length - 1;
        }
    }))
);
