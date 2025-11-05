import React from 'react';
import { render, screen } from '@testing-library/react';
import { OperationInfoSection } from './OperationInfoSection';
import { useDocument } from '../../core/hooks/useDocument';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';

// Mock dependencies
jest.mock('../../core/hooks/useDocument');
jest.mock('../../core/stores/commandHistoryStore');
jest.mock('../common/InlineEdit', () => ({
    InlineEdit: ({ value, label }: any) => (
        <div data-testid={`inline-edit-${label}`}>{label}: {value}</div>
    )
}));
jest.mock('../common/TagLabel', () => ({
    TagLabel: ({ name }: any) => <span>{name}</span>
}));

describe('OperationInfoSection', () => {
    const mockExecuteCommand = jest.fn();
    const mockUpdateDocument = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useCommandHistoryStore as any).mockReturnValue({
            executeCommand: mockExecuteCommand
        });
    });

    it('should render operation summary, description, and operationId', () => {
        const mockDocument = {
            paths: {
                '/users': {
                    get: {
                        summary: 'Get all users',
                        description: 'Returns a list of users',
                        operationId: 'getUsers',
                        tags: ['Users']
                    }
                }
            }
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(
            <OperationInfoSection
                pathName="/users"
                operationName="get"
                editing={false}
            />
        );

        expect(screen.getByText(/Summary: Get all users/)).toBeTruthy();
        expect(screen.getByText(/Description: Returns a list of users/)).toBeTruthy();
        expect(screen.getByText(/Operation ID: getUsers/)).toBeTruthy();
    });

    it('should render tags', () => {
        const mockDocument = {
            paths: {
                '/users': {
                    get: {
                        tags: ['Users', 'Admin']
                    }
                }
            }
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(
            <OperationInfoSection
                pathName="/users"
                operationName="get"
                editing={false}
            />
        );

        expect(screen.getByText('Users')).toBeTruthy();
        expect(screen.getByText('Admin')).toBeTruthy();
    });

    it('should handle missing operation gracefully', () => {
        const mockDocument = {
            paths: {
                '/users': {}
            }
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        const { container } = render(
            <OperationInfoSection
                pathName="/users"
                operationName="get"
                editing={false}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should handle missing path gracefully', () => {
        const mockDocument = {
            paths: {}
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        const { container } = render(
            <OperationInfoSection
                pathName="/nonexistent"
                operationName="get"
                editing={false}
            />
        );

        expect(container.firstChild).toBeNull();
    });
});
