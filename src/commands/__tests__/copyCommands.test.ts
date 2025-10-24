import * as vscode from 'vscode';
import {
    copyGroupIdCommand,
    copyArtifactIdCommand,
    copyVersionCommand,
    copyFullReferenceCommand
} from '../copyCommands';
import { RegistryItem, RegistryItemType } from '../../models/registryModels';

// Mock vscode
jest.mock('vscode');

describe('Copy Commands', () => {
    let mockWriteText: jest.SpyInstance;
    let mockShowInformationMessage: jest.SpyInstance;
    let mockShowErrorMessage: jest.SpyInstance;

    beforeEach(() => {
        // Mock clipboard API
        mockWriteText = jest.spyOn(vscode.env.clipboard, 'writeText').mockResolvedValue();

        // Mock window functions
        mockShowInformationMessage = jest.spyOn(vscode.window, 'showInformationMessage').mockResolvedValue(undefined);
        mockShowErrorMessage = jest.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('copyGroupIdCommand', () => {
        it('should copy group ID to clipboard', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'test-group',
                RegistryItemType.Group,
                'test-group'
            );

            // Act
            await copyGroupIdCommand(mockNode);

            // Assert
            expect(mockWriteText).toHaveBeenCalledTimes(1);
            expect(mockWriteText).toHaveBeenCalledWith('test-group');
            expect(mockShowInformationMessage).toHaveBeenCalledTimes(1);
            expect(mockShowInformationMessage).toHaveBeenCalledWith('Copied group ID: test-group');
        });

        it('should show error when group ID is missing', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'Test Group',
                RegistryItemType.Group
            );

            // Act
            await copyGroupIdCommand(mockNode);

            // Assert
            expect(mockWriteText).not.toHaveBeenCalled();
            expect(mockShowErrorMessage).toHaveBeenCalledTimes(1);
            expect(mockShowErrorMessage).toHaveBeenCalledWith('No group ID available');
        });

        it('should handle URL-encoded group IDs correctly', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'group/with/slashes',
                RegistryItemType.Group,
                'group/with/slashes'
            );

            // Act
            await copyGroupIdCommand(mockNode);

            // Assert
            expect(mockWriteText).toHaveBeenCalledWith('group/with/slashes');
        });
    });

    describe('copyArtifactIdCommand', () => {
        it('should copy artifact ID to clipboard', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'test-artifact',
                RegistryItemType.Artifact,
                'test-artifact', // id
                undefined, // metadata
                'test-group' // parentId (groupId for artifacts)
            );

            // Act
            await copyArtifactIdCommand(mockNode);

            // Assert
            expect(mockWriteText).toHaveBeenCalledTimes(1);
            expect(mockWriteText).toHaveBeenCalledWith('test-artifact');
            expect(mockShowInformationMessage).toHaveBeenCalledWith('Copied artifact ID: test-artifact');
        });

        it('should show error when artifact ID is missing', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'Test Artifact',
                RegistryItemType.Artifact,
                undefined, // id missing
                undefined,
                'test-group'
            );

            // Act
            await copyArtifactIdCommand(mockNode);

            // Assert
            expect(mockWriteText).not.toHaveBeenCalled();
            expect(mockShowErrorMessage).toHaveBeenCalledWith('No artifact ID available');
        });
    });

    describe('copyVersionCommand', () => {
        it('should copy version to clipboard', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                '1.0.0',
                RegistryItemType.Version,
                '1.0.0', // id (version string)
                undefined, // metadata
                'test-artifact', // parentId (artifactId for versions)
                'test-group' // groupId
            );

            // Act
            await copyVersionCommand(mockNode);

            // Assert
            expect(mockWriteText).toHaveBeenCalledTimes(1);
            expect(mockWriteText).toHaveBeenCalledWith('1.0.0');
            expect(mockShowInformationMessage).toHaveBeenCalledWith('Copied version: 1.0.0');
        });

        it('should show error when version is missing', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'Unknown',
                RegistryItemType.Version,
                undefined, // id missing
                undefined,
                'test-artifact',
                'test-group'
            );

            // Act
            await copyVersionCommand(mockNode);

            // Assert
            expect(mockWriteText).not.toHaveBeenCalled();
            expect(mockShowErrorMessage).toHaveBeenCalledWith('No version available');
        });
    });

    describe('copyFullReferenceCommand', () => {
        it('should copy full reference for artifact (group:artifact)', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'test-artifact',
                RegistryItemType.Artifact,
                'test-artifact', // id
                undefined, // metadata
                'test-group' // parentId (groupId)
            );

            // Act
            await copyFullReferenceCommand(mockNode);

            // Assert
            expect(mockWriteText).toHaveBeenCalledTimes(1);
            expect(mockWriteText).toHaveBeenCalledWith('test-group:test-artifact');
            expect(mockShowInformationMessage).toHaveBeenCalledWith('Copied reference: test-group:test-artifact');
        });

        it('should copy full reference for version (group:artifact:version)', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                '1.0.0',
                RegistryItemType.Version,
                '1.0.0', // id (version)
                undefined, // metadata
                'test-artifact', // parentId (artifactId)
                'test-group' // groupId
            );

            // Act
            await copyFullReferenceCommand(mockNode);

            // Assert
            expect(mockWriteText).toHaveBeenCalledTimes(1);
            expect(mockWriteText).toHaveBeenCalledWith('test-group:test-artifact:1.0.0');
            expect(mockShowInformationMessage).toHaveBeenCalledWith('Copied reference: test-group:test-artifact:1.0.0');
        });

        it('should show error when required IDs are missing for artifact', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'Test Artifact',
                RegistryItemType.Artifact,
                undefined, // id missing
                undefined,
                'test-group'
            );

            // Act
            await copyFullReferenceCommand(mockNode);

            // Assert
            expect(mockWriteText).not.toHaveBeenCalled();
            expect(mockShowErrorMessage).toHaveBeenCalledWith('Missing required information for full reference');
        });

        it('should show error for unsupported node types', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'Test Group',
                RegistryItemType.Group,
                'test-group'
            );

            // Act
            await copyFullReferenceCommand(mockNode);

            // Assert
            expect(mockWriteText).not.toHaveBeenCalled();
            expect(mockShowErrorMessage).toHaveBeenCalledWith('Can only copy full reference for artifacts and versions');
        });
    });
});
