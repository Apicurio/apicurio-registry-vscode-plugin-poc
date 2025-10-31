/**
 * MCP (Model Context Protocol) Server Configuration Models
 */

export type ServerType = 'docker' | 'jar' | 'external';

export type ServerStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error' | 'unknown';

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
    pagingLimit: 200
};
