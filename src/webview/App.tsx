import React, { useEffect, useState } from 'react';
import {
    Alert,
    Spinner,
    Card,
    CardBody,
    CardTitle,
    DescriptionList,
    DescriptionListGroup,
    DescriptionListTerm,
    DescriptionListDescription,
    Label,
    Button,
    Toolbar,
    ToolbarContent,
    ToolbarItem
} from '@patternfly/react-core';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    UndoIcon,
    RedoIcon,
    HistoryIcon
} from '@patternfly/react-icons';
import { useEnvironment } from './core/hooks/useEnvironment';
import { useDocument } from './core/hooks/useDocument';
import { useValidationStore } from './core/stores/validationStore';
import { useCommandHistoryStore } from './core/stores/commandHistoryStore';

/**
 * Main App component for Apicurio Visual Editor
 *
 * This will be the entry point for the React-based visual editor
 * for OpenAPI/AsyncAPI specifications.
 */
const App: React.FC = () => {
    const env = useEnvironment();
    const { document, format, isLoading, error, documentType, uri, isDirty } = useDocument();
    const { problems, isValid, getErrorCount, getWarningCount } = useValidationStore();
    const {
        undo,
        redo,
        canUndo,
        canRedo,
        getUndoDescription,
        getRedoDescription,
        undoStack,
        redoStack
    } = useCommandHistoryStore();
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

            {/* Undo/Redo Toolbar */}
            <Toolbar style={{ marginBottom: '20px' }}>
                <ToolbarContent>
                    <ToolbarItem>
                        <Button
                            variant="secondary"
                            icon={<UndoIcon />}
                            isDisabled={!canUndo()}
                            onClick={() => undo()}
                            title={getUndoDescription() || 'Nothing to undo'}
                        >
                            Undo
                        </Button>
                    </ToolbarItem>
                    <ToolbarItem>
                        <Button
                            variant="secondary"
                            icon={<RedoIcon />}
                            isDisabled={!canRedo()}
                            onClick={() => redo()}
                            title={getRedoDescription() || 'Nothing to redo'}
                        >
                            Redo
                        </Button>
                    </ToolbarItem>
                    <ToolbarItem>
                        <Label icon={<HistoryIcon />}>
                            {undoStack.length} action{undoStack.length !== 1 ? 's' : ''} in history
                        </Label>
                    </ToolbarItem>
                </ToolbarContent>
            </Toolbar>

            <Alert variant="success" isInline title="Integration Complete!" style={{ marginBottom: '20px' }}>
                React + PatternFly + Environment + Document Parsing + Undo/Redo ✅
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
                <>
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

                                <DescriptionListGroup>
                                    <DescriptionListTerm>Status</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        {isDirty ? (
                                            <Label color="orange">Modified (unsaved)</Label>
                                        ) : (
                                            <Label color="green" icon={<CheckCircleIcon />}>Saved</Label>
                                        )}
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

                    {/* Validation Status */}
                    <Card style={{ marginBottom: '20px' }}>
                        <CardTitle>Validation Status</CardTitle>
                        <CardBody>
                            {isValid() ? (
                                <Alert variant="success" isInline title="Valid Document" icon={<CheckCircleIcon />}>
                                    No validation errors found
                                </Alert>
                            ) : (
                                <>
                                    <Alert variant="warning" isInline title="Validation Issues" icon={<ExclamationTriangleIcon />}>
                                        Found {getWarningCount()} warning{getWarningCount() !== 1 ? 's' : ''}
                                    </Alert>
                                    <div style={{ marginTop: '10px' }}>
                                        {problems.map((problem) => (
                                            <div key={problem.id} style={{ marginBottom: '8px' }}>
                                                <Label color="orange" icon={<ExclamationTriangleIcon />}>
                                                    {problem.message}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </CardBody>
                    </Card>
                </>
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
                <CardTitle>Task 018 Progress - COMPLETE! 🎉</CardTitle>
                <CardBody>
                    <Alert variant="success" isInline title="All Subtasks Complete!" style={{ marginBottom: '15px' }}>
                        Task 018 React Foundation & Setup is now complete!
                    </Alert>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li>✅ Vite + React + PatternFly setup</li>
                        <li>✅ Environment abstraction layer (IEditorEnvironment)</li>
                        <li>✅ Webview provider implementation</li>
                        <li>✅ @apicurio/data-models integration</li>
                        <li>✅ Zustand state management (5 stores!)</li>
                        <li>✅ Command pattern (undo/redo)</li>
                    </ul>
                    <div style={{ marginTop: '15px', padding: '10px', background: 'var(--pf-v5-global--BackgroundColor--200)', borderRadius: '4px' }}>
                        <strong>Active Architecture:</strong>
                        <ul style={{ marginTop: '8px', marginLeft: '20px', fontSize: '0.9em' }}>
                            <li>📄 Document Store - {document ? 'Loaded' : 'Empty'}</li>
                            <li>✓ Validation Store - {getWarningCount()} warning(s)</li>
                            <li>🎯 Selection Store - Ready</li>
                            <li>⚙️ Editor Store - Ready</li>
                            <li>↩️ Command History - {undoStack.length} action(s)</li>
                        </ul>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default App;
