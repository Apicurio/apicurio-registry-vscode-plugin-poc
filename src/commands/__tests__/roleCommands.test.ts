import * as vscode from 'vscode';
import {
    createRoleMappingCommand,
    updateRoleMappingCommand,
    deleteRoleMappingCommand,
    viewCurrentUserRoleCommand
} from '../roleCommands';
import { RegistryService } from '../../services/registryService';
import { RegistryTreeDataProvider } from '../../providers/registryTreeProvider';
import { RegistryItem, RegistryItemType, Role } from '../../models/registryModels';

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

describe('Role Commands', () => {
    let mockRegistryService: jest.Mocked<RegistryService>;
    let mockTreeProvider: jest.Mocked<RegistryTreeDataProvider>;
    let mockRefresh: jest.Mock;

    beforeEach(() => {
        mockRegistryService = {
            createRoleMapping: jest.fn(),
            updateRoleMapping: jest.fn(),
            deleteRoleMapping: jest.fn(),
            getCurrentUserRole: jest.fn()
        } as any;

        mockRefresh = jest.fn();
        mockTreeProvider = {
            refresh: mockRefresh
        } as any;

        jest.clearAllMocks();
    });

    describe('createRoleMappingCommand', () => {
        it('should create role mapping with all fields', async () => {
            // Mock user inputs
            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce('user@example.com') // Principal ID
                .mockResolvedValueOnce('John Doe'); // Principal name

            // Mock role selection
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ label: 'Developer', value: Role.DEVELOPER }) // Role
                .mockResolvedValueOnce({ label: 'Yes', value: true }); // Confirmation

            // Mock successful creation
            mockRegistryService.createRoleMapping.mockResolvedValue({
                principalId: 'user@example.com',
                role: Role.DEVELOPER,
                principalName: 'John Doe'
            });

            // Mock progress wrapper
            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await createRoleMappingCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.createRoleMapping).toHaveBeenCalledWith(
                'user@example.com',
                Role.DEVELOPER,
                'John Doe'
            );
            expect(mockRefresh).toHaveBeenCalled();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('user@example.com')
            );
        });

        it('should create role mapping without principal name', async () => {
            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce('service-account') // Principal ID
                .mockResolvedValueOnce(''); // Empty name

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ label: 'Admin', value: Role.ADMIN })
                .mockResolvedValueOnce({ label: 'Yes', value: true });

            mockRegistryService.createRoleMapping.mockResolvedValue({
                principalId: 'service-account',
                role: Role.ADMIN
            });

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await createRoleMappingCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.createRoleMapping).toHaveBeenCalledWith(
                'service-account',
                Role.ADMIN,
                undefined
            );
        });

        it('should cancel when principal ID is not provided', async () => {
            (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce(undefined);

            await createRoleMappingCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.createRoleMapping).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should cancel when role is not selected', async () => {
            (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce('user@example.com');
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce(undefined);

            await createRoleMappingCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.createRoleMapping).not.toHaveBeenCalled();
        });

        it('should cancel when user declines confirmation', async () => {
            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce('user@example.com')
                .mockResolvedValueOnce('User Name');

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ label: 'Developer', value: Role.DEVELOPER })
                .mockResolvedValueOnce({ label: 'No', value: false });

            await createRoleMappingCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.createRoleMapping).not.toHaveBeenCalled();
        });

        it('should handle duplicate role mapping error (409)', async () => {
            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce('existing@example.com')
                .mockResolvedValueOnce('');

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ label: 'Admin', value: Role.ADMIN })
                .mockResolvedValueOnce({ label: 'Yes', value: true });

            const error = new Error('Role mapping already exists');
            (error as any).response = { status: 409 };
            mockRegistryService.createRoleMapping.mockRejectedValue(error);

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await createRoleMappingCommand(mockRegistryService, mockTreeProvider);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('already exists')
            );
        });

        it('should handle forbidden error (403)', async () => {
            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce('user@example.com')
                .mockResolvedValueOnce('');

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ label: 'Admin', value: Role.ADMIN })
                .mockResolvedValueOnce({ label: 'Yes', value: true });

            const error = new Error('Forbidden');
            (error as any).response = { status: 403 };
            mockRegistryService.createRoleMapping.mockRejectedValue(error);

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await createRoleMappingCommand(mockRegistryService, mockTreeProvider);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('permission')
            );
        });
    });

    describe('updateRoleMappingCommand', () => {
        const mockNode = new RegistryItem(
            'user@example.com (Developer)',
            RegistryItemType.Group,
            'user@example.com',
            { principalId: 'user@example.com', role: Role.DEVELOPER }
        );

        it('should update role mapping', async () => {
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ label: 'Admin', value: Role.ADMIN }) // New role
                .mockResolvedValueOnce({ label: 'Yes', value: true }); // Confirmation

            mockRegistryService.updateRoleMapping.mockResolvedValue({
                principalId: 'user@example.com',
                role: Role.ADMIN
            });

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await updateRoleMappingCommand(mockNode, mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.updateRoleMapping).toHaveBeenCalledWith(
                'user@example.com',
                Role.ADMIN
            );
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should cancel when role is not selected', async () => {
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce(undefined);

            await updateRoleMappingCommand(mockNode, mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.updateRoleMapping).not.toHaveBeenCalled();
        });

        it('should cancel when user declines confirmation', async () => {
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ label: 'Read-Only', value: Role.READ_ONLY })
                .mockResolvedValueOnce({ label: 'No', value: false });

            await updateRoleMappingCommand(mockNode, mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.updateRoleMapping).not.toHaveBeenCalled();
        });

        it('should handle 404 error when role mapping not found', async () => {
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ label: 'Admin', value: Role.ADMIN })
                .mockResolvedValueOnce({ label: 'Yes', value: true });

            const error = new Error('Not found');
            (error as any).response = { status: 404 };
            mockRegistryService.updateRoleMapping.mockRejectedValue(error);

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await updateRoleMappingCommand(mockNode, mockRegistryService, mockTreeProvider);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('not found')
            );
        });
    });

    describe('deleteRoleMappingCommand', () => {
        const mockNode = new RegistryItem(
            'user@example.com (Developer)',
            RegistryItemType.Group,
            'user@example.com',
            { principalId: 'user@example.com', role: Role.DEVELOPER }
        );

        it('should delete role mapping after confirmation', async () => {
            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Delete');

            mockRegistryService.deleteRoleMapping.mockResolvedValue();

            await deleteRoleMappingCommand(mockNode, mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.deleteRoleMapping).toHaveBeenCalledWith('user@example.com');
            expect(mockRefresh).toHaveBeenCalled();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('deleted')
            );
        });

        it('should cancel when user does not confirm', async () => {
            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue(undefined);

            await deleteRoleMappingCommand(mockNode, mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.deleteRoleMapping).not.toHaveBeenCalled();
        });

        it('should handle 404 error when role mapping not found', async () => {
            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Delete');

            const error = new Error('Not found');
            (error as any).response = { status: 404 };
            mockRegistryService.deleteRoleMapping.mockRejectedValue(error);

            await deleteRoleMappingCommand(mockNode, mockRegistryService, mockTreeProvider);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('not found')
            );
        });

        it('should handle 403 forbidden error', async () => {
            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Delete');

            const error = new Error('Forbidden');
            (error as any).response = { status: 403 };
            mockRegistryService.deleteRoleMapping.mockRejectedValue(error);

            await deleteRoleMappingCommand(mockNode, mockRegistryService, mockTreeProvider);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('permission')
            );
        });
    });

    describe('viewCurrentUserRoleCommand', () => {
        it('should display admin role with permissions', async () => {
            mockRegistryService.getCurrentUserRole.mockResolvedValue({
                principalId: 'admin@example.com',
                role: Role.ADMIN,
                principalName: 'Admin User'
            });

            await viewCurrentUserRoleCommand(mockRegistryService);

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('ADMIN'),
                { modal: false }
            );
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('admin@example.com'),
                { modal: false }
            );
        });

        it('should display developer role', async () => {
            mockRegistryService.getCurrentUserRole.mockResolvedValue({
                principalId: 'dev@example.com',
                role: Role.DEVELOPER
            });

            await viewCurrentUserRoleCommand(mockRegistryService);

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('DEVELOPER'),
                { modal: false }
            );
        });

        it('should display read-only role', async () => {
            mockRegistryService.getCurrentUserRole.mockResolvedValue({
                principalId: 'viewer@example.com',
                role: Role.READ_ONLY
            });

            await viewCurrentUserRoleCommand(mockRegistryService);

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('READ_ONLY'),
                { modal: false }
            );
        });

        it('should handle when user has no role', async () => {
            mockRegistryService.getCurrentUserRole.mockResolvedValue(null);

            await viewCurrentUserRoleCommand(mockRegistryService);

            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('no role')
            );
        });

        it('should handle API errors', async () => {
            mockRegistryService.getCurrentUserRole.mockRejectedValue(new Error('API Error'));

            await viewCurrentUserRoleCommand(mockRegistryService);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Failed')
            );
        });
    });
});
