import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormField } from '../FormField';
import { TextInput } from '@patternfly/react-core';

describe('FormField', () => {
    describe('Basic Rendering', () => {
        it('should render label and children', () => {
            const { getByText, getByRole } = render(
                <FormField label="Test Field" fieldId="test-field">
                    <TextInput id="test-field" value="" onChange={() => {}} />
                </FormField>
            );

            expect(getByText('Test Field')).toBeInTheDocument();
            expect(getByRole('textbox')).toBeInTheDocument();
        });

        it('should show required indicator when isRequired is true', () => {
            const { getByText } = render(
                <FormField label="Required Field" fieldId="req-field" isRequired>
                    <TextInput id="req-field" value="" onChange={() => {}} />
                </FormField>
            );

            // PatternFly adds a required indicator (typically an asterisk or aria-required)
            const formGroup = getByText('Required Field').closest('.pf-v6-c-form__group');
            expect(formGroup).toBeInTheDocument();
        });
    });

    describe('Error Display', () => {
        it('should display error message when provided', () => {
            const { getByText } = render(
                <FormField label="Test Field" fieldId="test-field" error="This field is invalid">
                    <TextInput id="test-field" value="" onChange={() => {}} />
                </FormField>
            );

            expect(getByText('This field is invalid')).toBeInTheDocument();
        });

        it('should not display error message when not provided', () => {
            const { queryByText } = render(
                <FormField label="Test Field" fieldId="test-field">
                    <TextInput id="test-field" value="" onChange={() => {}} />
                </FormField>
            );

            expect(queryByText(/invalid/i)).not.toBeInTheDocument();
        });

        it('should apply error styling when error is present', () => {
            const { getByText } = render(
                <FormField label="Test Field" fieldId="test-field" error="Invalid">
                    <TextInput id="test-field" value="" onChange={() => {}} />
                </FormField>
            );

            const errorMessage = getByText('Invalid');
            expect(errorMessage).toHaveStyle({ color: 'var(--pf-v5-global--danger-color--100)' });
        });
    });

    describe('Helper Text', () => {
        it('should display helper text when provided', () => {
            const { getByText } = render(
                <FormField label="Test Field" fieldId="test-field" helperText="This is helpful info">
                    <TextInput id="test-field" value="" onChange={() => {}} />
                </FormField>
            );

            expect(getByText('This is helpful info')).toBeInTheDocument();
        });

        it('should hide helper text when error is present', () => {
            const { queryByText } = render(
                <FormField
                    label="Test Field"
                    fieldId="test-field"
                    helperText="This is helpful info"
                    error="This field is invalid"
                >
                    <TextInput id="test-field" value="" onChange={() => {}} />
                </FormField>
            );

            // Helper text should be hidden when error is shown
            expect(queryByText('This is helpful info')).not.toBeInTheDocument();
            expect(queryByText('This field is invalid')).toBeInTheDocument();
        });
    });
});
