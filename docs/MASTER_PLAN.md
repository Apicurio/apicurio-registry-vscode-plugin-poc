# Apicurio VSCode Plugin - Master Implementation Plan

**Last Updated:** 2025-11-03
**Status:** MCP Integration Complete - Blocked by Claude Code Bug
**Next:** Resume Phase 3 (Editors) OR Complete UX Medium Priority

---

## Overview

This master plan integrates three planning documents into a unified roadmap:

1. **Original 4-Phase Plan** ([VSCODE_PLUGIN_PLAN.md](VSCODE_PLUGIN_PLAN.md)) - Core feature development
2. **UX Improvements** ([UX_COMPARISON.md](UX_COMPARISON.md)) - Reference plugin analysis findings
3. **Current TODO** ([TODO.md](TODO.md)) - Active task tracking

## Current Status Summary

| Area | Status | Progress | Next Step |
|------|--------|----------|-----------|
| **Phase 1** (Foundation) | ✅ Complete | 100% | - |
| **Phase 2** (Tree View) | ✅ Complete | 100% | - |
| **UX Improvements** | 🚧 In Progress | 40% (4/10) | Deferred |
| **🎉 MCP Integration** | ⚠️ **COMPLETE (Blocked)** | **100% (4/4)** | **Blocked by Claude Code bug** |
| **Phase 3** (Editors) | ⏸️ Paused | 43% (6/14) | Decision: Resume or UX tasks |
| **Phase 4** (Advanced) | 📋 Planned | 0% | Future |

---

## Integration Strategy

### NEW PRIORITY: MCP Integration (2025-11-02)

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

### 🎉 MCP Integration - Local Scenario (COMPLETE - BLOCKED)

**Duration:** 2-3 days (15-21 hours actual)
**Status:** ✅ **100% Implementation Complete (4/4 tasks)** - ⚠️ **Blocked by Claude Code Bug**
**Started:** 2025-11-02
**Completed:** 2025-11-03
**Reference:**
- [MCP_ARCHITECTURE_VALIDATION.md](ai-integration/MCP_ARCHITECTURE_VALIDATION.md)
- [CLAUDE_CODE_BUG_REPORT.md](ai-integration/CLAUDE_CODE_BUG_REPORT.md)
- [GITHUB_ISSUE_TEMPLATE.md](ai-integration/GITHUB_ISSUE_TEMPLATE.md)

**Goal:** Enable local developers to use Claude Code AI features with Apicurio Registry

**Implementation Status:**
- ✅ Fixed MCP configuration approach (CLI commands instead of VSCode settings)
- ✅ Interactive setup wizard for seamless user experience
- ✅ Standalone utility commands for quick access
- ✅ All 56 tests passing (23 + 16 + 7 + 10)
- ✅ MCP server successfully receives requests and returns data

**Blocking Issue:**
- ⚠️ **Claude Code v2.0.31 Bug**: stdio connections drop after ~20 seconds during tool execution
- ❌ Users cannot use AI features (Claude Code never receives MCP responses)
- 📋 GitHub issue created with complete documentation
- 🔍 Root cause: stdio pipe closes prematurely while tool is executing

#### ✅ Completed (4 tasks, ~19 hours)

| ID | Task | Effort | Completed | Details |
|----|------|--------|-----------|---------|
| MCP-1 | Fix MCPConfigurationManager | 4-6h | 2025-11-02 | Generate CLI commands instead of VSCode settings |
| MCP-2 | Enhance MCPServerManager | 3-4h | 2025-11-03 | Support stdio transport mode for Claude Code |
| MCP-3 | Create Setup Wizard | 6-8h | 2025-11-03 | Interactive wizard for local scenario setup |
| MCP-4 | Update Commands | 2-3h | 2025-11-03 | Add generateClaudeCommand, verifyMCP standalone commands |

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

**Success Criteria (What Works):**
- ✅ User runs "Setup AI Features" command
- ✅ Wizard generates correct `claude mcp add` command
- ✅ User copies/pastes command in terminal
- ✅ Claude Code successfully connects to MCP server
- ✅ MCP server receives requests and returns valid responses
- ✅ All 56 tests passing

**What Doesn't Work (Blocked by Claude Code Bug):**
- ❌ AI features hang with "Enchanting..." status
- ❌ stdio connection drops after ~20 seconds
- ❌ Claude Code never receives MCP server responses
- ❌ End-to-end AI workflow blocked

**When Fixed:**
Once Anthropic fixes the stdio connection bug in Claude Code, AI features will work immediately with **no changes needed** to our extension.

**Key Files:**
- `src/services/mcpConfigurationManager.ts` (refactored)
- `src/services/mcpServerManager.ts` (to be enhanced)
- `src/commands/setupMCPCommand.ts` (to be created)
- `docs/ai-integration/MCP_ARCHITECTURE_VALIDATION.md` (comprehensive plan)

---

### 📋 Phase 3: Editor Integration (PAUSED - Resume after MCP)

**Duration:** 3-4 weeks
**Status:** ⏸️ Paused at 43% (6/14 tasks) - Resume after MCP Integration complete
**Prerequisites:** Complete UX Improvements (tasks 003-007) ✅
**Target Start:** Early November 2025

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

##### 3.2: Apicurio Studio Integration (Week 3-4)

**Tasks:**
- Create webview-based custom editor
- Embed Apicurio Studio editors via iframe
- Implement message passing between webview and extension
- Handle editor state synchronization
- Support visual editing mode toggle

**Architecture:**
```
VSCode Extension
    ↓ (loads webview)
Webview Container
    ↓ (embeds iframe)
Apicurio Studio Editor (Angular)
    ↓ (message passing)
VSCode Extension API
    ↓ (saves to registry)
Registry API
```

**Challenges:**
- Loading Apicurio Studio assets in webview
- Content Security Policy configuration
- Bidirectional message passing
- State synchronization between text and visual modes

**Deliverables:**
- Webview-based visual editor
- Apicurio Studio iframe integration
- Message passing protocol
- Mode switching (text ↔ visual)

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
- Phase 3: 120-160 hours (3-4 weeks)
- Phase 4: 80-120 hours (2-3 weeks)

**Total Project:** ~426-509 hours (11-13 weeks)
**Completed to Date:** 220 hours (43%)

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

### Immediate (This Week - Oct 28-31)

1. **Complete Sprint 2** ✅
   - ✅ Finish context menus
   - ✅ Add delete operations
   - ✅ Test all CRUD workflows
   - ✅ Update documentation

2. **Plan Sprint 3**
   - Review API v3.1 compatibility spec
   - Review user preferences spec
   - Prepare SVG icon migration
   - Final UX polish checklist

### Week 3 (Nov 1-7) - Sprint 3

1. **Complete UX Improvements**
   - Task 008: API v3.1 Compatibility (2-3h)
   - Task 006: User Preferences (2-3h)
   - Task 005: Custom SVG Icons (2-3h)
   - Comprehensive testing
   - Update all documentation

2. **UX Improvements Retrospective**
   - Review all completed features
   - Identify lessons learned
   - Document best practices
   - Prepare Phase 3 kickoff

### Week 4+ (Nov 8+)

1. **Prepare Phase 3**
   - Research Apicurio Studio architecture
   - Design editor integration
   - POC for custom text editor
   - Define sync strategy

---

## Conclusion

This master plan integrates three planning streams into a coherent roadmap:

1. **Original 4-phase plan provides structure** - Clear milestones and objectives
2. **UX improvements add critical features** - Learned from reference plugin
3. **Current TODO enables execution** - Detailed specs for immediate work

**Key Decision:** Complete UX improvements before Phase 3 to ensure solid foundation for editing features.

**Current Focus:** Sprint 3 - Polish and preferences

**Success Path:**
```
Sprint 1 ✅ → Sprint 2 ✅ → Sprint 3 🚧 → Phase 3 → Phase 4 → Release
```

This phased, sprint-based approach ensures:
- ✅ Incremental value delivery
- ✅ Risk management through iteration
- ✅ User feedback integration
- ✅ Reference plugin parity
- ✅ Superior architecture and UX

---

**Document Version:** 1.1
**Last Updated:** 2025-10-28
**Next Review:** 2025-11-07 (End of Sprint 3)
**Owner:** Development Team

**Related Documents:**
- [VSCODE_PLUGIN_PLAN.md](VSCODE_PLUGIN_PLAN.md) - Original 4-phase plan
- [UX_COMPARISON.md](UX_COMPARISON.md) - Reference plugin analysis
- [TODO.md](TODO.md) - Current task tracking
- [tasks/](tasks/) - Detailed task specifications
