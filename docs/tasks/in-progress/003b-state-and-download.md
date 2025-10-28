# Task 003b - State Management and Download Commands

**Priority:** High
**Estimated Time:** 2-3 hours
**Status:** Todo
**Dependencies:** Task 003 (Context Menus - Copy/Open)
**Parent Task:** Task 003 (Context Menus)

## Overview

Complete the remaining context menu commands from the original Task 003 specification: artifact/version state management and content download functionality.

## Background

Task 003 was partially completed with Copy and Open commands (fully tested and working). This task completes the remaining context menu features that were originally planned.

## Objectives

Implement the remaining context menu commands:
1. **Change State commands** - Manage artifact and version lifecycle states
2. **Download Content command** - Save artifact content to local files

## Features to Implement

### 1. Change State Commands

#### Change Artifact State
- **Menu Location:** Artifact context menu
- **Command:** `apicurioRegistry.changeArtifactState`
- **Functionality:**
  - Show quick pick with available states:
    - `ENABLED` (default)
    - `DISABLED`
    - `DEPRECATED`
  - Update artifact state via API
  - Refresh tree to show state change
  - Show confirmation notification

#### Change Version State
- **Menu Location:** Version context menu
- **Command:** `apicurioRegistry.changeVersionState`
- **Functionality:**
  - Show quick pick with available states:
    - `ENABLED` (default)
    - `DISABLED`
    - `DEPRECATED`
  - Update version state via API
  - Refresh tree to show state change
  - Show confirmation notification

**API Endpoints:**
```
PUT /groups/{groupId}/artifacts/{artifactId}/state
PUT /groups/{groupId}/artifacts/{artifactId}/versions/{version}/state

Body: { "state": "ENABLED" | "DISABLED" | "DEPRECATED" }
```

**Visual Indicators:**
- Consider adding state indicators in tree item labels
- Example: `users-api [DEPRECATED]` or `1.0.0 (disabled)`
- Could use different icons for different states

### 2. Download Content Command

#### Download Artifact Content
- **Menu Location:** Artifact and Version context menus
- **Command:** `apicurioRegistry.downloadContent`
- **Functionality:**
  - Prompt user for save location (VSCode save dialog)
  - Suggest filename based on artifact ID and type
    - `{artifactId}.yaml` for OpenAPI/AsyncAPI
    - `{artifactId}.json` for JSON/Avro
    - `{artifactId}.xml` for XSD/WSDL
    - `{artifactId}.graphql` for GraphQL
    - `{artifactId}.proto` for Protobuf
  - Fetch artifact content (reuse `getArtifactContent`)
  - Save to selected file
  - Show success notification with "Open File" action
  - Optional: Open file in editor after download

**File Extension Mapping:**
```typescript
const extensionMap: Record<string, string> = {
    'OPENAPI': 'yaml',
    'ASYNCAPI': 'yaml',
    'JSON': 'json',
    'AVRO': 'avsc',
    'PROTOBUF': 'proto',
    'GRAPHQL': 'graphql',
    'XSD': 'xsd',
    'WSDL': 'wsdl',
    'KCONNECT': 'json'
};
```

## Implementation Plan

### Phase 1: State Management (TDD)

**RED - Write Failing Tests:**
1. Create `src/commands/__tests__/stateCommands.test.ts`
2. Test cases:
   - Change artifact state to DISABLED
   - Change artifact state to DEPRECATED
   - Change version state
   - Handle missing state selection (user cancels)
   - Handle API errors
   - Verify tree refresh called

**GREEN - Implement:**
1. Create `src/commands/stateCommands.ts`
2. Implement `changeArtifactStateCommand`
3. Implement `changeVersionStateCommand`
4. Add to `registryService.ts`:
   - `updateArtifactState(groupId, artifactId, state)`
   - `updateVersionState(groupId, artifactId, version, state)`

**REFACTOR:**
- Add state to tree item labels
- Consider icon changes for different states
- Improve error messages

### Phase 2: Download Command (TDD)

**RED - Write Failing Tests:**
1. Create `src/commands/__tests__/downloadCommand.test.ts`
2. Test cases:
   - Download artifact content to file
   - Download version content to file
   - Correct file extension based on artifact type
   - Handle user cancellation (no save location)
   - Handle write errors
   - Verify file created with correct content

**GREEN - Implement:**
1. Create `src/commands/downloadCommand.ts`
2. Implement `downloadContentCommand`
3. Helper function: `getFileExtension(artifactType)`
4. Use VSCode API: `vscode.window.showSaveDialog()`
5. Use Node.js `fs` to write file

**REFACTOR:**
- Add "Open File" action to success notification
- Consider remembering last download directory
- Validate file path

### Phase 3: Integration

1. **Update `package.json`:**
   - Add command definitions
   - Add context menu items
   - Group appropriately (state in separate group)

2. **Update `extension.ts`:**
   - Import and register state commands
   - Import and register download command
   - Add to context subscriptions

3. **Testing:**
   - Run unit tests
   - Compile
   - Manual testing with test data

## Testing Checklist

### State Management Tests

**Change Artifact State:**
- [ ] Right-click artifact → Change State → Select DISABLED
- [ ] Verify tree refreshes
- [ ] Verify state changed in registry
- [ ] Verify notification shown
- [ ] Change back to ENABLED
- [ ] Test DEPRECATED state

**Change Version State:**
- [ ] Right-click version → Change State → Select DISABLED
- [ ] Verify state changed
- [ ] Test all state transitions

**Error Handling:**
- [ ] Test with disconnected registry
- [ ] Test canceling state selection

### Download Tests

**Download Artifact:**
- [ ] Right-click artifact → Download Content
- [ ] Verify correct filename suggested
- [ ] Save to location
- [ ] Verify file contains correct YAML content
- [ ] Test "Open File" action

**Download Version:**
- [ ] Right-click version → Download Content
- [ ] Verify filename includes version
- [ ] Save and verify content

**Different Artifact Types:**
- [ ] Download OpenAPI (YAML)
- [ ] Download JSON Schema (JSON)
- [ ] Download Avro (AVSC)
- [ ] Verify correct extensions

**Error Handling:**
- [ ] Cancel save dialog
- [ ] Write to read-only location
- [ ] Disconnected registry

## Success Criteria

- [ ] All unit tests passing (estimated 15-20 new tests)
- [ ] Compilation successful
- [ ] Change state commands work for artifacts and versions
- [ ] State changes reflected in tree view
- [ ] Download command saves content with correct extension
- [ ] All manual tests passing
- [ ] Documentation updated
- [ ] No console errors

## Files to Create/Modify

**New Files:**
- `src/commands/stateCommands.ts`
- `src/commands/__tests__/stateCommands.test.ts`
- `src/commands/downloadCommand.ts`
- `src/commands/__tests__/downloadCommand.test.ts`

**Modified Files:**
- `src/services/registryService.ts` (add state update methods)
- `src/extension.ts` (register new commands)
- `package.json` (command definitions and menus)

**Documentation:**
- Update `docs/tasks/completed/003-context-menus.md` (move from in-progress)
- Create testing guide for state/download features

## API Reference

### State Management

**Update Artifact State:**
```http
PUT /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/state
Content-Type: application/json

{
  "state": "DISABLED"
}
```

**Update Version State:**
```http
PUT /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/versions/{version}/state
Content-Type: application/json

{
  "state": "DEPRECATED"
}
```

**Valid States:**
- `ENABLED` - Normal, active state
- `DISABLED` - Temporarily disabled, not available for use
- `DEPRECATED` - Marked as deprecated, still available but discouraged

### Content Download

Reuses existing endpoint:
```http
GET /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/versions/{version}/content
Accept: */*
```

## Notes

- State changes should trigger tree refresh to show updated state
- Consider adding state badges/icons to tree items
- Download should default to Downloads folder or last used directory
- File extensions should match common conventions for each type
- "Open File" action after download is optional but nice UX

## Related Tasks

- **Task 003:** Context Menus - Copy/Open (Completed)
- **Task 004:** Add Version Command (Planned)
- **Task 007:** Delete Operations (Planned)

## Time Breakdown

- State commands implementation: 1-1.5 hours
- Download command implementation: 0.5-1 hour
- Testing and debugging: 0.5-1 hour
- **Total:** 2-3 hours
