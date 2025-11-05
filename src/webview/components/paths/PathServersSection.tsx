import React from 'react';
import { SearchableTable } from "../common/SearchableTable";
import { ServerRow } from "../common/ServerRow";
import { useDocument } from "../../core/hooks/useDocument";
import { useCommandHistoryStore } from "../../core/stores/commandHistoryStore";

/**
 * PathServersSection component - Edits servers for a path.
 *
 * Adapted from apicurio-editors/packages/ui/src/pathDesigner/Servers.tsx
 */

interface Server {
  url: string;
  description: string;
}

export function PathServersSection({
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
  const servers: Server[] = pathItem.servers || [];

  const addServer = () => {
    const newServer: Server = { url: '', description: '' };
    executeCommand({
      execute: () => {
        if (!pathItem.servers) {
          pathItem.servers = [];
        }
        pathItem.servers.push(newServer);
        updateDocument(document);
      },
      undo: () => {
        pathItem.servers.pop();
        if (pathItem.servers.length === 0) {
          delete pathItem.servers;
        }
        updateDocument(document);
      },
      getDescription: () => 'Add server to path',
    });
  };

  const removeServer = (index: number) => {
    const removedServer = servers[index];
    executeCommand({
      execute: () => {
        pathItem.servers.splice(index, 1);
        if (pathItem.servers.length === 0) {
          delete pathItem.servers;
        }
        updateDocument(document);
      },
      undo: () => {
        if (!pathItem.servers) {
          pathItem.servers = [];
        }
        pathItem.servers.splice(index, 0, removedServer);
        updateDocument(document);
      },
      getDescription: () => `Remove server: ${removedServer.url}`,
    });
  };

  const removeAllServers = () => {
    const oldServers = [...servers];
    executeCommand({
      execute: () => {
        delete pathItem.servers;
        updateDocument(document);
      },
      undo: () => {
        pathItem.servers = oldServers;
        updateDocument(document);
      },
      getDescription: () => 'Remove all servers from path',
    });
  };

  const updateServerField = (index: number, field: 'url' | 'description', value: string) => {
    const oldValue = servers[index][field];
    executeCommand({
      execute: () => {
        pathItem.servers[index][field] = value;
        updateDocument(document);
      },
      undo: () => {
        pathItem.servers[index][field] = oldValue;
        updateDocument(document);
      },
      getDescription: () => `Update server ${field}: ${value}`,
    });
  };

  return (
    <SearchableTable
      label={"server"}
      data={servers}
      editing={editing}
      onFilter={(server, filter) =>
        server.url.toLowerCase().includes(filter.toLowerCase()) ||
        server.description.toLowerCase().includes(filter.toLowerCase())
      }
      onRenderRow={(server, idx) => (
        <ServerRow
          id={`server-${idx}`}
          url={server.url}
          editing={editing}
          description={server.description}
          onRemove={() => removeServer(idx)}
          onChangeUrl={(value) => updateServerField(idx, 'url', value)}
          onChangeDescription={(value) => updateServerField(idx, 'description', value)}
        />
      )}
      onAdd={addServer}
      onRemoveAll={removeAllServers}
    />
  );
}
