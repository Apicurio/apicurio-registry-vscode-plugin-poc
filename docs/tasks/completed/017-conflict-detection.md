# Task 017: Conflict Detection

**Phase:** 3.1 - Text Editor Integration
**Priority:** High
**Effort:** 8-10 hours
**Status:** 📋 Todo
**Created:** 2025-11-03

## Overview

Implement conflict detection for concurrent edits to draft artifact versions. When a user attempts to save changes to a draft that has been modified by another user (or process) since it was opened, detect the conflict and provide resolution options.

## Context

Currently (Task 015 + 016), the `ApicurioFileSystemProvider` allows editing and saving draft versions, but there's no protection against concurrent modifications:

**Current Behavior:**
1. User A opens draft v1.0.0
2. User B opens same draft v1.0.0
3. User B makes changes and saves → Registry updated
4. User A makes different changes and saves → **Overwrites User B's changes silently** ❌

**This is data loss risk** - User B's changes are lost without warning.

## Goals

- [ ] Track `modifiedOn` timestamp when opening a draft
- [ ] Before saving, check if draft has been modified since it was opened
- [ ] If conflict detected, show conflict resolution dialog
- [ ] Provide resolution options:
  - **View Diff** - Show comparison between local vs remote changes
  - **Overwrite Remote** - Save local changes, discarding remote changes
  - **Discard Local** - Reload remote version, discarding local changes
  - **Cancel** - Don't save, leave local changes in editor
- [ ] Update timestamp after successful save
- [ ] Handle edge cases (draft deleted, draft published, network errors)
- [ ] Write comprehensive tests
- [ ] Manual testing of all conflict scenarios

## Technical Approach

### 1. Conflict Detector Service

**Create:** `src/services/conflictDetector.ts`

```typescript
import * as vscode from 'vscode';
import { RegistryService } from './registryService';
import { ApicurioUriBuilder } from '../utils/uriBuilder';

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

export enum ConflictResolution {
    Overwrite = 'overwrite',   // Save local changes, ignore remote
    Discard = 'discard',       // Discard local changes, reload remote
    Cancel = 'cancel',         // Don't save, keep editing
    ViewDiff = 'diff'          // Show diff first, then decide
}

export class ConflictDetector {
    // Track opened timestamps: URI → modifiedOn timestamp
    private openedTimestamps = new Map<string, Date>();

    constructor(private registryService: RegistryService) {}

    /**
     * Record when a draft was opened.
     * Call this when opening a draft for editing.
     */
    trackOpened(uri: vscode.Uri, modifiedOn: Date): void {
        this.openedTimestamps.set(uri.toString(), modifiedOn);
    }

    /**
     * Check if a draft has been modified since it was opened.
     * Returns ConflictInfo if conflict detected, null otherwise.
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

            // Compare timestamps
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
            // Error fetching metadata - might be deleted
            throw error;
        }
    }

    /**
     * Update the tracked timestamp after a successful save.
     */
    updateTimestamp(uri: vscode.Uri, newModifiedOn: Date): void {
        this.openedTimestamps.set(uri.toString(), newModifiedOn);
    }

    /**
     * Clear tracking for a URI (when document is closed).
     */
    stopTracking(uri: vscode.Uri): void {
        this.openedTimestamps.delete(uri.toString());
    }

    /**
     * Clear all tracking.
     */
    clear(): void {
        this.openedTimestamps.clear();
    }
}
```

### 2. Conflict Resolution UI

**Create:** `src/ui/conflictResolutionDialog.ts`

```typescript
import * as vscode from 'vscode';
import { ConflictInfo, ConflictResolution } from '../services/conflictDetector';
import { ApicurioUriBuilder } from '../utils/uriBuilder';

export class ConflictResolutionDialog {
    /**
     * Show conflict resolution dialog and return user's choice.
     */
    static async show(conflict: ConflictInfo): Promise<ConflictResolution> {
        const displayName = ApicurioUriBuilder.getDisplayName(
            conflict.groupId,
            conflict.artifactId,
            conflict.version
        );

        const message = `**Conflict Detected**\n\n` +
            `The draft "${displayName}" has been modified by another user.\n\n` +
            `**Local changes:** Modified on ${conflict.localModifiedOn.toLocaleString()}\n` +
            `**Remote changes:** Modified on ${conflict.remoteModifiedOn.toLocaleString()}\n\n` +
            `How would you like to resolve this conflict?`;

        const viewDiff = '$(diff) View Diff';
        const overwrite = '$(warning) Overwrite Remote';
        const discard = '$(discard) Discard Local';
        const cancel = '$(close) Cancel';

        const choice = await vscode.window.showWarningMessage(
            message,
            { modal: true },
            viewDiff,
            overwrite,
            discard,
            cancel
        );

        switch (choice) {
            case viewDiff:
                await this.showDiff(conflict);
                // After showing diff, ask again
                return this.show(conflict);
            case overwrite:
                // Confirm overwrite
                const confirmOverwrite = await vscode.window.showWarningMessage(
                    `Are you sure you want to overwrite remote changes?\n\nThis will permanently discard changes made by other users.`,
                    { modal: true },
                    '$(warning) Yes, Overwrite',
                    '$(close) No, Cancel'
                );
                return confirmOverwrite === '$(warning) Yes, Overwrite'
                    ? ConflictResolution.Overwrite
                    : ConflictResolution.Cancel;
            case discard:
                return ConflictResolution.Discard;
            case cancel:
            default:
                return ConflictResolution.Cancel;
        }
    }

    /**
     * Show diff view comparing local vs remote changes.
     */
    private static async showDiff(conflict: ConflictInfo): Promise<void> {
        const { groupId, artifactId, version, localContent, remoteContent } = conflict;

        // Create temporary files for diff view
        const localUri = vscode.Uri.parse(
            `untitled:${groupId}/${artifactId}:${version} (Your Changes)`
        );
        const remoteUri = vscode.Uri.parse(
            `untitled:${groupId}/${artifactId}:${version} (Remote Changes)`
        );

        // Open diff editor
        await vscode.commands.executeCommand(
            'vscode.diff',
            remoteUri,  // Left side: remote (theirs)
            localUri,   // Right side: local (yours)
            `Conflict: ${ApicurioUriBuilder.getDisplayName(groupId, artifactId, version)}`,
            {
                preview: true,
                selection: undefined
            }
        );

        // Set content for diff view
        const localDoc = await vscode.workspace.openTextDocument(localUri);
        const remoteDoc = await vscode.workspace.openTextDocument(remoteUri);

        const localEdit = new vscode.WorkspaceEdit();
        localEdit.insert(localUri, new vscode.Position(0, 0), localContent);
        await vscode.workspace.applyEdit(localEdit);

        const remoteEdit = new vscode.WorkspaceEdit();
        remoteEdit.insert(remoteUri, new vscode.Position(0, 0), remoteContent);
        await vscode.workspace.applyEdit(remoteEdit);
    }
}
```

### 3. Update ApicurioFileSystemProvider

**Modify:** `src/providers/apicurioFileSystemProvider.ts`

Add conflict detection to the `writeFile` method:

```typescript
import { ConflictDetector, ConflictResolution } from '../services/conflictDetector';
import { ConflictResolutionDialog } from '../ui/conflictResolutionDialog';

export class ApicurioFileSystemProvider implements vscode.FileSystemProvider {
    // ... existing code ...

    constructor(
        private registryService: RegistryService,
        private conflictDetector: ConflictDetector
    ) {}

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        // ... existing fetch logic ...

        // Track when draft was opened
        if (ApicurioUriBuilder.isDraft(uri)) {
            try {
                const versionMeta = await this.registryService.getVersionMetadata(
                    metadata.groupId,
                    metadata.artifactId,
                    metadata.version
                );
                if (versionMeta.modifiedOn) {
                    this.conflictDetector.trackOpened(uri, versionMeta.modifiedOn);
                }
            } catch (error) {
                // Ignore tracking errors
            }
        }

        return data;
    }

    async writeFile(
        uri: vscode.Uri,
        content: Uint8Array,
        options: { create: boolean; overwrite: boolean }
    ): Promise<void> {
        // Check if this is a draft version
        if (!ApicurioUriBuilder.isDraft(uri)) {
            throw vscode.FileSystemError.NoPermissions(
                'Cannot save published version content. Create a draft to edit content.'
            );
        }

        const metadata = ApicurioUriBuilder.parseVersionUri(uri);
        if (!metadata) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        // Check for conflicts
        const conflict = await this.conflictDetector.checkForConflict(
            uri,
            content.toString()
        );

        if (conflict) {
            // Conflict detected - show resolution dialog
            const resolution = await ConflictResolutionDialog.show(conflict);

            switch (resolution) {
                case ConflictResolution.Cancel:
                    // User cancelled - don't save
                    throw vscode.FileSystemError.Unavailable('Save cancelled due to conflict');

                case ConflictResolution.Discard:
                    // Discard local changes - reload remote content
                    this.fileCache.delete(uri.toString());
                    const remoteContent = Buffer.from(conflict.remoteContent, 'utf-8');
                    this.fileCache.set(uri.toString(), remoteContent);

                    // Update timestamp
                    this.conflictDetector.updateTimestamp(uri, conflict.remoteModifiedOn);

                    // Fire change event to reload editor
                    this._emitter.fire([{
                        type: vscode.FileChangeType.Changed,
                        uri
                    }]);

                    vscode.window.showInformationMessage('Local changes discarded. Reloaded remote version.');
                    return;

                case ConflictResolution.Overwrite:
                    // User chose to overwrite - proceed with save
                    vscode.window.showWarningMessage('Saving changes and overwriting remote version...');
                    break;
            }
        }

        try {
            // Save to registry
            await this.registryService.updateDraftContent(
                metadata.groupId,
                metadata.artifactId,
                metadata.version,
                content.toString()
            );

            // Fetch updated metadata to get new modifiedOn timestamp
            const updatedMeta = await this.registryService.getVersionMetadata(
                metadata.groupId,
                metadata.artifactId,
                metadata.version
            );

            // Update tracked timestamp
            if (updatedMeta.modifiedOn) {
                this.conflictDetector.updateTimestamp(uri, updatedMeta.modifiedOn);
            }

            // Update cache
            this.fileCache.set(uri.toString(), content);

            // Fire change event
            this._emitter.fire([{
                type: vscode.FileChangeType.Changed,
                uri
            }]);

            vscode.window.showInformationMessage(
                `Saved ${ApicurioUriBuilder.getDisplayName(metadata.groupId, metadata.artifactId, metadata.version)}`
            );
        } catch (error: any) {
            const message = error.message || 'Unknown error';
            vscode.window.showErrorMessage(`Failed to save: ${message}`);
            throw vscode.FileSystemError.Unavailable(message);
        }
    }
}
```

### 4. Update Extension Registration

**Modify:** `src/extension.ts`

Wire up the conflict detector:

```typescript
import { ConflictDetector } from './services/conflictDetector';

export function activate(context: vscode.ExtensionContext) {
    // ... existing code ...

    // Create conflict detector
    const conflictDetector = new ConflictDetector(registryService);

    // Create file system provider with conflict detection
    const fileSystemProvider = new ApicurioFileSystemProvider(
        registryService,
        conflictDetector
    );

    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider(
            ApicurioUriBuilder.SCHEME,
            fileSystemProvider,
            { isCaseSensitive: true }
        )
    );

    // Clean up tracking when documents are closed
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            if (doc.uri.scheme === ApicurioUriBuilder.SCHEME) {
                conflictDetector.stopTracking(doc.uri);
            }
        })
    );
}
```

## Edge Cases

### 1. Draft Deleted While Editing

**Scenario:** User A opens draft, User B deletes it, User A tries to save

**Handling:**
- `getVersionMetadata` will return 404
- Show error: "Draft has been deleted. Cannot save changes."
- Offer to "Save as New Draft" or "Discard Changes"

### 2. Draft Published While Editing

**Scenario:** User A opens draft, User B publishes it, User A tries to save

**Handling:**
- State changed from DRAFT → ENABLED
- Show error: "Draft has been published. Cannot save changes to published version."
- Offer to "Create New Draft" or "Discard Changes"

### 3. Network Error During Conflict Check

**Scenario:** Network fails when checking for conflicts

**Handling:**
- Show error: "Cannot check for conflicts (network error). Save anyway?"
- Options: "Retry", "Force Save" (risky), "Cancel"

### 4. Identical Changes

**Scenario:** User A and User B make exactly the same changes

**Handling:**
- Timestamps differ but content is identical
- Could still show conflict (conservative approach)
- Or: Skip conflict if content matches (optimistic approach)

**Recommendation:** Use conservative approach (show conflict even if content matches)

## Testing Strategy

### Unit Tests

**Create:** `src/services/__tests__/conflictDetector.test.ts`

Test scenarios:
1. ✅ Track opened draft with timestamp
2. ✅ Detect no conflict when timestamps match
3. ✅ Detect conflict when timestamps differ
4. ✅ Return conflict info with both contents
5. ✅ Update timestamp after save
6. ✅ Stop tracking when document closes
7. ✅ Handle missing timestamp gracefully
8. ✅ Handle fetch errors during conflict check

**Create:** `src/ui/__tests__/conflictResolutionDialog.test.ts`

Test scenarios:
1. ✅ Show conflict dialog with all options
2. ✅ Return correct resolution based on user choice
3. ✅ Show diff view when "View Diff" selected
4. ✅ Confirm overwrite with second dialog
5. ✅ Return cancel when user dismisses dialog

### Integration Tests

**Create:** `src/providers/__tests__/conflictDetection.integration.test.ts`

Test scenarios:
1. ✅ Open draft → modify remotely → save → conflict detected
2. ✅ User chooses "Overwrite" → saves successfully
3. ✅ User chooses "Discard" → reloads remote content
4. ✅ User chooses "Cancel" → save aborted
5. ✅ No conflict when timestamps match
6. ✅ Timestamp updated after successful save
7. ✅ Tracking cleared when document closes

### Manual Testing Checklist

- [ ] Open draft v1.0.0 in Editor A
- [ ] Open same draft v1.0.0 in Editor B (different user or incognito window)
- [ ] Modify in Editor B and save
- [ ] Modify in Editor A and save → Conflict dialog appears
- [ ] Click "View Diff" → Diff view shows changes correctly
- [ ] Choose "Overwrite" → Confirm dialog → Save succeeds → Editor B changes lost
- [ ] Repeat test, choose "Discard" → Editor A content reloaded → Changes lost
- [ ] Repeat test, choose "Cancel" → Save aborted → Changes remain in editor
- [ ] Verify timestamps update after successful save
- [ ] Close document → Reopen → No stale conflict detection

## Success Criteria

- [ ] Conflict detection works for concurrent edits
- [ ] User can view diff between local and remote changes
- [ ] User can choose to overwrite or discard changes
- [ ] Timestamps are tracked and updated correctly
- [ ] Edge cases handled gracefully (draft deleted, published, network errors)
- [ ] No false positives (conflicts when there are none)
- [ ] No data loss (user always warned before changes are discarded)
- [ ] All tests passing (unit + integration)
- [ ] Manual testing complete and documented

## Implementation Checklist

### Phase 1: Core Conflict Detection (3-4h)
- [ ] Create `ConflictDetector` service with timestamp tracking
- [ ] Add `checkForConflict()` method
- [ ] Write unit tests for ConflictDetector
- [ ] All tests passing

### Phase 2: Conflict Resolution UI (2-3h)
- [ ] Create `ConflictResolutionDialog` class
- [ ] Implement dialog with all options
- [ ] Implement diff view
- [ ] Test dialog flows

### Phase 3: Integration (2-3h)
- [ ] Update `ApicurioFileSystemProvider.readFile()` to track opened drafts
- [ ] Update `ApicurioFileSystemProvider.writeFile()` to check conflicts
- [ ] Implement resolution logic (overwrite/discard/cancel)
- [ ] Update extension.ts to wire conflict detector
- [ ] Add document close handler

### Phase 4: Edge Cases & Testing (1-2h)
- [ ] Handle draft deleted
- [ ] Handle draft published
- [ ] Handle network errors
- [ ] Write integration tests
- [ ] Manual testing of all scenarios
- [ ] Documentation updates

## Files Created/Modified

### New Files
- `src/services/conflictDetector.ts` (150-200 lines)
- `src/ui/conflictResolutionDialog.ts` (100-150 lines)
- `src/services/__tests__/conflictDetector.test.ts` (200-250 lines)
- `src/ui/__tests__/conflictResolutionDialog.test.ts` (150-200 lines)
- `src/providers/__tests__/conflictDetection.integration.test.ts` (200-250 lines)

### Modified Files
- `src/providers/apicurioFileSystemProvider.ts` (~50 line changes)
- `src/extension.ts` (~15 line changes)

**Total:** ~1,000-1,200 lines of code + tests

## Dependencies

- **Requires:** Task 015 (Custom Text Document Provider) ✅ Complete
- **Requires:** Task 016 (Save & Auto-Save) ✅ Complete
- **Blocks:** None (conflict detection is optional enhancement)

## Future Enhancements

- [ ] Three-way merge UI (base, theirs, yours)
- [ ] Automatic conflict resolution for non-overlapping changes
- [ ] Real-time collaboration (show who else is editing)
- [ ] Conflict history and audit log
- [ ] Smart merge suggestions using AI

## References

- **VSCode Diff API:** https://code.visualstudio.com/api/references/vscode-api#commands.executeCommand
- **File System Provider:** https://code.visualstudio.com/api/references/vscode-api#FileSystemProvider
- **Optimistic Locking:** https://en.wikipedia.org/wiki/Optimistic_concurrency_control

---

**Estimated Effort:** 8-10 hours
**Risk Level:** Medium (diff UI complexity, edge case handling)
**Priority:** High (prevents data loss)
**Value:** High (critical for multi-user scenarios)
