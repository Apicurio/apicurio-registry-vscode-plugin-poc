import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ValidatedTextInput } from '../ValidatedTextInput';

describe('ValidatedTextInput', () => {
    describe('Basic Rendering', () => {
        it('should render with label and value', () => {
            const { getByLabelText, getByDisplayValue } = render(
                <ValidatedTextInput
                    label="Name"
                    fieldId="name"
                    value="John Doe"
                    onChange={() => {}}
                />
            );

            expect(getByLabelText('Name')).toBeInTheDocument();
            expect(getByDisplayValue('John Doe')).toBeInTheDocument();
        });

        it('should render as required when isRequired is true', () => {
            const { getByLabelText } = render(
                <ValidatedTextInput
                    label="Required Field"
                    fieldId="req"
                    value=""
                    onChange={() => {}}
                    isRequired
                />
            );

            const input = getByLabelText('Required Field');
            expect(input).toBeInTheDocument();
        });
    });

    describe('User Interaction', () => {
        it('should call onChange when user types', async () => {
            const onChange = jest.fn();
            const user = userEvent.setup();
            const { getByLabelText } = render(
                <ValidatedTextInput
                    label="Name"
                    fieldId="name"
                    value=""
                    onChange={onChange}
                />
            );

            const input = getByLabelText('Name');
            await user.type(input, 'Test');

            expect(onChange).toHaveBeenCalled();
        });

        it('should call onBlur when user leaves field', async () => {
            const onBlur = jest.fn();
            const user = userEvent.setup();
            const { getByLabelText } = render(
                <ValidatedTextInput
                    label="Name"
                    fieldId="name"
                    value=""
                    onChange={() => {}}
                    onBlur={onBlur}
                />
            );

            const input = getByLabelText('Name');
            await user.click(input);
            await user.tab();

            expect(onBlur).toHaveBeenCalled();
        });
    });

    describe('Validation', () => {
        it('should display error message when provided', () => {
            const { getByText } = render(
                <ValidatedTextInput
                    label="Name"
                    fieldId="name"
                    value=""
                    onChange={() => {}}
                    error="Name is required"
                />
            );

            expect(getByText('Name is required')).toBeInTheDocument();
        });

        it('should apply error validation state when error present', () => {
            const { getByLabelText } = render(
                <ValidatedTextInput
                    label="Name"
                    fieldId="name"
                    value=""
                    onChange={() => {}}
                    error="Invalid"
                />
            );

            const input = getByLabelText('Name');
            expect(input).toHaveAttribute('aria-invalid', 'true');
        });
    });

    describe('Helper Text', () => {
        it('should display helper text when provided', () => {
            const { getByText } = render(
                <ValidatedTextInput
                    label="Name"
                    fieldId="name"
                    value=""
                    onChange={() => {}}
                    helperText="Enter your full name"
                />
            );

            expect(getByText('Enter your full name')).toBeInTheDocument();
        });
    });

    describe('Input Types', () => {
        it('should support type="email"', () => {
            const { getByLabelText } = render(
                <ValidatedTextInput
                    label="Email"
                    fieldId="email"
                    value=""
                    onChange={() => {}}
                    type="email"
                />
            );

            const input = getByLabelText('Email');
            expect(input).toHaveAttribute('type', 'email');
        });

        it('should support type="url"', () => {
            const { getByLabelText } = render(
                <ValidatedTextInput
                    label="Website"
                    fieldId="website"
                    value=""
                    onChange={() => {}}
                    type="url"
                />
            );

            const input = getByLabelText('Website');
            expect(input).toHaveAttribute('type', 'url');
        });
    });
});
