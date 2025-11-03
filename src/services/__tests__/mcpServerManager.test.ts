import { MCPServerManager } from '../mcpServerManager';
import { MCPServerConfig } from '../../models/mcpServerConfig';
import * as child_process from 'child_process';

// Mock child_process
jest.mock('child_process');

// Mock axios
jest.mock('axios');
import axios from 'axios';

describe('MCPServerManager', () => {
    let manager: MCPServerManager;
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
            pagingLimit: 200,
            managementMode: 'extension' // Default to extension mode
        };

        jest.clearAllMocks();
    });

    describe('managementMode configuration', () => {
        it('should default to extension mode when not specified', () => {
            const configWithoutMode = { ...mockConfig };
            delete (configWithoutMode as any).managementMode;

            manager = new MCPServerManager(configWithoutMode);
            const info = manager.getServerInfo();

            expect(info.managementMode).toBe('extension');
        });

        it('should accept extension mode configuration', () => {
            mockConfig.managementMode = 'extension';
            manager = new MCPServerManager(mockConfig);
            const info = manager.getServerInfo();

            expect(info.managementMode).toBe('extension');
        });

        it('should accept claude-code mode configuration', () => {
            mockConfig.managementMode = 'claude-code';
            manager = new MCPServerManager(mockConfig);
            const info = manager.getServerInfo();

            expect(info.managementMode).toBe('claude-code');
        });

        it('should allow changing management mode via updateConfig', () => {
            manager = new MCPServerManager(mockConfig);
            expect(manager.getServerInfo().managementMode).toBe('extension');

            manager.updateConfig({ managementMode: 'claude-code' });
            expect(manager.getServerInfo().managementMode).toBe('claude-code');
        });
    });

    describe('extension mode - existing behavior', () => {
        beforeEach(() => {
            mockConfig.managementMode = 'extension';
            manager = new MCPServerManager(mockConfig);
        });

        it('should start Docker server in extension mode', async () => {
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: {
                    on: jest.fn((event, handler) => {
                        if (event === 'data') {
                            handler(Buffer.from('container-id-123'));
                        }
                    })
                },
                stderr: {
                    on: jest.fn()
                },
                on: jest.fn((event, handler) => {
                    if (event === 'close') {
                        handler(0);
                    }
                })
            });

            // Mock axios health check
            (axios.get as jest.Mock).mockResolvedValue({ status: 200 });

            await manager.startServer();

            expect(child_process.spawn).toHaveBeenCalledWith('podman', expect.arrayContaining(['run', '-d']));
            expect(manager.getServerInfo().status).toBe('running');
        });

        it('should perform HTTP health checks in extension mode', async () => {
            (axios.get as jest.Mock).mockResolvedValue({ status: 200 });

            const healthy = await (manager as any).checkHealth();

            expect(axios.get).toHaveBeenCalledWith(
                `http://localhost:${mockConfig.port}/health`,
                expect.any(Object)
            );
            expect(healthy).toBe(true);
        });
    });

    describe('claude-code mode - new behavior', () => {
        beforeEach(() => {
            mockConfig.managementMode = 'claude-code';
            manager = new MCPServerManager(mockConfig);
        });

        it('should NOT start server process in claude-code mode', async () => {
            // Mock successful Claude CLI verification
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: {
                    on: jest.fn((event, handler) => {
                        if (event === 'data') {
                            handler(Buffer.from('apicurio-registry: ✓ Connected'));
                        }
                    })
                },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') {
                        handler(0);
                    }
                }),
                kill: jest.fn()
            });

            await manager.startServer();

            // Should verify via Claude CLI, but NOT spawn podman/java
            expect(child_process.spawn).not.toHaveBeenCalledWith('podman', expect.anything());
            expect(child_process.spawn).not.toHaveBeenCalledWith('java', expect.anything());

            // Should have verified via Claude CLI
            expect(child_process.spawn).toHaveBeenCalledWith('claude', ['mcp', 'list']);
        });

        it('should verify MCP configuration via Claude CLI on start', async () => {
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: {
                    on: jest.fn((event, handler) => {
                        if (event === 'data') {
                            handler(Buffer.from('apicurio-registry: ✓ Connected'));
                        }
                    })
                },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') {
                        handler(0);
                    }
                }),
                kill: jest.fn()
            });

            await manager.startServer();

            expect(child_process.spawn).toHaveBeenCalledWith('claude', ['mcp', 'list']);
            expect(manager.getServerInfo().status).toBe('running');
        });

        it('should throw error if Claude CLI not found', async () => {
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'error') {
                        handler(new Error('Command not found'));
                    }
                }),
                kill: jest.fn()
            });

            await expect(manager.startServer()).rejects.toThrow('Claude CLI not found');
        });

        it('should throw error if apicurio-registry not configured in Claude', async () => {
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: {
                    on: jest.fn((event, handler) => {
                        if (event === 'data') {
                            // Output doesn't contain apicurio-registry
                            handler(Buffer.from('other-server: ✓ Connected'));
                        }
                    })
                },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') {
                        handler(0);
                    }
                }),
                kill: jest.fn()
            });

            await expect(manager.startServer()).rejects.toThrow('not configured');
        });

        it('should use Claude CLI for health checks in claude-code mode', async () => {
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: {
                    on: jest.fn((event, handler) => {
                        if (event === 'data') {
                            handler(Buffer.from('apicurio-registry: ✓ Connected'));
                        }
                    })
                },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') {
                        handler(0);
                    }
                }),
                kill: jest.fn()
            });

            const healthy = await (manager as any).checkHealth();

            expect(child_process.spawn).toHaveBeenCalledWith('claude', ['mcp', 'list']);
            expect(healthy).toBe(true);

            // Should NOT use HTTP health check
            expect(axios.get).not.toHaveBeenCalled();
        });

        it('should report unhealthy if Claude shows server not connected', async () => {
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: {
                    on: jest.fn((event, handler) => {
                        if (event === 'data') {
                            handler(Buffer.from('apicurio-registry: ✗ Not connected'));
                        }
                    })
                },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') {
                        handler(0);
                    }
                }),
                kill: jest.fn()
            });

            const healthy = await (manager as any).checkHealth();

            expect(healthy).toBe(false);
            expect(manager.getServerInfo().health?.error).toContain('not connected');
        });

        it('should be no-op when stopping server in claude-code mode', async () => {
            // First start to set status
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: {
                    on: jest.fn((event, handler) => {
                        if (event === 'data') {
                            handler(Buffer.from('apicurio-registry: ✓ Connected'));
                        }
                    })
                },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') {
                        handler(0);
                    }
                }),
                kill: jest.fn()
            });

            await manager.startServer();
            expect(manager.getServerInfo().status).toBe('running');

            // Now stop
            (child_process.spawn as jest.Mock).mockClear();
            await manager.stopServer();

            // Should not try to kill any processes
            expect(child_process.spawn).not.toHaveBeenCalledWith('podman', ['stop', expect.anything()]);

            // Status should change to stopped
            expect(manager.getServerInfo().status).toBe('stopped');
        });

        it('should not start health monitoring in claude-code mode', async () => {
            (child_process.spawn as jest.Mock).mockReturnValue({
                stdout: {
                    on: jest.fn((event, handler) => {
                        if (event === 'data') {
                            handler(Buffer.from('apicurio-registry: ✓ Connected'));
                        }
                    })
                },
                stderr: { on: jest.fn() },
                on: jest.fn((event, handler) => {
                    if (event === 'close') {
                        handler(0);
                    }
                }),
                kill: jest.fn()
            });

            await manager.startServer();

            // Wait a bit to see if periodic checks happen
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Should only have called claude mcp list once (during startup)
            const claudeCalls = (child_process.spawn as jest.Mock).mock.calls.filter(
                call => call[0] === 'claude' && call[1][0] === 'mcp'
            );
            expect(claudeCalls.length).toBe(1);
        });
    });

    describe('getServerInfo', () => {
        it('should include managementMode in server info', () => {
            mockConfig.managementMode = 'claude-code';
            manager = new MCPServerManager(mockConfig);

            const info = manager.getServerInfo();

            expect(info).toHaveProperty('managementMode');
            expect(info.managementMode).toBe('claude-code');
        });

        it('should default managementMode to extension if not set', () => {
            delete (mockConfig as any).managementMode;
            manager = new MCPServerManager(mockConfig);

            const info = manager.getServerInfo();

            expect(info.managementMode).toBe('extension');
        });
    });
});
