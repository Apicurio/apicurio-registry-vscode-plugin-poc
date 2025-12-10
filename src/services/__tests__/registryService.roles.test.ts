import axios, { AxiosInstance } from 'axios';
import { RegistryService } from '../registryService';
import { Role, RoleMapping } from '../../models/registryModels';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RegistryService - Role Management', () => {
    let service: RegistryService;
    let mockClient: jest.Mocked<AxiosInstance>;
    const mockConnection = {
        name: 'Test Registry',
        url: 'http://localhost:8080',
        authType: 'none' as const
    };

    beforeEach(() => {
        service = new RegistryService();

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
        } as any;

        mockedAxios.create = jest.fn().mockReturnValue(mockClient);
        service.setConnection(mockConnection);
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getRoleMappings', () => {
        it('should return empty array when no role mappings exist', async () => {
            mockClient.get.mockResolvedValue({ data: [] });

            const result = await service.getRoleMappings();

            expect(result).toEqual([]);
            expect(mockClient.get).toHaveBeenCalledWith('/admin/roleMappings');
        });

        it('should return all role mappings', async () => {
            const mockMappings: RoleMapping[] = [
                { principalId: 'user1@example.com', role: Role.ADMIN, principalName: 'User 1' },
                { principalId: 'user2@example.com', role: Role.DEVELOPER, principalName: 'User 2' },
                { principalId: 'service-account', role: Role.READ_ONLY }
            ];
            mockClient.get.mockResolvedValue({ data: mockMappings });

            const result = await service.getRoleMappings();

            expect(result).toEqual(mockMappings);
            expect(result).toHaveLength(3);
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(disconnectedService.getRoleMappings()).rejects.toThrow('Not connected to registry');
        });

        it('should handle API errors', async () => {
            mockClient.get.mockRejectedValue(new Error('Forbidden'));

            await expect(service.getRoleMappings()).rejects.toThrow('Forbidden');
        });
    });

    describe('getCurrentUserRole', () => {
        it('should return current user role mapping', async () => {
            const mockMapping: RoleMapping = {
                principalId: 'admin@example.com',
                role: Role.ADMIN,
                principalName: 'Admin User'
            };
            mockClient.get.mockResolvedValue({ data: mockMapping });

            const result = await service.getCurrentUserRole();

            expect(result).toEqual(mockMapping);
            expect(mockClient.get).toHaveBeenCalledWith('/admin/roleMappings/me');
        });

        it('should return null when user has no role', async () => {
            mockClient.get.mockRejectedValue({ response: { status: 404 } });

            const result = await service.getCurrentUserRole();

            expect(result).toBeNull();
        });

        it('should handle API errors other than 404', async () => {
            const error = new Error('Internal Server Error');
            (error as any).response = { status: 500 };
            mockClient.get.mockRejectedValue(error);

            await expect(service.getCurrentUserRole()).rejects.toThrow('Internal Server Error');
        });
    });

    describe('createRoleMapping', () => {
        it('should create role mapping with all fields', async () => {
            const mockMapping: RoleMapping = {
                principalId: 'newuser@example.com',
                role: Role.DEVELOPER,
                principalName: 'New User'
            };
            mockClient.post.mockResolvedValue({ data: mockMapping });

            const result = await service.createRoleMapping(
                'newuser@example.com',
                Role.DEVELOPER,
                'New User'
            );

            expect(result).toEqual(mockMapping);
            expect(mockClient.post).toHaveBeenCalledWith('/admin/roleMappings', {
                principalId: 'newuser@example.com',
                role: Role.DEVELOPER,
                principalName: 'New User'
            });
        });

        it('should create role mapping without principal name', async () => {
            const mockMapping: RoleMapping = {
                principalId: 'service-account',
                role: Role.READ_ONLY
            };
            mockClient.post.mockResolvedValue({ data: mockMapping });

            const result = await service.createRoleMapping(
                'service-account',
                Role.READ_ONLY
            );

            expect(result).toEqual(mockMapping);
            expect(mockClient.post).toHaveBeenCalledWith('/admin/roleMappings', {
                principalId: 'service-account',
                role: Role.READ_ONLY,
                principalName: undefined
            });
        });

        it('should handle 409 conflict when role mapping already exists', async () => {
            const error = new Error('Role mapping already exists');
            (error as any).response = { status: 409, data: { message: 'Role mapping already exists' } };
            mockClient.post.mockRejectedValue(error);

            await expect(
                service.createRoleMapping('user@example.com', Role.ADMIN)
            ).rejects.toThrow('Role mapping already exists');
        });

        it('should handle 403 forbidden when user lacks permission', async () => {
            const error = new Error('Forbidden');
            (error as any).response = { status: 403, data: { message: 'Forbidden' } };
            mockClient.post.mockRejectedValue(error);

            await expect(
                service.createRoleMapping('user@example.com', Role.ADMIN)
            ).rejects.toThrow('Forbidden');
        });
    });

    describe('updateRoleMapping', () => {
        it('should update role mapping', async () => {
            const mockMapping: RoleMapping = {
                principalId: 'user@example.com',
                role: Role.ADMIN
            };
            mockClient.put.mockResolvedValue({ data: mockMapping });

            const result = await service.updateRoleMapping('user@example.com', Role.ADMIN);

            expect(result).toEqual(mockMapping);
            expect(mockClient.put).toHaveBeenCalledWith(
                '/admin/roleMappings/user%40example.com',
                { role: Role.ADMIN }
            );
        });

        it('should handle 404 when role mapping not found', async () => {
            const error = new Error('Not found');
            (error as any).response = { status: 404, data: { message: 'Not found' } };
            mockClient.put.mockRejectedValue(error);

            await expect(
                service.updateRoleMapping('nonexistent@example.com', Role.DEVELOPER)
            ).rejects.toThrow('Not found');
        });

        it('should URL encode principal ID with special characters', async () => {
            const principalId = 'user+test@example.com';
            const encodedId = encodeURIComponent(principalId);
            const mockMapping: RoleMapping = {
                principalId,
                role: Role.DEVELOPER
            };
            mockClient.put.mockResolvedValue({ data: mockMapping });

            await service.updateRoleMapping(principalId, Role.DEVELOPER);

            expect(mockClient.put).toHaveBeenCalledWith(
                `/admin/roleMappings/${encodedId}`,
                { role: Role.DEVELOPER }
            );
        });
    });

    describe('deleteRoleMapping', () => {
        it('should delete role mapping', async () => {
            mockClient.delete.mockResolvedValue({ status: 204 });

            await service.deleteRoleMapping('user@example.com');

            expect(mockClient.delete).toHaveBeenCalledWith('/admin/roleMappings/user%40example.com');
        });

        it('should handle 404 when role mapping not found', async () => {
            const error = new Error('Not found');
            (error as any).response = { status: 404, data: { message: 'Not found' } };
            mockClient.delete.mockRejectedValue(error);

            await expect(
                service.deleteRoleMapping('nonexistent@example.com')
            ).rejects.toThrow('Not found');
        });

        it('should handle 403 forbidden when user lacks permission', async () => {
            const error = new Error('Forbidden');
            (error as any).response = { status: 403, data: { message: 'Forbidden' } };
            mockClient.delete.mockRejectedValue(error);

            await expect(
                service.deleteRoleMapping('user@example.com')
            ).rejects.toThrow('Forbidden');
        });

        it('should URL encode principal ID with special characters', async () => {
            const principalId = 'user+test@example.com';
            const encodedId = encodeURIComponent(principalId);
            mockClient.delete.mockResolvedValue({ status: 204 });

            await service.deleteRoleMapping(principalId);

            expect(mockClient.delete).toHaveBeenCalledWith(`/admin/roleMappings/${encodedId}`);
        });
    });
});
