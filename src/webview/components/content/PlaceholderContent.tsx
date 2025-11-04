import React from 'react';
import {
    PageSection,
    Card,
    CardBody,
    CardTitle,
    Alert,
    Spinner,
    DescriptionList,
    DescriptionListGroup,
    DescriptionListTerm,
    DescriptionListDescription,
    Label
} from '@patternfly/react-core';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons';
import { useDocument } from '../../core/hooks/useDocument';
import { useValidationStore } from '../../core/stores/validationStore';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';

/**
 * Placeholder content component showing document information.
 *
 * This will be replaced with actual form editors in later subtasks.
 * For now, it displays the document metadata and system status.
 */
export const PlaceholderContent: React.FC = () => {
    const { document, format, isLoading, error, documentType, uri, isDirty } = useDocument();
    const { problems, isValid, getWarningCount } = useValidationStore();
    const { undoStack, redoStack } = useCommandHistoryStore();

    if (isLoading) {
        return (
            <PageSection variant="light" isCenterAligned>
                <Spinner size="xl" />
                <p style={{ marginTop: '1rem' }}>Loading document...</p>
            </PageSection>
        );
    }

    if (error) {
        return (
            <PageSection variant="light">
                <Alert variant="danger" isInline title="Parsing Error">
                    {error}
                </Alert>
            </PageSection>
        );
    }

    if (!document) {
        return (
            <PageSection variant="light" isCenterAligned>
                <Alert variant="info" isInline title="No Document">
                    Open an OpenAPI or AsyncAPI specification to get started.
                </Alert>
            </PageSection>
        );
    }

    return (
        <PageSection variant="light">
            <Alert variant="success" isInline title="Layout Complete!" style={{ marginBottom: '1rem' }}>
                Master layout with 3-column design is now working!
            </Alert>

            {/* Document Information */}
            <Card style={{ marginBottom: '1rem' }}>
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
            <Card style={{ marginBottom: '1rem' }}>
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

            {/* Task Progress */}
            <Card>
                <CardTitle>Task 019 Progress</CardTitle>
                <CardBody>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li>✅ Master Layout Component (Subtask 1)</li>
                        <li>⏳ Navigation Tree Component (Subtask 2)</li>
                        <li>⏳ Problem Drawer Component (Subtask 3)</li>
                        <li>⏳ Info Form (Subtask 4)</li>
                        <li>⏳ Server Form (Subtask 5)</li>
                        <li>⏳ Common Components Library (Subtask 6)</li>
                    </ul>
                    <div style={{ marginTop: '15px', padding: '10px', background: 'var(--pf-v5-global--BackgroundColor--200)', borderRadius: '4px' }}>
                        <strong>System Status:</strong>
                        <ul style={{ marginTop: '8px', marginLeft: '20px', fontSize: '0.9em' }}>
                            <li>📄 Document: {document ? 'Loaded' : 'Empty'}</li>
                            <li>✓ Validation: {getWarningCount()} warning(s)</li>
                            <li>↩️ History: {undoStack.length} action(s), {redoStack.length} redo(s)</li>
                        </ul>
                    </div>
                </CardBody>
            </Card>
        </PageSection>
    );
};
