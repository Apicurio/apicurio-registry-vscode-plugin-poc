export enum RegistryItemType {
    Connection = 'connection',
    Group = 'group',
    Artifact = 'artifact',
    Branch = 'branch',
    Version = 'version',
    RolesContainer = 'rolesContainer',
    RoleMapping = 'roleMapping',
    CurrentUserRole = 'currentUserRole',
    SettingsContainer = 'settingsContainer',
    PropertyGroup = 'propertyGroup',
    ConfigProperty = 'configProperty'
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
            case RegistryItemType.Branch:
                return `Branch: ${this.label}\\nSystem: ${this.metadata?.systemDefined ? 'Yes' : 'No'}`;
            case RegistryItemType.Version:
                return `Version: ${this.label}\\nState: ${this.metadata?.state || 'Unknown'}`;
            case RegistryItemType.RolesContainer:
                return `Role Mappings: ${this.metadata?.count || 0} total`;
            case RegistryItemType.CurrentUserRole:
                return `Your Role: ${this.metadata?.role || 'Unknown'}\\nPrincipal: ${this.metadata?.principalId || 'Unknown'}`;
            case RegistryItemType.RoleMapping:
                return `Principal: ${this.metadata?.principalId || 'Unknown'}\\nRole: ${this.metadata?.role || 'Unknown'}${this.metadata?.principalName ? '\\nName: ' + this.metadata.principalName : ''}`;
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

export interface ArtifactReference {
    groupId?: string;
    artifactId: string;
    version?: string;
    name?: string;
}

export interface VersionContent {
    content: string;
    contentType: string;
    references?: ArtifactReference[];
}

export interface CreateVersion {
    version?: string;
    content: VersionContent;
    name?: string;
    description?: string;
    labels?: Record<string, string>;
    branches?: string[];
    isDraft?: boolean;
}

export interface CreateArtifactRequest {
    artifactId?: string;
    artifactType?: string;
    name?: string;
    description?: string;
    labels?: Record<string, string>;
    firstVersion?: CreateVersion;
    // Query params (handled separately)
    ifExists?: 'FAIL' | 'UPDATE' | 'RETURN' | 'RETURN_OR_UPDATE';
    canonical?: boolean;
    dryRun?: boolean;
}

export interface ArtifactMetaData {
    groupId: string;
    artifactId: string;
    artifactType: string;
    owner: string;
    createdOn: number;
    modifiedOn: number;
    modifiedBy: string;
    name?: string;
    description?: string;
    labels?: Record<string, string>;
}

export interface VersionMetaData {
    version: string;
    groupId: string;
    artifactId: string;
    name?: string;
    description?: string;
    owner: string;
    createdOn: number;
    artifactType: string;
    state: VersionState;
    labels?: Record<string, string>;
    contentId: string;
    globalId: string;
}

export interface CreateArtifactResponse {
    artifact: ArtifactMetaData;
    version?: VersionMetaData;
}

export interface GroupMetaData {
    groupId: string;
    description?: string;
    artifactCount?: number;
    labels?: Record<string, string>;
    owner?: string;
    createdOn?: number;
    modifiedOn?: number;
    modifiedBy?: string;
}

export interface UIConfig {
    features?: {
        draftMutability?: boolean;
        readOnly?: boolean;
    };
    ui?: {
        contextPath?: string;
        editorsUrl?: string;
    };
}

/**
 * Registry system information, including version.
 * Returned from GET /system/info endpoint.
 */
export interface RegistryInfo {
    /** Registry name (e.g., "Apicurio Registry") */
    name: string;
    /** Registry description */
    description: string;
    /** Registry version (e.g., "3.1.1") */
    version: string;
    /** Build timestamp (ISO 8601 format) */
    builtOn: string;
}

/**
 * Rule type enumeration
 */
export enum RuleType {
    VALIDITY = 'VALIDITY',
    COMPATIBILITY = 'COMPATIBILITY',
    INTEGRITY = 'INTEGRITY'
}

/**
 * Validation rule configuration
 */
export interface Rule {
    ruleType: RuleType;
    config: string;
}

/**
 * Create/update rule request
 */
export interface CreateRule {
    ruleType: RuleType;
    config: string;
}

/**
 * Branch metadata
 */
export interface BranchMetadata {
    groupId: string;
    artifactId: string;
    branchId: string;
    createdOn: string;      // ISO timestamp
    modifiedOn: string;     // ISO timestamp
    modifiedBy: string;
    owner: string;
    description?: string;
    systemDefined: boolean; // true for "latest", false for custom
}

/**
 * Branch list response
 */
export interface BranchList {
    branches: BranchMetadata[];
    count: number;
}

/**
 * Create branch request
 */
export interface CreateBranchRequest {
    branchId: string;
    description?: string;
}

/**
 * Update branch metadata request
 */
export interface UpdateBranchMetadataRequest {
    description?: string;
}

/**
 * Add version to branch request
 */
export interface AddVersionToBranchRequest {
    version: string;
}

/**
 * Role enumeration for RBAC
 */
export enum Role {
    ADMIN = 'ADMIN',
    DEVELOPER = 'DEVELOPER',
    READ_ONLY = 'READ_ONLY'
}

/**
 * Role mapping for a principal (user or service account)
 */
export interface RoleMapping {
    principalId: string;
    role: Role;
    principalName?: string;
}

/**
 * Create role mapping request
 */
export interface CreateRoleMappingRequest {
    principalId: string;
    role: Role;
    principalName?: string;
}

/**
 * Update role mapping request
 */
export interface UpdateRoleMappingRequest {
    role: Role;
}

/**
 * Property type enumeration (Java types from Registry API)
 */
export enum PropertyType {
    BOOLEAN = 'java.lang.Boolean',
    INTEGER = 'java.lang.Integer',
    LONG = 'java.lang.Long',
    STRING = 'java.lang.String'
}

/**
 * Configuration property returned by Registry API
 */
export interface ConfigurationProperty {
    /** Property name (e.g., "apicurio.authn.basic-client-credentials.enabled") */
    name: string;

    /** Property value (always string, even for booleans/numbers) */
    value: string;

    /** Java type (e.g., "java.lang.Boolean", "java.lang.Integer") */
    type: string;

    /** Human-readable label */
    label: string;

    /** Property description/help text */
    description: string;
}

/**
 * Update property request body
 */
export interface UpdatePropertyRequest {
    value: string;
}