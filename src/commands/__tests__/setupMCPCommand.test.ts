import * as vscode from 'vscode';
import { setupMCPCommand } from '../setupMCPCommand';
import { MCPConfigurationManager } from '../../services/mcpConfigurationManager';
import * as child_process from 'child_process';

// Mock vscode
jest.mock('vscode', () => ({
    window: {
        showInformationMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        createTerminal: jest.fn(() => ({
            show: jest.fn()
        })),
        showQuickPick: jest.fn()
    },
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn()
        }))
    },
    env: {
        clipboard: {
            writeText: jest.fn()
        }
    }
}));

// Mock child_process
jest.mock('child_process');

describe('setupMCPCommand', () => {
    let mockConfigManager: MCPConfigurationManager;
    let mockContext: vscode.ExtensionContext;

    beforeEach(() => {
        // Create mock configuration manager
        mockConfigManager = {
            generateClaudeMCPCommand: jest.fn(() => 'claude mcp add apicurio-registry...'),
            verifyMCPConfiguration: jest.fn()
        } as any;

        // Create mock extension context
        mockContext = {} as any;

        jest.clearAllMocks();
    });

    describe('Welcome Screen', () => {
        it('should show welcome message on start', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Cancel');

            await setupMCPCommand(mockContext, mockConfigManager);

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Welcome to Apicurio Registry AI Features Setup',
                expect.objectContaining({ modal: true }),
                'Get Started',
                'Cancel'
            );
        });

        it('should exit if user clicks Cancel', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Cancel');

            await setupMCPCommand(mockContext, mockConfigManager);

            // Should only show welcome, no other dialogs
            expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(1);
        });

        it('should continue if user clicks Get Started', async () => {
            (vscode.window.showInformationMessage as jest.Mock)
                .mockResolvedValueOnce('Get Started')  // Welcome
                .mockResolvedValueOnce(undefined);      // Other steps

            // Mock Claude CLI check to pass
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') {
                        handler(0); // Success
                    }
                })
            });

            await setupMCPCommand(mockContext, mockConfigManager);

            // Should show welcome + other steps
            expect(vscode.window.showInformationMessage).toHaveBeenCalled();
        });
    });

    describe('Prerequisite Checks', () => {
        beforeEach(() => {
            // User clicks "Get Started"
            (vscode.window.showInformationMessage as jest.Mock)
                .mockResolvedValueOnce('Get Started');
        });

        it('should check if Claude CLI is installed', async () => {
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') {
                        handler(0); // Claude CLI found
                    }
                })
            });

            await setupMCPCommand(mockContext, mockConfigManager);

            expect(child_process.spawn).toHaveBeenCalledWith('claude', ['--version']);
        });

        it('should show error if Claude CLI not installed', async () => {
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'error') {
                        handler(new Error('Command not found'));
                    }
                })
            });

            await setupMCPCommand(mockContext, mockConfigManager);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Claude CLI'),
                expect.anything()
            );
        });

        it('should check if Docker/Podman is installed', async () => {
            // Mock Claude CLI check passes
            (child_process.spawn as jest.Mock).mockImplementation((cmd, args) => {
                if (cmd === 'claude') {
                    return {
                        stdout: { on: jest.fn() },
                        stderr: { on: jest.fn() },
                        on: jest.fn((event, handler) => {
                            if (event === 'close') handler(0);
                        })
                    };
                } else if (cmd === 'podman') {
                    return {
                        stdout: { on: jest.fn() },
                        stderr: { on: jest.fn() },
                        on: jest.fn((event, handler) => {
                            if (event === 'close') handler(0);
                        })
                    };
                }
            });

            await setupMCPCommand(mockContext, mockConfigManager);

            expect(child_process.spawn).toHaveBeenCalledWith('podman', ['version']);
        });

        it('should show error if Docker/Podman not installed', async () => {
            (child_process.spawn as jest.Mock).mockImplementation((cmd) => {
                if (cmd === 'claude') {
                    return {
                        stdout: { on: jest.fn() },
                        stderr: { on: jest.fn() },
                        on: jest.fn((event, handler) => {
                            if (event === 'close') handler(0);
                        })
                    };
                } else if (cmd === 'podman') {
                    return {
                        stdout: { on: jest.fn() },
                        stderr: { on: jest.fn() },
                        on: jest.fn((event, handler) => {
                            if (event === 'error') handler(new Error('Command not found'));
                        })
                    };
                }
            });

            await setupMCPCommand(mockContext, mockConfigManager);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Docker'),
                expect.anything()
            );
        });

        it('should check if Registry connection is configured', async () => {
            // Mock CLI checks pass
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') handler(0);
                })
            });

            (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
                get: jest.fn((key) => {
                    if (key === 'connections') {
                        return []; // No connections
                    }
                })
            });

            await setupMCPCommand(mockContext, mockConfigManager);

            expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('apicurioRegistry');
        });

        it('should show error if no Registry connections configured', async () => {
            // Mock CLI checks pass
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') handler(0);
                })
            });

            (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
                get: jest.fn(() => []) // No connections
            });

            await setupMCPCommand(mockContext, mockConfigManager);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Registry connection'),
                expect.anything()
            );
        });
    });

    describe('Scenario Detection', () => {
        beforeEach(() => {
            // Mock all prerequisites passing
            (vscode.window.showInformationMessage as jest.Mock)
                .mockResolvedValueOnce('Get Started');

            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') handler(0);
                })
            });

            (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
                get: jest.fn(() => [{ url: 'http://localhost:8080' }])
            });
        });

        it('should ask user about registry location', async () => {
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({
                label: 'Local (localhost)',
                scenario: 'local'
            });

            await setupMCPCommand(mockContext, mockConfigManager);

            expect(vscode.window.showQuickPick).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ label: expect.stringContaining('Local') }),
                    expect.objectContaining({ label: expect.stringContaining('Remote') })
                ]),
                expect.objectContaining({ placeHolder: expect.stringContaining('Registry') })
            );
        });

        it('should detect local scenario from connection URL', async () => {
            (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
                get: jest.fn(() => [{ url: 'http://localhost:8080' }])
            });

            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({
                label: 'Local (localhost)',
                scenario: 'local'
            });

            await setupMCPCommand(mockContext, mockConfigManager);

            // Should auto-select local scenario
            expect(vscode.window.showQuickPick).toHaveBeenCalled();
        });

        it('should show "coming soon" for remote scenario', async () => {
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({
                label: 'Remote',
                scenario: 'remote'
            });

            await setupMCPCommand(mockContext, mockConfigManager);

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Remote scenario'),
                expect.anything()
            );
        });
    });

    describe('Command Generation', () => {
        beforeEach(() => {
            // Mock all prerequisites passing + local scenario
            (vscode.window.showInformationMessage as jest.Mock)
                .mockResolvedValueOnce('Get Started')  // Welcome
                .mockResolvedValueOnce('Cancel');       // Command dialog - user cancels

            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') handler(0);
                })
            });

            (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
                get: jest.fn(() => [{ url: 'http://localhost:8080' }])
            });

            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({
                label: 'Local',
                scenario: 'local'
            });
        });

        it('should generate Claude MCP command', async () => {
            await setupMCPCommand(mockContext, mockConfigManager);

            expect(mockConfigManager.generateClaudeMCPCommand).toHaveBeenCalled();
        });

        it('should copy command to clipboard', async () => {
            await setupMCPCommand(mockContext, mockConfigManager);

            expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith(
                expect.stringContaining('claude mcp add')
            );
        });

        it('should show command in modal dialog', async () => {
            (vscode.window.showInformationMessage as jest.Mock)
                .mockResolvedValueOnce('Get Started')
                .mockResolvedValueOnce(undefined);

            await setupMCPCommand(mockContext, mockConfigManager);

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Run this command'),
                expect.objectContaining({ modal: true }),
                expect.anything()
            );
        });

        it('should offer to open terminal', async () => {
            (vscode.window.showInformationMessage as jest.Mock)
                .mockResolvedValueOnce('Get Started')
                .mockResolvedValueOnce('Open Terminal');

            await setupMCPCommand(mockContext, mockConfigManager);

            expect(vscode.window.createTerminal).toHaveBeenCalled();
        });
    });

    describe('Verification', () => {
        beforeEach(() => {
            // Mock full flow up to verification
            (vscode.window.showInformationMessage as jest.Mock)
                .mockResolvedValueOnce('Get Started')            // Welcome screen
                .mockResolvedValueOnce('I ran it, verify now');   // Command dialog

            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') handler(0);
                })
            });

            (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
                get: jest.fn(() => [{ url: 'http://localhost:8080' }])
            });

            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({
                label: 'Local',
                scenario: 'local'
            });
        });

        it('should verify MCP configuration after user runs command', async () => {
            (mockConfigManager.verifyMCPConfiguration as jest.Mock).mockResolvedValue(true);

            await setupMCPCommand(mockContext, mockConfigManager);

            expect(mockConfigManager.verifyMCPConfiguration).toHaveBeenCalled();
        });

        it('should show success message if verification passes', async () => {
            (mockConfigManager.verifyMCPConfiguration as jest.Mock).mockResolvedValue(true);

            await setupMCPCommand(mockContext, mockConfigManager);

            // Check that success message was shown (it's the 3rd call to showInformationMessage)
            const calls = (vscode.window.showInformationMessage as jest.Mock).mock.calls;
            const successCall = calls.find((call: any[]) =>
                call[0]?.includes('AI Features Setup Complete')
            );
            expect(successCall).toBeDefined();
        });

        it('should show error if verification fails', async () => {
            (mockConfigManager.verifyMCPConfiguration as jest.Mock).mockResolvedValue(false);

            await setupMCPCommand(mockContext, mockConfigManager);

            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('MCP Configuration Not Verified'),
                expect.anything(),
                expect.anything()
            );
        });
    });
});
