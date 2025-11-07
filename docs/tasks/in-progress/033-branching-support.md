# Task 033: Branching Support

**Status:** 📋 In Progress
**Priority:** 🔴 HIGH (Phase 2 - Advanced Features)
**Estimated Effort:** 8-10 hours
**Phase:** Feature Parity Phase 2

## Overview

Implement comprehensive branching support for Apicurio Registry 3.1+, enabling users to create, manage, and navigate artifact version branches through the VSCode extension. This brings advanced version control capabilities to schema management workflows.

## Strategic Context

**Feature Gap:**
- Web UI: Full branching support (view, create, manage branches)
- VSCode Extension: No branching support (only flat version lists)

**Current State:**
- ✅ Version listing: `getVersions()` shows all versions
- ✅ Version operations: Open, edit, delete versions
- ❌ **MISSING:** Branch visibility in tree view
- ❌ **MISSING:** Branch creation/management
- ❌ **MISSING:** View versions organized by branch
- ❌ **MISSING:** Add/remove versions from branches

**User Value:**
- Organize versions by release streams (1.x, 2.x, main, etc.)
- Manage maintenance branches for old versions
- Isolate experimental versions from stable releases
- Improve schema version navigation and organization
- Enable GitFlow-style workflow for schemas

**Dependencies:**
- None (standalone feature)

## Implementation Plan

### Phase 1: Registry Service Extension (2h)

**File:** `src/services/registryService.ts`

**Methods to Add:**

```typescript
// Branch Management
async getBranches(groupId: string, artifactId: string): Promise<BranchMetadata[]>

async getBranchMetadata(
    groupId: string,
    artifactId: string,
    branchId: string
): Promise<BranchMetadata>

async createBranch(
    groupId: string,
    artifactId: string,
    branchId: string,
    description?: string
): Promise<BranchMetadata>

async updateBranchMetadata(
    groupId: string,
    artifactId: string,
    branchId: string,
    metadata: { description?: string }
): Promise<void>

async deleteBranch(
    groupId: string,
    artifactId: string,
    branchId: string
): Promise<void>

async getBranchVersions(
    groupId: string,
    artifactId: string,
    branchId: string
): Promise<SearchedVersion[]>

async addVersionToBranch(
    groupId: string,
    artifactId: string,
    branchId: string,
    version: string
): Promise<void>
```

**API Endpoints:**

```
GET    /groups/{groupId}/artifacts/{artifactId}/branches
GET    /groups/{groupId}/artifacts/{artifactId}/branches/{branchId}
POST   /groups/{groupId}/artifacts/{artifactId}/branches
PUT    /groups/{groupId}/artifacts/{artifactId}/branches/{branchId}
DELETE /groups/{groupId}/artifacts/{artifactId}/branches/{branchId}
GET    /groups/{groupId}/artifacts/{artifactId}/branches/{branchId}/versions
POST   /groups/{groupId}/artifacts/{artifactId}/branches/{branchId}/versions
```

**Implementation Notes:**
- Handle 404 for artifacts without branches
- Validate branchId format (alphanumeric, dots, dashes, underscores)
- System-defined branches (like "latest") cannot be deleted
- Branches start empty - versions must be explicitly added

**Test:** Write service-level tests (7 tests covering all operations)

---

### Phase 2: Tree View Integration (2h)

**File:** `src/providers/registryTreeProvider.ts`

**Changes:**

1. **Add Branch Level to Tree Hierarchy**
   ```
   Group
   └── Artifact
       └── Branches                    ← NEW
           ├── latest (system)         ← NEW
           │   └── Version 1.0.0
           └── v1.x (custom)           ← NEW
               └── Version 1.0.0
   ```

2. **New Node Type:**
   ```typescript
   export enum RegistryItemType {
       Group = 'group',
       Artifact = 'artifact',
       Branch = 'branch',      // NEW
       Version = 'version'
   }
   ```

3. **Branch Node Implementation:**
   ```typescript
   interface RegistryItem {
       // ... existing fields
       branchId?: string;              // NEW
       systemDefined?: boolean;        // NEW
   }
   ```

4. **Update `getChildren()` Logic:**
   - When expanding artifact → fetch branches via `getBranches()`
   - When expanding branch → fetch versions via `getBranchVersions()`
   - Show icon: `$(git-branch)` for branches
   - Badge for system branches: "latest (system)"

5. **Context Values:**
   - `branch-system` - System-defined branches (no delete)
   - `branch-custom` - User-created branches (allow delete)

**UX Considerations:**
- Default to collapsed branch view
- Show branch count badge on artifacts: "Orders API (2 branches)"
- Color-code system vs custom branches
- Display "empty" message for branches with no versions

**Test:** Update tree provider tests (5 new tests)

---

### Phase 3: Branch Management Commands (3h)

**File:** `src/commands/branchCommands.ts` (NEW)

**Commands:**

**1. createBranchCommand(node: RegistryItem)**

**Workflow:**
1. Validate node is artifact
2. Prompt for branch ID (with validation)
3. Prompt for description (optional)
4. Confirm creation
5. Create branch via API
6. Refresh tree view
7. Auto-expand to show new branch

**Validation:**
- Branch ID: Required, alphanumeric + dots/dashes/underscores, max 256 chars
- Branch ID: Must not already exist
- Suggest common names: "main", "develop", "release", "v1.x", "v2.x"

**Example Flow:**
```
Step 1: Enter Branch ID
→ User enters: "v1.x"

Step 2: Description (optional)
→ User enters: "Version 1.x maintenance branch"

Step 3: Confirm Creation
Branch ID:     v1.x
Description:   Version 1.x maintenance branch
Artifact:      orders-api

[Create] [Cancel]

Step 4: Success
→ "Branch 'v1.x' created successfully"
→ Tree auto-expands to show new branch
```

**2. editBranchMetadataCommand(node: RegistryItem)**

**Workflow:**
1. Validate node is branch
2. Fetch current metadata
3. Show input box with current description
4. Update via API
5. Refresh tree view

**3. addVersionToBranchCommand(node: RegistryItem)**

**Workflow:**
1. Validate node is branch
2. Fetch all artifact versions
3. Show QuickPick with versions not in this branch
4. User selects version(s) (multi-select enabled)
5. Add to branch via API
6. Refresh tree view

**4. deleteBranchCommand(node: RegistryItem)**

**Workflow:**
1. Validate node is custom branch (not system-defined)
2. Show warning dialog:
   ```
   Delete branch 'v1.x'?

   This will remove the branch but versions will remain in the artifact.
   This action cannot be undone.

   [Delete] [Cancel]
   ```
3. Delete branch via API
4. Refresh tree view

**Safety Features:**
- Cannot delete system-defined branches ("latest")
- Clear messaging that versions are preserved
- Confirmation dialog for all deletes

**TDD Tests:**
- **createBranchCommand:** Happy path, cancel at each step, duplicate branch ID, invalid format
- **editBranchMetadataCommand:** Update description, cancel, system branch warning
- **addVersionToBranchCommand:** Add single version, add multiple, cancel, already exists
- **deleteBranchCommand:** Delete custom branch, prevent system branch deletion, cancel

**Total:** 15 comprehensive tests

---

### Phase 4: Command Registration (1h)

**Files:**
- `src/extension.ts`
- `package.json`

**Commands to Register:**

```json
{
  "command": "apicurioRegistry.createBranch",
  "title": "Create Branch",
  "category": "Apicurio Registry",
  "icon": "$(git-branch)"
},
{
  "command": "apicurioRegistry.editBranchMetadata",
  "title": "Edit Branch Metadata",
  "category": "Apicurio Registry"
},
{
  "command": "apicurioRegistry.addVersionToBranch",
  "title": "Add Version to Branch",
  "category": "Apicurio Registry"
},
{
  "command": "apicurioRegistry.deleteBranch",
  "title": "Delete Branch",
  "category": "Apicurio Registry"
}
```

**Context Menus:**

```json
// Artifact node - Create Branch
{
  "command": "apicurioRegistry.createBranch",
  "when": "view == apicurioRegistry && viewItem =~ /artifact.*/",
  "group": "8_branch@1"
}

// Branch node (custom) - Edit, Add Version, Delete
{
  "command": "apicurioRegistry.editBranchMetadata",
  "when": "view == apicurioRegistry && viewItem == branch-custom",
  "group": "8_branch@1"
},
{
  "command": "apicurioRegistry.addVersionToBranch",
  "when": "view == apicurioRegistry && viewItem =~ /branch-.*/",
  "group": "8_branch@2"
},
{
  "command": "apicurioRegistry.deleteBranch",
  "when": "view == apicurioRegistry && viewItem == branch-custom",
  "group": "9_dangerous@1"
}
```

---

### Phase 5: Test Coverage (2h)

**Test Files:**

**Service Tests:**
- `src/services/__tests__/registryService.branches.test.ts` (NEW)
  - getBranches() - happy path, no branches, artifact not found
  - getBranchMetadata() - happy path, branch not found
  - createBranch() - with description, without description, duplicate ID, invalid ID
  - updateBranchMetadata() - happy path, branch not found
  - deleteBranch() - happy path, system branch error, branch not found
  - getBranchVersions() - happy path, empty branch
  - addVersionToBranch() - happy path, version not found

**Command Tests:**
- `src/commands/__tests__/branchCommands.test.ts` (NEW)
  - createBranchCommand - happy path, cancel scenarios, validation
  - editBranchMetadataCommand - update, cancel, system branch
  - addVersionToBranchCommand - single, multiple, cancel
  - deleteBranchCommand - delete custom, prevent system delete

**Tree Provider Tests:**
- `src/providers/__tests__/registryTreeProvider.branches.test.ts` (UPDATE)
  - Show branches when expanding artifact
  - Show versions when expanding branch
  - Display system vs custom branch icons
  - Handle empty branches

**Total:** ~25 comprehensive tests

---

## Data Models

**New Interfaces (add to `src/models/registryModels.ts`):**

```typescript
export interface BranchMetadata {
    groupId: string;
    artifactId: string;
    branchId: string;
    createdOn: string;      // ISO timestamp
    modifiedOn: string;     // ISO timestamp
    modifiedBy: string;
    owner: string;
    description?: string;
    systemDefined: boolean; // true for "latest", false for custom
}

export interface BranchList {
    branches: BranchMetadata[];
    count: number;
}

export interface CreateBranchRequest {
    branchId: string;
    description?: string;
}

export interface UpdateBranchMetadataRequest {
    description?: string;
}

export interface AddVersionToBranchRequest {
    version: string;
}
```

---

## Success Criteria

**Functional:**
- ✅ Can view branches in tree view (nested under artifacts)
- ✅ Can create custom branches
- ✅ Can update branch metadata
- ✅ Can add versions to branches
- ✅ Can delete custom branches (not system branches)
- ✅ Can view versions organized by branch
- ✅ Tree view shows branch count badges
- ✅ System branches are clearly distinguished

**UX:**
- ✅ Branch tree view is intuitive and collapsed by default
- ✅ Branch creation wizard is simple and guided
- ✅ System branches cannot be accidentally deleted
- ✅ Icons clearly distinguish branches from versions
- ✅ Empty branches show helpful messaging

**Quality:**
- ✅ 25+ comprehensive tests passing
- ✅ 80%+ code coverage
- ✅ TypeScript compilation successful
- ✅ No linting errors
- ✅ Manual testing in Extension Development Host

---

## UX Mockups

### Tree View with Branches

```
📁 ecommerce-apis
  └── 📄 orders-api (2 branches)
      ├── $(git-branch) Branches
      │   ├── $(git-branch) latest (system)
      │   │   ├── 📦 1.0.0 (ENABLED)
      │   │   └── 📦 1.1.0 (ENABLED)
      │   └── $(git-branch) v1.x
      │       └── 📦 1.0.0 (ENABLED)
      └── ... (other commands)
```

### Create Branch Flow

**Step 1: Branch ID**
```
┌─ Create Branch - Step 1/3: Enter Branch ID ──────┐
│                                                    │
│ Enter a unique branch identifier                  │
│                                                    │
│ > v2.x█                                            │
│                                                    │
│ Suggestions: main, develop, release, v1.x, v2.x   │
│                                                    │
│ Branch ID can contain letters, numbers, dots,     │
│ dashes, and underscores (max 256 characters)      │
└────────────────────────────────────────────────────┘
```

**Step 2: Description**
```
┌─ Create Branch - Step 2/3: Description (optional) ┐
│                                                    │
│ Enter a description for this branch               │
│                                                    │
│ > Version 2.x development branch█                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Step 3: Confirmation**
```
┌─ Create Branch - Step 3/3: Confirm ───────────────┐
│                                                    │
│ Branch ID:     v2.x                                │
│ Description:   Version 2.x development branch      │
│ Artifact:      orders-api                          │
│                                                    │
│   $(check) Create Branch                           │
│   $(x) Cancel                                      │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Add Version to Branch

```
┌─ Add Version to Branch: v1.x ─────────────────────┐
│                                                    │
│ Select versions to add (use space to select)      │
│                                                    │
│   [ ] 1.0.0 (ENABLED)   - Already in this branch  │
│   [x] 1.0.1 (ENABLED)                              │
│   [x] 1.0.2 (ENABLED)                              │
│   [ ] 2.0.0 (ENABLED)   - Wrong major version     │
│                                                    │
│ Selected: 2 versions                               │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## API Reference

**Apicurio Registry REST API v3:**

### List Branches
```
GET /groups/{groupId}/artifacts/{artifactId}/branches

Response: 200 OK
{
  "branches": [
    {
      "groupId": "string",
      "artifactId": "string",
      "branchId": "string",
      "createdOn": "2025-11-07T10:00:00Z",
      "modifiedOn": "2025-11-07T10:00:00Z",
      "modifiedBy": "string",
      "owner": "string",
      "description": "string",
      "systemDefined": false
    }
  ],
  "count": 1
}

Errors:
- 404 Not Found: Artifact does not exist
```

### Get Branch Metadata
```
GET /groups/{groupId}/artifacts/{artifactId}/branches/{branchId}

Response: 200 OK
{
  "groupId": "string",
  "artifactId": "string",
  "branchId": "string",
  "createdOn": "2025-11-07T10:00:00Z",
  "modifiedOn": "2025-11-07T10:00:00Z",
  "modifiedBy": "string",
  "owner": "string",
  "description": "string",
  "systemDefined": false
}

Errors:
- 404 Not Found: Branch does not exist
```

### Create Branch
```
POST /groups/{groupId}/artifacts/{artifactId}/branches
Content-Type: application/json

Request Body:
{
  "branchId": "string",      // Required
  "description": "string"    // Optional
}

Response: 200 OK
{
  "groupId": "string",
  "artifactId": "string",
  "branchId": "string",
  "createdOn": "2025-11-07T10:00:00Z",
  "modifiedOn": "2025-11-07T10:00:00Z",
  "modifiedBy": "string",
  "owner": "string",
  "description": "string",
  "systemDefined": false
}

Errors:
- 400 Bad Request: Invalid branch ID format
- 404 Not Found: Artifact does not exist
- 409 Conflict: Branch already exists
```

### Update Branch Metadata
```
PUT /groups/{groupId}/artifacts/{artifactId}/branches/{branchId}
Content-Type: application/json

Request Body:
{
  "description": "string"    // Optional
}

Response: 204 No Content

Errors:
- 400 Bad Request: Invalid metadata
- 404 Not Found: Branch does not exist
```

### Delete Branch
```
DELETE /groups/{groupId}/artifacts/{artifactId}/branches/{branchId}

Response: 204 No Content

Errors:
- 404 Not Found: Branch does not exist
- 405 Method Not Allowed: Cannot delete system-defined branch
```

### Get Branch Versions
```
GET /groups/{groupId}/artifacts/{artifactId}/branches/{branchId}/versions

Response: 200 OK
{
  "versions": [
    {
      "version": "string",
      "globalId": 123,
      "state": "ENABLED",
      "createdOn": "2025-11-07T10:00:00Z",
      ...
    }
  ],
  "count": 1
}

Errors:
- 404 Not Found: Branch does not exist
```

### Add Version to Branch
```
POST /groups/{groupId}/artifacts/{artifactId}/branches/{branchId}/versions
Content-Type: application/json

Request Body:
{
  "version": "string"    // Version identifier
}

Response: 204 No Content

Errors:
- 404 Not Found: Branch or version does not exist
- 409 Conflict: Version already in branch
```

---

## Files to Create/Modify

**New Files:**
- `src/commands/branchCommands.ts` (~300 lines)
- `src/commands/__tests__/branchCommands.test.ts` (~400 lines)
- `src/services/__tests__/registryService.branches.test.ts` (~250 lines)

**Modified Files:**
- `src/services/registryService.ts` (+150 lines - 7 new methods)
- `src/models/registryModels.ts` (+40 lines - new interfaces)
- `src/providers/registryTreeProvider.ts` (+80 lines - branch tree logic)
- `src/providers/__tests__/registryTreeProvider.test.ts` (+60 lines)
- `src/extension.ts` (+20 lines - command registration)
- `package.json` (+30 lines - command definitions)

**Total:** 3 new files, 6 modified files, ~1330 lines

---

## Testing Plan

### Unit Tests
```bash
npm run test -- --testPathPattern=branchCommands
npm run test -- --testPathPattern=registryService.branches
npm run test -- --testPathPattern=registryTreeProvider
```

### Manual Testing

1. **Branch Creation:**
   - Right-click artifact → "Create Branch"
   - Enter branch ID: "develop"
   - Add description: "Development branch"
   - Verify branch appears in tree

2. **View Branch Versions:**
   - Expand "develop" branch
   - Verify it shows "No versions" initially

3. **Add Versions to Branch:**
   - Right-click "develop" → "Add Version to Branch"
   - Select multiple versions
   - Verify versions appear under branch

4. **Edit Branch Metadata:**
   - Right-click "develop" → "Edit Branch Metadata"
   - Update description
   - Verify tooltip shows new description

5. **Delete Custom Branch:**
   - Right-click "develop" → "Delete Branch"
   - Confirm deletion
   - Verify branch removed from tree
   - Verify versions still exist in artifact

6. **System Branch Protection:**
   - Try to delete "latest" branch
   - Verify error message prevents deletion

7. **Empty Branch Handling:**
   - Create new branch
   - Expand it
   - Verify "No versions" message displayed

### Edge Cases
- Artifact with no branches
- Artifact with only system branches
- Branch with many versions (performance)
- Invalid branch ID characters
- Concurrent branch creation
- Network error handling

---

## Risk Assessment

**Technical Risks:**
- ✅ LOW: API well-documented from research
- ✅ LOW: Similar patterns to existing commands (groups, artifacts)
- ⚠️ MEDIUM: Tree view complexity increases (4 levels now)
- ⚠️ MEDIUM: Performance with many branches/versions

**UX Risks:**
- ⚠️ MEDIUM: Tree view may become cluttered with branches
- ✅ LOW: Branch concept familiar from Git workflows

**Mitigation:**
- Default branches to collapsed state
- Implement lazy loading for branch versions
- Show branch count badges to indicate complexity
- Use clear icons and labels to distinguish hierarchy
- Add keyboard shortcuts for common operations

---

## Future Enhancements

**Beyond This Task:**
- Semantic versioning auto-assignment (1.x branch auto-includes 1.0.0, 1.0.1, etc.)
- Branch-based version filtering
- Branch comparison view
- Branch merge operations
- Branch templates (create branch with initial versions)
- Branch protection rules
- Branch workflows (draft → review → release)

---

## References

- **API Discovery:** Direct testing against Apicurio Registry 3.1.1
- **Related Tasks:**
  - Task 002: Create Artifact (similar wizard workflow)
  - Task 007: Delete Operations (similar confirmation pattern)
  - Task 032: Group Management (similar CRUD pattern)

---

**Created:** 2025-11-07
**Started:** 2025-11-07
**Target Completion:** 2025-11-08 (2 days)
**Status:** 🚧 IN PROGRESS - Phase 1 (Research Complete)
