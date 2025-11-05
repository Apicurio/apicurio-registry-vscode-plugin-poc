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
 * LicenseSection component for editing license information in API documents.
 *
 * Adapted from apicurio-editors License.tsx with our Zustand state management.
 * Provides click-to-edit interface for:
 * - License name
 * - License URL
 *
 * Uses command pattern for undo/redo support.
 *
 * Note: apicurio-editors License.tsx only shows a link button, but we provide
 * editable fields for a better UX.
 */
export const LicenseSection: React.FC = () => {
    const { document, updateDocument } = useDocument();
    const { executeCommand } = useCommandHistoryStore();

    // Get license object from document
    const info = (document as any)?.info;
    const license = info?.license;

    // Handle missing document
    if (!document) {
        return null;
    }

    /**
     * Update a license field.
     */
    const updateLicenseField = (field: string, value: string) => {
        if (!document) return;

        const oldValue = license ? license[field] : undefined;

        executeCommand({
            execute: () => {
                // Mutate document directly - don't clone!
                if (!(document as any).info) {
                    (document as any).info = {};
                }
                if (!(document as any).info.license) {
                    (document as any).info.license = {};
                }
                (document as any).info.license[field] = value;
                updateDocument(document);
            },
            undo: () => {
                if (oldValue !== undefined) {
                    (document as any).info.license[field] = oldValue;
                } else if ((document as any).info?.license) {
                    delete (document as any).info.license[field];
                }
                updateDocument(document);
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

    return (
        <DescriptionList isCompact={true}>
            <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>
                    <InlineEdit
                        value={license?.name || ''}
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
                        value={license?.url || ''}
                        onChange={(value) => updateLicenseField('url', value)}
                        editing={true}
                        autoFocus={false}
                        validator={validateUrl}
                    />
                </DescriptionListDescription>
            </DescriptionListGroup>
        </DescriptionList>
    );
};
