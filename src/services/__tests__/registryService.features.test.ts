import { RegistryService } from '../registryService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RegistryService - Feature Detection', () => {
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

    describe('getUIConfig', () => {
        it('should fetch UI config from /system/uiConfig', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: {
                        draftMutability: true,
                        readOnly: false
                    },
                    ui: {
                        contextPath: '/',
                        editorsUrl: 'http://localhost:9011/'
                    }
                }
            });

            const config = await service.getUIConfig();

            expect(mockClient.get).toHaveBeenCalledWith('/system/uiConfig');
            expect(config.features?.draftMutability).toBe(true);
            expect(config.features?.readOnly).toBe(false);
            expect(config.ui?.contextPath).toBe('/');
            expect(config.ui?.editorsUrl).toBe('http://localhost:9011/');
        });

        it('should cache UI config after first fetch', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: { draftMutability: true },
                    ui: { contextPath: '/' }
                }
            });

            const config1 = await service.getUIConfig();
            const config2 = await service.getUIConfig();

            expect(mockClient.get).toHaveBeenCalledTimes(1);
            expect(config1).toEqual(config2);
        });

        it('should handle minimal response with only features', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: { draftMutability: false }
                }
            });

            const config = await service.getUIConfig();

            expect(config.features?.draftMutability).toBe(false);
            expect(config.ui).toBeUndefined();
        });

        it('should handle empty response', async () => {
            mockClient.get.mockResolvedValue({
                data: {}
            });

            const config = await service.getUIConfig();

            expect(config.features).toBeUndefined();
            expect(config.ui).toBeUndefined();
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(disconnectedService.getUIConfig())
                .rejects
                .toThrow('Not connected to registry');
        });

        it('should throw error on API failure', async () => {
            mockClient.get.mockRejectedValue(new Error('404 Not Found'));

            await expect(service.getUIConfig())
                .rejects
                .toThrow();
        });
    });

    describe('isDraftSupportEnabled', () => {
        it('should return true when draftMutability is enabled and not read-only', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: {
                        draftMutability: true,
                        readOnly: false
                    }
                }
            });

            const result = await service.isDraftSupportEnabled();

            expect(result).toBe(true);
        });

        it('should return true when draftMutability is enabled and readOnly is undefined', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: {
                        draftMutability: true
                    }
                }
            });

            const result = await service.isDraftSupportEnabled();

            expect(result).toBe(true);
        });

        it('should return false when draftMutability is disabled', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: {
                        draftMutability: false,
                        readOnly: false
                    }
                }
            });

            const result = await service.isDraftSupportEnabled();

            expect(result).toBe(false);
        });

        it('should return false when draftMutability is undefined', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: {
                        readOnly: false
                    }
                }
            });

            const result = await service.isDraftSupportEnabled();

            expect(result).toBe(false);
        });

        it('should return false when registry is read-only even if drafts enabled', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: {
                        draftMutability: true,
                        readOnly: true
                    }
                }
            });

            const result = await service.isDraftSupportEnabled();

            expect(result).toBe(false);
        });

        it('should return false when features are missing', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    ui: {
                        contextPath: '/'
                    }
                }
            });

            const result = await service.isDraftSupportEnabled();

            expect(result).toBe(false);
        });

        it('should return false when config is empty', async () => {
            mockClient.get.mockResolvedValue({
                data: {}
            });

            const result = await service.isDraftSupportEnabled();

            expect(result).toBe(false);
        });

        it('should return false and log warning on API error', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            mockClient.get.mockRejectedValue(new Error('Network error'));

            const result = await service.isDraftSupportEnabled();

            expect(result).toBe(false);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to get UI config'),
                expect.any(Error)
            );

            consoleWarnSpy.mockRestore();
        });

        it('should return false and log warning on 404 (old registry version)', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const error = {
                response: {
                    status: 404,
                    data: { message: 'Not Found' }
                }
            };
            mockClient.get.mockRejectedValue(error);

            const result = await service.isDraftSupportEnabled();

            expect(result).toBe(false);
            expect(consoleWarnSpy).toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
        });

        it('should use cached config on second call', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: { draftMutability: true }
                }
            });

            const result1 = await service.isDraftSupportEnabled();
            const result2 = await service.isDraftSupportEnabled();

            expect(mockClient.get).toHaveBeenCalledTimes(1);
            expect(result1).toBe(true);
            expect(result2).toBe(true);
        });
    });

    describe('getEditorsUrl', () => {
        it('should return editors URL from config', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    ui: {
                        editorsUrl: 'http://localhost:9011/'
                    }
                }
            });

            await service.getUIConfig();
            const url = service.getEditorsUrl();

            expect(url).toBe('http://localhost:9011/');
        });

        it('should return undefined when UI config not loaded', () => {
            const url = service.getEditorsUrl();

            expect(url).toBeUndefined();
        });

        it('should return undefined when editorsUrl not in config', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    ui: {
                        contextPath: '/'
                    }
                }
            });

            await service.getUIConfig();
            const url = service.getEditorsUrl();

            expect(url).toBeUndefined();
        });

        it('should return undefined when ui section is missing', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: { draftMutability: true }
                }
            });

            await service.getUIConfig();
            const url = service.getEditorsUrl();

            expect(url).toBeUndefined();
        });
    });

    describe('disconnect', () => {
        it('should clear cached UI config on disconnect', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: { draftMutability: true },
                    ui: { editorsUrl: 'http://localhost:9011/' }
                }
            });

            await service.getUIConfig();
            expect(service.getEditorsUrl()).toBe('http://localhost:9011/');

            service.disconnect();

            expect(service.getEditorsUrl()).toBeUndefined();
        });

        it('should require re-fetch after disconnect', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: { draftMutability: true }
                }
            });

            await service.getUIConfig();
            expect(mockClient.get).toHaveBeenCalledTimes(1);

            service.disconnect();

            // Reconnect
            service.setConnection({
                name: 'Test Registry',
                url: 'http://localhost:8080',
                authType: 'none'
            });

            await service.getUIConfig();

            // Should have called get twice (once before disconnect, once after)
            expect(mockClient.get).toHaveBeenCalledTimes(2);
        });
    });
});
