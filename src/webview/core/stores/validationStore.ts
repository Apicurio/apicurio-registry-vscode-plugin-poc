import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * Validation severity levels.
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation problem.
 */
export interface ValidationProblem {
    /** Unique ID for this problem */
    id: string;
    /** Severity level */
    severity: ValidationSeverity;
    /** Human-readable message */
    message: string;
    /** Path to the problematic element (e.g., "paths./users.get.responses.200") */
    path?: string;
    /** Line number in source (if available) */
    line?: number;
    /** Column number in source (if available) */
    column?: number;
    /** Suggested fix (if available) */
    suggestion?: string;
}

/**
 * Validation state interface.
 */
export interface ValidationState {
    /** All validation problems */
    problems: ValidationProblem[];
    /** Is validation currently running? */
    isValidating: boolean;
    /** Last validation timestamp */
    lastValidated: Date | null;
}

/**
 * Validation store actions.
 */
export interface ValidationActions {
    /** Add a validation problem */
    addProblem: (problem: ValidationProblem) => void;

    /** Add multiple problems */
    addProblems: (problems: ValidationProblem[]) => void;

    /** Remove a problem by ID */
    removeProblem: (id: string) => void;

    /** Clear all problems */
    clearProblems: () => void;

    /** Set validation running state */
    setValidating: (isValidating: boolean) => void;

    /** Get problems by severity */
    getProblemsBySeverity: (severity: ValidationSeverity) => ValidationProblem[];

    /** Get problems by path */
    getProblemsByPath: (path: string) => ValidationProblem[];

    /** Get error count */
    getErrorCount: () => number;

    /** Get warning count */
    getWarningCount: () => number;

    /** Get info count */
    getInfoCount: () => number;

    /** Check if document is valid (no errors) */
    isValid: () => boolean;
}

/**
 * Combined validation store type.
 */
export type ValidationStore = ValidationState & ValidationActions;

/**
 * Initial state for validation store.
 */
const initialState: ValidationState = {
    problems: [],
    isValidating: false,
    lastValidated: null
};

/**
 * Zustand store for validation state management.
 *
 * This store manages:
 * - Validation problems (errors, warnings, info)
 * - Validation status (running, last validated)
 * - Problem filtering and querying
 *
 * Uses Immer middleware for immutable updates.
 *
 * **Usage:**
 * ```tsx
 * const { problems, isValid, addProblems } = useValidationStore();
 *
 * // After document change, validate and add problems
 * const errors = validateDocument(doc);
 * addProblems(errors);
 *
 * // Check if valid
 * if (!isValid()) {
 *   // Show validation errors
 * }
 * ```
 */
export const useValidationStore = create<ValidationStore>()(
    immer((set, get) => ({
        // State
        ...initialState,

        // Actions
        addProblem: (problem) =>
            set((state) => {
                // Don't add duplicates
                const exists = state.problems.some((p) => p.id === problem.id);
                if (!exists) {
                    state.problems.push(problem);
                }
            }),

        addProblems: (problems) =>
            set((state) => {
                // Filter out duplicates
                const existingIds = new Set(state.problems.map((p) => p.id));
                const newProblems = problems.filter((p) => !existingIds.has(p.id));
                state.problems.push(...newProblems);
                state.lastValidated = new Date();
            }),

        removeProblem: (id) =>
            set((state) => {
                state.problems = state.problems.filter((p) => p.id !== id);
            }),

        clearProblems: () =>
            set((state) => {
                state.problems = [];
                state.lastValidated = new Date();
            }),

        setValidating: (isValidating) =>
            set((state) => {
                state.isValidating = isValidating;
            }),

        getProblemsBySeverity: (severity) => {
            const state = get();
            return state.problems.filter((p) => p.severity === severity);
        },

        getProblemsByPath: (path) => {
            const state = get();
            return state.problems.filter((p) => p.path === path);
        },

        getErrorCount: () => {
            const state = get();
            return state.problems.filter((p) => p.severity === 'error').length;
        },

        getWarningCount: () => {
            const state = get();
            return state.problems.filter((p) => p.severity === 'warning').length;
        },

        getInfoCount: () => {
            const state = get();
            return state.problems.filter((p) => p.severity === 'info').length;
        },

        isValid: () => {
            const state = get();
            return state.problems.filter((p) => p.severity === 'error').length === 0;
        }
    }))
);
