import * as vscode from 'vscode';
import { RegistryService } from '../../services/registryService';
import { RegistryItem, RegistryItemType } from '../../models/registryModels';
import { createDraftVersionCommand } from '../draftCommands';

describe('Draft Commands', () => {
    let mockService: jest.Mocked<RegistryService>;
    let mockRefresh: jest.Mock;
    let mockShowInputBox: jest.SpyInstance;
    let mockShowInformationMessage: jest.SpyInstance;
    let mockShowErrorMessage: jest.SpyInstance;
    let mockWithProgress: jest.SpyInstance;

    beforeEach(() => {
        // Create mock service
        mockService = {
            createDraftVersion: jest.fn().mockResolvedValue(undefined),
            getVersions: jest.fn().mockResolvedValue([]),
            getArtifactContent: jest.fn()
        } as any;

        // Mock refresh function
        mockRefresh = jest.fn();

        // Mock VSCode APIs
        mockShowInputBox = jest.spyOn(vscode.window, 'showInputBox');
        mockShowInformationMessage = jest.spyOn(vscode.window, 'showInformationMessage').mockResolvedValue(undefined);
        mockShowErrorMessage = jest.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined);
        mockWithProgress = jest.spyOn(vscode.window, 'withProgress').mockImplementation(async (options, task) => {
            return await task({ report: jest.fn() }, {} as any);
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('createDraftVersionCommand', () => {
        it('should create draft with user inputs', async () => {
            const mockNode = new RegistryItem(
                'my-artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                { artifactType: 'OPENAPI' },
                'my-group',
                'my-group'
            );

            // Mock user inputs
            mockShowInputBox
                .mockResolvedValueOnce('1.0.1-draft')  // version
                .mockResolvedValueOnce('Draft for review');  // description

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.createDraftVersion).toHaveBeenCalledWith(
                'my-group',
                'my-artifact',
                expect.objectContaining({
                    version: '1.0.1-draft',
                    description: 'Draft for review',
                    isDraft: true
                })
            );
            expect(mockRefresh).toHaveBeenCalled();
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                'Draft version created for artifact "my-artifact"'
            );
        });

        it('should use latest version content as template', async () => {
            const mockNode = new RegistryItem(
                'my-artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                { artifactType: 'OPENAPI' },
                'my-group',
                'my-group'
            );

            mockService.getVersions.mockResolvedValue([
                { version: '1.0.0' }
            ] as any);

            mockService.getArtifactContent.mockResolvedValue({
                content: '{"openapi": "3.0.0"}',
                contentType: 'application/json'
            });

            mockShowInputBox
                .mockResolvedValueOnce('')  // version (empty)
                .mockResolvedValueOnce('');  // description (empty)

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.getArtifactContent).toHaveBeenCalledWith(
                'my-group',
                'my-artifact',
                '1.0.0'
            );

            expect(mockService.createDraftVersion).toHaveBeenCalledWith(
                'my-group',
                'my-artifact',
                expect.objectContaining({
                    content: {
                        content: '{"openapi": "3.0.0"}',
                        contentType: 'application/json'
                    }
                })
            );
        });

        it('should handle empty version and description inputs', async () => {
            const mockNode = new RegistryItem(
                'my-artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                undefined,
                'my-group',
                'my-group'
            );

            mockShowInputBox
                .mockResolvedValueOnce('')  // version (empty)
                .mockResolvedValueOnce('');  // description (empty)

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.createDraftVersion).toHaveBeenCalledWith(
                'my-group',
                'my-artifact',
                expect.objectContaining({
                    version: undefined,
                    description: undefined
                })
            );
        });

        it('should handle cancellation at version input', async () => {
            const mockNode = new RegistryItem(
                'my-artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                undefined,
                'my-group',
                'my-group'
            );

            mockShowInputBox.mockResolvedValueOnce(undefined);  // User cancelled

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.createDraftVersion).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle cancellation at description input', async () => {
            const mockNode = new RegistryItem(
                'my-artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                undefined,
                'my-group',
                'my-group'
            );

            mockShowInputBox
                .mockResolvedValueOnce('1.0.0')  // version
                .mockResolvedValueOnce(undefined);  // User cancelled at description

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.createDraftVersion).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should show error when artifact ID missing', async () => {
            const mockNode = new RegistryItem(
                'artifact',
                RegistryItemType.Artifact,
                undefined,  // Missing ID
                undefined,
                'my-group'
            );

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                'Cannot create draft: missing group or artifact ID'
            );
            expect(mockService.createDraftVersion).not.toHaveBeenCalled();
        });

        it('should show error when group ID missing', async () => {
            const mockNode = new RegistryItem(
                'artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                undefined,
                undefined  // Missing parent/group
            );

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                'Cannot create draft: missing group or artifact ID'
            );
            expect(mockService.createDraftVersion).not.toHaveBeenCalled();
        });

        it('should continue with empty content if fetching latest version fails', async () => {
            const mockNode = new RegistryItem(
                'my-artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                undefined,
                'my-group',
                'my-group'
            );

            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            mockService.getVersions.mockRejectedValue(new Error('Network error'));

            mockShowInputBox
                .mockResolvedValueOnce('1.0.0')
                .mockResolvedValueOnce('Test');

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(consoleWarnSpy).toHaveBeenCalled();
            expect(mockService.createDraftVersion).toHaveBeenCalledWith(
                'my-group',
                'my-artifact',
                expect.objectContaining({
                    content: {
                        content: '',
                        contentType: 'application/json'
                    }
                })
            );

            consoleWarnSpy.mockRestore();
        });

        it('should handle API errors during draft creation', async () => {
            const mockNode = new RegistryItem(
                'my-artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                undefined,
                'my-group',
                'my-group'
            );

            mockShowInputBox
                .mockResolvedValueOnce('1.0.0')
                .mockResolvedValueOnce('Test');

            mockService.createDraftVersion.mockRejectedValue(
                new Error('Version already exists: 1.0.0')
            );

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                'Failed to create draft version: Version already exists: 1.0.0'
            );
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should show progress indicator during creation', async () => {
            const mockNode = new RegistryItem(
                'my-artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                undefined,
                'my-group',
                'my-group'
            );

            mockShowInputBox
                .mockResolvedValueOnce('1.0.0')
                .mockResolvedValueOnce('Test');

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockWithProgress).toHaveBeenCalledWith(
                expect.objectContaining({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Creating draft version for my-artifact...',
                    cancellable: false
                }),
                expect.any(Function)
            );
        });

        it('should skip content template if version has no version property', async () => {
            const mockNode = new RegistryItem(
                'my-artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                undefined,
                'my-group',
                'my-group'
            );

            mockService.getVersions.mockResolvedValue([
                { version: undefined }  // No version property
            ] as any);

            mockShowInputBox
                .mockResolvedValueOnce('')
                .mockResolvedValueOnce('');

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            // Should NOT call getArtifactContent when version is missing
            expect(mockService.getArtifactContent).not.toHaveBeenCalled();

            // Should still create draft with empty content (no template)
            expect(mockService.createDraftVersion).toHaveBeenCalledWith(
                'my-group',
                'my-artifact',
                expect.objectContaining({
                    content: expect.objectContaining({
                        content: '',  // Empty content instead of template
                        contentType: 'application/json'  // Default content type
                    }),
                    isDraft: true
                })
            );
        });

        it('should use default content type when not provided', async () => {
            const mockNode = new RegistryItem(
                'my-artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                undefined,
                'my-group',
                'my-group'
            );

            // No versions, so no content fetched
            mockService.getVersions.mockResolvedValue([]);

            mockShowInputBox
                .mockResolvedValueOnce('1.0.0')
                .mockResolvedValueOnce('Test');

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.createDraftVersion).toHaveBeenCalledWith(
                'my-group',
                'my-artifact',
                expect.objectContaining({
                    content: {
                        content: '',
                        contentType: 'application/json'  // Default
                    }
                })
            );
        });
    });
});
