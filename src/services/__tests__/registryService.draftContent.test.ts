import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { RegistryService } from '../registryService';

describe('RegistryService - updateDraftContent', () => {
    let service: RegistryService;
    let mockClient: any;

    beforeEach(() => {
        mockClient = {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            defaults: {
                headers: {
                    common: {}
                }
            }
        };

        service = new RegistryService();
        // Set up connection
        service.setConnection({
            url: 'http://localhost:8080',
            name: 'test',
            authType: 'none'
        });
        (service as any).client = mockClient;
    });

    describe('updateDraftContent', () => {
        it('should update draft content successfully', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.updateDraftContent('my-group', 'my-artifact', '1.0.0-draft', '{ "updated": true }');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/my-group/artifacts/my-artifact/versions/1.0.0-draft/content',
                { content: '{ "updated": true }' }
            );
        });

        it('should URL encode special characters in groupId', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.updateDraftContent('my group', 'my-artifact', '1.0.0', 'content');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/my%20group/artifacts/my-artifact/versions/1.0.0/content',
                { content: 'content' }
            );
        });

        it('should URL encode special characters in artifactId', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.updateDraftContent('my-group', 'my artifact', '1.0.0', 'content');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/my-group/artifacts/my%20artifact/versions/1.0.0/content',
                { content: 'content' }
            );
        });

        it('should URL encode special characters in version', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.updateDraftContent('my-group', 'my-artifact', '1.0.0 RC1', 'content');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/my-group/artifacts/my-artifact/versions/1.0.0%20RC1/content',
                { content: 'content' }
            );
        });

        it('should URL encode slashes in groupId', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.updateDraftContent('my/group', 'my-artifact', '1.0.0', 'content');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/my%2Fgroup/artifacts/my-artifact/versions/1.0.0/content',
                { content: 'content' }
            );
        });

        it('should handle JSON content', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            const jsonContent = JSON.stringify({ openapi: '3.0.0', info: { title: 'My API' } });
            await service.updateDraftContent('g', 'a', 'v', jsonContent);

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/g/artifacts/a/versions/v/content',
                { content: jsonContent }
            );
        });

        it('should handle YAML content', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            const yamlContent = 'openapi: 3.0.0\ninfo:\n  title: My API';
            await service.updateDraftContent('g', 'a', 'v', yamlContent);

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/g/artifacts/a/versions/v/content',
                { content: yamlContent }
            );
        });

        it('should throw error for 404 (version not found)', async () => {
            mockClient.put.mockRejectedValue({
                response: { status: 404 }
            });

            await expect(
                service.updateDraftContent('g', 'a', 'v', 'content')
            ).rejects.toThrow('Version not found: g/a:v');
        });

        it('should throw error for 400 (published version)', async () => {
            mockClient.put.mockRejectedValue({
                response: { status: 400 }
            });

            await expect(
                service.updateDraftContent('g', 'a', 'v', 'content')
            ).rejects.toThrow('Cannot update published version content');
        });

        it('should throw error for 405 (method not allowed)', async () => {
            mockClient.put.mockRejectedValue({
                response: { status: 405 }
            });

            await expect(
                service.updateDraftContent('g', 'a', 'v', 'content')
            ).rejects.toThrow('Cannot update published version content');
        });

        it('should throw error for 409 (conflict)', async () => {
            mockClient.put.mockRejectedValue({
                response: { status: 409 }
            });

            await expect(
                service.updateDraftContent('g', 'a', 'v', 'content')
            ).rejects.toThrow('Content conflict');
        });

        it('should throw error for 401 (unauthorized)', async () => {
            mockClient.put.mockRejectedValue({
                response: { status: 401 }
            });

            await expect(
                service.updateDraftContent('g', 'a', 'v', 'content')
            ).rejects.toThrow();
        });

        it('should throw error if not connected', async () => {
            service.disconnect();

            await expect(
                service.updateDraftContent('g', 'a', 'v', 'content')
            ).rejects.toThrow('Not connected to registry');
        });

        it('should handle network errors gracefully', async () => {
            mockClient.put.mockRejectedValue(new Error('Network error'));

            await expect(
                service.updateDraftContent('g', 'a', 'v', 'content')
            ).rejects.toThrow('Network error');
        });

        it('should handle empty content', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            await service.updateDraftContent('g', 'a', 'v', '');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/g/artifacts/a/versions/v/content',
                { content: '' }
            );
        });

        it('should handle large content', async () => {
            mockClient.put.mockResolvedValue({ data: {} });

            const largeContent = 'x'.repeat(100000);
            await service.updateDraftContent('g', 'a', 'v', largeContent);

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/g/artifacts/a/versions/v/content',
                { content: largeContent }
            );
        });
    });
});
