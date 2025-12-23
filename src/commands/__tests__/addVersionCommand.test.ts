import * as vscode from 'vscode';
import * as fs from 'fs';
import { RegistryService } from '../../services/registryService';
import { RegistryItem, RegistryItemType } from '../../models/registryModels';
import { addVersionCommand } from '../addVersionCommand';

// Mock fs module
jest.mock('fs');

describe('Add Version Command', () => {
    let mockService: jest.Mocked<RegistryService>;
    let mockRefresh: jest.Mock;
    let mockShowOpenDialog: jest.SpyInstance;
    let mockShowInputBox: jest.SpyInstance;
    let mockShowInformationMessage: jest.SpyInstance;
    let mockShowErrorMessage: jest.SpyInstance;
    let mockReadFileSync: jest.SpyInstance;
    let mockWithProgress: jest.SpyInstance;

    beforeEach(() => {
        // Create mock service
        mockService = {
            createVersion: jest.fn().mockResolvedValue({
                version: '1.1.0',
                globalId: 2,
                state: 'ENABLED'
            }),
            getVersions: jest.fn().mockResolvedValue([
                { version: '1.0.0', globalId: 1 }
            ])
        } as any;

        mockRefresh = jest.fn();

        // Mock VSCode APIs
        mockShowOpenDialog = jest.spyOn(vscode.window, 'showOpenDialog').mockResolvedValue([
            vscode.Uri.file('/tmp/test-api-v2.yaml')
        ]);
        mockShowInputBox = jest.spyOn(vscode.window, 'showInputBox').mockResolvedValue('1.1.0');
        mockShowInformationMessage = jest.spyOn(vscode.window, 'showInformationMessage').mockResolvedValue(undefined);
        mockShowErrorMessage = jest.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined);
        mockWithProgress = jest.spyOn(vscode.window, 'withProgress').mockImplementation(async (options, task) => {
            return task({ report: jest.fn() }, { isCancellationRequested: false } as any);
        });

        // Mock fs
        mockReadFileSync = jest.spyOn(fs, 'readFileSync').mockReturnValue('openapi: 3.0.0\ninfo:\n  title: Test API v2');
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe('Basic Workflow', () => {
        it('should create a new version with file upload', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            await addVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.getVersions).toHaveBeenCalledWith('test-group', 'test-api');
            expect(mockShowInputBox).toHaveBeenCalledWith(
                expect.objectContaining({
                    prompt: 'Version number',
                    value: '1.0.1',
                    validateInput: expect.any(Function)
                })
            );
            expect(mockShowOpenDialog).toHaveBeenCalled();
            expect(mockReadFileSync).toHaveBeenCalledWith('/tmp/test-api-v2.yaml', 'utf8');
            expect(mockService.createVersion).toHaveBeenCalledWith(
                'test-group',
                'test-api',
                expect.objectContaining({
                    version: '1.1.0',
                    content: expect.objectContaining({
                        content: 'openapi: 3.0.0\ninfo:\n  title: Test API v2'
                    })
                })
            );
            expect(mockRefresh).toHaveBeenCalled();
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                'Version 1.1.0 created successfully'
            );
        });

        it('should suggest incremented version number', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockService.getVersions.mockResolvedValue([
                { version: '2.5.3', globalId: 10 },
                { version: '2.5.2', globalId: 9 },
                { version: '2.5.1', globalId: 8 }
            ]);

            await addVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockShowInputBox).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: '2.5.4'
                })
            );
        });

        it('should handle user cancellation at version input', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockShowInputBox.mockResolvedValue(undefined);

            await addVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockShowOpenDialog).not.toHaveBeenCalled();
            expect(mockService.createVersion).not.toHaveBeenCalled();
        });

        it('should handle user cancellation at file selection', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockShowOpenDialog.mockResolvedValue(undefined);

            await addVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.createVersion).not.toHaveBeenCalled();
        });
    });

    describe('Version Validation', () => {
        it('should reject invalid version format', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            let validateInput: ((value: string) => string | undefined) | undefined;
            mockShowInputBox.mockImplementationOnce(async (options) => {
                validateInput = options?.validateInput;
                return '1.1.0';
            });

            await addVersionCommand(mockService, mockRefresh, mockNode);

            expect(validateInput).toBeDefined();
            expect(validateInput!('not-a-version')).toBe('Invalid version format. Use semver (e.g., 1.0.0)');
            expect(validateInput!('1.a.0')).toBe('Invalid version format. Use semver (e.g., 1.0.0)');
            expect(validateInput!('')).toBe('Version is required');
        });

        it('should accept valid version formats', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            let validateInput: ((value: string) => string | undefined) | undefined;
            mockShowInputBox.mockImplementationOnce(async (options) => {
                validateInput = options?.validateInput;
                return '1.1.0';
            });

            await addVersionCommand(mockService, mockRefresh, mockNode);

            expect(validateInput).toBeDefined();
            expect(validateInput!('1.0.0')).toBeUndefined();
            expect(validateInput!('2.5.3')).toBeUndefined();
            expect(validateInput!('10.20.30')).toBeUndefined();
        });
    });

    describe('Optional Metadata', () => {
        it('should create version with name and description', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockShowInputBox
                .mockResolvedValueOnce('1.1.0')  // version
                .mockResolvedValueOnce('Version 1.1')  // name
                .mockResolvedValueOnce('Bug fixes and improvements');  // description

            await addVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.createVersion).toHaveBeenCalledWith(
                'test-group',
                'test-api',
                expect.objectContaining({
                    version: '1.1.0',
                    name: 'Version 1.1',
                    description: 'Bug fixes and improvements'
                })
            );
        });

        it('should create version without optional metadata', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockShowInputBox
                .mockResolvedValueOnce('1.1.0')  // version
                .mockResolvedValueOnce(undefined)  // name (skipped)
                .mockResolvedValueOnce(undefined);  // description (skipped)

            await addVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.createVersion).toHaveBeenCalledWith(
                'test-group',
                'test-api',
                expect.objectContaining({
                    version: '1.1.0'
                })
            );

            const callArg = (mockService.createVersion as jest.Mock).mock.calls[0][2];
            expect(callArg.name).toBeUndefined();
            expect(callArg.description).toBeUndefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle missing groupId', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                undefined  // missing groupId
            );

            await addVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                'Cannot add version: missing group or artifact ID'
            );
            expect(mockService.createVersion).not.toHaveBeenCalled();
        });

        it('should handle file read errors', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockReadFileSync.mockImplementation(() => {
                throw new Error('ENOENT: file not found');
            });

            await addVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                'Failed to add version: ENOENT: file not found'
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

            mockService.createVersion.mockRejectedValue(new Error('Version already exists: 1.1.0'));

            await addVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                'Failed to add version: Version already exists: 1.1.0'
            );
        });

        it('should handle getVersions API errors gracefully', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            mockService.getVersions.mockRejectedValue(new Error('Network error'));

            await addVersionCommand(mockService, mockRefresh, mockNode);

            // Should fallback to '1.0.0' when can't fetch versions
            expect(mockShowInputBox).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: '1.0.0'
                })
            );
        });
    });

    describe('Progress Indicator', () => {
        it('should show progress while creating version', async () => {
            const mockNode = new RegistryItem(
                'test-api',
                RegistryItemType.Artifact,
                'test-api',
                { artifactType: 'OPENAPI', state: 'ENABLED' },
                'test-group',
                'test-group'
            );

            await addVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockWithProgress).toHaveBeenCalledWith(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Creating version...',
                    cancellable: false
                },
                expect.any(Function)
            );
        });
    });
});
