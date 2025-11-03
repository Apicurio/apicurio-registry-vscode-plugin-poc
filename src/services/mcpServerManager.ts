import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import { MCPServerConfig, ServerStatus, ServerHealth, ServerInfo, ServerType } from '../models/mcpServerConfig';

/**
 * Manages the lifecycle of the Apicurio Registry MCP server.
 * Supports running the server via Docker or as a JAR process.
 */
export class MCPServerManager {
    private serverProcess?: ChildProcess;
    private dockerContainerId?: string;
    private status: ServerStatus = 'stopped';
    private health?: ServerHealth;
    private healthCheckInterval?: NodeJS.Timeout;
    private config: MCPServerConfig;

    private _onStatusChanged = new vscode.EventEmitter<ServerStatus>();
    readonly onStatusChanged = this._onStatusChanged.event;

    private _onHealthChanged = new vscode.EventEmitter<ServerHealth>();
    readonly onHealthChanged = this._onHealthChanged.event;

    constructor(config: MCPServerConfig) {
        this.config = config;
    }

    /**
     * Start the MCP server based on configuration.
     */
    async startServer(): Promise<void> {
        if (this.status === 'running' || this.status === 'starting') {
            throw new Error('Server is already running or starting');
        }

        this.setStatus('starting');

        try {
            const managementMode = this.config.managementMode || 'extension';

            if (managementMode === 'claude-code') {
                // In claude-code mode, verify MCP is configured via Claude CLI
                await this.verifyClaudeMCPConfiguration();
                this.setStatus('running');
                // No health monitoring in claude-code mode - Claude manages the server
            } else {
                // Extension mode - start server ourselves
                switch (this.config.serverType) {
                    case 'docker':
                        await this.startDockerServer();
                        break;
                    case 'jar':
                        await this.startJarServer();
                        break;
                    case 'external':
                        // External server is managed externally, just check health
                        await this.checkHealth();
                        this.setStatus('running');
                        break;
                    default:
                        throw new Error(`Unknown server type: ${this.config.serverType}`);
                }

                // Start health monitoring (extension mode only)
                this.startHealthMonitoring();
            }

            vscode.window.showInformationMessage('Apicurio MCP Server started successfully');
        } catch (error: any) {
            this.setStatus('error');
            throw new Error(`Failed to start MCP server: ${error.message}`);
        }
    }

    /**
     * Stop the MCP server.
     */
    async stopServer(): Promise<void> {
        if (this.status === 'stopped' || this.status === 'stopping') {
            return;
        }

        this.setStatus('stopping');
        this.stopHealthMonitoring();

        try {
            const managementMode = this.config.managementMode || 'extension';

            if (managementMode === 'claude-code') {
                // In claude-code mode, we don't stop the server - Claude manages it
                // Just update status
            } else {
                // Extension mode - stop server ourselves
                switch (this.config.serverType) {
                    case 'docker':
                        await this.stopDockerServer();
                        break;
                    case 'jar':
                        await this.stopJarServer();
                        break;
                    case 'external':
                        // External server is managed externally
                        break;
                }
            }

            this.setStatus('stopped');
            vscode.window.showInformationMessage('Apicurio MCP Server stopped');
        } catch (error: any) {
            this.setStatus('error');
            throw new Error(`Failed to stop MCP server: ${error.message}`);
        }
    }

    /**
     * Restart the MCP server.
     */
    async restartServer(): Promise<void> {
        await this.stopServer();
        // Wait a bit before restarting
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.startServer();
    }

    /**
     * Get current server status and information.
     */
    getServerInfo(): ServerInfo {
        return {
            status: this.status,
            type: this.config.serverType,
            port: this.config.port,
            registryUrl: this.config.registryUrl,
            health: this.health,
            managementMode: this.config.managementMode || 'extension'
        };
    }

    /**
     * Update configuration.
     */
    updateConfig(config: Partial<MCPServerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Dispose and cleanup resources.
     */
    dispose(): void {
        this.stopHealthMonitoring();
        if (this.status === 'running') {
            // Don't await, just fire and forget
            void this.stopServer();
        }
    }

    // ==================== Private Methods ====================

    /**
     * Start MCP server in Docker container.
     */
    private async startDockerServer(): Promise<void> {
        // Check if Docker/Podman is installed
        const dockerInstalled = await this.checkDockerInstalled();
        if (!dockerInstalled) {
            throw new Error('Docker/Podman is not installed or not running. Please install Docker/Podman or use JAR mode.');
        }

        const args = [
            'run',
            '-d', // Detached mode
            '-p', `${this.config.port}:3000`,
            '-e', `REGISTRY_URL=${this.config.registryUrl}`,
            '-e', `APICURIO_MCP_SAFE_MODE=${this.config.safeMode}`,
            '-e', `APICURIO_MCP_PAGING_LIMIT=${this.config.pagingLimit}`,
            '--name', 'apicurio-mcp-server',
            '--rm', // Remove container when stopped
            this.config.dockerImage
        ];

        return new Promise((resolve, reject) => {
            const process = spawn('podman', args);
            let stdout = '';
            let stderr = '';

            process.stdout?.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr?.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', async (code) => {
                if (code === 0) {
                    // Container ID is in stdout
                    this.dockerContainerId = stdout.trim();

                    // Wait for server to be ready
                    const ready = await this.waitForServer();
                    if (ready) {
                        this.setStatus('running');
                        resolve();
                    } else {
                        reject(new Error('Server started but health check failed'));
                    }
                } else {
                    reject(new Error(`Podman command failed: ${stderr}`));
                }
            });

            process.on('error', (error) => {
                reject(new Error(`Failed to spawn podman process: ${error.message}`));
            });
        });
    }

    /**
     * Stop Docker container.
     */
    private async stopDockerServer(): Promise<void> {
        if (!this.dockerContainerId) {
            return;
        }

        return new Promise((resolve, reject) => {
            const process = spawn('podman', ['stop', this.dockerContainerId!]);

            process.on('close', (code) => {
                if (code === 0) {
                    this.dockerContainerId = undefined;
                    resolve();
                } else {
                    reject(new Error('Failed to stop Podman container'));
                }
            });

            process.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Start MCP server as JAR process.
     */
    private async startJarServer(): Promise<void> {
        if (!this.config.jarPath) {
            throw new Error('JAR path not configured');
        }

        const args = [
            '-jar',
            this.config.jarPath,
            `-Dregistry.url=${this.config.registryUrl}`,
            `-Dapicurio.mcp.safe-mode=${this.config.safeMode}`,
            `-Dapicurio.mcp.paging.limit=${this.config.pagingLimit}`,
            `-Dquarkus.http.port=${this.config.port}`
        ];

        this.serverProcess = spawn('java', args);

        this.serverProcess.stdout?.on('data', (data) => {
            console.log(`[MCP Server] ${data.toString()}`);
        });

        this.serverProcess.stderr?.on('data', (data) => {
            console.error(`[MCP Server Error] ${data.toString()}`);
        });

        this.serverProcess.on('close', (code) => {
            console.log(`MCP Server process exited with code ${code}`);
            if (this.status === 'running') {
                // Unexpected exit, try to restart
                this.setStatus('error');
                if (this.config.autoStart) {
                    vscode.window.showWarningMessage(
                        'MCP Server crashed. Attempting to restart...',
                        'Restart Now'
                    ).then(action => {
                        if (action === 'Restart Now') {
                            void this.restartServer();
                        }
                    });
                }
            }
        });

        this.serverProcess.on('error', (error) => {
            console.error('Failed to start MCP Server:', error);
            this.setStatus('error');
        });

        // Wait for server to be ready
        const ready = await this.waitForServer();
        if (ready) {
            this.setStatus('running');
        } else {
            this.serverProcess.kill();
            throw new Error('Server started but health check failed');
        }
    }

    /**
     * Stop JAR process.
     */
    private async stopJarServer(): Promise<void> {
        if (!this.serverProcess) {
            return;
        }

        return new Promise((resolve) => {
            this.serverProcess!.on('close', () => {
                this.serverProcess = undefined;
                resolve();
            });

            this.serverProcess!.kill('SIGTERM');

            // Force kill after 5 seconds if not stopped
            setTimeout(() => {
                if (this.serverProcess) {
                    this.serverProcess.kill('SIGKILL');
                    this.serverProcess = undefined;
                    resolve();
                }
            }, 5000);
        });
    }

    /**
     * Wait for server to become ready (up to 30 seconds).
     */
    private async waitForServer(maxWaitMs: number = 30000): Promise<boolean> {
        const startTime = Date.now();
        const checkInterval = 1000; // Check every second

        while (Date.now() - startTime < maxWaitMs) {
            const healthy = await this.checkHealth();
            if (healthy) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        return false;
    }

    /**
     * Check if Docker/Podman is installed and running.
     */
    private async checkDockerInstalled(): Promise<boolean> {
        return new Promise((resolve) => {
            const process = spawn('podman', ['version']);
            process.on('close', (code) => {
                resolve(code === 0);
            });
            process.on('error', () => {
                resolve(false);
            });
        });
    }

    /**
     * Check server health.
     * - Extension mode: HTTP health check
     * - Claude-code mode: Claude CLI check
     */
    private async checkHealth(): Promise<boolean> {
        const managementMode = this.config.managementMode || 'extension';

        if (managementMode === 'claude-code') {
            return this.checkClaudeMCPHealth();
        } else {
            return this.checkHTTPHealth();
        }
    }

    /**
     * Check health via HTTP (extension mode).
     */
    private async checkHTTPHealth(): Promise<boolean> {
        try {
            const response = await axios.get(`http://localhost:${this.config.port}/health`, {
                timeout: 3000,
                validateStatus: () => true // Don't throw on non-2xx status codes
            });

            const healthy = response.status >= 200 && response.status < 300;
            this.health = {
                healthy,
                lastCheck: new Date(),
                error: healthy ? undefined : `HTTP ${response.status}`
            };

            this._onHealthChanged.fire(this.health);
            return healthy;
        } catch (error: any) {
            this.health = {
                healthy: false,
                lastCheck: new Date(),
                error: error.message
            };
            this._onHealthChanged.fire(this.health);
            return false;
        }
    }

    /**
     * Check health via Claude CLI (claude-code mode).
     */
    private async checkClaudeMCPHealth(): Promise<boolean> {
        return new Promise((resolve) => {
            const process = spawn('claude', ['mcp', 'list']);
            let stdout = '';

            process.stdout?.on('data', (data: Buffer) => {
                stdout += data.toString();
            });

            process.on('close', () => {
                const hasRegistry = stdout.includes('apicurio-registry');
                const isConnected = stdout.includes('✓ Connected') || stdout.includes('Connected');
                const healthy = hasRegistry && isConnected;

                this.health = {
                    healthy,
                    lastCheck: new Date(),
                    error: healthy ? undefined : hasRegistry ? 'MCP server not connected' : 'MCP server not configured'
                };

                this._onHealthChanged.fire(this.health);
                resolve(healthy);
            });

            process.on('error', () => {
                this.health = {
                    healthy: false,
                    lastCheck: new Date(),
                    error: 'Claude CLI not found'
                };
                this._onHealthChanged.fire(this.health);
                resolve(false);
            });
        });
    }

    /**
     * Verify that Claude MCP is configured with apicurio-registry server.
     * Throws error if Claude CLI not found or server not configured.
     */
    private async verifyClaudeMCPConfiguration(): Promise<void> {
        return new Promise((resolve, reject) => {
            const process = spawn('claude', ['mcp', 'list']);
            let stdout = '';
            let stderr = '';

            process.stdout?.on('data', (data: Buffer) => {
                stdout += data.toString();
            });

            process.stderr?.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Claude CLI command failed: ${stderr}`));
                    return;
                }

                const hasRegistry = stdout.includes('apicurio-registry');
                if (!hasRegistry) {
                    reject(new Error('Apicurio Registry MCP server is not configured in Claude Code. Please run the setup wizard first.'));
                    return;
                }

                const isConnected = stdout.includes('✓ Connected') || stdout.includes('Connected');
                if (!isConnected) {
                    reject(new Error('Apicurio Registry MCP server is configured but not connected. Please check your registry is accessible.'));
                    return;
                }

                resolve();
            });

            process.on('error', (error) => {
                reject(new Error('Claude CLI not found. Please install Claude Code CLI: npm install -g @anthropic-ai/claude-code'));
            });
        });
    }

    /**
     * Start periodic health monitoring.
     */
    private startHealthMonitoring(): void {
        this.stopHealthMonitoring();

        // Check health every 10 seconds
        this.healthCheckInterval = setInterval(async () => {
            const healthy = await this.checkHealth();

            if (!healthy && this.status === 'running') {
                this.setStatus('error');

                if (this.config.autoStart) {
                    vscode.window.showWarningMessage(
                        'MCP Server is unhealthy. Attempting to restart...',
                        'Restart Now',
                        'Ignore'
                    ).then(action => {
                        if (action === 'Restart Now') {
                            void this.restartServer();
                        }
                    });
                }
            }
        }, 10000);
    }

    /**
     * Stop health monitoring.
     */
    private stopHealthMonitoring(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = undefined;
        }
    }

    /**
     * Set server status and fire event.
     */
    private setStatus(status: ServerStatus): void {
        this.status = status;
        this._onStatusChanged.fire(status);
    }
}
