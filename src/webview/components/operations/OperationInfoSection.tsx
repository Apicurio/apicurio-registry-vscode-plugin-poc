import React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  LabelGroup,
} from "@patternfly/react-core";
import { InlineEdit } from "../common/InlineEdit";
import { TagLabel } from "../common/TagLabel";
import { useDocument } from "../../core/hooks/useDocument";
import { useCommandHistoryStore } from "../../core/stores/commandHistoryStore";

/**
 * OperationInfoSection component - Edits operation metadata (summary, description, operationId, tags).
 *
 * Used within operation editing forms to modify basic operation properties.
 */

interface OperationInfoSectionProps {
  pathName: string;
  operationName: string;
  editing: boolean;
}

export function OperationInfoSection({
  pathName,
  operationName,
  editing,
}: OperationInfoSectionProps) {
  const { document, updateDocument } = useDocument();
  const { executeCommand } = useCommandHistoryStore();

  const paths = (document as any)?.paths;
  if (!document || !paths || !paths[pathName]) {
    return null;
  }

  const pathItem = paths[pathName];
  const operation = pathItem[operationName];

  if (!operation) {
    return null;
  }

  const summary = operation.summary || '';
  const description = operation.description || '';
  const operationId = operation.operationId || '';
  const tags: string[] = operation.tags || [];

  const updateField = (field: 'summary' | 'description' | 'operationId', value: string) => {
    const oldValue = operation[field];
    executeCommand({
      execute: () => {
        operation[field] = value;
        updateDocument(document);
      },
      undo: () => {
        if (oldValue === undefined) {
          delete operation[field];
        } else {
          operation[field] = oldValue;
        }
        updateDocument(document);
      },
      getDescription: () => `Update operation ${field}: ${value}`,
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

      <DescriptionListGroup>
        <DescriptionListTerm>Operation ID</DescriptionListTerm>
        <DescriptionListDescription>
          <InlineEdit
            onChange={(value) => updateField('operationId', value)}
            value={operationId}
            editing={editing}
            label="Operation ID"
          />
        </DescriptionListDescription>
      </DescriptionListGroup>

      {tags.length > 0 && (
        <DescriptionListGroup>
          <DescriptionListTerm>Tags</DescriptionListTerm>
          <DescriptionListDescription>
            <LabelGroup>
              {tags.map((tag, idx) => (
                <TagLabel key={idx} name={tag} />
              ))}
            </LabelGroup>
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
    </DescriptionList>
  );
}
