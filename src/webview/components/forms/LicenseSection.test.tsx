import React from 'react';
import { render, screen } from '@testing-library/react';
import { LicenseSection } from './LicenseSection';
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

describe('LicenseSection', () => {
    const mockExecuteCommand = jest.fn();
    const mockUpdateDocument = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useCommandHistoryStore as any).mockReturnValue({
            executeCommand: mockExecuteCommand
        });
    });

    it('should render license fields when license info exists', () => {
        const mockDocument = {
            info: {
                license: {
                    name: 'MIT',
                    url: 'https://opensource.org/licenses/MIT'
                }
            }
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<LicenseSection />);

        const inputs = screen.getAllByTestId('inline-edit');
        expect(inputs).toHaveLength(2);
        expect((inputs[0] as HTMLInputElement).value).toBe('MIT');
        expect((inputs[1] as HTMLInputElement).value).toBe('https://opensource.org/licenses/MIT');
    });

    it('should render empty fields when license info does not exist', () => {
        const mockDocument = {
            info: {}
        };

        (useDocument as jest.Mock).mockReturnValue({
            document: mockDocument,
            updateDocument: mockUpdateDocument
        });

        render(<LicenseSection />);

        const inputs = screen.getAllByTestId('inline-edit');
        expect(inputs).toHaveLength(2);
        expect((inputs[0] as HTMLInputElement).value).toBe('');
        expect((inputs[1] as HTMLInputElement).value).toBe('');
    });

    it('should handle missing document gracefully', () => {
        (useDocument as jest.Mock).mockReturnValue({
            document: null,
            updateDocument: mockUpdateDocument
        });

        const { container } = render(<LicenseSection />);
        expect(container.firstChild).toBeNull();
    });
});
