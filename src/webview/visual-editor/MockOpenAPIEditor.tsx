/**
 * Mock OpenAPI Editor Component
 *
 * This is a temporary mock component that simulates the @apicurio/openapi-editor API
 * for testing the integration. Once the package is properly published with built artifacts,
 * we'll replace this with the real component.
 *
 * API matches: https://github.com/Apicurio/apicurio-openapi-editor
 */

import React, { useState, useEffect } from 'react';
import * as YAML from 'yaml';

export interface DocumentChangeEvent {
    isDirty: boolean;
    version: number;
    getContent: () => object | null;
}

export interface EditorFeatures {
    allowImports?: boolean;
    allowCustomValidations?: boolean;
}

export interface OpenAPIEditorProps {
    initialContent?: object | string;
    onChange?: (event: DocumentChangeEvent) => void;
    features?: EditorFeatures;
}

export const OpenAPIEditor: React.FC<OpenAPIEditorProps> = ({
    initialContent,
    onChange,
    features
}) => {
    const [content, setContent] = useState<object | null>(null);
    const [version, setVersion] = useState(0);
    const [isDirty, setIsDirty] = useState(false);

    // Parse initial content (handles both JSON and YAML)
    useEffect(() => {
        if (initialContent) {
            let parsed: object;

            if (typeof initialContent === 'string') {
                // Try to parse as JSON first
                try {
                    parsed = JSON.parse(initialContent);
                } catch (e) {
                    // If JSON parsing fails, try YAML
                    try {
                        parsed = YAML.parse(initialContent);
                    } catch (yamlError) {
                        console.error('Failed to parse content as JSON or YAML:', yamlError);
                        parsed = { error: 'Failed to parse document' };
                    }
                }
            } else {
                parsed = initialContent;
            }

            setContent(parsed);
        }
    }, [initialContent]);

    // Notify parent when document changes
    useEffect(() => {
        if (content && onChange) {
            onChange({
                isDirty,
                version,
                getContent: () => content
            });
        }
    }, [content, isDirty, version, onChange]);

    const handleEdit = () => {
        setVersion(v => v + 1);
        setIsDirty(true);

        // Simulate editing the OpenAPI document
        if (content && 'info' in content) {
            const updated = {
                ...content,
                info: {
                    ...(content as any).info,
                    description: (content as any).info?.description
                        ? `${(content as any).info.description} (edited)`
                        : 'Edited via visual editor'
                }
            };
            setContent(updated);
        }
    };

    if (!content) {
        return <div style={styles.loading}>Loading document...</div>;
    }

    const apiDoc = content as any;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>
                    🎨 Mock Visual Editor (POC)
                </h1>
                <div style={styles.badges}>
                    <span style={styles.badge}>
                        {isDirty ? '● Modified' : '✓ Saved'}
                    </span>
                    <span style={styles.badge}>
                        v{version}
                    </span>
                </div>
            </div>

            <div style={styles.content}>
                <div style={styles.infoBox}>
                    <h2 style={styles.sectionTitle}>📄 Document Info</h2>
                    <table style={styles.table}>
                        <tbody>
                            <tr>
                                <td style={styles.label}>OpenAPI Version:</td>
                                <td style={styles.value}>{apiDoc.openapi || apiDoc.swagger || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style={styles.label}>Title:</td>
                                <td style={styles.value}>{apiDoc.info?.title || 'Untitled'}</td>
                            </tr>
                            <tr>
                                <td style={styles.label}>Version:</td>
                                <td style={styles.value}>{apiDoc.info?.version || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style={styles.label}>Description:</td>
                                <td style={styles.value}>
                                    {apiDoc.info?.description || 'No description'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={styles.infoBox}>
                    <h2 style={styles.sectionTitle}>🛠️ Features</h2>
                    <ul style={styles.featureList}>
                        <li>✅ Mock component simulates real API</li>
                        <li>✅ Document change events working</li>
                        <li>✅ isDirty tracking functional</li>
                        <li>✅ Version incrementing on edits</li>
                        <li>✅ getContent() callback available</li>
                        {features?.allowImports && <li>✅ Imports enabled</li>}
                        {features?.allowCustomValidations && <li>✅ Custom validations enabled</li>}
                    </ul>
                </div>

                <div style={styles.actionBox}>
                    <button style={styles.button} onClick={handleEdit}>
                        ✏️ Simulate Edit
                    </button>
                    <p style={styles.hint}>
                        Click to simulate editing the document. This will trigger the onChange event
                        and update the dirty state, just like the real component.
                    </p>
                </div>

                <div style={styles.rawBox}>
                    <h2 style={styles.sectionTitle}>📋 Raw Document</h2>
                    <pre style={styles.pre}>
                        {JSON.stringify(content, null, 2)}
                    </pre>
                </div>
            </div>

            <div style={styles.footer}>
                <p style={styles.footerText}>
                    🎭 This is a <strong>mock component</strong> for integration testing.
                    Real @apicurio/openapi-editor will replace this once published.
                </p>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--vscode-font-family)',
        backgroundColor: 'var(--vscode-editor-background)',
        color: 'var(--vscode-editor-foreground)',
    },
    header: {
        padding: '16px 24px',
        borderBottom: '1px solid var(--vscode-panel-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        margin: 0,
        fontSize: '20px',
        fontWeight: 600,
    },
    badges: {
        display: 'flex',
        gap: '8px',
    },
    badge: {
        padding: '4px 12px',
        backgroundColor: 'var(--vscode-badge-background)',
        color: 'var(--vscode-badge-foreground)',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
    },
    content: {
        flex: 1,
        overflow: 'auto',
        padding: '24px',
    },
    infoBox: {
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: 'var(--vscode-editor-inactiveSelectionBackground)',
        borderRadius: '4px',
    },
    sectionTitle: {
        margin: '0 0 12px 0',
        fontSize: '16px',
        fontWeight: 600,
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    label: {
        padding: '8px 16px 8px 0',
        fontWeight: 600,
        verticalAlign: 'top',
        width: '150px',
    },
    value: {
        padding: '8px 0',
    },
    featureList: {
        margin: '0',
        paddingLeft: '24px',
    },
    actionBox: {
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: 'var(--vscode-editor-inactiveSelectionBackground)',
        borderRadius: '4px',
        textAlign: 'center',
    },
    button: {
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: 600,
        backgroundColor: 'var(--vscode-button-background)',
        color: 'var(--vscode-button-foreground)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginBottom: '12px',
    },
    hint: {
        margin: 0,
        fontSize: '12px',
        opacity: 0.8,
    },
    rawBox: {
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: 'var(--vscode-editor-inactiveSelectionBackground)',
        borderRadius: '4px',
    },
    pre: {
        margin: 0,
        padding: '12px',
        backgroundColor: 'var(--vscode-editor-background)',
        borderRadius: '4px',
        fontSize: '12px',
        overflow: 'auto',
        maxHeight: '400px',
    },
    footer: {
        padding: '16px 24px',
        borderTop: '1px solid var(--vscode-panel-border)',
        textAlign: 'center',
    },
    footerText: {
        margin: 0,
        fontSize: '12px',
        opacity: 0.8,
    },
    loading: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        fontSize: '16px',
    },
};
