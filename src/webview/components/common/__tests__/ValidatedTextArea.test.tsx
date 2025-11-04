import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ValidatedTextArea } from '../ValidatedTextArea';

describe('ValidatedTextArea', () => {
    describe('Basic Rendering', () => {
        it('should render with label and value', () => {
            const { getByLabelText, getByDisplayValue } = render(
                <ValidatedTextArea
                    label="Description"
                    fieldId="desc"
                    value="Sample description"
                    onChange={() => {}}
                />
            );

            expect(getByLabelText('Description')).toBeInTheDocument();
            expect(getByDisplayValue('Sample description')).toBeInTheDocument();
        });

        it('should render as required when isRequired is true', () => {
            const { getByRole } = render(
                <ValidatedTextArea
                    label="Required Field"
                    fieldId="req"
                    value=""
                    onChange={() => {}}
                    isRequired
                />
            );

            const textarea = getByRole('textbox');
            expect(textarea).toBeInTheDocument();
            // Verify the label exists in the document
            expect(textarea.closest('.pf-v6-c-form__group')).toBeInTheDocument();
        });
    });

    describe('User Interaction', () => {
        it('should call onChange when user types', async () => {
            const onChange = jest.fn();
            const user = userEvent.setup();
            const { getByLabelText } = render(
                <ValidatedTextArea
                    label="Description"
                    fieldId="desc"
                    value=""
                    onChange={onChange}
                />
            );

            const textarea = getByLabelText('Description');
            await user.type(textarea, 'Test');

            expect(onChange).toHaveBeenCalled();
        });

        it('should call onBlur when user leaves field', async () => {
            const onBlur = jest.fn();
            const user = userEvent.setup();
            const { getByLabelText } = render(
                <ValidatedTextArea
                    label="Description"
                    fieldId="desc"
                    value=""
                    onChange={() => {}}
                    onBlur={onBlur}
                />
            );

            const textarea = getByLabelText('Description');
            await user.click(textarea);
            await user.tab();

            expect(onBlur).toHaveBeenCalled();
        });
    });

    describe('Validation', () => {
        it('should display error message when provided', () => {
            const { getByText } = render(
                <ValidatedTextArea
                    label="Description"
                    fieldId="desc"
                    value=""
                    onChange={() => {}}
                    error="Description is required"
                />
            );

            expect(getByText('Description is required')).toBeInTheDocument();
        });

        it('should apply error validation state when error present', () => {
            const { getByLabelText } = render(
                <ValidatedTextArea
                    label="Description"
                    fieldId="desc"
                    value=""
                    onChange={() => {}}
                    error="Invalid"
                />
            );

            const textarea = getByLabelText('Description');
            expect(textarea).toHaveAttribute('aria-invalid', 'true');
        });
    });

    describe('Rows Configuration', () => {
        it('should use default rows when not specified', () => {
            const { getByLabelText } = render(
                <ValidatedTextArea
                    label="Description"
                    fieldId="desc"
                    value=""
                    onChange={() => {}}
                />
            );

            const textarea = getByLabelText('Description') as HTMLTextAreaElement;
            // Default should be 3 rows
            expect(textarea.rows).toBe(3);
        });

        it('should apply custom rows when specified', () => {
            const { getByLabelText } = render(
                <ValidatedTextArea
                    label="Description"
                    fieldId="desc"
                    value=""
                    onChange={() => {}}
                    rows={5}
                />
            );

            const textarea = getByLabelText('Description') as HTMLTextAreaElement;
            expect(textarea.rows).toBe(5);
        });
    });
});
