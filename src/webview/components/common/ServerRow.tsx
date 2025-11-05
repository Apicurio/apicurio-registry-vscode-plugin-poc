import React from 'react';
import {
  Button,
  DataListAction,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
} from "@patternfly/react-core";
import { Markdown } from "./Markdown";
import { TrashIcon } from "@patternfly/react-icons";
import { InlineEdit } from "./InlineEdit";

/**
 * ServerRow component - Displays a server entry in a data list.
 *
 * Adapted from apicurio-editors/packages/ui/src/components/ServerRow.tsx
 */
export function ServerRow({
  id,
  url,
  description,
  editing,
  onRemove,
  onChangeUrl,
  onChangeDescription,
}: {
  id: string;
  url: string;
  description: string;
  editing: boolean;
  onRemove: () => void;
  onChangeUrl?: (value: string) => void;
  onChangeDescription?: (value: string) => void;
}) {
  return (
    <DataListItem aria-labelledby={id}>
      <DataListItemRow>
        <DataListItemCells
          dataListCells={[
            <DataListCell key="url" width={2}>
              <span id={id}>
                <InlineEdit
                  label={"Url"}
                  value={url}
                  editing={editing}
                  onChange={onChangeUrl}
                />
              </span>
            </DataListCell>,
            <DataListCell key="description" width={5}>
              <Markdown
                label={"Description"}
                editing={editing}
                onChange={onChangeDescription}
              >
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
