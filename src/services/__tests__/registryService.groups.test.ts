import { RegistryService } from '../registryService';
import axios from 'axios';
import { GroupMetaData } from '../../models/registryModels';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RegistryService - Group Operations', () => {
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

    describe('createGroup', () => {
        it('should create group with full metadata', async () => {
            const groupId = 'api-schemas';
            const metadata = {
                description: 'REST API schema definitions',
                labels: {
                    env: 'production',
                    team: 'platform'
                }
            };

            const expectedResponse: GroupMetaData = {
                groupId: 'api-schemas',
                description: 'REST API schema definitions',
                labels: {
                    env: 'production',
                    team: 'platform'
                },
                createdOn: Date.now(),
                modifiedOn: Date.now(),
                owner: 'test-user',
                artifactCount: 0
            };

            mockClient.post.mockResolvedValue({
                data: expectedResponse
            });

            const result = await registryService.createGroup(groupId, metadata);

            expect(mockClient.post).toHaveBeenCalledWith(
                '/admin/groups',
                {
                    groupId: 'api-schemas',
                    description: 'REST API schema definitions',
                    labels: {
                        env: 'production',
                        team: 'platform'
                    }
                }
            );
            expect(result).toEqual(expectedResponse);
        });

        it('should create group with minimal data (only groupId)', async () => {
            const groupId = 'minimal-group';

            const expectedResponse: GroupMetaData = {
                groupId: 'minimal-group',
                createdOn: Date.now(),
                modifiedOn: Date.now(),
                artifactCount: 0
            };

            mockClient.post.mockResolvedValue({
                data: expectedResponse
            });

            const result = await registryService.createGroup(groupId);

            expect(mockClient.post).toHaveBeenCalledWith(
                '/admin/groups',
                {
                    groupId: 'minimal-group'
                }
            );
            expect(result).toEqual(expectedResponse);
        });

        it('should handle 409 Conflict error (group already exists)', async () => {
            const groupId = 'existing-group';

            mockClient.post.mockRejectedValue({
                response: {
                    status: 409,
                    data: {
                        message: 'Group already exists',
                        error_code: 409
                    }
                }
            });

            await expect(registryService.createGroup(groupId)).rejects.toMatchObject({
                response: {
                    status: 409
                }
            });

            expect(mockClient.post).toHaveBeenCalledWith(
                '/admin/groups',
                {
                    groupId: 'existing-group'
                }
            );
        });
    });
});
