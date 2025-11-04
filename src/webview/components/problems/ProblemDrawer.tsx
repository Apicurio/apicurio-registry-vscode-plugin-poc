import React from 'react';
import {
    List,
    ListItem,
    Spinner,
    EmptyState,
    Split,
    SplitItem,
    Label
} from '@patternfly/react-core';
import {
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    InfoCircleIcon,
    CheckCircleIcon
} from '@patternfly/react-icons';
import { useValidationStore, ValidationProblem, ValidationSeverity } from '../../core/stores/validationStore';
import { useSelectionStore, SelectionType } from '../../core/stores/selectionStore';

/**
 * Props for ProblemDrawer component.
 */
export interface ProblemDrawerProps {
    /** Optional CSS class name */
    className?: string;
}

/**
 * Get icon for validation severity.
 */
const getSeverityIcon = (severity: ValidationSeverity): React.ReactNode => {
    switch (severity) {
        case 'error':
            return <ExclamationCircleIcon color="var(--pf-v5-global--danger-color--100)" />;
        case 'warning':
            return <ExclamationTriangleIcon color="var(--pf-v5-global--warning-color--100)" />;
        case 'info':
            return <InfoCircleIcon color="var(--pf-v5-global--info-color--100)" />;
    }
};

/**
 * Parse problem path to extract selection context.
 *
 * Examples:
 * - "info.title" → { type: 'info', path: 'info.title' }
 * - "paths./users.get" → { type: 'operation', path: '/users', context: { method: 'get' } }
 * - "components.schemas.User" → { type: 'schema', path: 'User' }
 */
const parseProblemPath = (path: string | undefined): { type: SelectionType; path?: string; context?: Record<string, any> } => {
    if (!path) {
        return { type: 'none' };
    }

    const parts = path.split('.');

    // Handle "info" paths
    if (parts[0] === 'info') {
        return {
            type: 'info',
            path,
            context: { field: parts.slice(1).join('.') }
        };
    }

    // Handle "paths./users.get" pattern
    if (parts[0] === 'paths' && parts.length >= 2) {
        const pathName = parts[1];
        const method = parts[2];

        if (method) {
            return {
                type: 'operation',
                path: pathName,
                context: { method }
            };
        }

        return {
            type: 'path',
            path: pathName
        };
    }

    // Handle "components.schemas.User" pattern
    if (parts[0] === 'components' && parts[1] === 'schemas' && parts.length >= 3) {
        return {
            type: 'schema',
            path: parts[2],
            context: { schemaName: parts[2] }
        };
    }

    // Handle "channels.user/signedup" pattern (AsyncAPI)
    if (parts[0] === 'channels' && parts.length >= 2) {
        return {
            type: 'channel',
            path: parts[1]
        };
    }

    // Default
    return {
        type: 'none',
        path,
        context: { rawPath: path }
    };
};

/**
 * ProblemDrawer component displays validation problems.
 *
 * Features:
 * - Lists all validation problems (errors, warnings, info)
 * - Color-coded by severity
 * - Click to navigate to problem location
 * - Real-time updates from validationStore
 * - Shows problem count summary
 * - Displays validating indicator
 *
 * Integrates with:
 * - validationStore - get problems
 * - selectionStore - navigate to problem location
 */
export const ProblemDrawer: React.FC<ProblemDrawerProps> = ({ className }) => {
    const { problems, isValidating, getErrorCount, getWarningCount, getInfoCount } = useValidationStore();
    const { select } = useSelectionStore();

    /**
     * Handle problem item click.
     */
    const handleProblemClick = (problem: ValidationProblem) => {
        const selection = parseProblemPath(problem.path);
        select(selection);
    };

    /**
     * Render empty state.
     */
    if (!isValidating && problems.length === 0) {
        return (
            <div className={className} style={{ padding: '2rem', textAlign: 'center' }}>
                <CheckCircleIcon color="var(--pf-v5-global--success-color--100)" />
                <h4 style={{ marginTop: '1rem' }}>No problems</h4>
            </div>
        );
    }

    /**
     * Render validating state.
     */
    if (isValidating) {
        return (
            <div className={className} style={{ padding: '2rem', textAlign: 'center' }}>
                <Spinner size="md" />
                <div style={{ marginTop: '1rem' }}>Validating...</div>
            </div>
        );
    }

    /**
     * Render problem count summary.
     */
    const errorCount = getErrorCount();
    const warningCount = getWarningCount();
    const infoCount = getInfoCount();

    return (
        <div className={className}>
            {/* Problem count summary */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--pf-v5-global--BorderColor--100)' }}>
                <Split hasGutter>
                    {errorCount > 0 && (
                        <SplitItem>
                            <Label color="red" icon={<ExclamationCircleIcon />}>
                                {errorCount} error{errorCount !== 1 ? 's' : ''}
                            </Label>
                        </SplitItem>
                    )}
                    {warningCount > 0 && (
                        <SplitItem>
                            <Label color="orange" icon={<ExclamationTriangleIcon />}>
                                {warningCount} warning{warningCount !== 1 ? 's' : ''}
                            </Label>
                        </SplitItem>
                    )}
                    {infoCount > 0 && (
                        <SplitItem>
                            <Label color="blue" icon={<InfoCircleIcon />}>
                                {infoCount} info
                            </Label>
                        </SplitItem>
                    )}
                </Split>
            </div>

            {/* Problem list */}
            <List isPlain style={{ padding: '0' }}>
                {problems.map((problem) => (
                    <ListItem
                        key={problem.id}
                        onClick={() => handleProblemClick(problem)}
                        style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--pf-v5-global--BorderColor--100)'
                        }}
                    >
                        <Split hasGutter>
                            <SplitItem>{getSeverityIcon(problem.severity)}</SplitItem>
                            <SplitItem isFilled>
                                <div>
                                    <div>{problem.message}</div>
                                    {problem.path && (
                                        <div style={{ fontSize: '0.875rem', color: 'var(--pf-v5-global--Color--200)', marginTop: '0.25rem' }}>
                                            {problem.path}
                                        </div>
                                    )}
                                </div>
                            </SplitItem>
                        </Split>
                    </ListItem>
                ))}
            </List>
        </div>
    );
};
