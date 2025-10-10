import * as vscode from 'vscode';
import { ArtifactType, ArtifactState, VersionState } from '../models/registryModels';

/**
 * Service for managing icons in the Apicurio Registry tree view.
 * Provides consistent icon selection based on artifact types and states.
 */
export class IconService {
    /**
     * Returns the appropriate ThemeIcon for a given artifact type.
     * Each artifact type has a distinct icon to improve visual recognition.
     *
     * @param artifactType The type of artifact (OPENAPI, ASYNCAPI, etc.)
     * @returns VSCode ThemeIcon representing the artifact type
     */
    static getIconForArtifactType(artifactType: string): vscode.ThemeIcon {
        // Normalize the artifact type to uppercase for comparison
        const normalizedType = artifactType?.toUpperCase();

        switch (normalizedType) {
            case ArtifactType.OPENAPI:
                // REST API - using symbol-method to represent HTTP methods
                return new vscode.ThemeIcon('symbol-method');

            case ArtifactType.ASYNCAPI:
                // Asynchronous messaging - using radio-tower to represent broadcasting
                return new vscode.ThemeIcon('radio-tower');

            case ArtifactType.AVRO:
                // Data schema - using database to represent data structures
                return new vscode.ThemeIcon('database');

            case ArtifactType.PROTOBUF:
                // Protocol Buffers - using symbol-class to represent structured data
                return new vscode.ThemeIcon('symbol-class');

            case ArtifactType.JSON:
                // JSON Schema - using json icon
                return new vscode.ThemeIcon('json');

            case ArtifactType.GRAPHQL:
                // GraphQL schema - using symbol-interface to represent graph relationships
                return new vscode.ThemeIcon('symbol-interface');

            case ArtifactType.KCONNECT:
                // Kafka Connect - using plug to represent connector
                return new vscode.ThemeIcon('plug');

            case ArtifactType.WSDL:
                // Web Services - using globe to represent SOAP/web services
                return new vscode.ThemeIcon('globe');

            case ArtifactType.XSD:
                // XML Schema - using symbol-namespace to represent XML structures
                return new vscode.ThemeIcon('symbol-namespace');

            default:
                // Fallback for unknown types
                return new vscode.ThemeIcon('file-code');
        }
    }

    /**
     * Returns a ThemeIcon with color for artifact/version states.
     * Used to visually indicate the current state of an artifact or version.
     *
     * @param state The state (ENABLED, DISABLED, DEPRECATED, DRAFT)
     * @returns VSCode ThemeIcon with appropriate color
     */
    static getIconForState(state: string): vscode.ThemeIcon | undefined {
        const normalizedState = state?.toUpperCase();

        switch (normalizedState) {
            case ArtifactState.ENABLED:
            case VersionState.ENABLED:
                // Green checkmark for enabled items
                return new vscode.ThemeIcon(
                    'check',
                    new vscode.ThemeColor('testing.iconPassed')
                );

            case ArtifactState.DISABLED:
            case VersionState.DISABLED:
                // Gray/red X for disabled items
                return new vscode.ThemeIcon(
                    'circle-slash',
                    new vscode.ThemeColor('testing.iconFailed')
                );

            case ArtifactState.DEPRECATED:
            case VersionState.DEPRECATED:
                // Orange/yellow warning for deprecated items
                return new vscode.ThemeIcon(
                    'warning',
                    new vscode.ThemeColor('list.warningForeground')
                );

            case VersionState.DRAFT:
                // Pencil icon for draft versions
                return new vscode.ThemeIcon(
                    'edit',
                    new vscode.ThemeColor('editorInfo.foreground')
                );

            default:
                // No icon for unknown states
                return undefined;
        }
    }

    /**
     * Returns an icon for group nodes.
     * Groups are represented as folders in the tree.
     *
     * @returns VSCode ThemeIcon for groups
     */
    static getGroupIcon(): vscode.ThemeIcon {
        return new vscode.ThemeIcon('folder');
    }

    /**
     * Returns an icon for version nodes.
     * Versions are represented as tags.
     *
     * @returns VSCode ThemeIcon for versions
     */
    static getVersionIcon(): vscode.ThemeIcon {
        return new vscode.ThemeIcon('tag');
    }

    /**
     * Returns an icon for connection/placeholder nodes.
     * Used for "Not connected" and error states.
     *
     * @returns VSCode ThemeIcon for connection nodes
     */
    static getConnectionIcon(): vscode.ThemeIcon {
        return new vscode.ThemeIcon('plug');
    }

    /**
     * Combines an artifact type icon with a state indicator.
     * This creates a rich visual representation showing both type and state.
     *
     * Note: VSCode doesn't support icon overlays directly, so this returns
     * the primary icon. State can be shown via decorations or description text.
     *
     * @param artifactType The artifact type
     * @param state The artifact/version state
     * @returns Primary icon (type-based)
     */
    static getCombinedIcon(artifactType: string, state?: string): vscode.ThemeIcon {
        // For now, return the type icon
        // State will be shown via tree item decorations or description
        return this.getIconForArtifactType(artifactType);
    }

    /**
     * Gets a human-readable label for an artifact type.
     * Used for tooltips and descriptions.
     *
     * @param artifactType The artifact type code
     * @returns Human-readable label
     */
    static getArtifactTypeLabel(artifactType: string): string {
        const normalizedType = artifactType?.toUpperCase();

        const labels: Record<string, string> = {
            [ArtifactType.OPENAPI]: 'OpenAPI Specification',
            [ArtifactType.ASYNCAPI]: 'AsyncAPI Specification',
            [ArtifactType.AVRO]: 'Avro Schema',
            [ArtifactType.PROTOBUF]: 'Protocol Buffers Schema',
            [ArtifactType.JSON]: 'JSON Schema',
            [ArtifactType.GRAPHQL]: 'GraphQL Schema',
            [ArtifactType.KCONNECT]: 'Kafka Connect Schema',
            [ArtifactType.WSDL]: 'WSDL (Web Services)',
            [ArtifactType.XSD]: 'XML Schema Definition'
        };

        return labels[normalizedType] || artifactType || 'Unknown Type';
    }

    /**
     * Gets a human-readable label for a state.
     *
     * @param state The state code
     * @returns Human-readable label
     */
    static getStateLabel(state: string): string {
        const normalizedState = state?.toUpperCase();

        const labels: Record<string, string> = {
            [ArtifactState.ENABLED]: 'Enabled',
            [ArtifactState.DISABLED]: 'Disabled',
            [ArtifactState.DEPRECATED]: 'Deprecated',
            [VersionState.DRAFT]: 'Draft'
        };

        return labels[normalizedState] || state || 'Unknown';
    }

    /**
     * Gets an emoji representation of a state for use in descriptions.
     * Provides a quick visual cue about state.
     *
     * @param state The state code
     * @returns Emoji string
     */
    static getStateEmoji(state: string): string {
        const normalizedState = state?.toUpperCase();

        const emojis: Record<string, string> = {
            [ArtifactState.ENABLED]: '✓',
            [ArtifactState.DISABLED]: '✗',
            [ArtifactState.DEPRECATED]: '⚠',
            [VersionState.DRAFT]: '📝'
        };

        return emojis[normalizedState] || '';
    }
}
