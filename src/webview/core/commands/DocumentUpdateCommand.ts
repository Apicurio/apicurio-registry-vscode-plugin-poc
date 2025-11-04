import { BaseCommand } from './ICommand';
import { SupportedDocument } from '../services/documentService';
import { useDocumentStore } from '../stores/documentStore';

/**
 * Command for updating the document.
 *
 * This command stores the document state before and after the update,
 * enabling undo/redo functionality.
 *
 * **Important**: This stores serialized versions of the document for
 * better memory efficiency and to avoid mutation issues.
 */
export class DocumentUpdateCommand extends BaseCommand {
    private beforeState: any;
    private afterState: any;

    /**
     * Create a document update command.
     *
     * @param beforeDocument - Document state before the change
     * @param afterDocument - Document state after the change
     * @param description - Human-readable description of the change
     */
    constructor(
        beforeDocument: SupportedDocument,
        afterDocument: SupportedDocument,
        private description: string
    ) {
        super();

        // Import Library for serialization
        const { Library } = require('@apicurio/data-models');

        // Store serialized versions to avoid mutation issues
        this.beforeState = Library.writeNode(beforeDocument);
        this.afterState = Library.writeNode(afterDocument);
    }

    execute(): void {
        this.applyState(this.afterState);
    }

    undo(): void {
        this.applyState(this.beforeState);
    }

    getDescription(): string {
        return this.description;
    }

    /**
     * Apply a serialized document state to the store.
     */
    private applyState(state: any): void {
        const { Library } = require('@apicurio/data-models');

        // Deserialize to document
        const document = Library.readDocument(state) as SupportedDocument;

        // Update store
        const store = useDocumentStore.getState();
        store.updateDocument(document);
    }
}

/**
 * Factory function for creating document update commands.
 *
 * **Usage:**
 * ```tsx
 * const command = createDocumentUpdateCommand(
 *   oldDocument,
 *   newDocument,
 *   "Update API title"
 * );
 * executeCommand(command);
 * ```
 */
export function createDocumentUpdateCommand(
    beforeDocument: SupportedDocument,
    afterDocument: SupportedDocument,
    description: string
): DocumentUpdateCommand {
    return new DocumentUpdateCommand(beforeDocument, afterDocument, description);
}
