import axios, { AxiosInstance } from 'axios';
import {
    CreateArtifactRequest,
    CreateArtifactResponse,
    CreateVersion,
    GroupMetaData,
    UIConfig
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
    labels?: Record<string, string>;
    createdOn?: Date;
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
    }

    private ensureConnected(): void {
        if (!this.client || !this.connection) {
            throw new Error('Not connected to registry. Please connect first.');
        }
    }

    async searchGroups(filters: any[] = []): Promise<SearchedGroup[]> {
        this.ensureConnected();

        try {
            const response = await this.client!.get('/groups', {
                params: {
                    limit: 100,
                    offset: 0
                }
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

    async updateArtifactContent(groupId: string, artifactId: string, version: string, content: ArtifactContent): Promise<void> {
        this.ensureConnected();

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

    async searchArtifacts(searchParams: Record<string, string>): Promise<SearchedArtifact[]> {
        this.ensureConnected();

        try {
            // Build query parameters for search
            const params: Record<string, any> = {
                limit: 100,
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
                `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}/meta`,
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
}