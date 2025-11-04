import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * Editor view mode.
 */
export type ViewMode = 'visual' | 'source' | 'split';

/**
 * Active panel in the editor.
 */
export type ActivePanel = 'properties' | 'documentation' | 'validation' | 'none';

/**
 * Editor state interface.
 */
export interface EditorState {
    /** Current view mode */
    viewMode: ViewMode;
    /** Active side panel */
    activePanel: ActivePanel;
    /** Is properties panel collapsed? */
    isPanelCollapsed: boolean;
    /** Search query for filtering */
    searchQuery: string;
    /** Is search active? */
    isSearching: boolean;
}

/**
 * Editor store actions.
 */
export interface EditorActions {
    /** Set view mode */
    setViewMode: (mode: ViewMode) => void;

    /** Set active panel */
    setActivePanel: (panel: ActivePanel) => void;

    /** Toggle panel collapsed state */
    togglePanelCollapsed: () => void;

    /** Set search query */
    setSearchQuery: (query: string) => void;

    /** Toggle search mode */
    toggleSearch: () => void;

    /** Clear search */
    clearSearch: () => void;

    /** Reset editor state to defaults */
    reset: () => void;
}

/**
 * Combined editor store type.
 */
export type EditorStore = EditorState & EditorActions;

/**
 * Initial state for editor store.
 */
const initialState: EditorState = {
    viewMode: 'visual',
    activePanel: 'properties',
    isPanelCollapsed: false,
    searchQuery: '',
    isSearching: false
};

/**
 * Zustand store for editor UI state management.
 *
 * This store manages:
 * - View mode (visual, source, split)
 * - Active panel (properties, documentation, validation)
 * - Panel collapsed state
 * - Search state
 *
 * Uses Immer middleware for immutable updates.
 *
 * **Usage:**
 * ```tsx
 * const { viewMode, setViewMode, activePanel } = useEditorStore();
 *
 * const handleToggleView = () => {
 *   setViewMode(viewMode === 'visual' ? 'source' : 'visual');
 * };
 *
 * if (activePanel === 'properties') {
 *   // Render properties panel
 * }
 * ```
 */
export const useEditorStore = create<EditorStore>()(
    immer((set) => ({
        // State
        ...initialState,

        // Actions
        setViewMode: (mode) =>
            set((state) => {
                state.viewMode = mode;
            }),

        setActivePanel: (panel) =>
            set((state) => {
                // If clicking the same panel, toggle collapsed
                if (state.activePanel === panel && panel !== 'none') {
                    state.isPanelCollapsed = !state.isPanelCollapsed;
                } else {
                    state.activePanel = panel;
                    state.isPanelCollapsed = false;
                }
            }),

        togglePanelCollapsed: () =>
            set((state) => {
                state.isPanelCollapsed = !state.isPanelCollapsed;
            }),

        setSearchQuery: (query) =>
            set((state) => {
                state.searchQuery = query;
                state.isSearching = query.length > 0;
            }),

        toggleSearch: () =>
            set((state) => {
                state.isSearching = !state.isSearching;
                if (!state.isSearching) {
                    state.searchQuery = '';
                }
            }),

        clearSearch: () =>
            set((state) => {
                state.searchQuery = '';
                state.isSearching = false;
            }),

        reset: () =>
            set((state) => {
                Object.assign(state, initialState);
            })
    }))
);
