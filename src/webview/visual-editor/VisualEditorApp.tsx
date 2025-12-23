/**
 * Visual Editor App - Main wrapper component
 *
 * This component wraps the @apicurio/openapi-editor component and handles
 * communication with the VSCode extension via message passing.
 */

import React, { useState, useEffect } from 'react';
import { OpenAPIEditor, DocumentChangeEvent } from '@apicurio/openapi-editor';
import { postMessageToExtension, onMessageFromExtension } from './vscode-api';
import * as YAML from 'yaml';

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
    const [originalFormat, setOriginalFormat] = useState<'json' | 'yaml'>('json');

    /**
     * Handle document changes from the editor
     */
    const handleChange = (event: DocumentChangeEvent) => {
        // Store the getContent callback for when save is requested
        window.getCurrentContent = event.getContent;

        // Convert content back to string in original format
        const contentObj = event.getContent();
        let contentStr: string;

        if (contentObj) {
            try {
                // Convert back to JSON string for storage
                // TODO: Support YAML output format when saving
                contentStr = JSON.stringify(contentObj, null, 2);
            } catch (e) {
                console.error('Failed to serialize content:', e);
                contentStr = '';
            }
        } else {
            contentStr = '';
        }

        // Notify extension of dirty state
        postMessageToExtension({
            type: 'change',
            payload: {
                content: contentStr,
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
                    // Parse content from string to object
                    const contentStr = message.payload.content;
                    if (typeof contentStr === 'string' && contentStr.trim().length > 0) {
                        try {
                            // Detect format from content
                            const trimmed = contentStr.trim();
                            let parsedContent;

                            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                                // JSON format
                                setOriginalFormat('json');
                                parsedContent = JSON.parse(contentStr);
                            } else {
                                // YAML format
                                setOriginalFormat('yaml');
                                parsedContent = YAML.parse(contentStr);
                            }

                            // Load the parsed document into the editor
                            setInitialContent(parsedContent);
                            setIsReady(true);
                        } catch (error) {
                            console.error('[VisualEditorApp] Failed to parse content:', error);
                            // Fall back to raw content
                            setInitialContent(contentStr);
                            setIsReady(true);
                        }
                    }
                    break;

                case 'saveDocument':
                    // Extension requests save - get current content and send back
                    const savedContent = window.getCurrentContent?.();
                    postMessageToExtension({
                        type: 'saveComplete',
                        payload: { content: savedContent },
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
        <div
            style={{
                height: '100vh',
                width: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}
        >
            <OpenAPIEditor initialContent={initialContent} onChange={handleChange} />
        </div>
    );
};
