export enum RegistryItemType {
    Connection = 'connection',
    Group = 'group',
    Artifact = 'artifact',
    Version = 'version'
}

export class RegistryItem {
    constructor(
        public readonly label: string,
        public readonly type: RegistryItemType,
        public readonly id?: string,
        public readonly metadata?: any,
        public readonly parentId?: string,
        public readonly groupId?: string
    ) {}

    get tooltip(): string {
        switch (this.type) {
            case RegistryItemType.Group:
                return `Group: ${this.label}\\nArtifacts: ${this.metadata?.artifactCount || 0}`;
            case RegistryItemType.Artifact:
                return `Artifact: ${this.label}\\nType: ${this.metadata?.artifactType || 'Unknown'}`;
            case RegistryItemType.Version:
                return `Version: ${this.label}\\nState: ${this.metadata?.state || 'Unknown'}`;
            default:
                return this.label;
        }
    }

    get description(): string | undefined {
        if (this.metadata?.description) {
            return this.metadata.description;
        }
        return undefined;
    }
}

export interface RegistryTreeItem {
    id: string;
    label: string;
    type: RegistryItemType;
    parentId?: string;
    groupId?: string;
    metadata?: {
        artifactCount?: number;
        artifactType?: string;
        state?: string;
        description?: string;
        versionId?: number;
        globalId?: number;
        contentId?: number;
        createdOn?: Date;
        modifiedOn?: Date;
    };
}

export interface ConnectionConfig {
    name: string;
    url: string;
    authType: 'none' | 'basic' | 'oidc';
    credentials?: {
        username?: string;
        password?: string;
        token?: string;
        clientId?: string;
        clientSecret?: string;
        authUrl?: string;
        redirectUri?: string;
    };
}

export interface RegistryGroup {
    groupId: string;
    description?: string;
    artifactCount?: number;
    labels?: Record<string, string>;
    modifiedOn?: Date;
    createdOn?: Date;
}

export interface RegistryArtifact {
    groupId: string;
    artifactId: string;
    artifactType: string;
    name?: string;
    description?: string;
    labels?: Record<string, string>;
    state: string;
    modifiedOn?: Date;
    createdOn?: Date;
}

export interface RegistryVersion {
    groupId: string;
    artifactId: string;
    version: string;
    versionId: number;
    globalId: number;
    contentId: number;
    state: string;
    labels?: Record<string, string>;
    createdOn?: Date;
    modifiedOn?: Date;
}

export interface ArtifactContent {
    content: string;
    contentType: string;
    artifactType?: string;
}

export interface SearchFilter {
    by: string;
    value: string;
}

export interface PaginationInfo {
    page: number;
    pageSize: number;
    total?: number;
}

export interface GroupSearchResults {
    groups: RegistryGroup[];
    count: number;
}

export interface ArtifactSearchResults {
    artifacts: RegistryArtifact[];
    count: number;
}

export interface VersionSearchResults {
    versions: RegistryVersion[];
    count: number;
}

export enum ArtifactType {
    AVRO = 'AVRO',
    PROTOBUF = 'PROTOBUF',
    JSON = 'JSON',
    OPENAPI = 'OPENAPI',
    ASYNCAPI = 'ASYNCAPI',
    GRAPHQL = 'GRAPHQL',
    KCONNECT = 'KCONNECT',
    WSDL = 'WSDL',
    XSD = 'XSD'
}

export enum ArtifactState {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
    DEPRECATED = 'DEPRECATED'
}

export enum VersionState {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
    DEPRECATED = 'DEPRECATED',
    DRAFT = 'DRAFT'
}