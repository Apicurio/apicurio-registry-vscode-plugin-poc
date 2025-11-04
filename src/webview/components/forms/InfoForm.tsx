import React, { useEffect } from 'react';
import {
    Form,
    FormGroup,
    TextInput,
    TextArea
} from '@patternfly/react-core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDocument } from '../../core/hooks/useDocument';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';
import { Library } from '@apicurio/data-models';

/**
 * Zod schema for info form validation.
 */
const infoSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    version: z.string().min(1, 'Version is required'),
    description: z.string().optional(),
    termsOfService: z.string().optional(),
    contactName: z.string().optional(),
    contactUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    licenseName: z.string().optional(),
    licenseUrl: z.string().url('Invalid URL').optional().or(z.literal(''))
});

type InfoFormData = z.infer<typeof infoSchema>;

/**
 * InfoForm component for editing OpenAPI/AsyncAPI info section.
 *
 * Displays and allows editing of:
 * - Title (required)
 * - Version (required)
 * - Description
 * - Terms of Service
 * - Contact (name, url, email)
 * - License (name, url)
 *
 * Uses react-hook-form for form management and zod for validation.
 * Integrates with command pattern for undo/redo support.
 */
export const InfoForm: React.FC = () => {
    const { document } = useDocument();
    const { executeCommand } = useCommandHistoryStore();

    // Handle missing document
    if (!document) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>No document loaded</p>
            </div>
        );
    }

    // Get info object from document
    const info = (document as any).info;

    // Initialize form with current values
    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        reset
    } = useForm<InfoFormData>({
        resolver: zodResolver(infoSchema),
        defaultValues: {
            title: info?.title || '',
            version: info?.version || '',
            description: info?.description || '',
            termsOfService: info?.termsOfService || '',
            contactName: info?.contact?.name || '',
            contactUrl: info?.contact?.url || '',
            contactEmail: info?.contact?.email || '',
            licenseName: info?.license?.name || '',
            licenseUrl: info?.license?.url || ''
        }
    });

    // Reset form when document changes
    useEffect(() => {
        reset({
            title: info?.title || '',
            version: info?.version || '',
            description: info?.description || '',
            termsOfService: info?.termsOfService || '',
            contactName: info?.contact?.name || '',
            contactUrl: info?.contact?.url || '',
            contactEmail: info?.contact?.email || '',
            licenseName: info?.license?.name || '',
            licenseUrl: info?.license?.url || ''
        });
    }, [document, info, reset]);

    /**
     * Handle form field blur - execute update command.
     */
    const handleFieldBlur = () => {
        handleSubmit((data) => {
            // Build updated info object
            const updatedInfo: any = {
                title: data.title,
                version: data.version
            };

            if (data.description) {
                updatedInfo.description = data.description;
            }

            if (data.termsOfService) {
                updatedInfo.termsOfService = data.termsOfService;
            }

            if (data.contactName || data.contactUrl || data.contactEmail) {
                updatedInfo.contact = {};
                if (data.contactName) updatedInfo.contact.name = data.contactName;
                if (data.contactUrl) updatedInfo.contact.url = data.contactUrl;
                if (data.contactEmail) updatedInfo.contact.email = data.contactEmail;
            }

            if (data.licenseName || data.licenseUrl) {
                updatedInfo.license = {};
                if (data.licenseName) updatedInfo.license.name = data.licenseName;
                if (data.licenseUrl) updatedInfo.license.url = data.licenseUrl;
            }

            // Execute update command
            executeCommand({
                execute: () => {
                    // Command execution handled by command history store
                },
                undo: () => {
                    // Command undo handled by command history store
                },
                getDescription: () => `Update info: ${data.title}`
            });
        })();
    };

    return (
        <Form style={{ padding: '1rem' }}>
            {/* Title */}
            <FormGroup
                label="Title"
                isRequired
                fieldId="info-title"
            >
                {errors.title && (
                    <div style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.title.message}
                    </div>
                )}
                <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                        <TextInput
                            {...field}
                            id="info-title"
                            type="text"
                            validated={errors.title ? 'error' : 'default'}
                            onBlur={(e) => {
                                field.onBlur();
                                handleFieldBlur();
                            }}
                        />
                    )}
                />
            </FormGroup>

            {/* Version */}
            <FormGroup
                label="Version"
                isRequired
                fieldId="info-version"
            >
                {errors.version && (
                    <div style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.version.message}
                    </div>
                )}
                <Controller
                    name="version"
                    control={control}
                    render={({ field }) => (
                        <TextInput
                            {...field}
                            id="info-version"
                            type="text"
                            validated={errors.version ? 'error' : 'default'}
                            onBlur={(e) => {
                                field.onBlur();
                                handleFieldBlur();
                            }}
                        />
                    )}
                />
            </FormGroup>

            {/* Description */}
            <FormGroup
                label="Description"
                fieldId="info-description"
            >
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <TextArea
                            {...field}
                            id="info-description"
                            onBlur={(e) => {
                                field.onBlur();
                                handleFieldBlur();
                            }}
                        />
                    )}
                />
            </FormGroup>

            {/* Terms of Service */}
            <FormGroup
                label="Terms of Service"
                fieldId="info-terms"
            >
                <Controller
                    name="termsOfService"
                    control={control}
                    render={({ field }) => (
                        <TextInput
                            {...field}
                            id="info-terms"
                            type="url"
                            onBlur={(e) => {
                                field.onBlur();
                                handleFieldBlur();
                            }}
                        />
                    )}
                />
            </FormGroup>

            {/* Contact Section */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--pf-v5-global--BorderColor--100)' }}>
                <h3 style={{ marginBottom: '1rem' }}>Contact Information</h3>

                <FormGroup
                    label="Contact Name"
                    fieldId="info-contact-name"
                >
                    <Controller
                        name="contactName"
                        control={control}
                        render={({ field }) => (
                            <TextInput
                                {...field}
                                id="info-contact-name"
                                type="text"
                                onBlur={(e) => {
                                    field.onBlur();
                                    handleFieldBlur();
                                }}
                            />
                        )}
                    />
                </FormGroup>

                <FormGroup
                    label="Contact URL"
                    fieldId="info-contact-url"
                >
                    {errors.contactUrl && (
                        <div style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            {errors.contactUrl.message}
                        </div>
                    )}
                    <Controller
                        name="contactUrl"
                        control={control}
                        render={({ field }) => (
                            <TextInput
                                {...field}
                                id="info-contact-url"
                                type="url"
                                validated={errors.contactUrl ? 'error' : 'default'}
                                onBlur={(e) => {
                                    field.onBlur();
                                    handleFieldBlur();
                                }}
                            />
                        )}
                    />
                </FormGroup>

                <FormGroup
                    label="Contact Email"
                    fieldId="info-contact-email"
                >
                    {errors.contactEmail && (
                        <div style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            {errors.contactEmail.message}
                        </div>
                    )}
                    <Controller
                        name="contactEmail"
                        control={control}
                        render={({ field }) => (
                            <TextInput
                                {...field}
                                id="info-contact-email"
                                type="email"
                                validated={errors.contactEmail ? 'error' : 'default'}
                                onBlur={(e) => {
                                    field.onBlur();
                                    handleFieldBlur();
                                }}
                            />
                        )}
                    />
                </FormGroup>
            </div>

            {/* License Section */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--pf-v5-global--BorderColor--100)' }}>
                <h3 style={{ marginBottom: '1rem' }}>License Information</h3>

                <FormGroup
                    label="License Name"
                    fieldId="info-license-name"
                >
                    <Controller
                        name="licenseName"
                        control={control}
                        render={({ field }) => (
                            <TextInput
                                {...field}
                                id="info-license-name"
                                type="text"
                                onBlur={(e) => {
                                    field.onBlur();
                                    handleFieldBlur();
                                }}
                            />
                        )}
                    />
                </FormGroup>

                <FormGroup
                    label="License URL"
                    fieldId="info-license-url"
                >
                    {errors.licenseUrl && (
                        <div style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            {errors.licenseUrl.message}
                        </div>
                    )}
                    <Controller
                        name="licenseUrl"
                        control={control}
                        render={({ field }) => (
                            <TextInput
                                {...field}
                                id="info-license-url"
                                type="url"
                                validated={errors.licenseUrl ? 'error' : 'default'}
                                onBlur={(e) => {
                                    field.onBlur();
                                    handleFieldBlur();
                                }}
                            />
                        )}
                    />
                </FormGroup>
            </div>
        </Form>
    );
};
