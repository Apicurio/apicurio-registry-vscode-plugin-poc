import React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { InfoForm } from '../InfoForm';
import { useDocument } from '../../../core/hooks/useDocument';
import { useCommandHistoryStore } from '../../../core/stores/commandHistoryStore';
import { Library } from '@apicurio/data-models';

// Mock hooks
jest.mock('../../../core/hooks/useDocument');
jest.mock('../../../core/stores/commandHistoryStore');

/**
 * Helper function to create a test OpenAPI document.
 */
function createTestDocument(overrides?: any) {
    const baseDoc = {
        openapi: '3.0.0',
        info: {
            title: 'Test API',
            version: '1.0.0',
            description: 'A test API',
            termsOfService: 'https://example.com/terms',
            contact: {
                name: 'API Support',
                url: 'https://example.com/support',
                email: 'support@example.com'
            },
            license: {
                name: 'Apache 2.0',
                url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
            }
        },
        paths: {}
    };

    const merged = { ...baseDoc, ...overrides };
    return Library.readDocument(merged);
}

describe('InfoForm', () => {
    const mockExecuteCommand = jest.fn();
    const mockUseDocument = useDocument as jest.MockedFunction<typeof useDocument>;
    const mockUseCommandHistoryStore = useCommandHistoryStore as jest.MockedFunction<typeof useCommandHistoryStore>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock for commandHistoryStore
        mockUseCommandHistoryStore.mockReturnValue({
            executeCommand: mockExecuteCommand,
            undo: jest.fn(),
            redo: jest.fn(),
            canUndo: jest.fn(() => false),
            canRedo: jest.fn(() => false),
            getUndoDescription: jest.fn(),
            getRedoDescription: jest.fn(),
            history: [],
            currentIndex: -1
        });

        // Default mock for document hook
        mockUseDocument.mockReturnValue({
            document: createTestDocument(),
            format: 'json',
            uri: 'test://document.json',
            isLoading: false,
            error: null,
            documentType: 'openapi',
            isDirty: false,
            updateDocument: jest.fn(),
            markSaved: jest.fn(),
            service: {} as any
        });
    });

    describe('Form Display', () => {
        it('should render form with current info values', () => {
            const { getByDisplayValue, getByLabelText } = render(<InfoForm />);

            expect(getByDisplayValue('Test API')).toBeInTheDocument();
            expect(getByDisplayValue('1.0.0')).toBeInTheDocument();
            expect(getByDisplayValue('A test API')).toBeInTheDocument();
            expect(getByDisplayValue('https://example.com/terms')).toBeInTheDocument();
        });

        it('should display contact information', () => {
            const { getByDisplayValue } = render(<InfoForm />);

            expect(getByDisplayValue('API Support')).toBeInTheDocument();
            expect(getByDisplayValue('https://example.com/support')).toBeInTheDocument();
            expect(getByDisplayValue('support@example.com')).toBeInTheDocument();
        });

        it('should display license information', () => {
            const { getByDisplayValue } = render(<InfoForm />);

            expect(getByDisplayValue('Apache 2.0')).toBeInTheDocument();
            expect(getByDisplayValue('https://www.apache.org/licenses/LICENSE-2.0.html')).toBeInTheDocument();
        });

        it('should render empty fields when info properties are missing', () => {
            const minimalDoc = createTestDocument({
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                }
            });

            mockUseDocument.mockReturnValue({
                document: minimalDoc,
                format: 'json',
                uri: 'test://document.json',
                isLoading: false,
                error: null,
                documentType: 'openapi',
                isDirty: false,
                updateDocument: jest.fn(),
                markSaved: jest.fn(),
                service: {} as any
            });

            const { getByLabelText } = render(<InfoForm />);

            // Check that optional fields are empty
            const descriptionInput = getByLabelText(/description/i) as HTMLTextAreaElement;
            expect(descriptionInput.value).toBe('');
        });
    });

    describe('Form Editing', () => {
        it('should allow editing title field', async () => {
            const user = userEvent.setup();
            const { getByDisplayValue } = render(<InfoForm />);

            const titleInput = getByDisplayValue('Test API');
            await user.clear(titleInput);
            await user.type(titleInput, 'Updated API');

            expect(titleInput).toHaveValue('Updated API');
        });

        it('should allow editing version field', async () => {
            const user = userEvent.setup();
            const { getByDisplayValue } = render(<InfoForm />);

            const versionInput = getByDisplayValue('1.0.0');
            await user.clear(versionInput);
            await user.type(versionInput, '2.0.0');

            expect(versionInput).toHaveValue('2.0.0');
        });

        it('should allow editing description field', async () => {
            const user = userEvent.setup();
            const { getByLabelText } = render(<InfoForm />);

            const descriptionInput = getByLabelText('Description') as HTMLTextAreaElement;

            // Note: The TextArea is controlled and uses executeCommand for updates.
            // The test mock doesn't update the document, so we can only verify:
            // 1. The textarea is editable (user can type)
            // 2. The command system is called
            await user.clear(descriptionInput);
            await user.type(descriptionInput, 'U'); // Type just one character

            // Verify updateInfoField was called through command system
            await waitFor(() => {
                expect(mockExecuteCommand).toHaveBeenCalled();
            });
        });

        it('should allow editing contact information', async () => {
            const user = userEvent.setup();
            const { getByDisplayValue } = render(<InfoForm />);

            const contactNameInput = getByDisplayValue('API Support');
            await user.clear(contactNameInput);
            await user.type(contactNameInput, 'New Support Team');

            expect(contactNameInput).toHaveValue('New Support Team');
        });
    });

    describe('Form Validation', () => {
        it('should show error when title is empty', async () => {
            const user = userEvent.setup();
            const { getByDisplayValue, findByText } = render(<InfoForm />);

            const titleInput = getByDisplayValue('Test API');
            await user.clear(titleInput);

            // InlineEdit shows validation errors immediately on onChange
            const errorMessage = await findByText(/This field is required/i);
            expect(errorMessage).toBeInTheDocument();
        });

        it('should show error when version is empty', async () => {
            const user = userEvent.setup();
            const { getByDisplayValue, findByText } = render(<InfoForm />);

            const versionInput = getByDisplayValue('1.0.0');
            await user.clear(versionInput);

            // InlineEdit shows validation errors immediately on onChange
            const errorMessage = await findByText(/This field is required/i);
            expect(errorMessage).toBeInTheDocument();
        });

        it('should validate email format for contact email', async () => {
            const user = userEvent.setup();
            const { getByDisplayValue, findByText } = render(<InfoForm />);

            const emailInput = getByDisplayValue('support@example.com');
            await user.clear(emailInput);
            await user.type(emailInput, 'invalid-email');
            await user.tab();

            const errorMessage = await findByText(/invalid email/i);
            expect(errorMessage).toBeInTheDocument();
        });

        it('should validate URL format for contact URL', async () => {
            const user = userEvent.setup();
            const { getByDisplayValue, findByText } = render(<InfoForm />);

            const urlInput = getByDisplayValue('https://example.com/support');
            await user.clear(urlInput);
            await user.type(urlInput, 'not-a-url');
            await user.tab();

            const errorMessage = await findByText(/invalid url/i);
            expect(errorMessage).toBeInTheDocument();
        });
    });

    describe('Command Integration', () => {
        it('should execute command when form changes are saved', async () => {
            const user = userEvent.setup();
            const { getByDisplayValue, getAllByLabelText } = render(<InfoForm />);

            const titleInput = getByDisplayValue('Test API');
            await user.clear(titleInput);
            await user.type(titleInput, 'Updated API');

            // Click the save button (InlineEdit requires explicit save)
            // There are multiple save buttons (one per InlineEdit field), so get all and click the first
            const saveButtons = getAllByLabelText('save button for editing value');
            await user.click(saveButtons[0]);

            await waitFor(() => {
                expect(mockExecuteCommand).toHaveBeenCalled();
                const call = mockExecuteCommand.mock.calls[0][0];
                expect(call).toHaveProperty('execute');
                expect(call).toHaveProperty('undo');
                expect(call).toHaveProperty('getDescription');
                expect(call.getDescription()).toContain('title');
            });
        });

        it('should execute command for description changes', async () => {
            const user = userEvent.setup();
            const { getByLabelText } = render(<InfoForm />);

            // Description uses TextArea which updates on every change
            const descriptionInput = getByLabelText('Description');
            await user.clear(descriptionInput);
            await user.type(descriptionInput, 'New description');

            await waitFor(() => {
                expect(mockExecuteCommand).toHaveBeenCalled();
                const call = mockExecuteCommand.mock.calls[0][0];
                expect(call).toHaveProperty('execute');
                expect(call).toHaveProperty('undo');
                expect(call).toHaveProperty('getDescription');
                expect(call.getDescription()).toContain('description');
            });
        });
    });

    describe('Empty State', () => {
        it('should handle missing document gracefully', () => {
            mockUseDocument.mockReturnValue({
                document: null,
                format: null,
                uri: null,
                isLoading: false,
                error: null,
                documentType: null,
                isDirty: false,
                updateDocument: jest.fn(),
                markSaved: jest.fn(),
                service: {} as any
            });

            const { getByText } = render(<InfoForm />);
            expect(getByText(/no document loaded/i)).toBeInTheDocument();
        });
    });
});
