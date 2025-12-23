import axios, { AxiosInstance } from 'axios';
import {
    BranchMetadata,
    ConfigurationProperty,
    CreateArtifactRequest,
    CreateArtifactResponse,
    CreateVersion,
    GroupMetaData,
    RegistryInfo,
    Role,
    RoleMapping,
    Rule,
    RuleType,
    UIConfig,
    VersionMetaData
} from '../models/registryModels';

export interface RegistryConnection {
    name: string;
    url: string;
    authType: 'none' | 'basic' | 'oidc';
    credentials?: {
        username?: string;
        password?: string;
        token?: string;
        clientId?: string;
    };
}

export interface SearchedGroup {
    groupId?: string;
    artifactCount?: number;
    description?: string;
    labels?: Record<string, string>;
    modifiedOn?: Date;
}

export interface SearchedArtifact {
    groupId?: string;
    artifactId?: string;
    artifactType?: string;
    name?: string;
    description?: string;
    labels?: Record<string, string>;
    state?: string;
    modifiedOn?: Date;
}

export interface SearchedVersion {
    groupId?: string;
    artifactId?: string;
    version?: string;
    versionId?: number;
    globalId?: number;
    contentId?: number;
    state?: string;
    name?: string;
    description?: string;
    labels?: Record<string, string>;
    createdOn?: Date;
    modifiedOn?: Date;
}

export interface ArtifactContent {
    content: string;
    contentType: string;
    artifactType?: string;
}

export class RegistryService {
    private client: AxiosInstance | null = null;
    private connection: RegistryConnection | null = null;
    private uiConfig: UIConfig | null = null;
    private registryInfo: RegistryInfo | null = null;

    setConnection(connection: RegistryConnection): void {
        this.connection = connection;
        this.client = axios.create({
            baseURL: `${connection.url}/apis/registry/v3`,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Set up authentication
        if (connection.authType === 'basic' && connection.credentials) {
            const { username, password } = connection.credentials;
            if (username && password) {
                this.client.defaults.auth = { username, password };
            }
        } else if (connection.authType === 'oidc' && connection.credentials?.token) {
            this.client.defaults.headers.common['Authorization'] = `Bearer ${connection.credentials.token}`;
        }
    }

    disconnect(): void {
        this.client = null;
        this.connection = null;
        this.uiConfig = null;
        this.registryInfo = null;
    }

    private ensureConnected(): void {
        if (!this.client || !this.connection) {
            throw new Error('Not connected to registry. Please connect first.');
        }
    }

    async searchGroups(searchParams: Record<string, string> = {}, limit?: number): Promise<SearchedGroup[]> {
        this.ensureConnected();

        try {
            const params: Record<string, any> = {
                limit: limit || 100,
                offset: 0
            };

            // Add search parameters
            Object.keys(searchParams).forEach(key => {
                if (searchParams[key]) {
                    params[key] = searchParams[key];
                }
            });

            const response = await this.client!.get('/search/groups', {
                params
            });

            return response.data.groups || [];
        } catch (error) {
            console.error('Error searching groups:', error);
            throw new Error(`Failed to search groups: ${error}`);
        }
    }

    async getArtifacts(groupId: string): Promise<SearchedArtifact[]> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const response = await this.client!.get(`/groups/${encodedGroupId}/artifacts`, {
                params: {
                    limit: 100,
                    offset: 0
                }
            });

            return response.data.artifacts || [];
        } catch (error) {
            console.error('Error getting artifacts:', error);
            throw new Error(`Failed to get artifacts for group ${groupId}: ${error}`);
        }
    }

    async getVersions(groupId: string, artifactId: string): Promise<SearchedVersion[]> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const response = await this.client!.get(`/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions`, {
                params: {
                    limit: 50,
                    offset: 0
                }
            });

            return response.data.versions || [];
        } catch (error) {
            console.error('Error getting versions:', error);
            throw new Error(`Failed to get versions for artifact ${groupId}/${artifactId}: ${error}`);
        }
    }

    async getVersionMetadata(groupId: string, artifactId: string, version: string): Promise<SearchedVersion> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedVersion = encodeURIComponent(version);

            const response = await this.client!.get(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}`
            );

            // Convert modifiedOn from timestamp to Date if present
            const data = response.data;
            if (data.modifiedOn) {
                data.modifiedOn = new Date(data.modifiedOn);
            }
            if (data.createdOn) {
                data.createdOn = new Date(data.createdOn);
            }

            return data;
        } catch (error) {
            console.error('Error getting version metadata:', error);
            throw new Error(`Failed to get metadata for ${groupId}/${artifactId}@${version}: ${error}`);
        }
    }

    async getArtifactContent(groupId: string, artifactId: string, version: string): Promise<ArtifactContent> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedVersion = encodeURIComponent(version);

            // Get the actual content (not metadata) by appending /content
            const response = await this.client!.get(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}/content`,
                {
                    headers: {
                        'Accept': '*/*'  // Accept any content type
                    }
                }
            );

            // Get the content type from response headers
            const contentType = response.headers['content-type'] || 'application/json';

            return {
                content: typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2),
                contentType: contentType
            };
        } catch (error) {
            console.error('Error getting artifact content:', error);
            throw new Error(`Failed to get content for ${groupId}/${artifactId}@${version}: ${error}`);
        }
    }

    /**
     * @deprecated Use updateDraftContent() instead.
     * This method may not work correctly with API v3.1 due to endpoint inconsistency.
     * It uses PUT .../versions/{version} without /content suffix, which conflicts with
     * the GET endpoint that requires /content. Status: untested, unused in codebase.
     *
     * @see updateDraftContent() for the correct v3.1-compatible method
     */
    async updateArtifactContent(groupId: string, artifactId: string, version: string, content: ArtifactContent): Promise<void> {
        this.ensureConnected();

        console.warn('updateArtifactContent() is deprecated. Use updateDraftContent() instead.');

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedVersion = encodeURIComponent(version);

            await this.client!.put(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}`,
                content.content,
                {
                    headers: {
                        'Content-Type': content.contentType
                    }
                }
            );
        } catch (error) {
            console.error('Error updating artifact content:', error);
            throw new Error(`Failed to update content for ${groupId}/${artifactId}@${version}: ${error}`);
        }
    }

    async searchArtifacts(searchParams: Record<string, string>, limit?: number): Promise<SearchedArtifact[]> {
        this.ensureConnected();

        try {
            // Build query parameters for search
            // Use provided limit or default to 100
            const params: Record<string, any> = {
                limit: limit || 100,
                offset: 0
            };

            // Add search parameters
            Object.keys(searchParams).forEach(key => {
                if (searchParams[key]) {
                    params[key] = searchParams[key];
                }
            });

            const response = await this.client!.get('/search/artifacts', {
                params
            });

            return response.data.artifacts || [];
        } catch (error) {
            console.error('Error searching artifacts:', error);
            throw new Error(`Failed to search artifacts: ${error}`);
        }
    }

    async searchVersions(searchParams: Record<string, string>, limit?: number): Promise<SearchedVersion[]> {
        this.ensureConnected();

        try {
            const params: Record<string, any> = {
                limit: limit || 100,
                offset: 0
            };

            Object.keys(searchParams).forEach(key => {
                if (searchParams[key]) {
                    params[key] = searchParams[key];
                }
            });

            const response = await this.client!.get('/search/versions', {
                params
            });

            return response.data.versions || [];
        } catch (error) {
            console.error('Error searching versions:', error);
            throw new Error(`Failed to search versions: ${error}`);
        }
    }

    async getGroups(): Promise<GroupMetaData[]> {
        this.ensureConnected();

        try {
            const response = await this.client!.get('/groups', {
                params: {
                    limit: 1000,
                    offset: 0
                }
            });

            return response.data.groups || [];
        } catch (error) {
            console.error('Error fetching groups:', error);
            throw new Error(`Failed to fetch groups: ${error}`);
        }
    }

    async createGroup(
        groupId: string,
        metadata?: {
            description?: string;
            labels?: Record<string, string>;
        }
    ): Promise<GroupMetaData> {
        this.ensureConnected();

        try {
            const requestBody: any = {
                groupId
            };

            if (metadata?.description) {
                requestBody.description = metadata.description;
            }

            if (metadata?.labels) {
                requestBody.labels = metadata.labels;
            }

            const response = await this.client!.post('/groups', requestBody);

            return response.data;
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        }
    }

    async createArtifact(
        groupId: string,
        data: CreateArtifactRequest
    ): Promise<CreateArtifactResponse> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);

            // Extract query parameters from data
            const queryParams: Record<string, any> = {};
            if (data.ifExists) {
                queryParams.ifExists = data.ifExists;
            }
            if (data.canonical !== undefined) {
                queryParams.canonical = data.canonical;
            }
            if (data.dryRun !== undefined) {
                queryParams.dryRun = data.dryRun;
            }

            // Build request body (without query params)
            const requestBody: any = {};
            if (data.artifactId) {
                requestBody.artifactId = data.artifactId;
            }
            if (data.artifactType) {
                requestBody.artifactType = data.artifactType;
            }
            if (data.name) {
                requestBody.name = data.name;
            }
            if (data.description) {
                requestBody.description = data.description;
            }
            if (data.labels) {
                requestBody.labels = data.labels;
            }
            if (data.firstVersion) {
                requestBody.firstVersion = data.firstVersion;
            }

            const response = await this.client!.post(
                `/groups/${encodedGroupId}/artifacts`,
                requestBody,
                {
                    params: queryParams
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error creating artifact:', error);

            // Provide more specific error messages
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || error.response.data?.detail || error.message;

                switch (status) {
                    case 409:
                        throw new Error(`Artifact already exists: ${message}`);
                    case 400:
                        throw new Error(`Invalid request: ${message}`);
                    case 401:
                        throw new Error('Authentication required');
                    case 403:
                        throw new Error('Permission denied');
                    case 404:
                        throw new Error(`Group not found: ${groupId}`);
                    default:
                        throw new Error(`Failed to create artifact: ${message}`);
                }
            }

            throw new Error(`Failed to create artifact: ${error.message || error}`);
        }
    }

    isConnected(): boolean {
        return this.client !== null && this.connection !== null;
    }

    getConnectionInfo(): RegistryConnection | null {
        return this.connection;
    }

    async updateArtifactState(groupId: string, artifactId: string, state: string): Promise<void> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);

            await this.client!.put(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/state`,
                { state },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            console.error('Error updating artifact state:', error);
            throw new Error(`Failed to update state for ${groupId}/${artifactId}: ${error}`);
        }
    }

    async updateVersionState(groupId: string, artifactId: string, version: string, state: string): Promise<void> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedVersion = encodeURIComponent(version);

            await this.client!.put(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}/state`,
                { state },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            console.error('Error updating version state:', error);
            throw new Error(`Failed to update state for ${groupId}/${artifactId}@${version}: ${error}`);
        }
    }

    async deleteGroup(groupId: string): Promise<void> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            await this.client!.delete(`/groups/${encodedGroupId}`);
        } catch (error) {
            console.error('Error deleting group:', error);
            throw error;
        }
    }

    async deleteArtifact(groupId: string, artifactId: string): Promise<void> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            await this.client!.delete(`/groups/${encodedGroupId}/artifacts/${encodedArtifactId}`);
        } catch (error) {
            console.error('Error deleting artifact:', error);
            throw error;
        }
    }

    async deleteVersion(groupId: string, artifactId: string, version: string): Promise<void> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedVersion = encodeURIComponent(version);
            await this.client!.delete(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}`
            );
        } catch (error) {
            console.error('Error deleting version:', error);
            throw error;
        }
    }

    async getUIConfig(): Promise<UIConfig> {
        this.ensureConnected();

        if (this.uiConfig !== null) {
            return this.uiConfig;
        }

        try {
            const response = await this.client!.get('/system/uiConfig');
            const config: UIConfig = response.data || {};
            this.uiConfig = config;
            return config;
        } catch (error) {
            console.error('Error fetching UI config:', error);
            throw error;
        }
    }

    async isDraftSupportEnabled(): Promise<boolean> {
        try {
            const config = await this.getUIConfig();
            return config.features?.draftMutability === true &&
                   config.features?.readOnly !== true;
        } catch (error) {
            console.warn('Failed to get UI config, assuming no draft support:', error);
            return false;
        }
    }

    getEditorsUrl(): string | undefined {
        return this.uiConfig?.ui?.editorsUrl;
    }

    /**
     * Get registry system information, including version.
     * Caches the result for the duration of the connection.
     *
     * @returns Registry information including version string
     * @throws Error if not connected or if the endpoint fails
     */
    async getRegistryInfo(): Promise<RegistryInfo> {
        this.ensureConnected();

        // Return cached value if available
        if (this.registryInfo !== null) {
            return this.registryInfo;
        }

        try {
            const response = await this.client!.get('/system/info');
            const info: RegistryInfo = response.data;
            this.registryInfo = info;
            return info;
        } catch (error) {
            console.error('Error fetching registry info:', error);
            throw error;
        }
    }

    /**
     * Get the registry version string.
     *
     * @returns Version string (e.g., "3.1.1")
     * @throws Error if not connected or if registry info cannot be fetched
     */
    async getVersion(): Promise<string> {
        const info = await this.getRegistryInfo();
        return info.version;
    }

    /**
     * Check if the connected registry is version 3.1 or later.
     * Used to determine API compatibility and feature availability.
     *
     * @returns true if registry version is 3.1.0 or higher
     * @throws Error if not connected or if version cannot be determined
     */
    async isVersion31OrLater(): Promise<boolean> {
        const version = await this.getVersion();
        const [major, minor] = version.split('.').map(Number);
        return major > 3 || (major === 3 && minor >= 1);
    }

    async createDraftVersion(
        groupId: string,
        artifactId: string,
        versionData: CreateVersion
    ): Promise<void> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);

            // Ensure isDraft is set to true
            const draftVersionData: CreateVersion = {
                ...versionData,
                isDraft: true
            };

            await this.client!.post(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions`,
                draftVersionData
            );
        } catch (error: any) {
            console.error('Error creating draft version:', error);

            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || error.response.data?.detail || error.message;

                switch (status) {
                    case 409:
                        throw new Error(`Version already exists: ${message}`);
                    case 400:
                        throw new Error(`Invalid request: ${message}`);
                    case 404:
                        throw new Error(`Artifact not found: ${groupId}/${artifactId}`);
                    default:
                        throw new Error(`Failed to create draft version: ${message}`);
                }
            }

            throw new Error(`Failed to create draft version: ${error.message || error}`);
        }
    }

    async finalizeDraftVersion(
        groupId: string,
        artifactId: string,
        version: string,
        targetState: 'ENABLED' | 'DISABLED' | 'DEPRECATED' = 'ENABLED'
    ): Promise<void> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedVersion = encodeURIComponent(version);

            await this.client!.put(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}/state`,
                { state: targetState }
            );
        } catch (error: any) {
            console.error('Error finalizing draft version:', error);

            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || error.response.data?.detail || error.message;

                switch (status) {
                    case 404:
                        throw new Error(`Version not found: ${groupId}/${artifactId}:${version}`);
                    case 400:
                        throw new Error(`Invalid state transition: ${message}`);
                    case 409:
                        throw new Error(`Validation failed: ${message}`);
                    default:
                        throw new Error(`Failed to finalize draft: ${message}`);
                }
            }

            throw new Error(`Failed to finalize draft: ${error.message || error}`);
        }
    }

    async discardDraftVersion(
        groupId: string,
        artifactId: string,
        version: string
    ): Promise<void> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedVersion = encodeURIComponent(version);

            await this.client!.delete(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}`
            );
        } catch (error: any) {
            console.error('Error discarding draft version:', error);

            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || error.response.data?.detail || error.message;

                switch (status) {
                    case 404:
                        throw new Error(`Version not found: ${groupId}/${artifactId}:${version}`);
                    case 405:
                        throw new Error(`Version deletion not allowed: ${message}`);
                    default:
                        throw new Error(`Failed to discard draft: ${message}`);
                }
            }

            throw new Error(`Failed to discard draft: ${error.message || error}`);
        }
    }

    async updateDraftMetadata(
        groupId: string,
        artifactId: string,
        version: string,
        metadata: {
            name?: string;
            description?: string;
            labels?: Record<string, string>;
        }
    ): Promise<void> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedVersion = encodeURIComponent(version);

            await this.client!.put(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}`,
                metadata
            );
        } catch (error: any) {
            console.error('Error updating draft metadata:', error);

            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || error.response.data?.detail || error.message;

                switch (status) {
                    case 404:
                        throw new Error(`Version not found: ${groupId}/${artifactId}:${version}`);
                    case 400:
                        throw new Error(`Invalid metadata: ${message}`);
                    default:
                        throw new Error(`Failed to update metadata: ${message}`);
                }
            }

            throw new Error(`Failed to update metadata: ${error.message || error}`);
        }
    }

    /**
     * Update draft version content.
     * Only works for versions in DRAFT state.
     *
     * @param groupId - The artifact group ID
     * @param artifactId - The artifact ID
     * @param version - The version identifier
     * @param content - The new content (JSON, YAML, etc.)
     */
    async updateDraftContent(
        groupId: string,
        artifactId: string,
        version: string,
        content: string
    ): Promise<void> {
        this.ensureConnected();

        const encodedGroupId = encodeURIComponent(groupId);
        const encodedArtifactId = encodeURIComponent(artifactId);
        const encodedVersion = encodeURIComponent(version);

        try {
            await this.client!.put(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}/content`,
                { content }
            );
        } catch (error: any) {
            console.error('Error updating draft content:', error);

            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || error.response.data?.detail || error.message;

                switch (status) {
                    case 404:
                        throw new Error(`Version not found: ${groupId}/${artifactId}:${version}`);
                    case 400:
                    case 405:
                        throw new Error('Cannot update published version content. Only draft version content can be modified.');
                    case 409:
                        throw new Error('Content conflict. The version may have been modified by another user.');
                    default:
                        throw new Error(`Failed to update content: ${message}`);
                }
            }

            throw new Error(`Failed to update content: ${error.message || error}`);
        }
    }

    /**
     * Get detailed group metadata for editing.
     *
     * @param groupId - The group ID
     * @returns Group metadata including description and labels
     */
    async getGroupMetadataDetailed(groupId: string): Promise<GroupMetaData> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);

            const response = await this.client!.get(`/groups/${encodedGroupId}`);
            return response.data;
        } catch (error: any) {
            console.error('Error getting group metadata:', error);

            if (error.response?.status === 404) {
                throw new Error(`Group not found: ${groupId}`);
            }

            throw new Error(`Failed to get group metadata: ${error.message || error}`);
        }
    }

    /**
     * Get detailed artifact metadata for editing.
     *
     * @param groupId - The artifact group ID
     * @param artifactId - The artifact ID
     * @returns Artifact metadata including name, description, and labels
     */
    async getArtifactMetadataDetailed(groupId: string, artifactId: string): Promise<SearchedArtifact> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);

            const response = await this.client!.get(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}`
            );
            return response.data;
        } catch (error: any) {
            console.error('Error getting artifact metadata:', error);

            if (error.response?.status === 404) {
                throw new Error(`Artifact not found: ${groupId}/${artifactId}`);
            }

            throw new Error(`Failed to get artifact metadata: ${error.message || error}`);
        }
    }

    /**
     * Get detailed version metadata for editing.
     *
     * @param groupId - The artifact group ID
     * @param artifactId - The artifact ID
     * @param version - The version identifier
     * @returns Version metadata including name, description, and labels
     */
    async getVersionMetadataDetailed(groupId: string, artifactId: string, version: string): Promise<SearchedVersion> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedVersion = encodeURIComponent(version);

            const response = await this.client!.get(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}`
            );
            return response.data;
        } catch (error: any) {
            console.error('Error getting version metadata:', error);

            if (error.response?.status === 404) {
                throw new Error(`Version not found: ${groupId}/${artifactId}:${version}`);
            }

            throw new Error(`Failed to get version metadata: ${error.message || error}`);
        }
    }

    /**
     * Update group metadata (description and labels).
     * Note: Groups don't have a 'name' field in the API.
     *
     * @param groupId - The group ID
     * @param metadata - Metadata to update (description and/or labels)
     */
    async updateGroupMetadata(
        groupId: string,
        metadata: {
            description?: string;
            labels?: Record<string, string>;
        }
    ): Promise<void> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);

            // Transform labels to API format if present
            const apiMetadata: any = {};
            if (metadata.description !== undefined) {
                apiMetadata.description = metadata.description;
            }
            if (metadata.labels !== undefined) {
                apiMetadata.labels = metadata.labels;
            }

            await this.client!.put(
                `/groups/${encodedGroupId}`,
                apiMetadata
            );
        } catch (error: any) {
            console.error('Error updating group metadata:', error);

            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || error.response.data?.detail || error.message;

                switch (status) {
                    case 404:
                        throw new Error(`Group not found: ${groupId}`);
                    case 400:
                        throw new Error(`Invalid metadata: ${message}`);
                    default:
                        throw new Error(`Failed to update group metadata: ${message}`);
                }
            }

            throw new Error(`Failed to update group metadata: ${error.message || error}`);
        }
    }

    /**
     * Update artifact metadata (name, description, and labels).
     *
     * @param groupId - The artifact group ID
     * @param artifactId - The artifact ID
     * @param metadata - Metadata to update (name, description, and/or labels)
     */
    async updateArtifactMetadata(
        groupId: string,
        artifactId: string,
        metadata: {
            name?: string;
            description?: string;
            labels?: Record<string, string>;
        }
    ): Promise<void> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);

            await this.client!.put(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}`,
                metadata
            );
        } catch (error: any) {
            console.error('Error updating artifact metadata:', error);

            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || error.response.data?.detail || error.message;

                switch (status) {
                    case 404:
                        throw new Error(`Artifact not found: ${groupId}/${artifactId}`);
                    case 400:
                        throw new Error(`Invalid metadata: ${message}`);
                    default:
                        throw new Error(`Failed to update artifact metadata: ${message}`);
                }
            }

            throw new Error(`Failed to update artifact metadata: ${error.message || error}`);
        }
    }

    /**
     * Update version metadata (name, description, and labels).
     * Works for both draft and published versions.
     *
     * @param groupId - The artifact group ID
     * @param artifactId - The artifact ID
     * @param version - The version identifier
     * @param metadata - Metadata to update (name, description, and/or labels)
     */
    async updateVersionMetadata(
        groupId: string,
        artifactId: string,
        version: string,
        metadata: {
            name?: string;
            description?: string;
            labels?: Record<string, string>;
        }
    ): Promise<void> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedVersion = encodeURIComponent(version);

            await this.client!.put(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}`,
                metadata
            );
        } catch (error: any) {
            console.error('Error updating version metadata:', error);

            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || error.response.data?.detail || error.message;

                switch (status) {
                    case 404:
                        throw new Error(`Version not found: ${groupId}/${artifactId}:${version}`);
                    case 400:
                        throw new Error(`Invalid metadata: ${message}`);
                    default:
                        throw new Error(`Failed to update version metadata: ${message}`);
                }
            }

            throw new Error(`Failed to update version metadata: ${error.message || error}`);
        }
    }

    // ================================================================================
    // RULES MANAGEMENT
    // ================================================================================

    /**
     * Get all global rules
     */
    async getGlobalRules(): Promise<RuleType[]> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const response = await this.client.get('/admin/rules');
            return response.data;
        } catch (error: any) {
            console.error('Error fetching global rules:', error);
            throw new Error(`Failed to fetch global rules: ${error.message || error}`);
        }
    }

    /**
     * Get a specific global rule
     */
    async getGlobalRule(ruleType: RuleType): Promise<Rule> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const response = await this.client.get(`/admin/rules/${ruleType}`);
            return response.data;
        } catch (error: any) {
            console.error(`Error fetching global rule ${ruleType}:`, error);
            throw new Error(`Failed to fetch global rule: ${error.message || error}`);
        }
    }

    /**
     * Create a global rule
     */
    async createGlobalRule(ruleType: RuleType, config: string): Promise<Rule> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const response = await this.client.post('/admin/rules', {
                ruleType,
                config
            });
            return response.data;
        } catch (error: any) {
            console.error(`Error creating global rule ${ruleType}:`, error);
            throw new Error(`Failed to create global rule: ${error.message || error}`);
        }
    }

    /**
     * Update a global rule configuration
     */
    async updateGlobalRule(ruleType: RuleType, config: string): Promise<Rule> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const response = await this.client.put(`/admin/rules/${ruleType}`, {
                config
            });
            return response.data;
        } catch (error: any) {
            console.error(`Error updating global rule ${ruleType}:`, error);
            throw new Error(`Failed to update global rule: ${error.message || error}`);
        }
    }

    /**
     * Delete a global rule
     */
    async deleteGlobalRule(ruleType: RuleType): Promise<void> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            await this.client.delete(`/admin/rules/${ruleType}`);
        } catch (error: any) {
            console.error(`Error deleting global rule ${ruleType}:`, error);
            throw new Error(`Failed to delete global rule: ${error.message || error}`);
        }
    }

    /**
     * Get all group rules
     */
    async getGroupRules(groupId: string): Promise<RuleType[]> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const response = await this.client.get(`/groups/${encodedGroupId}/rules`);
            return response.data;
        } catch (error: any) {
            console.error(`Error fetching group rules for ${groupId}:`, error);
            throw new Error(`Failed to fetch group rules: ${error.message || error}`);
        }
    }

    /**
     * Get a specific group rule
     */
    async getGroupRule(groupId: string, ruleType: RuleType): Promise<Rule> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const response = await this.client.get(`/groups/${encodedGroupId}/rules/${ruleType}`);
            return response.data;
        } catch (error: any) {
            console.error(`Error fetching group rule ${ruleType} for ${groupId}:`, error);
            throw new Error(`Failed to fetch group rule: ${error.message || error}`);
        }
    }

    /**
     * Create a group rule
     */
    async createGroupRule(groupId: string, ruleType: RuleType, config: string): Promise<Rule> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const response = await this.client.post(`/groups/${encodedGroupId}/rules`, {
                ruleType,
                config
            });
            return response.data;
        } catch (error: any) {
            console.error(`Error creating group rule ${ruleType} for ${groupId}:`, error);
            throw new Error(`Failed to create group rule: ${error.message || error}`);
        }
    }

    /**
     * Update a group rule configuration
     */
    async updateGroupRule(groupId: string, ruleType: RuleType, config: string): Promise<Rule> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const response = await this.client.put(`/groups/${encodedGroupId}/rules/${ruleType}`, {
                config
            });
            return response.data;
        } catch (error: any) {
            console.error(`Error updating group rule ${ruleType} for ${groupId}:`, error);
            throw new Error(`Failed to update group rule: ${error.message || error}`);
        }
    }

    /**
     * Delete a group rule
     */
    async deleteGroupRule(groupId: string, ruleType: RuleType): Promise<void> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            await this.client.delete(`/groups/${encodedGroupId}/rules/${ruleType}`);
        } catch (error: any) {
            console.error(`Error deleting group rule ${ruleType} for ${groupId}:`, error);
            throw new Error(`Failed to delete group rule: ${error.message || error}`);
        }
    }

    /**
     * Get all artifact rules
     */
    async getArtifactRules(groupId: string, artifactId: string): Promise<RuleType[]> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const response = await this.client.get(`/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/rules`);
            return response.data;
        } catch (error: any) {
            console.error(`Error fetching artifact rules for ${groupId}/${artifactId}:`, error);
            throw new Error(`Failed to fetch artifact rules: ${error.message || error}`);
        }
    }

    /**
     * Get a specific artifact rule
     */
    async getArtifactRule(groupId: string, artifactId: string, ruleType: RuleType): Promise<Rule> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const response = await this.client.get(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/rules/${ruleType}`
            );
            return response.data;
        } catch (error: any) {
            console.error(`Error fetching artifact rule ${ruleType} for ${groupId}/${artifactId}:`, error);
            throw new Error(`Failed to fetch artifact rule: ${error.message || error}`);
        }
    }

    /**
     * Create an artifact rule
     */
    async createArtifactRule(groupId: string, artifactId: string, ruleType: RuleType, config: string): Promise<Rule> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const response = await this.client.post(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/rules`,
                {
                    ruleType,
                    config
                }
            );
            return response.data;
        } catch (error: any) {
            console.error(`Error creating artifact rule ${ruleType} for ${groupId}/${artifactId}:`, error);
            throw new Error(`Failed to create artifact rule: ${error.message || error}`);
        }
    }

    /**
     * Update an artifact rule configuration
     */
    async updateArtifactRule(groupId: string, artifactId: string, ruleType: RuleType, config: string): Promise<Rule> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const response = await this.client.put(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/rules/${ruleType}`,
                {
                    config
                }
            );
            return response.data;
        } catch (error: any) {
            console.error(`Error updating artifact rule ${ruleType} for ${groupId}/${artifactId}:`, error);
            throw new Error(`Failed to update artifact rule: ${error.message || error}`);
        }
    }

    /**
     * Delete an artifact rule
     */
    async deleteArtifactRule(groupId: string, artifactId: string, ruleType: RuleType): Promise<void> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            await this.client.delete(`/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/rules/${ruleType}`);
        } catch (error: any) {
            console.error(`Error deleting artifact rule ${ruleType} for ${groupId}/${artifactId}:`, error);
            throw new Error(`Failed to delete artifact rule: ${error.message || error}`);
        }
    }

    // ================================================================================
    // BRANCH MANAGEMENT
    // ================================================================================

    /**
     * Get all branches for an artifact
     */
    async getBranches(groupId: string, artifactId: string): Promise<BranchMetadata[]> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const response = await this.client.get(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/branches`
            );
            return response.data.branches || [];
        } catch (error: any) {
            console.error(`Error fetching branches for ${groupId}/${artifactId}:`, error);

            if (error.response?.status === 404) {
                throw new Error(`Artifact not found: ${groupId}/${artifactId}`);
            }

            throw new Error(`Failed to fetch branches: ${error.message || error}`);
        }
    }

    /**
     * Get metadata for a specific branch
     */
    async getBranchMetadata(groupId: string, artifactId: string, branchId: string): Promise<BranchMetadata> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedBranchId = encodeURIComponent(branchId);
            const response = await this.client.get(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/branches/${encodedBranchId}`
            );
            return response.data;
        } catch (error: any) {
            console.error(`Error fetching branch ${branchId} for ${groupId}/${artifactId}:`, error);

            if (error.response?.status === 404) {
                throw new Error(`Branch not found: ${branchId}`);
            }

            throw new Error(`Failed to fetch branch metadata: ${error.message || error}`);
        }
    }

    /**
     * Create a new branch
     */
    async createBranch(
        groupId: string,
        artifactId: string,
        branchId: string,
        description?: string
    ): Promise<BranchMetadata> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);

            const requestBody: any = { branchId };
            if (description) {
                requestBody.description = description;
            }

            const response = await this.client.post(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/branches`,
                requestBody
            );
            return response.data;
        } catch (error: any) {
            console.error(`Error creating branch ${branchId} for ${groupId}/${artifactId}:`, error);

            if (error.response?.status === 409) {
                throw new Error(`Branch already exists: ${branchId}`);
            }

            if (error.response?.status === 400) {
                throw new Error(`Invalid branch ID format: ${branchId}`);
            }

            throw new Error(`Failed to create branch: ${error.message || error}`);
        }
    }

    /**
     * Update branch metadata
     */
    async updateBranchMetadata(
        groupId: string,
        artifactId: string,
        branchId: string,
        metadata: { description?: string }
    ): Promise<void> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedBranchId = encodeURIComponent(branchId);

            await this.client.put(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/branches/${encodedBranchId}`,
                metadata
            );
        } catch (error: any) {
            console.error(`Error updating branch ${branchId} for ${groupId}/${artifactId}:`, error);

            if (error.response?.status === 404) {
                throw new Error(`Branch not found: ${branchId}`);
            }

            throw new Error(`Failed to update branch metadata: ${error.message || error}`);
        }
    }

    /**
     * Delete a branch
     */
    async deleteBranch(groupId: string, artifactId: string, branchId: string): Promise<void> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedBranchId = encodeURIComponent(branchId);

            await this.client.delete(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/branches/${encodedBranchId}`
            );
        } catch (error: any) {
            console.error(`Error deleting branch ${branchId} for ${groupId}/${artifactId}:`, error);

            if (error.response?.status === 405) {
                throw new Error(`Cannot delete system-defined branch: ${branchId}`);
            }

            if (error.response?.status === 404) {
                throw new Error(`Branch not found: ${branchId}`);
            }

            throw new Error(`Failed to delete branch: ${error.message || error}`);
        }
    }

    /**
     * Get versions in a branch
     */
    async getBranchVersions(groupId: string, artifactId: string, branchId: string): Promise<SearchedVersion[]> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedBranchId = encodeURIComponent(branchId);

            const response = await this.client.get(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/branches/${encodedBranchId}/versions`
            );
            return response.data.versions || [];
        } catch (error: any) {
            console.error(`Error fetching versions for branch ${branchId} in ${groupId}/${artifactId}:`, error);
            throw new Error(`Failed to fetch branch versions: ${error.message || error}`);
        }
    }

    /**
     * Add a version to a branch
     */
    async addVersionToBranch(
        groupId: string,
        artifactId: string,
        branchId: string,
        version: string
    ): Promise<void> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);
            const encodedBranchId = encodeURIComponent(branchId);

            await this.client.post(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/branches/${encodedBranchId}/versions`,
                { version }
            );
        } catch (error: any) {
            console.error(`Error adding version ${version} to branch ${branchId} in ${groupId}/${artifactId}:`, error);

            if (error.response?.status === 404) {
                throw new Error(`Version not found: ${version}`);
            }

            if (error.response?.status === 409) {
                throw new Error(`Version already in branch: ${version}`);
            }

            throw new Error(`Failed to add version to branch: ${error.message || error}`);
        }
    }

    // ==================== Import/Export Operations ====================

    /**
     * Export all registry artifacts as a ZIP file.
     * Uses the /admin/export endpoint.
     *
     * @returns ZIP file content as Uint8Array
     * @throws Error if export fails
     */
    async exportAll(): Promise<Uint8Array> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const response = await this.client.get('/admin/export', {
                responseType: 'arraybuffer'
            });

            if (!response.data) {
                throw new Error('No data received from export endpoint');
            }

            return new Uint8Array(response.data);
        } catch (error: any) {
            console.error('Error exporting registry:', error);
            throw new Error(`Failed to export registry: ${error.message || error}`);
        }
    }

    /**
     * Import artifacts from a ZIP file.
     * Uses the /admin/import endpoint.
     *
     * @param zipContent ZIP file content as Uint8Array
     * @throws Error if import fails (400 = validation error, 409 = conflicts)
     */
    async importArtifacts(zipContent: Uint8Array): Promise<void> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            await this.client.post('/admin/import', zipContent, {
                headers: {
                    'Content-Type': 'application/zip'
                }
            });
        } catch (error: any) {
            console.error('Error importing artifacts:', error);

            if (error.response?.status === 400) {
                throw new Error('Invalid ZIP file or corrupted content');
            }

            if (error.response?.status === 409) {
                throw new Error('Some artifacts already exist (conflict)');
            }

            throw new Error(`Failed to import artifacts: ${error.message || error}`);
        }
    }

    /**
     * Get all role mappings
     * @returns Array of role mappings
     */
    async getRoleMappings(): Promise<RoleMapping[]> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        const response = await this.client.get<RoleMapping[]>('/admin/roleMappings');
        return response.data;
    }

    /**
     * Get current user's role mapping
     * @returns Current user's role mapping or null if not found
     */
    async getCurrentUserRole(): Promise<RoleMapping | null> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        try {
            const response = await this.client.get<RoleMapping>('/admin/roleMappings/me');
            return response.data;
        } catch (error: any) {
            // Return null if user has no role (404)
            if (error.response?.status === 404) {
                return null;
            }
            // Re-throw other errors
            throw error;
        }
    }

    /**
     * Create a new role mapping
     * @param principalId Principal ID (user or service account)
     * @param role Role to assign
     * @param principalName Optional principal display name
     * @returns Created role mapping
     */
    async createRoleMapping(
        principalId: string,
        role: Role,
        principalName?: string
    ): Promise<RoleMapping> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        const response = await this.client.post<RoleMapping>('/admin/roleMappings', {
            principalId,
            role,
            principalName
        });
        return response.data;
    }

    /**
     * Update an existing role mapping
     * @param principalId Principal ID to update
     * @param role New role to assign
     * @returns Updated role mapping
     */
    async updateRoleMapping(principalId: string, role: Role): Promise<RoleMapping> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        const encodedPrincipalId = encodeURIComponent(principalId);
        const response = await this.client.put<RoleMapping>(
            `/admin/roleMappings/${encodedPrincipalId}`,
            { role }
        );
        return response.data;
    }

    /**
     * Delete a role mapping
     * @param principalId Principal ID to delete
     */
    async deleteRoleMapping(principalId: string): Promise<void> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        const encodedPrincipalId = encodeURIComponent(principalId);
        await this.client.delete(`/admin/roleMappings/${encodedPrincipalId}`);
    }

    // ======================
    // Configuration Settings
    // ======================

    /**
     * Get all configuration properties
     * @returns Array of configuration properties
     */
    async getConfigProperties(): Promise<ConfigurationProperty[]> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        const response = await this.client.get<ConfigurationProperty[]>('/admin/config/properties');
        return response.data;
    }

    /**
     * Get single configuration property
     * @param propertyName Property name
     * @returns Configuration property
     */
    async getConfigProperty(propertyName: string): Promise<ConfigurationProperty> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        const encodedName = encodeURIComponent(propertyName);
        const response = await this.client.get<ConfigurationProperty>(
            `/admin/config/properties/${encodedName}`
        );
        return response.data;
    }

    /**
     * Update configuration property value
     * @param propertyName Property name
     * @param value New property value (always string)
     */
    async updateConfigProperty(propertyName: string, value: string): Promise<void> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        const encodedName = encodeURIComponent(propertyName);
        await this.client.put(`/admin/config/properties/${encodedName}`, { value });
    }

    /**
     * Delete configuration property (reset to default)
     * @param propertyName Property name to delete
     */
    async deleteConfigProperty(propertyName: string): Promise<void> {
        if (!this.client) {
            throw new Error('Not connected to registry');
        }

        const encodedName = encodeURIComponent(propertyName);
        await this.client.delete(`/admin/config/properties/${encodedName}`);
    }

    async createVersion(
        groupId: string,
        artifactId: string,
        data: CreateVersion
    ): Promise<VersionMetaData> {
        this.ensureConnected();

        try {
            const encodedGroupId = encodeURIComponent(groupId);
            const encodedArtifactId = encodeURIComponent(artifactId);

            const response = await this.client!.post(
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions`,
                data,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error creating version:', error);

            // Provide more specific error messages
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || error.response.data?.detail || error.message;

                switch (status) {
                    case 409:
                        throw new Error(`Version already exists: ${message}`);
                    case 400:
                        throw new Error(`Invalid request: ${message}`);
                    case 401:
                        throw new Error('Authentication required');
                    case 403:
                        throw new Error('Permission denied');
                    case 404:
                        throw new Error(`Artifact not found: ${groupId}/${artifactId}`);
                    default:
                        throw new Error(`Failed to create version: ${message}`);
                }
            }

            throw new Error(`Failed to create version: ${error.message || error}`);
        }
    }
}