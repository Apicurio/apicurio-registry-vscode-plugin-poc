import React from 'react';
import {
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm
} from '@patternfly/react-core';
import { InlineEdit } from '../common/InlineEdit';
import { useDocument } from '../../core/hooks/useDocument';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';

/**
 * ContactSection component for editing contact information in API documents.
 *
 * Adapted from apicurio-editors Contact.tsx with our Zustand state management.
 * Provides click-to-edit interface for:
 * - Contact name
 * - Contact URL
 * - Contact email
 *
 * Uses command pattern for undo/redo support.
 */
export const ContactSection: React.FC = () => {
    const { document, updateDocument } = useDocument();
    const { executeCommand } = useCommandHistoryStore();

    // Get contact object from document
    const info = (document as any)?.info;
    const contact = info?.contact;

    // Handle missing document
    if (!document) {
        return null;
    }

    /**
     * Update a contact field.
     */
    const updateContactField = (field: string, value: string) => {
        if (!document) return;

        const oldValue = contact ? contact[field] : undefined;

        executeCommand({
            execute: () => {
                // Mutate document directly - don't clone!
                if (!(document as any).info) {
                    (document as any).info = {};
                }
                if (!(document as any).info.contact) {
                    (document as any).info.contact = {};
                }
                (document as any).info.contact[field] = value;
                updateDocument(document);
            },
            undo: () => {
                if (oldValue !== undefined) {
                    (document as any).info.contact[field] = oldValue;
                } else if ((document as any).info?.contact) {
                    delete (document as any).info.contact[field];
                }
                updateDocument(document);
            },
            getDescription: () => `Update contact ${field}: ${value}`
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

    return (
        <DescriptionList isCompact={true}>
            <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>
                    <InlineEdit
                        value={contact?.name || ''}
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
                        value={contact?.url || ''}
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
                        value={contact?.email || ''}
                        onChange={(value) => updateContactField('email', value)}
                        editing={true}
                        autoFocus={false}
                        validator={validateEmail}
                    />
                </DescriptionListDescription>
            </DescriptionListGroup>
        </DescriptionList>
    );
};
