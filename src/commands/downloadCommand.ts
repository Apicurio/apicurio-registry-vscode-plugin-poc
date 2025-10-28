import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { RegistryService } from '../services/registryService';
import { RegistryItem, RegistryItemType } from '../models/registryModels';

interface ExtensionMapping {
    extension: string;
    filterLabel: string;
    filterExtensions: string[];
}

const EXTENSION_MAP: Record<string, ExtensionMapping> = {
    'OPENAPI': { extension: 'yaml', filterLabel: 'YAML files', filterExtensions: ['yaml', 'yml'] },
    'ASYNCAPI': { extension: 'yaml', filterLabel: 'YAML files', filterExtensions: ['yaml', 'yml'] },
    'JSON': { extension: 'json', filterLabel: 'JSON files', filterExtensions: ['json'] },
    'AVRO': { extension: 'avsc', filterLabel: 'Avro files', filterExtensions: ['avsc'] },
    'PROTOBUF': { extension: 'proto', filterLabel: 'Protobuf files', filterExtensions: ['proto'] },
    'GRAPHQL': { extension: 'graphql', filterLabel: 'GraphQL files', filterExtensions: ['graphql'] },
    'XSD': { extension: 'xsd', filterLabel: 'XSD files', filterExtensions: ['xsd'] },
    'WSDL': { extension: 'wsdl', filterLabel: 'WSDL files', filterExtensions: ['wsdl'] },
    'KCONNECT': { extension: 'json', filterLabel: 'JSON files', filterExtensions: ['json'] }
};

function getFileExtension(artifactType?: string): ExtensionMapping {
    if (artifactType && EXTENSION_MAP[artifactType]) {
        return EXTENSION_MAP[artifactType];
    }
    // Default to YAML if artifact type unknown
    return { extension: 'yaml', filterLabel: 'YAML files', filterExtensions: ['yaml', 'yml'] };
}

export async function downloadContentCommand(
    registryService: RegistryService,
    node: RegistryItem
): Promise<void> {
    try {
        let groupId: string | undefined;
        let artifactId: string | undefined;
        let version: string | undefined;
        let filename: string;

        // Determine groupId, artifactId, version based on node type
        if (node.type === RegistryItemType.Artifact) {
            groupId = node.groupId;
            artifactId = node.id;
            filename = artifactId || 'artifact';

            // Get latest version for artifacts
            if (!groupId || !artifactId) {
                vscode.window.showErrorMessage('Cannot download: missing group or artifact ID');
                return;
            }

            const versions = await registryService.getVersions(groupId, artifactId);
            if (versions.length === 0) {
                vscode.window.showErrorMessage('No versions found for artifact');
                return;
            }

            // Find version with highest globalId
            const latestVersion = versions.reduce((prev, current) => {
                return (current.globalId || 0) > (prev.globalId || 0) ? current : prev;
            });
            version = latestVersion.version;
        } else if (node.type === RegistryItemType.Version) {
            groupId = node.groupId;
            artifactId = node.parentId;
            version = node.id;
            filename = `${artifactId}-${version}`;
        } else {
            vscode.window.showErrorMessage('Can only download artifacts or versions');
            return;
        }

        if (!groupId || !artifactId || !version) {
            vscode.window.showErrorMessage('Cannot download: missing required identifiers');
            return;
        }

        // Fetch artifact content
        const content = await registryService.getArtifactContent(groupId, artifactId, version);

        // Determine file extension based on artifact type
        const extensionInfo = getFileExtension(content.artifactType);
        const defaultFilename = `${filename}.${extensionInfo.extension}`;

        // Build filters for save dialog
        const filters: Record<string, string[]> = {};
        filters[extensionInfo.filterLabel] = extensionInfo.filterExtensions;
        filters['All files'] = ['*'];

        // Show save dialog
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(path.join(process.cwd(), defaultFilename)),
            filters: filters
        });

        // User cancelled
        if (!saveUri) {
            return;
        }

        // Write file
        fs.writeFileSync(saveUri.fsPath, content.content, 'utf8');

        // Show success message with "Open File" action
        const action = await vscode.window.showInformationMessage(
            'Content downloaded successfully',
            'Open File'
        );

        // Open file if user clicked the action
        if (action === 'Open File') {
            const doc = await vscode.workspace.openTextDocument(saveUri);
            await vscode.window.showTextDocument(doc);
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to download content: ${error.message}`);
    }
}
