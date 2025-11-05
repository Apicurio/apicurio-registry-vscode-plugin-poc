import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  SearchInput,
  Stack,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { useDocument } from '../../core/hooks/useDocument';

/**
 * PathsSection component for displaying API paths.
 *
 * Simplified version adapted from apicurio-editors PathsExplorer.tsx
 * Displays paths in a list with basic search functionality.
 *
 * TODO: Full implementation with operations, parameters, responses
 */

interface PathItem {
  path: string;
  pathObject: any;
}

export const PathsSection: React.FC = () => {
  const { document } = useDocument();
  const [filter, setFilter] = useState('');

  // Handle missing document
  if (!document) {
    return null;
  }

  // Get paths from document
  const paths: Record<string, any> = (document as any)?.paths || {};
  const pathItems: PathItem[] = Object.keys(paths).map(path => ({
    path,
    pathObject: paths[path]
  }));

  // Filter paths
  const filteredPaths = pathItems.filter(item => {
    if (!filter) return true;
    const lowerFilter = filter.toLowerCase();
    const pathMatch = item.path.toLowerCase().includes(lowerFilter);
    const summaryMatch = item.pathObject.summary?.toLowerCase().includes(lowerFilter);
    return pathMatch || summaryMatch;
  });

  return (
    <Stack hasGutter={true}>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              onChange={(_, value) => setFilter(value)}
              onClear={() => setFilter('')}
              value={filter}
              placeholder={"Search paths..."}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {filteredPaths.length === 0 && (
        <EmptyState>
          <EmptyStateBody>
            {pathItems.length === 0
              ? 'No paths have been defined.'
              : 'No paths match your search.'}
          </EmptyStateBody>
        </EmptyState>
      )}

      {filteredPaths.map(({ path, pathObject }) => (
        <PathCard key={path} path={path} pathObject={pathObject} />
      ))}
    </Stack>
  );
};

/**
 * PathCard - Displays a single path with its operations.
 */
interface PathCardProps {
  path: string;
  pathObject: any;
}

function PathCard({ path, pathObject }: PathCardProps) {
  const operations = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
  const pathOperations = operations.filter(op => pathObject[op]);

  return (
    <Card isCompact={true}>
      <CardHeader>
        <CardTitle style={{ fontFamily: 'monospace', fontSize: '1.1em' }}>
          {path}
        </CardTitle>
      </CardHeader>
      {pathObject.summary && (
        <CardBody>
          <div style={{ color: 'var(--pf-v5-global--Color--200)' }}>
            {pathObject.summary}
          </div>
        </CardBody>
      )}
      {pathOperations.length > 0 && (
        <CardBody>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {pathOperations.map(op => (
              <OperationBadge key={op} operation={op} />
            ))}
          </div>
        </CardBody>
      )}
    </Card>
  );
}

/**
 * OperationBadge - Displays an HTTP method badge.
 */
interface OperationBadgeProps {
  operation: string;
}

function OperationBadge({ operation }: OperationBadgeProps) {
  const colors: Record<string, string> = {
    get: '#61affe',
    post: '#49cc90',
    put: '#fca130',
    delete: '#f93e3e',
    patch: '#50e3c2',
    options: '#0d5aa7',
    head: '#9012fe',
  };

  const color = colors[operation.toLowerCase()] || '#999';

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: '3px',
        backgroundColor: color,
        color: 'white',
        fontWeight: 'bold',
        fontSize: '0.875rem',
        textTransform: 'uppercase',
      }}
    >
      {operation}
    </span>
  );
}
