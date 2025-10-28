# Apicurio VSCode Plugin - TODO

**Last Updated:** 2025-10-28
**Status:** UX Improvements Phase (Sprint 2)

> 📘 For detailed analysis, strategy, and context → see [MASTER_PLAN.md](MASTER_PLAN.md)

---

## 🚧 In Progress

_No tasks currently in progress_

---

## 🎯 What to Work on NEXT

**Recommended:** Task 015 - Custom Text Document Provider (12-15h)
- Phase 3.1: Text Editor Integration begins
- Implement virtual text documents for editing drafts
- Enable direct editing of draft content in VSCode
- Then: Task 016 - Save & Auto-Save

---

## 📋 Task List by Priority

### 🔴 High Priority

_All high priority tasks complete!_

### 🟡 Medium Priority

| # | Task | Status | Effort | Details |
|---|------|--------|--------|---------|
| 008 | API v3.1 Compatibility | 📋 Todo | 2-3h | [spec](tasks/todo/medium-priority/008-api-v31-compatibility.md) |
| 006 | User Preferences | 📋 Todo | 2-3h | [spec](tasks/todo/medium-priority/006-user-preferences.md) |
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
| 015 | Custom Text Document Provider | 📋 Todo | 12-15h | Edit drafts as text files |
| 016 | Save & Auto-Save | 📋 Todo | 10-12h | Auto-save with API sync |
| 017 | Conflict Detection | 📋 Todo | 8-10h | Detect & handle concurrent edits |

**Phase 3.2: Apicurio Studio Integration (Week 3-4, 40-60h)**

| # | Task | Status | Effort | Details |
|---|------|--------|--------|---------|
| 018 | Webview Editor Provider | 📋 Todo | 15-20h | Custom webview for Studio |
| 019 | Message Passing Protocol | 📋 Todo | 12-15h | Bidirectional communication |
| 020 | Studio Configuration | 📋 Todo | 8-10h | Load Studio from registry or local |
| 021 | Content Synchronization | 📋 Todo | 10-12h | Sync text ↔ visual edits |

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
Overall Project Progress: ██████████░░░░░░░░░░░░ 46%

Phase 1: Foundation        [████████████████████] 100% ✅
Phase 2: Core Tree         [████████████████████] 100% ✅
UX Improvements            [███████░░░░░░░░░░░░░]  40% 🚧
Phase 3: Draft Editing     [██████░░░░░░░░░░░░░░]  29% 🚧 IN PROGRESS
Phase 4: Advanced Features [░░░░░░░░░░░░░░░░░░░░]   0% 📋
```

**UX Improvements:** 4 of 10 tasks complete (40%)
- 🔴 High Priority: All complete! ✅
- 🟡 Medium Priority: 1 of 5 complete (20%)
- 🟢 Low Priority: 0 of 3 (deferred)

**Phase 3: Draft Editing & Studio Integration:** 4 of 14 tasks complete (29%)
- Phase 3.0 (Infrastructure): 4 of 4 tasks (100%) ✅ COMPLETE!
- Phase 3.1 (Text Editor): 0 of 3 tasks (0%)
- Phase 3.2 (Studio Integration): 0 of 4 tasks (0%)
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
_Last updated: 2025-10-28_
