import * as vscode from 'vscode';
import { RegistryItem, RegistryItemType } from '../models/registryModels';
import { RegistryService } from '../services/registryService';

/**
 * Map artifact type to VSCode language identifier
 */
function getLanguageFromArtifactType(artifactType?: string): string {
    if (!artifactType) {
        return 'plaintext';
    }

    const languageMap: Record<string, string> = {
        'OPENAPI': 'yaml',
        'ASYNCAPI': 'yaml',
        'JSON': 'json',
        'AVRO': 'json',
        'PROTOBUF': 'protobuf',
        'GRAPHQL': 'graphql',
        'XSD': 'xml',
        'WSDL': 'xml',
        'KCONNECT': 'json'
    };

    return languageMap[artifactType] || 'plaintext';
}

/**
 * Get language from content type header
 */
function getLanguageFromContentType(contentType: string): string {
    if (contentType.includes('yaml') || contentType.includes('yml')) {
        return 'yaml';
    }
    if (contentType.includes('json')) {
        return 'json';
    }
    if (contentType.includes('xml')) {
        return 'xml';
    }
    return 'plaintext';
}

/**
 * Open artifact (latest version) in editor
 */
export async function openArtifactCommand(
    registryService: RegistryService,
    node: RegistryItem
): Promise<void> {
    // Validate node data
    const groupId = node.parentId;
    const artifactId = node.id;

    if (!groupId || !artifactId) {
        vscode.window.showErrorMessage('Missing artifact information');
        return;
    }

    try {
        // Fetch content with progress indicator
        const content = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Opening ${artifactId}...`,
                cancellable: false
            },
            async (progress) => {
                progress.report({ message: 'Fetching content...' });
                return await registryService.getArtifactContent(groupId, artifactId, 'latest');
            }
        );

        // Determine language for syntax highlighting
        const artifactType = node.metadata?.artifactType;
        const language = getLanguageFromArtifactType(artifactType) ||
                        getLanguageFromContentType(content.contentType);

        // Create and open document
        const doc = await vscode.workspace.openTextDocument({
            content: content.content,
            language: language
        });

        await vscode.window.showTextDocument(doc, {
            viewColumn: vscode.ViewColumn.One,
            preview: false
        });

    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to open artifact: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Open specific version in editor
 */
export async function openVersionCommand(
    registryService: RegistryService,
    node: RegistryItem
): Promise<void> {
    // Validate node data
    const groupId = node.groupId;
    const artifactId = node.parentId;
    const version = node.id;

    if (!groupId || !artifactId || !version) {
        vscode.window.showErrorMessage('Missing version information');
        return;
    }

    try {
        // Fetch content with progress indicator
        const content = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Opening ${artifactId} v${version}...`,
                cancellable: false
            },
            async (progress) => {
                progress.report({ message: 'Fetching content...' });
                return await registryService.getArtifactContent(groupId, artifactId, version);
            }
        );

        // Determine language for syntax highlighting
        const artifactType = node.metadata?.artifactType;
        let language = 'plaintext';

        if (artifactType) {
            language = getLanguageFromArtifactType(artifactType);
        }

        // Fall back to content type if artifact type didn't give us a language
        if (language === 'plaintext' && content.contentType) {
            language = getLanguageFromContentType(content.contentType);
        }

        // Create and open document
        const doc = await vscode.workspace.openTextDocument({
            content: content.content,
            language: language
        });

        await vscode.window.showTextDocument(doc, {
            viewColumn: vscode.ViewColumn.One,
            preview: false
        });

    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to open version: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
