import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { IconService } from '../services/iconService';
import { RegistryItem, RegistryItemType } from '../models/registryModels';

export class RegistryTreeDataProvider implements vscode.TreeDataProvider<RegistryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<RegistryItem | undefined | null | void> = new vscode.EventEmitter<RegistryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<RegistryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private connection: any = null;
    private isConnected: boolean = false;

    // Search filter state
    private searchFilter: { criterion: string; value: string } | null = null;

    constructor(private registryService: RegistryService) {}

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
     * This will show only artifacts matching the search criteria.
     */
    applySearchFilter(criterion: string, value: string): void {
        this.searchFilter = { criterion, value };
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
        return `Filtered by ${this.searchFilter.criterion}: "${this.searchFilter.value}"`;
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

        // Build search params
        const searchParams: Record<string, string> = {};
        searchParams[this.searchFilter.criterion] = this.searchFilter.value;

        const artifacts = await this.registryService.searchArtifacts(searchParams);

        if (artifacts.length === 0) {
            return [
                new RegistryItem(
                    'No matching artifacts',
                    RegistryItemType.Connection,
                    undefined,
                    { description: `No artifacts found matching ${this.searchFilter.criterion}: "${this.searchFilter.value}"` }
                )
            ];
        }

        // Map artifacts to tree items with group prefix
        return artifacts.map(artifact => new RegistryItem(
            `${artifact.groupId}/${artifact.artifactId}`,
            RegistryItemType.Artifact,
            artifact.artifactId,
            {
                artifactType: artifact.artifactType,
                state: artifact.state,
                description: artifact.description,
                modifiedOn: artifact.modifiedOn
            },
            artifact.groupId,  // parentId
            artifact.groupId   // groupId (needed for commands)
        ));
    }
}