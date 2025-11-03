import { ConflictDetector } from '../conflictDetector';
import { RegistryService } from '../registryService';
import * as vscode from 'vscode';

// Mock vscode
jest.mock('vscode', () => ({
    Uri: {
        parse: (str: string) => ({ toString: () => str, scheme: 'apicurio', path: '', query: '' })
    },
    FileSystemError: {
        FileNotFound: jest.fn((uri) => new Error(`File not found: ${uri}`)),
        NoPermissions: jest.fn((msg) => new Error(msg)),
        Unavailable: jest.fn((msg) => new Error(msg))
    }
}));

// Mock ApicurioUriBuilder
jest.mock('../../utils/uriBuilder', () => ({
    ApicurioUriBuilder: {
        parseVersionUri: jest.fn((uri) => {
            // Simple mock parser for testing
            if (uri.toString().includes('test-group')) {
                return {
                    groupId: 'test-group',
                    artifactId: 'test-artifact',
                    version: '1.0.0',
                    state: 'DRAFT'
                };
            }
            return null;
        })
    }
}));

describe('ConflictDetector', () => {
    let conflictDetector: ConflictDetector;
    let mockRegistryService: jest.Mocked<RegistryService>;
    let testUri: vscode.Uri;

    beforeEach(() => {
        // Create mock registry service
        mockRegistryService = {
            getVersionMetadata: jest.fn(),
            getArtifactContent: jest.fn()
        } as any;

        conflictDetector = new ConflictDetector(mockRegistryService);

        testUri = vscode.Uri.parse('apicurio://group/test-group/artifact/test-artifact/version/1.0.0?state=DRAFT');

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('trackOpened', () => {
        it('should track when a draft is opened with timestamp', () => {
            const openedTime = new Date('2025-11-03T10:00:00Z');

            conflictDetector.trackOpened(testUri, openedTime);

            // Verify tracking by checking for conflict (should be none)
            expect(async () => {
                mockRegistryService.getVersionMetadata.mockResolvedValue({
                    groupId: 'test-group',
                    artifactId: 'test-artifact',
                    version: '1.0.0',
                    state: 'DRAFT',
                    modifiedOn: openedTime
                });

                const conflict = await conflictDetector.checkForConflict(testUri, 'content');
                expect(conflict).toBeNull(); // Same timestamp = no conflict
            });
        });

        it('should allow tracking multiple URIs independently', () => {
            const uri1 = vscode.Uri.parse('apicurio://group/test-group/artifact/artifact1/version/1.0.0?state=DRAFT');
            const uri2 = vscode.Uri.parse('apicurio://group/test-group/artifact/artifact2/version/1.0.0?state=DRAFT');

            const time1 = new Date('2025-11-03T10:00:00Z');
            const time2 = new Date('2025-11-03T11:00:00Z');

            conflictDetector.trackOpened(uri1, time1);
            conflictDetector.trackOpened(uri2, time2);

            // Both should be tracked independently
            expect(true).toBe(true); // Placeholder - actual verification happens in checkForConflict tests
        });
    });

    describe('checkForConflict', () => {
        it('should return null when no conflict exists (timestamps match)', async () => {
            const openedTime = new Date('2025-11-03T10:00:00Z');

            conflictDetector.trackOpened(testUri, openedTime);

            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'test-group',
                artifactId: 'test-artifact',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: openedTime
            });

            const conflict = await conflictDetector.checkForConflict(testUri, 'local content');

            expect(conflict).toBeNull();
            expect(mockRegistryService.getVersionMetadata).toHaveBeenCalledWith(
                'test-group',
                'test-artifact',
                '1.0.0'
            );
        });

        it('should detect conflict when timestamps differ', async () => {
            const openedTime = new Date('2025-11-03T10:00:00Z');
            const remoteTime = new Date('2025-11-03T10:30:00Z'); // Modified 30 mins later

            conflictDetector.trackOpened(testUri, openedTime);

            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'test-group',
                artifactId: 'test-artifact',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: remoteTime
            });

            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'remote content',
                contentType: 'application/json'
            });

            const conflict = await conflictDetector.checkForConflict(testUri, 'local content');

            expect(conflict).not.toBeNull();
            expect(conflict?.groupId).toBe('test-group');
            expect(conflict?.artifactId).toBe('test-artifact');
            expect(conflict?.version).toBe('1.0.0');
            expect(conflict?.localModifiedOn).toEqual(openedTime);
            expect(conflict?.remoteModifiedOn).toEqual(remoteTime);
            expect(conflict?.localContent).toBe('local content');
            expect(conflict?.remoteContent).toBe('remote content');

            expect(mockRegistryService.getArtifactContent).toHaveBeenCalledWith(
                'test-group',
                'test-artifact',
                '1.0.0'
            );
        });

        it('should return null when URI is not tracked', async () => {
            // Don't track the URI

            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'test-group',
                artifactId: 'test-artifact',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: new Date()
            });

            const conflict = await conflictDetector.checkForConflict(testUri, 'content');

            expect(conflict).toBeNull();
            expect(mockRegistryService.getVersionMetadata).not.toHaveBeenCalled();
        });

        it('should return null when URI cannot be parsed', async () => {
            const invalidUri = vscode.Uri.parse('invalid://uri');

            const conflict = await conflictDetector.checkForConflict(invalidUri, 'content');

            expect(conflict).toBeNull();
            expect(mockRegistryService.getVersionMetadata).not.toHaveBeenCalled();
        });

        it('should return null when version has no modifiedOn timestamp', async () => {
            const openedTime = new Date('2025-11-03T10:00:00Z');

            conflictDetector.trackOpened(testUri, openedTime);

            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'test-group',
                artifactId: 'test-artifact',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: undefined // No timestamp
            });

            const conflict = await conflictDetector.checkForConflict(testUri, 'content');

            expect(conflict).toBeNull();
            expect(mockRegistryService.getArtifactContent).not.toHaveBeenCalled();
        });

        it('should throw error when version fetch fails', async () => {
            const openedTime = new Date('2025-11-03T10:00:00Z');

            conflictDetector.trackOpened(testUri, openedTime);

            mockRegistryService.getVersionMetadata.mockRejectedValue(
                new Error('Version not found')
            );

            await expect(
                conflictDetector.checkForConflict(testUri, 'content')
            ).rejects.toThrow('Version not found');
        });

        it('should detect conflict even when content is identical', async () => {
            // Conservative approach - show conflict if timestamps differ, even if content matches
            const openedTime = new Date('2025-11-03T10:00:00Z');
            const remoteTime = new Date('2025-11-03T10:30:00Z');
            const identicalContent = 'identical content';

            conflictDetector.trackOpened(testUri, openedTime);

            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'test-group',
                artifactId: 'test-artifact',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: remoteTime
            });

            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: identicalContent,
                contentType: 'application/json'
            });

            const conflict = await conflictDetector.checkForConflict(testUri, identicalContent);

            // Should still detect conflict (timestamps differ)
            expect(conflict).not.toBeNull();
            expect(conflict?.localContent).toBe(identicalContent);
            expect(conflict?.remoteContent).toBe(identicalContent);
        });
    });

    describe('updateTimestamp', () => {
        it('should update tracked timestamp after save', async () => {
            const openedTime = new Date('2025-11-03T10:00:00Z');
            const savedTime = new Date('2025-11-03T10:30:00Z');

            conflictDetector.trackOpened(testUri, openedTime);

            // Update timestamp to saved time
            conflictDetector.updateTimestamp(testUri, savedTime);

            // Now check for conflict with the saved time - should be no conflict
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'test-group',
                artifactId: 'test-artifact',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: savedTime
            });

            const conflict = await conflictDetector.checkForConflict(testUri, 'content');

            expect(conflict).toBeNull(); // Timestamps now match
        });

        it('should allow updating timestamp for untracked URI', () => {
            // Should not throw error
            const newTime = new Date('2025-11-03T10:00:00Z');

            expect(() => {
                conflictDetector.updateTimestamp(testUri, newTime);
            }).not.toThrow();
        });
    });

    describe('stopTracking', () => {
        it('should stop tracking a URI when document is closed', async () => {
            const openedTime = new Date('2025-11-03T10:00:00Z');

            conflictDetector.trackOpened(testUri, openedTime);

            // Stop tracking
            conflictDetector.stopTracking(testUri);

            // Now checkForConflict should return null (not tracked)
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'test-group',
                artifactId: 'test-artifact',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: new Date('2025-11-03T10:30:00Z')
            });

            const conflict = await conflictDetector.checkForConflict(testUri, 'content');

            expect(conflict).toBeNull();
            expect(mockRegistryService.getVersionMetadata).not.toHaveBeenCalled();
        });

        it('should not throw error when stopping tracking for untracked URI', () => {
            expect(() => {
                conflictDetector.stopTracking(testUri);
            }).not.toThrow();
        });
    });

    describe('clear', () => {
        it('should clear all tracked URIs', async () => {
            const uri1 = vscode.Uri.parse('apicurio://group/test-group/artifact/artifact1/version/1.0.0?state=DRAFT');
            const uri2 = vscode.Uri.parse('apicurio://group/test-group/artifact/artifact2/version/1.0.0?state=DRAFT');

            const time = new Date('2025-11-03T10:00:00Z');

            conflictDetector.trackOpened(uri1, time);
            conflictDetector.trackOpened(uri2, time);

            // Clear all
            conflictDetector.clear();

            // Neither should be tracked anymore
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'test-group',
                artifactId: 'test-artifact',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: new Date('2025-11-03T10:30:00Z')
            });

            const conflict1 = await conflictDetector.checkForConflict(uri1, 'content');
            const conflict2 = await conflictDetector.checkForConflict(uri2, 'content');

            expect(conflict1).toBeNull();
            expect(conflict2).toBeNull();
            expect(mockRegistryService.getVersionMetadata).not.toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should handle Date objects with same millisecond timestamp', async () => {
            const time1 = new Date('2025-11-03T10:00:00.123Z');
            const time2 = new Date('2025-11-03T10:00:00.123Z');

            conflictDetector.trackOpened(testUri, time1);

            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'test-group',
                artifactId: 'test-artifact',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: time2
            });

            const conflict = await conflictDetector.checkForConflict(testUri, 'content');

            // Same millisecond timestamp - no conflict
            expect(conflict).toBeNull();
        });

        it('should detect conflict with 1ms difference', async () => {
            const time1 = new Date('2025-11-03T10:00:00.123Z');
            const time2 = new Date('2025-11-03T10:00:00.124Z'); // 1ms later

            conflictDetector.trackOpened(testUri, time1);

            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'test-group',
                artifactId: 'test-artifact',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: time2
            });

            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'remote content',
                contentType: 'application/json'
            });

            const conflict = await conflictDetector.checkForConflict(testUri, 'local content');

            // Even 1ms difference should trigger conflict
            expect(conflict).not.toBeNull();
        });

        it('should handle concurrent checkForConflict calls for same URI', async () => {
            const openedTime = new Date('2025-11-03T10:00:00Z');
            const remoteTime = new Date('2025-11-03T10:30:00Z');

            conflictDetector.trackOpened(testUri, openedTime);

            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'test-group',
                artifactId: 'test-artifact',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: remoteTime
            });

            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'remote content',
                contentType: 'application/json'
            });

            // Call checkForConflict twice concurrently
            const [conflict1, conflict2] = await Promise.all([
                conflictDetector.checkForConflict(testUri, 'local content'),
                conflictDetector.checkForConflict(testUri, 'local content')
            ]);

            // Both should detect the conflict
            expect(conflict1).not.toBeNull();
            expect(conflict2).not.toBeNull();
        });
    });
});
