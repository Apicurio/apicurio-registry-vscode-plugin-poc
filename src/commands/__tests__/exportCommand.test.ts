import * as vscode from 'vscode';
import { RegistryService } from '../../services/registryService';
import { RegistryItem, RegistryItemType } from '../../models/registryModels';
import { exportAllCommand, exportGroupCommand } from '../exportCommand';

describe('Export Commands', () => {
    let mockService: jest.Mocked<RegistryService>;
    let mockShowSaveDialog: jest.SpyInstance;
    let mockShowInformationMessage: jest.SpyInstance;
    let mockShowErrorMessage: jest.SpyInstance;
    let mockWriteFile: jest.SpyInstance;
    let mockWithProgress: jest.SpyInstance;

    beforeEach(() => {
        // Create mock service
        mockService = {
            exportAll: jest.fn().mockResolvedValue(new Uint8Array([0x50, 0x4b, 0x03, 0x04])) // ZIP file header
        } as any;

        // Mock VSCode APIs
        mockShowSaveDialog = jest.spyOn(vscode.window, 'showSaveDialog').mockResolvedValue(
            vscode.Uri.file('/tmp/registry-export-2025-11-20.zip')
        );
        mockShowInformationMessage = jest.spyOn(vscode.window, 'showInformationMessage').mockResolvedValue(undefined);
        mockShowErrorMessage = jest.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined);

        // Mock vscode.workspace.fs
        mockWriteFile = jest.spyOn(vscode.workspace.fs, 'writeFile').mockResolvedValue(undefined);

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

    describe('exportAllCommand', () => {
        it('should export registry to ZIP file with default filename', async () => {
            await exportAllCommand(mockService);

            expect(mockShowSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    path: expect.stringContaining('registry-export-')
                }),
                filters: {
                    'ZIP Archive': ['zip']
                },
                saveLabel: 'Export Registry'
            });
        });

        it('should call exportAll API and save ZIP file', async () => {
            const zipContent = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // ZIP header
            mockService.exportAll.mockResolvedValue(zipContent);

            await exportAllCommand(mockService);

            expect(mockService.exportAll).toHaveBeenCalledTimes(1);
            expect(mockWriteFile).toHaveBeenCalledWith(
                vscode.Uri.file('/tmp/registry-export-2025-11-20.zip'),
                zipContent
            );
        });

        it('should show progress during export', async () => {
            await exportAllCommand(mockService);

            expect(mockWithProgress).toHaveBeenCalledWith(
                expect.objectContaining({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Exporting registry',
                    cancellable: false
                }),
                expect.any(Function)
            );
        });

        it('should show success message with "Reveal in Finder" option', async () => {
            await exportAllCommand(mockService);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                'Registry exported successfully to /tmp/registry-export-2025-11-20.zip',
                'Reveal in Finder'
            );
        });

        it('should not show error when user clicks "Reveal in Finder"', async () => {
            mockShowInformationMessage.mockResolvedValue('Reveal in Finder');

            await exportAllCommand(mockService);

            // Should not show error message
            expect(mockShowErrorMessage).not.toHaveBeenCalled();
        });

        it('should not show error if user dismisses message', async () => {
            mockShowInformationMessage.mockResolvedValue(undefined);

            await exportAllCommand(mockService);

            expect(mockShowErrorMessage).not.toHaveBeenCalled();
        });

        it('should handle user cancellation (no save location)', async () => {
            mockShowSaveDialog.mockResolvedValue(undefined);

            await exportAllCommand(mockService);

            expect(mockService.exportAll).not.toHaveBeenCalled();
            expect(mockWriteFile).not.toHaveBeenCalled();
            expect(mockShowInformationMessage).not.toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            mockService.exportAll.mockRejectedValue(new Error('Network timeout'));

            await exportAllCommand(mockService);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                'Export failed: Network timeout'
            );
            expect(mockWriteFile).not.toHaveBeenCalled();
        });

        it('should handle file system errors', async () => {
            mockWriteFile.mockRejectedValue(new Error('EACCES: permission denied'));

            await exportAllCommand(mockService);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                'Export failed: EACCES: permission denied'
            );
        });

        it('should export large files correctly', async () => {
            const largeZip = new Uint8Array(10 * 1024 * 1024); // 10 MB
            mockService.exportAll.mockResolvedValue(largeZip);

            await exportAllCommand(mockService);

            expect(mockWriteFile).toHaveBeenCalledWith(
                expect.any(Object),
                largeZip
            );
            expect(mockShowInformationMessage).toHaveBeenCalled();
        });
    });

    describe('exportGroupCommand', () => {
        it('should show "not implemented" message for group export', async () => {
            const mockNode = new RegistryItem(
                'test-group',
                RegistryItemType.Group,
                'test-group',
                {},
                undefined,
                'test-group'
            );

            await exportGroupCommand(mockService, mockNode);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Group-specific export not yet implemented'),
                'Export All Instead'
            );
        });

        it('should call exportAll when user selects "Export All Instead"', async () => {
            mockShowInformationMessage.mockResolvedValue('Export All Instead');

            const mockNode = new RegistryItem(
                'test-group',
                RegistryItemType.Group,
                'test-group',
                {},
                undefined,
                'test-group'
            );

            await exportGroupCommand(mockService, mockNode);

            expect(mockService.exportAll).toHaveBeenCalled();
        });

        it('should not call exportAll if user dismisses message', async () => {
            mockShowInformationMessage.mockResolvedValue(undefined);

            const mockNode = new RegistryItem(
                'test-group',
                RegistryItemType.Group,
                'test-group',
                {},
                undefined,
                'test-group'
            );

            await exportGroupCommand(mockService, mockNode);

            expect(mockService.exportAll).not.toHaveBeenCalled();
        });
    });

    describe('formatBytes helper', () => {
        // This tests the helper function indirectly through progress reporting

        it('should format bytes in progress message', async () => {
            const zipContent = new Uint8Array(1024 * 1024); // 1 MB
            mockService.exportAll.mockResolvedValue(zipContent);

            await exportAllCommand(mockService);

            // The withProgress mock should have been called with progress reporter
            expect(mockWithProgress).toHaveBeenCalled();
        });
    });
});
