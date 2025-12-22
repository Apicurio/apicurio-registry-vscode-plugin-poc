import * as vscode from 'vscode';
import {
    startMCPServerCommand,
    stopMCPServerCommand,
    restartMCPServerCommand,
    showMCPQuickActionsCommand,
    showMCPServerStatusCommand
} from '../mcpCommands';
import { MCPServerManager } from '../../services/mcpServerManager';

// Mock VSCode
jest.mock('vscode');

describe('MCP Commands', () => {
    let mockServerManager: jest.Mocked<MCPServerManager>;
    let mockShowInformationMessage: jest.MockedFunction<typeof vscode.window.showInformationMessage>;
    let mockShowErrorMessage: jest.MockedFunction<typeof vscode.window.showErrorMessage>;
    let mockShowQuickPick: jest.MockedFunction<typeof vscode.window.showQuickPick>;
    let mockWithProgress: jest.MockedFunction<typeof vscode.window.withProgress>;
    let mockExecuteCommand: jest.MockedFunction<typeof vscode.commands.executeCommand>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock server manager
        mockServerManager = {
            stopServer: jest.fn(),
            restartServer: jest.fn(),
            getServerInfo: jest.fn()
        } as any;

        // Mock VSCode window methods
        mockShowInformationMessage = vscode.window.showInformationMessage as jest.MockedFunction<typeof vscode.window.showInformationMessage>;
        mockShowErrorMessage = vscode.window.showErrorMessage as jest.MockedFunction<typeof vscode.window.showErrorMessage>;
        mockShowQuickPick = vscode.window.showQuickPick as jest.MockedFunction<typeof vscode.window.showQuickPick>;
        mockWithProgress = vscode.window.withProgress as jest.MockedFunction<typeof vscode.window.withProgress>;

        // Mock VSCode commands
        mockExecuteCommand = vscode.commands.executeCommand as jest.MockedFunction<typeof vscode.commands.executeCommand>;
    });

    describe('startMCPServerCommand', () => {
        it('should show information message about Claude Code management', async () => {
            mockShowInformationMessage.mockResolvedValue(undefined);

            await startMCPServerCommand(mockServerManager);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('managed by Claude Code'),
                'Configure Claude Code'
            );
        });

        it('should execute configure command when user clicks button', async () => {
            mockShowInformationMessage.mockResolvedValue('Configure Claude Code' as any);
            mockExecuteCommand.mockResolvedValue(undefined);

            await startMCPServerCommand(mockServerManager);

            // Wait for promise resolution
            await new Promise(process.nextTick);

            expect(mockExecuteCommand).toHaveBeenCalledWith('apicurioRegistry.mcp.configureClaude');
        });

        it('should not execute command when user dismisses message', async () => {
            mockShowInformationMessage.mockResolvedValue(undefined);

            await startMCPServerCommand(mockServerManager);

            await new Promise(process.nextTick);

            expect(mockExecuteCommand).not.toHaveBeenCalled();
        });
    });

    describe('stopMCPServerCommand', () => {
        it('should stop server with progress indicator', async () => {
            mockServerManager.stopServer.mockResolvedValue();
            mockWithProgress.mockImplementation(async (_options, task) => {
                return await task({} as any, {} as any);
            });

            await stopMCPServerCommand(mockServerManager);

            expect(mockWithProgress).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: expect.stringContaining('Stopping'),
                    cancellable: false
                }),
                expect.any(Function)
            );
            expect(mockServerManager.stopServer).toHaveBeenCalled();
        });

        it('should show error message if stop fails', async () => {
            const error = new Error('Stop failed');
            mockServerManager.stopServer.mockRejectedValue(error);
            mockWithProgress.mockImplementation(async (_options, task) => {
                return await task({} as any, {} as any);
            });

            await stopMCPServerCommand(mockServerManager);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Failed to stop MCP server')
            );
        });

        it('should handle non-Error exceptions', async () => {
            mockServerManager.stopServer.mockRejectedValue('String error');
            mockWithProgress.mockImplementation(async (_options, task) => {
                return await task({} as any, {} as any);
            });

            await stopMCPServerCommand(mockServerManager);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('String error')
            );
        });
    });

    describe('restartMCPServerCommand', () => {
        it('should restart server with progress indicator', async () => {
            mockServerManager.restartServer.mockResolvedValue();
            mockWithProgress.mockImplementation(async (_options, task) => {
                return await task({} as any, {} as any);
            });

            await restartMCPServerCommand(mockServerManager);

            expect(mockWithProgress).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: expect.stringContaining('Restarting'),
                    cancellable: false
                }),
                expect.any(Function)
            );
            expect(mockServerManager.restartServer).toHaveBeenCalled();
        });

        it('should show error message if restart fails', async () => {
            const error = new Error('Restart failed');
            mockServerManager.restartServer.mockRejectedValue(error);
            mockWithProgress.mockImplementation(async (_options, task) => {
                return await task({} as any, {} as any);
            });

            await restartMCPServerCommand(mockServerManager);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Failed to restart MCP server')
            );
        });

        it('should handle non-Error exceptions', async () => {
            mockServerManager.restartServer.mockRejectedValue('String error');
            mockWithProgress.mockImplementation(async (_options, task) => {
                return await task({} as any, {} as any);
            });

            await restartMCPServerCommand(mockServerManager);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('String error')
            );
        });
    });

    describe('showMCPQuickActionsCommand', () => {
        beforeEach(() => {
            mockServerManager.getServerInfo.mockReturnValue({
                status: 'running',
                type: 'docker',
                port: 3000,
                registryUrl: 'http://localhost:8080',
                health: { healthy: true, lastCheck: new Date() }
            } as any);
        });

        it('should display quick actions menu', async () => {
            mockShowQuickPick.mockResolvedValue(undefined);

            await showMCPQuickActionsCommand(mockServerManager);

            expect(mockShowQuickPick).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ label: expect.stringContaining('Configure Claude Code') }),
                    expect.objectContaining({ label: expect.stringContaining('Setup Wizard') }),
                    expect.objectContaining({ label: expect.stringContaining('MCP Settings') }),
                    expect.objectContaining({ label: expect.stringContaining('About MCP') })
                ]),
                expect.objectContaining({
                    placeHolder: expect.stringContaining('Apicurio Registry MCP')
                })
            );
        });

        it('should execute configure command when selected', async () => {
            mockShowQuickPick.mockResolvedValue({ label: '$(tools) Configure Claude Code' } as any);
            mockExecuteCommand.mockResolvedValue(undefined);

            await showMCPQuickActionsCommand(mockServerManager);

            expect(mockExecuteCommand).toHaveBeenCalledWith('apicurioRegistry.mcp.configureClaude');
        });

        it('should execute setup wizard when selected', async () => {
            mockShowQuickPick.mockResolvedValue({ label: '$(book) Setup Wizard' } as any);
            mockExecuteCommand.mockResolvedValue(undefined);

            await showMCPQuickActionsCommand(mockServerManager);

            expect(mockExecuteCommand).toHaveBeenCalledWith('apicurioRegistry.mcp.setup');
        });

        it('should open settings when MCP Settings selected', async () => {
            mockShowQuickPick.mockResolvedValue({ label: '$(gear) MCP Settings' } as any);
            mockExecuteCommand.mockResolvedValue(undefined);

            await showMCPQuickActionsCommand(mockServerManager);

            expect(mockExecuteCommand).toHaveBeenCalledWith(
                'workbench.action.openSettings',
                'apicurioRegistry.mcp'
            );
        });

        it('should show About MCP dialog when selected', async () => {
            mockShowQuickPick.mockResolvedValue({ label: '$(info) About MCP' } as any);
            mockShowInformationMessage.mockResolvedValue(undefined);

            await showMCPQuickActionsCommand(mockServerManager);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Model Context Protocol'),
                { modal: true }
            );
        });

        it('should do nothing when user cancels quick pick', async () => {
            mockShowQuickPick.mockResolvedValue(undefined);

            await showMCPQuickActionsCommand(mockServerManager);

            expect(mockExecuteCommand).not.toHaveBeenCalled();
            expect(mockShowInformationMessage).not.toHaveBeenCalled();
        });
    });

    describe('showMCPServerStatusCommand', () => {
        it('should show server status when healthy', async () => {
            const mockDate = new Date('2025-01-01T10:00:00');
            mockServerManager.getServerInfo.mockReturnValue({
                status: 'running',
                type: 'docker',
                port: 3000,
                registryUrl: 'http://localhost:8080',
                health: { healthy: true, lastCheck: mockDate }
            } as any);

            mockShowInformationMessage.mockResolvedValue(undefined);

            await showMCPServerStatusCommand(mockServerManager);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Running'),
                { modal: true }
            );
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('✓ Healthy'),
                { modal: true }
            );
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('docker'),
                { modal: true }
            );
        });

        it('should show server status when unhealthy', async () => {
            mockServerManager.getServerInfo.mockReturnValue({
                status: 'stopped',
                type: 'docker',
                port: 3000,
                registryUrl: 'http://localhost:8080',
                health: { healthy: false, lastCheck: new Date() }
            } as any);

            mockShowInformationMessage.mockResolvedValue(undefined);

            await showMCPServerStatusCommand(mockServerManager);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('✗ Unhealthy'),
                { modal: true }
            );
        });

        it('should handle missing health info', async () => {
            mockServerManager.getServerInfo.mockReturnValue({
                status: 'stopped',
                type: 'docker',
                port: 3000,
                registryUrl: 'http://localhost:8080',
                health: undefined
            } as any);

            mockShowInformationMessage.mockResolvedValue(undefined);

            await showMCPServerStatusCommand(mockServerManager);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Never'),
                { modal: true }
            );
        });
    });
});
