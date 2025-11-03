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
     * Uses "Copy & Run" workflow - generates CLI command for user to execute.
     */
    async configureClaudeCode(): Promise<void> {
        try {
            // Generate the Claude MCP CLI command
            const command = this.generateClaudeMCPCommand();

            // Copy to clipboard
            await vscode.env.clipboard.writeText(command);

            // Show modal with command and instructions
            const action = await vscode.window.showInformationMessage(
                'Claude Code MCP Configuration',
                {
                    modal: true,
                    detail: `To enable AI features, copy and run this command in your terminal:\n\n${command}\n\n✓ Command copied to clipboard!`
                },
                'Open Terminal',
                'Show Detailed Instructions',
                'Verify Connection'
            );

            if (action === 'Open Terminal') {
                // Open a new terminal for the user
                const terminal = vscode.window.createTerminal('Claude MCP Setup');
                terminal.show();
                vscode.window.showInformationMessage('Paste the command (Cmd+V / Ctrl+V) and press Enter');
            } else if (action === 'Show Detailed Instructions') {
                this.showDetailedInstructions(command);
            } else if (action === 'Verify Connection') {
                await this.verifyMCPConfiguration();
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(
                `Failed to generate MCP configuration: ${error.message}`
            );
        }
    }

    /**
     * Show detailed setup instructions in a new document.
     */
    private async showDetailedInstructions(command: string): Promise<void> {
        const instructions = `# Apicurio Registry - Claude Code MCP Setup

## Step 1: Run the Configuration Command

Copy and paste this command in your terminal:

\`\`\`bash
${command}
\`\`\`

## Step 2: Verify Configuration

Run this command to check if the MCP server is configured:

\`\`\`bash
claude mcp list
\`\`\`

You should see "apicurio-registry" with status "✓ Connected"

## Step 3: Test the Connection

Start a new Claude Code conversation and ask:

> List my Apicurio Registry groups

Claude should use the MCP tools to connect to your registry and return the list of groups.

## Troubleshooting

**If the command fails:**
1. Make sure Claude Code CLI is installed: \`npm install -g @anthropic-ai/claude-code\`
2. Make sure Podman or Docker is installed and running
3. Check that your Registry is accessible at: ${this.config.registryUrl}

**If Claude Code doesn't connect:**
1. Restart your conversation (MCP tools are loaded at conversation start)
2. Run \`claude mcp list\` to verify the server shows "✓ Connected"
3. Check the Registry URL includes the full path: \`/apis/registry/v3\`

**Need help?**
- Documentation: See docs/ai-integration/CLAUDE_CODE_MCP_WORKING_CONFIG.md
- Troubleshooting: See docs/ai-integration/MCP_ARCHITECTURE_VALIDATION.md
`;

        const doc = await vscode.workspace.openTextDocument({
            content: instructions,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
    }

    /**
     * Verify that Claude MCP is configured correctly.
     * Checks if Claude CLI is installed and if apicurio-registry server is configured.
     */
    async verifyMCPConfiguration(): Promise<boolean> {
        try {
            // Check if Claude CLI is installed
            const { spawn } = require('child_process');
            const checkClaude = spawn('claude', ['--version']);

            let claudeOutput = '';
            checkClaude.stdout?.on('data', (data: Buffer) => {
                claudeOutput += data.toString();
            });

            await new Promise<void>((resolve, reject) => {
                checkClaude.on('close', (code: number) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error('Claude CLI not found'));
                    }
                });
                checkClaude.on('error', () => {
                    reject(new Error('Claude CLI not installed'));
                });
            });

            vscode.window.showInformationMessage('✓ Claude CLI is installed');

            // Check if MCP server is configured
            const checkMCP = spawn('claude', ['mcp', 'list']);

            let mcpOutput = '';
            checkMCP.stdout?.on('data', (data: Buffer) => {
                mcpOutput += data.toString();
            });

            await new Promise<void>((resolve) => {
                checkMCP.on('close', () => {
                    resolve();
                });
            });

            // Check if apicurio-registry appears in output
            if (mcpOutput.includes('apicurio-registry')) {
                // Check if it shows as connected
                if (mcpOutput.includes('✓ Connected') || mcpOutput.includes('Connected')) {
                    vscode.window.showInformationMessage(
                        '✓ Apicurio Registry MCP server is configured and connected!',
                        'Test in Claude Code'
                    ).then(action => {
                        if (action === 'Test in Claude Code') {
                            vscode.env.clipboard.writeText('List my Apicurio Registry groups');
                            vscode.window.showInformationMessage(
                                'Command copied! Open Claude Code and paste to test.'
                            );
                        }
                    });
                    return true;
                } else {
                    vscode.window.showWarningMessage(
                        '⚠ Apicurio Registry MCP server is configured but not connected. Check if Registry is running at: ' + this.config.registryUrl
                    );
                    return false;
                }
            } else {
                vscode.window.showWarningMessage(
                    '⚠ Apicurio Registry MCP server is not configured. Run the setup command first.',
                    'Show Setup Command'
                ).then(action => {
                    if (action === 'Show Setup Command') {
                        this.configureClaudeCode();
                    }
                });
                return false;
            }
        } catch (error: any) {
            if (error.message.includes('Claude CLI')) {
                vscode.window.showErrorMessage(
                    'Claude CLI is not installed. Install it with: npm install -g @anthropic-ai/claude-code',
                    'Copy Install Command'
                ).then(action => {
                    if (action === 'Copy Install Command') {
                        vscode.env.clipboard.writeText('npm install -g @anthropic-ai/claude-code');
                    }
                });
            } else {
                vscode.window.showErrorMessage(
                    `Failed to verify MCP configuration: ${error.message}`
                );
            }
            return false;
        }
    }

    /**
     * Show manual setup instructions for Claude Code.
     * Now uses CLI command approach instead of VSCode settings.
     */
    private showManualSetupInstructions(): void {
        const command = this.generateClaudeMCPCommand();

        const message = `Manual Claude Code Setup

1. Open a terminal (Cmd+Shift+\` or Ctrl+Shift+\`)
2. Paste and run this command:

${command}

3. Verify with: claude mcp list
4. Start a new Claude Code conversation
5. Ask: "List my Apicurio Registry groups"

The command has been copied to your clipboard!`;

        vscode.env.clipboard.writeText(command);
        vscode.window.showInformationMessage(message, { modal: true }, 'Open Terminal', 'Show Detailed Instructions').then(action => {
            if (action === 'Open Terminal') {
                const terminal = vscode.window.createTerminal('Claude MCP Setup');
                terminal.show();
            } else if (action === 'Show Detailed Instructions') {
                this.showDetailedInstructions(command);
            }
        });
    }

    /**
     * Remove Apicurio Registry MCP server from Claude Code configuration.
     * Provides CLI command for user to run.
     */
    async removeMCPServerConfig(): Promise<void> {
        const removeCommand = 'claude mcp remove "apicurio-registry" -g';

        await vscode.env.clipboard.writeText(removeCommand);

        const action = await vscode.window.showInformationMessage(
            'Remove Apicurio Registry MCP Configuration',
            {
                modal: true,
                detail: `To remove the MCP server configuration, run this command:\n\n${removeCommand}\n\n✓ Command copied to clipboard!`
            },
            'Open Terminal',
            'Cancel'
        );

        if (action === 'Open Terminal') {
            const terminal = vscode.window.createTerminal('Claude MCP Remove');
            terminal.show();
            vscode.window.showInformationMessage('Paste the command (Cmd+V / Ctrl+V) and press Enter');
        }
    }

    /**
     * Update configuration.
     */
    updateConfig(config: Partial<MCPServerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Convert localhost URLs to container-accessible URLs.
     * For Docker/Podman containers, localhost needs to be host.containers.internal.
     */
    private convertToContainerUrl(url: string): string {
        return url
            .replace('http://localhost', 'http://host.containers.internal')
            .replace('http://127.0.0.1', 'http://host.containers.internal')
            .replace('https://localhost', 'https://host.containers.internal')
            .replace('https://127.0.0.1', 'https://host.containers.internal');
    }

    /**
     * Ensure Registry URL includes the /apis/registry/v3 path.
     */
    private normalizeRegistryUrl(url: string): string {
        // Remove trailing slash
        url = url.replace(/\/$/, '');

        // Add API path if not present
        if (!url.includes('/apis/registry/v3')) {
            url = `${url}/apis/registry/v3`;
        }

        return url;
    }

    /**
     * Generate the Claude MCP CLI command for configuring the MCP server.
     * This is the command users need to run to configure Claude Code.
     */
    generateClaudeMCPCommand(): string {
        // Normalize and convert Registry URL
        let registryUrl = this.normalizeRegistryUrl(this.config.registryUrl);

        // For Docker/Podman mode, convert localhost to container-accessible URL
        if (this.config.serverType === 'docker') {
            registryUrl = this.convertToContainerUrl(registryUrl);
        }

        switch (this.config.serverType) {
            case 'docker':
                return `claude mcp add apicurio-registry -g -- \\
  podman run -i --rm \\
  -e REGISTRY_URL=${registryUrl} \\
  -e APICURIO_MCP_SAFE_MODE=${this.config.safeMode} \\
  -e APICURIO_MCP_PAGING_LIMIT=${this.config.pagingLimit} \\
  ${this.config.dockerImage}`;

            case 'jar':
                if (!this.config.jarPath) {
                    throw new Error('JAR path not configured');
                }
                return `claude mcp add apicurio-registry -g -- \\
  java -jar ${this.config.jarPath} \\
  -Dregistry.url=${registryUrl} \\
  -Dapicurio.mcp.safe-mode=${this.config.safeMode} \\
  -Dapicurio.mcp.paging.limit=${this.config.pagingLimit}`;

            case 'external':
                // For external servers, assume HTTP transport
                return `# External MCP server at http://localhost:${this.config.port}
# Note: This server must already be running
claude mcp add apicurio-registry -g --transport http --url http://localhost:${this.config.port}`;

            default:
                throw new Error(`Unknown server type: ${this.config.serverType}`);
        }
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
