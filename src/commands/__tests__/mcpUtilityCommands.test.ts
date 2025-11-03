import * as vscode from 'vscode';
import { generateClaudeCommandCommand, verifyMCPCommand } from '../mcpUtilityCommands';
import { MCPConfigurationManager } from '../../services/mcpConfigurationManager';

// Mock vscode
jest.mock('vscode', () => ({
    window: {
        showInformationMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        createTerminal: jest.fn(() => ({
            show: jest.fn()
        }))
    },
    env: {
        clipboard: {
            writeText: jest.fn()
        }
    }
}));

describe('MCP Utility Commands', () => {
    let mockConfigManager: MCPConfigurationManager;

    beforeEach(() => {
        // Create mock configuration manager
        mockConfigManager = {
            generateClaudeMCPCommand: jest.fn(() => 'claude mcp add apicurio-registry -s local -- podman run -i...'),
            verifyMCPConfiguration: jest.fn()
        } as any;

        jest.clearAllMocks();
    });

    describe('generateClaudeCommandCommand', () => {
        it('should generate the Claude MCP command', async () => {
            await generateClaudeCommandCommand(mockConfigManager);

            expect(mockConfigManager.generateClaudeMCPCommand).toHaveBeenCalled();
        });

        it('should copy command to clipboard', async () => {
            await generateClaudeCommandCommand(mockConfigManager);

            expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith(
                expect.stringContaining('claude mcp add')
            );
        });

        it('should show information message with command', async () => {
            await generateClaudeCommandCommand(mockConfigManager);

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Claude MCP command'),
                expect.objectContaining({ modal: true }),
                expect.any(String),
                expect.any(String)
            );
        });

        it('should open terminal when user clicks Open Terminal', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Open Terminal');

            await generateClaudeCommandCommand(mockConfigManager);

            expect(vscode.window.createTerminal).toHaveBeenCalledWith('Claude MCP Setup');
        });

        it('should do nothing when user cancels', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);

            await generateClaudeCommandCommand(mockConfigManager);

            expect(vscode.window.createTerminal).not.toHaveBeenCalled();
        });
    });

    describe('verifyMCPCommand', () => {
        it('should call verifyMCPConfiguration', async () => {
            (mockConfigManager.verifyMCPConfiguration as jest.Mock).mockResolvedValue(true);

            await verifyMCPCommand(mockConfigManager);

            expect(mockConfigManager.verifyMCPConfiguration).toHaveBeenCalled();
        });

        it('should show success message when verification passes', async () => {
            (mockConfigManager.verifyMCPConfiguration as jest.Mock).mockResolvedValue(true);

            await verifyMCPCommand(mockConfigManager);

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('MCP Configuration Verified'),
                expect.objectContaining({ modal: true }),
                'OK'
            );
        });

        it('should show warning when verification fails', async () => {
            (mockConfigManager.verifyMCPConfiguration as jest.Mock).mockResolvedValue(false);

            await verifyMCPCommand(mockConfigManager);

            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('MCP Configuration Not Found'),
                expect.objectContaining({ modal: true }),
                'Run Setup Wizard'
            );
        });

        it('should show error when verification throws exception', async () => {
            (mockConfigManager.verifyMCPConfiguration as jest.Mock).mockRejectedValue(
                new Error('CLI error')
            );

            await verifyMCPCommand(mockConfigManager);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Error'),
                expect.objectContaining({ modal: true }),
                'OK'
            );
        });

        it('should offer to run setup wizard when verification fails', async () => {
            (mockConfigManager.verifyMCPConfiguration as jest.Mock).mockResolvedValue(false);

            await verifyMCPCommand(mockConfigManager);

            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('MCP Configuration Not Found'),
                expect.objectContaining({ modal: true }),
                'Run Setup Wizard'
            );
        });
    });
});
