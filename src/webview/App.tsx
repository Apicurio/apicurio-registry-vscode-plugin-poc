import React, { useEffect, useState } from 'react';
import {
    Button,
    Alert,
    Spinner,
    Card,
    CardBody,
    CardTitle,
    DescriptionList,
    DescriptionListGroup,
    DescriptionListTerm,
    DescriptionListDescription
} from '@patternfly/react-core';
import { useEnvironment } from './core/hooks/useEnvironment';
import { useDocument } from './core/hooks/useDocument';

/**
 * Main App component for Apicurio Visual Editor
 *
 * This will be the entry point for the React-based visual editor
 * for OpenAPI/AsyncAPI specifications.
 */
const App: React.FC = () => {
    const env = useEnvironment();
    const { document, format, isLoading, error, documentType, uri } = useDocument();
    const [theme, setTheme] = useState(env.getTheme());

    useEffect(() => {
        // Listen for theme changes
        const dispose = env.onThemeChange((newTheme) => {
            setTheme(newTheme);
        });

        // Cleanup
        return dispose;
    }, [env]);

    return (
        <div className="apicurio-editor" style={{ padding: '20px' }}>
            <h1>Apicurio Visual Editor</h1>

            <Alert variant="success" isInline title="Integration Complete!" style={{ marginBottom: '20px' }}>
                React + PatternFly + Environment + Document Parsing ✅
            </Alert>

            {/* Document Status */}
            {isLoading && (
                <Card style={{ marginBottom: '20px' }}>
                    <CardBody>
                        <Spinner size="lg" /> Loading document...
                    </CardBody>
                </Card>
            )}

            {error && (
                <Alert variant="danger" isInline title="Parsing Error" style={{ marginBottom: '20px' }}>
                    {error}
                </Alert>
            )}

            {document && (
                <Card style={{ marginBottom: '20px' }}>
                    <CardTitle>Document Information</CardTitle>
                    <CardBody>
                        <DescriptionList>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Document Type</DescriptionListTerm>
                                <DescriptionListDescription>
                                    <strong>{documentType}</strong>
                                </DescriptionListDescription>
                            </DescriptionListGroup>

                            <DescriptionListGroup>
                                <DescriptionListTerm>Format</DescriptionListTerm>
                                <DescriptionListDescription>
                                    {format?.toUpperCase()}
                                </DescriptionListDescription>
                            </DescriptionListGroup>

                            {document.info && (
                                <>
                                    <DescriptionListGroup>
                                        <DescriptionListTerm>Title</DescriptionListTerm>
                                        <DescriptionListDescription>
                                            {document.info.title || 'No title'}
                                        </DescriptionListDescription>
                                    </DescriptionListGroup>

                                    <DescriptionListGroup>
                                        <DescriptionListTerm>Version</DescriptionListTerm>
                                        <DescriptionListDescription>
                                            {document.info.version || 'No version'}
                                        </DescriptionListDescription>
                                    </DescriptionListGroup>

                                    {document.info.description && (
                                        <DescriptionListGroup>
                                            <DescriptionListTerm>Description</DescriptionListTerm>
                                            <DescriptionListDescription>
                                                {document.info.description}
                                            </DescriptionListDescription>
                                        </DescriptionListGroup>
                                    )}
                                </>
                            )}

                            <DescriptionListGroup>
                                <DescriptionListTerm>URI</DescriptionListTerm>
                                <DescriptionListDescription>
                                    <code style={{ fontSize: '0.85em' }}>{uri}</code>
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                        </DescriptionList>
                    </CardBody>
                </Card>
            )}

            {/* Environment Info */}
            <Card style={{ marginBottom: '20px' }}>
                <CardTitle>Environment Information</CardTitle>
                <CardBody>
                    <DescriptionList>
                        <DescriptionListGroup>
                            <DescriptionListTerm>Current Theme</DescriptionListTerm>
                            <DescriptionListDescription>
                                {theme}
                            </DescriptionListDescription>
                        </DescriptionListGroup>
                    </DescriptionList>
                    <p style={{ marginTop: '10px', fontSize: '0.9em', color: 'var(--pf-v5-global--Color--200)' }}>
                        Theme automatically syncs with VSCode. Try changing your VSCode theme!
                    </p>
                </CardBody>
            </Card>

            {/* Progress Checklist */}
            <Card>
                <CardTitle>Task 018 Progress</CardTitle>
                <CardBody>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li>✅ Vite + React + PatternFly setup</li>
                        <li>✅ Environment abstraction layer (IEditorEnvironment)</li>
                        <li>✅ Webview provider implementation</li>
                        <li>✅ @apicurio/data-models integration</li>
                        <li>⏳ Zustand state management</li>
                        <li>⏳ Command pattern (undo/redo)</li>
                    </ul>
                </CardBody>
            </Card>
        </div>
    );
};

export default App;
