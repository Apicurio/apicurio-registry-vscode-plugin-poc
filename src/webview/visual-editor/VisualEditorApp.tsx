/**
 * Visual Editor App - Main wrapper component
 *
 * This component wraps the @apicurio/openapi-editor component and handles
 * communication with the VSCode extension via message passing.
 */

import React, { useState, useEffect } from 'react';
// TODO: Replace with real package once published with built artifacts
// import { OpenAPIEditor, DocumentChangeEvent } from '@apicurio/openapi-editor';
import { OpenAPIEditor, DocumentChangeEvent } from './MockOpenAPIEditor';
import { postMessageToExtension, onMessageFromExtension } from './vscode-api';

/**
 * Store the getContent callback from the editor
 * We call this when the extension requests a save
 */
declare global {
    interface Window {
        getCurrentContent?: () => object | null;
    }
}

export const VisualEditorApp: React.FC = () => {
    const [initialContent, setInitialContent] = useState<object | string | null>(null);
    const [isReady, setIsReady] = useState(false);

    /**
     * Handle document changes from the editor
     */
    const handleChange = (event: DocumentChangeEvent) => {
        // Store the getContent callback for when save is requested
        window.getCurrentContent = event.getContent;

        // Notify extension of dirty state
        postMessageToExtension({
            type: 'change',
            payload: {
                content: event.getContent(),
                isDirty: event.isDirty,
                version: event.version,
            },
        });
    };

    /**
     * Listen for messages from the VSCode extension
     */
    useEffect(() => {
        onMessageFromExtension((message) => {
            switch (message.type) {
                case 'init':
                    // Load the document content into the editor
                    setInitialContent(message.payload.content);
                    setIsReady(true);
                    break;

                case 'saveDocument':
                    // Extension requests save - get current content and send back
                    const content = window.getCurrentContent?.();
                    postMessageToExtension({
                        type: 'saveComplete',
                        payload: { content },
                    });
                    break;

                case 'themeChanged':
                    // Handle theme changes if needed
                    // The editor should automatically adapt to VSCode theme
                    break;
            }
        });

        // Notify extension that webview is ready
        postMessageToExtension({ type: 'ready' });
    }, []);

    // Show loading state until document is loaded
    if (!isReady || !initialContent) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    fontFamily: 'var(--vscode-font-family)',
                    color: 'var(--vscode-foreground)',
                }}
            >
                Loading editor...
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <OpenAPIEditor initialContent={initialContent} onChange={handleChange} />
        </div>
    );
};
