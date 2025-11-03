import * as vscode from 'vscode';
import { MCPConfigurationManager } from '../services/mcpConfigurationManager';

/**
 * Generate Claude MCP command and copy to clipboard.
 * This command provides a quick way to get the MCP configuration command
 * without going through the full setup wizard.
 */
export async function generateClaudeCommandCommand(
    mcpConfigManager: MCPConfigurationManager
): Promise<void> {
    try {
        // Generate the command
        const command = mcpConfigManager.generateClaudeMCPCommand();

        // Copy to clipboard
        await vscode.env.clipboard.writeText(command);

        // Show command in modal dialog
        const detail = `Copy this command and run it in your terminal to configure Claude Code:\n\n${command}\n\n✓ Command copied to clipboard!`;

        const action = await vscode.window.showInformationMessage(
            'Claude MCP command generated',
            { modal: true, detail },
            'Open Terminal',
            'Close'
        );

        if (action === 'Open Terminal') {
            const terminal = vscode.window.createTerminal('Claude MCP Setup');
            terminal.show();
            vscode.window.showInformationMessage('Paste the command (Cmd+V / Ctrl+V) and press Enter.');
        }
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to generate Claude MCP command: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Verify MCP configuration.
 * Checks if Claude Code is configured correctly to connect to the Apicurio Registry MCP server.
 */
export async function verifyMCPCommand(
    mcpConfigManager: MCPConfigurationManager
): Promise<void> {
    try {
        // Run verification
        const verified = await mcpConfigManager.verifyMCPConfiguration();

        if (verified) {
            // Success
            const detail = `MCP configuration is correct! 🎉\n\nClaude Code should be able to connect to Apicurio Registry.\n\nTry asking Claude:\n• "List my Apicurio Registry groups"\n• "Show me the latest version of artifact X"\n• "Create an OpenAPI schema for a user management API"`;

            await vscode.window.showInformationMessage(
                'MCP Configuration Verified',
                { modal: true, detail },
                'OK'
            );
        } else {
            // Not configured
            const detail = `MCP server is not configured for Claude Code.\n\nPossible issues:\n• Claude CLI not installed\n• MCP server not configured (run setup wizard)\n• Configuration file not found (~/.claude.json)\n\nRun the setup wizard to configure MCP.`;

            const action = await vscode.window.showWarningMessage(
                'MCP Configuration Not Found',
                { modal: true, detail },
                'Run Setup Wizard'
            );

            if (action === 'Run Setup Wizard') {
                await vscode.commands.executeCommand('apicurioRegistry.setupMCP');
            }
        }
    } catch (error) {
        const detail = `Error verifying MCP configuration:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check:\n• Claude CLI is installed (run 'claude --version')\n• You have correct permissions\n• Configuration file is accessible`;

        await vscode.window.showErrorMessage(
            'Error verifying MCP configuration',
            { modal: true, detail },
            'OK'
        );
    }
}
