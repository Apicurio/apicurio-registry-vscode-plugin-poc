import React from 'react';
import {
    DescriptionList,
    DescriptionListGroup,
    DescriptionListTerm,
    DescriptionListDescription,
    TextArea,
    Accordion
} from '@patternfly/react-core';
import { useDocument } from '../../core/hooks/useDocument';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';
import { InlineEdit } from '../common/InlineEdit';
import { AccordionSection } from '../common/AccordionSection';
import { ContactSection } from './ContactSection';
import { LicenseSection } from './LicenseSection';

/**
 * InfoForm component for editing OpenAPI/AsyncAPI info section.
 *
 * Refactored to use apicurio-editors patterns:
 * - DescriptionList layout (cleaner than stacked FormGroups)
 * - InlineEdit for simple fields (click-to-edit UX)
 * - TextArea for description (Markdown coming later)
 * - Simpler code, better UX
 *
 * Displays and allows editing of:
 * - Title (required)
 * - Version (required)
 * - Description
 * - Terms of Service
 * - Contact (name, url, email)
 * - License (name, url)
 */
export const InfoForm: React.FC = () => {
    const { document, updateDocument } = useDocument();
    const { executeCommand } = useCommandHistoryStore();

    // Get info object from document
    const info = (document as any)?.info;

    // Handle missing document
    if (!document) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>No document loaded</p>
            </div>
        );
    }

    /**
     * Update a field in the info object.
     *
     * Note: We mutate the document directly because @apicurio/data-models
     * documents are designed to be mutable. Cloning would lose all methods.
     */
    const updateInfoField = (field: string, value: string) => {
        if (!document) return;

        const oldValue = info ? info[field] : undefined;

        executeCommand({
            execute: () => {
                // Mutate document directly - don't clone!
                if (!(document as any).info) {
                    (document as any).info = {};
                }
                (document as any).info[field] = value;
                updateDocument(document);
            },
            undo: () => {
                if (oldValue !== undefined) {
                    (document as any).info[field] = oldValue;
                } else if ((document as any).info) {
                    delete (document as any).info[field];
                }
                updateDocument(document);
            },
            getDescription: () => `Update ${field}: ${value}`
        });
    };


    /**
     * Validator for URL fields.
     */
    const validateUrl = (value: string) => {
        if (!value) {
            return { status: 'default' as const, errMessages: [] };
        }
        try {
            new URL(value);
            return { status: 'success' as const, errMessages: [] };
        } catch {
            return { status: 'error' as const, errMessages: ['Invalid URL'] };
        }
    };


    /**
     * Validator for required fields.
     */
    const validateRequired = (value: string) => {
        if (!value || value.trim() === '') {
            return { status: 'error' as const, errMessages: ['This field is required'] };
        }
        return { status: 'success' as const, errMessages: [] };
    };

    return (
        <div style={{ padding: '1rem' }}>
            {/* Overview Section */}
            <DescriptionList>
                <DescriptionListGroup>
                    <DescriptionListTerm>Title *</DescriptionListTerm>
                    <DescriptionListDescription>
                        <InlineEdit
                            value={info?.title || ''}
                            onChange={(value) => updateInfoField('title', value)}
                            editing={true}
                            autoFocus={false}
                            validator={validateRequired}
                        />
                    </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                    <DescriptionListTerm>Version *</DescriptionListTerm>
                    <DescriptionListDescription>
                        <InlineEdit
                            value={info?.version || ''}
                            onChange={(value) => updateInfoField('version', value)}
                            editing={true}
                            autoFocus={false}
                            validator={validateRequired}
                        />
                    </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                    <DescriptionListTerm>Description</DescriptionListTerm>
                    <DescriptionListDescription>
                        <TextArea
                            id="info-description"
                            aria-label="Description"
                            value={info?.description || ''}
                            onChange={(_event, value) => updateInfoField('description', value)}
                            rows={5}
                            resizeOrientation="vertical"
                        />
                    </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                    <DescriptionListTerm>Terms of Service</DescriptionListTerm>
                    <DescriptionListDescription>
                        <InlineEdit
                            value={info?.termsOfService || ''}
                            onChange={(value) => updateInfoField('termsOfService', value)}
                            editing={true}
                            autoFocus={false}
                            validator={validateUrl}
                        />
                    </DescriptionListDescription>
                </DescriptionListGroup>
            </DescriptionList>

            {/* Contact & License Sections - Collapsible */}
            <div style={{ marginTop: '2rem' }}>
                <Accordion>
                    <AccordionSection
                        id="contact-section"
                        title="Contact Information"
                        startExpanded={true}
                    >
                        <ContactSection />
                    </AccordionSection>

                    <AccordionSection
                        id="license-section"
                        title="License Information"
                        startExpanded={true}
                    >
                        <LicenseSection />
                    </AccordionSection>
                </Accordion>
            </div>
        </div>
    );
};
