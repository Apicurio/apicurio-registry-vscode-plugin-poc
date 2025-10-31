import * as vscode from 'vscode';
import { MCPServerConfig } from '../models/mcpServerConfig';

/**
 * Manages Claude Code configuration for MCP integration.
 * Automatically configures Claude Code to use the Apicurio Registry MCP server.
 */
export class MCPConfigurationManager {
    private config: MCPServerConfig;

    constructor(config: MCPServerConfig) {
        this.config = config;
    }

    /**
     * Check if Claude Code extension is installed.
     */
    async isClaudeCodeInstalled(): Promise<boolean> {
        const extension = vscode.extensions.getExtension('anthropic.claude-code');
        return extension !== undefined;
    }

    /**
     * Check if MCP server is configured in Claude Code.
     */
    async isMCPServerConfigured(): Promise<boolean> {
        const claudeConfig = vscode.workspace.getConfiguration('claude-code');
        const mcpServers = claudeConfig.get<any>('mcpServers') || {};
        return 'apicurio-registry' in mcpServers;
    }

    /**
     * Configure Claude Code to use the Apicurio Registry MCP server.
     */
    async configureClaudeCode(): Promise<void> {
        const installed = await this.isClaudeCodeInstalled();
        if (!installed) {
            const install = await vscode.window.showInformationMessage(
                'Claude Code extension is not installed. Would you like to install it to use AI features?',
                { modal: true },
                'Install Claude Code',
                'Manual Setup Instructions'
            );

            if (install === 'Install Claude Code') {
                await vscode.commands.executeCommand(
                    'workbench.extensions.search',
                    '@id:anthropic.claude-code'
                );
            } else if (install === 'Manual Setup Instructions') {
                this.showManualSetupInstructions();
            }
            return;
        }

        try {
            const claudeConfig = vscode.workspace.getConfiguration('claude-code');
            const mcpServers = claudeConfig.get<any>('mcpServers') || {};

            // Add or update Apicurio Registry MCP server configuration
            mcpServers['apicurio-registry'] = this.buildMCPServerConfig();

            await claudeConfig.update('mcpServers', mcpServers, vscode.ConfigurationTarget.Global);

            vscode.window.showInformationMessage(
                'Claude Code configured successfully for Apicurio Registry MCP server'
            );
        } catch (error: any) {
            // Configuration key might not exist yet - show manual instructions
            vscode.window.showWarningMessage(
                `Automatic configuration failed. Showing manual setup instructions...`,
                'Show Instructions'
            ).then(action => {
                if (action === 'Show Instructions') {
                    this.showManualSetupInstructions();
                }
            });
        }
    }

    /**
     * Show manual setup instructions for Claude Code.
     */
    private showManualSetupInstructions(): void {
        const mcpConfig = this.buildMCPServerConfig();
        const configJson = JSON.stringify({
            'claude-code.mcpServers': {
                'apicurio-registry': mcpConfig
            }
        }, null, 2);

        const message = `Manual Claude Code Setup

1. Open VSCode Settings (Cmd+,)
2. Click the "{}" icon (top-right) to open settings.json
3. Add this configuration:

${configJson}

4. Save and restart VSCode
5. Open Claude Code chat and try: "List all groups in my Apicurio Registry"

The configuration has been copied to your clipboard!`;

        vscode.env.clipboard.writeText(configJson);
        vscode.window.showInformationMessage(message, { modal: true }, 'Open Settings').then(action => {
            if (action === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettingsJson');
            }
        });
    }

    /**
     * Remove Apicurio Registry MCP server from Claude Code configuration.
     */
    async removeMCPServerConfig(): Promise<void> {
        try {
            const claudeConfig = vscode.workspace.getConfiguration('claude-code');
            const mcpServers = claudeConfig.get<any>('mcpServers') || {};

            if ('apicurio-registry' in mcpServers) {
                delete mcpServers['apicurio-registry'];
                await claudeConfig.update('mcpServers', mcpServers, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(
                    'Apicurio Registry MCP server removed from Claude Code configuration'
                );
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(
                `Failed to remove MCP server config: ${error.message}`
            );
        }
    }

    /**
     * Update configuration.
     */
    updateConfig(config: Partial<MCPServerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Build MCP server configuration for Claude Code.
     */
    private buildMCPServerConfig(): any {
        switch (this.config.serverType) {
            case 'docker':
                return {
                    command: 'podman',
                    args: [
                        'run',
                        '-i',
                        '--rm',
                        '-e', `REGISTRY_URL=${this.config.registryUrl}`,
                        '-e', `APICURIO_MCP_SAFE_MODE=${this.config.safeMode}`,
                        '-e', `APICURIO_MCP_PAGING_LIMIT=${this.config.pagingLimit}`,
                        this.config.dockerImage
                    ],
                    env: {}
                };

            case 'jar':
                return {
                    command: 'java',
                    args: [
                        '-jar',
                        this.config.jarPath,
                        `-Dregistry.url=${this.config.registryUrl}`,
                        `-Dapicurio.mcp.safe-mode=${this.config.safeMode}`,
                        `-Dapicurio.mcp.paging.limit=${this.config.pagingLimit}`,
                        `-Dquarkus.http.port=${this.config.port}`
                    ],
                    env: {}
                };

            case 'external':
                // For external servers, use a simple HTTP transport
                return {
                    transport: {
                        type: 'http',
                        url: `http://localhost:${this.config.port}`
                    }
                };

            default:
                throw new Error(`Unknown server type: ${this.config.serverType}`);
        }
    }

    /**
     * Show setup wizard for first-time configuration.
     */
    async showSetupWizard(): Promise<boolean> {
        // Step 1: Check if Claude Code is installed
        const claudeInstalled = await this.isClaudeCodeInstalled();
        if (!claudeInstalled) {
            const install = await vscode.window.showInformationMessage(
                'Welcome to Apicurio Registry AI Features!\n\nTo use AI-powered schema creation and analysis, you need the Claude Code extension.',
                { modal: true },
                'Install Claude Code',
                'Skip for Now'
            );

            if (install !== 'Install Claude Code') {
                return false;
            }

            await vscode.commands.executeCommand(
                'workbench.extensions.search',
                '@id:anthropic.claude-code'
            );

            vscode.window.showInformationMessage(
                'Please install Claude Code and restart VSCode, then run this setup again.'
            );
            return false;
        }

        // Step 2: Check if Registry connection is configured
        const registryConfig = vscode.workspace.getConfiguration('apicurioRegistry');
        const connections = registryConfig.get<any[]>('connections', []);

        if (connections.length === 0) {
            const configure = await vscode.window.showInformationMessage(
                'No Apicurio Registry connections configured. Would you like to set one up?',
                { modal: true },
                'Configure Now',
                'Cancel'
            );

            if (configure === 'Configure Now') {
                await vscode.commands.executeCommand(
                    'workbench.action.openSettings',
                    'apicurioRegistry.connections'
                );
                vscode.window.showInformationMessage(
                    'Please configure a registry connection and run setup again.'
                );
            }
            return false;
        }

        // Step 3: Check server type preference
        const serverTypeOptions = [
            {
                label: '$(package) Docker (Recommended)',
                description: 'Run MCP server in Docker container',
                detail: 'Easiest setup, requires Docker Desktop',
                serverType: 'docker' as const
            },
            {
                label: '$(file-binary) JAR File',
                description: 'Run MCP server as Java process',
                detail: 'Requires Java 17+ and MCP server JAR',
                serverType: 'jar' as const
            },
            {
                label: '$(globe) External Server',
                description: 'Connect to externally managed MCP server',
                detail: 'Server is already running elsewhere',
                serverType: 'external' as const
            }
        ];

        const serverTypeChoice = await vscode.window.showQuickPick(serverTypeOptions, {
            placeHolder: 'How would you like to run the MCP server?',
            ignoreFocusOut: true
        });

        if (!serverTypeChoice) {
            return false;
        }

        // Update configuration
        const mcpConfig = vscode.workspace.getConfiguration('apicurioRegistry.mcp');
        await mcpConfig.update('serverType', serverTypeChoice.serverType, vscode.ConfigurationTarget.Global);
        this.config.serverType = serverTypeChoice.serverType;

        // Step 4: Configure Claude Code
        const configureNow = await vscode.window.showInformationMessage(
            'Configure Claude Code to use Apicurio Registry MCP server?',
            { modal: true },
            'Yes, Configure',
            'I\'ll do it manually'
        );

        if (configureNow === 'Yes, Configure') {
            await this.configureClaudeCode();
        }

        // Step 5: Inform about automatic startup
        await vscode.window.showInformationMessage(
            'Configuration complete! The MCP server will start automatically when Claude needs it.',
            { modal: false }
        );

        // Show success message with next steps
        const message = [
            'Setup complete! You can now:',
            '',
            '• Open Claude Code chat',
            '• Ask questions about your schemas',
            '• Generate new schemas with AI',
            '• Analyze and compare versions',
            '',
            'Try asking: "List my Apicurio Registry groups"'
        ].join('\n');

        vscode.window.showInformationMessage(message, { modal: true });

        return true;
    }
}
