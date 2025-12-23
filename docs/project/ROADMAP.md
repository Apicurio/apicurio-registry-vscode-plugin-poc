# Feature Parity Roadmap

**Date:** 2025-11-05
**Status:** Active Planning
**Based On:** FEATURE_GAP_ANALYSIS.md

---

## Executive Summary

This roadmap outlines the path to feature parity between the Apicurio Registry VSCode Extension and the Web UI. The plan is organized into 4 phases over approximately 18-24 weeks, with the Visual Editor work explicitly deferred to the final phase.

**Total Estimated Effort:** 80-110 hours
**Target Completion:** Q2 2025
**Current Phase:** Phase 1 (Core Operations)

---

## Roadmap Phases

### Phase 1: Core Operations (HIGH Priority)
**Duration:** 8-12 weeks
**Effort:** 15-20 hours
**Goal:** Essential features for day-to-day registry operations

#### Features

##### 1.1 Advanced Search (2-3h) 🔴 CRITICAL
- **Gap:** Single-criterion search only
- **Target:** Multi-field search with label filtering
- **Tasks:**
  - Implement multi-field search UI (QuickPick with multiple inputs)
  - Add label filtering support (key:value format)
  - Support version search (not just artifacts)
  - Add group search capability
  - Save search context for repeated searches
- **Success Criteria:**
  - Can search by multiple criteria simultaneously
  - Can filter by labels
  - Search results include versions and groups
  - Search limit respects user preference (Task 006 ✅)

##### 1.2 Label Management (4-6h) 🔴 CRITICAL
- **Gap:** Complete absence of label functionality
- **Target:** Full label support across all entity types
- **Tasks:**
  - Display labels in tree view tooltips
  - Add/edit/remove labels (key-value pairs)
  - Label validation (no duplicates)
  - Click label to filter (integration with search)
  - Label display in artifact/version/group details
- **Success Criteria:**
  - Labels visible in all tree nodes
  - Can add labels via command
  - Can edit existing labels
  - Can filter by labels
  - Label validation prevents duplicates

##### 1.3 Version Creation UI (3-4h) 🔴 CRITICAL
- **Gap:** Cannot create published versions directly
- **Target:** Create version wizard with content upload
- **Tasks:**
  - Multi-step wizard (metadata → content → confirmation)
  - Version metadata input (version, name, description, labels)
  - Content upload (file/URL/text input)
  - Content validation before creation
  - Auto-version generation option
- **Success Criteria:**
  - Can create version without drafts
  - Wizard follows VSCode UX patterns
  - Content validation works
  - Auto-version increments correctly

##### 1.4 Metadata Editing (6-9h) 🟡 MEDIUM
- **Gap:** Limited to draft metadata only
- **Target:** Edit metadata for all entity types
- **Tasks:**
  - Edit artifact metadata command (2-3h)
  - Edit version metadata command (2-3h)
  - Edit group metadata command (2-3h)
  - Inline editing UI (QuickInput or webview)
  - Metadata validation
- **Success Criteria:**
  - Can edit name, description, labels for all types
  - Changes persist correctly
  - Validation prevents invalid data
  - Tree view refreshes after edit

---

### Phase 2: Advanced Features (MEDIUM Priority)
**Duration:** 6-8 weeks
**Effort:** 18-26 hours
**Goal:** Power user features for advanced workflows

#### Features

##### 2.1 Rules Configuration (6-8h) 🟡 MEDIUM
- **Gap:** Complete absence of rule functionality
- **Target:** View and configure validation rules
- **Tasks:**
  - View global rules
  - View group rules
  - View artifact rules
  - Enable/disable rules UI
  - Configure rule settings (validity, compatibility, integrity)
  - Rule violation display in error messages
- **Success Criteria:**
  - Can view rules at all levels
  - Can enable/disable rules
  - Can configure rule settings
  - Rule violations shown clearly

##### 2.2 Group Management (2-3h) 🟡 MEDIUM
- **Gap:** Can only delete groups, not create/edit
- **Target:** Full group lifecycle management
- **Tasks:**
  - Create group wizard
  - Edit group metadata (reuse from 1.4)
  - Delete group (existing ✅)
  - Group-level rules (integration with 2.1)
- **Success Criteria:**
  - Can create groups with metadata
  - Can edit group properties
  - Can configure group rules
  - Deletion confirms cascade

##### 2.3 Branching Support (8-10h) 🟡 MEDIUM
- **Gap:** Complete absence of branching
- **Target:** Full branch lifecycle management
- **Tasks:**
  - Create branch UI
  - Add/remove versions from branch
  - View branch details
  - Branch listing in tree view
  - Semantic versioning configuration
  - Branch operations (replace, delete)
- **Success Criteria:**
  - Can create branches
  - Can manage versions in branches
  - Can view branch metadata
  - Semantic versioning works

##### 2.4 Enhanced Tree View (2-5h) 🟡 MEDIUM
- **Gap:** Limited visual indicators and metadata
- **Target:** Rich tree view with full metadata display
- **Tasks:**
  - Enhanced tooltips with all metadata
  - Progressive disclosure (expand for details)
  - Quick actions (inline buttons)
  - Sort/filter options in tree
  - Tree view customization preferences
- **Success Criteria:**
  - Tooltips show all relevant metadata
  - Inline actions available
  - Tree is sortable/filterable
  - Preferences control display

---

### Phase 3: Admin & Utility Features (LOW Priority)
**Duration:** 4-6 weeks
**Effort:** 12-20 hours
**Goal:** Administrative operations and bulk actions

#### Features

##### 3.1 Import/Export (4-6h) 🟢 LOW
- **Gap:** No bulk operations
- **Target:** Bulk import/export of artifacts
- **Tasks:**
  - Import from ZIP
  - Export to ZIP
  - Export individual artifacts (existing ✅)
  - Progress indicators
  - Import conflict resolution
- **Success Criteria:**
  - Can import ZIP files
  - Can export all artifacts
  - Progress shown for long operations
  - Conflicts handled gracefully

##### 3.2 Role Management (4-6h) 🔵 FUTURE
- **Gap:** Admin operations require web UI
- **Target:** RBAC management in VSCode
- **Tasks:**
  - View role mappings
  - Grant/revoke access
  - Update role assignments
  - Admin-only UI restrictions
- **Success Criteria:**
  - Can view roles
  - Can assign roles
  - Admin features restricted appropriately

##### 3.3 Settings/Configuration (6-8h) 🔵 FUTURE
- **Gap:** Configuration requires web UI
- **Target:** Registry configuration in VSCode
- **Tasks:**
  - List configuration properties
  - Search properties
  - Edit properties inline
  - Grouped by category
  - Type-specific inputs
- **Success Criteria:**
  - Can view all properties
  - Can search properties
  - Can edit values
  - Changes persist

##### 3.4 Additional Features (6-10h) 🔵 FUTURE
- Client code generation (4-6h)
- Comments on versions (3-4h)
- Reference visualization (3-4h)
- Ownership management (2h)

---

### Phase 4: Visual Editor (DEFERRED - Final Phase)
**Duration:** 8-10 weeks
**Effort:** 35-45 hours
**Goal:** Rich visual editing experience for OpenAPI/AsyncAPI

**NOTE:** Per explicit user request, Visual Editor work is deferred to the end of the roadmap.

#### Features

##### 4.1 OpenAPI Visual Editor (15-20h)
- **Gap:** Text editing only
- **Target:** Visual OpenAPI editor
- **Tasks:**
  - Webview-based visual editor
  - Schema designer UI
  - Path/operation editor
  - Parameter editor
  - Response editor
  - Integration with Apicurio Editors URL
- **Success Criteria:**
  - Can edit OpenAPI visually
  - Changes sync with text view
  - Validation in real-time

##### 4.2 AsyncAPI Visual Editor (15-20h)
- **Gap:** Text editing only
- **Target:** Visual AsyncAPI editor
- **Tasks:**
  - Channel editor
  - Message editor
  - Server configuration UI
  - Binding editor
  - Integration with Apicurio Editors URL
- **Success Criteria:**
  - Can edit AsyncAPI visually
  - Changes sync with text view
  - Validation in real-time

##### 4.3 Editor Integration & Polish (5-10h)
- **Gap:** Limited editor features
- **Target:** Full editor experience
- **Tasks:**
  - Format/beautify option
  - Compare current vs original
  - Real-time validation feedback
  - Quick fixes
  - Content type detection
- **Success Criteria:**
  - Formatting works
  - Diff view available
  - Validation shown inline

---

## Implementation Strategy

### Prioritization Principles

1. **High Priority (🔴):** Frequently used, core functionality
2. **Medium Priority (🟡):** Important but not critical
3. **Low Priority (🟢):** Nice to have, less frequent use
4. **Future (🔵):** Advanced features, admin-only, niche use cases

### Quality Standards

**Testing:**
- TDD approach (RED-GREEN-REFACTOR)
- 80%+ test coverage for new code
- 100% coverage for critical paths
- Manual testing in Extension Development Host

**Documentation:**
- Update FEATURE_GAP_ANALYSIS.md as features complete
- Update TODO.md with progress
- Document UI patterns and decisions
- Add lessons learned to task files

**User Experience:**
- Consistent with VSCode conventions
- Keyboard shortcuts for common actions
- Quick access via command palette
- Helpful error messages
- Accessibility compliance

### Development Workflow

**For Each Feature:**
1. Create feature branch: `task/XXX-feature-name`
2. Write tests first (TDD RED phase)
3. Implement minimal code (TDD GREEN phase)
4. Refactor and improve (TDD REFACTOR phase)
5. Update documentation
6. Merge to main (tests passing)

**Git Workflow:**
- Never commit directly to main
- Always use feature branches
- Run tests before merging
- Keep branches short-lived (1-2 days)

---

## Progress Tracking

### Phase 1: Core Operations (15-20h)
- [ ] Advanced Search (2-3h)
- [ ] Label Management (4-6h)
- [ ] Version Creation UI (3-4h)
- [ ] Metadata Editing - Artifact (2-3h)
- [ ] Metadata Editing - Version (2-3h)
- [ ] Metadata Editing - Group (2-3h)

**Progress:** 0% (0/15-20h complete)

### Phase 2: Advanced Features (18-26h)
- [ ] Rules Configuration (6-8h)
- [ ] Group Management (2-3h)
- [ ] Branching Support (8-10h)
- [ ] Enhanced Tree View (2-5h)

**Progress:** 0% (0/18-26h complete)

### Phase 3: Admin & Utility (12-20h)
- [ ] Import/Export (4-6h)
- [ ] Role Management (4-6h)
- [ ] Settings/Configuration (6-8h)
- [ ] Additional Features (6-10h)

**Progress:** 0% (0/12-20h complete)

### Phase 4: Visual Editor (35-45h) - IN PROGRESS
- [x] OpenAPI Visual Editor - Initial Integration (6-8h) ✅ COMPLETE
- [ ] OpenAPI Visual Editor - Advanced Features (remaining)
- [ ] AsyncAPI Visual Editor (15-20h)
- [ ] Editor Integration & Polish (5-10h)

**Progress:** ~20% (~6-8/35-45h complete) - STARTED (OpenAPI basic integration working)

---

## Timeline Estimate

**Start Date:** 2025-11-05 (today)

### Quarterly Breakdown

**Q1 2025 (Nov-Dec 2024):**
- Complete Phase 1 (Core Operations)
- Target: Advanced Search, Labels, Version Creation, Metadata Editing

**Q2 2025 (Jan-Mar 2025):**
- Complete Phase 2 (Advanced Features)
- Complete Phase 3 (Admin & Utility)
- Target: Rules, Branching, Import/Export

**Q3 2025 (Apr-Jun 2025):**
- Complete Phase 4 (Visual Editor) - DEFERRED
- Target: OpenAPI/AsyncAPI visual editors

**Completion Target:** June 2025 (with visual editor)
**Core Feature Parity:** March 2025 (without visual editor)

---

## Success Metrics

### Feature Parity Metrics
- **Current:** ~40% feature parity with Web UI
- **After Phase 1:** ~60% feature parity
- **After Phase 2:** ~75% feature parity
- **After Phase 3:** ~85% feature parity
- **After Phase 4:** ~95% feature parity

### Quality Metrics
- Test coverage: 80%+ for all new code
- TypeScript compilation: 0 errors
- Linting: 0 warnings
- Manual testing: All features tested in Extension Development Host

### User Experience Metrics
- Keyboard accessible: 100% of commands
- Command palette: All commands available
- Context menus: All operations accessible
- Error messages: Clear and actionable

---

## Risk Mitigation

### Technical Risks

**Risk:** VSCode API limitations for complex UI
- **Mitigation:** Use webviews for advanced editors
- **Fallback:** Simplify UI to match VSCode patterns

**Risk:** Apicurio Registry API changes
- **Mitigation:** Version detection and compatibility checks
- **Fallback:** Maintain backward compatibility

**Risk:** Test complexity for UI components
- **Mitigation:** Mock VSCode APIs comprehensively
- **Fallback:** Manual testing protocols

### Schedule Risks

**Risk:** Features take longer than estimated
- **Mitigation:** Break tasks into smaller chunks
- **Fallback:** Defer low-priority features

**Risk:** User priorities change
- **Mitigation:** Maintain flexible roadmap
- **Fallback:** Re-prioritize based on feedback

---

## Dependencies

### External Dependencies
- VSCode Extension API (stable)
- Apicurio Registry API v3.1+ (stable)
- Apicurio Editors URL (for visual editors in Phase 4)

### Internal Dependencies
- Task 006 (User Preferences) ✅ COMPLETE
- Draft infrastructure (Tasks 011-014) ✅ COMPLETE
- Text editing (Tasks 015-017) ✅ COMPLETE
- API v3.1 compatibility (Task 008) ✅ COMPLETE

---

## Review & Adjustment

**Review Frequency:** Monthly
**Next Review Date:** 2025-12-05

**Review Criteria:**
- Progress vs. timeline
- Feature completeness
- Test coverage
- User feedback
- Priority adjustments

**Adjustment Process:**
1. Review completed features
2. Assess remaining effort
3. Adjust priorities based on feedback
4. Update timeline if needed
5. Document decisions in MASTER_PLAN.md

---

## Conclusion

This roadmap provides a clear path to feature parity with the Apicurio Registry Web UI while respecting the strategic decision to defer Visual Editor work to the final phase.

**Key Takeaways:**
- Focus on high-priority core operations first (Phase 1)
- Build advanced features incrementally (Phase 2)
- Add admin/utility features as needed (Phase 3)
- Visual editor work deferred to end (Phase 4)
- Maintain quality standards throughout
- Adjust based on user feedback and priorities

**Next Steps:**
1. Review and approve roadmap
2. Begin Phase 1: Advanced Search implementation
3. Update TODO.md with Phase 1 tasks
4. Create task specifications for Phase 1 features

---

**Document Version:** 1.0
**Next Review:** 2025-12-05
**Maintained By:** VSCode Extension Development Team
**Based On:** FEATURE_GAP_ANALYSIS.md v1.0
