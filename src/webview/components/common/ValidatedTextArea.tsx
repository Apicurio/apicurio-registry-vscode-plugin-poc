import React from 'react';

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
    // Placeholder implementation
    return <div>ValidatedTextArea placeholder</div>;
};
