import React from 'react';
import { TextArea } from '@patternfly/react-core';
import { FormField } from './FormField';

/**
 * Props for ValidatedTextArea component.
 */
export interface ValidatedTextAreaProps {
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
    /** Placeholder text */
    placeholder?: string;
    /** Number of rows */
    rows?: number;
}

/**
 * ValidatedTextArea component - reusable text area with validation.
 *
 * Combines FormField with TextArea for common use case.
 */
export const ValidatedTextArea: React.FC<ValidatedTextAreaProps> = ({
    label,
    fieldId,
    value,
    onChange,
    onBlur,
    isRequired,
    error,
    helperText,
    placeholder,
    rows = 3
}) => {
    return (
        <FormField
            label={label}
            fieldId={fieldId}
            isRequired={isRequired}
            error={error}
            helperText={helperText}
        >
            <TextArea
                id={fieldId}
                value={value}
                onChange={(_event, value) => onChange(value)}
                onBlur={onBlur}
                validated={error ? 'error' : 'default'}
                placeholder={placeholder}
                rows={rows}
                aria-invalid={error ? true : false}
            />
        </FormField>
    );
};
