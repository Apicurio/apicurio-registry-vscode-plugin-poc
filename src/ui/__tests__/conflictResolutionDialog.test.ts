import { ConflictResolutionDialog } from '../conflictResolutionDialog';
import { ConflictInfo, ConflictResolution } from '../../services/conflictDetector';
import * as vscode from 'vscode';

// Mock vscode
jest.mock('vscode', () => ({
    window: {
        showWarningMessage: jest.fn()
    },
    commands: {
        executeCommand: jest.fn()
    },
    Uri: {
        parse: (str: string) => ({ toString: () => str })
    }
}));

// Get mock references after jest.mock
const mockShowWarningMessage = vscode.window.showWarningMessage as jest.Mock;
const mockExecuteCommand = vscode.commands.executeCommand as jest.Mock;

describe('ConflictResolutionDialog', () => {
    let mockConflict: ConflictInfo;

    beforeEach(() => {
        // Create mock conflict
        mockConflict = {
            uri: vscode.Uri.parse('apicurio://group/test-group/artifact/test-artifact/version/1.0.0?state=DRAFT'),
            groupId: 'test-group',
            artifactId: 'test-artifact',
            version: '1.0.0',
            localModifiedOn: new Date('2025-11-03T10:00:00Z'),
            remoteModifiedOn: new Date('2025-11-03T10:30:00Z'),
            localContent: 'local content',
            remoteContent: 'remote content'
        };

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('show', () => {
        it('should display conflict dialog with all options', async () => {
            mockShowWarningMessage.mockResolvedValue('$(close) Cancel');

            const result = await ConflictResolutionDialog.show(mockConflict);

            expect(mockShowWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('Conflict Detected'),
                { modal: true },
                expect.stringContaining('View Diff'),
                expect.stringContaining('Overwrite Remote'),
                expect.stringContaining('Discard Local'),
                expect.stringContaining('Cancel')
            );

            expect(result).toBe(ConflictResolution.Cancel);
        });

        it('should include artifact information in message', async () => {
            mockShowWarningMessage.mockResolvedValue('$(close) Cancel');

            await ConflictResolutionDialog.show(mockConflict);

            const message = mockShowWarningMessage.mock.calls[0][0];
            expect(message).toContain('test-group/test-artifact:1.0.0');
            expect(message).toContain('Conflict Detected');
        });

        it('should show local and remote modification times', async () => {
            mockShowWarningMessage.mockResolvedValue('$(close) Cancel');

            await ConflictResolutionDialog.show(mockConflict);

            const message = mockShowWarningMessage.mock.calls[0][0];
            expect(message).toContain('Local changes');
            expect(message).toContain('Remote changes');
        });

        it('should return Cancel when user dismisses dialog', async () => {
            mockShowWarningMessage.mockResolvedValue(undefined);

            const result = await ConflictResolutionDialog.show(mockConflict);

            expect(result).toBe(ConflictResolution.Cancel);
        });

        it('should return Cancel when user clicks Cancel button', async () => {
            mockShowWarningMessage.mockResolvedValue('$(close) Cancel');

            const result = await ConflictResolutionDialog.show(mockConflict);

            expect(result).toBe(ConflictResolution.Cancel);
        });

        it('should return Discard when user clicks Discard Local', async () => {
            mockShowWarningMessage.mockResolvedValue('$(discard) Discard Local');

            const result = await ConflictResolutionDialog.show(mockConflict);

            expect(result).toBe(ConflictResolution.Discard);
        });
    });

    describe('Overwrite flow', () => {
        it('should show confirmation dialog when user clicks Overwrite', async () => {
            // First dialog - user clicks Overwrite
            // Second dialog - confirmation
            mockShowWarningMessage
                .mockResolvedValueOnce('$(warning) Overwrite Remote')
                .mockResolvedValueOnce('$(warning) Yes, Overwrite');

            const result = await ConflictResolutionDialog.show(mockConflict);

            expect(mockShowWarningMessage).toHaveBeenCalledTimes(2);
            expect(mockShowWarningMessage).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('Are you sure you want to overwrite'),
                { modal: true },
                '$(warning) Yes, Overwrite',
                '$(close) No, Cancel'
            );
            expect(result).toBe(ConflictResolution.Overwrite);
        });

        it('should return Cancel when user cancels overwrite confirmation', async () => {
            mockShowWarningMessage
                .mockResolvedValueOnce('$(warning) Overwrite Remote')
                .mockResolvedValueOnce('$(close) No, Cancel');

            const result = await ConflictResolutionDialog.show(mockConflict);

            expect(result).toBe(ConflictResolution.Cancel);
        });

        it('should return Cancel when user dismisses overwrite confirmation', async () => {
            mockShowWarningMessage
                .mockResolvedValueOnce('$(warning) Overwrite Remote')
                .mockResolvedValueOnce(undefined);

            const result = await ConflictResolutionDialog.show(mockConflict);

            expect(result).toBe(ConflictResolution.Cancel);
        });

        it('should warn about discarding remote changes in confirmation', async () => {
            mockShowWarningMessage
                .mockResolvedValueOnce('$(warning) Overwrite Remote')
                .mockResolvedValueOnce('$(warning) Yes, Overwrite');

            await ConflictResolutionDialog.show(mockConflict);

            const confirmMessage = mockShowWarningMessage.mock.calls[1][0];
            expect(confirmMessage).toContain('discard changes made by other users');
        });
    });

    describe('View Diff flow', () => {
        it('should call vscode.diff command when user clicks View Diff', async () => {
            // First dialog - View Diff
            // After showing diff, show dialog again
            // Second dialog - Cancel
            mockShowWarningMessage
                .mockResolvedValueOnce('$(diff) View Diff')
                .mockResolvedValueOnce('$(close) Cancel');

            mockExecuteCommand.mockResolvedValue(undefined);

            const result = await ConflictResolutionDialog.show(mockConflict);

            expect(mockExecuteCommand).toHaveBeenCalledWith(
                'vscode.diff',
                expect.anything(), // remote URI
                expect.anything(), // local URI
                expect.stringContaining('test-group/test-artifact:1.0.0'),
                expect.any(Object)
            );

            // Should show dialog again after diff
            expect(mockShowWarningMessage).toHaveBeenCalledTimes(2);
            expect(result).toBe(ConflictResolution.Cancel);
        });

        it('should show diff with local changes on right, remote on left', async () => {
            mockShowWarningMessage
                .mockResolvedValueOnce('$(diff) View Diff')
                .mockResolvedValueOnce('$(close) Cancel');

            mockExecuteCommand.mockResolvedValue(undefined);

            await ConflictResolutionDialog.show(mockConflict);

            const diffCall = mockExecuteCommand.mock.calls[0];
            expect(diffCall[0]).toBe('vscode.diff');

            // Left side should be remote (their changes)
            const leftUri = diffCall[1];
            expect(leftUri.toString()).toContain('Remote Changes');

            // Right side should be local (your changes)
            const rightUri = diffCall[2];
            expect(rightUri.toString()).toContain('Your Changes');
        });

        it('should allow user to choose Overwrite after viewing diff', async () => {
            mockShowWarningMessage
                .mockResolvedValueOnce('$(diff) View Diff')
                .mockResolvedValueOnce('$(warning) Overwrite Remote')
                .mockResolvedValueOnce('$(warning) Yes, Overwrite');

            mockExecuteCommand.mockResolvedValue(undefined);

            const result = await ConflictResolutionDialog.show(mockConflict);

            expect(result).toBe(ConflictResolution.Overwrite);
        });

        it('should allow user to choose Discard after viewing diff', async () => {
            mockShowWarningMessage
                .mockResolvedValueOnce('$(diff) View Diff')
                .mockResolvedValueOnce('$(discard) Discard Local');

            mockExecuteCommand.mockResolvedValue(undefined);

            const result = await ConflictResolutionDialog.show(mockConflict);

            expect(result).toBe(ConflictResolution.Discard);
        });
    });

    describe('edge cases', () => {
        it('should handle very long artifact names in dialog', async () => {
            mockConflict.groupId = 'very-long-group-name-that-exceeds-normal-length';
            mockConflict.artifactId = 'very-long-artifact-name-that-exceeds-normal-length';
            mockConflict.version = 'very-long-version-name-1.0.0-SNAPSHOT-with-timestamp';

            mockShowWarningMessage.mockResolvedValue('$(close) Cancel');

            const result = await ConflictResolutionDialog.show(mockConflict);

            expect(result).toBe(ConflictResolution.Cancel);
            expect(mockShowWarningMessage).toHaveBeenCalled();
        });

        it('should handle timestamps with millisecond precision', async () => {
            mockConflict.localModifiedOn = new Date('2025-11-03T10:00:00.123Z');
            mockConflict.remoteModifiedOn = new Date('2025-11-03T10:00:00.456Z');

            mockShowWarningMessage.mockResolvedValue('$(close) Cancel');

            await ConflictResolutionDialog.show(mockConflict);

            const message = mockShowWarningMessage.mock.calls[0][0];
            // Should display timestamps without error
            expect(message).toContain('Local changes');
            expect(message).toContain('Remote changes');
        });

        it('should handle empty content gracefully', async () => {
            mockConflict.localContent = '';
            mockConflict.remoteContent = '';

            mockShowWarningMessage
                .mockResolvedValueOnce('$(diff) View Diff')
                .mockResolvedValueOnce('$(close) Cancel');

            mockExecuteCommand.mockResolvedValue(undefined);

            const result = await ConflictResolutionDialog.show(mockConflict);

            expect(mockExecuteCommand).toHaveBeenCalled();
            expect(result).toBe(ConflictResolution.Cancel);
        });

        it('should handle very large content in diff view', async () => {
            mockConflict.localContent = 'x'.repeat(100000); // 100KB
            mockConflict.remoteContent = 'y'.repeat(100000); // 100KB

            mockShowWarningMessage
                .mockResolvedValueOnce('$(diff) View Diff')
                .mockResolvedValueOnce('$(close) Cancel');

            mockExecuteCommand.mockResolvedValue(undefined);

            const result = await ConflictResolutionDialog.show(mockConflict);

            expect(mockExecuteCommand).toHaveBeenCalled();
            expect(result).toBe(ConflictResolution.Cancel);
        });
    });
});
