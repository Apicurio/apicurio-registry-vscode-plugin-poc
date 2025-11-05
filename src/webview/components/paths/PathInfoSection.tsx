import React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";
import { InlineEdit } from "../common/InlineEdit";
import { useDocument } from "../../core/hooks/useDocument";
import { useCommandHistoryStore } from "../../core/stores/commandHistoryStore";

/**
 * PathInfoSection component - Edits summary and description for a path.
 *
 * Adapted from apicurio-editors/packages/ui/src/pathDesigner/Info.tsx
 */
export function PathInfoSection({
  pathName,
  editing,
}: {
  pathName: string;
  editing: boolean;
}) {
  const { document, updateDocument } = useDocument();
  const { executeCommand } = useCommandHistoryStore();

  const paths = (document as any)?.paths;
  if (!document || !paths || !paths[pathName]) {
    return null;
  }

  const pathItem = paths[pathName];
  const summary = pathItem.summary || '';
  const description = pathItem.description || '';

  const updateField = (field: 'summary' | 'description', value: string) => {
    // Capture old value for undo
    const oldValue = pathItem[field];

    executeCommand({
      execute: () => {
        // Look up pathItem fresh each time to avoid stale references
        const currentPaths = (document as any).paths;
        if (currentPaths && currentPaths[pathName]) {
          currentPaths[pathName][field] = value;
          updateDocument(document);
        }
      },
      undo: () => {
        const currentPaths = (document as any).paths;
        if (currentPaths && currentPaths[pathName]) {
          if (oldValue === undefined) {
            delete currentPaths[pathName][field];
          } else {
            currentPaths[pathName][field] = oldValue;
          }
          updateDocument(document);
        }
      },
      getDescription: () => `Update path ${field}: ${value}`,
    });
  };

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>Summary</DescriptionListTerm>
        <DescriptionListDescription>
          <InlineEdit
            onChange={(value) => updateField('summary', value)}
            value={summary}
            editing={editing}
            label="Summary"
          />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Description</DescriptionListTerm>
        <DescriptionListDescription>
          <InlineEdit
            onChange={(value) => updateField('description', value)}
            value={description}
            editing={editing}
            label="Description"
          />
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
}
