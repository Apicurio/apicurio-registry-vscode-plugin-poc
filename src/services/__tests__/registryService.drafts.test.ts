import { RegistryService } from '../registryService';
import { CreateVersion } from '../../models/registryModels';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RegistryService - Draft Operations', () => {
    let service: RegistryService;
    let mockClient: any;

    beforeEach(() => {
        service = new RegistryService();

        // Create mock axios instance
        mockClient = {
            post: jest.fn(),
            get: jest.fn(),
            put: jest.fn(),
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

    describe('createDraftVersion', () => {
        it('should create draft version with all fields', async () => {
            mockClient.post.mockResolvedValue({ data: {} });

            const versionData: CreateVersion = {
                version: '1.0.1-draft',
                content: {
                    content: '{"openapi": "3.0.0"}',
                    contentType: 'application/json'
                },
                description: 'Draft for review',
                isDraft: true
            };

            await service.createDraftVersion('my-group', 'my-artifact', versionData);

            expect(mockClient.post).toHaveBeenCalledWith(
                '/groups/my-group/artifacts/my-artifact/versions',
                expect.objectContaining({
                    version: '1.0.1-draft',
                    content: {
                        content: '{"openapi": "3.0.0"}',
                        contentType: 'application/json'
                    },
                    description: 'Draft for review',
                    isDraft: true
                })
            );
        });

        it('should force isDraft to true even if not specified', async () => {
            mockClient.post.mockResolvedValue({ data: {} });

            const versionData: CreateVersion = {
                content: {
                    content: 'content',
                    contentType: 'text/plain'
                },
                isDraft: false  // Should be overridden to true
            };

            await service.createDraftVersion('my-group', 'my-artifact', versionData);

            expect(mockClient.post).toHaveBeenCalledWith(
                '/groups/my-group/artifacts/my-artifact/versions',
                expect.objectContaining({
                    isDraft: true  // Forced to true
                })
            );
        });

        it('should force isDraft to true when undefined', async () => {
            mockClient.post.mockResolvedValue({ data: {} });

            const versionData: CreateVersion = {
                content: {
                    content: 'content',
                    contentType: 'text/plain'
                }
                // isDraft not specified
            };

            await service.createDraftVersion('my-group', 'my-artifact', versionData);

            expect(mockClient.post).toHaveBeenCalledWith(
                '/groups/my-group/artifacts/my-artifact/versions',
                expect.objectContaining({
                    isDraft: true
                })
            );
        });

        it('should URL encode group and artifact IDs', async () => {
            mockClient.post.mockResolvedValue({ data: {} });

            const versionData: CreateVersion = {
                content: { content: '', contentType: 'text/plain' }
            };

            await service.createDraftVersion('my group', 'my/artifact', versionData);

            expect(mockClient.post).toHaveBeenCalledWith(
                '/groups/my%20group/artifacts/my%2Fartifact/versions',
                expect.any(Object)
            );
        });

        it('should create draft with minimal data (only content)', async () => {
            mockClient.post.mockResolvedValue({ data: {} });

            const versionData: CreateVersion = {
                content: {
                    content: 'minimal content',
                    contentType: 'text/plain'
                }
            };

            await service.createDraftVersion('group', 'artifact', versionData);

            expect(mockClient.post).toHaveBeenCalledWith(
                '/groups/group/artifacts/artifact/versions',
                {
                    content: {
                        content: 'minimal content',
                        contentType: 'text/plain'
                    },
                    isDraft: true
                }
            );
        });

        it('should include optional fields when provided', async () => {
            mockClient.post.mockResolvedValue({ data: {} });

            const versionData: CreateVersion = {
                version: '2.0.0-draft',
                content: {
                    content: '{}',
                    contentType: 'application/json'
                },
                name: 'Draft Version',
                description: 'Work in progress',
                labels: { status: 'draft', author: 'dev' }
            };

            await service.createDraftVersion('group', 'artifact', versionData);

            expect(mockClient.post).toHaveBeenCalledWith(
                '/groups/group/artifacts/artifact/versions',
                expect.objectContaining({
                    version: '2.0.0-draft',
                    name: 'Draft Version',
                    description: 'Work in progress',
                    labels: { status: 'draft', author: 'dev' },
                    isDraft: true
                })
            );
        });

        it('should handle version conflict (409)', async () => {
            const error = {
                response: {
                    status: 409,
                    data: { message: 'Version 1.0.0 already exists' }
                }
            };
            mockClient.post.mockRejectedValue(error);

            const versionData: CreateVersion = {
                version: '1.0.0',
                content: { content: '', contentType: 'text/plain' }
            };

            await expect(
                service.createDraftVersion('group', 'artifact', versionData)
            ).rejects.toThrow('Version already exists');
        });

        it('should handle artifact not found (404)', async () => {
            const error = {
                response: {
                    status: 404,
                    data: { message: 'Artifact not found' }
                }
            };
            mockClient.post.mockRejectedValue(error);

            const versionData: CreateVersion = {
                content: { content: '', contentType: 'text/plain' }
            };

            await expect(
                service.createDraftVersion('group', 'nonexistent', versionData)
            ).rejects.toThrow('Artifact not found: group/nonexistent');
        });

        it('should handle invalid request (400)', async () => {
            const error = {
                response: {
                    status: 400,
                    data: { message: 'Invalid content type' }
                }
            };
            mockClient.post.mockRejectedValue(error);

            const versionData: CreateVersion = {
                content: { content: '', contentType: 'invalid/type' }
            };

            await expect(
                service.createDraftVersion('group', 'artifact', versionData)
            ).rejects.toThrow('Invalid request: Invalid content type');
        });

        it('should handle authentication required (401)', async () => {
            const error = {
                response: {
                    status: 401,
                    data: { message: 'Unauthorized' }
                }
            };
            mockClient.post.mockRejectedValue(error);

            const versionData: CreateVersion = {
                content: { content: '', contentType: 'text/plain' }
            };

            await expect(
                service.createDraftVersion('group', 'artifact', versionData)
            ).rejects.toThrow('Failed to create draft version');
        });

        it('should handle generic errors', async () => {
            mockClient.post.mockRejectedValue(new Error('Network error'));

            const versionData: CreateVersion = {
                content: { content: '', contentType: 'text/plain' }
            };

            await expect(
                service.createDraftVersion('group', 'artifact', versionData)
            ).rejects.toThrow('Failed to create draft version: Network error');
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            const versionData: CreateVersion = {
                content: { content: '', contentType: 'text/plain' }
            };

            await expect(
                disconnectedService.createDraftVersion('group', 'artifact', versionData)
            ).rejects.toThrow('Not connected to registry');
        });
    });

    describe('finalizeDraftVersion', () => {
        it('should finalize draft with ENABLED state', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.finalizeDraftVersion('my-group', 'my-artifact', '1.0.0-draft', 'ENABLED');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/my-group/artifacts/my-artifact/versions/1.0.0-draft/state',
                { state: 'ENABLED' }
            );
        });

        it('should finalize draft with DISABLED state', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.finalizeDraftVersion('group', 'artifact', '2.0.0', 'DISABLED');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/group/artifacts/artifact/versions/2.0.0/state',
                { state: 'DISABLED' }
            );
        });

        it('should finalize draft with DEPRECATED state', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.finalizeDraftVersion('group', 'artifact', '3.0.0', 'DEPRECATED');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/group/artifacts/artifact/versions/3.0.0/state',
                { state: 'DEPRECATED' }
            );
        });

        it('should default to ENABLED state', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.finalizeDraftVersion('group', 'artifact', '1.0.0');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/group/artifacts/artifact/versions/1.0.0/state',
                { state: 'ENABLED' }
            );
        });

        it('should URL encode group, artifact, and version', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.finalizeDraftVersion('my group', 'my/artifact', '1.0.0-draft+build');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/my%20group/artifacts/my%2Fartifact/versions/1.0.0-draft%2Bbuild/state',
                { state: 'ENABLED' }
            );
        });

        it('should handle version not found (404)', async () => {
            const error = {
                response: {
                    status: 404,
                    data: { message: 'Version not found' }
                }
            };
            mockClient.put.mockRejectedValue(error);

            await expect(
                service.finalizeDraftVersion('group', 'artifact', 'nonexistent')
            ).rejects.toThrow('Version not found: group/artifact:nonexistent');
        });

        it('should handle invalid state transition (400)', async () => {
            const error = {
                response: {
                    status: 400,
                    data: { message: 'Cannot transition from ENABLED to DRAFT' }
                }
            };
            mockClient.put.mockRejectedValue(error);

            await expect(
                service.finalizeDraftVersion('group', 'artifact', '1.0.0', 'ENABLED')
            ).rejects.toThrow('Invalid state transition');
        });

        it('should handle validation failure (409)', async () => {
            const error = {
                response: {
                    status: 409,
                    data: { message: 'Schema validation failed' }
                }
            };
            mockClient.put.mockRejectedValue(error);

            await expect(
                service.finalizeDraftVersion('group', 'artifact', '1.0.0')
            ).rejects.toThrow('Validation failed');
        });

        it('should handle generic errors', async () => {
            mockClient.put.mockRejectedValue(new Error('Network error'));

            await expect(
                service.finalizeDraftVersion('group', 'artifact', '1.0.0')
            ).rejects.toThrow('Failed to finalize draft: Network error');
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(
                disconnectedService.finalizeDraftVersion('group', 'artifact', '1.0.0')
            ).rejects.toThrow('Not connected to registry');
        });
    });

    describe('discardDraftVersion', () => {
        it('should discard draft version successfully', async () => {
            mockClient.delete.mockResolvedValue({ data: {} });

            await service.discardDraftVersion('my-group', 'my-artifact', '1.0.0-draft');

            expect(mockClient.delete).toHaveBeenCalledWith(
                '/groups/my-group/artifacts/my-artifact/versions/1.0.0-draft'
            );
        });

        it('should URL encode group, artifact, and version', async () => {
            mockClient.delete.mockResolvedValue({ data: {} });

            await service.discardDraftVersion('my group', 'my/artifact', '1.0.0-draft+build');

            expect(mockClient.delete).toHaveBeenCalledWith(
                '/groups/my%20group/artifacts/my%2Fartifact/versions/1.0.0-draft%2Bbuild'
            );
        });

        it('should handle version not found (404)', async () => {
            const error = {
                response: {
                    status: 404,
                    data: { message: 'Version not found' }
                }
            };
            mockClient.delete.mockRejectedValue(error);

            await expect(
                service.discardDraftVersion('group', 'artifact', 'nonexistent')
            ).rejects.toThrow('Version not found: group/artifact:nonexistent');
        });

        it('should handle deletion not allowed (405)', async () => {
            const error = {
                response: {
                    status: 405,
                    data: { message: 'Version deletion is disabled' }
                }
            };
            mockClient.delete.mockRejectedValue(error);

            await expect(
                service.discardDraftVersion('group', 'artifact', '1.0.0')
            ).rejects.toThrow('Version deletion not allowed');
        });

        it('should handle generic errors', async () => {
            mockClient.delete.mockRejectedValue(new Error('Network error'));

            await expect(
                service.discardDraftVersion('group', 'artifact', '1.0.0')
            ).rejects.toThrow('Failed to discard draft: Network error');
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(
                disconnectedService.discardDraftVersion('group', 'artifact', '1.0.0')
            ).rejects.toThrow('Not connected to registry');
        });
    });

    describe('updateDraftMetadata', () => {
        it('should update name only', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.updateDraftMetadata('group', 'artifact', '1.0.0', {
                name: 'New Name'
            });

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/group/artifacts/artifact/versions/1.0.0',
                { name: 'New Name' }
            );
        });

        it('should update description only', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.updateDraftMetadata('group', 'artifact', '1.0.0', {
                description: 'New Description'
            });

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/group/artifacts/artifact/versions/1.0.0',
                { description: 'New Description' }
            );
        });

        it('should update both name and description', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.updateDraftMetadata('group', 'artifact', '1.0.0', {
                name: 'Updated Name',
                description: 'Updated Description'
            });

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/group/artifacts/artifact/versions/1.0.0',
                {
                    name: 'Updated Name',
                    description: 'Updated Description'
                }
            );
        });

        it('should update labels', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.updateDraftMetadata('group', 'artifact', '1.0.0', {
                labels: { status: 'review', author: 'john' }
            });

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/group/artifacts/artifact/versions/1.0.0',
                { labels: { status: 'review', author: 'john' } }
            );
        });

        it('should update all fields', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.updateDraftMetadata('group', 'artifact', '1.0.0', {
                name: 'Complete Update',
                description: 'All fields updated',
                labels: { env: 'dev' }
            });

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/group/artifacts/artifact/versions/1.0.0',
                {
                    name: 'Complete Update',
                    description: 'All fields updated',
                    labels: { env: 'dev' }
                }
            );
        });

        it('should URL encode group, artifact, and version', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.updateDraftMetadata('my group', 'my/artifact', '1.0.0-draft+build', {
                name: 'Test'
            });

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/my%20group/artifacts/my%2Fartifact/versions/1.0.0-draft%2Bbuild',
                { name: 'Test' }
            );
        });

        it('should handle version not found (404)', async () => {
            const error = {
                response: {
                    status: 404,
                    data: { message: 'Version not found' }
                }
            };
            mockClient.put.mockRejectedValue(error);

            await expect(
                service.updateDraftMetadata('group', 'artifact', 'nonexistent', { name: 'Test' })
            ).rejects.toThrow('Version not found: group/artifact:nonexistent');
        });

        it('should handle invalid metadata (400)', async () => {
            const error = {
                response: {
                    status: 400,
                    data: { message: 'Invalid label format' }
                }
            };
            mockClient.put.mockRejectedValue(error);

            await expect(
                service.updateDraftMetadata('group', 'artifact', '1.0.0', { name: 'Test' })
            ).rejects.toThrow('Invalid metadata');
        });

        it('should handle generic errors', async () => {
            mockClient.put.mockRejectedValue(new Error('Network error'));

            await expect(
                service.updateDraftMetadata('group', 'artifact', '1.0.0', { name: 'Test' })
            ).rejects.toThrow('Failed to update metadata: Network error');
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(
                disconnectedService.updateDraftMetadata('group', 'artifact', '1.0.0', { name: 'Test' })
            ).rejects.toThrow('Not connected to registry');
        });
    });
});
