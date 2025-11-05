import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContactSection } from './ContactSection';
import { useDocument } from '../../core/hooks/useDocument';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';

// Mock dependencies
jest.mock('../../core/hooks/useDocument');
jest.mock('../../core/stores/commandHistoryStore');
jest.mock('../common/InlineEdit', () => ({
    InlineEdit: ({ value, onChange }: any) => (
        <input
            data-testid="inline-edit"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}));

describe('ContactSection', () => {
    const mockExecuteCommand = jest.fn();
    const mockUpdateDocument = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useCommandHistoryStore as any).mockReturnValue({
            executeCommand: mockExecuteCommand
        });
    });

    it('should render contact fields when contact info exists', () => {
        const mockDocument = {
            info: {
                contact: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    url: 'https://example.com'
                }
            }
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<ContactSection />);

        const inputs = screen.getAllByTestId('inline-edit');
        expect(inputs).toHaveLength(3);
        expect((inputs[0] as HTMLInputElement).value).toBe('John Doe');
        expect((inputs[1] as HTMLInputElement).value).toBe('https://example.com');
        expect((inputs[2] as HTMLInputElement).value).toBe('john@example.com');
    });

    it('should render empty fields when contact info does not exist', () => {
        const mockDocument = {
            info: {}
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<ContactSection />);

        const inputs = screen.getAllByTestId('inline-edit');
        expect(inputs).toHaveLength(3);
        expect((inputs[0] as HTMLInputElement).value).toBe('');
        expect((inputs[1] as HTMLInputElement).value).toBe('');
        expect((inputs[2] as HTMLInputElement).value).toBe('');
    });

    it('should handle missing document gracefully', () => {
        (useDocument as jest.Mock).mockReturnValue({
            document: null,
            updateDocument: mockUpdateDocument
        });

        const { container } = render(<ContactSection />);
        expect(container.firstChild).toBeNull();
    });
});
