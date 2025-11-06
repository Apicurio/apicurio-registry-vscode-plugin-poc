# Task 031: Rules Configuration

**Status:** 📋 Todo
**Priority:** 🔴 HIGH
**Estimated Effort:** 6-8 hours
**Phase:** Feature Parity Phase 2 (Advanced Features)

## Overview

Implement comprehensive rules management for Apicurio Registry, allowing users to view and configure validation rules at three levels: Global, Group, and Artifact. This enables control over content validity, compatibility, and integrity checking.

## Strategic Context

**Feature Gap:**
- Web UI: Full rules configuration UI with enable/disable and settings
- VSCode Extension: No rules support at all

**User Value:**
- Control validation behavior for schemas
- Enforce compatibility requirements
- Ensure content integrity
- Prevent breaking changes to consumers

**Dependencies:**
- None - standalone feature

## Rule Types

Apicurio Registry supports 3 validation rule types:

### 1. VALIDITY Rule
**Purpose:** Ensure that content is valid when creating an artifact or version

**Config Options:**
- `SYNTAX_ONLY` - Validate syntax only
- `FULL` - Full semantic validation

**Use Cases:**
- Prevent invalid OpenAPI/AsyncAPI schemas
- Validate Avro/Protobuf syntax
- Ensure JSON Schema correctness

### 2. COMPATIBILITY Rule
**Purpose:** Enforce compatibility when creating new artifact versions

**Config Options:**
- `BACKWARD` - New schema can read data written by previous schema
- `BACKWARD_TRANSITIVE` - New schema compatible with all previous schemas
- `FORWARD` - Previous schema can read data written by new schema
- `FORWARD_TRANSITIVE` - Previous schemas compatible with all newer schemas
- `FULL` - Both backward and forward compatible
- `FULL_TRANSITIVE` - Fully compatible with all previous/future schemas
- `NONE` - No compatibility enforcement

**Use Cases:**
- Prevent breaking changes for consumers
- Ensure smooth schema evolution
- Enforce versioning policies

### 3. INTEGRITY Rule
**Purpose:** Enforce artifact reference integrity

**Config Options:**
- `NO_DUPLICATES` - Prevent duplicate references
- `ALL_REFS_MAPPED` - All references must be mapped
- `REFS_EXIST` - Referenced artifacts must exist

**Use Cases:**
- Ensure referenced schemas exist
- Prevent broken references
- Maintain schema dependency graphs

## Rule Levels

### Global Rules
**Scope:** Apply to all artifacts in the registry (unless overridden)

**API Endpoints:**
```
GET    /admin/rules              - List global rule types
GET    /admin/rules/{ruleType}   - Get global rule config
POST   /admin/rules              - Create global rule
PUT    /admin/rules/{ruleType}   - Update global rule config
DELETE /admin/rules/{ruleType}   - Delete global rule
```

### Group Rules
**Scope:** Apply to all artifacts in a specific group (unless overridden)

**API Endpoints:**
```
GET    /groups/{groupId}/rules              - List group rule types
GET    /groups/{groupId}/rules/{ruleType}   - Get group rule config
POST   /groups/{groupId}/rules              - Create group rule
PUT    /groups/{groupId}/rules/{ruleType}   - Update group rule config
DELETE /groups/{groupId}/rules/{ruleType}   - Delete group rule
```

### Artifact Rules
**Scope:** Apply to specific artifact only (highest priority)

**API Endpoints:**
```
GET    /groups/{groupId}/artifacts/{artifactId}/rules              - List artifact rule types
GET    /groups/{groupId}/artifacts/{artifactId}/rules/{ruleType}   - Get artifact rule config
POST   /groups/{groupId}/artifacts/{artifactId}/rules              - Create artifact rule
PUT    /groups/{groupId}/artifacts/{artifactId}/rules/{ruleType}   - Update artifact rule config
DELETE /groups/{groupId}/artifacts/{artifactId}/rules/{ruleType}   - Delete artifact rule
```

## Data Models

```typescript
// Rule interface (from SDK)
export interface Rule {
    ruleType: 'VALIDITY' | 'COMPATIBILITY' | 'INTEGRITY';
    config: string;  // One of the config options above
}

// Create rule request
export interface CreateRule {
    ruleType: 'VALIDITY' | 'COMPATIBILITY' | 'INTEGRITY';
    config: string;
}
```

## Implementation Plan

### Phase 1: Registry Service Extensions (2h)

**File:** `src/services/registryService.ts`

**Global Rules Methods:**
```typescript
async getGlobalRules(): Promise<Rule[]>
async getGlobalRule(ruleType: string): Promise<Rule>
async createGlobalRule(ruleType: string, config: string): Promise<Rule>
async updateGlobalRule(ruleType: string, config: string): Promise<Rule>
async deleteGlobalRule(ruleType: string): Promise<void>
```

**Group Rules Methods:**
```typescript
async getGroupRules(groupId: string): Promise<Rule[]>
async getGroupRule(groupId: string, ruleType: string): Promise<Rule>
async createGroupRule(groupId: string, ruleType: string, config: string): Promise<Rule>
async updateGroupRule(groupId: string, ruleType: string, config: string): Promise<Rule>
async deleteGroupRule(groupId: string, ruleType: string): Promise<void>
```

**Artifact Rules Methods:**
```typescript
async getArtifactRules(groupId: string, artifactId: string): Promise<Rule[]>
async getArtifactRule(groupId: string, artifactId: string, ruleType: string): Promise<Rule>
async createArtifactRule(groupId: string, artifactId: string, ruleType: string, config: string): Promise<Rule>
async updateArtifactRule(groupId: string, artifactId: string, ruleType: string, config: string): Promise<Rule>
async deleteArtifactRule(groupId: string, artifactId: string, ruleType: string): Promise<void>
```

**Total:** 15 new methods

### Phase 2: Rules Management Command (3h)

**File:** `src/commands/rulesCommand.ts`

**Workflow:**
1. User right-clicks group/artifact in tree → "Manage Rules"
2. Show QuickPick with current rules status:
   ```
   [ ] Validity: Not configured
   [✓] Compatibility: BACKWARD
   [ ] Integrity: Not configured
   ```
3. User selects a rule → Show options:
   - Enable (if disabled)
   - Configure (if enabled)
   - Disable (if enabled)
4. If Configure selected → Show QuickPick with config options
5. Save to registry
6. Refresh tree view

**Special Case: Global Rules**
- Accessed via Command Palette: "Apicurio Registry: Manage Global Rules"
- Same UI flow as group/artifact rules
- No tree context menu (global scope)

**TDD Tests:**
- Manage rules for group
- Manage rules for artifact
- Enable VALIDITY rule
- Configure COMPATIBILITY rule (select BACKWARD)
- Disable INTEGRITY rule
- Cancel at rule selection
- Cancel at config selection
- Handle API errors
- Handle missing entity

### Phase 3: Rule Display in Tree View (1h)

**File:** `src/providers/registryTreeProvider.ts`

**Enhancements:**
- Add rule count to tooltips: "Rules: 2 configured"
- Show rule details in tooltip:
  ```
  **Rules:**
  • Validity: FULL
  • Compatibility: BACKWARD
  ```
- Optional: Add badge to tree descriptions: `(2 rules)`

### Phase 4: Rule Violation Display (1h)

**Files:** Various command files (createArtifact, createDraftVersion, etc.)

**Enhancement:**
- Parse error responses for rule violations
- Extract rule type and violation message
- Display user-friendly error:
  ```
  Compatibility Rule Violation

  The new schema is not backward compatible with version 1.0.

  Details:
  - Field 'name' was removed (breaking change)
  - Use FORWARD compatibility or fix the schema
  ```

**Error Response Format (from API):**
```json
{
  "message": "Compatibility check failed",
  "error_code": 409,
  "detail": {
    "causes": [
      {
        "description": "Field 'name' was removed",
        "context": "..."
      }
    ]
  }
}
```

### Phase 5: Command Registration (0.5h)

**Files:**
- `src/extension.ts`
- `package.json`

**Commands:**
```json
{
  "command": "apicurioRegistry.manageGlobalRules",
  "title": "Manage Global Rules",
  "category": "Apicurio Registry"
},
{
  "command": "apicurioRegistry.manageGroupRules",
  "title": "Manage Rules",
  "when": "viewItem == group"
},
{
  "command": "apicurioRegistry.manageArtifactRules",
  "title": "Manage Rules",
  "when": "viewItem =~ /artifact.*/"
}
```

**Context Menu:**
```json
{
  "command": "apicurioRegistry.manageGroupRules",
  "when": "view == apicurioRegistry && viewItem == group",
  "group": "6_rules@1"
},
{
  "command": "apicurioRegistry.manageArtifactRules",
  "when": "view == apicurioRegistry && viewItem =~ /artifact.*/",
  "group": "6_rules@1"
}
```

### Phase 6: Test Coverage (1.5h)

**Test Files:**
- `src/services/__tests__/registryService.rules.test.ts`
- `src/commands/__tests__/rulesCommand.test.ts`

**Service Tests (15 tests):**
- Global rules: get list, get single, create, update, delete (5 tests)
- Group rules: get list, get single, create, update, delete (5 tests)
- Artifact rules: get list, get single, create, update, delete (5 tests)

**Command Tests (15 tests):**
- Manage group rules workflow
- Manage artifact rules workflow
- Enable validity rule
- Configure compatibility rule
- Disable integrity rule
- All rule types and all config options
- Cancel at various steps
- Error handling
- Rule violation display parsing

## Success Criteria

**Functional:**
- ✅ Can view rules at all 3 levels (global, group, artifact)
- ✅ Can enable/disable rules via QuickPick
- ✅ Can configure rule settings
- ✅ Rule changes persist correctly
- ✅ Tree view shows rule information
- ✅ Rule violations display clearly

**UX:**
- ✅ Consistent with VSCode patterns (QuickPick wizards)
- ✅ Clear labels for rule types and configurations
- ✅ Helpful descriptions for each rule option
- ✅ Error messages explain violations and fixes

**Quality:**
- ✅ 30 comprehensive tests passing
- ✅ 80%+ code coverage
- ✅ TypeScript compilation successful
- ✅ Manual testing in Extension Development Host

## UX Mockups

### Rule Selection QuickPick
```
Manage Rules for: my-group

  [ ] Validity Rule: Not configured
      Ensure that content is valid when creating artifacts

  [✓] Compatibility Rule: BACKWARD
      Enforce backward compatibility for new versions

  [ ] Integrity Rule: Not configured
      Enforce artifact reference integrity
```

### Rule Configuration QuickPick
```
Configure Compatibility Rule

  ○ BACKWARD - New schema can read old data
  ● BACKWARD_TRANSITIVE - Compatible with all previous schemas
  ○ FORWARD - Old schema can read new data
  ○ FORWARD_TRANSITIVE - Compatible with all future schemas
  ○ FULL - Both backward and forward compatible
  ○ FULL_TRANSITIVE - Fully compatible (all versions)
  ○ NONE - No compatibility enforcement
```

### Rule Violation Error
```
┌─ Compatibility Rule Violation ──────────────────────────┐
│                                                          │
│ The new schema is not backward compatible with v1.0     │
│                                                          │
│ Violation Details:                                      │
│ • Field 'name' was removed (breaking change)            │
│ • Field 'email' type changed: string → number           │
│                                                          │
│ Suggestions:                                            │
│ • Use FORWARD compatibility instead                     │
│ • Add removed fields back to the schema                 │
│ • Disable compatibility rule temporarily                │
│                                                          │
│ [View Full Error]  [Disable Rule]  [Cancel]            │
└──────────────────────────────────────────────────────────┘
```

## Files to Create

**New Files:**
- `src/commands/rulesCommand.ts` (400 lines)
- `src/commands/__tests__/rulesCommand.test.ts` (500 lines)
- `src/services/__tests__/registryService.rules.test.ts` (400 lines)

**Modified Files:**
- `src/services/registryService.ts` (+300 lines - 15 methods)
- `src/providers/registryTreeProvider.ts` (+50 lines - tooltip enhancements)
- `src/extension.ts` (+15 lines - command registration)
- `package.json` (+30 lines - command definitions)
- `src/models/registryModels.ts` (+20 lines - Rule interface)

**Total:** 3 new files, 5 modified files, ~1,715 lines

## API Reference

**Apicurio Registry REST API v3.1:**
- `/admin/rules` - Global rules
- `/groups/{groupId}/rules` - Group rules
- `/groups/{groupId}/artifacts/{artifactId}/rules` - Artifact rules

**Operations:** GET (list), GET (single), POST (create), PUT (update), DELETE

**Rule Types:**
- `VALIDITY` - Content validation
- `COMPATIBILITY` - Version compatibility
- `INTEGRITY` - Reference integrity

## Testing Plan

### Unit Tests
```bash
npm run test -- --testPathPattern=rulesCommand
npm run test -- --testPathPattern=registryService.rules
```

### Manual Testing
1. Connect to Apicurio Registry instance
2. Right-click group → "Manage Rules"
3. Enable VALIDITY rule → Select FULL
4. Verify rule appears in tooltip
5. Right-click artifact → "Manage Rules"
6. Enable COMPATIBILITY rule → Select BACKWARD
7. Try to upload incompatible schema → Verify error display
8. Disable COMPATIBILITY rule → Upload succeeds
9. Command Palette → "Manage Global Rules"
10. Configure all 3 rule types
11. Verify rules inherited by new groups/artifacts

## Risk Assessment

**Technical Risks:**
- ✅ LOW: API well-documented, existing implementation in Web UI
- ✅ LOW: QuickPick patterns proven in previous tasks
- 🟡 MEDIUM: Rule violation error parsing might be complex

**UX Risks:**
- 🟡 MEDIUM: Rule config options might be confusing to users
- ✅ LOW: Context menus make rules easily discoverable

**Mitigation:**
- Add detailed tooltips for all rule options
- Link to Apicurio Registry documentation
- Provide clear error messages with actionable suggestions

## Future Enhancements

**Beyond This Task:**
- Rule inheritance visualization (show which level rule comes from)
- Rule testing (validate schema without creating version)
- Rule templates (save/reuse common configurations)
- Rule audit log (track rule changes over time)
- Bulk rule operations (apply to multiple artifacts)

## References

- **Web UI Implementation:** `/Users/astranier/Documents/dev/apicurio/apicurio-registry/ui/ui-app/src/app/components/ruleList/`
- **API Documentation:** Apicurio Registry v3.1 REST API
- **Related Tasks:**
  - Task 002: Create Artifact (similar QuickPick workflow)
  - Task 025: Advanced Search (similar multi-step UI)
  - Tasks 026-030: Metadata Editor (similar command pattern)

---

**Created:** 2025-11-06
**Target Start:** 2025-11-07
**Estimated Completion:** 2025-11-08
**Status:** 📋 Ready to implement
