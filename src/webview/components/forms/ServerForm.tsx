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
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';

/**
 * Server object interface.
 */
export interface Server {
    url: string;
    description?: string;
    // variables?: Record<string, ServerVariable>; // Future enhancement
}

/**
 * Props for ServerForm component.
 */
export interface ServerFormProps {
    /** Server object to edit */
    server: Server | null;
    /** Callback when server changes */
    onChange: (server: Server) => void;
}

/**
 * Zod schema for server form validation.
 */
const serverSchema = z.object({
    url: z.string().min(1, 'URL is required').url('Invalid URL'),
    description: z.string().optional()
});

type ServerFormData = z.infer<typeof serverSchema>;

/**
 * ServerForm component for editing OpenAPI/AsyncAPI server configurations.
 *
 * Displays and allows editing of:
 * - URL (required)
 * - Description
 *
 * Uses react-hook-form for form management and zod for validation.
 * Integrates with command pattern for undo/redo support.
 */
export const ServerForm: React.FC<ServerFormProps> = ({ server, onChange }) => {
    const { executeCommand } = useCommandHistoryStore();

    // Initialize form with current values
    const {
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<ServerFormData>({
        resolver: zodResolver(serverSchema),
        defaultValues: {
            url: server?.url || '',
            description: server?.description || ''
        }
    });

    // Reset form when server changes
    useEffect(() => {
        reset({
            url: server?.url || '',
            description: server?.description || ''
        });
    }, [server, reset]);

    /**
     * Handle form field blur - execute update command and call onChange.
     */
    const handleFieldBlur = () => {
        handleSubmit((data) => {
            const updatedServer: Server = {
                url: data.url
            };

            if (data.description) {
                updatedServer.description = data.description;
            }

            // Call onChange callback
            onChange(updatedServer);

            // Execute update command for undo/redo
            executeCommand({
                execute: () => {
                    // Command execution handled by command history store
                },
                undo: () => {
                    // Command undo handled by command history store
                },
                getDescription: () => `Update server: ${data.url}`
            });
        })();
    };

    return (
        <Form style={{ padding: '1rem' }}>
            {/* URL */}
            <FormGroup
                label="URL"
                isRequired
                fieldId="server-url"
            >
                {errors.url && (
                    <div style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.url.message}
                    </div>
                )}
                <Controller
                    name="url"
                    control={control}
                    render={({ field }) => (
                        <TextInput
                            {...field}
                            id="server-url"
                            type="url"
                            validated={errors.url ? 'error' : 'default'}
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
                fieldId="server-description"
            >
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <TextArea
                            {...field}
                            id="server-description"
                            onBlur={(e) => {
                                field.onBlur();
                                handleFieldBlur();
                            }}
                        />
                    )}
                />
            </FormGroup>
        </Form>
    );
};
