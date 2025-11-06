import * as vscode from 'vscode';
import { editMetadataCommand } from '../editMetadataCommand';
import { RegistryService } from '../../services/registryService';
import { RegistryItem, RegistryItemType } from '../../models/registryModels';

// Mock vscode module
jest.mock('vscode', () => ({
    window: {
        showQuickPick: jest.fn(),
        showInputBox: jest.fn(),
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn()
    },
    QuickPickItemKind: {
        Separator: -1
    }
}));

describe('Edit Metadata Command', () => {
    let mockRegistryService: jest.Mocked<RegistryService>;
    let mockRefresh: jest.Mock;
    let mockShowQuickPick: jest.Mock;
    let mockShowInputBox: jest.Mock;
    let mockShowInformationMessage: jest.Mock;
    let mockShowErrorMessage: jest.Mock;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock registry service
        mockRegistryService = {
            updateGroupMetadata: jest.fn(),
            updateArtifactMetadata: jest.fn(),
            updateVersionMetadata: jest.fn(),
            getGroupMetadataDetailed: jest.fn(),
            getArtifactMetadataDetailed: jest.fn(),
            getVersionMetadataDetailed: jest.fn()
        } as any;

        mockRefresh = jest.fn();

        // Setup vscode mocks
        mockShowQuickPick = vscode.window.showQuickPick as jest.Mock;
        mockShowInputBox = vscode.window.showInputBox as jest.Mock;
        mockShowInformationMessage = vscode.window.showInformationMessage as jest.Mock;
        mockShowErrorMessage = vscode.window.showErrorMessage as jest.Mock;
    });

    describe('Group Metadata Editing', () => {
        it('should edit group description', async () => {
            const groupNode = new RegistryItem('test-group', RegistryItemType.Group, 'test-group', {
                description: 'Old description'
            });

            // User selects "Edit Description"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Edit Description', value: 'description' });

            // User enters new description
            mockShowInputBox.mockResolvedValueOnce('New description');

            // Mock get metadata to return current metadata
            mockRegistryService.getGroupMetadataDetailed.mockResolvedValueOnce({
                groupId: 'test-group',
                description: 'Old description',
                labels: {}
            });

            await editMetadataCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockRegistryService.updateGroupMetadata).toHaveBeenCalledWith(
                'test-group',
                { description: 'New description', labels: {} }
            );
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('updated successfully')
            );
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should add label to group', async () => {
            const groupNode = new RegistryItem('test-group', RegistryItemType.Group, 'test-group', {
                labels: { existing: 'label' }
            });

            // User selects "Manage Labels"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Manage Labels', value: 'labels' });

            // User selects "Add Label"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Add Label', value: 'add' });

            // User enters new label
            mockShowInputBox.mockResolvedValueOnce('environment=production');

            // User selects "Done"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Done', value: 'done' });

            // Mock get metadata
            mockRegistryService.getGroupMetadataDetailed.mockResolvedValueOnce({
                groupId: 'test-group',
                labels: { existing: 'label' }
            });

            await editMetadataCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockRegistryService.updateGroupMetadata).toHaveBeenCalledWith(
                'test-group',
                {
                    labels: {
                        existing: 'label',
                        environment: 'production'
                    }
                }
            );
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should remove label from group', async () => {
            const groupNode = new RegistryItem('test-group', RegistryItemType.Group, 'test-group', {
                labels: { environment: 'production', team: 'backend' }
            });

            // User selects "Manage Labels"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Manage Labels', value: 'labels' });

            // User selects "Remove Label"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Remove Label', value: 'remove' });

            // User selects label to remove
            mockShowQuickPick.mockResolvedValueOnce({ label: 'environment=production', value: 'environment' });

            // User selects "Done"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Done', value: 'done' });

            // Mock get metadata
            mockRegistryService.getGroupMetadataDetailed.mockResolvedValueOnce({
                groupId: 'test-group',
                labels: { environment: 'production', team: 'backend' }
            });

            await editMetadataCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockRegistryService.updateGroupMetadata).toHaveBeenCalledWith(
                'test-group',
                {
                    labels: {
                        team: 'backend'
                    }
                }
            );
            expect(mockRefresh).toHaveBeenCalled();
        });
    });

    describe('Artifact Metadata Editing', () => {
        it('should edit artifact name', async () => {
            const artifactNode = new RegistryItem('user-api', RegistryItemType.Artifact, 'user-api', {
                name: 'Old Name',
                artifactType: 'OPENAPI'
            }, 'default', 'default');

            // User selects "Edit Name"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Edit Name', value: 'name' });

            // User enters new name
            mockShowInputBox.mockResolvedValueOnce('New Name');

            // Mock get metadata
            mockRegistryService.getArtifactMetadataDetailed.mockResolvedValueOnce({
                artifactId: 'user-api',
                name: 'Old Name',
                description: '',
                labels: {}
            });

            await editMetadataCommand(mockRegistryService, mockRefresh, artifactNode);

            expect(mockRegistryService.updateArtifactMetadata).toHaveBeenCalledWith(
                'default',
                'user-api',
                { name: 'New Name', description: '', labels: {} }
            );
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should edit artifact description and labels', async () => {
            const artifactNode = new RegistryItem('user-api', RegistryItemType.Artifact, 'user-api', {
                description: 'Old description',
                labels: {}
            }, 'default', 'default');

            // User selects "Edit Description"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Edit Description', value: 'description' });

            // User enters new description
            mockShowInputBox.mockResolvedValueOnce('New description');

            // Mock get metadata
            mockRegistryService.getArtifactMetadataDetailed.mockResolvedValueOnce({
                artifactId: 'user-api',
                description: 'Old description',
                labels: {}
            });

            await editMetadataCommand(mockRegistryService, mockRefresh, artifactNode);

            expect(mockRegistryService.updateArtifactMetadata).toHaveBeenCalledWith(
                'default',
                'user-api',
                { description: 'New description', labels: {} }
            );
            expect(mockRefresh).toHaveBeenCalled();
        });
    });

    describe('Version Metadata Editing', () => {
        it('should edit version name', async () => {
            const versionNode = new RegistryItem('1.0.0', RegistryItemType.Version, '1.0.0', {
                name: 'Old Name',
                versionId: '1.0.0'
            }, 'user-api', 'default');

            // User selects "Edit Name"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Edit Name', value: 'name' });

            // User enters new name
            mockShowInputBox.mockResolvedValueOnce('Version 1.0.0 - Stable');

            // Mock get metadata
            mockRegistryService.getVersionMetadataDetailed.mockResolvedValueOnce({
                version: '1.0.0',
                name: 'Old Name',
                description: '',
                labels: {}
            });

            await editMetadataCommand(mockRegistryService, mockRefresh, versionNode);

            expect(mockRegistryService.updateVersionMetadata).toHaveBeenCalledWith(
                'default',
                'user-api',
                '1.0.0',
                { name: 'Version 1.0.0 - Stable', description: '', labels: {} }
            );
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should edit version labels', async () => {
            const versionNode = new RegistryItem('1.0.0', RegistryItemType.Version, '1.0.0', {
                labels: { status: 'draft' }
            }, 'user-api', 'default');

            // User selects "Manage Labels"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Manage Labels', value: 'labels' });

            // User selects "Add Label"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Add Label', value: 'add' });

            // User enters new label
            mockShowInputBox.mockResolvedValueOnce('reviewed=true');

            // User selects "Done"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Done', value: 'done' });

            // Mock get metadata
            mockRegistryService.getVersionMetadataDetailed.mockResolvedValueOnce({
                version: '1.0.0',
                labels: { status: 'draft' }
            });

            await editMetadataCommand(mockRegistryService, mockRefresh, versionNode);

            expect(mockRegistryService.updateVersionMetadata).toHaveBeenCalledWith(
                'default',
                'user-api',
                '1.0.0',
                {
                    labels: {
                        status: 'draft',
                        reviewed: 'true'
                    }
                }
            );
            expect(mockRefresh).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle missing group ID', async () => {
            const invalidNode = new RegistryItem('invalid', RegistryItemType.Group, undefined);

            await editMetadataCommand(mockRegistryService, mockRefresh, invalidNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Invalid node')
            );
            expect(mockRegistryService.updateGroupMetadata).not.toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const groupNode = new RegistryItem('test-group', RegistryItemType.Group, 'test-group');

            // User selects "Edit Description"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Edit Description', value: 'description' });

            // User enters new description
            mockShowInputBox.mockResolvedValueOnce('New description');

            // Mock get metadata
            mockRegistryService.getGroupMetadataDetailed.mockResolvedValueOnce({
                groupId: 'test-group',
                labels: {}
            });

            // Mock update to fail
            mockRegistryService.updateGroupMetadata.mockRejectedValueOnce(
                new Error('Group not found')
            );

            await editMetadataCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Group not found')
            );
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should validate label format', async () => {
            const groupNode = new RegistryItem('test-group', RegistryItemType.Group, 'test-group', {
                labels: {}
            });

            // User selects "Manage Labels"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Manage Labels', value: 'labels' });

            // User selects "Add Label"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Add Label', value: 'add' });

            // User enters invalid label (no =)
            mockShowInputBox.mockResolvedValueOnce('invalid-label');

            // User selects "Done"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Done', value: 'done' });

            // Mock get metadata
            mockRegistryService.getGroupMetadataDetailed.mockResolvedValueOnce({
                groupId: 'test-group',
                labels: {}
            });

            await editMetadataCommand(mockRegistryService, mockRefresh, groupNode);

            // Should not call update because validation failed
            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('format')
            );
        });

        it('should prevent duplicate label keys', async () => {
            const groupNode = new RegistryItem('test-group', RegistryItemType.Group, 'test-group', {
                labels: { environment: 'production' }
            });

            // User selects "Manage Labels"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Manage Labels', value: 'labels' });

            // User selects "Add Label"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Add Label', value: 'add' });

            // User enters duplicate key
            mockShowInputBox.mockResolvedValueOnce('environment=staging');

            // User selects "Done"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Done', value: 'done' });

            // Mock get metadata
            mockRegistryService.getGroupMetadataDetailed.mockResolvedValueOnce({
                groupId: 'test-group',
                labels: { environment: 'production' }
            });

            await editMetadataCommand(mockRegistryService, mockRefresh, groupNode);

            // Should show warning about duplicate key
            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('already exists')
            );
        });
    });

    describe('User Cancellation', () => {
        it('should handle user cancellation at menu selection', async () => {
            const groupNode = new RegistryItem('test-group', RegistryItemType.Group, 'test-group');

            // User cancels at menu selection
            mockShowQuickPick.mockResolvedValueOnce(undefined);

            await editMetadataCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockRegistryService.updateGroupMetadata).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle user cancellation during input', async () => {
            const groupNode = new RegistryItem('test-group', RegistryItemType.Group, 'test-group');

            // User selects "Edit Description"
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Edit Description', value: 'description' });

            // User cancels input
            mockShowInputBox.mockResolvedValueOnce(undefined);

            await editMetadataCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockRegistryService.updateGroupMetadata).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });
    });
});
