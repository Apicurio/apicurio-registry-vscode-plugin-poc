import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { IconService } from '../services/iconService';
import { RegistryItem, RegistryItemType } from '../models/registryModels';

export class RegistryTreeDataProvider implements vscode.TreeDataProvider<RegistryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<RegistryItem | undefined | null | void> = new vscode.EventEmitter<RegistryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<RegistryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private connection: any = null;
    private isConnected: boolean = false;
    private treeView?: vscode.TreeView<RegistryItem>;

    // Search filter state
    private searchFilter: {
        mode: 'artifact' | 'version' | 'group';
        criteria: Record<string, string>;
    } | null = null;

    constructor(private registryService: RegistryService) {}

    /**
     * Set the tree view instance for reveal/expand functionality.
     */
    setTreeView(treeView: vscode.TreeView<RegistryItem>): void {
        this.treeView = treeView;
    }

    /**
     * Get user configuration for the extension.
     */
    private getConfig() {
        return vscode.workspace.getConfiguration('apicurioRegistry');
    }

    async connect(connection: any): Promise<void> {
        this.connection = connection;
        this.registryService.setConnection(connection);
        this.isConnected = true;
        this.refresh();
    }

    disconnect(): void {
        this.connection = null;
        this.isConnected = false;
        this.registryService.disconnect();
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Apply a search filter to the tree view.
     * Supports multi-field filtering and different search modes.
     * Auto-expands groups with matches.
     */
    async applySearchFilter(mode: 'artifact' | 'version' | 'group', criteria: Record<string, string>): Promise<void> {
        this.searchFilter = { mode, criteria };
        this.refresh();

        // Auto-expand matched nodes after a delay to allow tree refresh
        // Longer delay needed for tree to fully render before expansion
        setTimeout(() => this.expandMatchedNodes(), 500);
    }

    /**
     * Auto-expand all nodes that contain search matches.
     * Recursively expands groups → artifacts → versions.
     */
    private async expandMatchedNodes(): Promise<void> {
        if (!this.treeView || !this.searchFilter) {
            console.log('Auto-expand skipped: no treeView or searchFilter');
            return;
        }

        console.log('Auto-expand starting for mode:', this.searchFilter.mode);

        try {
            // Get root level items (groups with matches)
            const rootItems = await this.getChildren(undefined);
            console.log('Root items count:', rootItems.length);

            // Expand based on search mode
            switch (this.searchFilter.mode) {
                case 'artifact':
                    // Expand groups to show artifacts
                    await this.expandGroups(rootItems);
                    break;

                case 'version':
                    // Expand groups AND artifacts to show versions
                    await this.expandGroupsAndArtifacts(rootItems);
                    break;

                case 'group':
                    // Expand matched groups to show their contents
                    await this.expandGroups(rootItems);
                    break;
            }

            console.log('Auto-expand completed');
        } catch (error) {
            console.error('Failed to auto-expand nodes:', error);
        }
    }

    /**
     * Expand all groups to show artifacts.
     */
    private async expandGroups(groups: RegistryItem[]): Promise<void> {
        for (const group of groups) {
            if (group.type === RegistryItemType.Group) {
                console.log('Expanding group:', group.label);
                try {
                    await this.treeView!.reveal(group, {
                        select: false,
                        focus: false,
                        expand: 1  // Expand 1 level
                    });
                } catch (error) {
                    console.error('Error expanding group:', group.label, error);
                }
            }
        }
    }

    /**
     * Expand groups and their artifacts to show versions.
     */
    private async expandGroupsAndArtifacts(groups: RegistryItem[]): Promise<void> {
        for (const group of groups) {
            if (group.type === RegistryItemType.Group) {
                console.log('Expanding group:', group.label);

                // Expand group first
                try {
                    await this.treeView!.reveal(group, {
                        select: false,
                        focus: false,
                        expand: 1
                    });

                    // Get artifacts in this group
                    const artifacts = await this.getChildren(group);
                    console.log('Artifacts in group:', artifacts.length);

                    // Expand each artifact to show versions
                    for (const artifact of artifacts) {
                        if (artifact.type === RegistryItemType.Artifact) {
                            console.log('Expanding artifact:', artifact.label);
                            try {
                                await this.treeView!.reveal(artifact, {
                                    select: false,
                                    focus: false,
                                    expand: 1
                                });
                            } catch (error) {
                                console.error('Error expanding artifact:', artifact.label, error);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error expanding group:', group.label, error);
                }
            }
        }
    }

    /**
     * Legacy method for backward compatibility with basic search.
     * Converts single-field search to new format.
     */
    applySearchFilterLegacy(criterion: string, value: string): void {
        this.searchFilter = {
            mode: 'artifact',
            criteria: { [criterion]: value }
        };
        this.refresh();
    }

    /**
     * Clear the current search filter and show all items.
     */
    clearSearchFilter(): void {
        this.searchFilter = null;
        this.refresh();
    }

    /**
     * Check if a search filter is currently active.
     */
    hasActiveFilter(): boolean {
        return this.searchFilter !== null;
    }

    /**
     * Get the current search filter description for display.
     */
    getFilterDescription(): string | null {
        if (!this.searchFilter) {
            return null;
        }
        const criteriaDesc = Object.entries(this.searchFilter.criteria)
            .map(([key, value]) => `${key}="${value}"`)
            .join(', ');
        return `Filtered by ${criteriaDesc}`;
    }

    getTreeItem(element: RegistryItem): vscode.TreeItem {
        const config = this.getConfig();

        // Determine label based on preferences
        let label = element.label;
        if (element.type === RegistryItemType.Artifact) {
            const useArtifactNames = config.get<boolean>('display.useArtifactNames', false);
            if (useArtifactNames && element.metadata?.name) {
                label = element.metadata.name;
            }
        }

        const treeItem = new vscode.TreeItem(label);

        switch (element.type) {
            case RegistryItemType.Group:
                treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                treeItem.iconPath = IconService.getGroupIcon();
                treeItem.contextValue = 'group';

                // Enhanced tooltip with artifact count
                const artifactCount = element.metadata?.artifactCount || 0;
                treeItem.tooltip = `Group: ${element.label}\nArtifacts: ${artifactCount}`;

                // Add artifact count to description (respects preference)
                const showArtifactCounts = config.get<boolean>('display.showArtifactCounts', true);
                if (showArtifactCounts && artifactCount > 0) {
                    treeItem.description = `(${artifactCount})`;
                }
                break;

            case RegistryItemType.Artifact:
                treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

                // Use IconService to get type-specific icon
                const artifactType = element.metadata?.artifactType;
                treeItem.iconPath = IconService.getIconForArtifactType(artifactType);

                // Enhanced context value with type for future menu filtering
                treeItem.contextValue = `artifact${artifactType ? '-' + artifactType : ''}`;

                // Enhanced tooltip with type and state
                const typeLabel = IconService.getArtifactTypeLabel(artifactType);
                const state = element.metadata?.state;
                const stateLabel = state ? IconService.getStateLabel(state) : '';
                const stateEmoji = state ? IconService.getStateEmoji(state) : '';

                treeItem.tooltip = new vscode.MarkdownString();
                treeItem.tooltip.appendMarkdown(`**${element.label}**\n\n`);
                treeItem.tooltip.appendMarkdown(`- Type: ${typeLabel}\n`);
                if (state) {
                    treeItem.tooltip.appendMarkdown(`- State: ${stateEmoji} ${stateLabel}\n`);
                }
                if (element.metadata?.description) {
                    treeItem.tooltip.appendMarkdown(`- Description: ${element.metadata.description}\n`);
                }

                // Add state indicator and description to tree item
                let description = '';
                if (stateEmoji) {
                    description += `${stateEmoji} `;
                }
                if (element.metadata?.description) {
                    // Apply description truncation preference
                    const truncateDescriptions = config.get<boolean>('display.truncateDescriptions', true);
                    const truncateLength = config.get<number>('display.truncateLength', 50);

                    if (truncateDescriptions && element.metadata.description.length > truncateLength) {
                        const truncated = element.metadata.description.substring(0, truncateLength);
                        description += truncated + '...';
                    } else {
                        description += element.metadata.description;
                    }
                }
                if (description) {
                    treeItem.description = description;
                }
                break;

            case RegistryItemType.Version:
                treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;

                // Enhanced tooltip with state and metadata
                const versionState = element.metadata?.state;
                const versionStateLabel = versionState ? IconService.getStateLabel(versionState) : '';
                const versionStateEmoji = versionState ? IconService.getStateEmoji(versionState) : '';

                // Set context value based on state for menu visibility
                if (versionState === 'DRAFT') {
                    treeItem.contextValue = 'version-draft';
                    // Use state-specific icon for drafts
                    const stateIcon = IconService.getIconForState(versionState);
                    treeItem.iconPath = stateIcon || IconService.getVersionIcon();
                    // Add draft indicator to description
                    treeItem.description = 'draft';
                } else if (versionState === 'ENABLED') {
                    treeItem.contextValue = 'version-published';
                    treeItem.iconPath = IconService.getVersionIcon();
                } else if (versionState === 'DISABLED') {
                    treeItem.contextValue = 'version-disabled';
                    const stateIcon = IconService.getIconForState(versionState);
                    treeItem.iconPath = stateIcon || IconService.getVersionIcon();
                    treeItem.description = 'disabled';
                } else if (versionState === 'DEPRECATED') {
                    treeItem.contextValue = 'version-deprecated';
                    const stateIcon = IconService.getIconForState(versionState);
                    treeItem.iconPath = stateIcon || IconService.getVersionIcon();
                    treeItem.description = 'deprecated';
                } else {
                    // Fallback for unknown or missing state
                    treeItem.contextValue = 'version';
                    treeItem.iconPath = IconService.getVersionIcon();
                }

                treeItem.tooltip = new vscode.MarkdownString();
                treeItem.tooltip.appendMarkdown(`**Version ${element.label}**\n\n`);
                if (versionState) {
                    treeItem.tooltip.appendMarkdown(`- State: ${versionStateEmoji} ${versionStateLabel}\n`);
                }
                if (element.metadata?.globalId) {
                    treeItem.tooltip.appendMarkdown(`- Global ID: ${element.metadata.globalId}\n`);
                }
                if (element.metadata?.createdOn) {
                    treeItem.tooltip.appendMarkdown(`- Created: ${new Date(element.metadata.createdOn).toLocaleString()}\n`);
                }

                // Make versions clickable to open content
                treeItem.command = {
                    command: 'apicurioRegistry.openVersion',
                    title: 'Open Version',
                    arguments: [element]
                };
                break;

            case RegistryItemType.Connection:
                treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
                treeItem.iconPath = IconService.getConnectionIcon();
                treeItem.contextValue = 'connection';
                break;

            default:
                treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }

        return treeItem;
    }

    async getChildren(element?: RegistryItem): Promise<RegistryItem[]> {
        if (!this.isConnected) {
            return [
                new RegistryItem(
                    'Not connected',
                    RegistryItemType.Connection,
                    undefined,
                    { description: 'Click "Connect to Registry" to browse registry content' }
                )
            ];
        }

        try {
            if (!element) {
                // Root level: check if search filter is active
                if (this.searchFilter) {
                    // Show filtered results at root level
                    return await this.getFilteredArtifacts();
                } else {
                    // Normal view: return groups
                    return await this.getGroups();
                }
            } else if (element.type === RegistryItemType.Group) {
                // Group level: return artifacts
                return await this.getArtifacts(element.id!);
            } else if (element.type === RegistryItemType.Artifact) {
                // Artifact level: return versions
                const artifactType = element.metadata?.artifactType;
                return await this.getVersions(element.parentId!, element.id!, artifactType);
            }
        } catch (error) {
            console.error('Error fetching registry data:', error);
            vscode.window.showErrorMessage(`Error fetching registry data: ${error}`);
            return [
                new RegistryItem(
                    'Error loading data',
                    RegistryItemType.Connection,
                    undefined,
                    { description: 'Check connection settings and try again' }
                )
            ];
        }

        return [];
    }

    private async getGroups(): Promise<RegistryItem[]> {
        const groups = await this.registryService.searchGroups();
        return groups.map(group => new RegistryItem(
            group.groupId || 'default',
            RegistryItemType.Group,
            group.groupId,
            {
                artifactCount: group.artifactCount,
                description: group.description,
                modifiedOn: group.modifiedOn
            }
        ));
    }

    private async getArtifacts(groupId: string): Promise<RegistryItem[]> {
        const artifacts = await this.registryService.getArtifacts(groupId);
        return artifacts.map(artifact => new RegistryItem(
            artifact.artifactId || 'unknown',
            RegistryItemType.Artifact,
            artifact.artifactId,
            {
                artifactType: artifact.artifactType,
                state: artifact.state,
                description: artifact.description,
                modifiedOn: artifact.modifiedOn
            },
            groupId,  // parentId (the group this artifact belongs to)
            groupId   // groupId (needed for commands that require groupId)
        ));
    }

    private async getVersions(groupId: string, artifactId: string, artifactType?: string): Promise<RegistryItem[]> {
        const config = this.getConfig();
        const reverseVersionOrder = config.get<boolean>('display.reverseVersionOrder', false);

        let versions = await this.registryService.getVersions(groupId, artifactId);

        // Apply version ordering preference
        if (reverseVersionOrder) {
            versions = versions.reverse();
        }

        return versions.map(version => new RegistryItem(
            version.version || 'unknown',
            RegistryItemType.Version,
            version.version,
            {
                versionId: version.versionId,
                globalId: version.globalId,
                state: version.state,
                createdOn: version.createdOn,
                artifactType: artifactType  // Pass artifact type for syntax highlighting
            },
            artifactId,
            groupId
        ));
    }

    /**
     * Get artifacts filtered by search criteria.
     * Shows artifacts at root level with group prefix.
     */
    private async getFilteredArtifacts(): Promise<RegistryItem[]> {
        if (!this.searchFilter) {
            return [];
        }

        const { mode, criteria } = this.searchFilter;

        try {
            switch (mode) {
                case 'artifact':
                    return await this.getFilteredArtifactResults(criteria);
                case 'version':
                    return await this.getFilteredVersionResults(criteria);
                case 'group':
                    return await this.getFilteredGroupResults(criteria);
                default:
                    return [];
            }
        } catch (error) {
            return [
                new RegistryItem(
                    'Search Error',
                    RegistryItemType.Connection,
                    undefined,
                    { description: `Error: ${error instanceof Error ? error.message : String(error)}` }
                )
            ];
        }
    }

    private async getFilteredArtifactResults(criteria: Record<string, string>): Promise<RegistryItem[]> {
        const artifacts = await this.registryService.searchArtifacts(criteria);

        if (artifacts.length === 0) {
            return [
                new RegistryItem(
                    'No matching artifacts',
                    RegistryItemType.Connection,
                    undefined,
                    { description: `No artifacts found matching criteria` }
                )
            ];
        }

        // Group artifacts by groupId to maintain hierarchy
        const groupedArtifacts = new Map<string, typeof artifacts>();
        for (const artifact of artifacts) {
            const groupId = artifact.groupId || 'default';
            if (!groupedArtifacts.has(groupId)) {
                groupedArtifacts.set(groupId, []);
            }
            groupedArtifacts.get(groupId)!.push(artifact);
        }

        // Create group items with matching artifacts
        const groupItems: RegistryItem[] = [];
        for (const [groupId, groupArtifacts] of groupedArtifacts.entries()) {
            const groupItem = new RegistryItem(
                groupId,
                RegistryItemType.Group,
                groupId,
                { artifactCount: groupArtifacts.length }
            );
            groupItems.push(groupItem);
        }

        return groupItems;
    }

    private async getFilteredVersionResults(criteria: Record<string, string>): Promise<RegistryItem[]> {
        const versions = await this.registryService.searchVersions(criteria);

        if (versions.length === 0) {
            return [
                new RegistryItem(
                    'No matching versions',
                    RegistryItemType.Connection,
                    undefined,
                    { description: `No versions found matching criteria` }
                )
            ];
        }

        // Group versions by artifact
        const groupedVersions = new Map<string, typeof versions>();
        for (const version of versions) {
            const key = `${version.groupId || 'default'}/${version.artifactId}`;
            if (!groupedVersions.has(key)) {
                groupedVersions.set(key, []);
            }
            groupedVersions.get(key)!.push(version);
        }

        // Create group → artifact hierarchy
        const groupMap = new Map<string, RegistryItem[]>();
        for (const [key, artifactVersions] of groupedVersions.entries()) {
            const [groupId, artifactId] = key.split('/');

            if (!groupMap.has(groupId)) {
                groupMap.set(groupId, []);
            }

            const artifactItem = new RegistryItem(
                artifactId,
                RegistryItemType.Artifact,
                artifactId,
                { versionCount: artifactVersions.length },
                groupId,
                groupId
            );
            groupMap.get(groupId)!.push(artifactItem);
        }

        // Create group items
        const groupItems: RegistryItem[] = [];
        for (const [groupId, artifacts] of groupMap.entries()) {
            const groupItem = new RegistryItem(
                groupId,
                RegistryItemType.Group,
                groupId,
                { artifactCount: artifacts.length }
            );
            groupItems.push(groupItem);
        }

        return groupItems;
    }

    private async getFilteredGroupResults(criteria: Record<string, string>): Promise<RegistryItem[]> {
        const groups = await this.registryService.searchGroups(criteria);

        if (groups.length === 0) {
            return [
                new RegistryItem(
                    'No matching groups',
                    RegistryItemType.Connection,
                    undefined,
                    { description: `No groups found matching criteria` }
                )
            ];
        }

        return groups.map(group => new RegistryItem(
            group.groupId || 'default',
            RegistryItemType.Group,
            group.groupId,
            { description: group.description }
        ));
    }
}