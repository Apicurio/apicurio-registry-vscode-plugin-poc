import * as vscode from 'vscode';
import { RegistryService } from '../../services/registryService';
import { RegistryItem, RegistryItemType } from '../../models/registryModels';
import { changeArtifactStateCommand, changeVersionStateCommand } from '../stateCommands';

describe('State Commands', () => {
    let mockService: jest.Mocked<RegistryService>;
    let mockShowQuickPick: jest.SpyInstance;
    let mockShowInformationMessage: jest.SpyInstance;
    let mockShowErrorMessage: jest.SpyInstance;
    let mockRefresh: jest.Mock;

    beforeEach(() => {
        // Create mock service
        mockService = {
            updateArtifactState: jest.fn().mockResolvedValue(undefined),
            updateVersionState: jest.fn().mockResolvedValue(undefined)
        } as any;

        // Mock VSCode APIs
        mockShowQuickPick = jest.spyOn(vscode.window, 'showQuickPick').mockResolvedValue({ label: 'DISABLED', value: 'DISABLED' } as any);
        mockShowInformationMessage = jest.spyOn(vscode.window, 'showInformationMessage').mockResolvedValue(undefined);
        mockShowErrorMessage = jest.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined);

        // Mock refresh function
        mockRefresh = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('changeArtifactStateCommand', () => {
        it('should change artifact state to DISABLED', async () => {
            const mockNode = new RegistryItem(
                'users-api',           // label
                RegistryItemType.Artifact,  // type
                'users-api',           // id
                {                      // metadata
                    artifactType: 'OPENAPI',
                    state: 'ENABLED'
                },
                'test-group',          // parentId
                'test-group'           // groupId
            );

            mockShowQuickPick.mockResolvedValue({ label: 'DISABLED', value: 'DISABLED' } as any);

            await changeArtifactStateCommand(mockService, mockRefresh, mockNode);

            expect(mockShowQuickPick).toHaveBeenCalledWith(
                [
                    { label: 'ENABLED', value: 'ENABLED' },
                    { label: 'DISABLED', value: 'DISABLED' },
                    { label: 'DEPRECATED', value: 'DEPRECATED' }
                ],
                { placeHolder: 'Select new state for artifact users-api' }
            );
            expect(mockService.updateArtifactState).toHaveBeenCalledWith('test-group', 'users-api', 'DISABLED');
            expect(mockRefresh).toHaveBeenCalled();
            expect(mockShowInformationMessage).toHaveBeenCalledWith('Artifact state changed to DISABLED');
        });

        it('should change artifact state to DEPRECATED', async () => {
            const mockNode = new RegistryItem(
                'users-api',
                RegistryItemType.Artifact,
                'users-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockShowQuickPick.mockResolvedValue({ label: 'DEPRECATED', value: 'DEPRECATED' } as any);

            await changeArtifactStateCommand(mockService, mockRefresh, mockNode);

            expect(mockService.updateArtifactState).toHaveBeenCalledWith('test-group', 'users-api', 'DEPRECATED');
            expect(mockShowInformationMessage).toHaveBeenCalledWith('Artifact state changed to DEPRECATED');
        });

        it('should handle user cancellation', async () => {
            const mockNode = new RegistryItem(
                'users-api',
                RegistryItemType.Artifact,
                'users-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockShowQuickPick.mockResolvedValue(undefined);

            await changeArtifactStateCommand(mockService, mockRefresh, mockNode);

            expect(mockService.updateArtifactState).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
            expect(mockShowInformationMessage).not.toHaveBeenCalled();
        });

        it('should handle API errors', async () => {
            const mockNode = new RegistryItem(
                'users-api',
                RegistryItemType.Artifact,
                'users-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockShowQuickPick.mockResolvedValue({ label: 'DISABLED', value: 'DISABLED' } as any);
            mockService.updateArtifactState.mockRejectedValue(new Error('Network error'));

            await changeArtifactStateCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith('Failed to change artifact state: Network error');
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle missing group ID', async () => {
            const mockNode = new RegistryItem(
                'users-api',
                RegistryItemType.Artifact,
                'users-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' }
            );

            await changeArtifactStateCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith('Cannot change state: missing group or artifact ID');
            expect(mockService.updateArtifactState).not.toHaveBeenCalled();
        });
    });

    describe('changeVersionStateCommand', () => {
        it('should change version state to DISABLED', async () => {
            const mockNode = new RegistryItem(
                '1.0.0',
                RegistryItemType.Version,
                '1.0.0',
                { state: 'ENABLED' },
                'users-api',
                'test-group'
            );

            mockShowQuickPick.mockResolvedValue({ label: 'DISABLED', value: 'DISABLED' } as any);

            await changeVersionStateCommand(mockService, mockRefresh, mockNode);

            expect(mockShowQuickPick).toHaveBeenCalledWith(
                [
                    { label: 'ENABLED', value: 'ENABLED' },
                    { label: 'DISABLED', value: 'DISABLED' },
                    { label: 'DEPRECATED', value: 'DEPRECATED' }
                ],
                { placeHolder: 'Select new state for version 1.0.0' }
            );
            expect(mockService.updateVersionState).toHaveBeenCalledWith('test-group', 'users-api', '1.0.0', 'DISABLED');
            expect(mockRefresh).toHaveBeenCalled();
            expect(mockShowInformationMessage).toHaveBeenCalledWith('Version state changed to DISABLED');
        });

        it('should change version state to DEPRECATED', async () => {
            const mockNode = new RegistryItem(
                '1.0.0',
                RegistryItemType.Version,
                '1.0.0',
                { state: 'ENABLED' },
                'users-api',
                'test-group'
            );

            mockShowQuickPick.mockResolvedValue({ label: 'DEPRECATED', value: 'DEPRECATED' } as any);

            await changeVersionStateCommand(mockService, mockRefresh, mockNode);

            expect(mockService.updateVersionState).toHaveBeenCalledWith('test-group', 'users-api', '1.0.0', 'DEPRECATED');
            expect(mockShowInformationMessage).toHaveBeenCalledWith('Version state changed to DEPRECATED');
        });

        it('should handle user cancellation', async () => {
            const mockNode = new RegistryItem(
                '1.0.0',
                RegistryItemType.Version,
                '1.0.0',
                { state: 'ENABLED' },
                'users-api',
                'test-group'
            );

            mockShowQuickPick.mockResolvedValue(undefined);

            await changeVersionStateCommand(mockService, mockRefresh, mockNode);

            expect(mockService.updateVersionState).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle API errors', async () => {
            const mockNode = new RegistryItem(
                '1.0.0',
                RegistryItemType.Version,
                '1.0.0',
                { state: 'ENABLED' },
                'users-api',
                'test-group'
            );

            mockShowQuickPick.mockResolvedValue({ label: 'DISABLED', value: 'DISABLED' } as any);
            mockService.updateVersionState.mockRejectedValue(new Error('API error'));

            await changeVersionStateCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith('Failed to change version state: API error');
        });

        it('should handle missing identifiers', async () => {
            const mockNode = new RegistryItem(
                '1.0.0',
                RegistryItemType.Version,
                '1.0.0',
                { state: 'ENABLED' }
                // Missing parentId and groupId
            );

            await changeVersionStateCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith('Cannot change state: missing group, artifact, or version ID');
            expect(mockService.updateVersionState).not.toHaveBeenCalled();
        });
    });
});
