import React, { useMemo } from 'react';
import {
    Tree,
    TreeView,
    TreeViewDataItem
} from '@patternfly/react-core';
import {
    InfoCircleIcon,
    FolderIcon,
    FolderOpenIcon,
    CodeIcon,
    CubeIcon,
    KeyIcon,
    TagIcon,
    ServerIcon,
    BundleIcon
} from '@patternfly/react-icons';
import { useDocumentStore } from '../../core/stores/documentStore';
import { useSelectionStore, SelectionType } from '../../core/stores/selectionStore';
import { buildNavigationTree, TreeNode, TreeNodeType } from './treeBuilder';

/**
 * Props for NavigationTree component.
 */
export interface NavigationTreeProps {
    /** Optional CSS class name */
    className?: string;
}

/**
 * Map tree node types to icons.
 */
const getNodeIcon = (type: TreeNodeType): React.ReactNode => {
    switch (type) {
        case 'info':
            return <InfoCircleIcon />;
        case 'servers':
            return <ServerIcon />;
        case 'server':
            return <ServerIcon />;
        case 'paths':
            return <FolderIcon />;
        case 'path':
            return <CodeIcon />;
        case 'operation':
            return <CodeIcon />;
        case 'components':
            return <CubeIcon />;
        case 'schemas':
            return <BundleIcon />;
        case 'schema':
            return <BundleIcon />;
        case 'security':
            return <KeyIcon />;
        case 'securityScheme':
            return <KeyIcon />;
        case 'tags':
            return <TagIcon />;
        case 'tag':
            return <TagIcon />;
        case 'channels':
            return <FolderIcon />;
        case 'channel':
            return <CodeIcon />;
        case 'messages':
            return <BundleIcon />;
        case 'message':
            return <BundleIcon />;
        default:
            return <FolderIcon />;
    }
};

/**
 * Convert TreeNode to PatternFly TreeViewDataItem.
 */
const convertToTreeViewDataItem = (
    node: TreeNode,
    onSelect: (node: TreeNode) => void
): TreeViewDataItem => {
    const item: TreeViewDataItem = {
        id: node.id,
        name: node.label,
        icon: getNodeIcon(node.type),
        children: node.children?.map(child => convertToTreeViewDataItem(child, onSelect)),
        defaultExpanded: node.expanded
    };

    return item;
};

/**
 * NavigationTree component displays the hierarchical structure of the API document.
 *
 * Features:
 * - Hierarchical tree view of document structure
 * - Different icons for different node types
 * - Node selection updates selectionStore
 * - Supports OpenAPI (Info, Paths, Components, Security, Tags)
 * - Supports AsyncAPI (Info, Channels, Components)
 * - Expandable/collapsible nodes
 *
 * **OpenAPI Structure:**
 * ```
 * - Info
 * - Servers
 *   - Server 1
 *   - Server 2
 * - Paths
 *   - /users
 *     - GET
 *     - POST
 *   - /users/{id}
 *     - GET
 *     - PUT
 *     - DELETE
 * - Components
 *   - Schemas
 *     - User
 *     - Error
 * - Security
 *   - API Key
 *   - OAuth2
 * - Tags
 *   - Users
 *   - Admin
 * ```
 *
 * **AsyncAPI Structure:**
 * ```
 * - Info
 * - Servers
 *   - Production
 * - Channels
 *   - user/signedup
 *     - publish
 *     - subscribe
 * - Components
 *   - Messages
 *     - UserSignedUp
 *   - Schemas
 *     - User
 * ```
 */
export const NavigationTree: React.FC<NavigationTreeProps> = ({ className }) => {
    const { document } = useDocumentStore();
    const { select, current } = useSelectionStore();

    /**
     * Build tree structure from document.
     */
    const treeNodes = useMemo(() => {
        if (!document) {
            return [];
        }
        return buildNavigationTree(document);
    }, [document]);

    /**
     * Handle node selection.
     */
    const handleSelect = (node: TreeNode) => {
        // Map tree node to selection
        const selectionType: SelectionType = node.type as SelectionType;

        select({
            type: selectionType,
            path: node.path,
            context: node.context
        });
    };

    /**
     * Convert tree nodes to PatternFly format.
     */
    const treeViewData: TreeViewDataItem[] = useMemo(() => {
        return treeNodes.map(node => convertToTreeViewDataItem(node, handleSelect));
    }, [treeNodes]);

    /**
     * Handle tree item click.
     */
    const onSelect = (_event: React.MouseEvent, item: TreeViewDataItem) => {
        // Find the original TreeNode by ID
        const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
            for (const node of nodes) {
                if (node.id === id) {
                    return node;
                }
                if (node.children) {
                    const found = findNode(node.children, id);
                    if (found) {
                        return found;
                    }
                }
            }
            return null;
        };

        const node = findNode(treeNodes, item.id as string);
        if (node) {
            handleSelect(node);
        }
    };

    if (!document) {
        return (
            <div style={{ padding: '1rem', color: 'var(--pf-v5-global--Color--200)' }}>
                <p>No document loaded</p>
            </div>
        );
    }

    return (
        <div className={className} style={{ padding: '0.5rem' }}>
            <TreeView
                data={treeViewData}
                onSelect={onSelect}
                hasGuides
            />
        </div>
    );
};
