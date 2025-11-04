import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ICommand } from '../commands/ICommand';

/**
 * Command history state interface.
 */
export interface CommandHistoryState {
    /** Stack of executed commands (undo stack) */
    undoStack: ICommand[];
    /** Stack of undone commands (redo stack) */
    redoStack: ICommand[];
    /** Maximum history size */
    maxHistorySize: number;
    /** Is a command currently executing? */
    isExecuting: boolean;
}

/**
 * Command history store actions.
 */
export interface CommandHistoryActions {
    /**
     * Execute a command and add it to history.
     * Clears redo stack.
     */
    executeCommand: (command: ICommand) => void;

    /**
     * Undo the last command.
     * Moves command from undo stack to redo stack.
     */
    undo: () => void;

    /**
     * Redo the last undone command.
     * Moves command from redo stack to undo stack.
     */
    redo: () => void;

    /**
     * Check if undo is available.
     */
    canUndo: () => boolean;

    /**
     * Check if redo is available.
     */
    canRedo: () => boolean;

    /**
     * Get description of next undo command.
     */
    getUndoDescription: () => string | null;

    /**
     * Get description of next redo command.
     */
    getRedoDescription: () => string | null;

    /**
     * Clear all history.
     */
    clearHistory: () => void;

    /**
     * Set maximum history size.
     */
    setMaxHistorySize: (size: number) => void;
}

/**
 * Combined command history store type.
 */
export type CommandHistoryStore = CommandHistoryState & CommandHistoryActions;

/**
 * Initial state for command history store.
 */
const initialState: CommandHistoryState = {
    undoStack: [],
    redoStack: [],
    maxHistorySize: 100,
    isExecuting: false
};

/**
 * Zustand store for command history (undo/redo) management.
 *
 * This store manages:
 * - Command execution with automatic history tracking
 * - Undo/Redo stacks
 * - Command merging optimization
 * - History size limits
 *
 * Uses Immer middleware for immutable updates.
 *
 * **Usage:**
 * ```tsx
 * const { executeCommand, undo, redo, canUndo, canRedo } = useCommandHistoryStore();
 *
 * // Execute a command
 * const command = new UpdateTitleCommand(oldTitle, newTitle);
 * executeCommand(command);
 *
 * // Undo/Redo
 * if (canUndo()) {
 *   undo();
 * }
 *
 * if (canRedo()) {
 *   redo();
 * }
 * ```
 */
export const useCommandHistoryStore = create<CommandHistoryStore>()(
    immer((set, get) => ({
        // State
        ...initialState,

        // Actions
        executeCommand: (command) => {
            set((state) => {
                state.isExecuting = true;
            });

            try {
                // Execute the command
                command.execute();

                set((state) => {
                    // Check if we can merge with the last command
                    const lastCommand = state.undoStack[state.undoStack.length - 1];
                    if (
                        lastCommand &&
                        lastCommand.canMergeWith &&
                        lastCommand.canMergeWith(command)
                    ) {
                        // Merge commands instead of adding new one
                        const merged = lastCommand.mergeWith!(command);
                        state.undoStack[state.undoStack.length - 1] = merged;
                    } else {
                        // Add command to undo stack
                        state.undoStack.push(command);

                        // Enforce max history size
                        if (state.undoStack.length > state.maxHistorySize) {
                            state.undoStack.shift();
                        }
                    }

                    // Clear redo stack (can't redo after new action)
                    state.redoStack = [];

                    state.isExecuting = false;
                });
            } catch (error) {
                console.error('Command execution failed:', error);
                set((state) => {
                    state.isExecuting = false;
                });
                throw error;
            }
        },

        undo: () => {
            const state = get();
            if (state.undoStack.length === 0) {
                return;
            }

            set((draft) => {
                draft.isExecuting = true;
            });

            try {
                const command = state.undoStack[state.undoStack.length - 1];
                command.undo();

                set((draft) => {
                    // Move command from undo to redo stack
                    const cmd = draft.undoStack.pop();
                    if (cmd) {
                        draft.redoStack.push(cmd);
                    }
                    draft.isExecuting = false;
                });
            } catch (error) {
                console.error('Undo failed:', error);
                set((draft) => {
                    draft.isExecuting = false;
                });
                throw error;
            }
        },

        redo: () => {
            const state = get();
            if (state.redoStack.length === 0) {
                return;
            }

            set((draft) => {
                draft.isExecuting = true;
            });

            try {
                const command = state.redoStack[state.redoStack.length - 1];
                command.execute();

                set((draft) => {
                    // Move command from redo to undo stack
                    const cmd = draft.redoStack.pop();
                    if (cmd) {
                        draft.undoStack.push(cmd);
                    }
                    draft.isExecuting = false;
                });
            } catch (error) {
                console.error('Redo failed:', error);
                set((draft) => {
                    draft.isExecuting = false;
                });
                throw error;
            }
        },

        canUndo: () => {
            const state = get();
            return state.undoStack.length > 0 && !state.isExecuting;
        },

        canRedo: () => {
            const state = get();
            return state.redoStack.length > 0 && !state.isExecuting;
        },

        getUndoDescription: () => {
            const state = get();
            if (state.undoStack.length === 0) {
                return null;
            }
            return state.undoStack[state.undoStack.length - 1].getDescription();
        },

        getRedoDescription: () => {
            const state = get();
            if (state.redoStack.length === 0) {
                return null;
            }
            return state.redoStack[state.redoStack.length - 1].getDescription();
        },

        clearHistory: () =>
            set((state) => {
                state.undoStack = [];
                state.redoStack = [];
            }),

        setMaxHistorySize: (size) =>
            set((state) => {
                state.maxHistorySize = size;
                // Trim undo stack if needed
                if (state.undoStack.length > size) {
                    state.undoStack = state.undoStack.slice(-size);
                }
            })
    }))
);
