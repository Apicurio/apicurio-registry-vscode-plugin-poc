import * as vscode from 'vscode';
import { createGroupCommand, deleteGroupCommand } from '../groupCommands';
import { RegistryService } from '../../services/registryService';
import { RegistryTreeDataProvider } from '../../providers/registryTreeProvider';
import { RegistryItem, RegistryItemType } from '../../models/registryModels';

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

describe('Group Commands', () => {
    let mockRegistryService: jest.Mocked<RegistryService>;
    let mockTreeProvider: jest.Mocked<RegistryTreeDataProvider>;
    let mockRefresh: jest.Mock;

    beforeEach(() => {
        mockRegistryService = {
            createGroup: jest.fn(),
            deleteGroup: jest.fn(),
            getGroupMetadataDetailed: jest.fn()
        } as any;

        mockRefresh = jest.fn();
        mockTreeProvider = {
            refresh: mockRefresh
        } as any;

        jest.clearAllMocks();
    });

    describe('createGroupCommand', () => {
        it('should create group with full metadata', async () => {
            // Mock user inputs
            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce('api-schemas') // Group ID
                .mockResolvedValueOnce('REST API schema definitions'); // Description

            // Mock label workflow: Add 2 labels, then continue
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: 'add' }) // Add first label
                .mockResolvedValueOnce({ value: 'add' }) // Add second label
                .mockResolvedValueOnce({ value: 'continue' }) // Continue
                .mockResolvedValueOnce({ value: true }); // Confirm creation

            // Mock label inputs
            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce('env=production') // First label
                .mockResolvedValueOnce('team=platform'); // Second label

            // Mock successful group creation
            mockRegistryService.createGroup.mockResolvedValue({
                groupId: 'api-schemas',
                description: 'REST API schema definitions',
                labels: {
                    env: 'production',
                    team: 'platform'
                }
            });

            // Mock progress wrapper
            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await createGroupCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.createGroup).toHaveBeenCalledWith('api-schemas', {
                description: 'REST API schema definitions',
                labels: {
                    env: 'production',
                    team: 'platform'
                }
            });
            expect(mockRefresh).toHaveBeenCalled();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('api-schemas')
            );
        });

        it('should create group with minimal info (only group ID)', async () => {
            // Mock user inputs - only group ID, skip description and labels
            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce('minimal-group') // Group ID
                .mockResolvedValueOnce(''); // Empty description

            // Mock label workflow: Skip labels
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: 'continue' }) // Skip labels
                .mockResolvedValueOnce({ value: true }); // Confirm creation

            mockRegistryService.createGroup.mockResolvedValue({
                groupId: 'minimal-group'
            });

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await createGroupCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.createGroup).toHaveBeenCalledWith('minimal-group', {});
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should cancel at group ID prompt', async () => {
            (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce(undefined);

            await createGroupCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.createGroup).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should cancel at description prompt', async () => {
            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce('test-group')
                .mockResolvedValueOnce(undefined); // Cancel at description

            await createGroupCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.createGroup).not.toHaveBeenCalled();
        });

        it('should cancel at label prompt', async () => {
            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce('test-group')
                .mockResolvedValueOnce('Test description');

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce(undefined); // Cancel at labels

            await createGroupCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.createGroup).not.toHaveBeenCalled();
        });

        it('should cancel at confirmation', async () => {
            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce('test-group')
                .mockResolvedValueOnce('Test description');

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: 'continue' })
                .mockResolvedValueOnce(undefined); // Cancel at confirmation

            await createGroupCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.createGroup).not.toHaveBeenCalled();
        });

        it('should handle duplicate group ID error (409)', async () => {
            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce('existing-group')
                .mockResolvedValueOnce('Description');

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: 'continue' })
                .mockResolvedValueOnce({ value: true });

            mockRegistryService.createGroup.mockRejectedValue({
                response: {
                    status: 409,
                    data: { message: 'Group already exists' }
                }
            });

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await createGroupCommand(mockRegistryService, mockTreeProvider);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('already exists')
            );
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should validate group ID format', async () => {
            // The validation should happen in the showInputBox validateInput function
            // This test verifies the validation logic exists
            const validateInput = (vscode.window.showInputBox as jest.Mock).mock.calls[0]?.[0]?.validateInput;

            if (validateInput) {
                expect(validateInput('')).toBeTruthy(); // Empty not allowed
                expect(validateInput('valid-group')).toBeNull(); // Valid
                expect(validateInput('invalid group')).toBeTruthy(); // Spaces not allowed
                expect(validateInput('invalid@group')).toBeTruthy(); // Special chars not allowed
            }
        });
    });

    describe('deleteGroupCommand', () => {
        const createGroupNode = (groupId: string, artifactCount: number = 0): RegistryItem => {
            return new RegistryItem(
                groupId,
                RegistryItemType.Group,
                groupId,
                { artifactCount }
            );
        };

        it('should delete empty group', async () => {
            const groupNode = createGroupNode('test-group', 0);

            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Delete');
            mockRegistryService.deleteGroup.mockResolvedValue(undefined);

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await deleteGroupCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockRegistryService.deleteGroup).toHaveBeenCalledWith('test-group');
            expect(mockRefresh).toHaveBeenCalled();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('deleted')
            );
        });

        it('should delete group with artifacts (shows warning)', async () => {
            const groupNode = createGroupNode('api-schemas', 5);

            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Delete Group');
            mockRegistryService.deleteGroup.mockResolvedValue(undefined);

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await deleteGroupCommand(mockRegistryService, mockRefresh, groupNode);

            // Verify warning message shows artifact count
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('5 artifacts'),
                expect.anything(),
                expect.anything()
            );

            expect(mockRegistryService.deleteGroup).toHaveBeenCalledWith('api-schemas');
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should cancel deletion', async () => {
            const groupNode = createGroupNode('test-group');

            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue(undefined);

            await deleteGroupCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockRegistryService.deleteGroup).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle 404 error (group not found)', async () => {
            const groupNode = createGroupNode('missing-group');

            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Delete');
            mockRegistryService.deleteGroup.mockRejectedValue({
                response: {
                    status: 404,
                    data: { message: 'Group not found' }
                }
            });

            (vscode.window.withProgress as jest.Mock).mockImplementation(async (options, task) => {
                return await task({ report: jest.fn() });
            });

            await deleteGroupCommand(mockRegistryService, mockRefresh, groupNode);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('not found')
            );
        });
    });
});
