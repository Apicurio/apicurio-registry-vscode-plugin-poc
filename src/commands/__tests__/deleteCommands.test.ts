import * as vscode from 'vscode';
import { RegistryService } from '../../services/registryService';
import { RegistryItem, RegistryItemType } from '../../models/registryModels';
import { deleteGroupCommand, deleteArtifactCommand, deleteVersionCommand } from '../deleteCommands';

describe('Delete Commands', () => {
    let mockService: jest.Mocked<RegistryService>;
    let mockShowWarningMessage: jest.SpyInstance;
    let mockShowInformationMessage: jest.SpyInstance;
    let mockShowErrorMessage: jest.SpyInstance;
    let mockWithProgress: jest.SpyInstance;
    let mockRefresh: jest.Mock;

    beforeEach(() => {
        // Create mock service
        mockService = {
            deleteGroup: jest.fn().mockResolvedValue(undefined),
            deleteArtifact: jest.fn().mockResolvedValue(undefined),
            deleteVersion: jest.fn().mockResolvedValue(undefined),
            getVersions: jest.fn().mockResolvedValue([
                { version: '1.0.0' },
                { version: '2.0.0' }
            ])
        } as any;

        // Mock VSCode APIs
        mockShowWarningMessage = jest.spyOn(vscode.window, 'showWarningMessage').mockResolvedValue('Delete' as any);
        mockShowInformationMessage = jest.spyOn(vscode.window, 'showInformationMessage').mockResolvedValue(undefined);
        mockShowErrorMessage = jest.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined);
        mockWithProgress = jest.spyOn(vscode.window, 'withProgress').mockImplementation(async (options, task) => {
            return await task({ report: jest.fn() }, {} as any);
        });

        // Mock refresh function
        mockRefresh = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('deleteGroupCommand', () => {
        it('should delete group after confirmation', async () => {
            const mockNode = new RegistryItem(
                'test-group',
                RegistryItemType.Group,
                'test-group',
                { artifactCount: 5 },
                undefined,
                'test-group'
            );

            mockShowWarningMessage.mockResolvedValue('Delete' as any);

            await deleteGroupCommand(mockService, mockRefresh, mockNode);

            expect(mockShowWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('Delete group "test-group"'),
                { modal: true },
                'Delete'
            );
            expect(mockShowWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('5 artifact(s)'),
                { modal: true },
                'Delete'
            );
            expect(mockService.deleteGroup).toHaveBeenCalledWith('test-group');
            expect(mockRefresh).toHaveBeenCalled();
            expect(mockShowInformationMessage).toHaveBeenCalledWith('Group "test-group" deleted successfully');
        });

        it('should not delete group if user cancels', async () => {
            const mockNode = new RegistryItem(
                'test-group',
                RegistryItemType.Group,
                'test-group',
                { artifactCount: 5 },
                undefined,
                'test-group'
            );

            mockShowWarningMessage.mockResolvedValue(undefined);

            await deleteGroupCommand(mockService, mockRefresh, mockNode);

            expect(mockService.deleteGroup).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
            expect(mockShowInformationMessage).not.toHaveBeenCalled();
        });

        it('should show error when groupId is missing', async () => {
            const mockNode = new RegistryItem(
                'test-group',
                RegistryItemType.Group,
                undefined
            );

            await deleteGroupCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith('Cannot delete group: missing group ID');
            expect(mockService.deleteGroup).not.toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const mockNode = new RegistryItem(
                'test-group',
                RegistryItemType.Group,
                'test-group',
                undefined,
                undefined,
                'test-group'
            );

            mockShowWarningMessage.mockResolvedValue('Delete' as any);
            mockService.deleteGroup.mockRejectedValue(new Error('403 Forbidden'));

            await deleteGroupCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith('Failed to delete group: 403 Forbidden');
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle delete disabled error', async () => {
            const mockNode = new RegistryItem(
                'test-group',
                RegistryItemType.Group,
                'test-group',
                undefined,
                undefined,
                'test-group'
            );

            mockShowWarningMessage.mockResolvedValue('Delete' as any);
            mockService.deleteGroup.mockRejectedValue(new Error('Delete operation not allowed'));

            await deleteGroupCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith('Failed to delete group: Delete operation not allowed');
        });
    });

    describe('deleteArtifactCommand', () => {
        it('should delete artifact after confirmation', async () => {
            const mockNode = new RegistryItem(
                'test-artifact',
                RegistryItemType.Artifact,
                'test-artifact',
                { artifactType: 'OPENAPI' },
                'test-group',
                'test-group'
            );

            mockService.getVersions.mockResolvedValue([
                { version: '1.0.0' },
                { version: '2.0.0' },
                { version: '3.0.0' }
            ] as any);
            mockShowWarningMessage.mockResolvedValue('Delete' as any);

            await deleteArtifactCommand(mockService, mockRefresh, mockNode);

            expect(mockShowWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('Delete artifact "test-artifact"'),
                { modal: true },
                'Delete'
            );
            expect(mockShowWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('3 version(s)'),
                { modal: true },
                'Delete'
            );
            expect(mockService.deleteArtifact).toHaveBeenCalledWith('test-group', 'test-artifact');
            expect(mockRefresh).toHaveBeenCalled();
            expect(mockShowInformationMessage).toHaveBeenCalledWith('Artifact "test-artifact" deleted successfully');
        });

        it('should not delete artifact if user cancels', async () => {
            const mockNode = new RegistryItem(
                'test-artifact',
                RegistryItemType.Artifact,
                'test-artifact',
                undefined,
                'test-group',
                'test-group'
            );

            mockShowWarningMessage.mockResolvedValue(undefined);

            await deleteArtifactCommand(mockService, mockRefresh, mockNode);

            expect(mockService.deleteArtifact).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle missing groupId or artifactId', async () => {
            const mockNode = new RegistryItem(
                'test-artifact',
                RegistryItemType.Artifact,
                undefined,
                undefined,
                'test-group'
            );

            await deleteArtifactCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith('Cannot delete artifact: missing group or artifact ID');
            expect(mockService.deleteArtifact).not.toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const mockNode = new RegistryItem(
                'test-artifact',
                RegistryItemType.Artifact,
                'test-artifact',
                undefined,
                'test-group',
                'test-group'
            );

            mockShowWarningMessage.mockResolvedValue('Delete' as any);
            mockService.deleteArtifact.mockRejectedValue(new Error('404 Not Found'));

            await deleteArtifactCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith('Failed to delete artifact: 404 Not Found');
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should continue even if version count fails', async () => {
            const mockNode = new RegistryItem(
                'test-artifact',
                RegistryItemType.Artifact,
                'test-artifact',
                undefined,
                'test-group',
                'test-group'
            );

            mockService.getVersions.mockRejectedValue(new Error('Network error'));
            mockShowWarningMessage.mockResolvedValue('Delete' as any);

            await deleteArtifactCommand(mockService, mockRefresh, mockNode);

            expect(mockShowWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('0 version(s)'),
                { modal: true },
                'Delete'
            );
            expect(mockService.deleteArtifact).toHaveBeenCalled();
        });
    });

    describe('deleteVersionCommand', () => {
        it('should delete version after confirmation', async () => {
            const mockNode = new RegistryItem(
                '2.0.0',
                RegistryItemType.Version,
                '2.0.0',
                {},
                'test-artifact',
                'test-group'
            );

            mockService.getVersions.mockResolvedValue([
                { version: '1.0.0' },
                { version: '2.0.0' }
            ] as any);
            mockShowWarningMessage.mockResolvedValue('Delete' as any);

            await deleteVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockShowWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('Delete version "2.0.0"'),
                { modal: true },
                'Delete'
            );
            expect(mockService.deleteVersion).toHaveBeenCalledWith('test-group', 'test-artifact', '2.0.0');
            expect(mockRefresh).toHaveBeenCalled();
            expect(mockShowInformationMessage).toHaveBeenCalledWith('Version "2.0.0" deleted successfully');
        });

        it('should prevent deletion of last version', async () => {
            const mockNode = new RegistryItem(
                '1.0.0',
                RegistryItemType.Version,
                '1.0.0',
                {},
                'test-artifact',
                'test-group'
            );

            mockService.getVersions.mockResolvedValue([{ version: '1.0.0' }] as any);

            await deleteVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockShowWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('Cannot delete version "1.0.0"')
            );
            expect(mockShowWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('last version')
            );
            expect(mockService.deleteVersion).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should not delete version if user cancels', async () => {
            const mockNode = new RegistryItem(
                '2.0.0',
                RegistryItemType.Version,
                '2.0.0',
                {},
                'test-artifact',
                'test-group'
            );

            mockService.getVersions.mockResolvedValue([
                { version: '1.0.0' },
                { version: '2.0.0' }
            ] as any);
            mockShowWarningMessage.mockResolvedValue(undefined);

            await deleteVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.deleteVersion).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle missing identifiers', async () => {
            const mockNode = new RegistryItem(
                '1.0.0',
                RegistryItemType.Version,
                undefined,
                {},
                'test-artifact'
            );

            await deleteVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith('Cannot delete version: missing group, artifact, or version ID');
            expect(mockService.deleteVersion).not.toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const mockNode = new RegistryItem(
                '2.0.0',
                RegistryItemType.Version,
                '2.0.0',
                {},
                'test-artifact',
                'test-group'
            );

            mockService.getVersions.mockResolvedValue([
                { version: '1.0.0' },
                { version: '2.0.0' }
            ] as any);
            mockShowWarningMessage.mockResolvedValue('Delete' as any);
            mockService.deleteVersion.mockRejectedValue(new Error('403 Forbidden'));

            await deleteVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith('Failed to delete version: 403 Forbidden');
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should continue deletion if version check fails', async () => {
            const mockNode = new RegistryItem(
                '2.0.0',
                RegistryItemType.Version,
                '2.0.0',
                {},
                'test-artifact',
                'test-group'
            );

            mockService.getVersions.mockRejectedValue(new Error('Network error'));
            mockShowWarningMessage.mockResolvedValue('Delete' as any);

            await deleteVersionCommand(mockService, mockRefresh, mockNode);

            // Should continue with deletion even if can't check version count
            expect(mockService.deleteVersion).toHaveBeenCalled();
            expect(mockRefresh).toHaveBeenCalled();
        });
    });
});
