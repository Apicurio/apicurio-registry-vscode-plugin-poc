import React from 'react';
import { render, screen } from '@testing-library/react';
import { PathInfoSection } from './PathInfoSection';
import { useDocument } from '../../core/hooks/useDocument';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';

// Mock dependencies
jest.mock('../../core/hooks/useDocument');
jest.mock('../../core/stores/commandHistoryStore');
jest.mock('../common/InlineEdit', () => ({
    InlineEdit: ({ value, label, editing }: any) => (
        <div data-testid={`inline-edit-${label}`}>
            {label}: {value} (editing: {editing ? 'yes' : 'no'})
        </div>
    )
}));

describe('PathInfoSection', () => {
    const mockExecuteCommand = jest.fn();
    const mockUpdateDocument = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useCommandHistoryStore as any).mockReturnValue({
            executeCommand: mockExecuteCommand
        });
    });

    it('should render path summary and description', () => {
        const mockDocument = {
            paths: {
                '/users': {
                    summary: 'User operations',
                    description: 'Endpoints for managing users',
                    get: {}
                }
            }
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<PathInfoSection pathName="/users" editing={false} />);

        expect(screen.getByText(/Summary: User operations/)).toBeTruthy();
        expect(screen.getByText(/Description: Endpoints for managing users/)).toBeTruthy();
    });

    it('should show editing state when editing prop is true', () => {
        const mockDocument = {
            paths: {
                '/users': {
                    summary: 'User operations',
                    description: 'Endpoints for managing users'
                }
            }
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<PathInfoSection pathName="/users" editing={true} />);

        const summaryEdit = screen.getByTestId('inline-edit-Summary');
        expect(summaryEdit.textContent).toContain('editing: yes');
    });

    it('should handle missing summary and description', () => {
        const mockDocument = {
            paths: {
                '/users': {}
            }
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<PathInfoSection pathName="/users" editing={false} />);

        // Should still render InlineEdit components with empty values
        const inlineEdits = screen.getAllByTestId(/inline-edit/);
        expect(inlineEdits.length).toBe(2);
    });

    it('should handle non-existent path gracefully', () => {
        const mockDocument = {
            paths: {}
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        const { container } = render(<PathInfoSection pathName="/nonexistent" editing={false} />);
        expect(container.firstChild).toBeNull();
    });
});
