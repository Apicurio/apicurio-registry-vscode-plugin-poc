import * as vscode from 'vscode';
import {
    viewSettingsCommand,
    editPropertyCommand,
    resetPropertyCommand,
    searchPropertiesCommand
} from '../settingsCommands';
import { RegistryService } from '../../services/registryService';
import { RegistryTreeDataProvider } from '../../providers/registryTreeProvider';
import { ConfigurationProperty, PropertyType } from '../../models/registryModels';

// Mock vscode
jest.mock('vscode', () => ({
    window: {
        showInputBox: jest.fn(),
        showQuickPick: jest.fn(),
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        withProgress: jest.fn()
    },
    ProgressLocation: {
        Notification: 15
    }
}));

describe('Settings Commands', () => {
    let mockRegistryService: jest.Mocked<RegistryService>;
    let mockTreeProvider: jest.Mocked<RegistryTreeDataProvider>;
    let mockRefresh: jest.Mock;

    const mockProperties: ConfigurationProperty[] = [
        {
            name: 'apicurio.authn.basic-client-credentials.enabled',
            value: 'true',
            type: PropertyType.BOOLEAN,
            label: 'Basic client credentials',
            description: 'Enable basic authentication with client credentials'
        },
        {
            name: 'apicurio.authz.owner-only-authorization',
            value: 'false',
            type: PropertyType.BOOLEAN,
            label: 'Owner-only authorization',
            description: 'Restrict artifacts to owners only'
        },
        {
            name: 'apicurio.ccompat.max-subjects',
            value: '1000',
            type: PropertyType.INTEGER,
            label: 'Max subjects',
            description: 'Maximum number of subjects allowed'
        },
        {
            name: 'apicurio.ui.context-path',
            value: '/registry',
            type: PropertyType.STRING,
            label: 'UI context path',
            description: 'Context path for UI'
        }
    ];

    beforeEach(() => {
        mockRegistryService = {
            getConfigProperties: jest.fn(),
            getConfigProperty: jest.fn(),
            updateConfigProperty: jest.fn(),
            deleteConfigProperty: jest.fn()
        } as any;

        mockRefresh = jest.fn();
        mockTreeProvider = {
            refresh: mockRefresh
        } as any;

        jest.clearAllMocks();
    });

    describe('viewSettingsCommand', () => {
        it('should display all property groups', async () => {
            mockRegistryService.getConfigProperties.mockResolvedValue(mockProperties);

            // Mock progress wrapper
            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            // Mock group selection (Authentication)
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({
                    label: 'Authentication',
                    group: {
                        name: 'Authentication',
                        description: 'Authentication and identity settings',
                        properties: [mockProperties[0]]
                    }
                })
                // Mock property selection
                .mockResolvedValueOnce({
                    label: 'Basic client credentials',
                    property: mockProperties[0]
                })
                // Mock action selection
                .mockResolvedValueOnce({ label: '$(close) Cancel', action: 'cancel' });

            await viewSettingsCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.getConfigProperties).toHaveBeenCalled();
        });

        it('should handle empty properties list', async () => {
            mockRegistryService.getConfigProperties.mockResolvedValue([]);

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await viewSettingsCommand(mockRegistryService, mockTreeProvider);

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('No configuration properties')
            );
        });

        it('should handle user cancellation at group selection', async () => {
            mockRegistryService.getConfigProperties.mockResolvedValue(mockProperties);

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            // User cancels at group selection
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce(undefined);

            await viewSettingsCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.updateConfigProperty).not.toHaveBeenCalled();
        });

        it('should handle user cancellation at property selection', async () => {
            mockRegistryService.getConfigProperties.mockResolvedValue(mockProperties);

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            // User selects group, then cancels at property selection
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({
                    label: 'Authorization',
                    group: {
                        name: 'Authorization',
                        description: 'Access control and permissions',
                        properties: [mockProperties[1]]
                    }
                })
                .mockResolvedValueOnce(undefined); // Cancel

            await viewSettingsCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.updateConfigProperty).not.toHaveBeenCalled();
        });

        it('should handle 403 Forbidden error', async () => {
            mockRegistryService.getConfigProperties.mockRejectedValue({
                response: { status: 403 }
            });

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await viewSettingsCommand(mockRegistryService, mockTreeProvider);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Settings management requires admin role'
            );
        });

        it('should handle API errors', async () => {
            mockRegistryService.getConfigProperties.mockRejectedValue(
                new Error('Network error')
            );

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await viewSettingsCommand(mockRegistryService, mockTreeProvider);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Network error')
            );
        });
    });

    describe('editPropertyCommand', () => {
        it('should edit boolean property (enable)', async () => {
            const property = mockProperties[0];

            // Mock boolean input (Enable)
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce({
                label: 'Enable',
                value: 'true'
            });

            mockRegistryService.updateConfigProperty.mockResolvedValue();

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await editPropertyCommand(mockRegistryService, mockTreeProvider, property);

            expect(mockRegistryService.updateConfigProperty).toHaveBeenCalledWith(
                property.name,
                'true'
            );
            expect(mockRefresh).toHaveBeenCalled();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Successfully updated')
            );
        });

        it('should edit boolean property (disable)', async () => {
            const property = mockProperties[1];

            (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce({
                label: 'Disable',
                value: 'false'
            });

            mockRegistryService.updateConfigProperty.mockResolvedValue();

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await editPropertyCommand(mockRegistryService, mockTreeProvider, property);

            expect(mockRegistryService.updateConfigProperty).toHaveBeenCalledWith(
                property.name,
                'false'
            );
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should edit integer property with validation', async () => {
            const property = mockProperties[2];

            (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce('2000');

            mockRegistryService.updateConfigProperty.mockResolvedValue();

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await editPropertyCommand(mockRegistryService, mockTreeProvider, property);

            expect(mockRegistryService.updateConfigProperty).toHaveBeenCalledWith(
                property.name,
                '2000'
            );
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should edit string property', async () => {
            const property = mockProperties[3];

            (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce('/api');

            mockRegistryService.updateConfigProperty.mockResolvedValue();

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await editPropertyCommand(mockRegistryService, mockTreeProvider, property);

            expect(mockRegistryService.updateConfigProperty).toHaveBeenCalledWith(
                property.name,
                '/api'
            );
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should handle user cancellation', async () => {
            const property = mockProperties[0];

            (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce(undefined);

            await editPropertyCommand(mockRegistryService, mockTreeProvider, property);

            expect(mockRegistryService.updateConfigProperty).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle 400 Bad Request error', async () => {
            const property = mockProperties[0];

            (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce({
                label: 'Enable',
                value: 'invalid'
            });

            mockRegistryService.updateConfigProperty.mockRejectedValue({
                response: {
                    status: 400,
                    data: { message: 'Invalid value for boolean property' }
                }
            });

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await editPropertyCommand(mockRegistryService, mockTreeProvider, property);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Invalid value')
            );
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle 403 Forbidden error', async () => {
            const property = mockProperties[0];

            (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce({
                label: 'Enable',
                value: 'true'
            });

            mockRegistryService.updateConfigProperty.mockRejectedValue({
                response: { status: 403 }
            });

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await editPropertyCommand(mockRegistryService, mockTreeProvider, property);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Settings management requires admin role'
            );
        });

        it('should handle network errors', async () => {
            const property = mockProperties[0];

            (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce({
                label: 'Enable',
                value: 'true'
            });

            mockRegistryService.updateConfigProperty.mockRejectedValue(
                new Error('Network timeout')
            );

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await editPropertyCommand(mockRegistryService, mockTreeProvider, property);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Network timeout')
            );
        });
    });

    describe('resetPropertyCommand', () => {
        it('should reset property to default', async () => {
            const property = mockProperties[0];

            // Mock confirmation
            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValueOnce('Reset');

            mockRegistryService.deleteConfigProperty.mockResolvedValue();

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await resetPropertyCommand(mockRegistryService, mockTreeProvider, property);

            expect(mockRegistryService.deleteConfigProperty).toHaveBeenCalledWith(
                property.name
            );
            expect(mockRefresh).toHaveBeenCalled();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Successfully reset')
            );
        });

        it('should handle user cancellation', async () => {
            const property = mockProperties[0];

            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValueOnce('Cancel');

            await resetPropertyCommand(mockRegistryService, mockTreeProvider, property);

            expect(mockRegistryService.deleteConfigProperty).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle user dismissing dialog', async () => {
            const property = mockProperties[0];

            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValueOnce(undefined);

            await resetPropertyCommand(mockRegistryService, mockTreeProvider, property);

            expect(mockRegistryService.deleteConfigProperty).not.toHaveBeenCalled();
        });

        it('should handle 404 Not Found', async () => {
            const property = mockProperties[0];

            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValueOnce('Reset');

            mockRegistryService.deleteConfigProperty.mockRejectedValue({
                response: { status: 404 }
            });

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await resetPropertyCommand(mockRegistryService, mockTreeProvider, property);

            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('not found')
            );
        });

        it('should handle 403 Forbidden', async () => {
            const property = mockProperties[0];

            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValueOnce('Reset');

            mockRegistryService.deleteConfigProperty.mockRejectedValue({
                response: { status: 403 }
            });

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await resetPropertyCommand(mockRegistryService, mockTreeProvider, property);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Settings management requires admin role'
            );
        });
    });

    describe('searchPropertiesCommand', () => {
        it('should filter properties by name', async () => {
            (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce('auth');

            mockRegistryService.getConfigProperties.mockResolvedValue(mockProperties);

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            // Mock property selection
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({
                    label: 'Basic client credentials',
                    property: mockProperties[0]
                })
                // Mock action selection
                .mockResolvedValueOnce({ label: '$(close) Cancel', action: 'cancel' });

            await searchPropertiesCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.getConfigProperties).toHaveBeenCalled();
        });

        it('should filter properties by description', async () => {
            (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce('authorization');

            mockRegistryService.getConfigProperties.mockResolvedValue(mockProperties);

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({
                    label: 'Owner-only authorization',
                    property: mockProperties[1]
                })
                .mockResolvedValueOnce({ label: '$(close) Cancel', action: 'cancel' });

            await searchPropertiesCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.getConfigProperties).toHaveBeenCalled();
        });

        it('should handle no matches', async () => {
            (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce('nonexistent');

            mockRegistryService.getConfigProperties.mockResolvedValue(mockProperties);

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await searchPropertiesCommand(mockRegistryService, mockTreeProvider);

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('No properties found')
            );
        });

        it('should handle user cancellation at search input', async () => {
            (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce(undefined);

            await searchPropertiesCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.getConfigProperties).not.toHaveBeenCalled();
        });

        it('should handle user cancellation at property selection', async () => {
            (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce('ui');

            mockRegistryService.getConfigProperties.mockResolvedValue(mockProperties);

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            // User cancels at property selection
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce(undefined);

            await searchPropertiesCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.updateConfigProperty).not.toHaveBeenCalled();
        });

        it('should handle 403 Forbidden error', async () => {
            (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce('auth');

            mockRegistryService.getConfigProperties.mockRejectedValue({
                response: { status: 403 }
            });

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await searchPropertiesCommand(mockRegistryService, mockTreeProvider);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Settings management requires admin role'
            );
        });

        it('should handle API errors', async () => {
            (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce('auth');

            mockRegistryService.getConfigProperties.mockRejectedValue(
                new Error('Connection timeout')
            );

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await searchPropertiesCommand(mockRegistryService, mockTreeProvider);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Connection timeout')
            );
        });
    });
});
