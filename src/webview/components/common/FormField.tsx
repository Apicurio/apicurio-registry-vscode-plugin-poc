import React from 'react';
import { FormGroup } from '@patternfly/react-core';

/**
 * Props for FormField component.
 */
export interface FormFieldProps {
    /** Field label */
    label: string;
    /** Field ID (must match child input id) */
    fieldId: string;
    /** Whether field is required */
    isRequired?: boolean;
    /** Error message to display */
    error?: string;
    /** Helper text to display when no error */
    helperText?: string;
    /** Child input element */
    children: React.ReactNode;
}

/**
 * FormField component - reusable wrapper for form fields.
 *
 * Provides consistent styling for:
 * - Label display
 * - Required indicator
 * - Error messages
 * - Helper text
 *
 * Integrates with PatternFly FormGroup.
 */
export const FormField: React.FC<FormFieldProps> = ({
    label,
    fieldId,
    isRequired,
    error,
    helperText,
    children
}) => {
    return (
        <FormGroup
            label={label}
            isRequired={isRequired}
            fieldId={fieldId}
        >
            {error && (
                <div style={{
                    color: 'var(--pf-v5-global--danger-color--100)',
                    fontSize: '0.875rem',
                    marginTop: '0.25rem'
                }}>
                    {error}
                </div>
            )}
            {!error && helperText && (
                <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--pf-v5-global--Color--200)',
                    marginTop: '0.25rem'
                }}>
                    {helperText}
                </div>
            )}
            {children}
        </FormGroup>
    );
};
