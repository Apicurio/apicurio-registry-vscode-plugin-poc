/**
 * MCP (Model Context Protocol) Server Configuration Models
 */

export type ServerType = 'docker' | 'jar' | 'external';

export type ServerStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error' | 'unknown';

/**
 * Management mode determines who manages the MCP server lifecycle.
 * - 'extension': VSCode extension starts/stops the server
 * - 'claude-code': Claude Code CLI manages the server via stdio transport
 */
export type ManagementMode = 'extension' | 'claude-code';

export interface MCPServerConfig {
    enabled: boolean;
    serverType: ServerType;
    dockerImage: string;
    jarPath: string;
    port: number;
    autoStart: boolean;
    registryUrl: string;
    safeMode: boolean;
    pagingLimit: number;
    managementMode?: ManagementMode;
}

export interface ServerHealth {
    healthy: boolean;
    uptime?: number;
    lastCheck: Date;
    error?: string;
}

export interface ServerInfo {
    status: ServerStatus;
    type: ServerType;
    port: number;
    registryUrl: string;
    health?: ServerHealth;
    managementMode: ManagementMode;
}

export const DEFAULT_MCP_CONFIG: MCPServerConfig = {
    enabled: true,
    serverType: 'docker',
    dockerImage: 'quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot',
    jarPath: '',
    port: 3000,
    autoStart: true,
    registryUrl: 'http://localhost:8080',
    safeMode: true,
    pagingLimit: 200,
    managementMode: 'extension'
};
