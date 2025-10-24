import { RegistryService } from '../registryService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RegistryService - Search Functionality', () => {
    let service: RegistryService;
    let mockClient: any;

    beforeEach(() => {
        service = new RegistryService();

        // Create mock axios instance
        mockClient = {
            get: jest.fn(),
            defaults: {
                headers: {
                    common: {}
                }
            }
        };

        mockedAxios.create = jest.fn().mockReturnValue(mockClient);

        // Set up connection
        service.setConnection({
            name: 'Test Registry',
            url: 'http://localhost:8080',
            authType: 'none'
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('searchArtifacts', () => {
        it('should search artifacts with name parameter', async () => {
            const mockResponse = {
                data: {
                    artifacts: [
                        {
                            groupId: 'test-group',
                            artifactId: 'user-api',
                            artifactType: 'OPENAPI',
                            state: 'ENABLED',
                            description: 'User management API'
                        }
                    ]
                }
            };

            mockClient.get.mockResolvedValue(mockResponse);

            const results = await service.searchArtifacts({ name: 'user' });

            expect(mockClient.get).toHaveBeenCalledWith('/search/artifacts', {
                params: {
                    limit: 100,
                    offset: 0,
                    name: 'user'
                }
            });
            expect(results).toHaveLength(1);
            expect(results[0].artifactId).toBe('user-api');
        });

        it('should search artifacts by type', async () => {
            const mockResponse = {
                data: {
                    artifacts: [
                        {
                            groupId: 'test-group',
                            artifactId: 'spec1',
                            artifactType: 'OPENAPI',
                            state: 'ENABLED'
                        },
                        {
                            groupId: 'test-group',
                            artifactId: 'spec2',
                            artifactType: 'OPENAPI',
                            state: 'ENABLED'
                        }
                    ]
                }
            };

            mockClient.get.mockResolvedValue(mockResponse);

            const results = await service.searchArtifacts({ type: 'OPENAPI' });

            expect(mockClient.get).toHaveBeenCalledWith('/search/artifacts', {
                params: {
                    limit: 100,
                    offset: 0,
                    type: 'OPENAPI'
                }
            });
            expect(results).toHaveLength(2);
        });

        it('should search artifacts by state', async () => {
            const mockResponse = {
                data: {
                    artifacts: [
                        {
                            groupId: 'test-group',
                            artifactId: 'enabled-api',
                            artifactType: 'OPENAPI',
                            state: 'ENABLED'
                        }
                    ]
                }
            };

            mockClient.get.mockResolvedValue(mockResponse);

            const results = await service.searchArtifacts({ state: 'ENABLED' });

            expect(results).toHaveLength(1);
            expect(results[0].state).toBe('ENABLED');
        });

        it('should search artifacts by group', async () => {
            const mockResponse = {
                data: {
                    artifacts: [
                        {
                            groupId: 'com.example',
                            artifactId: 'api1',
                            artifactType: 'OPENAPI',
                            state: 'ENABLED'
                        }
                    ]
                }
            };

            mockClient.get.mockResolvedValue(mockResponse);

            const results = await service.searchArtifacts({ group: 'com.example' });

            expect(results).toHaveLength(1);
            expect(results[0].groupId).toBe('com.example');
        });

        it('should search artifacts by description', async () => {
            const mockResponse = {
                data: {
                    artifacts: [
                        {
                            groupId: 'test-group',
                            artifactId: 'user-api',
                            artifactType: 'OPENAPI',
                            state: 'ENABLED',
                            description: 'User management system'
                        }
                    ]
                }
            };

            mockClient.get.mockResolvedValue(mockResponse);

            const results = await service.searchArtifacts({ description: 'user' });

            expect(results).toHaveLength(1);
            expect(results[0].description).toContain('User');
        });

        it('should search artifacts by labels', async () => {
            const mockResponse = {
                data: {
                    artifacts: [
                        {
                            groupId: 'test-group',
                            artifactId: 'prod-api',
                            artifactType: 'OPENAPI',
                            state: 'ENABLED',
                            labels: {
                                environment: 'production'
                            }
                        }
                    ]
                }
            };

            mockClient.get.mockResolvedValue(mockResponse);

            const results = await service.searchArtifacts({ labels: 'environment=production' });

            expect(mockClient.get).toHaveBeenCalledWith('/search/artifacts', {
                params: {
                    limit: 100,
                    offset: 0,
                    labels: 'environment=production'
                }
            });
            expect(results).toHaveLength(1);
        });

        it('should return empty array when no artifacts found', async () => {
            const mockResponse = {
                data: {
                    artifacts: []
                }
            };

            mockClient.get.mockResolvedValue(mockResponse);

            const results = await service.searchArtifacts({ name: 'nonexistent' });

            expect(results).toHaveLength(0);
        });

        it('should handle API errors gracefully', async () => {
            mockClient.get.mockRejectedValue(new Error('Network error'));

            await expect(service.searchArtifacts({ name: 'test' }))
                .rejects
                .toThrow('Failed to search artifacts');
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(disconnectedService.searchArtifacts({ name: 'test' }))
                .rejects
                .toThrow('Not connected to registry');
        });

        it('should filter out empty search parameters', async () => {
            const mockResponse = {
                data: {
                    artifacts: []
                }
            };

            mockClient.get.mockResolvedValue(mockResponse);

            await service.searchArtifacts({ name: 'test', type: '', description: '' });

            expect(mockClient.get).toHaveBeenCalledWith('/search/artifacts', {
                params: {
                    limit: 100,
                    offset: 0,
                    name: 'test'
                    // type and description should be filtered out
                }
            });
        });

        it('should handle multiple search parameters', async () => {
            const mockResponse = {
                data: {
                    artifacts: [
                        {
                            groupId: 'test-group',
                            artifactId: 'api',
                            artifactType: 'OPENAPI',
                            state: 'ENABLED',
                            name: 'Test API'
                        }
                    ]
                }
            };

            mockClient.get.mockResolvedValue(mockResponse);

            await service.searchArtifacts({
                name: 'Test',
                type: 'OPENAPI'
            });

            expect(mockClient.get).toHaveBeenCalledWith('/search/artifacts', {
                params: {
                    limit: 100,
                    offset: 0,
                    name: 'Test',
                    type: 'OPENAPI'
                }
            });
        });

        it('should use default limit and offset', async () => {
            const mockResponse = {
                data: { artifacts: [] }
            };

            mockClient.get.mockResolvedValue(mockResponse);

            await service.searchArtifacts({ name: 'test' });

            expect(mockClient.get).toHaveBeenCalledWith('/search/artifacts', {
                params: expect.objectContaining({
                    limit: 100,
                    offset: 0
                })
            });
        });
    });
});
