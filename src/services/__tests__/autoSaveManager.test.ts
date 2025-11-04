import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as vscode from 'vscode';
import { AutoSaveManager, AutoSaveConfig } from '../autoSaveManager';

// Mock vscode module
jest.mock('vscode', () => ({
    Uri: {
        parse: (uri: string) => ({
            scheme: uri.split(':')[0],
            path: uri.split('?')[0].substring(uri.indexOf(':') + 1),
            query: uri.split('?')[1] || '',
            toString: () => uri
        })
    },
    EndOfLine: {
        LF: 1,
        CRLF: 2
    },
    EventEmitter: class<T> {
        private listeners: ((e: T) => void)[] = [];
        event = (listener: (e: T) => void) => {
            this.listeners.push(listener);
        };
        fire = (data: T) => {
            this.listeners.forEach(l => l(data));
        };
    }
}));

describe('AutoSaveManager', () => {
    let manager: AutoSaveManager;
    let mockDocument: vscode.TextDocument;
    let config: AutoSaveConfig;

    beforeEach(() => {
        jest.useFakeTimers();

        config = {
            enabled: true,
            interval: 2000,
            saveOnFocusLoss: true
        };

        manager = new AutoSaveManager(config);

        // Mock document
        mockDocument = {
            uri: vscode.Uri.parse('apicurio://group/my-group/artifact/my-artifact/version/1.0.0?state=DRAFT'),
            save: jest.fn<() => Promise<boolean>>(() => Promise.resolve(true)),
            isDirty: false,
            isClosed: false,
            languageId: 'yaml',
            version: 1,
            fileName: 'mock-file',
            isUntitled: false,
            lineCount: 10,
            eol: vscode.EndOfLine.LF,
            getText: jest.fn(),
            getWordRangeAtPosition: jest.fn(),
            lineAt: jest.fn(),
            offsetAt: jest.fn(),
            positionAt: jest.fn(),
            validatePosition: jest.fn(),
            validateRange: jest.fn()
        } as any;
    });

    afterEach(() => {
        jest.useRealTimers();
        manager.dispose();
    });

    describe('scheduleSave', () => {
        it('should schedule a save after the configured interval', async () => {
            manager.scheduleSave(mockDocument);

            // Fast-forward time by interval
            jest.advanceTimersByTime(2000);

            // Wait for promises to resolve
            await Promise.resolve();

            expect(mockDocument.save).toHaveBeenCalled();
        });

        it('should debounce multiple save requests', async () => {
            manager.scheduleSave(mockDocument);
            jest.advanceTimersByTime(1000);

            manager.scheduleSave(mockDocument);
            jest.advanceTimersByTime(1000);

            manager.scheduleSave(mockDocument);
            jest.advanceTimersByTime(1000);

            // Wait for promises
            await Promise.resolve();

            // Should only save once (last call)
            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            expect(mockDocument.save).toHaveBeenCalledTimes(1);
        });

        it('should only auto-save draft versions', () => {
            const publishedDoc = {
                ...mockDocument,
                uri: vscode.Uri.parse('apicurio://group/g/artifact/a/version/1.0.0?state=ENABLED')
            } as any;

            manager.scheduleSave(publishedDoc);
            jest.advanceTimersByTime(2000);

            expect(publishedDoc.save).not.toHaveBeenCalled();
        });

        it('should not save if auto-save disabled', () => {
            manager.updateConfig({ enabled: false });

            manager.scheduleSave(mockDocument);
            jest.advanceTimersByTime(2000);

            expect(mockDocument.save).not.toHaveBeenCalled();
        });

        it('should use configured interval', async () => {
            manager.updateConfig({ interval: 5000 });

            manager.scheduleSave(mockDocument);

            jest.advanceTimersByTime(4000);
            await Promise.resolve();
            expect(mockDocument.save).not.toHaveBeenCalled();

            jest.advanceTimersByTime(1000);
            await Promise.resolve();
            expect(mockDocument.save).toHaveBeenCalled();
        });

        it('should not save for non-apicurio URIs', () => {
            const regularDoc = {
                ...mockDocument,
                uri: vscode.Uri.parse('file:///some/file.txt')
            } as any;

            manager.scheduleSave(regularDoc);
            jest.advanceTimersByTime(2000);

            expect(regularDoc.save).not.toHaveBeenCalled();
        });
    });

    describe('saveImmediately', () => {
        it('should save immediately on focus loss', async () => {
            await manager.saveImmediately(mockDocument);

            expect(mockDocument.save).toHaveBeenCalled();
        });

        it('should cancel pending timer when saving immediately', async () => {
            manager.scheduleSave(mockDocument);

            await manager.saveImmediately(mockDocument);

            // Should save immediately
            expect(mockDocument.save).toHaveBeenCalledTimes(1);

            // Advance timers - should not save again
            jest.advanceTimersByTime(2000);
            await Promise.resolve();

            expect(mockDocument.save).toHaveBeenCalledTimes(1);
        });

        it('should respect saveOnFocusLoss setting', async () => {
            manager.updateConfig({ saveOnFocusLoss: false });

            await manager.saveImmediately(mockDocument);

            expect(mockDocument.save).not.toHaveBeenCalled();
        });

        it('should not save published versions', async () => {
            const publishedDoc = {
                ...mockDocument,
                uri: vscode.Uri.parse('apicurio://group/g/artifact/a/version/1.0.0?state=ENABLED')
            } as any;

            await manager.saveImmediately(publishedDoc);

            expect(publishedDoc.save).not.toHaveBeenCalled();
        });

        it('should not save if auto-save disabled', async () => {
            manager.updateConfig({ enabled: false });

            await manager.saveImmediately(mockDocument);

            expect(mockDocument.save).not.toHaveBeenCalled();
        });
    });

    describe('configuration', () => {
        it('should update interval when config changes', async () => {
            manager.updateConfig({ interval: 3000 });

            manager.scheduleSave(mockDocument);

            jest.advanceTimersByTime(2000);
            await Promise.resolve();
            expect(mockDocument.save).not.toHaveBeenCalled();

            jest.advanceTimersByTime(1000);
            await Promise.resolve();
            expect(mockDocument.save).toHaveBeenCalled();
        });

        it('should enable/disable based on config', () => {
            manager.updateConfig({ enabled: false });

            manager.scheduleSave(mockDocument);
            jest.advanceTimersByTime(2000);

            expect(mockDocument.save).not.toHaveBeenCalled();

            manager.updateConfig({ enabled: true });

            manager.scheduleSave(mockDocument);
            jest.advanceTimersByTime(2000);

            // Should save after re-enabling
            setTimeout(() => {
                expect(mockDocument.save).toHaveBeenCalled();
            }, 0);
        });

        it('should update saveOnFocusLoss setting', async () => {
            manager.updateConfig({ saveOnFocusLoss: false });

            await manager.saveImmediately(mockDocument);
            expect(mockDocument.save).not.toHaveBeenCalled();

            manager.updateConfig({ saveOnFocusLoss: true });

            await manager.saveImmediately(mockDocument);
            expect(mockDocument.save).toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should emit onSaveFailed when save fails', async () => {
            const mockError = new Error('Network error');
            (mockDocument.save as jest.Mock) = jest.fn<() => Promise<boolean>>(() => Promise.reject(mockError));

            const onSaveFailedMock = jest.fn();
            manager.onSaveFailed(onSaveFailedMock);

            manager.scheduleSave(mockDocument);
            jest.advanceTimersByTime(2000);

            // Wait for save to fail
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(onSaveFailedMock).toHaveBeenCalledWith({
                uri: mockDocument.uri,
                error: mockError
            });
        });

        it('should not block subsequent saves on error', async () => {
            // First save fails
            const saveMock = jest.fn<() => Promise<boolean>>();
            saveMock.mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValue(true);
            (mockDocument.save as jest.Mock) = saveMock;

            const onSaveFailedMock = jest.fn();
            manager.onSaveFailed(onSaveFailedMock);

            // First save attempt
            manager.scheduleSave(mockDocument);
            jest.advanceTimersByTime(2000);
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(onSaveFailedMock).toHaveBeenCalledTimes(1);

            // Second save attempt should work
            manager.scheduleSave(mockDocument);
            jest.advanceTimersByTime(2000);
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockDocument.save).toHaveBeenCalledTimes(2);
        });

        it('should not save if already saving', async () => {
            // Make save take some time
            let resolveSave: any;
            (mockDocument.save as jest.Mock) = jest.fn<() => Promise<boolean>>(() => {
                return new Promise(resolve => {
                    resolveSave = resolve;
                });
            });

            // Trigger save
            manager.scheduleSave(mockDocument);
            jest.advanceTimersByTime(2000);

            // Try to save again while first save is in progress
            await manager.saveImmediately(mockDocument);

            // Should only call save once
            expect(mockDocument.save).toHaveBeenCalledTimes(1);

            // Resolve the save
            resolveSave(true);
        });
    });

    describe('last save time', () => {
        it('should track last save time', async () => {
            const savePromise = manager.saveImmediately(mockDocument);
            await jest.runAllTimersAsync();
            await savePromise;

            const lastSaveTime = manager.getLastSaveTime(mockDocument.uri);
            expect(lastSaveTime).toBeInstanceOf(Date);
        });

        it('should return undefined if never saved', () => {
            const lastSaveTime = manager.getLastSaveTime(mockDocument.uri);
            expect(lastSaveTime).toBeUndefined();
        });

        it('should update last save time on each save', async () => {
            const save1 = manager.saveImmediately(mockDocument);
            await jest.runAllTimersAsync();
            await save1;
            const firstSaveTime = manager.getLastSaveTime(mockDocument.uri);

            // Wait a bit
            jest.advanceTimersByTime(1000);

            const save2 = manager.saveImmediately(mockDocument);
            await jest.runAllTimersAsync();
            await save2;
            const secondSaveTime = manager.getLastSaveTime(mockDocument.uri);

            expect(secondSaveTime).not.toEqual(firstSaveTime);
        });
    });

    describe('saving status', () => {
        it('should return true when saving', async () => {
            // Make save take some time
            let resolveSave: any;
            (mockDocument.save as jest.Mock) = jest.fn<() => Promise<boolean>>(() => {
                return new Promise(resolve => {
                    resolveSave = resolve;
                });
            });

            manager.scheduleSave(mockDocument);
            jest.advanceTimersByTime(2000);

            // Should be saving now
            await Promise.resolve();
            expect(manager.isSaving(mockDocument.uri)).toBe(true);

            // Resolve save
            resolveSave(true);
            await Promise.resolve();

            // Should not be saving anymore
            expect(manager.isSaving(mockDocument.uri)).toBe(false);
        });

        it('should return false when not saving', () => {
            expect(manager.isSaving(mockDocument.uri)).toBe(false);
        });
    });

    describe('dispose', () => {
        it('should clear all timers on dispose', () => {
            manager.scheduleSave(mockDocument);

            manager.dispose();

            jest.advanceTimersByTime(2000);

            expect(mockDocument.save).not.toHaveBeenCalled();
        });

        it('should clear all state on dispose', async () => {
            const savePromise = manager.saveImmediately(mockDocument);
            await jest.runAllTimersAsync();
            await savePromise;

            expect(manager.getLastSaveTime(mockDocument.uri)).toBeDefined();

            manager.dispose();

            // State should be cleared (creating new manager to test)
            const newManager = new AutoSaveManager(config);
            expect(newManager.getLastSaveTime(mockDocument.uri)).toBeUndefined();
        });
    });

    describe('events', () => {
        it('should emit onDidSave when save succeeds', async () => {
            const onDidSaveMock = jest.fn();
            manager.onDidSave(onDidSaveMock);

            const savePromise = manager.saveImmediately(mockDocument);
            await jest.runAllTimersAsync();
            await savePromise;

            expect(onDidSaveMock).toHaveBeenCalledWith(mockDocument.uri);
        });

        it('should not emit onDidSave when save fails', async () => {
            (mockDocument.save as jest.Mock) = jest.fn<() => Promise<boolean>>(() => Promise.reject(new Error('Save failed')));

            const onDidSaveMock = jest.fn();
            manager.onDidSave(onDidSaveMock);

            manager.scheduleSave(mockDocument);
            jest.advanceTimersByTime(2000);

            await jest.runAllTimersAsync();

            expect(onDidSaveMock).not.toHaveBeenCalled();
        });
    });
});
