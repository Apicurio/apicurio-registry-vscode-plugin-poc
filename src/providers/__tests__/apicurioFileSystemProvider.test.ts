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
            showInformationMessage: jest.fn(),
            showErrorMessage: jest.fn()
        }
    };
}, { virtual: true });

import { ApicurioFileSystemProvider } from '../apicurioFileSystemProvider';
import { RegistryService } from '../../services/registryService';
import { ConflictDetector } from '../../services/conflictDetector';

const vscode = require('vscode');
const MockUri = vscode.Uri;

describe('ApicurioFileSystemProvider', () => {
    let provider: ApicurioFileSystemProvider;
    let mockRegistryService: jest.Mocked<RegistryService>;
    let mockConflictDetector: jest.Mocked<ConflictDetector>;

    beforeEach(() => {
        mockRegistryService = {
            getArtifactContent: jest.fn(),
            updateDraftContent: jest.fn(),
            getVersionMetadata: jest.fn()
        } as any;

        mockConflictDetector = {
            trackOpened: jest.fn(),
            checkForConflict: jest.fn(),
            updateTimestamp: jest.fn(),
            stopTracking: jest.fn(),
            clear: jest.fn()
        } as any;

        provider = new ApicurioFileSystemProvider(mockRegistryService, mockConflictDetector);
    });

    describe('readFile', () => {
        it('should fetch content from registry', async () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');
            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'test content',
                contentType: 'application/json'
            });
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: '2024-01-01T00:00:00Z'
            } as any);

            const data = await provider.readFile(uri as any);
            const content = Buffer.from(data).toString();

            expect(content).toBe('test content');
            expect(mockRegistryService.getArtifactContent).toHaveBeenCalledWith('g', 'a', '1.0.0');
        });

        it('should throw FileNotFound for invalid URI', async () => {
            const uri = MockUri.parse('apicurio:/invalid');

            await expect(provider.readFile(uri as any)).rejects.toThrow();
        });

        it('should cache content after reading', async () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');
            mockRegistryService.getArtifactContent.mockResolvedValue({
                content: 'test content',
                contentType: 'application/json'
            });
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: '2024-01-01T00:00:00Z'
            } as any);

            await provider.readFile(uri as any);
            await provider.readFile(uri as any);

            // Should only call registry once (cached)
            expect(mockRegistryService.getArtifactContent).toHaveBeenCalledTimes(1);
        });
    });

    describe('writeFile', () => {
        it('should save draft content to registry', async () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');
            const content = Buffer.from('updated content');

            mockRegistryService.updateDraftContent.mockResolvedValue();
            mockRegistryService.getVersionMetadata.mockResolvedValue({
                groupId: 'g',
                artifactId: 'a',
                version: '1.0.0',
                state: 'DRAFT',
                modifiedOn: '2024-01-01T00:00:01Z'
            } as any);

            await provider.writeFile(uri as any, content, { create: false, overwrite: true });

            expect(mockRegistryService.updateDraftContent).toHaveBeenCalledWith(
                'g',
                'a',
                '1.0.0',
                'updated content'
            );
        });

        it('should throw NoPermissions for published version', async () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=ENABLED');
            const content = Buffer.from('updated content');

            await expect(
                provider.writeFile(uri as any, content, { create: false, overwrite: true })
            ).rejects.toThrow('NoPermissions');
        });

        it('should handle network failures gracefully', async () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');
            const content = Buffer.from('updated content');

            mockRegistryService.updateDraftContent.mockRejectedValue(
                new Error('Network error')
            );

            await expect(
                provider.writeFile(uri as any, content, { create: false, overwrite: true })
            ).rejects.toThrow();
        });
    });

    describe('stat', () => {
        it('should return file stats', () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');

            const stats = provider.stat(uri as any);

            expect(stats.type).toBe(vscode.FileType.File);
            expect(stats.size).toBeGreaterThanOrEqual(0);
        });
    });
});
