import axios, { AxiosInstance } from 'axios';
import { RegistryService } from '../registryService';
import { ConfigurationProperty, PropertyType } from '../../models/registryModels';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RegistryService - Configuration Settings', () => {
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

    describe('getConfigProperties', () => {
        it('should return empty array when no properties exist', async () => {
            mockClient.get.mockResolvedValue({ data: [] });

            const result = await service.getConfigProperties();

            expect(result).toEqual([]);
            expect(mockClient.get).toHaveBeenCalledWith('/admin/config/properties');
        });

        it('should return all configuration properties', async () => {
            const mockProperties: ConfigurationProperty[] = [
                {
                    name: 'apicurio.authn.basic-client-credentials.enabled',
                    value: 'true',
                    type: PropertyType.BOOLEAN,
                    label: 'Basic client credentials',
                    description: 'Enable basic authentication with client credentials'
                },
                {
                    name: 'apicurio.ui.features.readOnly',
                    value: 'false',
                    type: PropertyType.BOOLEAN,
                    label: 'UI read-only mode',
                    description: 'Enable read-only mode in UI'
                },
                {
                    name: 'apicurio.ccompat.max-subjects',
                    value: '1000',
                    type: PropertyType.INTEGER,
                    label: 'Max subjects',
                    description: 'Maximum number of subjects allowed'
                }
            ];
            mockClient.get.mockResolvedValue({ data: mockProperties });

            const result = await service.getConfigProperties();

            expect(result).toEqual(mockProperties);
            expect(result).toHaveLength(3);
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(disconnectedService.getConfigProperties()).rejects.toThrow('Not connected to registry');
        });

        it('should handle API errors', async () => {
            mockClient.get.mockRejectedValue(new Error('Forbidden'));

            await expect(service.getConfigProperties()).rejects.toThrow('Forbidden');
        });
    });

    describe('getConfigProperty', () => {
        it('should fetch single property', async () => {
            const mockProperty: ConfigurationProperty = {
                name: 'apicurio.authn.basic-client-credentials.enabled',
                value: 'true',
                type: PropertyType.BOOLEAN,
                label: 'Basic client credentials',
                description: 'Enable basic authentication with client credentials'
            };
            mockClient.get.mockResolvedValue({ data: mockProperty });

            const result = await service.getConfigProperty('apicurio.authn.basic-client-credentials.enabled');

            expect(result).toEqual(mockProperty);
            expect(mockClient.get).toHaveBeenCalledWith(
                '/admin/config/properties/apicurio.authn.basic-client-credentials.enabled'
            );
        });

        it('should handle URL encoding for property names', async () => {
            const mockProperty: ConfigurationProperty = {
                name: 'apicurio.ui.features.settings',
                value: '{"enabled": true}',
                type: PropertyType.STRING,
                label: 'Settings feature',
                description: 'Enable settings feature'
            };
            mockClient.get.mockResolvedValue({ data: mockProperty });

            const result = await service.getConfigProperty('apicurio.ui.features.settings');

            expect(result).toEqual(mockProperty);
            expect(mockClient.get).toHaveBeenCalledWith(
                '/admin/config/properties/apicurio.ui.features.settings'
            );
        });

        it('should handle 404 Not Found', async () => {
            mockClient.get.mockRejectedValue({ response: { status: 404 } });

            await expect(service.getConfigProperty('nonexistent.property'))
                .rejects.toMatchObject({ response: { status: 404 } });
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(disconnectedService.getConfigProperty('some.property'))
                .rejects.toThrow('Not connected to registry');
        });
    });

    describe('updateConfigProperty', () => {
        it('should update boolean property', async () => {
            mockClient.put.mockResolvedValue({ status: 204 });

            await service.updateConfigProperty('apicurio.authn.basic-client-credentials.enabled', 'true');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/admin/config/properties/apicurio.authn.basic-client-credentials.enabled',
                { value: 'true' }
            );
        });

        it('should update integer property', async () => {
            mockClient.put.mockResolvedValue({ status: 204 });

            await service.updateConfigProperty('apicurio.ccompat.max-subjects', '2000');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/admin/config/properties/apicurio.ccompat.max-subjects',
                { value: '2000' }
            );
        });

        it('should update string property', async () => {
            mockClient.put.mockResolvedValue({ status: 204 });

            await service.updateConfigProperty('apicurio.ui.context-path', '/registry');

            expect(mockClient.put).toHaveBeenCalledWith(
                '/admin/config/properties/apicurio.ui.context-path',
                { value: '/registry' }
            );
        });

        it('should handle 400 Bad Request (invalid value)', async () => {
            mockClient.put.mockRejectedValue({
                response: {
                    status: 400,
                    data: { message: 'Invalid value for boolean property' }
                }
            });

            await expect(service.updateConfigProperty('apicurio.authn.enabled', 'invalid'))
                .rejects.toMatchObject({
                    response: {
                        status: 400,
                        data: { message: 'Invalid value for boolean property' }
                    }
                });
        });

        it('should handle 403 Forbidden', async () => {
            mockClient.put.mockRejectedValue({ response: { status: 403 } });

            await expect(service.updateConfigProperty('some.property', 'value'))
                .rejects.toMatchObject({ response: { status: 403 } });
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(disconnectedService.updateConfigProperty('some.property', 'value'))
                .rejects.toThrow('Not connected to registry');
        });
    });

    describe('deleteConfigProperty', () => {
        it('should delete property (reset to default)', async () => {
            mockClient.delete.mockResolvedValue({ status: 204 });

            await service.deleteConfigProperty('apicurio.authn.basic-client-credentials.enabled');

            expect(mockClient.delete).toHaveBeenCalledWith(
                '/admin/config/properties/apicurio.authn.basic-client-credentials.enabled'
            );
        });

        it('should handle URL encoding for property names', async () => {
            mockClient.delete.mockResolvedValue({ status: 204 });

            await service.deleteConfigProperty('apicurio.ui.features.settings');

            expect(mockClient.delete).toHaveBeenCalledWith(
                '/admin/config/properties/apicurio.ui.features.settings'
            );
        });

        it('should handle 404 Not Found', async () => {
            mockClient.delete.mockRejectedValue({ response: { status: 404 } });

            await expect(service.deleteConfigProperty('nonexistent.property'))
                .rejects.toMatchObject({ response: { status: 404 } });
        });

        it('should handle 403 Forbidden', async () => {
            mockClient.delete.mockRejectedValue({ response: { status: 403 } });

            await expect(service.deleteConfigProperty('some.property'))
                .rejects.toMatchObject({ response: { status: 403 } });
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(disconnectedService.deleteConfigProperty('some.property'))
                .rejects.toThrow('Not connected to registry');
        });
    });
});
