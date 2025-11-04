import React from 'react';

/**
 * Props for FormSection component.
 */
export interface FormSectionProps {
    /** Section title */
    title: string;
    /** Optional description */
    description?: string;
    /** Section content */
    children: React.ReactNode;
}

/**
 * FormSection component - visual divider for form sections.
 *
 * Provides consistent styling for form sections with:
 * - Title
 * - Optional description
 * - Top border
 * - Proper spacing
 */
export const FormSection: React.FC<FormSectionProps> = ({
    title,
    description,
    children
}) => {
    return (
        <div
            style={{
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--pf-v5-global--BorderColor--100)'
            }}
        >
            <h3 style={{ marginBottom: '1rem' }}>
                {title}
            </h3>
            {description && (
                <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--pf-v5-global--Color--200)',
                    marginBottom: '1rem'
                }}>
                    {description}
                </p>
            )}
            {children}
        </div>
    );
};
