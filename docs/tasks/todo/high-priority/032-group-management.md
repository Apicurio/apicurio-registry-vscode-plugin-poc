# Task 032: Group Management

**Status:** 📋 Todo
**Priority:** 🟡 MEDIUM (Phase 2 - Advanced Features)
**Estimated Effort:** 2-3 hours
**Phase:** Feature Parity Phase 2

## Overview

Complete group management functionality for Apicurio Registry, enabling users to create new groups and manage existing groups through the VSCode extension. This fills the final gap in group CRUD operations.

## Strategic Context

**Feature Gap:**
- Web UI: Full group management (create, edit, delete)
- VSCode Extension: Partial support (read, edit metadata, delete - missing CREATE)

**Current State:**
- ✅ Read operations: `searchGroups()`, `getGroups()`, `getGroupMetadataDetailed()`
- ✅ Update operation: `updateGroupMetadata()` (from Task 026-030)
- ✅ Delete operation: `deleteGroup()`
- ✅ Rules management: `getGroupRules()`, etc. (from Task 031)
- ❌ **MISSING:** Create operation (`createGroup()`)
- ❌ **MISSING:** Command layer for group operations

**User Value:**
- Create organizational structure (groups) directly from VSCode
- Manage group lifecycle without switching to Web UI
- Streamlined workflow for schema organization

**Dependencies:**
- Task 026-030 (Metadata Editor) - ✅ Complete
- Task 031 (Rules Configuration) - ✅ Complete

## Implementation Plan

### Phase 1: Registry Service Extension (0.5h)

**File:** `src/services/registryService.ts`

**Method to Add:**
```typescript
async createGroup(groupId: string, metadata?: {
    description?: string;
    labels?: Record<string, string>;
}): Promise<GroupMetaData>
```

**API Endpoint:**
```
POST /admin/groups
Content-Type: application/json

{
  "groupId": "my-group",
  "description": "Group description",
  "labels": {
    "env": "production",
    "team": "backend"
  }
}
```

**Implementation Notes:**
- Validate groupId format (letters, numbers, dots, dashes, underscores)
- Handle 409 Conflict if group already exists
- Return created group metadata

**Test:** Write service-level test for createGroup()

---

### Phase 2: Create Group Command (1h)

**File:** `src/commands/groupCommands.ts` (NEW)

**Command:** `createGroupCommand()`

**Workflow:**
1. Prompt for group ID (with validation)
2. Prompt for description (optional)
3. Prompt for labels (optional, reuse label editor from Task 026-030)
4. Confirm creation
5. Create group via API
6. Refresh tree view
7. Show success message

**Validation:**
- Group ID: Required, alphanumeric + dots/dashes/underscores, max 512 chars
- Group ID: Must not already exist (check with `getGroupMetadataDetailed()`)
- Description: Optional, any text
- Labels: Optional, key=value format

**Example Flow:**
```
Step 1: Enter Group ID
→ User enters: "api-schemas"

Step 2: Enter Description (optional)
→ User enters: "REST API schema definitions"

Step 3: Add Labels? (optional)
→ User chooses: "Add label"
  → User enters: "env=production"
  → User enters: "team=platform"
→ User chooses: "Continue"

Step 4: Confirm Creation
Group ID:     api-schemas
Description:  REST API schema definitions
Labels:       env=production, team=platform

[Create] [Cancel]

Step 5: Creating...
→ Success: "Group 'api-schemas' created successfully"
→ Tree view refreshes, new group appears
```

**Error Handling:**
- Group already exists (409) → "Group 'X' already exists. Choose a different ID."
- Invalid group ID → Show validation message
- Network errors → Show generic error with retry option

**TDD Tests:**
- Happy path: Create group with full metadata
- Create with minimal info (only group ID)
- Cancel at each step (group ID, description, labels, confirmation)
- Duplicate group ID (409 error)
- Invalid group ID format
- Network error handling

---

### Phase 3: Delete Group Command Enhancement (0.5h)

**Current State:**
- Service method exists: `deleteGroup()`
- No command layer (right-click menu option)

**File:** `src/commands/groupCommands.ts`

**Command:** `deleteGroupCommand(node: RegistryItem)`

**Workflow:**
1. Check if group has artifacts
2. Show warning dialog:
   - If artifacts exist: "Group 'X' contains N artifact(s). Deleting the group will also delete all artifacts. This action cannot be undone."
   - If empty: "Delete group 'X'? This action cannot be undone."
3. User confirms
4. Delete group via API
5. Refresh tree view
6. Show success message

**Safety Features:**
- Modal confirmation dialog (like delete artifact/version)
- Show artifact count in warning
- Clear messaging about cascade delete

**TDD Tests:**
- Delete empty group
- Delete group with artifacts (shows count in warning)
- Cancel deletion
- Handle 404 (group not found)
- Handle network errors

---

### Phase 4: Command Registration (0.5h)

**Files:**
- `src/extension.ts`
- `package.json`

**Commands to Register:**

```json
{
  "command": "apicurioRegistry.createGroup",
  "title": "Create Group",
  "category": "Apicurio Registry",
  "icon": "$(add)"
},
{
  "command": "apicurioRegistry.deleteGroup",
  "title": "Delete Group",
  "when": "viewItem == group"
}
```

**Context Menu:**
```json
{
  "command": "apicurioRegistry.createGroup",
  "when": "view == apicurioRegistry",
  "group": "navigation"
},
{
  "command": "apicurioRegistry.deleteGroup",
  "when": "view == apicurioRegistry && viewItem == group",
  "group": "7_modification@2"
}
```

**Keyboard Shortcuts:** (Optional)
- Create Group: No default (can be set by user)
- Delete Group: No default (dangerous operation)

---

### Phase 5: Test Coverage (0.5h)

**Test Files:**
- `src/services/__tests__/registryService.groups.test.ts` (NEW)
- `src/commands/__tests__/groupCommands.test.ts` (NEW)

**Service Tests (3 tests):**
- Create group with full metadata
- Create group with minimal data (only groupId)
- Handle 409 Conflict error

**Command Tests (10 tests):**
- **createGroupCommand:**
  - Happy path with full metadata
  - Create with minimal info
  - Cancel at group ID prompt
  - Cancel at description prompt
  - Cancel at labels prompt
  - Cancel at confirmation
  - Duplicate group ID error
  - Invalid group ID format
- **deleteGroupCommand:**
  - Delete empty group
  - Delete group with artifacts (shows warning)
  - Cancel deletion
  - Handle 404 error

**Total:** 13 comprehensive tests

---

## Data Models

**Existing (no changes needed):**
```typescript
export interface GroupMetaData {
    groupId: string;
    description?: string;
    artifactCount?: number;
    labels?: Record<string, string>;
    owner?: string;
    createdOn?: string;
    modifiedOn?: string;
}
```

**Request Model (for createGroup):**
```typescript
export interface CreateGroupRequest {
    groupId: string;
    description?: string;
    labels?: Record<string, string>;
}
```

---

## Success Criteria

**Functional:**
- ✅ Can create new groups from Command Palette or tree view toolbar
- ✅ Can delete groups from context menu
- ✅ All CRUD operations work correctly
- ✅ Changes persist to registry
- ✅ Tree view updates immediately

**UX:**
- ✅ Clear wizard-based flow for creation
- ✅ Safety warnings for deletion
- ✅ Helpful validation messages
- ✅ Consistent with existing commands

**Quality:**
- ✅ 13 comprehensive tests passing
- ✅ 80%+ code coverage
- ✅ TypeScript compilation successful
- ✅ No linting errors
- ✅ Manual testing in Extension Development Host

---

## UX Mockups

### Create Group Flow

**Step 1: Group ID**
```
┌─ Create Group - Step 1/4: Enter Group ID ──────────┐
│                                                      │
│ Enter a unique group identifier                     │
│                                                      │
│ > api-schemas█                                       │
│                                                      │
│ Group ID can contain letters, numbers, dots,        │
│ dashes, and underscores (max 512 characters)        │
└──────────────────────────────────────────────────────┘
```

**Step 2: Description**
```
┌─ Create Group - Step 2/4: Description (optional) ───┐
│                                                      │
│ Enter a description for this group                   │
│                                                      │
│ > REST API schema definitions█                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Step 3: Labels**
```
┌─ Create Group - Step 3/4: Add Labels (optional) ────┐
│                                                      │
│ Current labels: (none)                               │
│                                                      │
│   $(add) Add label                                   │
│   $(arrow-right) Continue                            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Step 4: Confirmation**
```
┌─ Create Group - Step 4/4: Confirm ──────────────────┐
│                                                      │
│ Group ID:     api-schemas                            │
│ Description:  REST API schema definitions            │
│ Labels:       env=production, team=platform          │
│                                                      │
│   $(check) Create Group                              │
│   $(x) Cancel                                        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Delete Group Confirmation

**With Artifacts:**
```
┌─ Delete Group ───────────────────────────────────────┐
│                                                      │
│ ⚠️  Warning: This action cannot be undone           │
│                                                      │
│ Group 'api-schemas' contains 5 artifact(s).          │
│ Deleting the group will also delete all artifacts.  │
│                                                      │
│ Are you sure you want to delete this group?          │
│                                                      │
│ [Delete Group]  [Cancel]                             │
└──────────────────────────────────────────────────────┘
```

**Empty Group:**
```
┌─ Delete Group ───────────────────────────────────────┐
│                                                      │
│ Delete group 'api-schemas'?                          │
│                                                      │
│ This action cannot be undone.                        │
│                                                      │
│ [Delete]  [Cancel]                                   │
└──────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

**New Files:**
- `src/commands/groupCommands.ts` (~200 lines)
- `src/commands/__tests__/groupCommands.test.ts` (~350 lines)
- `src/services/__tests__/registryService.groups.test.ts` (~100 lines)

**Modified Files:**
- `src/services/registryService.ts` (+30 lines - createGroup method)
- `src/models/registryModels.ts` (+8 lines - CreateGroupRequest interface)
- `src/extension.ts` (+10 lines - command registration)
- `package.json` (+20 lines - command definitions)

**Total:** 3 new files, 4 modified files, ~718 lines

---

## API Reference

**Apicurio Registry REST API v3:**

**Create Group:**
```
POST /admin/groups
Content-Type: application/json

Request Body:
{
  "groupId": "string",        // Required
  "description": "string",    // Optional
  "labels": {                 // Optional
    "key": "value"
  }
}

Response: 200 OK
{
  "groupId": "string",
  "description": "string",
  "labels": {},
  "createdOn": "2025-11-07T10:00:00Z",
  "modifiedOn": "2025-11-07T10:00:00Z",
  "owner": "string"
}

Errors:
- 409 Conflict: Group already exists
- 400 Bad Request: Invalid group ID
```

**Delete Group:**
```
DELETE /admin/groups/{groupId}

Response: 204 No Content

Errors:
- 404 Not Found: Group does not exist
```

---

## Testing Plan

### Unit Tests
```bash
npm run test -- --testPathPattern=groupCommands
npm run test -- --testPathPattern=registryService.groups
```

### Manual Testing
1. Connect to Apicurio Registry instance
2. Command Palette → "Apicurio Registry: Create Group"
3. Enter group ID: "test-group"
4. Enter description: "Test group for schemas"
5. Add labels: "env=test", "purpose=demo"
6. Confirm creation
7. Verify group appears in tree view
8. Right-click group → "Delete Group"
9. Verify warning shows artifact count
10. Confirm deletion
11. Verify group removed from tree view

### Edge Cases
- Create group with duplicate ID → Shows error
- Create group with invalid ID (spaces, special chars) → Shows validation error
- Delete group with many artifacts → Shows count in warning
- Delete last group → Allowed (no special handling needed)
- Network error during creation → Shows error, allows retry

---

## Risk Assessment

**Technical Risks:**
- ✅ LOW: API well-documented, straightforward POST/DELETE operations
- ✅ LOW: Can reuse label editor from Task 026-030
- ✅ LOW: Can reuse delete confirmation pattern from Task 007

**UX Risks:**
- ✅ LOW: Wizard pattern proven in create artifact command
- ✅ LOW: Safety features prevent accidental deletion

**Mitigation:**
- Reuse existing patterns (wizard, label editor, confirmations)
- Comprehensive validation before API calls
- Clear error messages with actionable guidance

---

## Future Enhancements

**Beyond This Task:**
- Group templates (save/reuse group configurations)
- Bulk group creation from file
- Group export/import (with artifacts)
- Group archiving (soft delete)
- Group ownership management

---

## References

- **Web UI Implementation:** `/apicurio-registry/ui/ui-app/src/app/pages/`
- **API Documentation:** Apicurio Registry v3 REST API
- **Related Tasks:**
  - Task 002: Create Artifact (similar wizard workflow)
  - Task 007: Delete Operations (similar confirmation pattern)
  - Task 026-030: Metadata Editor (label management reuse)
  - Task 031: Rules Configuration (similar command pattern)

---

**Created:** 2025-11-07
**Target Start:** 2025-11-07
**Estimated Completion:** 2025-11-07 (same day - 2-3h)
**Status:** 📋 Ready to implement
