import * as vscode from 'vscode';
import { RegistryService } from './registryService';
import { ApicurioUriBuilder } from '../utils/uriBuilder';

/**
 * Information about a detected conflict between local and remote versions.
 */
export interface ConflictInfo {
    uri: vscode.Uri;
    groupId: string;
    artifactId: string;
    version: string;
    localModifiedOn: Date;     // When we opened it
    remoteModifiedOn: Date;    // Current timestamp in registry
    localContent: string;      // User's changes
    remoteContent: string;     // Current content in registry
}

/**
 * User's resolution choice for a conflict.
 */
export enum ConflictResolution {
    Overwrite = 'overwrite',   // Save local changes, ignore remote
    Discard = 'discard',       // Discard local changes, reload remote
    Cancel = 'cancel',         // Don't save, keep editing
    ViewDiff = 'diff'          // Show diff first, then decide
}

/**
 * Service for detecting concurrent modifications to draft versions.
 *
 * Tracks when drafts are opened and compares timestamps before saving
 * to detect if another user has modified the draft since it was opened.
 */
export class ConflictDetector {
    // Track opened timestamps: URI string → modifiedOn timestamp
    private openedTimestamps = new Map<string, Date>();

    constructor(private registryService: RegistryService) {}

    /**
     * Record when a draft was opened.
     * Call this when opening a draft for editing.
     *
     * @param uri - The Apicurio URI of the draft
     * @param modifiedOn - The modifiedOn timestamp from when it was opened
     */
    trackOpened(uri: vscode.Uri, modifiedOn: Date): void {
        this.openedTimestamps.set(uri.toString(), modifiedOn);
    }

    /**
     * Check if a draft has been modified since it was opened.
     * Returns ConflictInfo if conflict detected, null otherwise.
     *
     * @param uri - The Apicurio URI to check
     * @param localContent - The user's local changes
     * @returns ConflictInfo if conflict detected, null if no conflict
     */
    async checkForConflict(
        uri: vscode.Uri,
        localContent: string
    ): Promise<ConflictInfo | null> {
        const metadata = ApicurioUriBuilder.parseVersionUri(uri);
        if (!metadata) {
            return null;
        }

        const uriString = uri.toString();
        const localModifiedOn = this.openedTimestamps.get(uriString);
        if (!localModifiedOn) {
            // Not tracked - maybe not a draft we opened
            return null;
        }

        try {
            // Fetch current version metadata from registry
            const versionMeta = await this.registryService.getVersionMetadata(
                metadata.groupId,
                metadata.artifactId,
                metadata.version
            );

            if (!versionMeta.modifiedOn) {
                // No timestamp - can't detect conflict
                return null;
            }

            const remoteModifiedOn = versionMeta.modifiedOn;

            // Compare timestamps using millisecond precision
            if (remoteModifiedOn.getTime() === localModifiedOn.getTime()) {
                // No conflict - remote hasn't changed
                return null;
            }

            // Conflict detected - fetch remote content for diff
            const remoteContentResponse = await this.registryService.getArtifactContent(
                metadata.groupId,
                metadata.artifactId,
                metadata.version
            );

            return {
                uri,
                groupId: metadata.groupId,
                artifactId: metadata.artifactId,
                version: metadata.version,
                localModifiedOn,
                remoteModifiedOn,
                localContent,
                remoteContent: remoteContentResponse.content
            };
        } catch (error: any) {
            // Error fetching metadata - might be deleted or network issue
            throw error;
        }
    }

    /**
     * Update the tracked timestamp after a successful save.
     *
     * @param uri - The Apicurio URI
     * @param newModifiedOn - The new modifiedOn timestamp after save
     */
    updateTimestamp(uri: vscode.Uri, newModifiedOn: Date): void {
        this.openedTimestamps.set(uri.toString(), newModifiedOn);
    }

    /**
     * Clear tracking for a URI (when document is closed).
     *
     * @param uri - The Apicurio URI to stop tracking
     */
    stopTracking(uri: vscode.Uri): void {
        this.openedTimestamps.delete(uri.toString());
    }

    /**
     * Clear all tracking.
     * Useful for cleanup or reset scenarios.
     */
    clear(): void {
        this.openedTimestamps.clear();
    }
}
