import { describe, it, expect, jest } from '@jest/globals';

// Mock vscode module before any imports that use it
jest.mock('vscode', () => {
    // Mock VSCode URI class
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
            let result = `${this.scheme}:${this.path}`;
            if (this.query) {
                result += `?${this.query}`;
            }
            return result;
        }
    }

    return {
        Uri: MockUri
    };
}, { virtual: true });

import { ApicurioUriBuilder } from '../uriBuilder';

// Get MockUri from the mock
const vscode = require('vscode');
const MockUri = vscode.Uri;

describe('ApicurioUriBuilder', () => {
    describe('buildVersionUri', () => {
        it('should build URI with correct scheme', () => {
            const uri = ApicurioUriBuilder.buildVersionUri('my-group', 'my-artifact', '1.0.0', 'DRAFT');
            expect(uri.scheme).toBe('apicurio');
        });

        it('should build URI with correct path structure', () => {
            const uri = ApicurioUriBuilder.buildVersionUri('my-group', 'my-artifact', '1.0.0', 'DRAFT');
            expect(uri.path).toBe('/group/my-group/artifact/my-artifact/version/1.0.0');
        });

        it('should build URI with state query parameter', () => {
            const uri = ApicurioUriBuilder.buildVersionUri('my-group', 'my-artifact', '1.0.0', 'DRAFT');
            expect(uri.query).toBe('state=DRAFT');
        });

        it('should URL encode special characters in groupId', () => {
            const uri = ApicurioUriBuilder.buildVersionUri('my group', 'my-artifact', '1.0.0', 'DRAFT');
            expect(uri.path).toContain('my%20group');
        });

        it('should URL encode special characters in artifactId', () => {
            const uri = ApicurioUriBuilder.buildVersionUri('my-group', 'my artifact', '1.0.0', 'DRAFT');
            expect(uri.path).toContain('my%20artifact');
        });

        it('should URL encode special characters in version', () => {
            const uri = ApicurioUriBuilder.buildVersionUri('my-group', 'my-artifact', '1.0.0-SNAPSHOT', 'DRAFT');
            expect(uri.path).toContain('1.0.0-SNAPSHOT');
        });

        it('should handle slashes in groupId', () => {
            const uri = ApicurioUriBuilder.buildVersionUri('my/group', 'my-artifact', '1.0.0', 'DRAFT');
            expect(uri.path).toContain('my%2Fgroup');
        });

        it('should support all version states', () => {
            const states = ['DRAFT', 'ENABLED', 'DISABLED', 'DEPRECATED'];
            states.forEach(state => {
                const uri = ApicurioUriBuilder.buildVersionUri('g', 'a', 'v', state);
                expect(uri.query).toBe(`state=${state}`);
            });
        });
    });

    describe('parseVersionUri', () => {
        it('should parse valid Apicurio URI', () => {
            const uri = MockUri.parse('apicurio:/group/my-group/artifact/my-artifact/version/1.0.0?state=DRAFT');
            const metadata = ApicurioUriBuilder.parseVersionUri(uri as any);

            expect(metadata).toEqual({
                groupId: 'my-group',
                artifactId: 'my-artifact',
                version: '1.0.0',
                state: 'DRAFT'
            });
        });

        it('should decode URL-encoded characters in groupId', () => {
            const uri = MockUri.parse('apicurio:/group/my%20group/artifact/my-artifact/version/1.0.0?state=DRAFT');
            const metadata = ApicurioUriBuilder.parseVersionUri(uri as any);

            expect(metadata?.groupId).toBe('my group');
        });

        it('should decode URL-encoded characters in artifactId', () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/my%20artifact/version/1.0.0?state=DRAFT');
            const metadata = ApicurioUriBuilder.parseVersionUri(uri as any);

            expect(metadata?.artifactId).toBe('my artifact');
        });

        it('should decode URL-encoded slashes in groupId', () => {
            const uri = MockUri.parse('apicurio:/group/my%2Fgroup/artifact/a/version/1.0.0?state=DRAFT');
            const metadata = ApicurioUriBuilder.parseVersionUri(uri as any);

            expect(metadata?.groupId).toBe('my/group');
        });

        it('should return null for non-Apicurio URI', () => {
            const uri = MockUri.parse('file:///path/to/file.txt');
            const metadata = ApicurioUriBuilder.parseVersionUri(uri as any);

            expect(metadata).toBeNull();
        });

        it('should return null for invalid path format', () => {
            const uri = MockUri.parse('apicurio:/invalid/path');
            const metadata = ApicurioUriBuilder.parseVersionUri(uri as any);

            expect(metadata).toBeNull();
        });

        it('should return null if state parameter is missing', () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0');
            const metadata = ApicurioUriBuilder.parseVersionUri(uri as any);

            expect(metadata).toBeNull();
        });

        it('should parse all version states', () => {
            const states = ['DRAFT', 'ENABLED', 'DISABLED', 'DEPRECATED'];
            states.forEach(state => {
                const uri = MockUri.parse(`apicurio:/group/g/artifact/a/version/v?state=${state}`);
                const metadata = ApicurioUriBuilder.parseVersionUri(uri as any);
                expect(metadata?.state).toBe(state);
            });
        });
    });

    describe('isDraft', () => {
        it('should return true for draft URI', () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DRAFT');
            expect(ApicurioUriBuilder.isDraft(uri as any)).toBe(true);
        });

        it('should return false for ENABLED URI', () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=ENABLED');
            expect(ApicurioUriBuilder.isDraft(uri as any)).toBe(false);
        });

        it('should return false for DISABLED URI', () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DISABLED');
            expect(ApicurioUriBuilder.isDraft(uri as any)).toBe(false);
        });

        it('should return false for DEPRECATED URI', () => {
            const uri = MockUri.parse('apicurio:/group/g/artifact/a/version/1.0.0?state=DEPRECATED');
            expect(ApicurioUriBuilder.isDraft(uri as any)).toBe(false);
        });

        it('should return false for non-Apicurio URI', () => {
            const uri = MockUri.parse('file:///path/to/file.txt');
            expect(ApicurioUriBuilder.isDraft(uri as any)).toBe(false);
        });

        it('should return false for invalid Apicurio URI', () => {
            const uri = MockUri.parse('apicurio:/invalid');
            expect(ApicurioUriBuilder.isDraft(uri as any)).toBe(false);
        });
    });

    describe('getDisplayName', () => {
        it('should format display name correctly', () => {
            const name = ApicurioUriBuilder.getDisplayName('my-group', 'my-artifact', '1.0.0');
            expect(name).toBe('my-group/my-artifact:1.0.0');
        });

        it('should handle special characters in groupId', () => {
            const name = ApicurioUriBuilder.getDisplayName('my group', 'my-artifact', '1.0.0');
            expect(name).toBe('my group/my-artifact:1.0.0');
        });

        it('should handle special characters in artifactId', () => {
            const name = ApicurioUriBuilder.getDisplayName('my-group', 'my artifact', '1.0.0');
            expect(name).toBe('my-group/my artifact:1.0.0');
        });

        it('should handle version with snapshot suffix', () => {
            const name = ApicurioUriBuilder.getDisplayName('g', 'a', '1.0.0-SNAPSHOT');
            expect(name).toBe('g/a:1.0.0-SNAPSHOT');
        });
    });

    describe('roundtrip: build and parse', () => {
        it('should roundtrip simple values', () => {
            const built = ApicurioUriBuilder.buildVersionUri('my-group', 'my-artifact', '1.0.0', 'DRAFT');
            const parsed = ApicurioUriBuilder.parseVersionUri(built);

            expect(parsed).toEqual({
                groupId: 'my-group',
                artifactId: 'my-artifact',
                version: '1.0.0',
                state: 'DRAFT'
            });
        });

        it('should roundtrip values with spaces', () => {
            const built = ApicurioUriBuilder.buildVersionUri('my group', 'my artifact', '1.0.0', 'ENABLED');
            const parsed = ApicurioUriBuilder.parseVersionUri(built);

            expect(parsed).toEqual({
                groupId: 'my group',
                artifactId: 'my artifact',
                version: '1.0.0',
                state: 'ENABLED'
            });
        });

        it('should roundtrip values with slashes', () => {
            const built = ApicurioUriBuilder.buildVersionUri('my/group', 'my/artifact', '1.0.0', 'DRAFT');
            const parsed = ApicurioUriBuilder.parseVersionUri(built);

            expect(parsed).toEqual({
                groupId: 'my/group',
                artifactId: 'my/artifact',
                version: '1.0.0',
                state: 'DRAFT'
            });
        });
    });
});
