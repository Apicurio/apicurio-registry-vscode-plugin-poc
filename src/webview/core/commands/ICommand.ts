/**
 * Command interface for undo/redo operations.
 *
 * The Command Pattern encapsulates actions as objects, enabling:
 * - Undo/Redo functionality
 * - Command history tracking
 * - Macro recording (future)
 * - Transaction support (future)
 *
 * **Usage:**
 * ```tsx
 * class UpdateTitleCommand implements ICommand {
 *   constructor(
 *     private oldTitle: string,
 *     private newTitle: string
 *   ) {}
 *
 *   execute(): void {
 *     // Set title to newTitle
 *   }
 *
 *   undo(): void {
 *     // Set title back to oldTitle
 *   }
 *
 *   getDescription(): string {
 *     return `Update title to "${this.newTitle}"`;
 *   }
 * }
 * ```
 */
export interface ICommand {
    /**
     * Execute the command (perform the action).
     * This method should modify the document state.
     */
    execute(): void;

    /**
     * Undo the command (reverse the action).
     * This method should restore the previous state.
     */
    undo(): void;

    /**
     * Get a human-readable description of this command.
     * Used for displaying in undo/redo history UI.
     *
     * @returns Description like "Update title" or "Add path /users"
     */
    getDescription(): string;

    /**
     * Check if this command can be merged with another command.
     * This is used for optimizing history by merging similar commands.
     *
     * Example: Multiple "Update title" commands can be merged into one.
     *
     * @param command - The command to potentially merge with
     * @returns true if commands can be merged
     */
    canMergeWith?(command: ICommand): boolean;

    /**
     * Merge this command with another command.
     * Only called if canMergeWith() returned true.
     *
     * @param command - The command to merge
     * @returns A new merged command
     */
    mergeWith?(command: ICommand): ICommand;
}

/**
 * Abstract base class for commands.
 * Provides common functionality and type safety.
 */
export abstract class BaseCommand implements ICommand {
    abstract execute(): void;
    abstract undo(): void;
    abstract getDescription(): string;

    /**
     * Default implementation: commands cannot be merged.
     * Override in subclasses if merging is supported.
     */
    canMergeWith(command: ICommand): boolean {
        return false;
    }

    /**
     * Default implementation: throw error if called.
     * Override in subclasses if merging is supported.
     */
    mergeWith(command: ICommand): ICommand {
        throw new Error('Command merging not supported');
    }
}
