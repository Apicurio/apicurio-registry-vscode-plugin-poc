import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormSection } from '../FormSection';

describe('FormSection', () => {
    describe('Basic Rendering', () => {
        it('should render title and children', () => {
            const { getByText } = render(
                <FormSection title="Contact Information">
                    <div>Form fields here</div>
                </FormSection>
            );

            expect(getByText('Contact Information')).toBeInTheDocument();
            expect(getByText('Form fields here')).toBeInTheDocument();
        });

        it('should render with h3 title by default', () => {
            const { getByText } = render(
                <FormSection title="Section Title">
                    <div>Content</div>
                </FormSection>
            );

            const title = getByText('Section Title');
            expect(title.tagName).toBe('H3');
        });
    });

    describe('Styling', () => {
        it('should apply top border and padding', () => {
            const { getByText } = render(
                <FormSection title="Section">
                    <div>Content</div>
                </FormSection>
            );

            const section = getByText('Section').parentElement;
            expect(section).toHaveStyle({
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--pf-v5-global--BorderColor--100)'
            });
        });

        it('should have proper spacing for title', () => {
            const { getByText } = render(
                <FormSection title="Section">
                    <div>Content</div>
                </FormSection>
            );

            const title = getByText('Section');
            expect(title).toHaveStyle({ marginBottom: '1rem' });
        });
    });

    describe('Optional Description', () => {
        it('should render description when provided', () => {
            const { getByText } = render(
                <FormSection
                    title="Contact Information"
                    description="Enter your contact details below"
                >
                    <div>Form fields</div>
                </FormSection>
            );

            expect(getByText('Enter your contact details below')).toBeInTheDocument();
        });

        it('should not render description when not provided', () => {
            const { queryByText } = render(
                <FormSection title="Contact Information">
                    <div>Form fields</div>
                </FormSection>
            );

            // Should only have title, no description paragraph
            const section = queryByText('Contact Information')?.parentElement;
            const paragraphs = section?.querySelectorAll('p');
            expect(paragraphs?.length).toBe(0);
        });
    });
});
