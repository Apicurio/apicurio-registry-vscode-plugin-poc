import React, { useState } from 'react';
import {
  Accordion,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DataList,
  DataListCell,
  DataListContent,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DataListToggle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateBody,
  Label,
  LabelGroup,
  SearchInput,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { EditIcon } from '@patternfly/react-icons';
import { useDocument } from '../../core/hooks/useDocument';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';
import { AccordionSection } from '../common/AccordionSection';
import { OperationLabel } from '../common/OperationLabel';
import { StatusCodeLabel } from '../common/StatusCodeLabel';
import { TagLabel } from '../common/TagLabel';
import { Markdown } from '../common/Markdown';
import { PathInfoSection } from './PathInfoSection';
import { PathServersSection } from './PathServersSection';
import { InputDialog } from '../common/InputDialog';
import { ConfirmDialog } from '../common/ConfirmDialog';

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

type DialogState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'clone'; sourcePath: string; sourceObject: any }
  | { type: 'delete'; pathName: string; pathObject: any }
  | { type: 'error'; message: string };

export const PathsSection: React.FC = () => {
  const { document, updateDocument } = useDocument();
  const { executeCommand } = useCommandHistoryStore();
  const [filter, setFilter] = useState('');
  const [dialogState, setDialogState] = useState<DialogState>({ type: 'none' });

  // Handle missing document
  if (!document) {
    return null;
  }

  // Force re-render by accessing document properties directly
  // This ensures React sees changes when paths are added/removed
  const pathsObj = (document as any)?.paths;

  // Get paths from document
  const paths: Record<string, any> = (document as any)?.paths || {};
  const pathItems: PathItem[] = Object.keys(paths)
    .filter(path => paths[path] != null) // Filter out null/undefined paths
    .map(path => ({
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

  const handleAddPath = () => {
    setDialogState({ type: 'add' });
  };

  const handleAddPathConfirm = (pathName: string) => {
    const trimmedPath = pathName.trim();

    // Check if path already exists
    if (paths[trimmedPath]) {
      setDialogState({ type: 'error', message: `Path "${trimmedPath}" already exists.` });
      return;
    }

    executeCommand({
      execute: () => {
        if (!(document as any).paths) {
          (document as any).paths = {};
        }
        (document as any).paths[trimmedPath] = {};
        updateDocument(document);
      },
      undo: () => {
        delete (document as any).paths[trimmedPath];
        updateDocument(document);
      },
      getDescription: () => `Add path: ${trimmedPath}`,
    });

    setDialogState({ type: 'none' });
  };

  const handleDeletePath = (pathName: string) => {
    setDialogState({ type: 'delete', pathName, pathObject: paths[pathName] });
  };

  const handleDeletePathConfirm = () => {
    if (dialogState.type !== 'delete') return;

    const { pathName, pathObject } = dialogState;
    const deletedPath = { ...pathObject };

    executeCommand({
      execute: () => {
        delete (document as any).paths[pathName];
        updateDocument(document);
      },
      undo: () => {
        (document as any).paths[pathName] = deletedPath;
        updateDocument(document);
      },
      getDescription: () => `Delete path: ${pathName}`,
    });

    setDialogState({ type: 'none' });
  };

  const handleClonePath = (sourcePath: string, sourceObject: any) => {
    setDialogState({ type: 'clone', sourcePath, sourceObject });
  };

  const handleClonePathConfirm = (newPathName: string) => {
    if (dialogState.type !== 'clone') return;

    const { sourcePath, sourceObject } = dialogState;
    const trimmedPath = newPathName.trim();

    // Check if path already exists
    if (paths[trimmedPath]) {
      setDialogState({ type: 'error', message: `Path "${trimmedPath}" already exists.` });
      return;
    }

    // Deep clone the path object
    const clonedPath = JSON.parse(JSON.stringify(sourceObject));

    executeCommand({
      execute: () => {
        if (!(document as any).paths) {
          (document as any).paths = {};
        }
        (document as any).paths[trimmedPath] = clonedPath;
        updateDocument(document);
      },
      undo: () => {
        delete (document as any).paths[trimmedPath];
        updateDocument(document);
      },
      getDescription: () => `Clone path: ${sourcePath} → ${trimmedPath}`,
    });

    setDialogState({ type: 'none' });
  };

  return (
    <>
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
            <ToolbarItem>
              <Button variant="primary" onClick={handleAddPath}>
                Add Path
              </Button>
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
          <PathCard
            key={path}
            path={path}
            pathObject={pathObject}
            onDelete={() => handleDeletePath(path)}
            onClone={() => handleClonePath(path, pathObject)}
          />
        ))}
      </Stack>

      {/* Add Path Dialog */}
      <InputDialog
        isOpen={dialogState.type === 'add'}
        title="Add Path"
        label="Path name"
        placeholder="/users"
        onConfirm={handleAddPathConfirm}
        onCancel={() => setDialogState({ type: 'none' })}
      />

      {/* Clone Path Dialog */}
      <InputDialog
        isOpen={dialogState.type === 'clone'}
        title="Clone Path"
        label="New path name"
        initialValue={
          dialogState.type === 'clone' ? `${dialogState.sourcePath}-copy` : ''
        }
        onConfirm={handleClonePathConfirm}
        onCancel={() => setDialogState({ type: 'none' })}
      />

      {/* Delete Path Confirmation */}
      <ConfirmDialog
        isOpen={dialogState.type === 'delete'}
        title="Delete Path"
        message={
          dialogState.type === 'delete'
            ? `Are you sure you want to delete path "${dialogState.pathName}"?`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeletePathConfirm}
        onCancel={() => setDialogState({ type: 'none' })}
      />

      {/* Error Dialog */}
      <ConfirmDialog
        isOpen={dialogState.type === 'error'}
        title="Error"
        message={dialogState.type === 'error' ? dialogState.message : ''}
        confirmLabel="OK"
        onConfirm={() => setDialogState({ type: 'none' })}
        onCancel={() => setDialogState({ type: 'none' })}
      />
    </>
  );
};

/**
 * PathCard - Displays a single path with expandable operations.
 */
interface PathCardProps {
  path: string;
  pathObject: any;
  onDelete: () => void;
  onClone: () => void;
}

function PathCard({ path, pathObject, onDelete, onClone }: PathCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Defensive check - should not happen due to filtering, but just in case
  if (!pathObject) {
    return null;
  }

  const operations = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
  const pathOperations = operations.filter(op => pathObject[op]);

  return (
    <Card isCompact={true} isPlain={true}>
      <CardHeader
        actions={{
          actions: (
            <>
              <Button
                variant="link"
                icon={<EditIcon />}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Done' : 'Edit'}
              </Button>
              <Button variant="link" onClick={onClone}>
                Clone
              </Button>
              <Button variant="link" isDanger onClick={onDelete}>
                Delete
              </Button>
            </>
          )
        }}
      >
        <CardTitle>
          <span style={{ fontFamily: 'monospace', fontSize: '1.1em' }}>
            {path}
          </span>
        </CardTitle>
      </CardHeader>

      {/* Path Info & Servers - Show editing forms when in edit mode */}
      {isEditing && (
        <CardBody>
          <Accordion>
            <AccordionSection id={`${path}-info`} title="Info" startExpanded={true}>
              <PathInfoSection pathName={path} editing={isEditing} />
            </AccordionSection>
            <AccordionSection id={`${path}-servers`} title="Servers" count={pathObject.servers?.length}>
              <PathServersSection pathName={path} editing={isEditing} />
            </AccordionSection>
          </Accordion>
        </CardBody>
      )}

      {/* Show summary/description in view mode */}
      {!isEditing && pathObject.summary && (
        <CardBody>
          <Markdown>{pathObject.summary}</Markdown>
        </CardBody>
      )}
      {!isEditing && pathObject.description && (
        <CardBody>
          <Markdown>{pathObject.description}</Markdown>
        </CardBody>
      )}

      {/* Operations list */}
      {!isEditing && pathOperations.length > 0 && (
        <CardBody>
          <DataList aria-label="Path operations">
            {pathOperations.map(opName => (
              <OperationRow
                key={`${path}-${opName}`}
                operation={pathObject[opName]}
                operationName={opName as any}
                path={path}
              />
            ))}
          </DataList>
        </CardBody>
      )}
    </Card>
  );
}

/**
 * OperationRow - Displays an expandable operation with details.
 */
interface OperationRowProps {
  operation: any;
  operationName: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'trace';
  path: string;
}

function OperationRow({ operation, operationName, path }: OperationRowProps) {
  const [expanded, setExpanded] = useState(false);

  // Get parameters
  const parameters = operation.parameters || [];
  const pathParams = parameters.filter((p: any) => p.in === 'path');
  const queryParams = parameters.filter((p: any) => p.in === 'query');
  const headerParams = parameters.filter((p: any) => p.in === 'header');
  const cookieParams = parameters.filter((p: any) => p.in === 'cookie');

  // Get responses
  const responses = operation.responses || {};
  const responseKeys = Object.keys(responses);

  // Get tags
  const tags = operation.tags || [];

  return (
    <DataListItem
      aria-labelledby={`operation-${path}-${operationName}`}
      isExpanded={expanded}
    >
      <DataListItemRow>
        <DataListToggle
          onClick={() => setExpanded(v => !v)}
          isExpanded={expanded}
          id={`operation-${path}-${operationName}-toggle`}
          aria-controls={`operation-${path}-${operationName}-expand`}
        />
        <DataListItemCells
          dataListCells={[
            <DataListCell isFilled={false} key="operation">
              <OperationLabel name={operationName} />
            </DataListCell>,
            <DataListCell key="summary">
              <Markdown>{operation.summary || operation.operationId || ''}</Markdown>
            </DataListCell>,
            <DataListCell key="tags" isFilled={false}>
              <LabelGroup>
                {tags.map((t: string) => (
                  <TagLabel key={t} name={t} />
                ))}
              </LabelGroup>
            </DataListCell>,
          ]}
        />
      </DataListItemRow>
      <DataListContent
        aria-label="Operation details"
        hasNoPadding={true}
        id={`operation-${path}-${operationName}-expand`}
        isHidden={!expanded}
      >
        {expanded && (
          <Stack hasGutter={true} style={{ padding: '1rem' }}>
            {operation.description && (
              <StackItem>
                <Markdown>{operation.description}</Markdown>
              </StackItem>
            )}

            {(pathParams.length + queryParams.length + headerParams.length + cookieParams.length) > 0 && (
              <StackItem>
                <Title headingLevel="h4">Request Parameters</Title>
                <Accordion>
                  {pathParams.length > 0 && (
                    <AccordionSection
                      title="Path parameters"
                      id={`${path}-${operationName}-path-params`}
                      startExpanded={false}
                      count={pathParams.length}
                    >
                      <Parameters parameters={pathParams} />
                    </AccordionSection>
                  )}
                  {queryParams.length > 0 && (
                    <AccordionSection
                      title="Query parameters"
                      id={`${path}-${operationName}-query-params`}
                      startExpanded={false}
                      count={queryParams.length}
                    >
                      <Parameters parameters={queryParams} />
                    </AccordionSection>
                  )}
                  {headerParams.length > 0 && (
                    <AccordionSection
                      title="Header parameters"
                      id={`${path}-${operationName}-header-params`}
                      startExpanded={false}
                      count={headerParams.length}
                    >
                      <Parameters parameters={headerParams} />
                    </AccordionSection>
                  )}
                  {cookieParams.length > 0 && (
                    <AccordionSection
                      title="Cookie parameters"
                      id={`${path}-${operationName}-cookie-params`}
                      startExpanded={false}
                      count={cookieParams.length}
                    >
                      <Parameters parameters={cookieParams} />
                    </AccordionSection>
                  )}
                </Accordion>
              </StackItem>
            )}

            {responseKeys.length > 0 && (
              <StackItem>
                <Title headingLevel="h4">Responses</Title>
                <Accordion>
                  {responseKeys.map(statusCode => (
                    <AccordionSection
                      key={statusCode}
                      title={
                        <Split hasGutter={true}>
                          <SplitItem>
                            <StatusCodeLabel code={statusCode} />
                          </SplitItem>
                          {responses[statusCode].description && (
                            <SplitItem>
                              <Markdown>{responses[statusCode].description}</Markdown>
                            </SplitItem>
                          )}
                        </Split>
                      }
                      id={`${path}-${operationName}-response-${statusCode}`}
                      startExpanded={false}
                    >
                      <div style={{ padding: '0.5rem' }}>
                        {responses[statusCode].description && (
                          <Markdown>{responses[statusCode].description}</Markdown>
                        )}
                        {/* TODO: Add response schema and examples */}
                      </div>
                    </AccordionSection>
                  ))}
                </Accordion>
              </StackItem>
            )}
          </Stack>
        )}
      </DataListContent>
    </DataListItem>
  );
}

/**
 * Parameters - Displays a list of parameters.
 */
interface ParametersProps {
  parameters: any[];
}

function Parameters({ parameters }: ParametersProps) {
  return (
    <DescriptionList>
      {parameters.map((param, idx) => (
        <DescriptionListGroup key={idx}>
          <DescriptionListTerm>
            <Stack hasGutter={true}>
              <StackItem>{param.name}</StackItem>
              {param.required && (
                <StackItem>
                  <Label color="blue">Required</Label>
                </StackItem>
              )}
            </Stack>
          </DescriptionListTerm>
          <DescriptionListDescription>
            <Stack hasGutter={true}>
              <StackItem>
                {param.schema?.type || param.type || 'any'}
              </StackItem>
              {param.description && (
                <StackItem>
                  <Markdown>{param.description}</Markdown>
                </StackItem>
              )}
            </Stack>
          </DescriptionListDescription>
        </DescriptionListGroup>
      ))}
    </DescriptionList>
  );
}
