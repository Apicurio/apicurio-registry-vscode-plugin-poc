import { Document, Library } from '@apicurio/data-models';

/**
 * Tree node type - corresponds to SelectionType in most cases.
 */
export type TreeNodeType =
    | 'root'
    | 'info'
    | 'servers'
    | 'server'
    | 'paths'
    | 'path'
    | 'operation'
    | 'components'
    | 'schemas'
    | 'schema'
    | 'responses'
    | 'response'
    | 'parameters'
    | 'parameter'
    | 'requestBodies'
    | 'requestBody'
    | 'security'
    | 'securityScheme'
    | 'tags'
    | 'tag'
    | 'channels'      // AsyncAPI
    | 'channel'       // AsyncAPI
    | 'messages'      // AsyncAPI
    | 'message';      // AsyncAPI

/**
 * Tree node data structure.
 */
export interface TreeNode {
    /** Unique ID for the node */
    id: string;
    /** Display label */
    label: string;
    /** Node type */
    type: TreeNodeType;
    /** Path or key in the document (e.g., "/users/{id}", "get") */
    path?: string;
    /** Child nodes */
    children?: TreeNode[];
    /** Is node expanded by default? */
    expanded?: boolean;
    /** Additional context data */
    context?: Record<string, any>;
}

/**
 * Build navigation tree from a Document.
 *
 * @param document - @apicurio/data-models Document
 * @returns Array of root tree nodes
 */
export function buildNavigationTree(document: Document): TreeNode[] {
    const jsObj: any = Library.writeNode(document);
    const isOpenApi = !!jsObj.swagger || !!jsObj.openapi;
    const isAsyncApi = !!jsObj.asyncapi;

    if (isOpenApi) {
        return buildOpenApiTree(jsObj);
    } else if (isAsyncApi) {
        return buildAsyncApiTree(jsObj);
    }

    return [];
}

/**
 * Build tree for OpenAPI document.
 */
function buildOpenApiTree(spec: any): TreeNode[] {
    const nodes: TreeNode[] = [];

    // Info node
    if (spec.info) {
        nodes.push({
            id: 'info',
            label: 'Info',
            type: 'info',
            expanded: false
        });
    }

    // Servers node
    if (spec.servers && Array.isArray(spec.servers) && spec.servers.length > 0) {
        const serverChildren: TreeNode[] = spec.servers.map((server: any, index: number) => ({
            id: `server-${index}`,
            label: server.description || server.url || `Server ${index + 1}`,
            type: 'server',
            path: index.toString(),
            context: { index }
        }));

        nodes.push({
            id: 'servers',
            label: 'Servers',
            type: 'servers',
            children: serverChildren,
            expanded: false
        });
    }

    // Paths node
    if (spec.paths && typeof spec.paths === 'object') {
        const pathChildren: TreeNode[] = Object.keys(spec.paths).map(pathKey => {
            const pathItem = spec.paths[pathKey];
            const operations = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
            const operationChildren: TreeNode[] = [];

            operations.forEach(method => {
                if (pathItem[method]) {
                    const operation = pathItem[method];
                    const operationId = operation.operationId || '';
                    const summary = operation.summary || '';
                    const label = operationId || summary || method.toUpperCase();

                    operationChildren.push({
                        id: `path-${pathKey}-${method}`,
                        label: `${method.toUpperCase()}: ${label}`,
                        type: 'operation',
                        path: pathKey,
                        context: { method, operationId, summary }
                    });
                }
            });

            return {
                id: `path-${pathKey}`,
                label: pathKey,
                type: 'path',
                path: pathKey,
                children: operationChildren.length > 0 ? operationChildren : undefined,
                expanded: false
            };
        });

        if (pathChildren.length > 0) {
            nodes.push({
                id: 'paths',
                label: 'Paths',
                type: 'paths',
                children: pathChildren,
                expanded: true
            });
        }
    }

    // Components node (OpenAPI 3.x)
    if (spec.components && typeof spec.components === 'object') {
        const componentChildren: TreeNode[] = [];

        // Schemas
        if (spec.components.schemas && typeof spec.components.schemas === 'object') {
            const schemaChildren: TreeNode[] = Object.keys(spec.components.schemas).map(schemaName => ({
                id: `schema-${schemaName}`,
                label: schemaName,
                type: 'schema',
                path: schemaName,
                context: { schemaName }
            }));

            componentChildren.push({
                id: 'schemas',
                label: 'Schemas',
                type: 'schemas',
                children: schemaChildren,
                expanded: false
            });
        }

        // TODO: Add other component types (responses, parameters, examples, etc.)

        if (componentChildren.length > 0) {
            nodes.push({
                id: 'components',
                label: 'Components',
                type: 'components',
                children: componentChildren,
                expanded: false
            });
        }
    }

    // Definitions node (OpenAPI 2.0 / Swagger)
    if (spec.definitions && typeof spec.definitions === 'object') {
        const definitionChildren: TreeNode[] = Object.keys(spec.definitions).map(defName => ({
            id: `definition-${defName}`,
            label: defName,
            type: 'schema',
            path: defName,
            context: { schemaName: defName }
        }));

        if (definitionChildren.length > 0) {
            nodes.push({
                id: 'definitions',
                label: 'Definitions',
                type: 'schemas',
                children: definitionChildren,
                expanded: false
            });
        }
    }

    // Security Definitions (OpenAPI 2.0) or Security Schemes (OpenAPI 3.x)
    const securityDefs = spec.securityDefinitions || spec.components?.securitySchemes;
    if (securityDefs && typeof securityDefs === 'object') {
        const securityChildren: TreeNode[] = Object.keys(securityDefs).map(schemeName => ({
            id: `security-${schemeName}`,
            label: schemeName,
            type: 'securityScheme',
            path: schemeName,
            context: { schemeName }
        }));

        if (securityChildren.length > 0) {
            nodes.push({
                id: 'security',
                label: 'Security',
                type: 'security',
                children: securityChildren,
                expanded: false
            });
        }
    }

    // Tags
    if (spec.tags && Array.isArray(spec.tags) && spec.tags.length > 0) {
        const tagChildren: TreeNode[] = spec.tags.map((tag: any, index: number) => ({
            id: `tag-${tag.name || index}`,
            label: tag.name || `Tag ${index + 1}`,
            type: 'tag',
            path: tag.name,
            context: { tagName: tag.name, description: tag.description }
        }));

        nodes.push({
            id: 'tags',
            label: 'Tags',
            type: 'tags',
            children: tagChildren,
            expanded: false
        });
    }

    return nodes;
}

/**
 * Build tree for AsyncAPI document.
 */
function buildAsyncApiTree(spec: any): TreeNode[] {
    const nodes: TreeNode[] = [];

    // Info node
    if (spec.info) {
        nodes.push({
            id: 'info',
            label: 'Info',
            type: 'info',
            expanded: false
        });
    }

    // Servers node
    if (spec.servers && typeof spec.servers === 'object') {
        const serverChildren: TreeNode[] = Object.keys(spec.servers).map(serverKey => {
            const server = spec.servers[serverKey];
            return {
                id: `server-${serverKey}`,
                label: server.description || serverKey,
                type: 'server',
                path: serverKey,
                context: { serverKey }
            };
        });

        if (serverChildren.length > 0) {
            nodes.push({
                id: 'servers',
                label: 'Servers',
                type: 'servers',
                children: serverChildren,
                expanded: false
            });
        }
    }

    // Channels node
    if (spec.channels && typeof spec.channels === 'object') {
        const channelChildren: TreeNode[] = Object.keys(spec.channels).map(channelKey => {
            const channel = spec.channels[channelKey];
            const operationChildren: TreeNode[] = [];

            // Publish operation
            if (channel.publish) {
                operationChildren.push({
                    id: `channel-${channelKey}-publish`,
                    label: 'publish',
                    type: 'operation',
                    path: channelKey,
                    context: { channelKey, operation: 'publish' }
                });
            }

            // Subscribe operation
            if (channel.subscribe) {
                operationChildren.push({
                    id: `channel-${channelKey}-subscribe`,
                    label: 'subscribe',
                    type: 'operation',
                    path: channelKey,
                    context: { channelKey, operation: 'subscribe' }
                });
            }

            return {
                id: `channel-${channelKey}`,
                label: channelKey,
                type: 'channel',
                path: channelKey,
                children: operationChildren.length > 0 ? operationChildren : undefined,
                expanded: false
            };
        });

        if (channelChildren.length > 0) {
            nodes.push({
                id: 'channels',
                label: 'Channels',
                type: 'channels',
                children: channelChildren,
                expanded: true
            });
        }
    }

    // Components node
    if (spec.components && typeof spec.components === 'object') {
        const componentChildren: TreeNode[] = [];

        // Messages
        if (spec.components.messages && typeof spec.components.messages === 'object') {
            const messageChildren: TreeNode[] = Object.keys(spec.components.messages).map(messageName => ({
                id: `message-${messageName}`,
                label: messageName,
                type: 'message',
                path: messageName,
                context: { messageName }
            }));

            componentChildren.push({
                id: 'messages',
                label: 'Messages',
                type: 'messages',
                children: messageChildren,
                expanded: false
            });
        }

        // Schemas
        if (spec.components.schemas && typeof spec.components.schemas === 'object') {
            const schemaChildren: TreeNode[] = Object.keys(spec.components.schemas).map(schemaName => ({
                id: `schema-${schemaName}`,
                label: schemaName,
                type: 'schema',
                path: schemaName,
                context: { schemaName }
            }));

            componentChildren.push({
                id: 'schemas',
                label: 'Schemas',
                type: 'schemas',
                children: schemaChildren,
                expanded: false
            });
        }

        if (componentChildren.length > 0) {
            nodes.push({
                id: 'components',
                label: 'Components',
                type: 'components',
                children: componentChildren,
                expanded: false
            });
        }
    }

    return nodes;
}
