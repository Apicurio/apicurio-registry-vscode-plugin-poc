import { MCPConfigurationManager } from '../mcpConfigurationManager';
import { MCPServerConfig } from '../../models/mcpServerConfig';
import * as vscode from 'vscode';

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
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn(),
            update: jest.fn()
        })),
        openTextDocument: jest.fn()
    },
    env: {
        clipboard: {
            writeText: jest.fn()
        }
    },
    extensions: {
        getExtension: jest.fn()
    },
    commands: {
        executeCommand: jest.fn()
    },
    ConfigurationTarget: {
        Global: 1
    }
}));

describe('MCPConfigurationManager', () => {
    let manager: MCPConfigurationManager;
    let mockConfig: MCPServerConfig;

    beforeEach(() => {
        mockConfig = {
            enabled: true,
            serverType: 'docker',
            dockerImage: 'quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot',
            jarPath: '',
            port: 3000,
            autoStart: true,
            registryUrl: 'http://localhost:8080',
            safeMode: false,
            pagingLimit: 200
        };

        manager = new MCPConfigurationManager(mockConfig);

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('generateClaudeMCPCommand', () => {
        it('should generate correct command for Docker mode', () => {
            const command = manager.generateClaudeMCPCommand();

            expect(command).toContain('claude mcp add apicurio-registry -s local');
            expect(command).toContain('podman run -i --rm');
            expect(command).toContain('REGISTRY_URL=http://host.containers.internal:8080');
            expect(command).not.toContain('/apis/registry/v3'); // MCP server adds this automatically
            expect(command).toContain('APICURIO_MCP_SAFE_MODE=false');
            expect(command).toContain('APICURIO_MCP_PAGING_LIMIT=200');
            expect(command).toContain('quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot');
        });

        it('should generate correct command for JAR mode', () => {
            mockConfig.serverType = 'jar';
            mockConfig.jarPath = '/path/to/mcp-server.jar';
            manager = new MCPConfigurationManager(mockConfig);

            const command = manager.generateClaudeMCPCommand();

            expect(command).toContain('claude mcp add apicurio-registry -s local');
            expect(command).toContain('java -jar /path/to/mcp-server.jar');
            expect(command).toContain('Dregistry.url=http://localhost:8080');
            expect(command).not.toContain('/apis/registry/v3'); // MCP server adds this automatically
            expect(command).toContain('Dapicurio.mcp.safe-mode=false');
            expect(command).toContain('Dapicurio.mcp.paging.limit=200');
        });

        it('should generate correct command for external mode', () => {
            mockConfig.serverType = 'external';
            mockConfig.port = 3000;
            manager = new MCPConfigurationManager(mockConfig);

            const command = manager.generateClaudeMCPCommand();

            expect(command).toContain('claude mcp add apicurio-registry -s local');
            expect(command).toContain('--transport http');
            expect(command).toContain('--url http://localhost:3000');
        });

        it('should convert localhost to host.containers.internal for Docker mode', () => {
            const command = manager.generateClaudeMCPCommand();

            expect(command).toContain('host.containers.internal');
            expect(command).not.toContain('localhost:8080');
        });

        it('should NOT convert localhost for JAR mode', () => {
            mockConfig.serverType = 'jar';
            mockConfig.jarPath = '/path/to/server.jar';
            manager = new MCPConfigurationManager(mockConfig);

            const command = manager.generateClaudeMCPCommand();

            expect(command).toContain('localhost:8080');
            expect(command).not.toContain('host.containers.internal');
        });

        it('should remove /apis/registry/v3 path if present (MCP server adds it)', () => {
            mockConfig.registryUrl = 'http://localhost:8080/apis/registry/v3';
            manager = new MCPConfigurationManager(mockConfig);

            const command = manager.generateClaudeMCPCommand();

            // Should NOT contain /apis/registry/v3 in REGISTRY_URL
            expect(command).toContain('REGISTRY_URL=http://host.containers.internal:8080');
            expect(command).not.toContain('/apis/registry/v3');
        });

        it('should handle base URL without /apis/registry/v3 path', () => {
            mockConfig.registryUrl = 'http://localhost:8080';
            manager = new MCPConfigurationManager(mockConfig);

            const command = manager.generateClaudeMCPCommand();

            expect(command).toContain('REGISTRY_URL=http://host.containers.internal:8080');
            expect(command).not.toContain('/apis/registry/v3');
        });

        it('should handle Registry URL with trailing slash', () => {
            mockConfig.registryUrl = 'http://localhost:8080/';
            manager = new MCPConfigurationManager(mockConfig);

            const command = manager.generateClaudeMCPCommand();

            expect(command).toContain('REGISTRY_URL=http://host.containers.internal:8080');
            expect(command).not.toContain('/apis/registry/v3');
        });

        it('should throw error for JAR mode without jarPath', () => {
            mockConfig.serverType = 'jar';
            mockConfig.jarPath = '';
            manager = new MCPConfigurationManager(mockConfig);

            expect(() => manager.generateClaudeMCPCommand()).toThrow('JAR path not configured');
        });

        it('should handle 127.0.0.1 conversion for Docker mode', () => {
            mockConfig.registryUrl = 'http://127.0.0.1:8080';
            manager = new MCPConfigurationManager(mockConfig);

            const command = manager.generateClaudeMCPCommand();

            expect(command).toContain('host.containers.internal');
            expect(command).not.toContain('127.0.0.1');
        });

        it('should handle HTTPS URLs', () => {
            mockConfig.registryUrl = 'https://localhost:8443';
            manager = new MCPConfigurationManager(mockConfig);

            const command = manager.generateClaudeMCPCommand();

            expect(command).toContain('REGISTRY_URL=https://host.containers.internal:8443');
            expect(command).not.toContain('/apis/registry/v3');
        });

        it('should respect safeMode setting', () => {
            mockConfig.safeMode = true;
            manager = new MCPConfigurationManager(mockConfig);

            const command = manager.generateClaudeMCPCommand();

            expect(command).toContain('APICURIO_MCP_SAFE_MODE=true');
        });

        it('should respect pagingLimit setting', () => {
            mockConfig.pagingLimit = 500;
            manager = new MCPConfigurationManager(mockConfig);

            const command = manager.generateClaudeMCPCommand();

            expect(command).toContain('APICURIO_MCP_PAGING_LIMIT=500');
        });

        it('should use custom Docker image if specified', () => {
            mockConfig.dockerImage = 'my-registry/custom-mcp:v1.0';
            manager = new MCPConfigurationManager(mockConfig);

            const command = manager.generateClaudeMCPCommand();

            expect(command).toContain('my-registry/custom-mcp:v1.0');
        });
    });

    describe('configureClaudeCode', () => {
        it('should copy command to clipboard', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);

            await manager.configureClaudeCode();

            expect(vscode.env.clipboard.writeText).toHaveBeenCalled();
            const copiedText = (vscode.env.clipboard.writeText as jest.Mock).mock.calls[0][0];
            expect(copiedText).toContain('claude mcp add apicurio-registry');
        });

        it('should show modal with command', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);

            await manager.configureClaudeCode();

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Claude Code MCP Configuration',
                expect.objectContaining({
                    modal: true,
                    detail: expect.stringContaining('claude mcp add')
                }),
                'Open Terminal',
                'Show Detailed Instructions',
                'Verify Connection'
            );
        });

        it('should open terminal when user clicks "Open Terminal"', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Open Terminal');
            const mockTerminal = { show: jest.fn() };
            (vscode.window.createTerminal as jest.Mock).mockReturnValue(mockTerminal);

            await manager.configureClaudeCode();

            expect(vscode.window.createTerminal).toHaveBeenCalledWith('Claude MCP Setup');
            expect(mockTerminal.show).toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            mockConfig.serverType = 'jar';
            mockConfig.jarPath = '';  // Will cause error
            manager = new MCPConfigurationManager(mockConfig);

            await manager.configureClaudeCode();

            expect(vscode.window.showErrorMessage).toHaveBeenCalled();
        });
    });

    describe('removeMCPServerConfig', () => {
        it('should copy remove command to clipboard', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);

            await manager.removeMCPServerConfig();

            expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith(
                'claude mcp remove "apicurio-registry" -s local'
            );
        });

        it('should show modal with remove command', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);

            await manager.removeMCPServerConfig();

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Remove Apicurio Registry MCP Configuration',
                expect.objectContaining({
                    modal: true,
                    detail: expect.stringContaining('claude mcp remove')
                }),
                'Open Terminal',
                'Cancel'
            );
        });

        it('should open terminal when user clicks "Open Terminal"', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Open Terminal');
            const mockTerminal = { show: jest.fn() };
            (vscode.window.createTerminal as jest.Mock).mockReturnValue(mockTerminal);

            await manager.removeMCPServerConfig();

            expect(vscode.window.createTerminal).toHaveBeenCalledWith('Claude MCP Remove');
            expect(mockTerminal.show).toHaveBeenCalled();
        });
    });

    describe('updateConfig', () => {
        it('should update configuration', () => {
            manager.updateConfig({ safeMode: true, pagingLimit: 100 });

            const command = manager.generateClaudeMCPCommand();

            expect(command).toContain('APICURIO_MCP_SAFE_MODE=true');
            expect(command).toContain('APICURIO_MCP_PAGING_LIMIT=100');
        });

        it('should merge with existing config', () => {
            const originalUrl = mockConfig.registryUrl;
            manager.updateConfig({ safeMode: true });

            const command = manager.generateClaudeMCPCommand();

            // Original URL should still be present
            expect(command).toContain(originalUrl.replace('localhost', 'host.containers.internal'));
            // New setting should be applied
            expect(command).toContain('APICURIO_MCP_SAFE_MODE=true');
        });
    });
});
