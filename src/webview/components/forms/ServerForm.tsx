import React from 'react';

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
    // Placeholder implementation
    return <div>ServerForm placeholder</div>;
};
