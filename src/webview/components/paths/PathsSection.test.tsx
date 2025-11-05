import React from 'react';
import { render, screen } from '@testing-library/react';
import { PathsSection } from './PathsSection';
import { useDocument } from '../../core/hooks/useDocument';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';

// Mock dependencies
jest.mock('../../core/hooks/useDocument');
jest.mock('../../core/stores/commandHistoryStore');
jest.mock('../common/Markdown', () => ({
    Markdown: ({ children }: any) => <div>{children}</div>
}));
jest.mock('../common/AccordionSection', () => ({
    AccordionSection: ({ children }: any) => <div>{children}</div>
}));
jest.mock('../common/OperationLabel', () => ({
    OperationLabel: ({ name }: any) => <span>{name.toUpperCase()}</span>
}));
jest.mock('../common/StatusCodeLabel', () => ({
    StatusCodeLabel: ({ code }: any) => <span>{code}</span>
}));
jest.mock('../common/TagLabel', () => ({
    TagLabel: ({ name }: any) => <span>{name}</span>
}));

describe('PathsSection', () => {
    const mockExecuteCommand = jest.fn();
    const mockUpdateDocument = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useCommandHistoryStore as any).mockReturnValue({
            executeCommand: mockExecuteCommand
        });
    });

    it('should render paths when they exist', () => {
        const mockDocument = {
            paths: {
                '/users': {
                    summary: 'User operations',
                    get: {
                        summary: 'Get all users',
                        operationId: 'getUsers'
                    }
                },
                '/users/{id}': {
                    summary: 'Single user operations',
                    get: {
                        summary: 'Get user by ID',
                        operationId: 'getUserById'
                    }
                }
            }
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<PathsSection />);

        expect(screen.getByText('/users')).toBeTruthy();
        expect(screen.getByText('/users/{id}')).toBeTruthy();
    });

    it('should render empty state when no paths exist', () => {
        const mockDocument = {
            paths: {}
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<PathsSection />);

        expect(screen.getByText(/No paths/i)).toBeTruthy();
    });

    it('should handle missing document gracefully', () => {
        (useDocument as jest.Mock).mockReturnValue({
            document: null,
            updateDocument: mockUpdateDocument
        });

        const { container } = render(<PathsSection />);
        expect(container.firstChild).toBeNull();
    });

    it('should handle undefined paths', () => {
        const mockDocument = {};

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<PathsSection />);

        expect(screen.getByText(/No paths/i)).toBeTruthy();
    });
});
