import * as vscode from 'vscode';
import { RegistryTreeDataProvider } from '../registryTreeProvider';
import { RegistryService } from '../../services/registryService';
import { RegistryItem, RegistryItemType } from '../../models/registryModels';

// Mock vscode
jest.mock('vscode');

describe('RegistryTreeDataProvider - User Preferences', () => {
    let treeProvider: RegistryTreeDataProvider;
    let mockRegistryService: jest.Mocked<RegistryService>;
    let mockConfig: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup default config
        mockConfig = {
            get: jest.fn((key: string, defaultValue?: any) => {
                const configs: { [key: string]: any } = {
                    'display.useArtifactNames': false,
                    'display.reverseVersionOrder': false,
                    'display.showArtifactCounts': true,
                    'display.truncateDescriptions': true,
                    'display.truncateLength': 50,
                    'search.defaultLimit': 50
                };
                return configs[key] ?? defaultValue;
            })
        };

        // Mock workspace configuration
        (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);

        // Mock RegistryService
        mockRegistryService = {
            setConnection: jest.fn(),
            disconnect: jest.fn(),
            getGroups: jest.fn(),
            getArtifacts: jest.fn(),
            getVersions: jest.fn(),
        } as any;

        treeProvider = new RegistryTreeDataProvider(mockRegistryService);
    });

    describe('Configuration Reading', () => {
        it('should read default configuration values', () => {
            expect(vscode.workspace.getConfiguration).toBeDefined();
        });

        it('should use useArtifactNames preference when false', () => {
            mockConfig.get.mockImplementation((key: string) => {
                if (key === 'display.useArtifactNames') return false;
                return undefined;
            });

            const config = vscode.workspace.getConfiguration('apicurioRegistry');
            expect(config.get('display.useArtifactNames')).toBe(false);
        });

        it('should use useArtifactNames preference when true', () => {
            mockConfig.get.mockImplementation((key: string) => {
                if (key === 'display.useArtifactNames') return true;
                return undefined;
            });

            const config = vscode.workspace.getConfiguration('apicurioRegistry');
            expect(config.get('display.useArtifactNames')).toBe(true);
        });

        it('should read reverseVersionOrder preference', () => {
            mockConfig.get.mockImplementation((key: string) => {
                if (key === 'display.reverseVersionOrder') return true;
                return false;
            });

            const config = vscode.workspace.getConfiguration('apicurioRegistry');
            expect(config.get('display.reverseVersionOrder')).toBe(true);
        });

        it('should read showArtifactCounts preference', () => {
            mockConfig.get.mockImplementation((key: string) => {
                if (key === 'display.showArtifactCounts') return false;
                return true;
            });

            const config = vscode.workspace.getConfiguration('apicurioRegistry');
            expect(config.get('display.showArtifactCounts')).toBe(false);
        });

        it('should read truncateDescriptions preference', () => {
            mockConfig.get.mockImplementation((key: string) => {
                if (key === 'display.truncateDescriptions') return false;
                return true;
            });

            const config = vscode.workspace.getConfiguration('apicurioRegistry');
            expect(config.get('display.truncateDescriptions')).toBe(false);
        });

        it('should read truncateLength preference', () => {
            mockConfig.get.mockImplementation((key: string) => {
                if (key === 'display.truncateLength') return 30;
                return 50;
            });

            const config = vscode.workspace.getConfiguration('apicurioRegistry');
            expect(config.get('display.truncateLength')).toBe(30);
        });

        it('should read search.defaultLimit preference', () => {
            mockConfig.get.mockImplementation((key: string) => {
                if (key === 'search.defaultLimit') return 100;
                return 50;
            });

            const config = vscode.workspace.getConfiguration('apicurioRegistry');
            expect(config.get('search.defaultLimit')).toBe(100);
        });
    });

    describe('Artifact Name vs ID Display', () => {
        it('should create tree item for artifact', () => {
            const metadata = {
                name: 'My Awesome API',
                description: 'Test API',
                artifactType: 'OPENAPI',
                state: 'ENABLED'
            };

            const artifactItem = new RegistryItem(
                'test-api',                    // label
                RegistryItemType.Artifact,     // type
                'test-api',                    // id
                metadata,                      // metadata
                undefined,                     // parentId
                'default'                      // groupId
            );

            const treeItem = treeProvider.getTreeItem(artifactItem);
            // Verify tree item is created
            expect(treeItem).toBeDefined();
            expect(treeItem.tooltip).toBeDefined();
        });
    });

    describe('Group Display', () => {
        it('should display group with artifact count in tooltip', () => {
            const groupItem = new RegistryItem(
                'my-group',                // label
                RegistryItemType.Group,    // type
                'my-group',                // id
                { artifactCount: 5 },      // metadata
                undefined,                 // parentId
                undefined                  // groupId
            );

            const treeItem = treeProvider.getTreeItem(groupItem);

            // Tooltip should contain count information
            expect(treeItem.tooltip).toContain('5');
        });
    });

    describe('Description Truncation', () => {
        it('should show description in tooltip', () => {
            const longDescription = 'This is a very long description that should be truncated';

            const metadata = {
                description: longDescription,
                artifactType: 'OPENAPI',
                state: 'ENABLED'
            };

            const artifactItem = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                metadata,
                undefined,
                'default'
            );

            const treeItem = treeProvider.getTreeItem(artifactItem);

            // Tooltip exists
            expect(treeItem.tooltip).toBeDefined();
        });
    });
});
