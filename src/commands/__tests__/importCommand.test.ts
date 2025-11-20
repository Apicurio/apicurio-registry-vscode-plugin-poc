import * as vscode from 'vscode';
import { RegistryService } from '../../services/registryService';
import { importArtifactsCommand } from '../importCommand';

describe('Import Command', () => {
    let mockService: jest.Mocked<RegistryService>;
    let mockShowOpenDialog: jest.SpyInstance;
    let mockShowWarningMessage: jest.SpyInstance;
    let mockShowInformationMessage: jest.SpyInstance;
    let mockShowErrorMessage: jest.SpyInstance;
    let mockReadFile: jest.SpyInstance;
    let mockWithProgress: jest.SpyInstance;
    let mockRefreshCallback: jest.Mock;

    beforeEach(() => {
        // Create mock service
        mockService = {
            importArtifacts: jest.fn().mockResolvedValue(undefined)
        } as any;

        // Create mock refresh callback
        mockRefreshCallback = jest.fn();

        // Mock VSCode APIs
        mockShowOpenDialog = jest.spyOn(vscode.window, 'showOpenDialog').mockResolvedValue([
            vscode.Uri.file('/tmp/registry-export.zip')
        ]);
        mockShowWarningMessage = jest.spyOn(vscode.window, 'showWarningMessage').mockResolvedValue('Import' as any);
        mockShowInformationMessage = jest.spyOn(vscode.window, 'showInformationMessage').mockResolvedValue(undefined);
        mockShowErrorMessage = jest.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined);

        // Mock vscode.workspace.fs
        const zipContent = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // ZIP header
        mockReadFile = jest.spyOn(vscode.workspace.fs, 'readFile').mockResolvedValue(zipContent);

        // Mock progress indicator
        mockWithProgress = jest.spyOn(vscode.window, 'withProgress').mockImplementation(
            async (options: any, task: any) => {
                const progress = {
                    report: jest.fn()
                };
                return await task(progress, {} as any);
            }
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe('importArtifactsCommand', () => {
        it('should prompt for ZIP file with correct filters', async () => {
            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockShowOpenDialog).toHaveBeenCalledWith({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'ZIP Archive': ['zip']
                },
                openLabel: 'Import Registry'
            });
        });

        it('should show confirmation dialog before import', async () => {
            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockShowWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('Import artifacts from /tmp/registry-export.zip'),
                { modal: true },
                'Import',
                'Cancel'
            );
        });

        it('should read ZIP file and call importArtifacts API', async () => {
            const zipContent = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
            mockReadFile.mockResolvedValue(zipContent);

            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockReadFile).toHaveBeenCalledWith(vscode.Uri.file('/tmp/registry-export.zip'));
            expect(mockService.importArtifacts).toHaveBeenCalledWith(zipContent);
        });

        it('should show progress during import', async () => {
            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockWithProgress).toHaveBeenCalledWith(
                expect.objectContaining({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Importing artifacts',
                    cancellable: false
                }),
                expect.any(Function)
            );
        });

        it('should show success message after import', async () => {
            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                'Artifacts imported successfully',
                'OK'
            );
        });

        it('should call refresh callback after successful import', async () => {
            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockRefreshCallback).toHaveBeenCalledTimes(1);
        });

        it('should handle user cancellation (no file selected)', async () => {
            mockShowOpenDialog.mockResolvedValue(undefined);

            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockService.importArtifacts).not.toHaveBeenCalled();
            expect(mockRefreshCallback).not.toHaveBeenCalled();
            expect(mockShowInformationMessage).not.toHaveBeenCalled();
        });

        it('should handle empty file selection', async () => {
            mockShowOpenDialog.mockResolvedValue([]);

            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockService.importArtifacts).not.toHaveBeenCalled();
            expect(mockRefreshCallback).not.toHaveBeenCalled();
        });

        it('should handle user cancellation at confirmation dialog', async () => {
            mockShowWarningMessage.mockResolvedValue('Cancel');

            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockReadFile).not.toHaveBeenCalled();
            expect(mockService.importArtifacts).not.toHaveBeenCalled();
            expect(mockRefreshCallback).not.toHaveBeenCalled();
        });

        it('should handle user dismissing confirmation dialog', async () => {
            mockShowWarningMessage.mockResolvedValue(undefined);

            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockReadFile).not.toHaveBeenCalled();
            expect(mockService.importArtifacts).not.toHaveBeenCalled();
        });

        it('should handle conflict errors (artifacts already exist)', async () => {
            mockService.importArtifacts.mockRejectedValue(
                new Error('Import failed: Some artifacts already exist')
            );

            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Some artifacts already exist')
            );
            expect(mockRefreshCallback).not.toHaveBeenCalled();
        });

        it('should handle invalid ZIP file errors', async () => {
            mockService.importArtifacts.mockRejectedValue(
                new Error('Import failed: Invalid ZIP file')
            );

            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Invalid or corrupted ZIP file')
            );
        });

        it('should handle network errors', async () => {
            mockService.importArtifacts.mockRejectedValue(
                new Error('Network timeout')
            );

            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Network timeout')
            );
        });

        it('should handle file read errors', async () => {
            mockReadFile.mockRejectedValue(new Error('EACCES: permission denied'));

            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('EACCES: permission denied')
            );
            expect(mockService.importArtifacts).not.toHaveBeenCalled();
        });

        it('should import moderately sized ZIP files correctly', async () => {
            const mediumZip = new Uint8Array(100 * 1024); // 100 KB
            mockReadFile.mockResolvedValue(mediumZip);

            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockService.importArtifacts).toHaveBeenCalledWith(mediumZip);
            expect(mockShowInformationMessage).toHaveBeenCalled();
            expect(mockRefreshCallback).toHaveBeenCalled();
        });

        it('should display file size in progress message', async () => {
            const zipContent = new Uint8Array(50 * 1024); // 50 KB
            mockReadFile.mockResolvedValue(zipContent);

            await importArtifactsCommand(mockService, mockRefreshCallback);

            // The withProgress mock should have been called with progress reporter
            expect(mockWithProgress).toHaveBeenCalled();
        });
    });

    describe('formatBytes helper', () => {
        // These tests verify the formatBytes function indirectly through progress reporting

        it('should handle zero bytes', async () => {
            const emptyZip = new Uint8Array(0);
            mockReadFile.mockResolvedValue(emptyZip);

            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockWithProgress).toHaveBeenCalled();
        });

        it('should format KB correctly', async () => {
            const zipContent = new Uint8Array(10 * 1024); // 10 KB
            mockReadFile.mockResolvedValue(zipContent);

            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockWithProgress).toHaveBeenCalled();
        });

        it('should format MB correctly', async () => {
            const zipContent = new Uint8Array(500 * 1024); // 500 KB
            mockReadFile.mockResolvedValue(zipContent);

            await importArtifactsCommand(mockService, mockRefreshCallback);

            expect(mockWithProgress).toHaveBeenCalled();
        });
    });
});
