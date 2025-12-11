# Apicurio VSCode Plugin - Master Implementation Plan

**Last Updated:** 2025-11-07
**Status:** Feature Parity Roadmap - Phase 2 IN PROGRESS! 🔥 (38% complete)
**Latest:** Task 032 - Group Management COMPLETE ✅ (2h actual)
**Next:** Phase 2.3 - Branching Support (8-10h) - HIGH value feature

---

## Overview

This master plan integrates planning documents into a unified roadmap prioritizing feature parity with the Apicurio Registry Web UI:

1. **Feature Parity Roadmap** ([FEATURE_ROADMAP.md](FEATURE_ROADMAP.md)) - Primary roadmap (NEW - 2025-11-05)
2. **Feature Gap Analysis** ([FEATURE_GAP_ANALYSIS.md](FEATURE_GAP_ANALYSIS.md)) - Web UI comparison (NEW - 2025-11-05)
3. **Original 4-Phase Plan** ([VSCODE_PLUGIN_PLAN.md](VSCODE_PLUGIN_PLAN.md)) - Initial vision
4. **UX Improvements** ([UX_COMPARISON.md](UX_COMPARISON.md)) - Reference plugin analysis
5. **Current TODO** ([TODO.md](TODO.md)) - Active task tracking

## Strategic Decision (2025-11-05)

**Visual Editor work deferred to final phase** per explicit user directive. Focus shifted to:
- ✅ **Phase 1:** Core Operations (Advanced Search, Labels, Version Creation)
- ✅ **Phase 2:** Advanced Features (Rules, Branching)
- ✅ **Phase 3:** Admin & Utility (Import/Export)
- ⏸️ **Phase 4:** Visual Editor (DEFERRED - React-based editors)

**Rationale:** Deliver high-value core features (15-20h) before investing in visual editor (35-45h)

## Current Status Summary

| Area | Status | Progress | Next Step |
|------|--------|----------|-----------|
| **Foundation & Tree** (Phase 1-2) | ✅ Complete | 100% | - |
| **UX High Priority** | ✅ Complete | 100% (4/4) | - |
| **UX Medium Priority** | 🚧 In Progress | 67% (2/3) | Task 005 remaining |
| **Draft Infrastructure** (Phase 3.0) | ✅ Complete | 100% (4/4) | - |
| **Text Editor** (Phase 3.1) | ✅ Complete | 100% (3/3) | - |
| **MCP Integration** | ✅ Complete (Working) | 100% (5/5) | **JAR mode fully working!** 🎉 |
| **✅ FEATURE PARITY Phase 1** | ✅ **COMPLETE!** | 100% (2/2) | **All core operations done** |
| **🔥 FEATURE PARITY Phase 2** | 🚧 **IN PROGRESS** | 38% (3/8) | **Tasks 031-032 Complete! ✅** |
| **FEATURE PARITY Phase 3** | 📋 Planned | 0% (0/4) | After Phase 2 |
| **Visual Editor** (Phase 4) | ⏸️ **DEFERRED** | 50% (2/4) | **Moved to end** |

---

## Feature Parity Roadmap (NEW - 2025-11-05)

**See [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) for detailed implementation plan.**

This is now the **primary roadmap** for the extension. Based on comprehensive analysis of the Apicurio Registry Web UI ([FEATURE_GAP_ANALYSIS.md](FEATURE_GAP_ANALYSIS.md)), we've identified 15 critical gaps organized into 4 phases.

### Quick Reference

**Phase 1: Core Operations (✅ COMPLETE!)**
- Task 025: Advanced Search (2.5h) ✅
- Tasks 026-030: Unified Metadata Editor (6-8h) ✅
  - Label Management
  - Edit Artifact/Version/Group Metadata
  - Tree view enhancements

**Phase 2: Advanced Features (10-15h remaining, 8h completed)**
- ✅ Task 031: Rules Configuration (6h actual) - **COMPLETE!**
- ✅ Task 032: Group Management (2h actual) - **COMPLETE!**
- 📋 Task 033: Branching Support (8-10h)
- 📋 Enhanced Tree View (2-5h)

**Phase 3: Admin & Utility (12-20h)**
- Import/Export (4-6h)
- Role Management (4-6h)
- Settings/Configuration (6-8h)

**Phase 4: Visual Editor Integration (DEFERRED - TBD, pending external repository)**
- **NEW APPROACH:** Visual editor is being developed in separate repository by teammate
- Repository: https://github.com/Apicurio/apicurio-openapi-editor
- Integration work: Package integration + VSCode webview hosting (effort TBD once repo is available)
- **Note:** Original plan to build React editor from scratch (200-280h) is SUPERSEDED

---

## Recent Completion: Task 032 - Group Management (2025-11-07)

**Duration:** 2 hours (estimated 2-3h) - **Matched estimate!** ✅
**Status:** ✅ **COMPLETE** - All 5 phases delivered, 15/15 tests passing
**Completed:** 2025-11-07
**Reference:** [docs/tasks/completed/high-priority/032-group-management.md](tasks/completed/high-priority/032-group-management.md)

**Goal:** Complete group management functionality for Apicurio Registry, enabling users to create new groups and manage existing groups through the VSCode extension.

**What Was Delivered:**

**Phase 1: Registry Service Extension**
- createGroup() method with full metadata support (description, labels)
- POST /admin/groups API integration
- Handle 409 Conflict for duplicate group IDs
- +31 lines in registryService.ts
- 3 comprehensive service tests

**Phase 2: Create Group Wizard (4-step flow)**
- Step 1: Group ID with validation (alphanumeric + dots/dashes/underscores, max 512 chars)
- Step 2: Optional description
- Step 3: Optional labels (reused pattern from Task 026-030 metadata editor)
- Step 4: Confirmation with summary
- Error handling: 409 Conflict, validation failures
- 8 comprehensive command tests (happy path, minimal, cancellations, errors)

**Phase 3: Delete Group Command Enhancement**
- Safety warnings with artifact count display
- Modal confirmation dialogs
- Different messages for empty vs. populated groups
- Cascade delete warning (group deletion includes all artifacts)
- Handle 404 Not Found gracefully
- 4 comprehensive tests (empty/populated groups, cancellation, 404)

**Phase 4: Command Registration**
- Registered createGroup and deleteGroup commands in extension.ts
- Added command definitions to package.json
- Added createGroup to toolbar (navigation@2)
- deleteGroup already in context menu from earlier work

**Phase 5: Test Verification**
- All 15 tests passing (3 service + 12 command)
- TypeScript compilation clean
- No new linting warnings

**Files Changed:**
- New: `src/commands/groupCommands.ts` (283 lines)
- New: `src/commands/__tests__/groupCommands.test.ts` (289 lines)
- New: `src/services/__tests__/registryService.groups.test.ts` (134 lines)
- Modified: `src/services/registryService.ts` (+31 lines)
- Modified: `src/extension.ts` (+11 lines)
- Modified: `package.json` (+13 lines)
- **Total:** 3 new files, 3 modified, ~750 lines

**Test Coverage:**
- ✅ 3 service tests: full metadata, minimal data, 409 error
- ✅ 8 create command tests: happy path, minimal, cancellations (4 steps), duplicate ID, validation
- ✅ 4 delete command tests: empty group, populated group, cancellation, 404 error
- ✅ **Total: 15/15 tests passing** (100% coverage of new code)

**Key Lessons Learned:**

1. **Mock Setup Pattern for Axios Tests**
   - Issue: "Not connected to registry" errors in tests
   - Solution: Use mockClient pattern from registryService.rules.test.ts
   - Pattern: `mockedAxios.create = jest.fn().mockReturnValue(mockClient)`

2. **TypeScript Type Consistency**
   - Issue: createdOn/modifiedOn type mismatch (string vs number)
   - Solution: Use `Date.now()` for timestamps, not ISO strings
   - Lesson: Data models are source of truth for types

3. **Wizard Pattern Reuse**
   - Success: Label collection from Task 026-030 worked perfectly
   - Benefit: Accelerated development with proven UX patterns
   - Action: Document reusable patterns for future tasks

4. **Test Message Grammar**
   - Issue: "5 artifact" vs. "5 artifacts"
   - Solution: Verify correct pluralization in all user messages
   - Lesson: Test exact user-facing text, including grammar

5. **Check Existing Registrations**
   - Discovery: deleteGroup was already registered from earlier work
   - Context: Task 032 enhanced the implementation (artifact count warning)
   - Lesson: Use `git log` and `git diff main` to understand existing code

**Impact:**
- ✅ Group CRUD operations now 100% complete (Create, Read, Update, Delete, Rules)
- ✅ Phase 2 progress: 38% complete (3 of 8 tasks)
- ✅ Command layer matches Web UI feature parity for groups
- ✅ Established groupCommands.ts pattern (separate file for entity operations)
- ✅ Consistent wizard patterns for create operations
- ✅ Consistent safety patterns for delete operations

**Next Task:** Task 033 - Branching Support (8-10h) - HIGH value feature for version management

---

## Recent Completion: Task 031 - Rules Configuration (2025-11-06)

**Duration:** 6 hours (estimated 6-8h) - **On target!** ✅
**Status:** ✅ **COMPLETE** - All 6 phases delivered, 30/30 tests passing
**Completed:** 2025-11-07
**Reference:** [docs/tasks/completed/031-rules-configuration.md](tasks/completed/031-rules-configuration.md)

**Goal:** Implement comprehensive rules management for Apicurio Registry at three levels (Global, Group, Artifact) with full create/update/delete/configure capabilities.

**What Was Delivered:**

**Phase 1: Registry Service Extensions (15 methods)**
- Global Rules: getGlobalRules, getGlobalRule, createGlobalRule, updateGlobalRule, deleteGlobalRule
- Group Rules: getGroupRules, getGroupRule, createGroupRule, updateGroupRule, deleteGroupRule
- Artifact Rules: getArtifactRules, getArtifactRule, createArtifactRule, updateArtifactRule, deleteArtifactRule
- Full CRUD operations with proper error handling and URL encoding
- +295 lines in registryService.ts

**Phase 2: Rules Management Command (QuickPick workflow)**
- Enable/Configure/Disable workflow for all 3 rule types (VALIDITY, COMPATIBILITY, INTEGRITY)
- Rule-specific configuration options (7 COMPATIBILITY modes, 2 VALIDITY modes, 3 INTEGRITY modes)
- User cancellation handling at all steps
- +326 lines in rulesCommand.ts

**Phase 3: Tree View Enhancements**
- Async rule fetching with Promise.all for performance
- Rule counts in tooltips: "Rules: 2 configured"
- Rule details: "• Validity: FULL, • Compatibility: BACKWARD"
- Description badges: "(2 rules)"
- +112 lines in registryTreeProvider.ts

**Phase 4: Rule Violation Error Parsing**
- Smart error detection from API 409/400 responses
- Extracts rule type (VALIDITY, COMPATIBILITY, INTEGRITY)
- Parses violation details and causes
- Generates rule-specific suggestions
- User-friendly modal dialogs with "View Rules" action
- Integrated into createArtifactCommand and draftCommands
- +234 lines in ruleErrorParser.ts

**Phase 5: Command Registration**
- 3 commands: manageGlobalRules, manageGroupRules, manageArtifactRules
- Context menu integration (group "6_rules@1")
- Command Palette support with icons

**Phase 6: Test Coverage (30 tests passing ✅)**
- 15 service tests (5 global + 5 group + 5 artifact)
- 15 command tests (enable, configure, disable, cancellation, errors)
- All CRUD operations covered
- All config options validated

**Critical Lesson Learned - QuickPick Separator Bug:**
- **Issue:** Incorrect separator syntax broke QuickPick rendering (only showed some items)
- **Root Cause:** `{ label: vscode.QuickPickItemKind.Separator as any }` (WRONG)
- **Fix:** `{ label: '─────────────', kind: vscode.QuickPickItemKind.Separator }` (CORRECT)
- **Lesson:** QuickPickItem separators require BOTH `label` AND `kind` properties
- Documented in task completion summary for future reference

**Files Changed:** 4 new files, 7 modified, ~1,850 lines of code
- New: rulesCommand.ts (326), ruleErrorParser.ts (234), 2 test files (771)
- Modified: registryService.ts (+295), registryTreeProvider.ts (+112), models, extension, package.json, commands

**Impact:**
- ✅ Full feature parity with Web UI for rules management
- ✅ Better UX than Web UI (smart error handling with suggestions)
- ✅ Consistent QuickPick workflow across all rule levels
- ✅ Phase 2 progress: 0% → 25% (1 of 4 tasks complete)

---

## Previous Work: Integration Strategy

### COMPLETED: MCP Integration (2025-11-02 - 2025-11-03)

**Rationale:**
1. **Critical Bug Fix** - Current MCP configuration code doesn't work (tries VSCode settings, but Claude CLI uses ~/.claude.json)
2. **AI Features Blocked** - Cannot enable AI-powered schema development without working MCP connection
3. **User Value** - AI assistance is high-value feature for users
4. **Quick Win** - Phase 1 (Local Scenario) only 15-21 hours, can complete in 2-3 days

**Decision**: Pause Phase 3.1 and complete MCP Integration (Local Scenario) first

### Previous Decision: Complete UX Improvements Before Phase 3

**Rationale:**
1. **User Experience First** - CRUD operations are more critical than editors
2. **Reference Plugin Parity** - Need basic management features before advanced editing
3. **Natural Progression** - Context menus needed before editor integration
4. **User Feedback** - Better to get feedback on core workflows first

**Updated Timeline:**
```
✅ Phase 1 + 2 (Complete)
   ↓
✅ UX High Priority (Complete)
   ↓
🔥 MCP Integration - Local Scenario (CURRENT, 2-3 days)
   ↓
📋 Phase 3: Editors (Resume after MCP, 3-4 weeks)
   ↓
📋 UX Medium/Low Priority (Deferred)
   ↓
📋 Phase 4: Advanced Features (2-3 weeks)
```

---

## Detailed Roadmap

### ✅ Phase 1: Foundation (COMPLETED)

**Duration:** 2 weeks
**Status:** ✅ Complete

**Delivered:**
- VSCode extension scaffold with TypeScript and Webpack
- RegistryService with Axios for REST API v3
- Authentication support (Basic Auth & OIDC)
- Basic TreeDataProvider
- Connection management
- Extension manifest configuration

**Key Files:**
- `src/extension.ts`
- `src/services/registryService.ts`
- `src/models/registryModels.ts`
- `package.json`

---

### ✅ Phase 2: Core Tree Functionality (COMPLETED)

**Duration:** 3 weeks
**Status:** ✅ Complete

**Delivered:**
- Full hierarchy (Groups → Artifacts → Versions)
- Custom icons for 9 artifact types via IconService
- State indicators (ENABLED, DISABLED, DEPRECATED, DRAFT)
- Rich tooltips with markdown and metadata
- Multi-registry connection support
- Initial search capability
- Comprehensive unit tests

**Key Files:**
- `src/providers/registryTreeProvider.ts`
- `src/services/iconService.ts`
- Test files with Jest

---

### 🚧 UX Improvements (IN PROGRESS)

**Duration:** 2-4 weeks
**Status:** 🚧 40% Complete (4/10 tasks)
**Current Sprint:** Sprint 2 (Oct 25-31) - ✅ COMPLETE

Based on [UX_COMPARISON.md](UX_COMPARISON.md) analysis of reference plugin.

#### ✅ Completed (4 tasks, 18.5 hours)

| ID | Task | Effort | Completed | Details |
|----|------|--------|-----------|---------|
| 001 | Search Command | 4h | 2025-10-23 | [spec](tasks/completed/001-search-command.md) |
| 002 | Create Artifact Wizard | 4h | 2025-10-24 | [spec](tasks/completed/002-create-artifact.md) |
| 003 | Context Menus (Copy + Open) | 6h | 2025-10-28 | [spec](tasks/completed/003-context-menus.md) |
| 007 | Delete Operations | 3.5h | 2025-10-28 | [spec](tasks/completed/007-delete-operations.md) |

#### 🔴 High Priority

**All high priority tasks complete!** ✅

#### 🟡 Medium Priority (3 tasks remaining)

| ID | Task | Effort | Status | Sprint | Details |
|----|------|--------|--------|--------|---------|
| 008 | API v3.1 Compatibility | 2-3h | 📋 Todo | Sprint 3 | [spec](tasks/todo/medium-priority/008-api-v31-compatibility.md) |
| 006 | User Preferences | 2-3h | 📋 Todo | Sprint 3 | [spec](tasks/todo/medium-priority/006-user-preferences.md) |
| 005 | Custom SVG Icons | 2-3h | 📋 Todo | Sprint 3 | [spec](tasks/todo/medium-priority/005-custom-svg-icons.md) |

**Sprint 2 Results (Oct 25-31):** ✅ COMPLETE
- Context Menus (6h) ✅
- Delete Operations (3.5h) ✅
- State & Download Commands (2.5h) ✅
- **Total:** 12 hours (9.5h planned sprint work + 2.5h Task 003b)

**Sprint 3 Focus (Nov 1-7):** Polish and preferences
- API v3.1 Compatibility (2-3h)
- User Preferences (2-3h)
- Custom SVG Icons (2-3h)
- **Total:** 6-9 hours

#### 🟢 Low Priority (3 tasks - Deferred)

| ID | Task | Effort | Status | Phase | Details |
|----|------|--------|--------|-------|---------|
| 010 | Edit Metadata UI | 4-5h | ⏸️ Deferred | Phase 3 | [spec](tasks/todo/low-priority/010-edit-metadata.md) |
| 008 | Details Panel | 6-8h | ⏸️ Deferred | Phase 3 | [spec](tasks/todo/low-priority/008-details-panel.md) |
| 009 | Reverse Version Order | 1-2h | ⏸️ Deferred | Covered by 006 | [spec](tasks/todo/low-priority/009-reverse-version-order.md) |

**Rationale for Deferral:**
- **010** - Metadata editable during creation; better with webview in Phase 3
- **008** - Current tooltips sufficient; optional enhancement for Phase 3
- **009** - Will be implemented as user preference (task 006)

#### UX Improvements Summary

**Total Tasks:** 10
- **Completed:** 4 (40%)
- **High Priority:** All complete! ✅
- **Medium Priority:** 3 remaining
- **Low Priority:** 3 deferred

**Estimated Remaining Effort:** 6-9 hours (1 week - Sprint 3)

---

### ✅ MCP Integration - Local Scenario (COMPLETE & WORKING!)

**Duration:** 2-3 days (15-21 hours) + JAR mode (6 hours) = **21-27 hours total**
**Status:** ✅ **100% Complete (5/5 tasks)** - ✅ **FULLY WORKING with JAR Mode!** 🎉
**Started:** 2025-11-02
**Completed:** 2025-11-20 (JAR mode implementation)
**Reference:**
- [JAR_CONFIGURATION_GUIDE.md](ai-integration/JAR_CONFIGURATION_GUIDE.md) - **⭐ RECOMMENDED SETUP**
- [GETTING_STARTED.md](ai-integration/GETTING_STARTED.md)
- [CLAUDE_CODE_MCP_WORKING_CONFIG.md](ai-integration/CLAUDE_CODE_MCP_WORKING_CONFIG.md)
- [REAL_USER_WORKFLOW.md](ai-integration/REAL_USER_WORKFLOW.md)

**Goal:** Enable local developers to use Claude Code AI features with Apicurio Registry

**Implementation Status:**
- ✅ Fixed MCP configuration approach (CLI commands instead of VSCode settings)
- ✅ Interactive setup wizard for seamless user experience
- ✅ Standalone utility commands for quick access
- ✅ **JAR mode implementation (2025-11-20)** - Bypasses stdio bug
- ✅ Java 17+ detection and validation
- ✅ Automatic Java path configuration
- ✅ All 56+ tests passing
- ✅ **AI features fully functional!** 🎉

**Solution:**
- ✅ **JAR Mode**: MCP server runs as native Java process (no Docker/Podman needed)
- ✅ Bypasses MCP SDK stdio transport bug entirely
- ✅ Better performance than container mode
- ✅ Full Claude Code integration working perfectly

#### ✅ Completed (5 tasks, ~25 hours)

| ID | Task | Effort | Completed | Details |
|----|------|--------|-----------|---------|
| MCP-1 | Fix MCPConfigurationManager | 4-6h | 2025-11-02 | Generate CLI commands instead of VSCode settings |
| MCP-2 | Enhance MCPServerManager | 3-4h | 2025-11-03 | Support stdio transport mode for Claude Code |
| MCP-3 | Create Setup Wizard | 6-8h | 2025-11-03 | Interactive wizard for local scenario setup |
| MCP-4 | Update Commands | 2-3h | 2025-11-03 | Add generateClaudeCommand, verifyMCP standalone commands |
| MCP-5 | JAR Mode Implementation | 6h | 2025-11-20 | Java 17+ detection, automatic path config, bypass stdio bug |

**MCP-1 Delivered:**
- `generateClaudeMCPCommand()` - Generates correct `claude mcp add` command
- `convertToContainerUrl()` - Converts localhost → host.containers.internal for Docker
- `normalizeRegistryUrl()` - **FIXED**: Now REMOVES `/apis/registry/v3` path (MCP server adds it automatically)
- `verifyMCPConfiguration()` - Validates Claude CLI installation and config
- Refactored `configureClaudeCode()` - Copy & Run workflow
- Updated `showManualSetupInstructions()` - CLI approach
- Updated `removeMCPServerConfig()` - CLI removal command
- **23 comprehensive tests** - All passing ✅ (updated to verify URL fix)
- Complete documentation set (5 new docs, 3,195+ lines)
- **Bug Fix**: Resolved URL duplication issue (404 errors) - See MCP_404_BUG_FIX.md

**MCP-2 Delivered:**
- Added `managementMode` to MCPServerConfig ('extension' | 'claude-code')
- Added `ManagementMode` type and updated ServerInfo interface
- Implemented claude-code mode - verifies via Claude CLI instead of starting server
- Split `checkHealth()` into `checkHTTPHealth()` and `checkClaudeMCPHealth()`
- Added `verifyClaudeMCPConfiguration()` - startup verification for claude-code mode
- No health monitoring in claude-code mode (Claude manages server lifecycle)
- Stop is no-op in claude-code mode (extension doesn't control server)
- **16 comprehensive tests** - All passing ✅

**MCP-3 Delivered:**
- Interactive 7-step setup wizard for AI features configuration
- Prerequisite checks: Claude CLI, Docker/Podman, Registry connection
- Scenario detection: Auto-detects local vs remote (remote shows "coming soon")
- Command generation: Generates correct `claude mcp add` command
- Clipboard integration: Auto-copies command for easy pasting
- User guidance: Step-by-step instructions with terminal integration
- Verification: Validates MCP configuration after user runs command
- Success/failure messaging: Clear feedback for both scenarios
- Registered `setupMCP` command with sparkle icon in Command Palette
- **7 core tests passing** - wizard flow, prerequisite checks, command generation

**MCP-4 Delivered:**
- Created `mcpUtilityCommands.ts` with two standalone commands
- `generateClaudeCommandCommand()` - Quick command generation without full wizard
- `verifyMCPCommand()` - Check MCP configuration status
- Registered both commands in package.json under "Apicurio MCP" category
- Wired commands to MCPConfigurationManager in extension.ts
- **10 comprehensive tests** - All passing ✅
- TypeScript compilation successful (602 KiB)

**Success Criteria (What Works - JAR Mode):**
- ✅ User runs "Setup AI Features" command
- ✅ Wizard detects Java 17+ and offers JAR mode
- ✅ Automatic Java path detection and validation
- ✅ MCP server runs as native Java process
- ✅ **Claude Code AI features fully functional** 🎉
- ✅ All 17+ MCP tools working perfectly
- ✅ All 56+ tests passing
- ✅ No Docker/Podman required
- ✅ Better performance than container mode

**JAR Mode Benefits:**
- ✅ Bypasses MCP SDK stdio transport bug
- ✅ No container overhead
- ✅ Easier debugging (native Java process)
- ✅ Faster startup time
- ✅ Direct access to Java debugging tools

**Docker/Podman Mode:**
- ⚠️ May still have stdio transport issues (MCP SDK bug)
- ✅ HTTP transport works fine as alternative
- 💡 Recommendation: Use JAR mode for best experience

**Key Files:**
- `src/services/mcpConfigurationManager.ts` (refactored)
- `src/services/mcpServerManager.ts` (to be enhanced)
- `src/commands/setupMCPCommand.ts` (to be created)
- `docs/ai-integration/MCP_ARCHITECTURE_VALIDATION.md` (comprehensive plan)

---

### 🚧 Phase 3: Editor Integration (IN PROGRESS - Phase 3.1 Complete!)

**Duration:** 3-4 weeks
**Status:** 🚧 In Progress at 50% (7/14 tasks) - **Phase 3.1 Complete!** ✅
**Prerequisites:** Complete UX Improvements (tasks 003-007) ✅
**Started:** Early November 2025

#### Objectives

Enable inline editing of artifacts directly in VSCode with:
1. Custom text editors for OpenAPI/AsyncAPI/Avro/Protobuf
2. Webview-based visual editors (Apicurio Studio integration)
3. Bidirectional content synchronization with registry
4. Draft system and conflict resolution

#### Tasks Breakdown

##### 3.1: Custom Text Editor (Week 1-2)

**Tasks:**
- Implement Custom Text Editor Provider for API specifications
- Add syntax highlighting (leverage VSCode's JSON/YAML support)
- Integrate live validation based on artifact type
- Add auto-completion for common patterns
- Implement save-to-registry workflow
- Handle version management (create new version on save)

**API Integration:**
```typescript
// Get artifact content
GET /groups/{groupId}/artifacts/{artifactId}/versions/{version}

// Update content (creates new version)
POST /groups/{groupId}/artifacts/{artifactId}/versions
```

**Key Features:**
- Open artifact from tree → edit in custom editor
- Real-time validation (OpenAPI schema, Avro schema, etc.)
- Save creates new version automatically
- Diff view between versions
- Read-only mode for older versions

**Deliverables:**
- Custom Text Editor Provider implementation
- Editor registration in package.json
- Content synchronization service
- Version management UI

##### 3.2: Visual Editor Integration - **NEW APPROACH (2025-11-XX)**

**🔄 Strategic Change:** Visual editor is being developed in separate repository by teammate.

**Original Plan (SUPERSEDED):**
- ❌ Build React-based visual editor from scratch (200-260h)
- ❌ Extract to @apicurio/react-editors monorepo later
- See archived spec: [018-021-react-visual-editor.md](tasks/planned/018-021-react-visual-editor.md)

**New Approach:**
- ✅ **External Repository:** https://github.com/Apicurio/apicurio-openapi-editor
- ✅ **Developed by:** Teammate (separate from this VSCode extension work)
- ✅ **VSCode Integration Work:** Package integration + webview hosting (effort TBD)

**Integration Tasks (To Be Defined):**
Once the external repository is available, we'll need to:
1. Analyze the package structure and API
2. Determine integration approach (npm package, iframe, webview, etc.)
3. Create VSCode webview host for the editor
4. Implement message passing between extension and editor
5. Integrate with existing save/conflict detection infrastructure (Tasks 015-017)
6. Test and polish the integration

**Estimated Effort:** TBD (pending repository availability and architecture analysis)

**Dependencies:**
- External: apicurio-openapi-editor repository must be created and have initial release
- Internal: Tasks 015-017 (Text editor infrastructure) - ✅ COMPLETE

**Status:** ⏸️ **BLOCKED** - Waiting for external repository to be created
- Repository URL returns 404 (not yet created or incorrect URL)
- Will update integration plan once repository is accessible

**Reference Documentation:**
- Original (superseded) plan: [018-021-react-visual-editor.md](tasks/planned/018-021-react-visual-editor.md)

##### 3.3: Content Synchronization (Week 3-4)

**Tasks:**
- Implement real-time sync with registry
- Handle concurrent editing scenarios
- Add conflict resolution interface
- Support draft and published version workflows
- Add change tracking and history

**Features:**
- Auto-save to drafts
- Manual publish to create version
- Conflict detection when multiple users edit
- Visual diff for conflict resolution
- Version history browser

**Deliverables:**
- Synchronization service
- Conflict resolution UI
- Draft/publish workflow
- Change tracking

#### Phase 3 Integration with UX Improvements

**Dependencies:**
- **Task 003** (Context Menus) - "Open" and "Edit" actions
- **Task 004** (Add Version) - Version creation workflow
- **Task 010** (Edit Metadata) - Can be enhanced with webview

**Synergies:**
- Context menu "Open" → launches custom editor
- Custom editor "Save" → uses Add Version workflow
- Edit Metadata can use same webview patterns

#### Phase 3 Success Criteria

- [ ] Can open artifacts in custom text editor from tree
- [ ] Text editor has syntax highlighting and validation
- [ ] Can save changes to create new version
- [ ] Visual editor loads Apicurio Studio
- [ ] Can toggle between text and visual modes
- [ ] Changes sync bidirectionally
- [ ] Conflict resolution works
- [ ] Draft system functional

---

### 📋 Phase 4: Advanced Features (FUTURE)

**Duration:** 2-3 weeks
**Status:** 📋 Planned
**Prerequisites:** Phase 3 complete
**Target Start:** Late November 2025

#### 4.1: File System Integration (Week 1)

**Tasks:**
- Support opening local files in registry editors
- Implement "push to registry" functionality
- Add "pull from registry" capabilities
- Create workspace synchronization features
- Bulk import/export operations

**Features:**
- Open local .yaml/.json → push to registry
- Right-click registry item → download to workspace
- Sync workspace folder with registry group
- Watch local files → auto-push on save

#### 4.2: Developer Experience Enhancement (Week 2)

**Tasks:**
- Add IntelliSense for API specifications
- Implement code generation from schemas
- Create validation and testing tools
- Add documentation preview capabilities
- Snippets and templates

**Features:**
- Auto-complete for OpenAPI paths, operations
- Generate client code from OpenAPI
- Mock server generation
- API documentation preview
- Schema validation reports

#### 4.3: Collaboration Features (Week 3)

**Tasks:**
- Real-time collaboration indicators
- Change tracking and history
- Comment and review capabilities
- Team workspace management
- Activity feed

**Features:**
- See who's editing what
- Leave comments on artifacts
- Review workflow (approve/reject)
- Team activity timeline
- Notifications for changes

#### Phase 4 Deliverables

- File system integration
- Enhanced developer tools
- Collaboration features
- Complete VSCode integration
- Marketplace-ready extension

---

## Sprint Planning

### Sprint 1 (Oct 23-24) - ✅ COMPLETED

**Goal:** Kickstart UX improvements with high-value features

**Completed:**
- ✅ Task 001: Search Command (4h)
- ✅ Task 002: Create Artifact Wizard (4h)

**Results:**
- Total effort: 8 hours
- Velocity: 8 hours/sprint
- Both features implemented with full specs
- Manual testing completed

---

### Sprint 2 (Oct 25-31) - ✅ COMPLETED

**Goal:** Complete high-priority CRUD operations

**Completed Tasks:**
- ✅ Task 003: Context Menus (Copy + Open) - 6h
- ✅ Task 003b: State & Download Commands - 2.5h
- ✅ Task 007: Delete Operations - 3.5h

**Total Effort:** 12 hours (exceeded planned 9.5h by 2.5h due to Task 003b)

**Success Criteria:** ✅ ALL MET
- ✅ All high-priority tasks complete
- ✅ Context menus working for all node types
- ✅ Can delete groups, artifacts, and versions with safety confirmations
- ✅ Can change artifact/version state
- ✅ Can download content for all artifact types
- ✅ All operations tested manually

**Deliverables:**
- ✅ Context menu implementation (9 commands)
- ✅ Delete commands with modal confirmations
- ✅ Last-version protection
- ✅ State change commands
- ✅ Download content with auto-extension detection
- ✅ 60 unit tests passing (27 copy/open + 28 state/download + 16 delete service + 16 delete command)
- ✅ Updated documentation
- ✅ Fixed 2 API v3.1 bugs ("latest" version, content endpoint)

**Notable Achievements:**
- Full TDD methodology (RED-GREEN-REFACTOR)
- Comprehensive safety features for delete operations
- Smart language detection for opened artifacts
- Artifact count/version count shown in confirmations

---

### Sprint 3 (Nov 1-7) - 📋 PLANNED

**Goal:** Polish and user preferences

**Planned Tasks:**
- [ ] Task 008: API v3.1 Compatibility (2-3h)
- [ ] Task 006: User Preferences (2-3h)
- [ ] Task 005: Custom SVG Icons (2-3h)

**Total Effort:** 6-9 hours

**Success Criteria:**
- API v3.1 compatibility verified and documented
- User preferences configurable
- Custom SVG icons integrated
- All medium-priority tasks complete
- UX improvements phase complete (40% → 70%)

**Deliverables:**
- API v3.1 compatibility fixes
- Settings schema
- SVG icon files
- Configuration listeners
- Final UX polish

---

### Sprint 4+ (Nov 8+) - 📋 PLANNED

**Goal:** Begin Phase 3 (Editor Integration)

**Planned Tasks:**
- [ ] Custom Text Editor POC
- [ ] Editor provider implementation
- [ ] Syntax highlighting
- [ ] Basic save workflow

**Milestone:** Phase 3 kickoff

---

## Reference Plugin Parity Matrix

Comparison with reference plugin features:

| Feature | Reference Plugin | Our Implementation | Status | Task |
|---------|-----------------|-------------------|--------|------|
| **Tree View** | 3-panel design | Single hierarchy | ✅ Better | Phase 2 |
| **Icons** | Custom SVG | ThemeIcon | 🟡 Pending | Task 005 |
| **Tooltips** | Simple text | Rich Markdown | ✅ Better | Phase 2 |
| **Connection** | Settings only | UI-driven | ✅ Better | Phase 1 |
| **Authentication** | None | Basic + OIDC | ✅ Better | Phase 1 |
| **Search** | Multi-criteria | Multi-criteria | ✅ Done | Task 001 |
| **Create Artifact** | Wizard | Wizard | ✅ Done | Task 002 |
| **Context Menus** | Full | Copy/Open/State/Download | ✅ Done | Task 003 |
| **Delete** | With confirm | Modal confirmations + safety | ✅ Done | Task 007 |
| **Change State** | Basic | ENABLED/DISABLED/DEPRECATED | ✅ Done | Task 003b |
| **Download Content** | Basic | Auto-extension detection | ✅ Done | Task 003b |
| **Edit Metadata** | Dedicated UI | - | ⏸️ Deferred | Task 010 |
| **User Prefs** | 8 settings | - | 📋 Planned | Task 006 |
| **Open/Preview** | Swagger view | VSCode editor | ✅ Done | Task 003 |
| **Visual Editor** | None | - | 📋 Phase 3 | - |

**Legend:**
- ✅ **Better** - Our implementation superior
- ✅ **Done** - Feature parity achieved
- 🟡 **Pending** - Planned, in TODO
- 📋 **Planned** - In roadmap
- ⏸️ **Deferred** - Lower priority

---

## Milestone Tracking

### M1: Foundation Complete ✅
**Date:** Oct 15, 2025
**Deliverables:**
- Extension scaffold
- Registry service with REST API
- Authentication
- Basic tree view

### M2: Core Tree Complete ✅
**Date:** Oct 22, 2025
**Deliverables:**
- Full hierarchy navigation
- Icons and state indicators
- Rich tooltips
- Multi-registry support

### M3: UX Improvements High Priority ✅
**Target:** Oct 31, 2025 (Achieved: Oct 28, 2025 - 3 days early!)
**Deliverables:**
- Search command ✅
- Create artifact ✅
- Context menus (Copy + Open) ✅
- State & Download commands ✅
- Delete operations ✅

### M4: UX Improvements Complete 📋
**Target:** Nov 7, 2025
**Deliverables:**
- All high + medium priority tasks
- User preferences
- Custom icons
- Reference plugin parity (core features)

### M5: Editors Beta 📋
**Target:** Nov 30, 2025
**Deliverables:**
- Custom text editor
- Basic save workflow
- Version management
- Visual editor POC

### M6: Full Release 📋
**Target:** Dec 15, 2025
**Deliverables:**
- Visual editor complete
- File system integration
- Developer tools
- Marketplace ready

---

## Success Metrics

### Functional Completeness

**Phase 1-2:** ✅ 100%
- ✅ Registry browsing
- ✅ Authentication
- ✅ Tree navigation
- ✅ Multi-registry support

**UX Improvements:** 🚧 40%
- ✅ Search (10%)
- ✅ Create Artifact (10%)
- ✅ Context Menus (10%)
- ✅ Delete Operations (10%)
- 📋 API Compatibility (0%)
- 📋 User Preferences (0%)
- 📋 Custom Icons (0%)

**Phase 3:** 📋 0%
- 📋 Text editor
- 📋 Visual editor
- 📋 Sync engine

**Phase 4:** 📋 0%
- 📋 File integration
- 📋 Dev tools
- 📋 Collaboration

### User Experience

**Current State:**
- Tree view: ⭐⭐⭐⭐⭐ Excellent
- Connection UX: ⭐⭐⭐⭐⭐ Excellent
- Error handling: ⭐⭐⭐⭐⭐ Excellent
- CRUD operations: ⭐⭐ Limited (search + create only)
- Editing: ⭐ None (Phase 3)

**Target State (After UX Improvements):**
- CRUD operations: ⭐⭐⭐⭐⭐
- Reference parity: ⭐⭐⭐⭐⭐
- Developer experience: ⭐⭐⭐⭐

**Target State (After Phase 3):**
- Editing capabilities: ⭐⭐⭐⭐⭐
- Visual editing: ⭐⭐⭐⭐⭐
- Overall experience: ⭐⭐⭐⭐⭐

---

## Risk Management

### Current Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Sprint 2 overruns | Medium | Low | Tasks well-specified, effort conservative |
| Context menu complexity | Medium | Medium | Reuse patterns from create/search |
| Phase 3 delayed | High | Low | UX improvements must complete first |

### Phase 3 Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Webview performance | High | Medium | Content streaming, lazy loading |
| Apicurio Studio integration | High | Medium | Proven iframe patterns exist |
| Sync complexity | High | High | Start with simple draft system |

---

## Resource Requirements

### Development Effort

**Completed:**
- Phase 1: 80 hours (2 weeks)
- Phase 2: 120 hours (3 weeks)
- UX Sprint 1: 8 hours (2 tasks)
- UX Sprint 2: 12 hours (3 tasks)

**Remaining:**
- UX Sprint 3: 6-9 hours (1 week)
- Phase 3.2: 200-260 hours (7 weeks) - **REVISED** (was 40-60h)
- Phase 3.3: 20-30 hours (1 week)
- Phase 4: 80-120 hours (2-3 weeks)

**Total Project:** ~646-749 hours (16-19 weeks) - **REVISED**
**Completed to Date:** 220 hours (30-34%) - **REVISED**

**Note:** Phase 3.2 scope increased significantly due to React rewrite requirement (CSP constraint blocks Angular iframe approach). Original estimate was 40-60h for iframe integration; React rewrite requires 200-260h.

### Testing Effort

- Unit tests: 20% of dev time
- Integration tests: 10% of dev time
- Manual testing: 10% of dev time
- Total testing: 40% overhead

---

## Communication Plan

### Weekly Updates

**Every Friday:**
- Sprint progress report
- Completed tasks summary
- Blockers and risks
- Next week plan

### Milestone Reviews

**After each milestone:**
- Demo of completed features
- UX review session
- Architecture review
- Plan adjustment

---

## Next Actions

### Immediate (This Week - Nov 5-11) - FEATURE PARITY PHASE 1

**🔥 Current Priority: Advanced Search (Task 025)**

1. **Start Task 025: Advanced Search** (2-3h)
   - Create task spec in `tasks/todo/high-priority/025-advanced-search.md`
   - Implement multi-field search UI
   - Add label filtering support
   - Support version and group search
   - Test with various criteria combinations
   - Update documentation

2. **Create Task Specs for Phase 1**
   - Task 026: Label Management (4-6h)
   - Task 027: Version Creation UI (3-4h)
   - Task 028: Edit Artifact Metadata (2-3h)
   - Task 029: Edit Version Metadata (2-3h)
   - Task 030: Edit Group Metadata (2-3h)

### Week 2 (Nov 12-18) - Continue Phase 1

1. **Task 026: Label Management** (4-6h)
   - Display labels in tree view tooltips
   - Add/edit/remove labels (key-value pairs)
   - Label validation
   - Click label to filter

2. **Task 027: Version Creation UI** (3-4h)
   - Multi-step wizard
   - Content upload (file/URL/text)
   - Content validation

### Week 3-4 (Nov 19 - Dec 2) - Complete Phase 1

1. **Tasks 028-030: Metadata Editing** (6-9h)
   - Edit artifact metadata
   - Edit version metadata
   - Edit group metadata
   - Inline editing UI

2. **Phase 1 Retrospective**
   - Review completed features
   - Update progress tracking
   - Plan Phase 2 kickoff

---

## Conclusion

This master plan now centers on **Feature Parity with Apicurio Registry Web UI** as the primary goal:

1. **Feature Parity Roadmap** - Primary planning document (NEW - 2025-11-05)
2. **Feature Gap Analysis** - Comprehensive Web UI comparison (NEW - 2025-11-05)
3. **Original plans preserved** - Historical context and completed work

**Key Decision (2025-11-05):** Defer Visual Editor to final phase. Focus on high-value core features first.

**Current Focus:** Phase 1 - Core Operations (Advanced Search, Labels, Version Creation)

**Success Path:**
```
Foundation ✅ → UX High ✅ → Draft/Text Editor ✅ → MCP ✅ (blocked) →
Phase 1 🔥 → Phase 2 → Phase 3 → Phase 4 (Visual Editor) → Release
```

**New Timeline:**
- Phase 1: 2-3 weeks (15-20h)
- Phase 2: 3-4 weeks (18-26h)
- Phase 3: 2-3 weeks (12-20h)
- Phase 4: 5-7 weeks (35-45h)
- **Total:** 12-17 weeks remaining

This refocused approach ensures:
- ✅ Faster delivery of high-value features
- ✅ Better ROI (core features = 45-66h, visual editor = 35-45h)
- ✅ Web UI feature parity achieved incrementally
- ✅ Visual editor built last when foundation is solid
- ✅ Alignment with user's strategic priorities

---

**Document Version:** 2.0
**Last Updated:** 2025-11-05
**Next Review:** 2025-11-12 (After Phase 1 Week 1)
**Owner:** Development Team

**Changelog:**
- **v2.0 (2025-11-05):** MAJOR REVISION - Feature Parity Roadmap adopted as primary plan
  - Visual Editor work deferred to Phase 4 (end)
  - Added Phase 1-3 from FEATURE_ROADMAP.md
  - Updated all sections to reflect new priorities
  - Created comprehensive Web UI gap analysis
- **v1.2 (2025-11-03):** Phase 3.2 revised - React rewrite approach (200-260h) due to CSP constraint
- **v1.1 (2025-10-28):** MCP integration complete, Phase 3.1 complete
- **v1.0 (2025-10-24):** Initial integrated master plan

**Related Documents:**
- **[FEATURE_ROADMAP.md](FEATURE_ROADMAP.md)** - PRIMARY roadmap (NEW - 2025-11-05)
- **[FEATURE_GAP_ANALYSIS.md](FEATURE_GAP_ANALYSIS.md)** - Web UI comparison (NEW - 2025-11-05)
- [TODO.md](TODO.md) - Current task tracking (updated daily)
- [VSCODE_PLUGIN_PLAN.md](VSCODE_PLUGIN_PLAN.md) - Original 4-phase plan (historical)
- [UX_COMPARISON.md](UX_COMPARISON.md) - Reference plugin analysis
- [tasks/](tasks/) - Detailed task specifications
