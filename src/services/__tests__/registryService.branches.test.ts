import { RegistryService } from '../registryService';
import axios from 'axios';
import { BranchMetadata } from '../../models/registryModels';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RegistryService - Branch Operations', () => {
    let registryService: RegistryService;
    let mockClient: any;
    const mockConnection = {
        name: 'Test Registry',
        url: 'http://localhost:8080',
        authType: 'none' as const
    };

    beforeEach(() => {
        registryService = new RegistryService();

        // Create mock axios instance
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

        mockedAxios.create = jest.fn().mockReturnValue(mockClient);
        registryService.setConnection(mockConnection);
        jest.clearAllMocks();
    });

    describe('getBranches', () => {
        it('should get all branches for an artifact', async () => {
            const mockBranches: BranchMetadata[] = [
                {
                    groupId: 'test-group',
                    artifactId: 'test-artifact',
                    branchId: 'latest',
                    createdOn: '2025-11-07T10:00:00Z',
                    modifiedOn: '2025-11-07T10:00:00Z',
                    modifiedBy: '',
                    owner: '',
                    systemDefined: true
                },
                {
                    groupId: 'test-group',
                    artifactId: 'test-artifact',
                    branchId: 'v1.x',
                    createdOn: '2025-11-07T11:00:00Z',
                    modifiedOn: '2025-11-07T11:00:00Z',
                    modifiedBy: '',
                    owner: '',
                    description: 'Version 1.x branch',
                    systemDefined: false
                }
            ];

            mockClient.get.mockResolvedValue({
                data: {
                    branches: mockBranches,
                    count: 2
                }
            });

            const result = await registryService.getBranches('test-group', 'test-artifact');

            expect(mockClient.get).toHaveBeenCalledWith(
                '/groups/test-group/artifacts/test-artifact/branches'
            );
            expect(result).toEqual(mockBranches);
        });

        it('should return empty array when artifact has no branches', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    branches: [],
                    count: 0
                }
            });

            const result = await registryService.getBranches('test-group', 'test-artifact');

            expect(result).toEqual([]);
        });

        it('should handle 404 error when artifact not found', async () => {
            mockClient.get.mockRejectedValue({
                response: {
                    status: 404,
                    data: { message: 'Artifact not found' }
                }
            });

            await expect(
                registryService.getBranches('test-group', 'nonexistent-artifact')
            ).rejects.toThrow('Artifact not found');
        });
    });

    describe('getBranchMetadata', () => {
        it('should get metadata for a specific branch', async () => {
            const mockBranch: BranchMetadata = {
                groupId: 'test-group',
                artifactId: 'test-artifact',
                branchId: 'v1.x',
                createdOn: '2025-11-07T11:00:00Z',
                modifiedOn: '2025-11-07T11:00:00Z',
                modifiedBy: 'user1',
                owner: 'user1',
                description: 'Version 1.x branch',
                systemDefined: false
            };

            mockClient.get.mockResolvedValue({
                data: mockBranch
            });

            const result = await registryService.getBranchMetadata(
                'test-group',
                'test-artifact',
                'v1.x'
            );

            expect(mockClient.get).toHaveBeenCalledWith(
                '/groups/test-group/artifacts/test-artifact/branches/v1.x'
            );
            expect(result).toEqual(mockBranch);
        });

        it('should handle 404 error when branch not found', async () => {
            mockClient.get.mockRejectedValue({
                response: {
                    status: 404,
                    data: { message: 'Branch not found' }
                }
            });

            await expect(
                registryService.getBranchMetadata('test-group', 'test-artifact', 'nonexistent')
            ).rejects.toThrow('Branch not found');
        });
    });

    describe('createBranch', () => {
        it('should create branch with description', async () => {
            const expectedResponse: BranchMetadata = {
                groupId: 'test-group',
                artifactId: 'test-artifact',
                branchId: 'develop',
                createdOn: '2025-11-07T12:00:00Z',
                modifiedOn: '2025-11-07T12:00:00Z',
                modifiedBy: '',
                owner: '',
                description: 'Development branch',
                systemDefined: false
            };

            mockClient.post.mockResolvedValue({
                data: expectedResponse
            });

            const result = await registryService.createBranch(
                'test-group',
                'test-artifact',
                'develop',
                'Development branch'
            );

            expect(mockClient.post).toHaveBeenCalledWith(
                '/groups/test-group/artifacts/test-artifact/branches',
                {
                    branchId: 'develop',
                    description: 'Development branch'
                }
            );
            expect(result).toEqual(expectedResponse);
        });

        it('should create branch without description', async () => {
            const expectedResponse: BranchMetadata = {
                groupId: 'test-group',
                artifactId: 'test-artifact',
                branchId: 'release',
                createdOn: '2025-11-07T12:00:00Z',
                modifiedOn: '2025-11-07T12:00:00Z',
                modifiedBy: '',
                owner: '',
                systemDefined: false
            };

            mockClient.post.mockResolvedValue({
                data: expectedResponse
            });

            const result = await registryService.createBranch(
                'test-group',
                'test-artifact',
                'release'
            );

            expect(mockClient.post).toHaveBeenCalledWith(
                '/groups/test-group/artifacts/test-artifact/branches',
                {
                    branchId: 'release'
                }
            );
            expect(result).toEqual(expectedResponse);
        });

        it('should handle 409 Conflict error (branch already exists)', async () => {
            mockClient.post.mockRejectedValue({
                response: {
                    status: 409,
                    data: { message: 'Branch already exists' }
                }
            });

            await expect(
                registryService.createBranch('test-group', 'test-artifact', 'existing-branch')
            ).rejects.toThrow('Branch already exists');
        });

        it('should handle 400 Bad Request error (invalid branch ID)', async () => {
            mockClient.post.mockRejectedValue({
                response: {
                    status: 400,
                    data: { message: 'Invalid branch ID format' }
                }
            });

            await expect(
                registryService.createBranch('test-group', 'test-artifact', 'invalid branch!')
            ).rejects.toThrow('Invalid branch ID format');
        });
    });

    describe('updateBranchMetadata', () => {
        it('should update branch description', async () => {
            mockClient.put.mockResolvedValue({
                data: undefined
            });

            await registryService.updateBranchMetadata(
                'test-group',
                'test-artifact',
                'v1.x',
                { description: 'Updated description' }
            );

            expect(mockClient.put).toHaveBeenCalledWith(
                '/groups/test-group/artifacts/test-artifact/branches/v1.x',
                {
                    description: 'Updated description'
                }
            );
        });

        it('should handle 404 error when branch not found', async () => {
            mockClient.put.mockRejectedValue({
                response: {
                    status: 404,
                    data: { message: 'Branch not found' }
                }
            });

            await expect(
                registryService.updateBranchMetadata(
                    'test-group',
                    'test-artifact',
                    'nonexistent',
                    { description: 'Test' }
                )
            ).rejects.toThrow('Branch not found');
        });
    });

    describe('deleteBranch', () => {
        it('should delete a custom branch', async () => {
            mockClient.delete.mockResolvedValue({
                data: undefined
            });

            await registryService.deleteBranch('test-group', 'test-artifact', 'v1.x');

            expect(mockClient.delete).toHaveBeenCalledWith(
                '/groups/test-group/artifacts/test-artifact/branches/v1.x'
            );
        });

        it('should handle 405 error when trying to delete system branch', async () => {
            mockClient.delete.mockRejectedValue({
                response: {
                    status: 405,
                    data: { message: 'Cannot delete system-defined branch' }
                }
            });

            await expect(
                registryService.deleteBranch('test-group', 'test-artifact', 'latest')
            ).rejects.toThrow('Cannot delete system-defined branch');
        });

        it('should handle 404 error when branch not found', async () => {
            mockClient.delete.mockRejectedValue({
                response: {
                    status: 404,
                    data: { message: 'Branch not found' }
                }
            });

            await expect(
                registryService.deleteBranch('test-group', 'test-artifact', 'nonexistent')
            ).rejects.toThrow('Branch not found');
        });
    });

    describe('getBranchVersions', () => {
        it('should get versions in a branch', async () => {
            const mockVersions = [
                {
                    version: '1.0.0',
                    globalId: 1,
                    state: 'ENABLED',
                    groupId: 'test-group',
                    artifactId: 'test-artifact'
                },
                {
                    version: '1.0.1',
                    globalId: 2,
                    state: 'ENABLED',
                    groupId: 'test-group',
                    artifactId: 'test-artifact'
                }
            ];

            mockClient.get.mockResolvedValue({
                data: {
                    versions: mockVersions,
                    count: 2
                }
            });

            const result = await registryService.getBranchVersions(
                'test-group',
                'test-artifact',
                'v1.x'
            );

            expect(mockClient.get).toHaveBeenCalledWith(
                '/groups/test-group/artifacts/test-artifact/branches/v1.x/versions'
            );
            expect(result).toEqual(mockVersions);
        });

        it('should return empty array for empty branch', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    versions: [],
                    count: 0
                }
            });

            const result = await registryService.getBranchVersions(
                'test-group',
                'test-artifact',
                'empty-branch'
            );

            expect(result).toEqual([]);
        });
    });

    describe('addVersionToBranch', () => {
        it('should add version to branch', async () => {
            mockClient.post.mockResolvedValue({
                data: undefined
            });

            await registryService.addVersionToBranch(
                'test-group',
                'test-artifact',
                'v1.x',
                '1.0.0'
            );

            expect(mockClient.post).toHaveBeenCalledWith(
                '/groups/test-group/artifacts/test-artifact/branches/v1.x/versions',
                {
                    version: '1.0.0'
                }
            );
        });

        it('should handle 404 error when version not found', async () => {
            mockClient.post.mockRejectedValue({
                response: {
                    status: 404,
                    data: { message: 'Version not found' }
                }
            });

            await expect(
                registryService.addVersionToBranch(
                    'test-group',
                    'test-artifact',
                    'v1.x',
                    'nonexistent'
                )
            ).rejects.toThrow('Version not found');
        });

        it('should handle 409 error when version already in branch', async () => {
            mockClient.post.mockRejectedValue({
                response: {
                    status: 409,
                    data: { message: 'Version already in branch' }
                }
            });

            await expect(
                registryService.addVersionToBranch(
                    'test-group',
                    'test-artifact',
                    'v1.x',
                    '1.0.0'
                )
            ).rejects.toThrow('Version already in branch');
        });
    });
});
