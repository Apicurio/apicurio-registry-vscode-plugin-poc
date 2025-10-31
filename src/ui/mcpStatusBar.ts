import * as vscode from 'vscode';
import { ServerStatus } from '../models/mcpServerConfig';

/**
 * Manages the MCP server status bar item.
 * Shows connection status and provides quick actions.
 */
export class MCPStatusBar {
    private statusBarItem: vscode.StatusBarItem;
    private currentStatus: ServerStatus = 'stopped';

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            99 // Priority (lower number = more to the right)
        );
        this.statusBarItem.command = 'apicurioRegistry.mcp.showQuickActions';
        this.updateStatusBar();
    }

    /**
     * Update status based on server state.
     */
    updateStatus(status: ServerStatus): void {
        this.currentStatus = status;
        this.updateStatusBar();
    }

    /**
     * Show the status bar item.
     */
    show(): void {
        this.statusBarItem.show();
    }

    /**
     * Hide the status bar item.
     */
    hide(): void {
        this.statusBarItem.hide();
    }

    /**
     * Dispose the status bar item.
     */
    dispose(): void {
        this.statusBarItem.dispose();
    }

    /**
     * Update status bar appearance based on current status.
     */
    private updateStatusBar(): void {
        switch (this.currentStatus) {
            case 'running':
                this.statusBarItem.text = '$(check) MCP';
                this.statusBarItem.tooltip = 'Apicurio MCP Server: Running\nClick for quick actions';
                this.statusBarItem.backgroundColor = undefined;
                this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.foreground');
                break;

            case 'starting':
                this.statusBarItem.text = '$(sync~spin) MCP';
                this.statusBarItem.tooltip = 'Apicurio MCP Server: Starting...';
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                this.statusBarItem.color = undefined;
                break;

            case 'stopping':
                this.statusBarItem.text = '$(sync~spin) MCP';
                this.statusBarItem.tooltip = 'Apicurio MCP Server: Stopping...';
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                this.statusBarItem.color = undefined;
                break;

            case 'stopped':
                this.statusBarItem.text = '$(tools) MCP';
                this.statusBarItem.tooltip = 'Apicurio MCP: Click to configure Claude Code';
                this.statusBarItem.backgroundColor = undefined;
                this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.foreground');
                break;

            case 'error':
                this.statusBarItem.text = '$(error) MCP';
                this.statusBarItem.tooltip = 'Apicurio MCP Server: Error\nClick for options';
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                this.statusBarItem.color = undefined;
                break;

            case 'unknown':
            default:
                this.statusBarItem.text = '$(question) MCP';
                this.statusBarItem.tooltip = 'Apicurio MCP Server: Unknown state';
                this.statusBarItem.backgroundColor = undefined;
                this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.foreground');
                break;
        }
    }
}
