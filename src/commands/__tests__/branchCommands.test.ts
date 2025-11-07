import * as vscode from 'vscode';
import { RegistryService } from '../../services/registryService';
import { RegistryItem, RegistryItemType } from '../../models/registryModels';
import {
    createBranchCommand,
    editBranchMetadataCommand,
    addVersionToBranchCommand,
    deleteBranchCommand
} from '../branchCommands';

// Mock vscode
jest.mock('vscode', () => ({
    window: {
        showInputBox: jest.fn(),
        showQuickPick: jest.fn(),
        showInformationMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showErrorMessage: jest.fn()
    }
}));

describe('Branch Commands', () => {
    let mockRegistryService: jest.Mocked<RegistryService>;
    let mockRefresh: jest.Mock;
    let mockShowInputBox: jest.MockedFunction<typeof vscode.window.showInputBox>;
    let mockShowQuickPick: jest.MockedFunction<typeof vscode.window.showQuickPick>;
    let mockShowInformationMessage: jest.MockedFunction<typeof vscode.window.showInformationMessage>;
    let mockShowWarningMessage: jest.MockedFunction<typeof vscode.window.showWarningMessage>;
    let mockShowErrorMessage: jest.MockedFunction<typeof vscode.window.showErrorMessage>;

    beforeEach(() => {
        mockRegistryService = {
            getBranches: jest.fn(),
            getBranchMetadata: jest.fn(),
            createBranch: jest.fn(),
            updateBranchMetadata: jest.fn(),
            deleteBranch: jest.fn(),
            getBranchVersions: jest.fn(),
            getVersions: jest.fn(),
            addVersionToBranch: jest.fn()
        } as any;

        mockRefresh = jest.fn();

        mockShowInputBox = vscode.window.showInputBox as jest.MockedFunction<typeof vscode.window.showInputBox>;
        mockShowQuickPick = vscode.window.showQuickPick as jest.MockedFunction<typeof vscode.window.showQuickPick>;
        mockShowInformationMessage = vscode.window.showInformationMessage as jest.MockedFunction<typeof vscode.window.showInformationMessage>;
        mockShowWarningMessage = vscode.window.showWarningMessage as jest.MockedFunction<typeof vscode.window.showWarningMessage>;
        mockShowErrorMessage = vscode.window.showErrorMessage as jest.MockedFunction<typeof vscode.window.showErrorMessage>;

        jest.clearAllMocks();
    });

    describe('createBranchCommand', () => {
        const mockArtifactNode = new RegistryItem(
            'test-artifact',
            RegistryItemType.Artifact,
            'test-artifact',
            { artifactType: 'OPENAPI' },
            'test-group'
        );

        it('should create branch with description', async () => {
            mockShowInputBox
                .mockResolvedValueOnce('develop')  // branch ID
                .mockResolvedValueOnce('Development branch');  // description

            mockShowQuickPick.mockResolvedValueOnce({ label: '$(check) Create Branch' } as any);

            mockRegistryService.createBranch.mockResolvedValue({
                groupId: 'test-group',
                artifactId: 'test-artifact',
                branchId: 'develop',
                createdOn: '2025-11-07T10:00:00Z',
                modifiedOn: '2025-11-07T10:00:00Z',
                modifiedBy: '',
                owner: '',
                description: 'Development branch',
                systemDefined: false
            });

            await createBranchCommand(mockRegistryService, mockRefresh, mockArtifactNode);

            expect(mockRegistryService.createBranch).toHaveBeenCalledWith(
                'test-group',
                'test-artifact',
                'develop',
                'Development branch'
            );
            expect(mockRefresh).toHaveBeenCalled();
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                "Branch 'develop' created successfully"
            );
        });

        it('should create branch without description', async () => {
            mockShowInputBox
                .mockResolvedValueOnce('release')  // branch ID
                .mockResolvedValueOnce('');  // empty description

            mockShowQuickPick.mockResolvedValueOnce({ label: '$(check) Create Branch' } as any);

            mockRegistryService.createBranch.mockResolvedValue({
                groupId: 'test-group',
                artifactId: 'test-artifact',
                branchId: 'release',
                createdOn: '2025-11-07T10:00:00Z',
                modifiedOn: '2025-11-07T10:00:00Z',
                modifiedBy: '',
                owner: '',
                systemDefined: false
            });

            await createBranchCommand(mockRegistryService, mockRefresh, mockArtifactNode);

            expect(mockRegistryService.createBranch).toHaveBeenCalledWith(
                'test-group',
                'test-artifact',
                'release',
                undefined
            );
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should cancel when branch ID not provided', async () => {
            mockShowInputBox.mockResolvedValueOnce(undefined);  // cancelled

            await createBranchCommand(mockRegistryService, mockRefresh, mockArtifactNode);

            expect(mockRegistryService.createBranch).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should cancel when description input cancelled', async () => {
            mockShowInputBox
                .mockResolvedValueOnce('develop')
                .mockResolvedValueOnce(undefined);  // cancelled

            await createBranchCommand(mockRegistryService, mockRefresh, mockArtifactNode);

            expect(mockRegistryService.createBranch).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should cancel when confirmation cancelled', async () => {
            mockShowInputBox
                .mockResolvedValueOnce('develop')
                .mockResolvedValueOnce('Development branch');

            mockShowQuickPick.mockResolvedValueOnce(undefined);  // cancelled

            await createBranchCommand(mockRegistryService, mockRefresh, mockArtifactNode);

            expect(mockRegistryService.createBranch).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle 409 error (branch already exists)', async () => {
            mockShowInputBox
                .mockResolvedValueOnce('existing-branch')
                .mockResolvedValueOnce('Description');

            mockShowQuickPick.mockResolvedValueOnce({ label: '$(check) Create Branch' } as any);

            mockRegistryService.createBranch.mockRejectedValue(
                new Error('Branch already exists: existing-branch')
            );

            await createBranchCommand(mockRegistryService, mockRefresh, mockArtifactNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                "Branch already exists: existing-branch"
            );
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle invalid branch ID format', async () => {
            mockShowInputBox
                .mockResolvedValueOnce('invalid branch!')
                .mockResolvedValueOnce('Description');

            mockShowQuickPick.mockResolvedValueOnce({ label: '$(check) Create Branch' } as any);

            mockRegistryService.createBranch.mockRejectedValue(
                new Error('Invalid branch ID format: invalid branch!')
            );

            await createBranchCommand(mockRegistryService, mockRefresh, mockArtifactNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                "Invalid branch ID format: invalid branch!"
            );
        });
    });

    describe('editBranchMetadataCommand', () => {
        const mockBranchNode = new RegistryItem(
            'develop',
            RegistryItemType.Branch,
            'develop',
            {
                systemDefined: false,
                description: 'Old description'
            },
            'test-artifact',
            'test-group'
        );

        it('should update branch description', async () => {
            mockShowInputBox.mockResolvedValueOnce('Updated description');

            await editBranchMetadataCommand(mockRegistryService, mockRefresh, mockBranchNode);

            expect(mockRegistryService.updateBranchMetadata).toHaveBeenCalledWith(
                'test-group',
                'test-artifact',
                'develop',
                { description: 'Updated description' }
            );
            expect(mockRefresh).toHaveBeenCalled();
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                "Branch 'develop' metadata updated"
            );
        });

        it('should cancel when input cancelled', async () => {
            mockShowInputBox.mockResolvedValueOnce(undefined);

            await editBranchMetadataCommand(mockRegistryService, mockRefresh, mockBranchNode);

            expect(mockRegistryService.updateBranchMetadata).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle error when branch not found', async () => {
            mockShowInputBox.mockResolvedValueOnce('New description');

            mockRegistryService.updateBranchMetadata.mockRejectedValue(
                new Error('Branch not found: develop')
            );

            await editBranchMetadataCommand(mockRegistryService, mockRefresh, mockBranchNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                "Branch not found: develop"
            );
            expect(mockRefresh).not.toHaveBeenCalled();
        });
    });

    describe('addVersionToBranchCommand', () => {
        const mockBranchNode = new RegistryItem(
            'develop',
            RegistryItemType.Branch,
            'develop',
            { systemDefined: false },
            'test-artifact',
            'test-group'
        );

        it('should add single version to branch', async () => {
            mockRegistryService.getVersions.mockResolvedValue([
                { version: '1.0.0', globalId: 1, state: 'ENABLED' } as any,
                { version: '1.0.1', globalId: 2, state: 'ENABLED' } as any
            ]);

            mockRegistryService.getBranchVersions.mockResolvedValue([
                { version: '1.0.0', globalId: 1, state: 'ENABLED' } as any
            ]);

            mockShowQuickPick.mockResolvedValueOnce([
                { label: '1.0.1', picked: true }
            ] as any);

            await addVersionToBranchCommand(mockRegistryService, mockRefresh, mockBranchNode);

            expect(mockRegistryService.addVersionToBranch).toHaveBeenCalledWith(
                'test-group',
                'test-artifact',
                'develop',
                '1.0.1'
            );
            expect(mockRefresh).toHaveBeenCalled();
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                "Added 1 version(s) to branch 'develop'"
            );
        });

        it('should add multiple versions to branch', async () => {
            mockRegistryService.getVersions.mockResolvedValue([
                { version: '1.0.0', globalId: 1, state: 'ENABLED' } as any,
                { version: '1.0.1', globalId: 2, state: 'ENABLED' } as any,
                { version: '1.0.2', globalId: 3, state: 'ENABLED' } as any
            ]);

            mockRegistryService.getBranchVersions.mockResolvedValue([]);

            mockShowQuickPick.mockResolvedValueOnce([
                { label: '1.0.0', picked: true },
                { label: '1.0.1', picked: true }
            ] as any);

            await addVersionToBranchCommand(mockRegistryService, mockRefresh, mockBranchNode);

            expect(mockRegistryService.addVersionToBranch).toHaveBeenCalledTimes(2);
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                "Added 2 version(s) to branch 'develop'"
            );
        });

        it('should cancel when no version selected', async () => {
            mockRegistryService.getVersions.mockResolvedValue([
                { version: '1.0.0', globalId: 1, state: 'ENABLED' } as any
            ]);

            mockRegistryService.getBranchVersions.mockResolvedValue([]);

            mockShowQuickPick.mockResolvedValueOnce(undefined);

            await addVersionToBranchCommand(mockRegistryService, mockRefresh, mockBranchNode);

            expect(mockRegistryService.addVersionToBranch).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should show message when all versions already in branch', async () => {
            mockRegistryService.getVersions.mockResolvedValue([
                { version: '1.0.0', globalId: 1, state: 'ENABLED' } as any
            ]);

            mockRegistryService.getBranchVersions.mockResolvedValue([
                { version: '1.0.0', globalId: 1, state: 'ENABLED' } as any
            ]);

            await addVersionToBranchCommand(mockRegistryService, mockRefresh, mockBranchNode);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                "All versions are already in branch 'develop'"
            );
            expect(mockRegistryService.addVersionToBranch).not.toHaveBeenCalled();
        });

        it('should handle error when adding version', async () => {
            mockRegistryService.getVersions.mockResolvedValue([
                { version: '1.0.0', globalId: 1, state: 'ENABLED' } as any
            ]);

            mockRegistryService.getBranchVersions.mockResolvedValue([]);

            mockShowQuickPick.mockResolvedValueOnce([
                { label: '1.0.0', picked: true }
            ] as any);

            mockRegistryService.addVersionToBranch.mockRejectedValue(
                new Error('Version not found: 1.0.0')
            );

            await addVersionToBranchCommand(mockRegistryService, mockRefresh, mockBranchNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                "Failed to add versions: Version not found: 1.0.0"
            );
        });
    });

    describe('deleteBranchCommand', () => {
        const mockCustomBranchNode = new RegistryItem(
            'develop',
            RegistryItemType.Branch,
            'develop',
            { systemDefined: false },
            'test-artifact',
            'test-group'
        );

        const mockSystemBranchNode = new RegistryItem(
            'latest',
            RegistryItemType.Branch,
            'latest',
            { systemDefined: true },
            'test-artifact',
            'test-group'
        );

        it('should delete custom branch after confirmation', async () => {
            mockShowWarningMessage.mockResolvedValueOnce('Delete' as any);

            await deleteBranchCommand(mockRegistryService, mockRefresh, mockCustomBranchNode);

            expect(mockRegistryService.deleteBranch).toHaveBeenCalledWith(
                'test-group',
                'test-artifact',
                'develop'
            );
            expect(mockRefresh).toHaveBeenCalled();
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                "Branch 'develop' deleted successfully"
            );
        });

        it('should cancel delete when user cancels confirmation', async () => {
            mockShowWarningMessage.mockResolvedValueOnce(undefined);

            await deleteBranchCommand(mockRegistryService, mockRefresh, mockCustomBranchNode);

            expect(mockRegistryService.deleteBranch).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should prevent deletion of system branch', async () => {
            await deleteBranchCommand(mockRegistryService, mockRefresh, mockSystemBranchNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                "Cannot delete system-defined branch 'latest'"
            );
            expect(mockRegistryService.deleteBranch).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle 404 error (branch not found)', async () => {
            mockShowWarningMessage.mockResolvedValueOnce('Delete' as any);

            mockRegistryService.deleteBranch.mockRejectedValue(
                new Error('Branch not found: develop')
            );

            await deleteBranchCommand(mockRegistryService, mockRefresh, mockCustomBranchNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                "Branch not found: develop"
            );
        });

        it('should handle 405 error (cannot delete system branch)', async () => {
            mockShowWarningMessage.mockResolvedValueOnce('Delete' as any);

            mockRegistryService.deleteBranch.mockRejectedValue(
                new Error('Cannot delete system-defined branch: latest')
            );

            await deleteBranchCommand(mockRegistryService, mockRefresh, mockCustomBranchNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                "Cannot delete system-defined branch: latest"
            );
        });
    });
});
