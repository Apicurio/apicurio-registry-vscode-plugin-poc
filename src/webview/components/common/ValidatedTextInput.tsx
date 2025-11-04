import React from 'react';
import { TextInput } from '@patternfly/react-core';
import { FormField } from './FormField';

/**
 * Props for ValidatedTextInput component.
 */
export interface ValidatedTextInputProps {
    /** Field label */
    label: string;
    /** Field ID */
    fieldId: string;
    /** Current value */
    value: string;
    /** Change handler */
    onChange: (value: string) => void;
    /** Blur handler */
    onBlur?: () => void;
    /** Whether field is required */
    isRequired?: boolean;
    /** Error message */
    error?: string;
    /** Helper text */
    helperText?: string;
    /** Input type */
    type?: 'text' | 'email' | 'url' | 'password';
    /** Placeholder text */
    placeholder?: string;
}

/**
 * ValidatedTextInput component - reusable text input with validation.
 *
 * Combines FormField with TextInput for common use case.
 */
export const ValidatedTextInput: React.FC<ValidatedTextInputProps> = ({
    label,
    fieldId,
    value,
    onChange,
    onBlur,
    isRequired,
    error,
    helperText,
    type = 'text',
    placeholder
}) => {
    return (
        <FormField
            label={label}
            fieldId={fieldId}
            isRequired={isRequired}
            error={error}
            helperText={helperText}
        >
            <TextInput
                id={fieldId}
                type={type}
                value={value}
                onChange={(_event, value) => onChange(value)}
                onBlur={onBlur}
                validated={error ? 'error' : 'default'}
                placeholder={placeholder}
                aria-invalid={error ? true : false}
            />
        </FormField>
    );
};
