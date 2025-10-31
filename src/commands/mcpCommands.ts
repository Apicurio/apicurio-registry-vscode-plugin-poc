import * as vscode from 'vscode';
import { MCPServerManager } from '../services/mcpServerManager';

/**
 * Command: Start MCP server
 * NOTE: For stdio-based MCP servers, Claude Code manages the lifecycle.
 * This command just informs the user.
 */
export async function startMCPServerCommand(serverManager: MCPServerManager): Promise<void> {
    vscode.window.showInformationMessage(
        'The MCP server is managed by Claude Code and starts automatically when needed. ' +
        'No manual start required!',
        'Configure Claude Code'
    ).then(action => {
        if (action === 'Configure Claude Code') {
            vscode.commands.executeCommand('apicurioRegistry.mcp.configureClaude');
        }
    });
}

/**
 * Command: Stop MCP server
 */
export async function stopMCPServerCommand(serverManager: MCPServerManager): Promise<void> {
    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Stopping Apicurio MCP Server...',
                cancellable: false
            },
            async () => {
                await serverManager.stopServer();
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to stop MCP server: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Command: Restart MCP server
 */
export async function restartMCPServerCommand(serverManager: MCPServerManager): Promise<void> {
    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Restarting Apicurio MCP Server...',
                cancellable: false
            },
            async () => {
                await serverManager.restartServer();
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to restart MCP server: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Command: Show MCP server quick actions
 */
export async function showMCPQuickActionsCommand(serverManager: MCPServerManager): Promise<void> {
    const info = serverManager.getServerInfo();

    const actions: vscode.QuickPickItem[] = [];

    // MCP server is managed by Claude Code, so we only offer configuration
    actions.push({
        label: '$(tools) Configure Claude Code',
        description: 'Setup AI integration',
        detail: 'Configures Claude Code to use the Apicurio Registry MCP server'
    });

    actions.push({
        label: '$(book) Setup Wizard',
        description: 'Run first-time setup',
        detail: 'Complete guided setup for MCP integration'
    });

    actions.push({
        label: '$(gear) MCP Settings',
        description: 'Open configuration',
        detail: 'Configure MCP server options (port, safe mode, etc.)'
    });

    actions.push({
        label: '$(info) About MCP',
        description: 'How it works',
        detail: 'Learn about the Model Context Protocol integration'
    });

    const selected = await vscode.window.showQuickPick(actions, {
        placeHolder: 'Apicurio Registry MCP Integration',
        matchOnDescription: true,
        matchOnDetail: true
    });

    if (!selected) {
        return;
    }

    // Execute action
    if (selected.label.includes('Configure Claude Code')) {
        await vscode.commands.executeCommand('apicurioRegistry.mcp.configureClaude');
    } else if (selected.label.includes('Setup Wizard')) {
        await vscode.commands.executeCommand('apicurioRegistry.mcp.setup');
    } else if (selected.label.includes('MCP Settings')) {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'apicurioRegistry.mcp');
    } else if (selected.label.includes('About MCP')) {
        const message = [
            'Apicurio Registry MCP Integration',
            '',
            'The Model Context Protocol (MCP) allows Claude AI to:',
            '• List and search your Registry artifacts',
            '• Create new schemas from natural language',
            '• Analyze and compare versions',
            '• Answer questions about your APIs',
            '',
            'How it works:',
            '1. Extension configures Claude Code settings',
            '2. Claude Code starts MCP server when needed',
            '3. MCP server translates AI requests to Registry API calls',
            '4. Results flow back to Claude automatically',
            '',
            'No manual server management required!'
        ].join('\n');

        vscode.window.showInformationMessage(message, { modal: true });
    }
}

/**
 * Command: Show MCP server status
 */
export async function showMCPServerStatusCommand(serverManager: MCPServerManager): Promise<void> {
    const info = serverManager.getServerInfo();
    const statusText = info.status.charAt(0).toUpperCase() + info.status.slice(1);
    const healthText = info.health?.healthy ? '✓ Healthy' : '✗ Unhealthy';
    const lastCheck = info.health?.lastCheck?.toLocaleTimeString() || 'Never';

    const message = [
        `MCP Server Status: ${statusText}`,
        `Type: ${info.type}`,
        `Port: ${info.port}`,
        `Registry: ${info.registryUrl}`,
        '',
        `Health: ${healthText}`,
        `Last check: ${lastCheck}`
    ].join('\n');

    vscode.window.showInformationMessage(message, { modal: true });
}
