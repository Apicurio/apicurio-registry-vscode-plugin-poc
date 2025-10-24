# Apicurio VSCode Plugin - Master Implementation Plan

**Last Updated:** 2025-10-24
**Status:** Phase 2 Complete + UX Improvements In Progress
**Next:** Complete UX Improvements → Phase 3 (Editors)

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
| **UX Improvements** | 🚧 In Progress | 20% (2/10) | High Priority Tasks |
| **Phase 3** (Editors) | 📋 Planned | 0% | After UX improvements |
| **Phase 4** (Advanced) | 📋 Planned | 0% | Future |

---

## Integration Strategy

### Decision: Complete UX Improvements Before Phase 3

**Rationale:**
1. **User Experience First** - CRUD operations are more critical than editors
2. **Reference Plugin Parity** - Need basic management features before advanced editing
3. **Natural Progression** - Context menus needed before editor integration
4. **User Feedback** - Better to get feedback on core workflows first

**Updated Timeline:**
```
✅ Phase 1 + 2 (Complete)
   ↓
🚧 UX Improvements (Current, 2-4 weeks)
   ↓
📋 Phase 3: Editors (3-4 weeks)
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
**Status:** 🚧 20% Complete (2/10 tasks)
**Current Sprint:** Sprint 2 (Oct 25-31)

Based on [UX_COMPARISON.md](UX_COMPARISON.md) analysis of reference plugin.

#### ✅ Completed (2 tasks, 8 hours)

| ID | Task | Effort | Completed | Details |
|----|------|--------|-----------|---------|
| 001 | Search Command | 4h | 2025-10-23 | [spec](tasks/completed/001-search-command.md) |
| 002 | Create Artifact Wizard | 4h | 2025-10-24 | [spec](tasks/completed/002-create-artifact.md) |

#### 🔴 High Priority (1 task remaining)

| ID | Task | Effort | Status | Sprint | Details |
|----|------|--------|--------|--------|---------|
| 003 | Context Menus | 4-6h | 📋 Todo | Sprint 2 | [spec](tasks/todo/high-priority/003-context-menus.md) |

**Actions for Task 003:**
- Copy operations (copy ID, reference)
- Open/preview operations
- Change state operations
- Download content
- Foundation for delete/edit operations

#### 🟡 Medium Priority (4 tasks)

| ID | Task | Effort | Status | Sprint | Details |
|----|------|--------|--------|--------|---------|
| 004 | Add Version Command | 4-6h | 📋 Todo | Sprint 2 | [spec](tasks/todo/medium-priority/004-add-version.md) |
| 007 | Delete Operations | 3-4h | 📋 Todo | Sprint 2 | [spec](tasks/todo/medium-priority/007-delete-operations.md) |
| 006 | User Preferences | 2-3h | 📋 Todo | Sprint 3 | [spec](tasks/todo/medium-priority/006-user-preferences.md) |
| 005 | Custom SVG Icons | 2-3h | 📋 Todo | Sprint 3 | [spec](tasks/todo/medium-priority/005-custom-svg-icons.md) |

**Sprint 2 Focus (Oct 25-31):** Complete high-priority CRUD operations
- Context Menus (4-6h)
- Add Version (4-6h)
- Delete Operations (3-4h)
- **Total:** 11-16 hours

**Sprint 3 Focus (Nov 1-7):** Polish and preferences
- User Preferences (2-3h)
- Custom SVG Icons (2-3h)
- **Total:** 4-6 hours

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
- **Completed:** 2 (20%)
- **High Priority:** 1 remaining
- **Medium Priority:** 4 remaining
- **Low Priority:** 3 deferred

**Estimated Remaining Effort:** 15-22 hours (2-3 weeks)

---

### 📋 Phase 3: Editor Integration (NEXT MAJOR PHASE)

**Duration:** 3-4 weeks
**Status:** 📋 Planned
**Prerequisites:** Complete UX Improvements (tasks 003-007)
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

### Sprint 2 (Oct 25-31) - 🚧 CURRENT

**Goal:** Complete high-priority CRUD operations

**Planned Tasks:**
- [ ] Task 003: Context Menus (4-6h)
- [ ] Task 004: Add Version Command (4-6h)
- [ ] Task 007: Delete Operations (3-4h)

**Total Effort:** 11-16 hours

**Success Criteria:**
- All high-priority tasks complete
- Context menus working for all node types
- Can create versions and delete items
- All operations tested manually

**Deliverables:**
- Context menu implementation
- Add version wizard
- Delete commands with confirmations
- Updated documentation

---

### Sprint 3 (Nov 1-7) - 📋 PLANNED

**Goal:** Polish and user preferences

**Planned Tasks:**
- [ ] Task 006: User Preferences (2-3h)
- [ ] Task 005: Custom SVG Icons (2-3h)

**Total Effort:** 4-6 hours

**Success Criteria:**
- User preferences configurable
- Custom SVG icons integrated
- All medium-priority tasks complete
- UX improvements phase complete

**Deliverables:**
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
| **Add Version** | Wizard | - | 📋 Planned | Task 004 |
| **Delete** | With confirm | - | 📋 Planned | Task 007 |
| **Edit Metadata** | Dedicated UI | - | ⏸️ Deferred | Task 010 |
| **Context Menus** | Full | - | 📋 Planned | Task 003 |
| **User Prefs** | 8 settings | - | 📋 Planned | Task 006 |
| **Open/Preview** | Swagger view | - | 📋 Phase 3 | - |
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

### M3: UX Improvements High Priority 📋
**Target:** Oct 31, 2025
**Deliverables:**
- Search command ✅
- Create artifact ✅
- Context menus 📋
- Add version 📋
- Delete operations 📋

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

**UX Improvements:** 🚧 20%
- ✅ Search (20%)
- ✅ Create Artifact (20%)
- 📋 Context Menus (0%)
- 📋 CRUD Operations (0%)
- 📋 Preferences (0%)

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
- UX Sprint 1: 8 hours

**Remaining:**
- UX Sprint 2-3: 15-22 hours (2-3 weeks)
- Phase 3: 120-160 hours (3-4 weeks)
- Phase 4: 80-120 hours (2-3 weeks)

**Total Project:** ~430-530 hours (11-13 weeks)

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

### Immediate (This Week)

1. **Start Sprint 2**
   - Begin Task 003 (Context Menus)
   - Review implementation specs
   - Set up development environment

2. **Documentation**
   - Update TODO.md weekly
   - Document design decisions
   - Keep task specs current

### Week 2 (Oct 28-31)

1. **Complete Sprint 2**
   - Finish context menus
   - Implement add version
   - Add delete operations
   - Test all CRUD workflows

2. **Plan Sprint 3**
   - Review user preferences spec
   - Prepare SVG icon migration
   - Final UX polish checklist

### Week 3-4 (Nov 1-14)

1. **Complete UX Improvements**
   - Finish Sprint 3
   - Comprehensive testing
   - Update all documentation
   - UX improvements retrospective

2. **Prepare Phase 3**
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

**Current Focus:** Sprint 2 - Complete high-priority CRUD operations

**Success Path:**
```
Sprint 1 ✅ → Sprint 2 🚧 → Sprint 3 → Phase 3 → Phase 4 → Release
```

This phased, sprint-based approach ensures:
- ✅ Incremental value delivery
- ✅ Risk management through iteration
- ✅ User feedback integration
- ✅ Reference plugin parity
- ✅ Superior architecture and UX

---

**Document Version:** 1.0
**Last Updated:** 2025-10-24
**Next Review:** 2025-10-31 (End of Sprint 2)
**Owner:** Development Team

**Related Documents:**
- [VSCODE_PLUGIN_PLAN.md](VSCODE_PLUGIN_PLAN.md) - Original 4-phase plan
- [UX_COMPARISON.md](UX_COMPARISON.md) - Reference plugin analysis
- [TODO.md](TODO.md) - Current task tracking
- [tasks/](tasks/) - Detailed task specifications
