import { RegistryService } from '../registryService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RegistryService - Delete Functionality', () => {
    let service: RegistryService;
    let mockClient: any;

    beforeEach(() => {
        service = new RegistryService();

        // Create mock axios instance
        mockClient = {
            delete: jest.fn(),
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

    describe('deleteGroup', () => {
        it('should delete group with proper URL encoding', async () => {
            mockClient.delete.mockResolvedValue({ data: {} });

            await service.deleteGroup('test-group');

            expect(mockClient.delete).toHaveBeenCalledWith('/groups/test-group');
        });

        it('should URL encode group ID with special characters', async () => {
            mockClient.delete.mockResolvedValue({ data: {} });

            await service.deleteGroup('my group/special');

            expect(mockClient.delete).toHaveBeenCalledWith('/groups/my%20group%2Fspecial');
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(disconnectedService.deleteGroup('test-group'))
                .rejects
                .toThrow('Not connected to registry');
        });

        it('should handle API errors gracefully', async () => {
            mockClient.delete.mockRejectedValue(new Error('404 Not Found'));

            await expect(service.deleteGroup('nonexistent'))
                .rejects
                .toThrow();
        });

        it('should handle registry errors with proper messages', async () => {
            const error = {
                response: {
                    status: 403,
                    data: {
                        message: 'Delete not allowed - feature is disabled'
                    }
                }
            };
            mockClient.delete.mockRejectedValue(error);

            await expect(service.deleteGroup('test-group'))
                .rejects
                .toBeDefined();
        });
    });

    describe('deleteArtifact', () => {
        it('should delete artifact with proper URL encoding', async () => {
            mockClient.delete.mockResolvedValue({ data: {} });

            await service.deleteArtifact('test-group', 'test-artifact');

            expect(mockClient.delete).toHaveBeenCalledWith('/groups/test-group/artifacts/test-artifact');
        });

        it('should URL encode both group and artifact IDs', async () => {
            mockClient.delete.mockResolvedValue({ data: {} });

            await service.deleteArtifact('my group', 'my/artifact');

            expect(mockClient.delete).toHaveBeenCalledWith('/groups/my%20group/artifacts/my%2Fartifact');
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(disconnectedService.deleteArtifact('group', 'artifact'))
                .rejects
                .toThrow('Not connected to registry');
        });

        it('should handle 404 errors for nonexistent artifacts', async () => {
            const error = {
                response: {
                    status: 404,
                    data: { message: 'Artifact not found' }
                }
            };
            mockClient.delete.mockRejectedValue(error);

            await expect(service.deleteArtifact('group', 'nonexistent'))
                .rejects
                .toBeDefined();
        });

        it('should handle delete disabled errors', async () => {
            const error = {
                response: {
                    status: 405,
                    data: { message: 'Delete operation not allowed' }
                }
            };
            mockClient.delete.mockRejectedValue(error);

            await expect(service.deleteArtifact('group', 'artifact'))
                .rejects
                .toBeDefined();
        });
    });

    describe('deleteVersion', () => {
        it('should delete version with proper URL encoding', async () => {
            mockClient.delete.mockResolvedValue({ data: {} });

            await service.deleteVersion('test-group', 'test-artifact', '1.0.0');

            expect(mockClient.delete).toHaveBeenCalledWith('/groups/test-group/artifacts/test-artifact/versions/1.0.0');
        });

        it('should URL encode group, artifact, and version', async () => {
            mockClient.delete.mockResolvedValue({ data: {} });

            await service.deleteVersion('my group', 'my/artifact', 'v1.0.0-beta+001');

            expect(mockClient.delete).toHaveBeenCalledWith(
                '/groups/my%20group/artifacts/my%2Fartifact/versions/v1.0.0-beta%2B001'
            );
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(disconnectedService.deleteVersion('group', 'artifact', '1.0.0'))
                .rejects
                .toThrow('Not connected to registry');
        });

        it('should handle 404 errors for nonexistent versions', async () => {
            const error = {
                response: {
                    status: 404,
                    data: { message: 'Version not found' }
                }
            };
            mockClient.delete.mockRejectedValue(error);

            await expect(service.deleteVersion('group', 'artifact', 'nonexistent'))
                .rejects
                .toBeDefined();
        });

        it('should handle constraint violations (e.g., last version)', async () => {
            const error = {
                response: {
                    status: 409,
                    data: { message: 'Cannot delete the only remaining version' }
                }
            };
            mockClient.delete.mockRejectedValue(error);

            await expect(service.deleteVersion('group', 'artifact', '1.0.0'))
                .rejects
                .toBeDefined();
        });

        it('should handle permissions errors', async () => {
            const error = {
                response: {
                    status: 403,
                    data: { message: 'Insufficient permissions' }
                }
            };
            mockClient.delete.mockRejectedValue(error);

            await expect(service.deleteVersion('group', 'artifact', '1.0.0'))
                .rejects
                .toBeDefined();
        });
    });
});
