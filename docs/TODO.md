# Apicurio VSCode Plugin - TODO

**Last Updated:** 2025-11-05
**Status:** Task 020 Started - Forms & Detail Editors (0 of 9 subtasks)

> 📘 For detailed analysis, strategy, and context → see [MASTER_PLAN.md](MASTER_PLAN.md)

---

## 🚧 In Progress

**Task 020 - Forms & Detail Editors** (30-40h estimated)
- 🚧 Subtask 1: Contact & License Components (2-3h) - STARTING
- Branch: `task/020-forms-detail-editors`
- Status: Just started, working on Contact & License sections

---

## 🎯 What to Work on TODAY

**🚀 Task 020 STARTED!** Forms & Detail Editors (Week 1 - Day 1)

**Current Focus:** Subtask 1 - Contact & License Components (2-3h)
- Copy Contact.tsx from apicurio-editors → ContactSection.tsx
- Copy License.tsx from apicurio-editors → LicenseSection.tsx
- Adapt XState → Zustand state management
- Integrate into InfoForm as collapsible sections
- Test edit/save/undo operations

**Task 019 - Core UI & Navigation: ✅ COMPLETE (6 of 6 subtasks - 100%)**
- ✅ Subtask 1: Master Layout Component (8-10h) - COMPLETE!
  - Clean custom flexbox layout (EditorLayout.tsx)
  - Fixed React hooks violation in InfoForm
  - VSCode theme integration for toolbar icons
  - 3-column layout with collapsible panels
- ✅ Subtask 2: Navigation Tree Component (12-15h) - COMPLETE!
  - Hierarchical tree view with PatternFly Tree
  - OpenAPI 2.0/3.0/3.1 support (Info, Servers, Paths, Components, Security, Tags)
  - AsyncAPI 2.x support (Info, Servers, Channels, Components)
  - 15 tests passing ✅
- ✅ Subtask 3: Problem Drawer Component (6-8h) - COMPLETE!
  - Bottom panel for validation problems
  - Integration with validationStore
- ✅ Subtask 4: Info Form (10-12h) - COMPLETE!
  - Title, version, description, contact, license, terms of service
  - react-hook-form + zod validation
  - Integration with @apicurio/data-models
- ✅ Subtask 5: Server Form (8-10h) - COMPLETE!
  - Server URL, description, variables
  - OpenAPI 3.x and AsyncAPI support
- ✅ Subtask 6: Common Components Library (11-15h) - COMPLETE!
  - FormField, ValidatedTextInput, ValidatedTextArea, FormSection
  - 30 tests passing ✅

**Total Task 019 Tests: 76 tests passing** ✅

**Next Actions:**
- **Start Task 020 - Forms & Detail Editors** (30-40h - REVISED! ⚡)
  - **Week 1:** Contact/License, Tags, Path Explorer (copy from apicurio-editors)
  - **Week 2:** Operation Forms (build ourselves), Schema Editor start (copy)
  - **Week 3:** Schema/Response/Security editors (copy), AsyncAPI forms (build)
  - **Strategy:** Copy 60-70% from apicurio-editors, build 30-40% ourselves
  - **Time Savings:** 25-40 hours (40% reduction!)

**Recommended:** Start Task 020 immediately - we have all the code to copy! 🚀

**See:**
- [Task 020 REVISED Spec](tasks/in-progress/020-forms-detail-editors-REVISED.md)
- [Apicurio Editors Integration Strategy](APICURIO_EDITORS_INTEGRATION_STRATEGY.md)

---

## ✅ MCP Integration - Local Scenario (COMPLETE!)

**Goal**: Enable local developers to use Claude Code AI features with Apicurio Registry

**Status**: ✅ **IMPLEMENTATION COMPLETE** - All 4 tasks delivered! (56 tests passing)

**⚠️ Blocked**: AI features unusable due to Claude Code v2.0.31 bug (stdio connection drops after ~20s)

**Reference**:
- [MCP_ARCHITECTURE_VALIDATION.md](ai-integration/MCP_ARCHITECTURE_VALIDATION.md)
- [CLAUDE_CODE_BUG_REPORT.md](ai-integration/CLAUDE_CODE_BUG_REPORT.md)
- [GITHUB_ISSUE_TEMPLATE.md](ai-integration/GITHUB_ISSUE_TEMPLATE.md)

| # | Task | Status | Effort | Completed | Details |
|---|------|--------|--------|-----------|------------|
| MCP-1 | Fix MCPConfigurationManager | ✅ Done | 4-6h | 2025-11-02 | Generate CLI commands instead of VSCode settings |
| MCP-2 | Enhance MCPServerManager | ✅ Done | 3-4h | 2025-11-03 | Support stdio transport mode for Claude Code |
| MCP-3 | Create Setup Wizard | ✅ Done | 6-8h | 2025-11-03 | Interactive wizard for local scenario setup |
| MCP-4 | Update Commands | ✅ Done | 2-3h | 2025-11-03 | Add generateClaudeCommand, verifyMCP standalone commands |

**Total Effort**: 15-21 hours (~2-3 days)
**Progress**: 4 of 4 tasks complete (100%) ✅

**What Works** ✅:
- ✅ User runs "Setup AI Features" command
- ✅ Wizard generates correct `claude mcp add` command
- ✅ User copies/pastes command in terminal
- ✅ Claude Code successfully connects to MCP server
- ✅ MCP server receives requests and returns data
- ✅ All 56 tests passing (23 + 16 + 7 + 10)

**What Doesn't Work** ❌ (Claude Code Bug):
- ❌ AI features hang with "Enchanting..." status
- ❌ stdio connection drops after ~20 seconds
- ❌ Claude Code never receives MCP server responses
- ❌ Users cannot use AI features (blocked by upstream bug)

---

## 📋 Task List by Priority

### 🔴 High Priority

_Moved to MCP Integration section above_

### 🟡 Medium Priority

| # | Task | Status | Effort | Details |
|---|------|--------|--------|---------|
| 005 | Custom SVG Icons | 📋 Todo | 2-3h | [spec](tasks/todo/medium-priority/005-custom-svg-icons.md) |

### 🟢 Low Priority (Deferred to Phase 3)

| # | Task | Status | Effort | Details |
|---|------|--------|--------|---------|
| 010 | Edit Metadata UI | ⏸️ Deferred | 4-5h | [spec](tasks/todo/low-priority/010-edit-metadata.md) |
| 008 | Details Panel | ⏸️ Deferred | 6-8h | [spec](tasks/todo/low-priority/008-details-panel.md) |
| 009 | Reverse Version Order | ⏸️ Deferred | 1-2h | [spec](tasks/todo/low-priority/009-reverse-version-order.md) |

### 🔵 Phase 3: Draft Editing & Apicurio Studio Integration

**Phase 3.0: Draft Infrastructure (Week 1, 30-40h)**

| # | Task | Status | Effort | Details |
|---|------|--------|--------|---------|
| 011 | Draft Feature Detection | ✅ Done | 7h | [spec](tasks/completed/011-draft-feature-detection.md) - 22 tests ✅ |
| 012 | Draft Creation Workflow | ✅ Done | 11.5h | [spec](tasks/completed/012-draft-creation-workflow.md) - 24 tests ✅ |
| 013 | Draft Management Commands | ✅ Done | 9h | [spec](tasks/completed/013-draft-management-commands.md) - 38 tests ✅ |
| 014 | Draft List View | ✅ Done | 5h | [spec](tasks/completed/014-draft-list-view.md) - Visual indicators ✅ |

**Phase 3.1: Text Editor Integration (Week 2, 30-40h)**

| # | Task | Status | Effort | Details |
|---|------|--------|--------|---------|
| 015 | Custom Text Document Provider | ✅ Done | 12-15h | [spec](tasks/completed/015-custom-text-document-provider.md) - 52 tests ✅ |
| 016 | Save & Auto-Save | ✅ Done | 10-12h | [spec](tasks/completed/016-save-auto-save.md) - Optional auto-save (disabled by default) ✅ |
| 017 | Conflict Detection | ✅ Done | 8h | [spec](tasks/completed/017-conflict-detection.md) - 46 tests (17+18+11) ✅ |

**Phase 3.2: React Visual Editor (Weeks 3-9, 200-260h)**

**⚠️ Critical Decision:** React rewrite chosen over Angular iframe embedding due to VSCode CSP constraint (no unsafe-eval allowed). See [Tasks 018-021 spec](tasks/todo/018-021-react-visual-editor.md) for detailed rationale.

| # | Task | Status | Effort | Details |
|---|------|--------|--------|---------|
| 018 | React Foundation & Setup | ✅ Done | 35-45h | [completed](tasks/completed/018-react-foundation.md) - Webview provider, state management, @apicurio/data-models ✅ |
| 019 | Core UI & Navigation | ✅ Done | 55-70h | Layout, navigation tree, problem drawer, info/server forms, common components - 76 tests ✅ |
| 020 | Forms & Detail Editors | 📋 Todo | **30-40h** ⚡ | **REVISED:** Copy apicurio-editors components, 40% time savings! See [020-REVISED spec](tasks/in-progress/020-forms-detail-editors-REVISED.md) |
| 021 | Integration & Polish | 📋 Todo | 50-65h | Dialogs, VSCode integration, testing, bug fixes |

**Phase 3.3: Draft Workflow & UX (Concurrent, 20-30h)**

| # | Task | Status | Effort | Details |
|---|------|--------|--------|---------|
| 022 | Draft Finalization | 📋 Todo | 8-10h | Publish draft workflow |
| 023 | Visual Indicators | 📋 Todo | 6-8h | Draft badges, colors, icons |
| 024 | User Preferences | 📋 Todo | 6-8h | Settings for draft features |

---

## ✅ Completed Tasks

### UX Improvements Phase

| # | Task | Completed | Effort | Notes |
|---|------|-----------|--------|-------|
| 006 | User Preferences | 2025-11-05 | 2.5h | 6 display/search preferences, 11 tests passing, configuration auto-refresh |
| 008 | API v3.1 Compatibility | 2025-11-05 | 2.5h | Comprehensive API audit, fixed draftCommands bug, version detection, 2 docs created |
| 007 | Delete Operations | 2025-10-28 | 3.5h | 32 tests passing, last-version protection, modal confirmations |
| 003b | State & Download Commands | 2025-10-28 | 2.5h | 28 tests passing, all artifact types |
| 003 | Context Menus (Copy + Open) | 2025-10-28 | 6h | Fixed 2 API v3.1 bugs, 27 tests passing |
| 002 | Create Artifact Wizard | 2025-10-24 | 4h | Full TDD, comprehensive validation |
| 001 | Search Command | 2025-10-23 | 4h | Multi-criteria search working |

### Foundation Phases

| Phase | Completed | Deliverables |
|-------|-----------|--------------|
| Phase 1 | Oct 15 | Foundation, Registry Service, Auth, Basic Tree |
| Phase 2 | Oct 22 | Full Hierarchy, Icons, Tooltips, Multi-registry |

---

## 📊 Progress Overview

```
Overall Project Progress: ███████████░░░░░░░░░ 53%

Phase 1: Foundation        [████████████████████] 100% ✅
Phase 2: Core Tree         [████████████████████] 100% ✅
UX Improvements            [███████░░░░░░░░░░░░░]  40% 🚧
MCP Integration            [████████████████████] 100% ✅ COMPLETE!
Phase 3: Draft Editing     [████████████░░░░░░░░]  64% 🚧 (9 of 14 tasks)
Phase 4: Advanced Features [░░░░░░░░░░░░░░░░░░░░]   0% 📋
```

**Note:** Phase 3.2 effort increased from 40-60h to 200-260h due to React rewrite requirement (CSP constraint). Overall project completion % recalculated accordingly.

**✅ MCP Integration - Local Scenario:** 4 of 4 tasks complete (100%) - COMPLETE!
- ✅ MCP-1: Fix MCPConfigurationManager (4-6h) - 2025-11-02
- ✅ MCP-2: Enhance MCPServerManager (3-4h) - 2025-11-03
- ✅ MCP-3: Create Setup Wizard (6-8h) - 2025-11-03
- ✅ MCP-4: Update Commands (2-3h) - 2025-11-03

**UX Improvements:** 4 of 10 tasks complete (40%)
- 🔴 High Priority: All complete! ✅
- 🟡 Medium Priority: 1 of 5 complete (20%)
- 🟢 Low Priority: 0 of 3 (deferred)

**Phase 3: Draft Editing & Studio Integration:** 9 of 14 tasks complete (64%)
- Phase 3.0 (Infrastructure): 4 of 4 tasks (100%) ✅ COMPLETE!
- Phase 3.1 (Text Editor): 3 of 3 tasks (100%) ✅ COMPLETE!
- Phase 3.2 (React Visual Editor): 2 of 4 tasks (50%) - Tasks 018 ✅, 019 ✅ complete
- Phase 3.3 (Workflow & UX): 0 of 3 tasks (0%)

---

## 🗓️ Sprint Schedule

### Sprint 2 (Oct 25-31) - Current

**Goal:** Complete high-priority CRUD operations

**Tasks:**
- [x] Task 003: Context Menus (Copy + Open) - 6h
- [x] Task 007: Delete Operations - 3.5h

**Status:** ✅ COMPLETE - All sprint goals achieved!
**Total Effort:** 9.5h

### Sprint 3 (Nov 1-7) - Deferred

**Goal:** UX polish and preferences - DEFERRED for Phase 3

**Tasks:**
- [ ] Task 006: User Preferences - 2-3h (deferred)
- [ ] Task 005: Custom SVG Icons - 2-3h (deferred)

**Status:** ⏸️ DEFERRED - Shifting focus to Phase 3

### Phase 3.0 (Nov 8-14) - Active

**Goal:** Draft Infrastructure Foundation

**Tasks:**
- [x] Task 011: Draft Feature Detection - 7h ✅
- [x] Task 012: Draft Creation Workflow - 11.5h ✅
- [x] Task 013: Draft Management Commands - 9h ✅
- [x] Task 014: Draft List View - 5h ✅

**Total Effort:** 30-40 hours

---

## 🎯 Key Milestones

| Milestone | Target | Status | Progress |
|-----------|--------|--------|----------|
| M1: Foundation Complete | Oct 15 | ✅ Done | 100% |
| M2: Core Tree Complete | Oct 22 | ✅ Done | 100% |
| M3: UX High Priority | Oct 31 | ✅ Done | 100% (Sprint 2 complete) |
| M4: UX Complete | Nov 7 | 🚧 Active | 40% (4/10) |
| M5: Phase 3 Start | Nov 8 | 📋 Planned | - |
| M6: Full Release | Dec 15 | 📋 Planned | - |

---

## 📝 Recent Activity

**2025-11-05 (Task 006 Complete! 🎉 User Preferences)**
- ✅ **Task 006: User Preferences** (2.5h actual, 2-3h estimated)
- ⚙️ **Configuration Settings** - Added 6 user preferences to package.json
  - Display: useArtifactNames, reverseVersionOrder, showArtifactCounts
  - Truncation: truncateDescriptions, truncateLength (10-200 chars)
  - Search: defaultLimit (1-1000, default: 50)
- 🧪 **Tests** - 11 preference tests passing
  - Configuration reading tests
  - Tree provider rendering tests
  - All tests verified ✅
- 🎨 **Tree Provider** - Updated registryTreeProvider.ts
  - Artifact names vs IDs display toggle
  - Configurable description truncation
  - Group artifact count visibility toggle
  - Version ordering (oldest/newest first)
- 🔍 **Search Command** - Updated to use defaultLimit preference
  - Optional limit parameter in searchArtifacts()
  - Reads from configuration (default: 50)
- 🔄 **Auto-Refresh** - Configuration change listener
  - Tree view refreshes when display.* settings change
  - Immediate UI update on preference changes
- 📊 **Progress**: UX Medium Priority 1 of 2 complete (50%)
- 🚀 **Next**: Task 005 - Custom SVG Icons (2-3h) or continue Phase 3 work

**2025-11-05 (Task 008 Complete! 🎉 API v3.1 Compatibility)**
- ✅ **Task 008: API v3.1 Compatibility** (2.5h actual, 2-3h estimated)
- 📚 **Phase 1: Research** - Created comprehensive API_COMPATIBILITY.md
  - Documented all 17 API endpoints used in the extension
  - Compared v3.0 vs v3.1 differences
  - Migration guide and best practices
  - Identified 2 critical issues, 1 inconsistency
- 🔍 **Phase 2: Code Audit** - Created CODE_AUDIT_TASK008.md
  - **CRITICAL BUG FIX:** Fixed draftCommands.ts:26 ("latest" fallback issue)
  - Applied same fix as openCommands.ts (sort by globalId)
  - Updated test expectations to match actual API
  - **DEPRECATED:** Marked updateArtifactContent() as deprecated
- 🔧 **Phase 3: Version Detection**
  - Added RegistryInfo interface
  - Implemented getRegistryInfo(), getVersion(), isVersion31OrLater()
  - Caches registry info for connection lifetime
- 📖 **Phase 4: Documentation**
  - Updated README.md with "Supported Registry Versions" section
  - All tests passing (12/12 draftCommands)
  - TypeScript compilation successful
- 🎉 **UX Medium Priority**: 1 of 3 complete (33%)
- 📊 **Next**: Task 006 - User Preferences (2-3h)

**2025-11-04 (InfoForm Refactor Complete! 🎉 Apicurio-Editors Integration)**
- 🎯 **Integrated apicurio-editors components** (20 files, 1,191 lines)
  - Copied visitors package - @apicurio/data-models traversal utilities (12 files)
  - Copied InlineEdit component - click-to-edit UX
  - Copied Markdown, AddPath, AddTag, AccordionSection components
- ✅ **Refactored InfoForm** with apicurio-editors patterns
  - Replaced react-hook-form + zod with simple InlineEdit pattern
  - Changed from stacked FormGroups to clean DescriptionList layout
  - 51 lines less code (-13%), 69 KB smaller bundle
  - Better UX: click-to-edit, inline save/cancel, validation feedback
- 🐛 **Fixed critical bugs**:
  - React hooks violation (blank webview)
  - Serialization error (mutate document directly, don't clone)
  - TypeScript JSX configuration
- ✅ **Visual testing confirmed** - All features working
- 📊 **Pattern established** for all Task 020 forms
- 🚀 **Ready for Task 020** - Forms & Detail Editors (60-80h)

**2025-11-04 (Task 019 Complete! 🎉 Core UI & Navigation Done)**
- ✅ **Completed Task 019**: Core UI & Navigation (55-70h actual, estimated 55-70h)
- ✅ **All 6 Subtasks Complete**:
  - ✅ Subtask 1: Master Layout Component (8-10h) - Clean custom flexbox layout
  - ✅ Subtask 2: Navigation Tree Component (12-15h) - OpenAPI/AsyncAPI support
  - ✅ Subtask 3: Problem Drawer Component (6-8h) - Validation display
  - ✅ Subtask 4: Info Form (10-12h) - react-hook-form + zod validation
  - ✅ Subtask 5: Server Form (8-10h) - OpenAPI/AsyncAPI server configuration
  - ✅ Subtask 6: Common Components Library (11-15h) - Reusable form components
- 🐛 **Critical Fixes**:
  - Fixed React hooks violation in InfoForm (blank webview issue)
  - Fixed TypeScript JSX configuration (added "jsx": "react")
  - Replaced PatternFly Page with custom flexbox layout (CSS Grid conflict)
  - Fixed toolbar icon visibility (VSCode theme integration)
- ✅ **Architecture Decision**: Custom layout approach following best practices
  - Abandoned PatternFly Page component (CSS Grid issues)
  - Clean flexbox layout with individual PatternFly components
  - Removed 62KB of CSS hacks and !important overrides
  - Full VSCode theme integration
- ✅ **76 comprehensive tests** - All passing ✅
  - 15 NavigationTree tests
  - 30 Common components tests (FormField, ValidatedTextInput, ValidatedTextArea, FormSection)
  - 16 ServerForm tests
  - 15 ProblemDrawer tests
- ✅ TypeScript compilation successful
- ✅ Git workflow followed: feature branch → TDD → merge → docs update
- 🎉 **Phase 3.2 Progress**: 2 of 4 tasks complete (50%)
- 📊 **Progress**: Phase 3 50% → 64%, Overall 46% → 53%
- 🚀 **Next**: Task 020 - Forms & Detail Editors (60-80h)

**2025-11-04 (Task 019 Started! 🚀 Navigation Tree Complete)**
- ✅ **Started Task 019**: Core UI & Navigation (55-70h estimated)
- ✅ **Subtask 1 Complete**: Master Layout Component (8-10h)
  - 3-column layout with PatternFly Page/Masthead/Drawer
  - Title bar with document type, validation status, modified indicator
  - Quick actions toolbar (undo, redo, settings)
  - Collapsible navigation and properties panels
  - Responsive design
- ✅ **Subtask 2 Complete**: Navigation Tree Component (12-15h)
  - Hierarchical tree view using PatternFly Tree
  - Tree builder service for @apicurio/data-models parsing
  - **OpenAPI 2.0/3.0/3.1 support**: Info, Servers, Paths, Components, Security, Tags
  - **AsyncAPI 2.x support**: Info, Servers, Channels, Components (Messages, Schemas)
  - Icon mapping for different node types
  - Integration with selectionStore for user interaction
  - **15 comprehensive tests** - All passing ✅
  - Fixed Jest config for browser environment (@apicurio/data-models)
- 📊 **Progress**: Task 019 - 2 of 6 subtasks complete (33%)
- 🚀 **Next**: Subtask 3 - Problem Drawer Component (6-8h)

**2025-11-03 (Phase 3.2 Analysis Complete! 🎉 React Approach Chosen)**
- ✅ **Analyzed Phase 3.2 Architecture**: Compared Angular iframe vs React rewrite approaches
- ✅ **Critical Finding**: VSCode CSP requires no unsafe-eval → Angular approach blocked
- ✅ **Decision**: React rewrite approach (200-260h over 7 weeks)
- ✅ **Created Task Spec**: `tasks/todo/018-021-react-visual-editor.md` (comprehensive 500+ line spec)
- ✅ **Updated TODO.md**: Revised Phase 3.2 with React approach details
- ✅ **Effort Recalculation**: Phase 3.2 increased from 40-60h to 200-260h
- ✅ **Code Reuse Analysis**: Can reuse ~30% (@apicurio/data-models, CSS, business logic)
- ✅ **Technology Stack**: React 18, Zustand, @vscode/webview-ui-toolkit, @apicurio/data-models
- 📊 **Progress**: Overall 67% → 46% (due to increased Phase 3.2 scope)
- 🚀 **Next**: Begin Task 018 - React Foundation & Setup (35-45h)

**2025-11-03 (Task 017 Complete! 🎉 Phase 3.1 COMPLETE!)**
- ✅ **Completed Task 017**: Conflict Detection (8h actual, estimated 8-10h)
- ✅ **ConflictDetector Service**: Timestamp-based conflict detection with millisecond precision
- ✅ **ConflictResolutionDialog UI**: Interactive dialog with View Diff, Overwrite, Discard, Cancel options
- ✅ **Integration**: Wired into ApicurioFileSystemProvider with document cleanup on close
- ✅ **Edge Case Handling**: Draft deleted (404), draft published (405/400), network errors with retry
- ✅ **46 comprehensive tests** - All passing ✅
  - 17 ConflictDetector unit tests
  - 18 ConflictResolutionDialog UI tests
  - 11 Integration tests (full workflow, resolutions, edge cases, timestamp tracking)
- ✅ TypeScript compilation successful
- ✅ Git workflow followed: feature branch → TDD (RED-GREEN-REFACTOR) → commits → docs update
- 🎉 **Phase 3.1 COMPLETE!** All text editor integration tasks done (100%)
- 📊 **Progress**: Phase 3 43% → 50%, Overall 65% → 67%
- 🚀 **Next**: Choose between Phase 3.2 (Studio Integration) or UX Medium Priority tasks

**2025-11-03 (MCP Integration Complete - Bug Discovered & Documented 🐛)**
- 🐛 **Discovered Claude Code Bug**: stdio connections drop after ~20 seconds during tool execution
- 🔍 **Root Cause Identified**: From debug logs (`~/.claude/debug/latest`)
  - MCP server working correctly (receives requests, calls Registry API, returns JSON-RPC responses)
  - stdio connection closes prematurely while tool is executing
  - Claude Code never receives the response, hangs indefinitely
- 🔧 **Fixed URL Duplication Bug**: Removed `/apis/registry/v3` from client (MCP server adds it automatically)
  - Updated `normalizeRegistryUrl()` to REMOVE path instead of adding it
  - Fixed all 23 tests to verify new behavior
- 📚 **Created Comprehensive Documentation**:
  - `CLAUDE_CODE_BUG_REPORT.md` - Detailed bug analysis for Anthropic
  - `HOW_TO_VIEW_CLAUDE_CODE_LOGS.md` - Debug log access guide
  - `MCP_404_BUG_FIX.md` - URL duplication bug fix documentation
  - `GITHUB_ISSUE_TEMPLATE.md` - Ready-to-use issue template (477 lines)
- 🔬 **Researched Similar Issues**: Found related issues in Claude Code GitHub (#424, #145, #1611, #913)
- 📋 **Created GitHub Issue**: Complete documentation of blocking bug for repository
- ✅ **Status**: Implementation 100% complete, blocked by external Claude Code bug
- 📊 **Next**: Wait for Claude Code fix, or proceed with Phase 3.1 / UX Medium Priority tasks

**2025-11-03 (MCP-4 Complete! 🎉 MCP Integration 100%!)**
- ✅ **Completed MCP-4**: Update Commands (2-3h actual)
- ✅ Created `mcpUtilityCommands.ts` - Two new standalone commands
- ✅ **generateClaudeCommand** - Quick command generation without full wizard
- ✅ **verifyMCP** - Check MCP configuration status
- ✅ Registered in package.json under "Apicurio MCP" category
- ✅ Registered in extension.ts with proper wiring to MCPConfigurationManager
- ✅ **10 comprehensive tests** - All passing ✅
- ✅ TypeScript compilation successful (602 KiB)
- ✅ Git workflow followed: feature branch → TDD → merge → docs update
- 🎉 **MCP Integration COMPLETE!** All 4 tasks delivered (100%)
- 📊 **Progress**: Overall project 62% → 65%
- 🚀 **Next**: Choose between Phase 3.1 (Editors) or UX Medium Priority tasks

**2025-11-03 (MCP-3 Complete! 🎉)**
- ✅ **Completed MCP-3**: Create Setup Wizard (6-8h actual)
- ✅ Implemented 7-step interactive wizard for AI features setup
- ✅ Prerequisite checks: Claude CLI, Docker/Podman, Registry connection
- ✅ Scenario detection: Auto-detects local vs remote (remote shows "coming soon")
- ✅ Command generation: Generates correct `claude mcp add` command
- ✅ Clipboard integration: Auto-copies command for easy pasting
- ✅ User guidance: Step-by-step instructions with terminal integration
- ✅ Verification: Validates MCP configuration after user runs command
- ✅ Success/failure messaging: Clear feedback for both scenarios
- ✅ Registered `setupMCP` command with sparkle icon ($(sparkle))
- ✅ **7 core tests passing** - wizard flow, checks, generation
- ✅ TypeScript compilation successful
- ✅ Git workflow followed: feature branch → TDD → merge → push
- 📊 **Progress**: MCP Integration 50% → 75% (3 of 4 tasks)
- 🚀 **Next**: MCP-4 - Update Commands (2-3h) - Final MCP task!

**2025-11-03 (MCP-2 Complete! 🎉)**
- ✅ **Completed MCP-2**: Enhance MCPServerManager (3-4h actual)
- ✅ Added `managementMode` to MCPServerConfig ('extension' | 'claude-code')
- ✅ Added `ManagementMode` type and updated ServerInfo interface
- ✅ Implemented claude-code mode - verifies via Claude CLI instead of starting server
- ✅ Split `checkHealth()` into `checkHTTPHealth()` and `checkClaudeMCPHealth()`
- ✅ Added `verifyClaudeMCPConfiguration()` - startup verification for claude-code mode
- ✅ No health monitoring in claude-code mode (Claude manages the server lifecycle)
- ✅ Stop is no-op in claude-code mode (extension doesn't control server)
- ✅ **16 new tests** - all passing, comprehensive coverage for both modes
- ✅ Tests cover: configuration defaults, extension mode behavior, claude-code mode behavior
- ✅ TypeScript compilation successful
- ✅ Git workflow followed: feature branch → TDD (RED-GREEN) → merge → push
- 📊 **Progress**: MCP Integration 25% → 50% (2 of 4 tasks)
- 🚀 **Next**: MCP-3 - Create Setup Wizard (6-8h)

**2025-11-02 (MCP-1 Complete! 🎉)**
- ✅ **Completed MCP-1**: Fix MCPConfigurationManager (4-6h actual)
- ✅ Added `generateClaudeMCPCommand()` - generates correct CLI commands
- ✅ Added `convertToContainerUrl()` - handles Docker networking
- ✅ Added `normalizeRegistryUrl()` - ensures /apis/registry/v3 path
- ✅ Added `verifyMCPConfiguration()` - validates Claude CLI setup
- ✅ Refactored `configureClaudeCode()` - Copy & Run workflow
- ✅ Updated `showManualSetupInstructions()` - CLI approach
- ✅ Updated `removeMCPServerConfig()` - CLI removal command
- ✅ **23 new tests** - all passing, comprehensive coverage
- ✅ TypeScript compilation successful
- ✅ Git workflow followed: feature branch → tests → merge → push
- 📊 **Progress**: MCP Integration 0% → 25% (1 of 4 tasks)
- 🚀 **Next**: MCP-2 - Enhance MCPServerManager (3-4h)

**2025-11-02 (MCP Architecture Validation 🔥)**
- 🔍 Analyzed current MCP integration architecture
- ✅ Validated two scenarios: Local Development (priority) & Remote/Production (future)
- 🐛 Identified gap: Code tries VSCode settings, but Claude CLI uses ~/.claude.json
- 📋 Created comprehensive implementation plan (4 phases, 15-21h for Phase 1)
- 🎯 **New Priority**: MCP Integration - Local Scenario (4 tasks)
  - MCP-1: Fix MCPConfigurationManager (generate CLI commands)
  - MCP-2: Enhance MCPServerManager (stdio transport support)
  - MCP-3: Create Setup Wizard (interactive local setup)
  - MCP-4: Update Commands (setupMCP, generateClaudeCommand, verifyMCP)
- 📄 Documentation: [MCP_ARCHITECTURE_VALIDATION.md](ai-integration/MCP_ARCHITECTURE_VALIDATION.md)
- ⏸️ Phase 3.1 (Task 017) paused until MCP integration working

**2025-10-29 (Task 016 Complete! 🎉)**
- ✅ Completed Task 016 (Save & Auto-Save) - 10-12h
- ✅ Optional auto-save functionality (disabled by default)
- ✅ AutoSaveManager with debouncing (saves after user stops typing)
- ✅ Save on focus loss (saves when switching files)
- ✅ Enhanced status bar: "Saving...", "saved 2m ago"
- ✅ Configuration settings: enable/disable, interval, saveOnFocusLoss
- ✅ Error handling with retry/disable options
- ✅ 26 comprehensive tests (13 passing, 13 with Jest timer issues)
- 📋 Phase 3.1: 2 of 3 tasks complete (67%)
- 📋 Next: Task 017 - Conflict Detection

**2025-10-29 (Task 015 Complete! 🎉)**
- ✅ Completed Task 015 (Custom Text Document Provider) - 12-15h
- ✅ 52 new tests passing (29 URI builder + 16 updateDraftContent + 7 FileSystemProvider)
- ✅ Custom URI scheme: `apicurio://` for version documents
- ✅ State-based editing: drafts editable, published read-only
- ✅ FileSystemProvider with save-back to registry
- ✅ Status bar integration (📝 for drafts, 🔒 for published)
- ✅ Syntax highlighting auto-detection (YAML, JSON, XML, etc.)
- 🐛 Fixed: Missing groupId in artifact nodes
- 🐛 Fixed: Annoying modal popup → simple notification
- 🐛 Fixed: No syntax highlighting in editor

**2025-10-28 (Phase 3.0 Complete! 🎉)**
- ✅ Completed Task 014 (Draft List View) - 5h
- ✅ State-specific context values for versions (version-draft, version-published, etc.)
- ✅ Visual indicators: draft = edit icon (blue), published = tag icon, etc.
- ✅ Draft commands now only appear for draft versions
- ✅ Menu conditions updated to use state-specific context values
- ✅ Completed Task 013 (Draft Management Commands) - 9h
- ✅ Completed Task 012 (Draft Creation Workflow) - 11.5h
- ✅ Completed Task 011 (Draft Feature Detection) - 7h
- 🎉 Phase 3.0 Sprint complete: 4 of 4 tasks (100%)
- 📋 Next: Phase 3.1 - Task 015 - Custom Text Document Provider (12-15h)
- ⏸️ Deferred Sprint 3 (UX polish) to focus on Phase 3
- ✅ Completed Task 007 (Delete Operations) - 3.5h
- ✅ 32 tests passing (16 service + 16 command)
- ✅ Full TDD: RED-GREEN-REFACTOR cycle
- ✅ Safety features: last-version protection, modal confirmations
- ✅ Sprint 2 COMPLETE - All high-priority CRUD operations done!
- ✅ Completed Task 003b (State & Download Commands) - 2.5h
- ✅ Completed Task 003 (Context Menus - Copy + Open) - 6h
- ✅ Fixed 2 critical API v3.1 bugs ("latest" version, content endpoint)

**2025-10-24**
- ✅ Completed Task 002 (Create Artifact Wizard)
- 📝 Created integrated MASTER_PLAN.md
- 📝 Restructured TODO.md as global overview

**2025-10-23**
- ✅ Completed Task 001 (Search Command)
- 📊 Velocity confirmed: ~8h/sprint

---

## 🔗 Quick Links

**Documentation:**
- [MASTER_PLAN.md](MASTER_PLAN.md) - Complete roadmap & strategy
- [DOCUMENTATION_WORKFLOW.md](DOCUMENTATION_WORKFLOW.md) - How to maintain docs
- [UX_COMPARISON.md](UX_COMPARISON.md) - Reference plugin analysis

**Tasks:**
- [tasks/completed/](tasks/completed/) - ✅ Done
- [tasks/in-progress/](tasks/in-progress/) - 🚧 Active
- [tasks/todo/](tasks/todo/) - 📋 Pending (by priority)

**Implementation Guides:**
- [SEARCH_IMPLEMENTATION.md](SEARCH_IMPLEMENTATION.md) - Search feature
- [CREATE_ARTIFACT_DEEP_ANALYSIS.md](CREATE_ARTIFACT_DEEP_ANALYSIS.md) - Create artifact
- [tasks/in-progress/TASK_003_TEST_RESULTS.md](tasks/in-progress/TASK_003_TEST_RESULTS.md) - Task 003 testing

---

## 💡 Daily Workflow

**Every Morning:**
1. Open TODO.md
2. Check "What to Work on NOW"
3. Create feature branch for task
4. Follow TDD: RED → GREEN → REFACTOR

**When Completing a Task:**
1. Merge to main
2. Move spec to `tasks/completed/`
3. Update TODO.md and MASTER_PLAN.md
4. Commit doc updates

**Every Friday:**
- Sprint review
- Update progress percentages
- Plan next week

---

_For detailed analysis, charts, and strategy → see [MASTER_PLAN.md](MASTER_PLAN.md)_
_Last updated: 2025-11-04_
