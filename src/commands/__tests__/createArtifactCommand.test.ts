import * as vscode from 'vscode';
import { createArtifactCommand, GroupSelectionMode } from '../createArtifactCommand';
import { RegistryService } from '../../services/registryService';
import { RegistryTreeDataProvider } from '../../providers/registryTreeProvider';
import { ArtifactType } from '../../models/registryModels';

// Mock VSCode
jest.mock('vscode');
jest.mock('mime-types');

describe('createArtifactCommand', () => {
    let mockRegistryService: jest.Mocked<RegistryService>;
    let mockTreeProvider: jest.Mocked<RegistryTreeDataProvider>;
    let mockShowQuickPick: jest.MockedFunction<typeof vscode.window.showQuickPick>;
    let mockShowInputBox: jest.MockedFunction<typeof vscode.window.showInputBox>;
    let mockShowErrorMessage: jest.MockedFunction<typeof vscode.window.showErrorMessage>;
    let mockShowInformationMessage: jest.MockedFunction<typeof vscode.window.showInformationMessage>;
    let mockWithProgress: jest.MockedFunction<typeof vscode.window.withProgress>;
    let mockShowSaveDialog: jest.MockedFunction<typeof vscode.window.showSaveDialog>;
    let mockFindFiles: jest.MockedFunction<typeof vscode.workspace.findFiles>;
    let mockReadFile: jest.MockedFunction<typeof vscode.workspace.fs.readFile>;
    let mockStat: jest.MockedFunction<typeof vscode.workspace.fs.stat>;
    let mockExecuteCommand: jest.MockedFunction<typeof vscode.commands.executeCommand>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock RegistryService
        mockRegistryService = {
            isConnected: jest.fn(),
            getGroups: jest.fn(),
            createArtifact: jest.fn(),
            isDraftSupportEnabled: jest.fn()
        } as any;

        // Mock TreeDataProvider
        mockTreeProvider = {
            refresh: jest.fn()
        } as any;

        // Mock VSCode window methods
        mockShowQuickPick = vscode.window.showQuickPick as jest.MockedFunction<typeof vscode.window.showQuickPick>;
        mockShowInputBox = vscode.window.showInputBox as jest.MockedFunction<typeof vscode.window.showInputBox>;
        mockShowErrorMessage = vscode.window.showErrorMessage as jest.MockedFunction<typeof vscode.window.showErrorMessage>;
        mockShowInformationMessage = vscode.window.showInformationMessage as jest.MockedFunction<typeof vscode.window.showInformationMessage>;
        mockWithProgress = vscode.window.withProgress as jest.MockedFunction<typeof vscode.window.withProgress>;
        mockShowSaveDialog = vscode.window.showSaveDialog as jest.MockedFunction<typeof vscode.window.showSaveDialog>;

        // Mock VSCode workspace methods
        mockFindFiles = vscode.workspace.findFiles as jest.MockedFunction<typeof vscode.workspace.findFiles>;
        mockReadFile = vscode.workspace.fs.readFile as jest.MockedFunction<typeof vscode.workspace.fs.readFile>;
        mockStat = vscode.workspace.fs.stat as jest.MockedFunction<typeof vscode.workspace.fs.stat>;

        // Mock VSCode commands
        mockExecuteCommand = vscode.commands.executeCommand as jest.MockedFunction<typeof vscode.commands.executeCommand>;

        // Mock URI and related functions
        (vscode.Uri.file as jest.Mock) = jest.fn((path: string) => ({
            fsPath: path,
            path: path,
            scheme: 'file'
        }));
        (vscode.workspace.asRelativePath as jest.Mock) = jest.fn((uri: any) => uri.fsPath);

        // Mock workspace filesystem methods (needed for file selection tests)
        mockFindFiles = jest.fn() as any;
        mockReadFile = jest.fn() as any;
        mockStat = jest.fn() as any;
        (vscode.workspace as any).findFiles = mockFindFiles;
        (vscode.workspace as any).fs = {
            readFile: mockReadFile,
            stat: mockStat
        };
    });

    describe('Connection Check', () => {
        it('should show error when not connected to registry', async () => {
            mockRegistryService.isConnected.mockReturnValue(false);

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Please connect to a registry first')
            );
            expect(mockShowQuickPick).not.toHaveBeenCalled();
        });

        it('should continue when connected to registry', async () => {
            mockRegistryService.isConnected.mockReturnValue(true);
            mockShowQuickPick.mockResolvedValue(undefined); // User cancels at first step

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowQuickPick).toHaveBeenCalled();
        });
    });

    describe('Group Selection Mode', () => {
        beforeEach(() => {
            mockRegistryService.isConnected.mockReturnValue(true);
        });

        it('should allow selecting existing group mode', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ value: GroupSelectionMode.EXISTING } as any) // Group mode
                .mockResolvedValueOnce(undefined); // Cancel at group selection

            mockRegistryService.getGroups.mockResolvedValue([]);

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowQuickPick).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ value: GroupSelectionMode.EXISTING }),
                    expect.objectContaining({ value: GroupSelectionMode.NEW })
                ]),
                expect.any(Object)
            );
        });

        it('should allow selecting new group mode', async () => {
            mockShowQuickPick.mockResolvedValueOnce({ value: GroupSelectionMode.NEW } as any);
            mockShowInputBox.mockResolvedValueOnce(undefined); // Cancel at group ID input

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowInputBox).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: expect.stringContaining('Group ID')
                })
            );
        });

        it('should exit when user cancels group mode selection', async () => {
            mockShowQuickPick.mockResolvedValueOnce(undefined);

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowInputBox).not.toHaveBeenCalled();
            expect(mockRegistryService.createArtifact).not.toHaveBeenCalled();
        });
    });

    describe('Create New Group', () => {
        beforeEach(() => {
            mockRegistryService.isConnected.mockReturnValue(true);
            mockShowQuickPick.mockResolvedValueOnce({ value: GroupSelectionMode.NEW } as any);
        });

        it('should validate group ID format', async () => {
            mockShowInputBox.mockResolvedValueOnce('test-group');

            // Will cancel at next step
            mockShowQuickPick.mockResolvedValueOnce(undefined);

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            const inputBoxCall = mockShowInputBox.mock.calls[0]?.[0];
            expect(inputBoxCall?.validateInput).toBeDefined();

            // Test validation function
            const validate = inputBoxCall?.validateInput!;
            expect(validate('')).toBeTruthy(); // Empty is invalid
            expect(validate('invalid group!')).toBeTruthy(); // Special chars invalid
            expect(validate('valid-group.id_123')).toBeNull(); // Valid format
        });

        it('should reject empty group ID', async () => {
            mockShowInputBox.mockResolvedValueOnce('test-group');
            mockShowQuickPick.mockResolvedValueOnce(undefined);

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            const validate = mockShowInputBox.mock.calls[0]?.[0]?.validateInput!;
            expect(validate('   ')).toBeTruthy();
        });

        it('should reject group ID with invalid characters', async () => {
            mockShowInputBox.mockResolvedValueOnce('test-group');
            mockShowQuickPick.mockResolvedValueOnce(undefined);

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            const validate = mockShowInputBox.mock.calls[0]?.[0]?.validateInput!;
            expect(validate('group with spaces')).toBeTruthy();
            expect(validate('group@special')).toBeTruthy();
        });

        it('should reject group ID that is too long', async () => {
            mockShowInputBox.mockResolvedValueOnce('test-group');
            mockShowQuickPick.mockResolvedValueOnce(undefined);

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            const validate = mockShowInputBox.mock.calls[0]?.[0]?.validateInput!;
            const longId = 'a'.repeat(513);
            expect(validate(longId)).toBeTruthy();
        });
    });

    describe('Select Existing Group', () => {
        beforeEach(() => {
            mockRegistryService.isConnected.mockReturnValue(true);
            mockShowQuickPick.mockResolvedValueOnce({ value: GroupSelectionMode.EXISTING } as any);
        });

        it('should display list of existing groups', async () => {
            const mockGroups = [
                { groupId: 'group1', description: 'First group', artifactCount: 5 },
                { groupId: 'group2', description: 'Second group', artifactCount: 3 }
            ];
            mockRegistryService.getGroups.mockResolvedValue(mockGroups);
            mockShowQuickPick.mockResolvedValueOnce({ label: 'group1' } as any);
            mockShowQuickPick.mockResolvedValueOnce(undefined); // Cancel at artifact type

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowQuickPick).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ label: 'group1', detail: '5 artifact(s)' }),
                    expect.objectContaining({ label: 'group2', detail: '3 artifact(s)' })
                ]),
                expect.any(Object)
            );
        });

        it('should fallback to create new group when no groups exist', async () => {
            mockRegistryService.getGroups.mockResolvedValue([]);
            mockShowInputBox.mockResolvedValueOnce(undefined); // Cancel at group ID input

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowInputBox).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: expect.stringContaining('Group ID')
                })
            );
        });
    });

    describe('Artifact Type Selection', () => {
        beforeEach(() => {
            mockRegistryService.isConnected.mockReturnValue(true);
            mockShowQuickPick
                .mockResolvedValueOnce({ value: GroupSelectionMode.NEW } as any)
                .mockResolvedValueOnce(undefined); // Will be set per test
            mockShowInputBox.mockResolvedValueOnce('test-group');
        });

        it('should display all artifact types', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ value: GroupSelectionMode.NEW } as any)
                .mockResolvedValueOnce({ value: ArtifactType.OPENAPI } as any); // Artifact type
            mockShowInputBox
                .mockResolvedValueOnce('test-group')
                .mockResolvedValueOnce(undefined); // Cancel at artifact ID

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            const artifactTypeCall = mockShowQuickPick.mock.calls.find(call => {
                const items = call[0];
                return Array.isArray(items) && items.some((item: any) => item.value === ArtifactType.OPENAPI);
            });

            expect(artifactTypeCall).toBeDefined();
            expect(artifactTypeCall![0]).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ value: ArtifactType.OPENAPI }),
                    expect.objectContaining({ value: ArtifactType.AVRO }),
                    expect.objectContaining({ value: ArtifactType.PROTOBUF }),
                    expect.objectContaining({ value: ArtifactType.JSON }),
                    expect.objectContaining({ value: ArtifactType.ASYNCAPI }),
                    expect.objectContaining({ value: ArtifactType.GRAPHQL }),
                    expect.objectContaining({ value: ArtifactType.KCONNECT }),
                    expect.objectContaining({ value: ArtifactType.WSDL }),
                    expect.objectContaining({ value: ArtifactType.XSD })
                ])
            );
        });
    });

    describe('Artifact ID Input', () => {
        beforeEach(() => {
            mockRegistryService.isConnected.mockReturnValue(true);
            mockShowQuickPick
                .mockResolvedValueOnce({ value: GroupSelectionMode.NEW } as any)
                .mockResolvedValueOnce({ value: ArtifactType.OPENAPI } as any);
            mockShowInputBox
                .mockResolvedValueOnce('test-group')
                .mockResolvedValueOnce(''); // Empty artifact ID (optional)
        });

        it('should allow empty artifact ID for auto-generation', async () => {
            mockShowInputBox
                .mockResolvedValueOnce('test-group')
                .mockResolvedValueOnce('') // Empty artifact ID
                .mockResolvedValueOnce(undefined); // Cancel at version

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowInputBox).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: expect.stringContaining('Artifact ID')
                })
            );
        });

        it('should validate artifact ID format', async () => {
            mockShowInputBox
                .mockResolvedValueOnce('test-group')
                .mockResolvedValueOnce('my-artifact')
                .mockResolvedValueOnce(undefined);

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            const artifactIdCall = mockShowInputBox.mock.calls.find(call =>
                call[0]?.title?.includes('Artifact ID')
            );
            const validate = artifactIdCall?.[0]?.validateInput!;

            expect(validate('valid-artifact')).toBeNull();
            expect(validate('valid.artifact_123')).toBeNull();
            expect(validate('invalid artifact')).toBeTruthy(); // Spaces not allowed
            expect(validate('a'.repeat(513))).toBeTruthy(); // Too long
        });
    });

    describe('File Selection', () => {
        it('should search for files matching pattern', async () => {
            mockRegistryService.isConnected.mockReturnValue(true);

            const mockUri = vscode.Uri.file('/path/to/file.yaml');
            mockFindFiles.mockResolvedValue([mockUri]);
            mockStat.mockResolvedValue({ size: 1024, type: 1, ctime: 0, mtime: 0 });

            mockShowQuickPick
                .mockResolvedValueOnce({ value: GroupSelectionMode.NEW } as any)
                .mockResolvedValueOnce({ value: ArtifactType.OPENAPI } as any)
                .mockResolvedValueOnce({ uri: mockUri } as any) // File selection
                .mockResolvedValueOnce(undefined); // Cancel at labels

            mockShowInputBox
                .mockResolvedValueOnce('test-group') // Group ID
                .mockResolvedValueOnce('') // Artifact ID (empty)
                .mockResolvedValueOnce('') // Version (empty)
                .mockResolvedValueOnce('') // Name (empty)
                .mockResolvedValueOnce('') // Description (empty)
                .mockResolvedValueOnce('**/*.yaml'); // File pattern

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            expect(mockFindFiles).toHaveBeenCalledWith('**/*.yaml');
        });

        it('should show warning when no files found', async () => {
            mockRegistryService.isConnected.mockReturnValue(true);
            mockFindFiles.mockResolvedValue([]);

            mockShowQuickPick
                .mockResolvedValueOnce({ value: GroupSelectionMode.NEW } as any)
                .mockResolvedValueOnce({ value: ArtifactType.OPENAPI } as any);

            mockShowInputBox
                .mockResolvedValueOnce('test-group')
                .mockResolvedValueOnce('')
                .mockResolvedValueOnce('')
                .mockResolvedValueOnce('')
                .mockResolvedValueOnce('')
                .mockResolvedValueOnce('**/*.yaml');

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('No files found')
            );
        });
    });

    describe('Complete Artifact Creation', () => {
        beforeEach(() => {
            mockRegistryService.isConnected.mockReturnValue(true);
            mockRegistryService.isDraftSupportEnabled.mockResolvedValue(false);
            mockRegistryService.createArtifact.mockResolvedValue({
                artifact: {
                    groupId: 'test-group',
                    artifactId: 'test-artifact'
                },
                version: {
                    version: '1.0.0'
                }
            } as any);

            // Setup file mocks
            const mockUri = vscode.Uri.file('/path/to/api.yaml');
            mockFindFiles.mockResolvedValue([mockUri]);
            mockStat.mockResolvedValue({ size: 1024, type: 1, ctime: 0, mtime: 0 });
            mockReadFile.mockResolvedValue(new Uint8Array(Buffer.from('openapi: 3.0.0')));

            // Setup complete flow
            mockShowQuickPick
                .mockResolvedValueOnce({ value: GroupSelectionMode.NEW } as any) // Group mode
                .mockResolvedValueOnce({ value: ArtifactType.OPENAPI } as any) // Artifact type
                .mockResolvedValueOnce({ uri: mockUri } as any) // File selection
                .mockResolvedValueOnce({ value: 'continue' } as any) // Labels (skip)
                .mockResolvedValueOnce({ value: true } as any); // Confirm creation

            mockShowInputBox
                .mockResolvedValueOnce('test-group') // Group ID
                .mockResolvedValueOnce('test-artifact') // Artifact ID
                .mockResolvedValueOnce('1.0.0') // Version
                .mockResolvedValueOnce('Test API') // Name
                .mockResolvedValueOnce('Description') // Description
                .mockResolvedValueOnce('**/*.yaml'); // File search pattern

            mockWithProgress.mockImplementation(async (_options, task) => {
                return await task({ report: jest.fn() } as any, {} as any);
            });
        });

        it('should create artifact successfully', async () => {
            mockShowInformationMessage.mockResolvedValue(undefined);

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.createArtifact).toHaveBeenCalledWith(
                'test-group',
                expect.objectContaining({
                    artifactId: 'test-artifact',
                    artifactType: ArtifactType.OPENAPI,
                    name: 'Test API',
                    description: 'Description'
                })
            );
        });

        it('should refresh tree after creation', async () => {
            mockShowInformationMessage.mockResolvedValue(undefined);

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            expect(mockTreeProvider.refresh).toHaveBeenCalled();
        });

        it('should show success message', async () => {
            mockShowInformationMessage.mockResolvedValue(undefined);

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Artifact created'),
                'View in Tree',
                'Create Another'
            );
        });

        it('should handle rule violation errors', async () => {
            const ruleError = new Error('Rule violation');
            mockRegistryService.createArtifact.mockRejectedValue(ruleError);

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            // Rule error handler is async imported, so we just verify no crash
            expect(mockTreeProvider.refresh).not.toHaveBeenCalled();
        });
    });

    describe('Draft Mode Selection', () => {
        beforeEach(() => {
            mockRegistryService.isConnected.mockReturnValue(true);
        });

        it('should skip draft selection when not supported', async () => {
            const mockUri = vscode.Uri.file('/path/to/api.yaml');
            mockFindFiles.mockResolvedValue([mockUri]);
            mockStat.mockResolvedValue({ size: 1024, type: 1, ctime: 0, mtime: 0 });
            mockReadFile.mockResolvedValue(new Uint8Array(Buffer.from('test')));

            mockRegistryService.isDraftSupportEnabled.mockResolvedValue(false);
            mockShowQuickPick
                .mockResolvedValueOnce({ value: GroupSelectionMode.NEW } as any)
                .mockResolvedValueOnce({ value: ArtifactType.OPENAPI } as any)
                .mockResolvedValueOnce({ uri: mockUri } as any) // File selection
                .mockResolvedValueOnce({ value: 'continue' } as any) // Labels
                .mockResolvedValueOnce(undefined); // Cancel at confirmation

            mockShowInputBox
                .mockResolvedValueOnce('test-group')
                .mockResolvedValueOnce('')
                .mockResolvedValueOnce('')
                .mockResolvedValueOnce('')
                .mockResolvedValueOnce('')
                .mockResolvedValueOnce('**/*.yaml');

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            // Should not show draft mode selection
            const draftCalls = mockShowQuickPick.mock.calls.filter(call => {
                const items = call[0];
                return Array.isArray(items) && items.some((item: any) => item.label?.includes('Draft'));
            });
            expect(draftCalls.length).toBe(0);
        });

        it('should offer draft mode when supported', async () => {
            const mockUri = vscode.Uri.file('/path/to/api.yaml');
            mockFindFiles.mockResolvedValue([mockUri]);
            mockStat.mockResolvedValue({ size: 1024, type: 1, ctime: 0, mtime: 0 });
            mockReadFile.mockResolvedValue(new Uint8Array(Buffer.from('test')));

            mockRegistryService.isDraftSupportEnabled.mockResolvedValue(true);
            mockShowQuickPick
                .mockResolvedValueOnce({ value: GroupSelectionMode.NEW } as any)
                .mockResolvedValueOnce({ value: ArtifactType.OPENAPI } as any)
                .mockResolvedValueOnce({ uri: mockUri } as any) // File selection
                .mockResolvedValueOnce({ value: 'continue' } as any) // Labels
                .mockResolvedValueOnce({ value: false } as any) // Draft mode (published)
                .mockResolvedValueOnce(undefined); // Cancel at confirmation

            mockShowInputBox
                .mockResolvedValueOnce('test-group')
                .mockResolvedValueOnce('')
                .mockResolvedValueOnce('')
                .mockResolvedValueOnce('')
                .mockResolvedValueOnce('')
                .mockResolvedValueOnce('**/*.yaml');

            await createArtifactCommand(mockRegistryService, mockTreeProvider);

            const draftCalls = mockShowQuickPick.mock.calls.filter(call => {
                const items = call[0];
                return Array.isArray(items) && items.some((item: any) => item.label?.includes('Draft') || item.label?.includes('Published'));
            });
            expect(draftCalls.length).toBeGreaterThan(0);
        });
    });
});
