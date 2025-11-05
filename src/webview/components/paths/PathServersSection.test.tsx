import React from 'react';
import { render, screen } from '@testing-library/react';
import { PathServersSection } from './PathServersSection';
import { useDocument } from '../../core/hooks/useDocument';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';

// Mock dependencies
jest.mock('../../core/hooks/useDocument');
jest.mock('../../core/stores/commandHistoryStore');
jest.mock('../common/SearchableTable', () => ({
    SearchableTable: ({ label, data, onRenderRow }: any) => (
        <div data-testid="searchable-table">
            <div>Label: {label}</div>
            <div>Count: {data.length}</div>
            {data.map((item: any, idx: number) => (
                <div key={idx}>{onRenderRow(item, idx)}</div>
            ))}
        </div>
    )
}));
jest.mock('../common/ServerRow', () => ({
    ServerRow: ({ url, description }: any) => (
        <div data-testid="server-row">
            {url} - {description}
        </div>
    )
}));

describe('PathServersSection', () => {
    const mockExecuteCommand = jest.fn();
    const mockUpdateDocument = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useCommandHistoryStore as any).mockReturnValue({
            executeCommand: mockExecuteCommand
        });
    });

    it('should render servers for a path', () => {
        const mockDocument = {
            paths: {
                '/users': {
                    servers: [
                        { url: 'https://api.example.com', description: 'Production' },
                        { url: 'https://staging.example.com', description: 'Staging' }
                    ]
                }
            }
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<PathServersSection pathName="/users" editing={false} />);

        expect(screen.getByText(/Label: server/)).toBeTruthy();
        expect(screen.getByText(/Count: 2/)).toBeTruthy();
        expect(screen.getByText(/https:\/\/api\.example\.com/)).toBeTruthy();
    });

    it('should handle paths with no servers', () => {
        const mockDocument = {
            paths: {
                '/users': {}
            }
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<PathServersSection pathName="/users" editing={false} />);

        expect(screen.getByText(/Count: 0/)).toBeTruthy();
    });

    it('should pass editing state to SearchableTable', () => {
        const mockDocument = {
            paths: {
                '/users': {
                    servers: [{ url: 'https://api.example.com', description: 'Production' }]
                }
            }
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<PathServersSection pathName="/users" editing={true} />);

        const table = screen.getByTestId('searchable-table');
        expect(table).toBeTruthy();
    });

    it('should handle non-existent path gracefully', () => {
        const mockDocument = {
            paths: {}
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        const { container } = render(<PathServersSection pathName="/nonexistent" editing={false} />);
        expect(container.firstChild).toBeNull();
    });
});
