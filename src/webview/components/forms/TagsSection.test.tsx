import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagsSection } from './TagsSection';
import { useDocument } from '../../core/hooks/useDocument';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';

// Mock dependencies
jest.mock('../../core/hooks/useDocument');
jest.mock('../../core/stores/commandHistoryStore');
jest.mock('../common/SearchableTable', () => ({
    SearchableTable: ({ data, onRenderRow, onAdd, onRemoveAll, editing }: any) => (
        <div data-testid="searchable-table">
            <button onClick={onAdd} data-testid="add-button">Add</button>
            <button onClick={onRemoveAll} data-testid="remove-all-button">Remove All</button>
            <div data-testid="tag-list">
                {data.map((tag: any, idx: number) => (
                    <div key={idx} data-testid={`tag-${idx}`}>
                        {onRenderRow(tag, idx)}
                    </div>
                ))}
            </div>
        </div>
    )
}));
jest.mock('../common/InlineEdit', () => ({
    InlineEdit: ({ value }: any) => <span>{value}</span>
}));
jest.mock('../common/Markdown', () => ({
    Markdown: ({ children }: any) => <span>{children}</span>
}));

describe('TagsSection', () => {
    const mockExecuteCommand = jest.fn();
    const mockUpdateDocument = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useCommandHistoryStore as any).mockReturnValue({
            executeCommand: mockExecuteCommand
        });
    });

    it('should render tags when they exist', () => {
        const mockDocument = {
            tags: [
                { name: 'Authentication', description: 'Auth-related endpoints' },
                { name: 'Users', description: 'User management' }
            ]
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<TagsSection />);

        expect(screen.getByTestId('searchable-table')).toBeTruthy();
        expect(screen.getByTestId('tag-0')).toBeTruthy();
        expect(screen.getByTestId('tag-1')).toBeTruthy();
        expect(screen.getByText('Authentication')).toBeTruthy();
        expect(screen.getByText('Users')).toBeTruthy();
    });

    it('should render empty state when no tags exist', () => {
        const mockDocument = {
            tags: []
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<TagsSection />);

        const tagList = screen.getByTestId('tag-list');
        expect(tagList.children.length).toBe(0);
    });

    it('should handle missing document gracefully', () => {
        (useDocument as jest.Mock).mockReturnValue({
            document: null,
            updateDocument: mockUpdateDocument
        });

        const { container } = render(<TagsSection />);
        expect(container.firstChild).toBeNull();
    });

    it('should render tags array as empty when tags is undefined', () => {
        const mockDocument = {};

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<TagsSection />);

        const tagList = screen.getByTestId('tag-list');
        expect(tagList.children.length).toBe(0);
    });
});
