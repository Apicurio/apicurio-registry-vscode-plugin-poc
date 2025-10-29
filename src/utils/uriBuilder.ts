import * as vscode from 'vscode';

/**
 * Utility class for building and parsing Apicurio custom URIs.
 *
 * Format: apicurio://group/<groupId>/artifact/<artifactId>/version/<version>?state=<state>
 *
 * Example: apicurio://group/my-group/artifact/user-api/version/1.0.0?state=DRAFT
 */
export class ApicurioUriBuilder {
    static readonly SCHEME = 'apicurio';

    /**
     * Build a URI for an artifact version.
     *
     * @param groupId - The group ID (will be URL encoded)
     * @param artifactId - The artifact ID (will be URL encoded)
     * @param version - The version identifier (will be URL encoded)
     * @param state - The version state (DRAFT, ENABLED, DISABLED, DEPRECATED)
     * @returns VSCode URI with custom scheme
     */
    static buildVersionUri(
        groupId: string,
        artifactId: string,
        version: string,
        state: string
    ): vscode.Uri {
        const encodedGroupId = encodeURIComponent(groupId);
        const encodedArtifactId = encodeURIComponent(artifactId);
        const encodedVersion = encodeURIComponent(version);

        const path = `/group/${encodedGroupId}/artifact/${encodedArtifactId}/version/${encodedVersion}`;
        const query = `state=${state}`;

        return vscode.Uri.parse(`${this.SCHEME}:${path}?${query}`);
    }

    /**
     * Parse an Apicurio URI to extract metadata.
     *
     * @param uri - The VSCode URI to parse
     * @returns Parsed metadata or null if URI is invalid
     */
    static parseVersionUri(uri: vscode.Uri): {
        groupId: string;
        artifactId: string;
        version: string;
        state: string;
    } | null {
        // Check scheme
        if (uri.scheme !== this.SCHEME) {
            return null;
        }

        // Parse path: /group/<groupId>/artifact/<artifactId>/version/<version>
        const pathMatch = uri.path.match(/^\/group\/([^/]+)\/artifact\/([^/]+)\/version\/(.+)$/);
        if (!pathMatch) {
            return null;
        }

        // Extract and decode path components
        const groupId = decodeURIComponent(pathMatch[1]);
        const artifactId = decodeURIComponent(pathMatch[2]);
        const version = decodeURIComponent(pathMatch[3]);

        // Parse query parameters
        const queryParams = new URLSearchParams(uri.query);
        const state = queryParams.get('state');

        if (!state) {
            return null;
        }

        return {
            groupId,
            artifactId,
            version,
            state
        };
    }

    /**
     * Check if a version is a draft based on URI.
     *
     * @param uri - The VSCode URI to check
     * @returns True if the version is a draft, false otherwise
     */
    static isDraft(uri: vscode.Uri): boolean {
        const metadata = this.parseVersionUri(uri);
        return metadata?.state === 'DRAFT';
    }

    /**
     * Get display name for the document.
     *
     * @param groupId - The group ID
     * @param artifactId - The artifact ID
     * @param version - The version identifier
     * @returns Formatted display name: groupId/artifactId:version
     */
    static getDisplayName(
        groupId: string,
        artifactId: string,
        version: string
    ): string {
        return `${groupId}/${artifactId}:${version}`;
    }
}
