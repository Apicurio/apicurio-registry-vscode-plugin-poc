import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ProblemDrawer } from '../ProblemDrawer';
import { useValidationStore } from '../../../core/stores/validationStore';
import { useSelectionStore } from '../../../core/stores/selectionStore';

// Mock stores
jest.mock('../../../core/stores/validationStore');
jest.mock('../../../core/stores/selectionStore');

describe('ProblemDrawer', () => {
    const mockSelect = jest.fn();
    const mockUseValidationStore = useValidationStore as jest.MockedFunction<typeof useValidationStore>;
    const mockUseSelectionStore = useSelectionStore as jest.MockedFunction<typeof useSelectionStore>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock for selectionStore
        mockUseSelectionStore.mockReturnValue({
            current: { type: 'none' },
            select: mockSelect,
            clearSelection: jest.fn(),
            goBack: jest.fn(),
            goForward: jest.fn(),
            canGoBack: jest.fn(),
            canGoForward: jest.fn(),
            history: [],
            historyIndex: 0
        });
    });

    describe('Empty State', () => {
        it('should show "No problems" when there are no validation problems', () => {
            mockUseValidationStore.mockReturnValue({
                problems: [],
                isValidating: false,
                lastValidated: null,
                addProblem: jest.fn(),
                addProblems: jest.fn(),
                removeProblem: jest.fn(),
                clearProblems: jest.fn(),
                setValidating: jest.fn(),
                getProblemsBySeverity: jest.fn(() => []),
                getProblemsByPath: jest.fn(() => []),
                getErrorCount: jest.fn(() => 0),
                getWarningCount: jest.fn(() => 0),
                getInfoCount: jest.fn(() => 0),
                isValid: jest.fn(() => true)
            });

            const { getByText } = render(<ProblemDrawer />);
            expect(getByText(/no problems/i)).toBeInTheDocument();
        });
    });

    describe('Problem Display', () => {
        it('should display error problems with message', () => {
            mockUseValidationStore.mockReturnValue({
                problems: [
                    {
                        id: 'error-1',
                        severity: 'error',
                        message: 'Missing required field: title',
                        path: 'info.title'
                    }
                ],
                isValidating: false,
                lastValidated: new Date(),
                addProblem: jest.fn(),
                addProblems: jest.fn(),
                removeProblem: jest.fn(),
                clearProblems: jest.fn(),
                setValidating: jest.fn(),
                getProblemsBySeverity: jest.fn(),
                getProblemsByPath: jest.fn(),
                getErrorCount: jest.fn(() => 1),
                getWarningCount: jest.fn(() => 0),
                getInfoCount: jest.fn(() => 0),
                isValid: jest.fn(() => false)
            });

            const { getByText } = render(<ProblemDrawer />);
            expect(getByText('Missing required field: title')).toBeInTheDocument();
        });

        it('should display problem location path when available', () => {
            mockUseValidationStore.mockReturnValue({
                problems: [
                    {
                        id: 'error-1',
                        severity: 'error',
                        message: 'Missing required field',
                        path: 'paths./users.get.responses.200'
                    }
                ],
                isValidating: false,
                lastValidated: new Date(),
                addProblem: jest.fn(),
                addProblems: jest.fn(),
                removeProblem: jest.fn(),
                clearProblems: jest.fn(),
                setValidating: jest.fn(),
                getProblemsBySeverity: jest.fn(),
                getProblemsByPath: jest.fn(),
                getErrorCount: jest.fn(() => 1),
                getWarningCount: jest.fn(() => 0),
                getInfoCount: jest.fn(() => 0),
                isValid: jest.fn(() => false)
            });

            const { getByText } = render(<ProblemDrawer />);
            expect(getByText('paths./users.get.responses.200')).toBeInTheDocument();
        });
    });

    describe('Problem Interaction', () => {
        it('should call select when clicking on a problem', async () => {
            const user = userEvent.setup();
            mockUseValidationStore.mockReturnValue({
                problems: [
                    {
                        id: 'error-1',
                        severity: 'error',
                        message: 'Missing required field: title',
                        path: 'info.title'
                    }
                ],
                isValidating: false,
                lastValidated: new Date(),
                addProblem: jest.fn(),
                addProblems: jest.fn(),
                removeProblem: jest.fn(),
                clearProblems: jest.fn(),
                setValidating: jest.fn(),
                getProblemsBySeverity: jest.fn(),
                getProblemsByPath: jest.fn(),
                getErrorCount: jest.fn(() => 1),
                getWarningCount: jest.fn(() => 0),
                getInfoCount: jest.fn(() => 0),
                isValid: jest.fn(() => false)
            });

            const { getByText } = render(<ProblemDrawer />);
            const problemItem = getByText('Missing required field: title');
            await user.click(problemItem.closest('li') || problemItem);

            expect(mockSelect).toHaveBeenCalledWith({
                type: 'info',
                path: 'info.title',
                context: expect.any(Object)
            });
        });

        it('should parse path and set correct selection type for operations', async () => {
            const user = userEvent.setup();
            mockUseValidationStore.mockReturnValue({
                problems: [
                    {
                        id: 'error-1',
                        severity: 'error',
                        message: 'Invalid operation',
                        path: 'paths./users.get'
                    }
                ],
                isValidating: false,
                lastValidated: new Date(),
                addProblem: jest.fn(),
                addProblems: jest.fn(),
                removeProblem: jest.fn(),
                clearProblems: jest.fn(),
                setValidating: jest.fn(),
                getProblemsBySeverity: jest.fn(),
                getProblemsByPath: jest.fn(),
                getErrorCount: jest.fn(() => 1),
                getWarningCount: jest.fn(() => 0),
                getInfoCount: jest.fn(() => 0),
                isValid: jest.fn(() => false)
            });

            const { getByText } = render(<ProblemDrawer />);
            const problemItem = getByText('Invalid operation');
            await user.click(problemItem.closest('li') || problemItem);

            expect(mockSelect).toHaveBeenCalledWith({
                type: 'operation',
                path: '/users',
                context: expect.objectContaining({ method: 'get' })
            });
        });
    });

    describe('Problem Count Summary', () => {
        it('should display problem count summary', () => {
            mockUseValidationStore.mockReturnValue({
                problems: [
                    { id: '1', severity: 'error', message: 'Error 1' },
                    { id: '2', severity: 'error', message: 'Error 2' },
                    { id: '3', severity: 'warning', message: 'Warning 1' }
                ],
                isValidating: false,
                lastValidated: new Date(),
                addProblem: jest.fn(),
                addProblems: jest.fn(),
                removeProblem: jest.fn(),
                clearProblems: jest.fn(),
                setValidating: jest.fn(),
                getProblemsBySeverity: jest.fn(),
                getProblemsByPath: jest.fn(),
                getErrorCount: jest.fn(() => 2),
                getWarningCount: jest.fn(() => 1),
                getInfoCount: jest.fn(() => 0),
                isValid: jest.fn(() => false)
            });

            const { getByText } = render(<ProblemDrawer />);
            expect(getByText(/2.*error/i)).toBeInTheDocument();
            expect(getByText(/1.*warning/i)).toBeInTheDocument();
        });
    });

    describe('Validating State', () => {
        it('should show validating indicator when validation is running', () => {
            mockUseValidationStore.mockReturnValue({
                problems: [],
                isValidating: true,
                lastValidated: null,
                addProblem: jest.fn(),
                addProblems: jest.fn(),
                removeProblem: jest.fn(),
                clearProblems: jest.fn(),
                setValidating: jest.fn(),
                getProblemsBySeverity: jest.fn(),
                getProblemsByPath: jest.fn(),
                getErrorCount: jest.fn(() => 0),
                getWarningCount: jest.fn(() => 0),
                getInfoCount: jest.fn(() => 0),
                isValid: jest.fn(() => true)
            });

            const { getByText } = render(<ProblemDrawer />);
            expect(getByText(/validating/i)).toBeInTheDocument();
        });
    });
});
