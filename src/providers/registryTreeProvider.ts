import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { IconService } from '../services/iconService';
import { RegistryItem, RegistryItemType } from '../models/registryModels';
import { formatLabelsForTooltip, getLabelCountDescription } from '../utils/metadataUtils';

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

                // Enhanced tooltip with artifact count, labels, and rules
                const artifactCount = element.metadata?.artifactCount || 0;
                const groupLabels = element.metadata?.labels || {};
                const groupLabelTooltip = formatLabelsForTooltip(groupLabels);
                const groupRules = element.metadata?.rules || [];

                treeItem.tooltip = new vscode.MarkdownString();
                treeItem.tooltip.appendMarkdown(`**Group: ${element.label}**\n\n`);
                treeItem.tooltip.appendMarkdown(`- Artifacts: ${artifactCount}\n`);
                if (element.metadata?.description) {
                    treeItem.tooltip.appendMarkdown(`- Description: ${element.metadata.description}\n`);
                }
                if (groupRules.length > 0) {
                    treeItem.tooltip.appendMarkdown(`- Rules: ${groupRules.length} configured\n`);
                }
                if (groupLabelTooltip) {
                    treeItem.tooltip.appendMarkdown(`\n**Labels:**\n${groupLabelTooltip}`);
                }
                if (groupRules.length > 0) {
                    treeItem.tooltip.appendMarkdown(`\n**Rules:**\n`);
                    groupRules.forEach((rule: any) => {
                        (treeItem.tooltip as vscode.MarkdownString).appendMarkdown(`- ${rule.ruleType}: ${rule.config}\n`);
                    });
                }

                // Add artifact count, label count, and rule count to description (respects preference)
                const showArtifactCounts = config.get<boolean>('display.showArtifactCounts', true);
                const descriptionParts: string[] = [];
                if (showArtifactCounts && artifactCount > 0) {
                    descriptionParts.push(`${artifactCount}`);
                }
                const labelCountDesc = getLabelCountDescription(groupLabels);
                if (labelCountDesc) {
                    descriptionParts.push(labelCountDesc);
                }
                if (groupRules.length > 0) {
                    descriptionParts.push(`${groupRules.length} rule${groupRules.length > 1 ? 's' : ''}`);
                }
                if (descriptionParts.length > 0) {
                    treeItem.description = `(${descriptionParts.join(', ')})`;
                }
                break;

            case RegistryItemType.Artifact:
                treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

                // Use IconService to get type-specific icon
                const artifactType = element.metadata?.artifactType;
                treeItem.iconPath = IconService.getIconForArtifactType(artifactType);

                // Enhanced context value with type for future menu filtering
                treeItem.contextValue = `artifact${artifactType ? '-' + artifactType : ''}`;

                // Enhanced tooltip with type, state, labels, and rules
                const typeLabel = IconService.getArtifactTypeLabel(artifactType);
                const state = element.metadata?.state;
                const stateLabel = state ? IconService.getStateLabel(state) : '';
                const stateEmoji = state ? IconService.getStateEmoji(state) : '';
                const artifactLabels = element.metadata?.labels || {};
                const artifactLabelTooltip = formatLabelsForTooltip(artifactLabels);
                const artifactRules = element.metadata?.rules || [];

                treeItem.tooltip = new vscode.MarkdownString();
                treeItem.tooltip.appendMarkdown(`**${element.label}**\n\n`);
                treeItem.tooltip.appendMarkdown(`- Type: ${typeLabel}\n`);
                if (state) {
                    treeItem.tooltip.appendMarkdown(`- State: ${stateEmoji} ${stateLabel}\n`);
                }
                if (element.metadata?.description) {
                    treeItem.tooltip.appendMarkdown(`- Description: ${element.metadata.description}\n`);
                }
                if (artifactRules.length > 0) {
                    treeItem.tooltip.appendMarkdown(`- Rules: ${artifactRules.length} configured\n`);
                }
                if (artifactLabelTooltip) {
                    treeItem.tooltip.appendMarkdown(`\n**Labels:**\n${artifactLabelTooltip}`);
                }
                if (artifactRules.length > 0) {
                    treeItem.tooltip.appendMarkdown(`\n**Rules:**\n`);
                    artifactRules.forEach((rule: any) => {
                        (treeItem.tooltip as vscode.MarkdownString).appendMarkdown(`- ${rule.ruleType}: ${rule.config}\n`);
                    });
                }

                // Add state indicator, description, and label count to tree item
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

                // Add label count and rule count
                const artifactLabelCount = getLabelCountDescription(artifactLabels);
                if (artifactLabelCount) {
                    description += (description ? ' ' : '') + artifactLabelCount;
                }
                if (artifactRules.length > 0) {
                    const ruleCountDesc = `(${artifactRules.length} rule${artifactRules.length > 1 ? 's' : ''})`;
                    description += (description ? ' ' : '') + ruleCountDesc;
                }

                if (description) {
                    treeItem.description = description;
                }
                break;

            case RegistryItemType.Branch:
                treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                treeItem.iconPath = IconService.getBranchIcon();

                // Set context value based on whether it's system-defined
                const systemDefined = element.metadata?.systemDefined;
                treeItem.contextValue = systemDefined ? 'branch-system' : 'branch-custom';

                // Enhanced tooltip with branch metadata
                treeItem.tooltip = new vscode.MarkdownString();
                treeItem.tooltip.appendMarkdown(`**Branch: ${element.label}**\n\n`);
                if (systemDefined) {
                    treeItem.tooltip.appendMarkdown(`- Type: System-defined\n`);
                } else {
                    treeItem.tooltip.appendMarkdown(`- Type: Custom\n`);
                }
                if (element.metadata?.description) {
                    treeItem.tooltip.appendMarkdown(`- Description: ${element.metadata.description}\n`);
                }
                if (element.metadata?.createdOn) {
                    treeItem.tooltip.appendMarkdown(`- Created: ${new Date(element.metadata.createdOn).toLocaleString()}\n`);
                }
                if (element.metadata?.modifiedOn) {
                    treeItem.tooltip.appendMarkdown(`- Modified: ${new Date(element.metadata.modifiedOn).toLocaleString()}\n`);
                }

                // Add description for system branches
                if (systemDefined) {
                    treeItem.description = 'system';
                } else if (element.metadata?.description) {
                    // Truncate description if too long
                    const truncateDescriptions = config.get<boolean>('display.truncateDescriptions', true);
                    const truncateLength = config.get<number>('display.truncateLength', 50);

                    if (truncateDescriptions && element.metadata.description.length > truncateLength) {
                        treeItem.description = element.metadata.description.substring(0, truncateLength) + '...';
                    } else {
                        treeItem.description = element.metadata.description;
                    }
                }
                break;

            case RegistryItemType.Version:
                treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;

                // Enhanced tooltip with state, metadata, and labels
                const versionState = element.metadata?.state;
                const versionStateLabel = versionState ? IconService.getStateLabel(versionState) : '';
                const versionStateEmoji = versionState ? IconService.getStateEmoji(versionState) : '';
                const versionLabels = element.metadata?.labels || {};
                const versionLabelTooltip = formatLabelsForTooltip(versionLabels);
                const versionLabelCount = getLabelCountDescription(versionLabels);

                // Set context value based on state for menu visibility
                let baseDescription = '';
                if (versionState === 'DRAFT') {
                    treeItem.contextValue = 'version-draft';
                    const stateIcon = IconService.getIconForState(versionState);
                    treeItem.iconPath = stateIcon || IconService.getVersionIcon();
                    baseDescription = 'draft';
                } else if (versionState === 'ENABLED') {
                    treeItem.contextValue = 'version-published';
                    treeItem.iconPath = IconService.getVersionIcon();
                } else if (versionState === 'DISABLED') {
                    treeItem.contextValue = 'version-disabled';
                    const stateIcon = IconService.getIconForState(versionState);
                    treeItem.iconPath = stateIcon || IconService.getVersionIcon();
                    baseDescription = 'disabled';
                } else if (versionState === 'DEPRECATED') {
                    treeItem.contextValue = 'version-deprecated';
                    const stateIcon = IconService.getIconForState(versionState);
                    treeItem.iconPath = stateIcon || IconService.getVersionIcon();
                    baseDescription = 'deprecated';
                } else {
                    treeItem.contextValue = 'version';
                    treeItem.iconPath = IconService.getVersionIcon();
                }

                // Build description with state and label count
                if (versionLabelCount) {
                    treeItem.description = baseDescription
                        ? `${baseDescription} ${versionLabelCount}`
                        : versionLabelCount.replace(/^\(|\)$/g, ''); // Remove parens if no state
                } else if (baseDescription) {
                    treeItem.description = baseDescription;
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
                if (versionLabelTooltip) {
                    treeItem.tooltip.appendMarkdown(`\n**Labels:**\n${versionLabelTooltip}`);
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
                // Artifact level: return branches
                return await this.getBranches(element.parentId!, element.id!);
            } else if (element.type === RegistryItemType.Branch) {
                // Branch level: return versions
                return await this.getBranchVersions(element.groupId!, element.parentId!, element.id!);
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

    /**
     * Get parent of a tree item.
     * Required for TreeView.reveal() functionality.
     */
    getParent(element: RegistryItem): RegistryItem | undefined {
        if (!element) {
            return undefined;
        }

        switch (element.type) {
            case RegistryItemType.Group:
                // Groups are at root level, no parent
                return undefined;

            case RegistryItemType.Artifact:
                // Artifact's parent is a Group
                if (element.parentId) {
                    return new RegistryItem(
                        element.parentId,
                        RegistryItemType.Group,
                        element.parentId
                    );
                }
                return undefined;

            case RegistryItemType.Version:
                // Version's parent is an Artifact
                if (element.parentId && element.groupId) {
                    return new RegistryItem(
                        element.parentId,
                        RegistryItemType.Artifact,
                        element.parentId,
                        {},
                        element.groupId,  // parentId of artifact is groupId
                        element.groupId   // groupId
                    );
                }
                return undefined;

            default:
                return undefined;
        }
    }

    /**
     * Sort groups based on user preference.
     */
    private sortGroups(groups: RegistryItem[]): RegistryItem[] {
        const config = this.getConfig();
        const sortBy = config.get<string>('display.sortGroups', 'alphabetical');

        switch (sortBy) {
            case 'modified-date':
                return groups.sort((a, b) => {
                    const dateA = new Date(a.metadata?.modifiedOn || 0).getTime();
                    const dateB = new Date(b.metadata?.modifiedOn || 0).getTime();
                    return dateB - dateA; // Newest first
                });
            case 'artifact-count':
                return groups.sort((a, b) => {
                    const countA = a.metadata?.artifactCount || 0;
                    const countB = b.metadata?.artifactCount || 0;
                    return countB - countA; // Most artifacts first
                });
            case 'alphabetical':
            default:
                return groups.sort((a, b) => a.label.localeCompare(b.label));
        }
    }

    /**
     * Sort artifacts based on user preference.
     */
    private sortArtifacts(artifacts: RegistryItem[]): RegistryItem[] {
        const config = this.getConfig();
        const sortBy = config.get<string>('display.sortArtifacts', 'alphabetical');

        switch (sortBy) {
            case 'modified-date':
                return artifacts.sort((a, b) => {
                    const dateA = new Date(a.metadata?.modifiedOn || 0).getTime();
                    const dateB = new Date(b.metadata?.modifiedOn || 0).getTime();
                    return dateB - dateA; // Newest first
                });
            case 'artifact-type':
                return artifacts.sort((a, b) => {
                    const typeA = a.metadata?.artifactType || '';
                    const typeB = b.metadata?.artifactType || '';
                    return typeA.localeCompare(typeB);
                });
            case 'alphabetical':
            default:
                return artifacts.sort((a, b) => a.label.localeCompare(b.label));
        }
    }

    /**
     * Sort branches based on user preference.
     */
    private sortBranches(branches: RegistryItem[]): RegistryItem[] {
        const config = this.getConfig();
        const sortBy = config.get<string>('display.sortBranches', 'system-first');

        if (sortBy === 'alphabetical') {
            return branches.sort((a, b) => a.label.localeCompare(b.label));
        } else {
            // system-first (default)
            return branches.sort((a, b) => {
                if (a.metadata?.systemDefined && !b.metadata?.systemDefined) {
                    return -1;
                }
                if (!a.metadata?.systemDefined && b.metadata?.systemDefined) {
                    return 1;
                }
                return a.label.localeCompare(b.label);
            });
        }
    }

    /**
     * Filter groups based on user preferences.
     */
    private filterGroups(groups: RegistryItem[]): RegistryItem[] {
        const config = this.getConfig();
        const hideEmpty = config.get<boolean>('filter.hideEmptyGroups', false);

        if (hideEmpty) {
            return groups.filter(g => (g.metadata?.artifactCount || 0) > 0);
        }
        return groups;
    }

    /**
     * Filter artifacts based on user preferences.
     */
    private filterArtifacts(artifacts: RegistryItem[]): RegistryItem[] {
        const config = this.getConfig();
        const hideDisabled = config.get<boolean>('filter.hideDisabled', false);
        const allowedTypes = config.get<string[]>('filter.artifactTypes', []);

        let filtered = artifacts;

        if (hideDisabled) {
            filtered = filtered.filter(a => a.metadata?.state !== 'DISABLED');
        }

        if (allowedTypes.length > 0) {
            filtered = filtered.filter(a =>
                allowedTypes.includes(a.metadata?.artifactType || '')
            );
        }

        return filtered;
    }

    /**
     * Filter versions based on user preferences.
     */
    private filterVersions(versions: RegistryItem[]): RegistryItem[] {
        const config = this.getConfig();
        const hideDisabled = config.get<boolean>('filter.hideDisabled', false);
        const hideDeprecated = config.get<boolean>('filter.hideDeprecated', false);

        let filtered = versions;

        if (hideDisabled) {
            filtered = filtered.filter(v => v.metadata?.state !== 'DISABLED');
        }

        if (hideDeprecated) {
            filtered = filtered.filter(v => v.metadata?.state !== 'DEPRECATED');
        }

        return filtered;
    }

    private async getGroups(): Promise<RegistryItem[]> {
        const groups = await this.registryService.searchGroups();

        // Fetch rules for each group
        const groupsWithRules = await Promise.all(
            groups.map(async (group) => {
                let rules: any[] = [];
                try {
                    const ruleTypes = await this.registryService.getGroupRules(group.groupId!);
                    // Fetch details for each rule
                    rules = await Promise.all(
                        ruleTypes.map(async (ruleType) => {
                            try {
                                return await this.registryService.getGroupRule(group.groupId!, ruleType);
                            } catch {
                                return null;
                            }
                        })
                    );
                    rules = rules.filter(r => r !== null);
                } catch {
                    // No rules or error fetching - that's okay
                    rules = [];
                }

                return new RegistryItem(
                    group.groupId || 'default',
                    RegistryItemType.Group,
                    group.groupId,
                    {
                        artifactCount: group.artifactCount,
                        description: group.description,
                        modifiedOn: group.modifiedOn,
                        labels: group.labels,
                        rules: rules
                    }
                );
            })
        );

        // Apply filters and sorting
        const filtered = this.filterGroups(groupsWithRules);
        const sorted = this.sortGroups(filtered);

        return sorted;
    }

    private async getArtifacts(groupId: string): Promise<RegistryItem[]> {
        const artifacts = await this.registryService.getArtifacts(groupId);

        // Fetch rules for each artifact
        const artifactsWithRules = await Promise.all(
            artifacts.map(async (artifact) => {
                let rules: any[] = [];
                try {
                    const ruleTypes = await this.registryService.getArtifactRules(groupId, artifact.artifactId!);
                    // Fetch details for each rule
                    rules = await Promise.all(
                        ruleTypes.map(async (ruleType) => {
                            try {
                                return await this.registryService.getArtifactRule(groupId, artifact.artifactId!, ruleType);
                            } catch {
                                return null;
                            }
                        })
                    );
                    rules = rules.filter(r => r !== null);
                } catch {
                    // No rules or error fetching - that's okay
                    rules = [];
                }

                return new RegistryItem(
                    artifact.artifactId || 'unknown',
                    RegistryItemType.Artifact,
                    artifact.artifactId,
                    {
                        artifactType: artifact.artifactType,
                        state: artifact.state,
                        description: artifact.description,
                        modifiedOn: artifact.modifiedOn,
                        labels: artifact.labels,
                        rules: rules
                    },
                    groupId,  // parentId (the group this artifact belongs to)
                    groupId   // groupId (needed for commands that require groupId)
                );
            })
        );

        // Apply filters and sorting
        const filtered = this.filterArtifacts(artifactsWithRules);
        const sorted = this.sortArtifacts(filtered);

        return sorted;
    }

    /**
     * Get branches for an artifact.
     */
    private async getBranches(groupId: string, artifactId: string): Promise<RegistryItem[]> {
        try {
            const branches = await this.registryService.getBranches(groupId, artifactId);

            if (branches.length === 0) {
                return [
                    new RegistryItem(
                        'No branches',
                        RegistryItemType.Connection,
                        undefined,
                        { description: 'No branches found for this artifact' }
                    )
                ];
            }

            // Convert to RegistryItems
            const branchItems = branches.map(branch => new RegistryItem(
                branch.branchId,
                RegistryItemType.Branch,
                branch.branchId,
                {
                    systemDefined: branch.systemDefined,
                    description: branch.description,
                    createdOn: branch.createdOn,
                    modifiedOn: branch.modifiedOn,
                    owner: branch.owner
                },
                artifactId,  // parent is artifact
                groupId      // store groupId for later use
            ));

            // Apply sorting (no filters for branches)
            const sorted = this.sortBranches(branchItems);

            return sorted;
        } catch (error) {
            console.error('Error fetching branches:', error);
            return [
                new RegistryItem(
                    'Error loading branches',
                    RegistryItemType.Connection,
                    undefined,
                    { description: `Error: ${error instanceof Error ? error.message : String(error)}` }
                )
            ];
        }
    }

    /**
     * Get versions in a branch.
     */
    private async getBranchVersions(groupId: string, artifactId: string, branchId: string): Promise<RegistryItem[]> {
        const config = this.getConfig();
        const reverseVersionOrder = config.get<boolean>('display.reverseVersionOrder', false);

        try {
            let versions = await this.registryService.getBranchVersions(groupId, artifactId, branchId);

            if (versions.length === 0) {
                return [
                    new RegistryItem(
                        'No versions',
                        RegistryItemType.Connection,
                        undefined,
                        { description: 'No versions in this branch' }
                    )
                ];
            }

            // Apply version ordering preference
            if (reverseVersionOrder) {
                versions = versions.reverse();
            }

            // Create RegistryItem objects
            const versionItems = versions.map(version => new RegistryItem(
                version.version || 'unknown',
                RegistryItemType.Version,
                version.version,
                {
                    versionId: version.versionId,
                    globalId: version.globalId,
                    state: version.state,
                    createdOn: version.createdOn,
                    labels: version.labels
                },
                artifactId,
                groupId
            ));

            // Apply filters
            const filtered = this.filterVersions(versionItems);

            return filtered;
        } catch (error) {
            console.error('Error fetching branch versions:', error);
            return [
                new RegistryItem(
                    'Error loading versions',
                    RegistryItemType.Connection,
                    undefined,
                    { description: `Error: ${error instanceof Error ? error.message : String(error)}` }
                )
            ];
        }
    }

    private async getVersions(groupId: string, artifactId: string, artifactType?: string): Promise<RegistryItem[]> {
        const config = this.getConfig();
        const reverseVersionOrder = config.get<boolean>('display.reverseVersionOrder', false);

        let versions = await this.registryService.getVersions(groupId, artifactId);

        // Apply version ordering preference
        if (reverseVersionOrder) {
            versions = versions.reverse();
        }

        // Create RegistryItem objects
        const versionItems = versions.map(version => new RegistryItem(
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

        // Apply filters
        const filtered = this.filterVersions(versionItems);

        return filtered;
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