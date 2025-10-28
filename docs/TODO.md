# Apicurio VSCode Plugin - TODO

**Last Updated:** 2025-10-28
**Status:** UX Improvements Phase (Sprint 2)

> 📘 For detailed analysis, strategy, and context → see [MASTER_PLAN.md](MASTER_PLAN.md)

---

## 🚧 In Progress

_No tasks currently in progress_

---

## 🎯 What to Work on NEXT

**Recommended:** Task 004 - Add Version Command (4-6h)
- [Specification](tasks/todo/medium-priority/004-add-version.md)
- TDD approach: Write tests first
- Create feature branch: `task/004-add-version`

**Alternative:** Task 003b - State & Download (2-3h) to fully complete Task 003
- [Specification](tasks/todo/high-priority/003b-state-and-download.md)
- Completes context menu implementation

---

## 📋 Task List by Priority

### 🔴 High Priority

| # | Task | Status | Effort | Details |
|---|------|--------|--------|---------|
| 003b | State & Download Commands | 📋 Todo | 2-3h | [spec](tasks/todo/high-priority/003b-state-and-download.md) |

### 🟡 Medium Priority

| # | Task | Status | Effort | Details |
|---|------|--------|--------|---------|
| 004 | Add Version Command | 📋 Todo | 4-6h | [spec](tasks/todo/medium-priority/004-add-version.md) |
| 007 | Delete Operations | 📋 Todo | 3-4h | [spec](tasks/todo/medium-priority/007-delete-operations.md) |
| 008 | API v3.1 Compatibility | 📋 Todo | 2-3h | [spec](tasks/todo/medium-priority/008-api-v31-compatibility.md) |
| 006 | User Preferences | 📋 Todo | 2-3h | [spec](tasks/todo/medium-priority/006-user-preferences.md) |
| 005 | Custom SVG Icons | 📋 Todo | 2-3h | [spec](tasks/todo/medium-priority/005-custom-svg-icons.md) |

### 🟢 Low Priority (Deferred to Phase 3)

| # | Task | Status | Effort | Details |
|---|------|--------|--------|---------|
| 010 | Edit Metadata UI | ⏸️ Deferred | 4-5h | [spec](tasks/todo/low-priority/010-edit-metadata.md) |
| 008 | Details Panel | ⏸️ Deferred | 6-8h | [spec](tasks/todo/low-priority/008-details-panel.md) |
| 009 | Reverse Version Order | ⏸️ Deferred | 1-2h | [spec](tasks/todo/low-priority/009-reverse-version-order.md) |

---

## ✅ Completed Tasks

### UX Improvements Phase

| # | Task | Completed | Effort | Notes |
|---|------|-----------|--------|-------|
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
Overall Project Progress: ██████░░░░░░░░░░░░░░░░ 30%

Phase 1: Foundation        [████████████████████] 100% ✅
Phase 2: Core Tree         [████████████████████] 100% ✅
UX Improvements            [████░░░░░░░░░░░░░░░░]  30% 🚧
Phase 3: Editors           [░░░░░░░░░░░░░░░░░░░░]   0% 📋
Phase 4: Advanced Features [░░░░░░░░░░░░░░░░░░░░]   0% 📋
```

**UX Improvements:** 3 of 10 tasks complete (30%)
- 🔴 High Priority: 0 of 1 remaining
- 🟡 Medium Priority: 0 of 5 complete
- 🟢 Low Priority: 0 of 3 (deferred)

---

## 🗓️ Sprint Schedule

### Sprint 2 (Oct 25-31) - Current

**Goal:** Complete high-priority CRUD operations

**Tasks:**
- [x] Task 003: Context Menus (Copy + Open) - 6h
- [ ] Task 004: Add Version - 4-6h
- [ ] Task 007: Delete Operations - 3-4h

**Status:** 1 of 3 complete
**Remaining Effort:** 7-10 hours

### Sprint 3 (Nov 1-7) - Planned

**Goal:** UX polish and preferences

**Tasks:**
- [ ] Task 006: User Preferences - 2-3h
- [ ] Task 005: Custom SVG Icons - 2-3h

**Total Effort:** 4-6 hours

### Phase 3 Start (Nov 8+)

**Goal:** Editor integration
- Custom text editor POC
- Apicurio Studio integration
- Sync workflow

---

## 🎯 Key Milestones

| Milestone | Target | Status | Progress |
|-----------|--------|--------|----------|
| M1: Foundation Complete | Oct 15 | ✅ Done | 100% |
| M2: Core Tree Complete | Oct 22 | ✅ Done | 100% |
| M3: UX High Priority | Oct 31 | 🚧 Active | 67% (2/3) |
| M4: UX Complete | Nov 7 | 📋 Planned | 30% (3/10) |
| M5: Phase 3 Start | Nov 8 | 📋 Planned | - |
| M6: Full Release | Dec 15 | 📋 Planned | - |

---

## 📝 Recent Activity

**2025-10-28**
- ✅ Completed Task 003 (Context Menus - Copy + Open)
- ✅ Fixed 2 critical API v3.1 bugs ("latest" version, content endpoint)
- ✅ Merged task/003-context-menus to main (27 tests passing)
- 📝 Created Task 003b (State & Download) and Task 008 (API Compatibility)

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
