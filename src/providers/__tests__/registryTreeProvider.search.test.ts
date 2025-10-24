import { RegistryTreeDataProvider } from '../registryTreeProvider';
import { RegistryService } from '../../services/registryService';
import { RegistryItemType } from '../../models/registryModels';

// Mock RegistryService
jest.mock('../../services/registryService');

describe('RegistryTreeDataProvider - Search/Filter Functionality', () => {
    let provider: RegistryTreeDataProvider;
    let mockService: jest.Mocked<RegistryService>;

    beforeEach(() => {
        mockService = new RegistryService() as jest.Mocked<RegistryService>;
        provider = new RegistryTreeDataProvider(mockService);

        // Mock service methods
        mockService.isConnected = jest.fn().mockReturnValue(true);
        mockService.searchArtifacts = jest.fn();
        mockService.searchGroups = jest.fn();
        mockService.getArtifacts = jest.fn();
        mockService.getVersions = jest.fn();
    });

    describe('applySearchFilter', () => {
        it('should store search filter', () => {
            provider.applySearchFilter('name', 'test');

            expect(provider.hasActiveFilter()).toBe(true);
            expect(provider.getFilterDescription()).toBe('Filtered by name: "test"');
        });

        it('should trigger tree refresh', () => {
            const refreshSpy = jest.spyOn(provider as any, 'refresh');

            provider.applySearchFilter('type', 'OPENAPI');

            expect(refreshSpy).toHaveBeenCalled();
        });
    });

    describe('clearSearchFilter', () => {
        it('should remove search filter', () => {
            provider.applySearchFilter('name', 'test');
            expect(provider.hasActiveFilter()).toBe(true);

            provider.clearSearchFilter();

            expect(provider.hasActiveFilter()).toBe(false);
            expect(provider.getFilterDescription()).toBeNull();
        });

        it('should trigger tree refresh', () => {
            const refreshSpy = jest.spyOn(provider as any, 'refresh');
            provider.applySearchFilter('name', 'test');

            provider.clearSearchFilter();

            expect(refreshSpy).toHaveBeenCalled();
        });
    });

    describe('hasActiveFilter', () => {
        it('should return false when no filter applied', () => {
            expect(provider.hasActiveFilter()).toBe(false);
        });

        it('should return true when filter applied', () => {
            provider.applySearchFilter('name', 'test');
            expect(provider.hasActiveFilter()).toBe(true);
        });

        it('should return false after clearing filter', () => {
            provider.applySearchFilter('name', 'test');
            provider.clearSearchFilter();
            expect(provider.hasActiveFilter()).toBe(false);
        });
    });

    describe('getFilterDescription', () => {
        it('should return null when no filter', () => {
            expect(provider.getFilterDescription()).toBeNull();
        });

        it('should return description for name filter', () => {
            provider.applySearchFilter('name', 'user');
            expect(provider.getFilterDescription()).toBe('Filtered by name: "user"');
        });

        it('should return description for type filter', () => {
            provider.applySearchFilter('type', 'OPENAPI');
            expect(provider.getFilterDescription()).toBe('Filtered by type: "OPENAPI"');
        });

        it('should return description for state filter', () => {
            provider.applySearchFilter('state', 'ENABLED');
            expect(provider.getFilterDescription()).toBe('Filtered by state: "ENABLED"');
        });
    });

    describe('getChildren with filter', () => {
        it('should return filtered artifacts when filter active', async () => {
            const mockArtifacts = [
                {
                    groupId: 'test-group',
                    artifactId: 'user-api',
                    artifactType: 'OPENAPI',
                    state: 'ENABLED',
                    description: 'User API'
                }
            ];

            mockService.searchArtifacts = jest.fn().mockResolvedValue(mockArtifacts);

            provider.applySearchFilter('name', 'user');
            const items = await provider.getChildren();

            expect(mockService.searchArtifacts).toHaveBeenCalledWith({
                name: 'user'
            });
            expect(items).toHaveLength(1);
            expect(items[0].type).toBe(RegistryItemType.Artifact);
            expect(items[0].label).toBe('test-group/user-api');
        });

        it('should return groups when no filter active', async () => {
            const mockGroups = [
                {
                    groupId: 'group1',
                    artifactCount: 5
                },
                {
                    groupId: 'group2',
                    artifactCount: 3
                }
            ];

            mockService.searchGroups = jest.fn().mockResolvedValue(mockGroups);

            const items = await provider.getChildren();

            expect(mockService.searchGroups).toHaveBeenCalled();
            expect(mockService.searchArtifacts).not.toHaveBeenCalled();
            expect(items).toHaveLength(2);
            expect(items[0].type).toBe(RegistryItemType.Group);
        });

        it('should show no results message when filter returns empty', async () => {
            mockService.searchArtifacts = jest.fn().mockResolvedValue([]);

            provider.applySearchFilter('name', 'nonexistent');
            const items = await provider.getChildren();

            expect(items).toHaveLength(1);
            expect(items[0].label).toBe('No matching artifacts');
            expect(items[0].type).toBe(RegistryItemType.Connection);
        });

        it('should include group prefix in filtered artifact labels', async () => {
            const mockArtifacts = [
                {
                    groupId: 'com.example',
                    artifactId: 'api1',
                    artifactType: 'OPENAPI',
                    state: 'ENABLED'
                }
            ];

            mockService.searchArtifacts = jest.fn().mockResolvedValue(mockArtifacts);

            provider.applySearchFilter('type', 'OPENAPI');
            const items = await provider.getChildren();

            expect(items[0].label).toBe('com.example/api1');
        });

        it('should preserve artifact metadata in filtered results', async () => {
            const mockArtifacts = [
                {
                    groupId: 'test-group',
                    artifactId: 'api',
                    artifactType: 'OPENAPI',
                    state: 'ENABLED',
                    description: 'Test API',
                    modifiedOn: new Date()
                }
            ];

            mockService.searchArtifacts = jest.fn().mockResolvedValue(mockArtifacts);

            provider.applySearchFilter('name', 'api');
            const items = await provider.getChildren();

            expect(items[0].metadata).toMatchObject({
                artifactType: 'OPENAPI',
                state: 'ENABLED',
                description: 'Test API'
            });
        });

        it('should handle multiple filtered results', async () => {
            const mockArtifacts = [
                {
                    groupId: 'group1',
                    artifactId: 'api1',
                    artifactType: 'OPENAPI',
                    state: 'ENABLED'
                },
                {
                    groupId: 'group2',
                    artifactId: 'api2',
                    artifactType: 'OPENAPI',
                    state: 'ENABLED'
                }
            ];

            mockService.searchArtifacts = jest.fn().mockResolvedValue(mockArtifacts);

            provider.applySearchFilter('type', 'OPENAPI');
            const items = await provider.getChildren();

            expect(items).toHaveLength(2);
            expect(items[0].label).toBe('group1/api1');
            expect(items[1].label).toBe('group2/api2');
        });
    });

    describe('getChildren when not connected', () => {
        it('should show not connected message even with filter', async () => {
            mockService.isConnected = jest.fn().mockReturnValue(false);

            provider.applySearchFilter('name', 'test');
            const items = await provider.getChildren();

            expect(items).toHaveLength(1);
            expect(items[0].label).toBe('Not connected');
            expect(items[0].type).toBe(RegistryItemType.Connection);
        });
    });

    describe('connect and disconnect with filter', () => {
        it('should preserve filter when connecting', async () => {
            provider.applySearchFilter('name', 'test');

            await provider.connect({
                name: 'Test',
                url: 'http://localhost:8080',
                authType: 'none'
            });

            expect(provider.hasActiveFilter()).toBe(true);
        });

        it('should preserve filter when disconnecting', () => {
            provider.applySearchFilter('name', 'test');

            provider.disconnect();

            expect(provider.hasActiveFilter()).toBe(true);
        });
    });

    describe('refresh with filter', () => {
        it('should maintain filter on refresh', async () => {
            const mockArtifacts = [
                {
                    groupId: 'test',
                    artifactId: 'api',
                    artifactType: 'OPENAPI',
                    state: 'ENABLED'
                }
            ];

            mockService.searchArtifacts = jest.fn().mockResolvedValue(mockArtifacts);

            provider.applySearchFilter('name', 'api');
            await provider.getChildren();

            // Refresh
            provider.refresh();
            await provider.getChildren();

            // Should call search again
            expect(mockService.searchArtifacts).toHaveBeenCalledTimes(2);
            expect(provider.hasActiveFilter()).toBe(true);
        });
    });
});
