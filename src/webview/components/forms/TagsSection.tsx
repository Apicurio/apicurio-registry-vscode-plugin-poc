import React, { useState } from 'react';
import {
  Button,
  DataListAction,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
} from "@patternfly/react-core";
import { TrashIcon } from "@patternfly/react-icons";
import { Markdown } from '../common/Markdown';
import { SearchableTable } from '../common/SearchableTable';
import { InlineEdit } from '../common/InlineEdit';
import { getTagId } from '../common/TagLabel';
import { useDocument } from '../../core/hooks/useDocument';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';

/**
 * TagsSection component for managing API tags.
 *
 * Adapted from apicurio-editors TagDefinitions.tsx with Zustand state management.
 *
 * Provides:
 * - Searchable table of tags
 * - Add/remove/edit tags
 * - Tag name and description editing
 */

interface Tag {
  name: string;
  description?: string;
}

export const TagsSection: React.FC = () => {
  const { document, updateDocument } = useDocument();
  const { executeCommand } = useCommandHistoryStore();

  // Handle missing document
  if (!document) {
    return null;
  }

  // Get tags from document (default to empty array)
  const tags: Tag[] = (document as any)?.tags || [];

  /**
   * Add a new tag.
   */
  const handleAddTag = () => {
    // TODO: Open AddTag dialog
    console.log('Add tag clicked');
  };

  /**
   * Remove all tags.
   */
  const handleRemoveAll = () => {
    const oldTags = [...tags];
    executeCommand({
      execute: () => {
        (document as any).tags = [];
        updateDocument(document);
      },
      undo: () => {
        (document as any).tags = oldTags;
        updateDocument(document);
      },
      getDescription: () => 'Remove all tags'
    });
  };

  /**
   * Filter tags based on search string.
   */
  const handleFilter = (tag: Tag, filter: string) => {
    const lowerFilter = filter.toLowerCase();
    return tag.name.toLowerCase().includes(lowerFilter) ||
           (tag.description || '').toLowerCase().includes(lowerFilter);
  };

  /**
   * Render a tag row.
   */
  const handleRenderRow = (tag: Tag, idx: number) => {
    return (
      <TagRow
        key={idx}
        name={tag.name}
        description={tag.description || ''}
        editing={true}
        onRemove={() => handleRemoveTag(idx)}
        onUpdateName={(newName) => handleUpdateTagName(idx, newName)}
        onUpdateDescription={(newDesc) => handleUpdateTagDescription(idx, newDesc)}
      />
    );
  };

  /**
   * Remove a tag by index.
   */
  const handleRemoveTag = (index: number) => {
    const oldTags = [...tags];
    const removedTag = tags[index];

    executeCommand({
      execute: () => {
        const newTags = [...tags];
        newTags.splice(index, 1);
        (document as any).tags = newTags;
        updateDocument(document);
      },
      undo: () => {
        (document as any).tags = oldTags;
        updateDocument(document);
      },
      getDescription: () => `Remove tag: ${removedTag.name}`
    });
  };

  /**
   * Update tag name.
   */
  const handleUpdateTagName = (index: number, newName: string) => {
    const oldTags = [...tags];
    const oldName = tags[index].name;

    executeCommand({
      execute: () => {
        const newTags = [...tags];
        newTags[index] = { ...newTags[index], name: newName };
        (document as any).tags = newTags;
        updateDocument(document);
      },
      undo: () => {
        (document as any).tags = oldTags;
        updateDocument(document);
      },
      getDescription: () => `Update tag name: ${oldName} → ${newName}`
    });
  };

  /**
   * Update tag description.
   */
  const handleUpdateTagDescription = (index: number, newDescription: string) => {
    const oldTags = [...tags];
    const tagName = tags[index].name;

    executeCommand({
      execute: () => {
        const newTags = [...tags];
        newTags[index] = { ...newTags[index], description: newDescription };
        (document as any).tags = newTags;
        updateDocument(document);
      },
      undo: () => {
        (document as any).tags = oldTags;
        updateDocument(document);
      },
      getDescription: () => `Update tag description: ${tagName}`
    });
  };

  return (
    <SearchableTable
      data={tags}
      label={"tag"}
      editing={true}
      onAdd={handleAddTag}
      onFilter={handleFilter}
      onRenderRow={handleRenderRow}
      onRemoveAll={handleRemoveAll}
    />
  );
};

/**
 * TagRow component - renders a single tag row.
 */
interface TagRowProps {
  name: string;
  description: string;
  editing: boolean;
  onRemove: () => void;
  onUpdateName: (newName: string) => void;
  onUpdateDescription: (newDesc: string) => void;
}

function TagRow({
  name,
  description,
  editing,
  onRemove,
  onUpdateName,
  onUpdateDescription,
}: TagRowProps) {
  const id = getTagId(name);

  return (
    <DataListItem aria-labelledby={id}>
      <DataListItemRow>
        <DataListItemCells
          dataListCells={[
            <DataListCell key="name" width={2}>
              <span id={id} className={"pf-v6-u-font-weight-bold"}>
                <InlineEdit
                  value={name}
                  editing={editing}
                  onChange={onUpdateName}
                  label={"Name"}
                />
              </span>
            </DataListCell>,
            <DataListCell key="description" width={5}>
              <Markdown label={"Description"} editing={editing} onChange={onUpdateDescription}>
                {description}
              </Markdown>
            </DataListCell>,
          ]}
        />
        {editing && (
          <DataListAction
            aria-labelledby={`${id}-actions`}
            id={`${id}-actions`}
            aria-label="Actions"
          >
            <Button
              icon={<TrashIcon />}
              variant={"control"}
              onClick={onRemove}
            />
          </DataListAction>
        )}
      </DataListItemRow>
    </DataListItem>
  );
}
