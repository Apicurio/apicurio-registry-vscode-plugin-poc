import * as vscode from 'vscode';
import { ApicurioUriBuilder } from '../utils/uriBuilder';

export interface AutoSaveConfig {
    enabled: boolean;
    interval: number;  // milliseconds (default: 2000 = 2 seconds)
    saveOnFocusLoss: boolean;
}

export class AutoSaveManager {
    private saveTimers = new Map<string, NodeJS.Timeout>();
    private lastSaveTime = new Map<string, Date>();
    private savingStatus = new Map<string, boolean>();
    private config: AutoSaveConfig;

    private _onDidSave = new vscode.EventEmitter<vscode.Uri>();
    readonly onDidSave = this._onDidSave.event;

    private _onSaveFailed = new vscode.EventEmitter<{ uri: vscode.Uri; error: Error }>();
    readonly onSaveFailed = this._onSaveFailed.event;

    constructor(config: AutoSaveConfig) {
        this.config = config;
    }

    /**
     * Schedule a save for the given document.
     * Debounces: if called multiple times, only the last call takes effect.
     */
    scheduleSave(document: vscode.TextDocument): void {
        if (!this.config.enabled) {
            return;
        }

        // Only auto-save draft versions
        if (!ApicurioUriBuilder.isDraft(document.uri)) {
            return;
        }

        const uriString = document.uri.toString();

        // Clear existing timer
        const existingTimer = this.saveTimers.get(uriString);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Schedule new save
        const timer = setTimeout(async () => {
            await this.save(document);
        }, this.config.interval);

        this.saveTimers.set(uriString, timer);
    }

    /**
     * Save immediately (e.g., on focus loss).
     */
    async saveImmediately(document: vscode.TextDocument): Promise<void> {
        if (!this.config.enabled || !this.config.saveOnFocusLoss) {
            return;
        }

        // Only auto-save draft versions
        if (!ApicurioUriBuilder.isDraft(document.uri)) {
            return;
        }

        // Cancel pending timer since we're saving now
        const uriString = document.uri.toString();
        const existingTimer = this.saveTimers.get(uriString);
        if (existingTimer) {
            clearTimeout(existingTimer);
            this.saveTimers.delete(uriString);
        }

        await this.save(document);
    }

    /**
     * Perform the actual save.
     */
    private async save(document: vscode.TextDocument): Promise<void> {
        const uriString = document.uri.toString();

        // Check if already saving
        if (this.savingStatus.get(uriString)) {
            return;
        }

        try {
            this.savingStatus.set(uriString, true);

            // Use VSCode's save command which will trigger our FileSystemProvider
            await document.save();

            // Update last save time
            this.lastSaveTime.set(uriString, new Date());

            // Emit event
            this._onDidSave.fire(document.uri);

        } catch (error: any) {
            console.error('Auto-save failed:', error);
            this._onSaveFailed.fire({ uri: document.uri, error });
        } finally {
            this.savingStatus.set(uriString, false);
            this.saveTimers.delete(uriString);
        }
    }

    /**
     * Get the last save time for a document.
     */
    getLastSaveTime(uri: vscode.Uri): Date | undefined {
        return this.lastSaveTime.get(uri.toString());
    }

    /**
     * Check if a document is currently being saved.
     */
    isSaving(uri: vscode.Uri): boolean {
        return this.savingStatus.get(uri.toString()) || false;
    }

    /**
     * Update configuration.
     */
    updateConfig(config: Partial<AutoSaveConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Dispose and clean up.
     */
    dispose(): void {
        // Clear all timers
        for (const timer of this.saveTimers.values()) {
            clearTimeout(timer);
        }
        this.saveTimers.clear();
        this.lastSaveTime.clear();
        this.savingStatus.clear();
    }
}
