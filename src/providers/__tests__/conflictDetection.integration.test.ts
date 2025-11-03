import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock vscode module
jest.mock('vscode', () => {
    class MockUri {
        constructor(
            public scheme: string,
            public authority: string,
            public path: string,
            public query: string,
            public fragment: string
        ) {}

        static parse(value: string): MockUri {
            const match = value.match(/^([^:]+):([^?]*)(?:\?(.*))?$/);
            if (!match) {
                throw new Error('Invalid URI');
            }
            return new MockUri(match[1], '', match[2], match[3] || '', '');
        }

        toString(): string {
            return `${this.scheme}:${this.path}${this.query ? '?' + this.query : ''}`;
        }
    }

    return {
        Uri: MockUri,
        FileType: { File: 1 },
        FileSystemError: {
            FileNotFound: (uri: any) => new Error(`FileNotFound: ${uri}`),
            NoPermissions: (msg: string) => new Error(`NoPermissions: ${msg}`),
            Unavailable: (msg: string) => new Error(`Unavailable: ${msg}`)
        },
        FileChangeType: { Changed: 1 },
        EventEmitter: class {
            fire() {}
            get event() { return () => ({ dispose: () => {} }); }
        },
        Disposable: class {
            dispose() {}
        },
        window: {
            showInformationMessage: jest.fn() as any,
            showErrorMessage: jest.fn() as any,
            showWarningMessage: jest.fn() as any
        },
        commands: {
            executeCommand: jest.fn() as any
        }
    };
}, { virtual: true });

import { ApicurioFileSystemProvider } from '../apicurioFileSystemProvider';
import { RegistryService } from '../../services/registryService';
import { ConflictDetector, ConflictResolution } from '../../services/conflictDetector';
import { ConflictResolutionDialog } from '../../ui/conflictResolutionDialog';

const vscode = require('vscode');
const MockUri = vscode.Uri;

// Get mock references after jest.mock
const mockShowInformationMessage = vscode.window.showInformationMessage as jest.Mock;
const mockShowErrorMessage = vscode.window.showErrorMessage as jest.Mock;
const mockShowWarningMessage = vscode.window.showWarningMessage as jest.Mock;
const mockExecuteCommand = vscode.commands.executeCommand as jest.Mock;

// Mock ConflictResolutionDialog
jest.mock('../../ui/conflictResolutionDialog', () => ({
    ConflictResolutionDialog: {
        show: jest.fn() as any
    }
}));

const mockShowConflictDialog = ConflictResolutionDialog.show as jest.Mock;

describe('Conflict Detection Integration Tests', () => {
    let provider: ApicurioFileSystemProvider;
    let mockRegistryService: jest.Mocked<RegistryService>;
    let conflictDetector: ConflictDetector;

    const baseTime = new Date('2025-11-03T10:00:00.000Z');
    const laterTime = new Date('2025-11-03T10:30:00.000Z');

    beforeEach(() => {
        jest.clearAllMocks();

        mockRegistryService = {
            getArtifactContent: jest.fn(),
            updateDraftContent: jest.fn(),
            getVersionMetadata: jest.fn()
        } as any;

        conflictDetector = new ConflictDetector(mockRegistryService);
        provider = new ApicurioFileSystemProvider(mockRegistryService, conflictDetector);
    });

    describe('Full Conflict Workflow', () => {
        it('should detect conflict when draft modified remotely between read and write', async () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');

            // Step 1: User opens draft (readFile)
            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'original content',
                contentType: 'application/json'
            });
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: baseTime,
                createdOn: baseTime
            } as any);

            await provider.readFile(uri as any);

            // Step 2: Another user modifies the draft remotely (simulated)
            // The remote version now has different timestamp and content

            // Step 3: User tries to save (writeFile)
            const newContent = Buffer.from('my changes');

            // Mock conflict check - remote has been modified
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: laterTime,  // Changed!
                createdOn: baseTime
            } as any);
            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'someone else changed this',
                contentType: 'application/json'
            });

            // User chooses to cancel
            // @ts-ignore - Jest mock typing limitation
            mockShowConflictDialog.mockResolvedValue(ConflictResolution.Cancel);

            await expect(
                provider.writeFile(uri as any, newContent, { create: false, overwrite: true })
            ).rejects.toThrow('Unavailable');

            // Verify conflict dialog was shown with correct info
            expect(mockShowConflictDialog).toHaveBeenCalledWith({
                uri,
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                localModifiedOn: baseTime,
                remoteModifiedOn: laterTime,
                localContent: 'my changes',
                remoteContent: 'someone else changed this'
            });

            // Verify draft was NOT saved
            expect(mockRegistryService.updateDraftContent).not.toHaveBeenCalled();
        });

        it('should save successfully when no conflict detected (timestamps match)', async () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');

            // Step 1: User opens draft
            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'original content',
                contentType: 'application/json'
            });
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: baseTime,
                createdOn: baseTime
            } as any);

            await provider.readFile(uri as any);

            // Step 2: User tries to save (writeFile)
            const newContent = Buffer.from('my changes');

            // Mock conflict check - remote has NOT been modified (returns baseTime)
            // First call in checkForConflict
            mockRegistryService.getVersionMetadata.mockResolvedValueOnce({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: baseTime,  // Same timestamp - no conflict
                createdOn: baseTime
            } as any);

            // Mock successful save
            mockRegistryService.updateDraftContent.mockResolvedValue();

            // After save, get updated metadata
            // Second call after updateDraftContent
            const afterSaveTime = new Date('2025-11-03T11:00:00.000Z');
            mockRegistryService.getVersionMetadata.mockResolvedValueOnce({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: afterSaveTime,
                createdOn: baseTime
            } as any);

            await provider.writeFile(uri as any, newContent, { create: false, overwrite: true });

            // Verify conflict dialog was NOT shown
            expect(mockShowConflictDialog).not.toHaveBeenCalled();

            // Verify draft was saved
            expect(mockRegistryService.updateDraftContent).toHaveBeenCalledWith(
                'g', 'a', '1.0.0', 'my changes'
            );

            // Verify success message
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Saved')
            );
        });
    });

    describe('Conflict Resolution Options', () => {
        const setupConflict = async () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');

            // User opens draft
            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'original content',
                contentType: 'application/json'
            });
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: baseTime,
                createdOn: baseTime
            } as any);

            await provider.readFile(uri as any);

            // Remote is modified
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: laterTime,
                createdOn: baseTime
            } as any);
            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'remote changes',
                contentType: 'application/json'
            });

            return uri;
        };

        it('should overwrite remote when user chooses Overwrite', async () => {
            const uri = await setupConflict();
            const newContent = Buffer.from('my changes');

            // User chooses to overwrite
            // @ts-ignore - Jest mock typing limitation
            mockShowConflictDialog.mockResolvedValue(ConflictResolution.Overwrite);

            // Mock successful save
            mockRegistryService.updateDraftContent.mockResolvedValue();
            const afterSaveTime = new Date('2025-11-03T11:00:00.000Z');
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: afterSaveTime,
                createdOn: baseTime
            } as any);

            await provider.writeFile(uri as any, newContent, { create: false, overwrite: true });

            // Verify save was called with local changes
            expect(mockRegistryService.updateDraftContent).toHaveBeenCalledWith(
                'g', 'a', '1.0.0', 'my changes'
            );

            // Verify warning shown
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('overwriting remote version')
            );
        });

        it('should discard local changes when user chooses Discard', async () => {
            const uri = await setupConflict();
            const newContent = Buffer.from('my changes');

            // User chooses to discard local changes
            // @ts-ignore - Jest mock typing limitation
            mockShowConflictDialog.mockResolvedValue(ConflictResolution.Discard);

            await provider.writeFile(uri as any, newContent, { create: false, overwrite: true });

            // Verify save was NOT called
            expect(mockRegistryService.updateDraftContent).not.toHaveBeenCalled();

            // Verify informational message
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Local changes discarded')
            );
        });

        it('should cancel save when user chooses Cancel', async () => {
            const uri = await setupConflict();
            const newContent = Buffer.from('my changes');

            // User chooses to cancel
            // @ts-ignore - Jest mock typing limitation
            mockShowConflictDialog.mockResolvedValue(ConflictResolution.Cancel);

            await expect(
                provider.writeFile(uri as any, newContent, { create: false, overwrite: true })
            ).rejects.toThrow('Unavailable');

            // Verify save was NOT called
            expect(mockRegistryService.updateDraftContent).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should handle draft deleted remotely (404 error)', async () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');

            // User opens draft
            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'original content',
                contentType: 'application/json'
            });
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: baseTime,
                createdOn: baseTime
            } as any);

            await provider.readFile(uri as any);

            // Draft is deleted remotely
            mockRegistryService.getVersionMetadata.mockRejectedValue(
                new Error('Failed to get metadata for g/a@1.0.0: 404')
            );

            // User tries to save
            const newContent = Buffer.from('my changes');

            // User chooses to cancel
            // @ts-ignore - Jest mock typing limitation
            mockShowErrorMessage.mockResolvedValue('Cancel');

            await expect(
                provider.writeFile(uri as any, newContent, { create: false, overwrite: true })
            ).rejects.toThrow('Unavailable');

            // Verify error dialog shown
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('has been deleted'),
                { modal: true },
                'Discard Changes',
                'Cancel'
            );
        });

        it('should handle draft published remotely (405 error)', async () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');

            // User opens draft
            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'original content',
                contentType: 'application/json'
            });
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: baseTime,
                createdOn: baseTime
            } as any);

            await provider.readFile(uri as any);

            // No conflict detected, but save fails because draft was published
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: baseTime,
                createdOn: baseTime
            } as any);

            mockRegistryService.updateDraftContent.mockRejectedValue(
                new Error('Cannot update published version: 405')
            );

            // User tries to save
            const newContent = Buffer.from('my changes');

            // User chooses to cancel
            // @ts-ignore - Jest mock typing limitation
            mockShowErrorMessage.mockResolvedValue('Cancel');

            await expect(
                provider.writeFile(uri as any, newContent, { create: false, overwrite: true })
            ).rejects.toThrow();

            // Verify error dialog shown
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('has been published'),
                { modal: true },
                'Create New Draft',
                'Discard Changes',
                'Cancel'
            );
        });

        it('should handle network error during conflict check with retry', async () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');

            // User opens draft
            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'original content',
                contentType: 'application/json'
            });
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: baseTime,
                createdOn: baseTime
            } as any);

            await provider.readFile(uri as any);

            // First attempt: network error
            let callCount = 0;
            mockRegistryService.getVersionMetadata.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.reject(new Error('Network error: ECONNREFUSED'));
                } else {
                    return Promise.resolve({
                        groupId: 'g',
                        artifactId: 'a',
                        version: '1.0.0',
                        state: 'DRAFT',
                        modifiedOn: baseTime,
                        createdOn: baseTime
                    } as any);
                }
            });

            // User chooses to retry
            // @ts-ignore - Jest mock typing limitation
            mockShowWarningMessage.mockResolvedValue('Retry');

            // Mock successful save after retry
            mockRegistryService.updateDraftContent.mockResolvedValue();
            const afterSaveTime = new Date('2025-11-03T11:00:00.000Z');

            // User tries to save
            const newContent = Buffer.from('my changes');

            await provider.writeFile(uri as any, newContent, { create: false, overwrite: true });

            // Verify warning shown for network error
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('Cannot check for conflicts'),
                { modal: true },
                'Retry',
                'Force Save',
                'Cancel'
            );

            // Verify save was called after retry
            expect(mockRegistryService.updateDraftContent).toHaveBeenCalledWith(
                'g', 'a', '1.0.0', 'my changes'
            );
        });

        it('should handle force save when network error and user chooses Force Save', async () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');

            // User opens draft
            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'original content',
                contentType: 'application/json'
            });
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: baseTime,
                createdOn: baseTime
            } as any);

            await provider.readFile(uri as any);

            // Network error during conflict check
            mockRegistryService.getVersionMetadata.mockRejectedValue(
                new Error('Network error: ECONNREFUSED')
            );

            // User chooses to force save
            // @ts-ignore - Jest mock typing limitation
            mockShowWarningMessage.mockResolvedValue('Force Save');

            // Mock successful save
            mockRegistryService.updateDraftContent.mockResolvedValue();
            const afterSaveTime = new Date('2025-11-03T11:00:00.000Z');
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: afterSaveTime,
                createdOn: baseTime
            } as any);

            // User tries to save
            const newContent = Buffer.from('my changes');

            await provider.writeFile(uri as any, newContent, { create: false, overwrite: true });

            // Verify save was called despite network error
            expect(mockRegistryService.updateDraftContent).toHaveBeenCalledWith(
                'g', 'a', '1.0.0', 'my changes'
            );
        });
    });

    describe('Timestamp Tracking', () => {
        it('should update timestamp after successful save', async () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');

            // User opens draft
            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'original content',
                contentType: 'application/json'
            });
            // Call 1: readFile calls getVersionMetadata
            mockRegistryService.getVersionMetadata.mockResolvedValueOnce({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: baseTime,
                createdOn: baseTime
            } as any);

            await provider.readFile(uri as any);

            // First save (no conflict)
            mockRegistryService.updateDraftContent.mockResolvedValue();
            const afterSaveTime = new Date('2025-11-03T11:00:00.000Z');

            // Call 2: First writeFile → checkForConflict calls getVersionMetadata
            mockRegistryService.getVersionMetadata.mockResolvedValueOnce({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: baseTime,  // Same as tracked - no conflict
                createdOn: baseTime
            } as any);

            // Call 3: First writeFile → after save, get updated metadata
            mockRegistryService.getVersionMetadata.mockResolvedValueOnce({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: afterSaveTime,
                createdOn: baseTime
            } as any);

            const newContent = Buffer.from('first save');
            await provider.writeFile(uri as any, newContent, { create: false, overwrite: true });

            // Second save - should use updated timestamp
            const secondSaveContent = Buffer.from('second save');

            // Call 4: Second writeFile → checkForConflict calls getVersionMetadata
            mockRegistryService.getVersionMetadata.mockResolvedValueOnce({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: afterSaveTime,  // Same as tracked - no conflict
                createdOn: baseTime
            } as any);

            // Call 5: Second writeFile → after save, get updated metadata
            mockRegistryService.getVersionMetadata.mockResolvedValueOnce({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: afterSaveTime,
                createdOn: baseTime
            } as any);

            await provider.writeFile(uri as any, secondSaveContent, { create: false, overwrite: true });

            // Verify no conflict detected on second save
            expect(mockShowConflictDialog).not.toHaveBeenCalled();
            expect(mockRegistryService.updateDraftContent).toHaveBeenCalledTimes(2);
        });

        it('should stop tracking when stopTracking is called', () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');

            // Track timestamp
            conflictDetector.trackOpened(uri as any, baseTime);

            // Stop tracking
            conflictDetector.stopTracking(uri as any);

            // Check conflict - should return null (not tracked)
            const conflict = conflictDetector.checkForConflict(uri as any, 'content');

            expect(conflict).resolves.toBeNull();
        });
    });
});
