import * as vscode from 'vscode';
import {
    openArtifactCommand,
    openVersionCommand
} from '../openCommands';
import { RegistryService } from '../../services/registryService';
import { RegistryItem, RegistryItemType } from '../../models/registryModels';

// Mock vscode
jest.mock('vscode');

// Mock RegistryService
jest.mock('../../services/registryService');

describe('Open Commands', () => {
    let mockService: jest.Mocked<RegistryService>;
    let mockShowTextDocument: jest.SpyInstance;
    let mockShowErrorMessage: jest.SpyInstance;
    let mockWithProgress: jest.SpyInstance;

    beforeEach(() => {
        // Create mock service
        mockService = new RegistryService() as jest.Mocked<RegistryService>;

        // Mock VSCode functions
        mockShowTextDocument = jest.spyOn(vscode.workspace, 'openTextDocument').mockResolvedValue({} as any);
        mockShowErrorMessage = jest.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined);
        mockWithProgress = jest.spyOn(vscode.window, 'withProgress').mockImplementation((options, task) => task({ report: jest.fn() }, {} as any));

        // Mock ViewColumn
        (vscode.ViewColumn as any) = { One: 1, Two: 2, Three: 3 };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('openArtifactCommand', () => {
        it('should fetch and open artifact content in editor', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'test-artifact',
                RegistryItemType.Artifact,
                'test-artifact',
                { artifactType: 'OPENAPI' },
                'test-group'
            );

            const mockVersions = [
                { version: '1.0.0', globalId: 1 },
                { version: '2.0.0', globalId: 2 }
            ];

            const mockContent = {
                content: 'openapi: 3.0.0\ninfo:\n  title: Test API',
                contentType: 'application/x-yaml',
                artifactType: 'OPENAPI'
            };

            mockService.getVersions = jest.fn().mockResolvedValue(mockVersions);
            mockService.getArtifactContent = jest.fn().mockResolvedValue(mockContent);

            // Act
            await openArtifactCommand(mockService, mockNode);

            // Assert
            expect(mockWithProgress).toHaveBeenCalled();
            expect(mockService.getVersions).toHaveBeenCalledWith('test-group', 'test-artifact');
            expect(mockService.getArtifactContent).toHaveBeenCalledWith('test-group', 'test-artifact', '2.0.0');
            expect(mockShowTextDocument).toHaveBeenCalled();
        });

        it('should determine correct language from artifact type', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'test-artifact',
                RegistryItemType.Artifact,
                'test-artifact',
                { artifactType: 'JSON' },
                'test-group'
            );

            const mockVersions = [
                { version: '1.0.0', globalId: 1 }
            ];

            const mockContent = {
                content: '{"type": "object"}',
                contentType: 'application/json',
                artifactType: 'JSON'
            };

            mockService.getVersions = jest.fn().mockResolvedValue(mockVersions);
            mockService.getArtifactContent = jest.fn().mockResolvedValue(mockContent);

            // Act
            await openArtifactCommand(mockService, mockNode);

            // Assert
            expect(mockShowTextDocument).toHaveBeenCalledWith(
                expect.objectContaining({
                    language: 'json'
                })
            );
        });

        it('should show error when artifact ID is missing', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'Test Artifact',
                RegistryItemType.Artifact,
                undefined, // missing ID
                undefined,
                'test-group'
            );

            // Act
            await openArtifactCommand(mockService, mockNode);

            // Assert
            expect(mockService.getArtifactContent).not.toHaveBeenCalled();
            expect(mockShowErrorMessage).toHaveBeenCalledWith('Missing artifact information');
        });

        it('should handle API errors gracefully', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'test-artifact',
                RegistryItemType.Artifact,
                'test-artifact',
                undefined,
                'test-group'
            );

            mockService.getVersions = jest.fn().mockRejectedValue(new Error('Network error'));

            // Act
            await openArtifactCommand(mockService, mockNode);

            // Assert
            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Failed to open artifact')
            );
        });
    });

    describe('openVersionCommand', () => {
        it('should fetch and open specific version content', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                '1.0.0',
                RegistryItemType.Version,
                '1.0.0',
                { artifactType: 'AVRO' },
                'test-artifact',
                'test-group'
            );

            const mockContent = {
                content: '{"type": "record", "name": "User"}',
                contentType: 'application/json',
                artifactType: 'AVRO'
            };

            mockService.getArtifactContent = jest.fn().mockResolvedValue(mockContent);

            // Act
            await openVersionCommand(mockService, mockNode);

            // Assert
            expect(mockService.getArtifactContent).toHaveBeenCalledWith('test-group', 'test-artifact', '1.0.0');
            expect(mockShowTextDocument).toHaveBeenCalled();
        });

        it('should show error when version information is missing', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                'Unknown',
                RegistryItemType.Version,
                undefined, // missing version
                undefined,
                'test-artifact',
                'test-group'
            );

            // Act
            await openVersionCommand(mockService, mockNode);

            // Assert
            expect(mockService.getArtifactContent).not.toHaveBeenCalled();
            expect(mockShowErrorMessage).toHaveBeenCalledWith('Missing version information');
        });

        it('should set correct language based on content type', async () => {
            // Arrange
            const mockNode = new RegistryItem(
                '2.0.0',
                RegistryItemType.Version,
                '2.0.0',
                undefined,
                'test-artifact',
                'test-group'
            );

            const mockContent = {
                content: '<schema></schema>',
                contentType: 'application/xml',
                artifactType: 'XSD'
            };

            mockService.getArtifactContent = jest.fn().mockResolvedValue(mockContent);

            // Act
            await openVersionCommand(mockService, mockNode);

            // Assert
            expect(mockShowTextDocument).toHaveBeenCalledWith(
                expect.objectContaining({
                    language: 'xml'
                })
            );
        });
    });

    describe('Language Detection', () => {
        it.each([
            ['OPENAPI', 'yaml'],
            ['ASYNCAPI', 'yaml'],
            ['JSON', 'json'],
            ['AVRO', 'json'],
            ['PROTOBUF', 'protobuf'],
            ['GRAPHQL', 'graphql'],
            ['XSD', 'xml'],
            ['WSDL', 'xml'],
            ['KCONNECT', 'json']
        ])('should map %s artifact type to %s language', async (artifactType, expectedLanguage) => {
            // Arrange
            const mockNode = new RegistryItem(
                'test',
                RegistryItemType.Artifact,
                'test',
                { artifactType },
                'group'
            );

            const mockVersions = [
                { version: '1.0.0', globalId: 1 }
            ];

            const mockContent = {
                content: 'content',
                contentType: 'text/plain',
                artifactType
            };

            mockService.getVersions = jest.fn().mockResolvedValue(mockVersions);
            mockService.getArtifactContent = jest.fn().mockResolvedValue(mockContent);

            // Act
            await openArtifactCommand(mockService, mockNode);

            // Assert
            expect(mockShowTextDocument).toHaveBeenCalledWith(
                expect.objectContaining({
                    language: expectedLanguage
                })
            );
        });
    });
});
