import React from 'react';
import {
    DescriptionList,
    DescriptionListGroup,
    DescriptionListTerm,
    DescriptionListDescription,
    Title,
    TextArea
} from '@patternfly/react-core';
import { useDocument } from '../../core/hooks/useDocument';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';
import { InlineEdit } from '../common/InlineEdit';

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
     */
    const updateInfoField = (field: string, value: string) => {
        executeCommand({
            execute: () => {
                const updatedDoc = { ...document };
                if (!updatedDoc.info) {
                    (updatedDoc as any).info = {};
                }
                (updatedDoc as any).info[field] = value;
                updateDocument(updatedDoc);
            },
            undo: () => {
                const revertedDoc = { ...document };
                if (info && info[field]) {
                    (revertedDoc as any).info[field] = info[field];
                } else {
                    delete (revertedDoc as any).info[field];
                }
                updateDocument(revertedDoc);
            },
            getDescription: () => `Update ${field}: ${value}`
        });
    };

    /**
     * Update contact field.
     */
    const updateContactField = (field: string, value: string) => {
        executeCommand({
            execute: () => {
                const updatedDoc = { ...document };
                if (!updatedDoc.info) {
                    (updatedDoc as any).info = {};
                }
                if (!(updatedDoc as any).info.contact) {
                    (updatedDoc as any).info.contact = {};
                }
                (updatedDoc as any).info.contact[field] = value;
                updateDocument(updatedDoc);
            },
            undo: () => {
                const revertedDoc = { ...document };
                if (info?.contact && info.contact[field]) {
                    (revertedDoc as any).info.contact[field] = info.contact[field];
                } else if ((revertedDoc as any).info?.contact) {
                    delete (revertedDoc as any).info.contact[field];
                }
                updateDocument(revertedDoc);
            },
            getDescription: () => `Update contact ${field}: ${value}`
        });
    };

    /**
     * Update license field.
     */
    const updateLicenseField = (field: string, value: string) => {
        executeCommand({
            execute: () => {
                const updatedDoc = { ...document };
                if (!updatedDoc.info) {
                    (updatedDoc as any).info = {};
                }
                if (!(updatedDoc as any).info.license) {
                    (updatedDoc as any).info.license = {};
                }
                (updatedDoc as any).info.license[field] = value;
                updateDocument(updatedDoc);
            },
            undo: () => {
                const revertedDoc = { ...document };
                if (info?.license && info.license[field]) {
                    (revertedDoc as any).info.license[field] = info.license[field];
                } else if ((revertedDoc as any).info?.license) {
                    delete (revertedDoc as any).info.license[field];
                }
                updateDocument(revertedDoc);
            },
            getDescription: () => `Update license ${field}: ${value}`
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
     * Validator for email fields.
     */
    const validateEmail = (value: string) => {
        if (!value) {
            return { status: 'default' as const, errMessages: [] };
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(value)) {
            return { status: 'success' as const, errMessages: [] };
        }
        return { status: 'error' as const, errMessages: ['Invalid email'] };
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

            {/* Contact Section */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--pf-v5-global--BorderColor--100)' }}>
                <Title headingLevel="h3" size="md" style={{ marginBottom: '1rem' }}>
                    Contact Information
                </Title>
                <DescriptionList>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Name</DescriptionListTerm>
                        <DescriptionListDescription>
                            <InlineEdit
                                value={info?.contact?.name || ''}
                                onChange={(value) => updateContactField('name', value)}
                                editing={true}
                                autoFocus={false}
                            />
                        </DescriptionListDescription>
                    </DescriptionListGroup>

                    <DescriptionListGroup>
                        <DescriptionListTerm>URL</DescriptionListTerm>
                        <DescriptionListDescription>
                            <InlineEdit
                                value={info?.contact?.url || ''}
                                onChange={(value) => updateContactField('url', value)}
                                editing={true}
                                autoFocus={false}
                                validator={validateUrl}
                            />
                        </DescriptionListDescription>
                    </DescriptionListGroup>

                    <DescriptionListGroup>
                        <DescriptionListTerm>Email</DescriptionListTerm>
                        <DescriptionListDescription>
                            <InlineEdit
                                value={info?.contact?.email || ''}
                                onChange={(value) => updateContactField('email', value)}
                                editing={true}
                                autoFocus={false}
                                validator={validateEmail}
                            />
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
            </div>

            {/* License Section */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--pf-v5-global--BorderColor--100)' }}>
                <Title headingLevel="h3" size="md" style={{ marginBottom: '1rem' }}>
                    License Information
                </Title>
                <DescriptionList>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Name</DescriptionListTerm>
                        <DescriptionListDescription>
                            <InlineEdit
                                value={info?.license?.name || ''}
                                onChange={(value) => updateLicenseField('name', value)}
                                editing={true}
                                autoFocus={false}
                            />
                        </DescriptionListDescription>
                    </DescriptionListGroup>

                    <DescriptionListGroup>
                        <DescriptionListTerm>URL</DescriptionListTerm>
                        <DescriptionListDescription>
                            <InlineEdit
                                value={info?.license?.url || ''}
                                onChange={(value) => updateLicenseField('url', value)}
                                editing={true}
                                autoFocus={false}
                                validator={validateUrl}
                            />
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
            </div>
        </div>
    );
};
