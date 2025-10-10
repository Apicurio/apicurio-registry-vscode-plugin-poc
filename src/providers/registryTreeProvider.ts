import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { IconService } from '../services/iconService';
import { RegistryItem, RegistryItemType } from '../models/registryModels';

export class RegistryTreeDataProvider implements vscode.TreeDataProvider<RegistryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<RegistryItem | undefined | null | void> = new vscode.EventEmitter<RegistryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<RegistryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private connection: any = null;
    private isConnected: boolean = false;

    constructor(private registryService: RegistryService) {}

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

    getTreeItem(element: RegistryItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.label);

        switch (element.type) {
            case RegistryItemType.Group:
                treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                treeItem.iconPath = IconService.getGroupIcon();
                treeItem.contextValue = 'group';

                // Enhanced tooltip with artifact count
                const artifactCount = element.metadata?.artifactCount || 0;
                treeItem.tooltip = `Group: ${element.label}\nArtifacts: ${artifactCount}`;

                // Add artifact count to description
                if (artifactCount > 0) {
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
                    // Show first 30 chars of description
                    const truncated = element.metadata.description.substring(0, 30);
                    description += truncated + (element.metadata.description.length > 30 ? '...' : '');
                }
                if (description) {
                    treeItem.description = description;
                }
                break;

            case RegistryItemType.Version:
                treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
                treeItem.iconPath = IconService.getVersionIcon();
                treeItem.contextValue = 'version';

                // Enhanced tooltip with state and metadata
                const versionState = element.metadata?.state;
                const versionStateLabel = versionState ? IconService.getStateLabel(versionState) : '';
                const versionStateEmoji = versionState ? IconService.getStateEmoji(versionState) : '';

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

                // Add state emoji to description
                if (versionStateEmoji) {
                    treeItem.description = versionStateEmoji;
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
                // Root level: return groups
                return await this.getGroups();
            } else if (element.type === RegistryItemType.Group) {
                // Group level: return artifacts
                return await this.getArtifacts(element.id!);
            } else if (element.type === RegistryItemType.Artifact) {
                // Artifact level: return versions
                return await this.getVersions(element.parentId!, element.id!);
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
            groupId
        ));
    }

    private async getVersions(groupId: string, artifactId: string): Promise<RegistryItem[]> {
        const versions = await this.registryService.getVersions(groupId, artifactId);
        return versions.map(version => new RegistryItem(
            version.version || 'unknown',
            RegistryItemType.Version,
            version.version,
            {
                versionId: version.versionId,
                globalId: version.globalId,
                state: version.state,
                createdOn: version.createdOn
            },
            artifactId,
            groupId
        ));
    }
}