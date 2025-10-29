# State-Based Editing UX Design

**Created:** 2025-10-28
**Status:** Design Specification
**Related:** Task 015 - Custom Text Document Provider

## Core Principle

> **Version state determines content editability:**
> - Draft versions (DRAFT) → Content editable + Metadata editable
> - Published versions (ENABLED/DISABLED/DEPRECATED) → Content read-only + Metadata editable
>
> **Important:** Published versions have immutable content but metadata (name, description, labels) can still be updated.
> Metadata editing is handled via context menu commands (already implemented in Task 013), not through the text editor.

## Design Goals

1. **Prevent Accidental Content Edits**: Published version content is immutable in Apicurio Registry v3, so the VSCode plugin must enforce read-only mode for content editing
2. **Allow Metadata Updates**: Published versions can still have metadata (name, description, labels) updated via context menu commands
3. **Clear Visual Feedback**: Users should immediately understand if version content is editable or read-only
4. **Seamless Draft Editing**: Draft versions should feel like normal file editing with save capability
5. **Intuitive Workflow**: Opening a version should automatically apply the correct mode

## User Experience Flow

### Opening a Draft Version

```
User Action: Click on draft version in tree (blue edit icon + "draft" label)
           ↓
System: Opens in editor with editable mode
           ↓
Editor Shows:
  - File is editable (cursor, typing works)
  - Status bar: "📝 Editing draft: group/artifact:version"
  - Save icon enabled in editor
  - Modified indicator (*) appears when editing
           ↓
User Action: Edit content and save (Ctrl+S / Cmd+S)
           ↓
System: Saves changes back to registry via updateDraftContent API
           ↓
Result: Success message, content synchronized
```

### Opening a Published Version

```
User Action: Click on published version in tree (tag icon, no "draft" label)
           ↓
System: Opens in editor with read-only mode (content only)
           ↓
Editor Shows:
  - Content is read-only (cannot type or modify)
  - Status bar: "🔒 Read-only content: group/artifact:version (ENABLED)"
  - Simple info notification: "Read-only: ENABLED version. Right-click artifact in tree to create a new draft version."
  - Cannot type or modify content
           ↓
User wants to edit:
  - Right-click artifact in tree → "Create Draft Version"
  - Creates new draft with latest content as template
  - New draft opens in editable mode

Note: Metadata (name, description, labels) can still be edited via:
  - Right-click version in tree → "Change State" (for all versions)
  - Future task: Direct metadata editing UI for published versions
```

## Technical Implementation

### 1. Custom URI Scheme

Use a custom URI scheme to track version metadata:

```
apicurio://group/<groupId>/artifact/<artifactId>/version/<version>?state=<state>
```

Example:
```
apicurio://group/my-group/artifact/user-api/version/1.0.0?state=DRAFT
apicurio://group/my-group/artifact/user-api/version/2.0.0?state=ENABLED
```

### 2. TextDocumentContentProvider

Implement a custom `TextDocumentContentProvider` that:
- Fetches content from registry when document is opened
- Tracks the version state from URI query parameter
- Returns content for VSCode to display

```typescript
class ApicurioDocumentProvider implements vscode.TextDocumentContentProvider {
    async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        const { groupId, artifactId, version } = parseUri(uri);
        const content = await registryService.getArtifactContent(groupId, artifactId, version);
        return content.content;
    }
}
```

### 3. Read-Only Enforcement

For published versions, set document as read-only:

```typescript
// When opening a published version
const doc = await vscode.workspace.openTextDocument(uri);
const editor = await vscode.window.showTextDocument(doc, {
    preview: false,
    viewColumn: vscode.ViewColumn.One
});

// Check version state from URI
const state = getStateFromUri(uri);
if (state !== 'DRAFT') {
    // Set read-only mode
    // VSCode doesn't have direct API, but we can:
    // 1. Use workspace.fs to create read-only file system
    // 2. Show warning on edit attempts
    // 3. Prevent save operations
}
```

### 4. Save Handler

Implement save logic only for draft versions:

```typescript
vscode.workspace.onWillSaveTextDocument(async (event) => {
    const uri = event.document.uri;

    if (uri.scheme !== 'apicurio') {
        return; // Not our document
    }

    const state = getStateFromUri(uri);

    if (state !== 'DRAFT') {
        // Prevent save
        event.waitUntil(Promise.reject(
            new Error('Cannot save published version. Create a draft to make changes.')
        ));
        return;
    }

    // Allow save - update draft content in registry
    event.waitUntil(
        saveDraftContent(uri, event.document.getText())
    );
});
```

## Visual Indicators

### Status Bar

Show clear indication of version state:

```typescript
// Draft version
statusBar.text = "$(edit) Editing draft: my-group/user-api:1.0.0";
statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');

// Published version
statusBar.text = "$(lock) Read-only: my-group/user-api:2.0.0 (ENABLED)";
statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
```

### Editor Tab Decoration

Use VSCode decorations:
- Draft: Normal tab with modified indicator (*)
- Published: Tab with lock icon or grayed appearance

### Information Messages

When opening a published version, show a simple non-blocking notification:
```typescript
vscode.window.showInformationMessage(
    `Read-only: ${state} version. Right-click artifact in tree to create a new draft version.`
);
```

**Note:** No action buttons to avoid interrupting the workflow. Users can right-click in the tree view to create a draft.

## Edge Cases & Considerations

### 1. Draft Finalized While Open

**Scenario:** User has draft open in editor, another user/process finalizes the draft

**Solution:**
- Listen for file system events
- Show notification: "This draft has been finalized and is now read-only"
- Switch document to read-only mode
- Offer to save unsaved changes as new draft

### 2. Concurrent Draft Editing

**Scenario:** Multiple users edit the same draft

**Solution:**
- Implement conflict detection (compare content hash before save)
- Show warning if content changed on server
- Offer merge or overwrite options
- **Note:** Full conflict resolution is Task 017, but basic detection should be in Task 015

### 3. Unsaved Changes in Draft

**Scenario:** User closes editor with unsaved draft changes

**Solution:**
- VSCode handles this automatically with "Save" prompt
- Our save handler will push changes to registry

### 4. Network Failure During Save

**Scenario:** Save to registry fails due to network/API error

**Solution:**
- Show error message with retry option
- Keep document dirty (modified) state
- Don't close editor
- Optionally offer to save as local file

## API Requirements

### Read Operations (All Versions)

```
GET /groups/{groupId}/artifacts/{artifactId}/versions/{version}
```

### Write Operations

**Content Updates (Draft Only):**
```
PUT /groups/{groupId}/artifacts/{artifactId}/versions/{version}/content
Body: { content, contentType }
```
**Important:** This endpoint only works for DRAFT versions. Published versions return 400 or 405.

**Metadata Updates (All Versions):**
```
PUT /groups/{groupId}/artifacts/{artifactId}/versions/{version}/meta
Body: { name?, description?, labels? }
```
**Note:** Metadata can be updated for both draft and published versions. Already implemented in Task 013 (updateDraftMetadata), but can be extended for published versions in future tasks.

## User Flows

### Flow 1: Edit Draft Version

1. User expands artifact → sees version with blue edit icon + "draft"
2. User clicks on draft version
3. Editor opens with editable content
4. Status bar shows "📝 Editing draft"
5. User makes changes
6. User saves (Ctrl+S)
7. Plugin pushes changes to registry
8. Success notification

### Flow 2: View Published Version

1. User expands artifact → sees version with tag icon
2. User clicks on published version
3. Editor opens in read-only mode (content only)
4. Status bar shows "🔒 Read-only content (ENABLED)"
5. User tries to type → nothing happens or warning shows
6. User gets info message with "Create Draft" option
7. Note: User can still right-click version in tree to edit metadata or change state

### Flow 3: Create Draft from Published

1. User opens published version (read-only)
2. User wants to make changes
3. User clicks "Create Draft" in info message (or context menu)
4. Plugin creates draft version with published content as template
5. New draft opens in editable mode
6. User makes changes and saves

## Success Metrics

- ✅ Draft versions have editable content
- ✅ Published versions have read-only content
- ✅ Metadata can be edited for all versions (via context menu)
- ✅ Content save works for drafts only
- ✅ Clear visual distinction between content editability states
- ✅ Users cannot accidentally modify published content
- ✅ Smooth transition from read-only to draft creation

## Implementation Plan (Task 015)

1. Create custom URI scheme handler
2. Implement TextDocumentContentProvider
3. Add state-based read-only logic
4. Implement save handler for drafts
5. Add visual indicators (status bar, info messages)
6. Update openVersionCommand to use custom URIs
7. Test all flows and edge cases

## Future Enhancements (Post-Task 015)

- **Task 016:** Auto-save for drafts
- **Task 017:** Full conflict detection and resolution
- **Task 018:** Diff view between draft and published
- **Phase 3.2:** Apicurio Studio integration for visual editing
