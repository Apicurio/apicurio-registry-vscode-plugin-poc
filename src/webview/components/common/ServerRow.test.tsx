import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServerRow } from './ServerRow';

// Mock dependencies
jest.mock('./Markdown', () => ({
    Markdown: ({ children, label }: any) => <div data-testid="markdown">{label}: {children}</div>
}));
jest.mock('./InlineEdit', () => ({
    InlineEdit: ({ value, label }: any) => <div data-testid="inline-edit">{label}: {value}</div>
}));

describe('ServerRow', () => {
    it('should render server URL and description', () => {
        render(
            <ServerRow
                id="server-1"
                url="https://api.example.com"
                description="Production server"
                editing={false}
                onRemove={() => {}}
                onChangeUrl={() => {}}
                onChangeDescription={() => {}}
            />
        );

        expect(screen.getByText(/https:\/\/api\.example\.com/)).toBeTruthy();
        expect(screen.getByText(/Production server/)).toBeTruthy();
    });

    it('should show remove button when editing', () => {
        const { container } = render(
            <ServerRow
                id="server-1"
                url="https://api.example.com"
                description="Production server"
                editing={true}
                onRemove={() => {}}
                onChangeUrl={() => {}}
                onChangeDescription={() => {}}
            />
        );

        // PatternFly Button renders with class pf-v6-c-button
        const buttons = container.querySelectorAll('.pf-v6-c-button');
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('should not show remove button when not editing', () => {
        const { container } = render(
            <ServerRow
                id="server-1"
                url="https://api.example.com"
                description="Production server"
                editing={false}
                onRemove={() => {}}
                onChangeUrl={() => {}}
                onChangeDescription={() => {}}
            />
        );

        // PatternFly Button renders with class pf-v6-c-button
        const buttons = container.querySelectorAll('.pf-v6-c-button');
        expect(buttons.length).toBe(0);
    });

    it('should pass editing state to InlineEdit and Markdown', () => {
        render(
            <ServerRow
                id="server-1"
                url="https://api.example.com"
                description="Production server"
                editing={true}
                onRemove={() => {}}
                onChangeUrl={() => {}}
                onChangeDescription={() => {}}
            />
        );

        // Both InlineEdit and Markdown should be rendered
        const inlineEdits = screen.getAllByTestId('inline-edit');
        const markdowns = screen.getAllByTestId('markdown');

        expect(inlineEdits.length).toBeGreaterThan(0);
        expect(markdowns.length).toBeGreaterThan(0);
    });
});
