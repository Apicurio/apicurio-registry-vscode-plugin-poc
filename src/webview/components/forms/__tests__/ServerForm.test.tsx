import React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ServerForm, ServerFormProps } from '../ServerForm';
import { useCommandHistoryStore } from '../../../core/stores/commandHistoryStore';

// Mock command history store
jest.mock('../../../core/stores/commandHistoryStore');

describe('ServerForm', () => {
    const mockExecuteCommand = jest.fn();
    const mockUseCommandHistoryStore = useCommandHistoryStore as jest.MockedFunction<typeof useCommandHistoryStore>;

    const defaultServer = {
        url: 'https://api.example.com/v1',
        description: 'Production server'
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock for command history store
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
    });

    describe('Form Display', () => {
        it('should render form with server values', () => {
            const { getByDisplayValue } = render(
                <ServerForm server={defaultServer} onChange={jest.fn()} />
            );

            expect(getByDisplayValue('https://api.example.com/v1')).toBeInTheDocument();
            expect(getByDisplayValue('Production server')).toBeInTheDocument();
        });

        it('should render empty form when no server provided', () => {
            const { getByLabelText } = render(
                <ServerForm server={null} onChange={jest.fn()} />
            );

            const urlInput = getByLabelText(/url/i) as HTMLInputElement;
            expect(urlInput.value).toBe('');
        });
    });

    describe('Form Editing', () => {
        it('should allow editing URL field', async () => {
            const user = userEvent.setup();
            const { getByDisplayValue } = render(
                <ServerForm server={defaultServer} onChange={jest.fn()} />
            );

            const urlInput = getByDisplayValue('https://api.example.com/v1');
            await user.clear(urlInput);
            await user.type(urlInput, 'https://api.example.com/v2');

            expect(urlInput).toHaveValue('https://api.example.com/v2');
        });

        it('should allow editing description field', async () => {
            const user = userEvent.setup();
            const { getByDisplayValue } = render(
                <ServerForm server={defaultServer} onChange={jest.fn()} />
            );

            const descInput = getByDisplayValue('Production server');
            await user.clear(descInput);
            await user.type(descInput, 'Staging server');

            expect(descInput).toHaveValue('Staging server');
        });
    });

    describe('Form Validation', () => {
        it('should show error when URL is empty', async () => {
            const user = userEvent.setup();
            const { getByDisplayValue, findByText } = render(
                <ServerForm server={defaultServer} onChange={jest.fn()} />
            );

            const urlInput = getByDisplayValue('https://api.example.com/v1');
            await user.clear(urlInput);
            await user.tab();

            const errorMessage = await findByText(/url is required/i);
            expect(errorMessage).toBeInTheDocument();
        });

        it('should validate URL format', async () => {
            const user = userEvent.setup();
            const { getByDisplayValue, findByText } = render(
                <ServerForm server={defaultServer} onChange={jest.fn()} />
            );

            const urlInput = getByDisplayValue('https://api.example.com/v1');
            await user.clear(urlInput);
            await user.type(urlInput, 'not-a-url');
            await user.tab();

            const errorMessage = await findByText(/invalid url/i);
            expect(errorMessage).toBeInTheDocument();
        });
    });

    describe('onChange Integration', () => {
        it('should call onChange when URL changes', async () => {
            const onChange = jest.fn();
            const user = userEvent.setup();
            const { getByDisplayValue } = render(
                <ServerForm server={defaultServer} onChange={onChange} />
            );

            const urlInput = getByDisplayValue('https://api.example.com/v1');
            await user.clear(urlInput);
            await user.type(urlInput, 'https://api.example.com/v2');
            await user.tab();

            await waitFor(() => {
                expect(onChange).toHaveBeenCalledWith(
                    expect.objectContaining({
                        url: 'https://api.example.com/v2'
                    })
                );
            });
        });

        it('should call onChange when description changes', async () => {
            const onChange = jest.fn();
            const user = userEvent.setup();
            const { getByDisplayValue } = render(
                <ServerForm server={defaultServer} onChange={onChange} />
            );

            const descInput = getByDisplayValue('Production server');
            await user.clear(descInput);
            await user.type(descInput, 'Staging server');
            await user.tab();

            await waitFor(() => {
                expect(onChange).toHaveBeenCalledWith(
                    expect.objectContaining({
                        description: 'Staging server'
                    })
                );
            });
        });
    });

    describe('Command Integration', () => {
        it('should execute UpdateServerCommand when form changes', async () => {
            const onChange = jest.fn();
            const user = userEvent.setup();
            const { getByDisplayValue } = render(
                <ServerForm server={defaultServer} onChange={onChange} />
            );

            const urlInput = getByDisplayValue('https://api.example.com/v1');
            await user.clear(urlInput);
            await user.type(urlInput, 'https://api.example.com/v2');
            await user.tab();

            await waitFor(() => {
                expect(mockExecuteCommand).toHaveBeenCalled();
                const call = mockExecuteCommand.mock.calls[0][0];
                expect(call).toHaveProperty('execute');
                expect(call).toHaveProperty('undo');
                expect(call).toHaveProperty('getDescription');
                expect(call.getDescription()).toContain('Update server');
            });
        });
    });
});
