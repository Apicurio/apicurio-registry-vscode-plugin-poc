import * as vscode from 'vscode';
import { RegistryItem, RegistryItemType } from '../models/registryModels';
import { RegistryService } from '../services/registryService';
import { ApicurioUriBuilder } from '../utils/uriBuilder';

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
                progress.report({ message: 'Finding latest version...' });

                // Get all versions to find the latest one
                const versions = await registryService.getVersions(groupId, artifactId);

                if (!versions || versions.length === 0) {
                    throw new Error('No versions found for this artifact');
                }

                // Find the version with the highest globalId (most recent)
                const latestVersion = versions.reduce((prev, current) => {
                    return (current.globalId || 0) > (prev.globalId || 0) ? current : prev;
                });

                if (!latestVersion.version) {
                    throw new Error('Could not determine latest version');
                }

                progress.report({ message: `Fetching content (${latestVersion.version})...` });
                return await registryService.getArtifactContent(groupId, artifactId, latestVersion.version);
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
 * Open specific version in editor using custom URI scheme.
 * Draft versions are editable, published versions are read-only.
 */
export async function openVersionCommand(
    registryService: RegistryService,
    node: RegistryItem
): Promise<void> {
    // Validate node data
    const groupId = node.groupId;
    const artifactId = node.parentId;
    const version = node.id;
    const state = node.metadata?.state || 'ENABLED';

    if (!groupId || !artifactId || !version) {
        vscode.window.showErrorMessage('Missing version information');
        return;
    }

    try {
        // Build custom URI with state information
        const uri = ApicurioUriBuilder.buildVersionUri(groupId, artifactId, version, state);

        // Open document using our custom URI scheme
        const doc = await vscode.workspace.openTextDocument(uri);

        // Set language mode based on artifact type for syntax highlighting
        const artifactType = node.metadata?.artifactType;
        if (artifactType) {
            const language = getLanguageFromArtifactType(artifactType);
            await vscode.languages.setTextDocumentLanguage(doc, language);
        }

        await vscode.window.showTextDocument(doc, {
            preview: false,
            viewColumn: vscode.ViewColumn.One
        });

        // For published versions, show a subtle notification (non-blocking)
        if (state !== 'DRAFT') {
            // Show info message without action buttons - less intrusive
            vscode.window.showInformationMessage(
                `Read-only: ${state} version. Right-click artifact in tree to create a new draft version.`
            );
        }
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to open version: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
