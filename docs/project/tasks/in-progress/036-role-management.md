# Task 036: Role Management

**Status:** 🚧 In Progress
**Priority:** High (Phase 3 - Admin & Utility)
**Estimated Effort:** 4-6 hours
**Started:** 2025-12-10

---

## Goal

Implement role-based access control (RBAC) management for Apicurio Registry, enabling users to view and manage role mappings through the VSCode extension.

**Feature Parity:** Matches Web UI "Roles" tab functionality

---

## Background

### Web UI Current Features

The Apicurio Registry Web UI provides a "Roles" tab for RBAC administration:

1. **Role Mappings List:**
   - Principal (user/service account)
   - Role (admin, developer, read-only)
   - Principal type (user, service account)
   - Actions (delete)

2. **Operations:**
   - View all role mappings
   - Create new role mapping
   - Delete role mapping

3. **Available Roles:**
   - **Admin** - Full access to all registry operations
   - **Developer** - Read/write access to artifacts and versions
   - **Read-Only** - Read-only access to registry

### API Endpoints

```typescript
// List all role mappings
GET /admin/roleMappings

// Create role mapping
POST /admin/roleMappings
Body: { principalId: string, role: string, principalName?: string }

// Update role mapping (if supported)
PUT /admin/roleMappings/{principalId}
Body: { role: string }

// Delete role mapping
DELETE /admin/roleMappings/{principalId}

// Get current user role
GET /admin/roleMappings/me
```

---

## Success Criteria

**Must Have:**
- ✅ View all role mappings in tree view
- ✅ Create new role mapping (principal + role)
- ✅ Delete role mapping with confirmation
- ✅ Display current user's role prominently
- ✅ Support for all role types (admin, developer, read-only)
- ✅ Comprehensive test coverage (80%+)

**Nice to Have:**
- ⭐ Update existing role mapping
- ⭐ Role-based command visibility (hide admin commands from non-admins)
- ⭐ Principal type indicator (user vs service account)

---

## Implementation Plan

### Phase 1: Registry Service Extensions (2h)

**File:** `src/services/registryService.ts`

**Methods to Add:**
```typescript
// Get all role mappings
async getRoleMappings(): Promise<RoleMapping[]>

// Get current user's role
async getCurrentUserRole(): Promise<RoleMapping | null>

// Create role mapping
async createRoleMapping(principalId: string, role: string, principalName?: string): Promise<RoleMapping>

// Update role mapping (if API supports)
async updateRoleMapping(principalId: string, role: string): Promise<RoleMapping>

// Delete role mapping
async deleteRoleMapping(principalId: string): Promise<void>
```

**Data Model:**
```typescript
// src/models/registryModels.ts
export interface RoleMapping {
  principalId: string;
  role: 'ADMIN' | 'DEVELOPER' | 'READ_ONLY';
  principalName?: string;
}

export enum Role {
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  READ_ONLY = 'READ_ONLY'
}
```

**Tests:** `src/services/__tests__/registryService.roles.test.ts`
- Test getRoleMappings (empty, multiple)
- Test getCurrentUserRole (admin, developer, read-only, none)
- Test createRoleMapping (success, duplicate, 403 forbidden)
- Test updateRoleMapping (success, 404 not found)
- Test deleteRoleMapping (success, 404 not found, 403 forbidden)

---

### Phase 2: Role Management Commands (1.5h)

**File:** `src/commands/roleCommands.ts`

**Commands:**

1. **createRoleMappingCommand()**
   - Step 1: Input principal ID (email, username, service account)
   - Step 2: QuickPick role selection (Admin, Developer, Read-Only)
   - Step 3: Optional principal name
   - Step 4: Confirmation summary
   - Create role mapping
   - Show success message
   - Refresh tree view

2. **updateRoleMappingCommand(node: RegistryItem)**
   - Current role displayed
   - QuickPick new role selection
   - Confirmation
   - Update role mapping
   - Refresh tree view

3. **deleteRoleMappingCommand(node: RegistryItem)**
   - Warning dialog: "Delete role mapping for {principal}?"
   - Modal confirmation
   - Delete role mapping
   - Success message
   - Refresh tree view

4. **viewCurrentUserRoleCommand()**
   - Fetch current user role
   - Show information message
   - Display role and permissions

**Tests:** `src/commands/__tests__/roleCommands.test.ts`
- Create role mapping: happy path, minimal data, cancellation at each step, duplicate, forbidden
- Update role mapping: happy path, cancellation, 404 error
- Delete role mapping: happy path, cancellation, 404 error, forbidden
- View current user role: admin, developer, read-only, no role

---

### Phase 3: Tree View Integration (1h)

**File:** `src/providers/registryTreeProvider.ts`

**Tree Structure:**
```
Registry
├── Roles (badge: count)
│   ├── Current User: {role}
│   ├── {principal1} - Admin
│   ├── {principal2} - Developer
│   └── {principal3} - Read-Only
```

**New Item Type:**
```typescript
export enum RegistryItemType {
  // ... existing types
  RolesContainer = 'rolesContainer',
  RoleMapping = 'roleMapping',
  CurrentUserRole = 'currentUserRole'
}
```

**Context Values:**
```
- rolesContainer (for container)
- roleMapping (for individual mapping)
- currentUserRole (for current user, read-only)
```

**Updates:**
- Add getRoles() method
- Add role count badge to container
- Add icons for different roles
- Add tooltips with role descriptions

---

### Phase 4: Command Registration (0.5h)

**File:** `src/extension.ts`

Register commands:
```typescript
vscode.commands.registerCommand('apicurioRegistry.createRoleMapping', createRoleMappingCommand)
vscode.commands.registerCommand('apicurioRegistry.updateRoleMapping', updateRoleMappingCommand)
vscode.commands.registerCommand('apicurioRegistry.deleteRoleMapping', deleteRoleMappingCommand)
vscode.commands.registerCommand('apicurioRegistry.viewCurrentUserRole', viewCurrentUserRoleCommand)
```

**File:** `package.json`

Add commands:
```json
{
  "command": "apicurioRegistry.createRoleMapping",
  "title": "Create Role Mapping",
  "category": "Apicurio Registry",
  "icon": "$(person-add)"
},
{
  "command": "apicurioRegistry.updateRoleMapping",
  "title": "Update Role Mapping",
  "category": "Apicurio Registry"
},
{
  "command": "apicurioRegistry.deleteRoleMapping",
  "title": "Delete Role Mapping",
  "category": "Apicurio Registry"
},
{
  "command": "apicurioRegistry.viewCurrentUserRole",
  "title": "View My Role",
  "category": "Apicurio Registry",
  "icon": "$(shield)"
}
```

Add context menus:
```json
"view/item/context": [
  {
    "command": "apicurioRegistry.createRoleMapping",
    "when": "view == apicurioRegistryView && viewItem == rolesContainer",
    "group": "1_roles@1"
  },
  {
    "command": "apicurioRegistry.updateRoleMapping",
    "when": "view == apicurioRegistryView && viewItem == roleMapping",
    "group": "1_roles@1"
  },
  {
    "command": "apicurioRegistry.deleteRoleMapping",
    "when": "view == apicurioRegistryView && viewItem == roleMapping",
    "group": "1_roles@2"
  }
]
```

---

### Phase 5: Test Coverage (1h)

**Test Files:**
- `src/services/__tests__/registryService.roles.test.ts` (15 tests)
- `src/commands/__tests__/roleCommands.test.ts` (20 tests)
- Integration tests in tree provider (5 tests)

**Total Test Coverage:** 40+ tests

**Test Scenarios:**
- All CRUD operations
- Error handling (404, 403, 409, 500)
- User cancellation at all steps
- Edge cases (empty list, current user not found)
- Validation (invalid principal, invalid role)

---

## TDD Workflow

**RED → GREEN → REFACTOR**

1. **RED:** Write failing tests for each method/command
2. **GREEN:** Implement minimal code to pass tests
3. **REFACTOR:** Clean up code, improve structure

**Example:**
```typescript
// RED: Write test first
test('getRoleMappings should return all role mappings', async () => {
  const mockMappings = [
    { principalId: 'user1@example.com', role: 'ADMIN' },
    { principalId: 'user2@example.com', role: 'DEVELOPER' }
  ];
  mockClient.get.mockResolvedValue({ data: mockMappings });

  const result = await service.getRoleMappings();

  expect(result).toEqual(mockMappings);
  expect(mockClient.get).toHaveBeenCalledWith('/admin/roleMappings');
});

// GREEN: Implement method
async getRoleMappings(): Promise<RoleMapping[]> {
  const response = await this.client.get<RoleMapping[]>('/admin/roleMappings');
  return response.data;
}

// REFACTOR: Add error handling, validation, etc.
```

---

## API Reference

### Apicurio Registry Admin API (v3)

**Base Path:** `/admin`

**Authentication:** Required (admin role)

**Endpoints:**

```http
GET /admin/roleMappings
Response: RoleMapping[]

POST /admin/roleMappings
Body: { principalId: string, role: string, principalName?: string }
Response: RoleMapping

PUT /admin/roleMappings/{principalId}
Body: { role: string }
Response: RoleMapping

DELETE /admin/roleMappings/{principalId}
Response: 204 No Content

GET /admin/roleMappings/me
Response: RoleMapping
```

**Role Values:**
- `ADMIN` - Full administrative access
- `DEVELOPER` - Read/write access
- `READ_ONLY` - Read-only access

---

## Files to Create/Modify

**New Files:**
- `src/commands/roleCommands.ts` (~350 lines)
- `src/commands/__tests__/roleCommands.test.ts` (~450 lines)
- `src/services/__tests__/registryService.roles.test.ts` (~350 lines)

**Modified Files:**
- `src/services/registryService.ts` (+150 lines - 5 new methods)
- `src/models/registryModels.ts` (+15 lines - RoleMapping interface, Role enum)
- `src/providers/registryTreeProvider.ts` (+120 lines - roles tree view)
- `src/extension.ts` (+20 lines - command registration)
- `package.json` (+50 lines - commands, context menus)

**Total:** 3 new files, 5 modified files, ~1,500 lines of code

---

## UI/UX Design

### Tree View Display

```
📁 Apicurio Registry (localhost:8080)
  ├── 👥 Roles (3)
  │   ├── 🛡️ Current User: admin@example.com (ADMIN)
  │   ├── 👤 user1@example.com (DEVELOPER)
  │   ├── 👤 user2@example.com (READ_ONLY)
  │   └── 🤖 service-account (DEVELOPER)
  ├── 📦 Groups
  └── ...
```

### Icons
- `$(organization)` - Roles container
- `$(shield)` - Current user role
- `$(person)` - Regular user role mapping
- `$(robot)` - Service account role mapping

### Role Badges
- ADMIN - Red badge
- DEVELOPER - Yellow badge
- READ_ONLY - Blue badge

### Tooltips
```
Principal: user1@example.com
Role: DEVELOPER
Permissions:
• Read artifacts
• Create artifacts
• Update artifacts
• Delete own artifacts
```

---

## Error Handling

### Common Errors

**403 Forbidden:**
```
"You don't have permission to manage roles. Admin role required."
```

**404 Not Found:**
```
"Role mapping for 'user@example.com' not found."
```

**409 Conflict:**
```
"Role mapping for 'user@example.com' already exists."
```

**500 Server Error:**
```
"Failed to manage role mappings. Please check server logs."
```

### User Actions

All errors should:
- Show modal error dialog
- Log to Output channel
- Suggest corrective action
- Allow retry where applicable

---

## Dependencies

**Existing Patterns:**
- Reuse wizard pattern from groupCommands.ts
- Reuse QuickPick pattern from metadata editor
- Reuse confirmation pattern from delete commands
- Reuse error handling from rules commands

**API Compatibility:**
- Requires Apicurio Registry v3.0+ with RBAC enabled
- Authentication must be configured (OIDC or basic auth)
- Admin role required for role management operations

---

## Testing Strategy

### Unit Tests
- All registry service methods (15 tests)
- All command functions (20 tests)
- Mock AxiosInstance for API calls
- Mock VSCode APIs (window, commands)

### Integration Tests
- Tree view integration (5 tests)
- End-to-end role management workflow
- Error handling flows

### Manual Testing
1. View roles list
2. Create new role mapping
3. Update existing role mapping
4. Delete role mapping
5. View current user role
6. Test with different role levels (admin, developer, read-only)
7. Test error scenarios (forbidden, not found)

---

## Acceptance Criteria

**Functional:**
- ✅ Can view all role mappings in tree view
- ✅ Can create new role mapping via wizard
- ✅ Can update role mapping via QuickPick
- ✅ Can delete role mapping with confirmation
- ✅ Can view current user's role
- ✅ Role count badge displayed in tree
- ✅ All commands registered and working

**Quality:**
- ✅ 40+ tests passing (15 service + 20 command + 5 integration)
- ✅ TypeScript compiles with 0 errors
- ✅ No linting warnings
- ✅ All error cases handled gracefully

**Documentation:**
- ✅ Task spec complete
- ✅ Code comments for complex logic
- ✅ Update TODO.md with completion
- ✅ Update MASTER_PLAN.md progress

---

## Future Enhancements

**Phase 4 Possibilities:**
- Role-based command visibility (hide admin commands from non-admins)
- Bulk role operations (import/export)
- Role templates
- Audit log for role changes
- Integration with external identity providers
- Custom role definitions (if API supports)

---

## References

- **Web UI:** `apicurio-registry/ui/ui-app/src/app/pages/roles/`
- **API Docs:** Apicurio Registry REST API v3 Documentation
- **Similar Tasks:** Task 031 (Rules), Task 032 (Groups)
- **Design Patterns:** Wizard (groupCommands), QuickPick (rulesCommand)

---

**Task Owner:** Development Team
**Created:** 2025-12-10
**Target Completion:** 4-6 hours
**Status:** 🚧 In Progress
