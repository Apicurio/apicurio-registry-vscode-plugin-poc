import * as vscode from 'vscode';
import * as fs from 'fs';
import { RegistryService } from '../../services/registryService';
import { RegistryItem, RegistryItemType } from '../../models/registryModels';
import { downloadContentCommand } from '../downloadCommand';

// Mock fs module
jest.mock('fs');

describe('Download Command', () => {
    let mockService: jest.Mocked<RegistryService>;
    let mockShowSaveDialog: jest.SpyInstance;
    let mockShowInformationMessage: jest.SpyInstance;
    let mockShowErrorMessage: jest.SpyInstance;
    let mockWriteFileSync: jest.SpyInstance;

    beforeEach(() => {
        // Create mock service
        mockService = {
            getArtifactContent: jest.fn().mockResolvedValue({
                content: 'openapi: 3.0.0\ninfo:\n  title: Test API',
                contentType: 'application/x-yaml',
                artifactType: 'OPENAPI'
            }),
            getVersions: jest.fn().mockResolvedValue([
                { version: '1.0.0', globalId: 1 }
            ])
        } as any;

        // Mock VSCode APIs
        mockShowSaveDialog = jest.spyOn(vscode.window, 'showSaveDialog').mockResolvedValue(
            vscode.Uri.file('/tmp/test-api.yaml')
        );
        mockShowInformationMessage = jest.spyOn(vscode.window, 'showInformationMessage').mockResolvedValue(undefined);
        mockShowErrorMessage = jest.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined);

        // Mock fs
        mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe('downloadContentCommand - Artifact', () => {
        it('should download OpenAPI artifact with .yaml extension', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            await downloadContentCommand(mockService, mockNode);

            expect(mockShowSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    path: expect.stringContaining('test-api.yaml')
                }),
                filters: {
                    'YAML files': ['yaml', 'yml'],
                    'All files': ['*']
                }
            });
            expect(mockWriteFileSync).toHaveBeenCalledWith(
                '/tmp/test-api.yaml',
                'openapi: 3.0.0\ninfo:\n  title: Test API',
                'utf8'
            );
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                'Content downloaded successfully',
                'Open File'
            );
        });

        it('should download JSON artifact with .json extension', async () => {
            const mockNode = new RegistryItem(
                'test-schema',
                RegistryItemType.Artifact,
                'test-schema',
                { artifactType: 'JSON', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockService.getArtifactContent.mockResolvedValue({
                content: '{"type": "object"}',
                contentType: 'application/json',
                artifactType: 'JSON'
            });

            await downloadContentCommand(mockService, mockNode);

            expect(mockShowSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    path: expect.stringContaining('test-schema.json')
                }),
                filters: {
                    'JSON files': ['json'],
                    'All files': ['*']
                }
            });
        });

        it('should download Avro schema with .avsc extension', async () => {
            const mockNode = new RegistryItem(
                'user-schema',
                RegistryItemType.Artifact,
                'user-schema',
                { artifactType: 'AVRO', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockService.getArtifactContent.mockResolvedValue({
                content: '{"type": "record", "name": "User"}',
                contentType: 'application/json',
                artifactType: 'AVRO'
            });

            await downloadContentCommand(mockService, mockNode);

            expect(mockShowSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    path: expect.stringContaining('user-schema.avsc')
                }),
                filters: {
                    'Avro files': ['avsc'],
                    'All files': ['*']
                }
            });
        });

        it('should download Protobuf with .proto extension', async () => {
            const mockNode = new RegistryItem(
                'messages',
                RegistryItemType.Artifact,
                'messages',
                { artifactType: 'PROTOBUF', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockService.getArtifactContent.mockResolvedValue({
                content: 'syntax = "proto3";',
                contentType: 'application/x-protobuf',
                artifactType: 'PROTOBUF'
            });

            await downloadContentCommand(mockService, mockNode);

            expect(mockShowSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    path: expect.stringContaining('messages.proto')
                }),
                filters: {
                    'Protobuf files': ['proto'],
                    'All files': ['*']
                }
            });
        });

        it('should handle user cancellation (no save location)', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockShowSaveDialog.mockResolvedValue(undefined);

            await downloadContentCommand(mockService, mockNode);

            expect(mockWriteFileSync).not.toHaveBeenCalled();
            expect(mockShowInformationMessage).not.toHaveBeenCalled();
        });

        it('should handle file write errors', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockWriteFileSync.mockImplementation(() => {
                throw new Error('EACCES: permission denied');
            });

            await downloadContentCommand(mockService, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                'Failed to download content: EACCES: permission denied'
            );
        });

        it('should handle API errors', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockService.getArtifactContent.mockRejectedValue(new Error('Network error'));

            await downloadContentCommand(mockService, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                'Failed to download content: Network error'
            );
            expect(mockWriteFileSync).not.toHaveBeenCalled();
        });
    });

    describe('downloadContentCommand - Version', () => {
        it('should download specific version with version in filename', async () => {
            const mockNode = new RegistryItem(
                '1.0.0',
                RegistryItemType.Version,
                '1.0.0',
                { state: 'ENABLED' },
                'test-api',
                'test-group'
            );

            // Need to get artifact metadata for type
            mockService.getArtifactContent.mockResolvedValue({
                content: 'openapi: 3.0.0',
                contentType: 'application/x-yaml',
                artifactType: 'OPENAPI'
            });

            await downloadContentCommand(mockService, mockNode);

            expect(mockService.getArtifactContent).toHaveBeenCalledWith('test-group', 'test-api', '1.0.0');
            expect(mockShowSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    path: expect.stringContaining('test-api-1.0.0.yaml')
                }),
                filters: {
                    'YAML files': ['yaml', 'yml'],
                    'All files': ['*']
                }
            });
        });

        it('should handle version download with different artifact types', async () => {
            const mockNode = new RegistryItem(
                '2.0.0',
                RegistryItemType.Version,
                '2.0.0',
                { state: 'ENABLED' },
                'user-schema',
                'test-group'
            );

            mockService.getArtifactContent.mockResolvedValue({
                content: '{"type": "record"}',
                contentType: 'application/json',
                artifactType: 'AVRO'
            });

            await downloadContentCommand(mockService, mockNode);

            expect(mockShowSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    path: expect.stringContaining('user-schema-2.0.0.avsc')
                }),
                filters: {
                    'Avro files': ['avsc'],
                    'All files': ['*']
                }
            });
        });
    });

    describe('Extension mapping', () => {
        const testCases = [
            { type: 'OPENAPI', expected: 'yaml', filterLabel: 'YAML files', filterExt: ['yaml', 'yml'] },
            { type: 'ASYNCAPI', expected: 'yaml', filterLabel: 'YAML files', filterExt: ['yaml', 'yml'] },
            { type: 'JSON', expected: 'json', filterLabel: 'JSON files', filterExt: ['json'] },
            { type: 'AVRO', expected: 'avsc', filterLabel: 'Avro files', filterExt: ['avsc'] },
            { type: 'PROTOBUF', expected: 'proto', filterLabel: 'Protobuf files', filterExt: ['proto'] },
            { type: 'GRAPHQL', expected: 'graphql', filterLabel: 'GraphQL files', filterExt: ['graphql'] },
            { type: 'XSD', expected: 'xsd', filterLabel: 'XSD files', filterExt: ['xsd'] },
            { type: 'WSDL', expected: 'wsdl', filterLabel: 'WSDL files', filterExt: ['wsdl'] },
            { type: 'KCONNECT', expected: 'json', filterLabel: 'JSON files', filterExt: ['json'] },
        ];

        testCases.forEach(({ type, expected }) => {
            it(`should map ${type} to .${expected} extension`, async () => {
                const mockNode = new RegistryItem(
                    'test',
                    RegistryItemType.Artifact,
                    'test',
                    { artifactType: type, state: 'ENABLED' },
                    'test-group',
                    'test-group'
                );

                mockService.getArtifactContent.mockResolvedValue({
                    content: 'content',
                    contentType: 'text/plain',
                    artifactType: type
                });

                await downloadContentCommand(mockService, mockNode);

                expect(mockShowSaveDialog).toHaveBeenCalledWith(
                    expect.objectContaining({
                        defaultUri: expect.objectContaining({
                            path: expect.stringContaining(`.${expected}`)
                        })
                    })
                );
            });
        });
    });
});
