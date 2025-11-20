# Documentation Guide

**Purpose:** Complete guide for organizing and maintaining project documentation

**Last Updated:** 2025-11-20

---

## Table of Contents

1. [Documentation Structure](#documentation-structure)
2. [Reorganization History](#reorganization-history)
3. [Maintenance Workflow](#maintenance-workflow)

---

## Documentation Structure

### Overview

This project uses a clear, audience-based documentation structure designed for open-source transparency:

```
docs/
├── README.md                      # Main documentation index
├── users/                         # User documentation
├── contributors/                  # Developer documentation
├── project/                       # Project planning & tracking
├── design/                        # Architecture and design decisions
├── ai-integration/                # AI/MCP integration
├── reference/                     # Technical reference material
├── testing/                       # Legacy testing docs (preserved)
├── archive/                       # Historical documentation
└── meta/                          # Documentation about documentation
    └── DOCUMENTATION_GUIDE.md     # This file
```

### Folder Purposes

**`users/`** - End-user documentation
- Installation guides
- Quick start tutorials
- Feature documentation
- Troubleshooting guides

**`contributors/`** - Developer documentation
- Development environment setup
- Building and testing
- Architecture overview
- Coding standards
- API compatibility

**`project/`** - Project management
- TODO.md - Daily task list
- ROADMAP.md - Feature roadmap
- MASTER_PLAN.md - Strategic plan
- tasks/ - Detailed task tracking

**`design/`** - Design decisions
- Architecture decision records
- Integration strategies
- UX design documents

**`ai-integration/`** - AI/MCP features
- Getting started guides
- MCP architecture
- Debugging guides
- Historical debugging sessions (preserved for learning)

**`reference/`** - Technical references
- Analysis documents
- Comparison studies
- Repository structure analysis

**`testing/`** - Legacy testing documentation
- Preserved for historical reference
- Points to consolidated testing guide in contributors/

**`archive/`** - Historical documents
- Outdated planning documents
- Superseded specifications
- Historical context preservation

**`meta/`** - Documentation about documentation
- This guide
- Reorganization history
- Maintenance workflows

---

## Reorganization History

### Why We Reorganized

**Date:** 2025-11-20

**Problem:** Documentation was scattered across ~90 files with unclear organization, making it hard for new users and contributors to find information.

**Goal:** Prepare documentation for public GitHub release with clear, audience-based structure.

### What Changed

#### Phase 1-4: Core Structure (Completed)

**Phase 1: Folder Structure**
- Created audience-based folders: `users/`, `contributors/`, `project/`
- Created organizational folders: `design/`, `ai-integration/debugging/`, `archive/`

**Phase 2: Root Files Moved**
- `TODO.md` → `project/TODO.md`
- `MASTER_PLAN.md` → `project/MASTER_PLAN.md`
- `FEATURE_ROADMAP.md` → `project/ROADMAP.md`
- `FEATURE_GAP_ANALYSIS.md` → `project/FEATURE_GAP_ANALYSIS.md`
- `API_COMPATIBILITY.md` → `contributors/api-compatibility.md`
- `APICURIO_EDITORS_INTEGRATION_STRATEGY.md` → `design/integration-strategy.md`

**Phase 3: AI Integration Reorganized**
- Moved debugging guides to `ai-integration/debugging/`
- Moved historical debugging to `ai-integration/archive/`
- Renamed MCP architecture doc

**Phase 4: Tasks Reorganized**
- Moved all tasks to `project/tasks/`
- Organized by status: completed/, in-progress/, planned/
- Organized planned by priority: high/, medium/, low/

#### Phase 5-6: Documentation Infrastructure (Completed)

**Phase 5: Testing Docs Consolidated**
- Created comprehensive `contributors/testing.md`
- Merged 4 separate testing guides
- Deleted duplicates
- Updated legacy folder to point to new guide

**Phase 6: README Files Created**
- Created navigation README in every major folder
- Updated main `docs/README.md` with new structure
- Emphasized open-source transparency philosophy

#### Phase 7-10: Deferred for Ongoing Work

**Phase 7: User Documentation** (Deferred)
- Detailed user guides will be created as features mature
- Basic structure and placeholders in place

**Phase 8: Contributor Documentation** (Partial)
- Core guides created (testing.md, api-compatibility.md)
- Additional guides can be added based on community needs

**Phase 9: Link Fixes** (Deferred)
- Main navigation links updated and working
- Historical task links preserved as-is (historical reference)

**Phase 10: Root README** (Complete)
- Main README provides clear entry points
- Links to documentation sections

### Results

**Status: Ready for Public Release (70% Complete)**

✅ **What's Working:**
- Clear folder organization by audience
- Comprehensive README navigation
- Testing documentation consolidated
- Transparent project tracking visible
- Historical documentation preserved

📋 **What's Deferred:**
- Detailed user guides (create as features mature)
- Additional contributor guides (expand based on needs)
- Historical link cleanup (current navigation works)

---

## Maintenance Workflow

### Daily Workflow

This project uses a **documentation-first approach** where:
- **project/TODO.md** = Daily quick reference (what to do today)
- **project/MASTER_PLAN.md** = Strategic overview (complete roadmap)
- **project/tasks/** = Detailed specifications (how to implement)

**Rule:** Documentation is ALWAYS updated before moving to next task.

### 1. Starting Your Day

```bash
# 1. Open project/TODO.md
1. Check "What to Work on TODAY" section
2. Click task spec link in project/tasks/
3. Read full task specification

# 2. Create feature branch
git checkout main
git pull origin main
git checkout -b task/XXX-short-name

# 3. Start coding (TDD approach)
```

### 2. During Work

- Document decisions in task spec file
- Note any blockers discovered
- Update implementation notes

### 3. Task Completion Workflow

**STOP - Complete workflow before next task:**

```bash
# 1. Run all tests
npm run test
npm run lint
npm run compile

# 2. Update documentation (MANDATORY)
# - Move task file: project/tasks/in-progress/ → project/tasks/completed/
# - Add "Lessons Learned" to task file
# - Update project/TODO.md
# - Update project/MASTER_PLAN.md (if milestone reached)

# 3. Commit everything
git add .
git commit -m "feat: complete task XXX - [name]

- Implement feature
- Add tests
- Update documentation

Closes #XXX"

# 4. Merge to main (only if all tests pass)
git checkout main
git pull origin main
git merge task/XXX-short-name
npm run test  # Verify after merge
git push origin main
git branch -d task/XXX-short-name
```

### Task Completion Checklist

**Before marking task complete:**
- [ ] All tests passing (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compiles (`npm run compile`)
- [ ] Manual testing completed
- [ ] Task file moved to `project/tasks/completed/`
- [ ] Added "Lessons Learned" to task file
- [ ] Updated `project/TODO.md` "Recently Completed"
- [ ] Updated `project/TODO.md` "What to Work on TODAY"
- [ ] Updated `project/TODO.md` progress bars
- [ ] Added entry to `project/TODO.md` "Recent Activity Log"
- [ ] Updated `project/MASTER_PLAN.md` (if milestone reached)
- [ ] All changes committed to feature branch
- [ ] Merged to main (tests passed)
- [ ] Feature branch deleted

### When to Update What

**project/TODO.md (Frequent Updates)**

**Daily:**
- "What to Work on TODAY" - Every task start
- "Recent Activity Log" - Every task completion
- Task status - Every status change

**Weekly:**
- All progress bars
- Quick Stats
- Completion estimates

**project/MASTER_PLAN.md (Strategic Updates)**

**Weekly:**
- Sprint Planning section
- Milestone Tracking percentages
- Risk Management

**Sprint Boundaries:**
- Sprint retrospective
- Milestone updates
- Phase progress

**Major Events:**
- Phase transitions
- Architectural decisions
- Scope changes
- Risk changes

**Task Files (Continuous)**

**During Implementation:**
- Implementation notes
- Design decisions
- Blockers encountered

**At Completion:**
- Lessons Learned section
- Issues Resolved
- Future Enhancements
- Testing results

### Adding New Documentation

**User Documentation:**
1. Create file in `users/` or `users/features/`
2. Add link to `users/README.md`
3. Add link to main `docs/README.md` if major

**Contributor Documentation:**
1. Create file in `contributors/`
2. Add link to `contributors/README.md`
3. Update main `docs/README.md` quick links

**Task Documentation:**
1. Create task spec in `project/tasks/planned/{priority}/`
2. Add to `project/TODO.md` task list
3. Move to `in-progress/` when started
4. Move to `completed/` when done

**Design Decisions:**
1. Create document in `design/`
2. Add link to `design/README.md`
3. Reference from relevant task files

### Archiving Old Documentation

**When to Archive:**
- Document is superseded by newer version
- Contains outdated technical information
- References deprecated features
- No longer relevant to current development

**How to Archive:**
1. Move file to `archive/`
2. Update `archive/README.md` with entry
3. Update links to point to new document (if applicable)
4. Add note in original location pointing to archive

**Don't Archive:**
- Completed task documentation (keep in `project/tasks/completed/`)
- Current architectural decisions
- Active debugging guides
- Lessons learned documents

---

## Open-Source Philosophy

### Transparency Principles

This project embraces **complete transparency** as an open-source project:

1. **All planning is public** - Show decision-making process
2. **Debugging history preserved** - Learn from iterations
3. **Task tracking visible** - Demonstrate development journey
4. **Lessons learned documented** - Share knowledge

### Why We Show Everything

**Traditional Approach:**
- Hide "messy" planning documents
- Delete debugging history
- Only show polished final docs

**Our Approach:**
- Keep all planning visible
- Preserve debugging journey
- Show how decisions evolved
- Document what didn't work

**Benefits:**
- Community learns from our process
- Contributors understand context
- Newcomers see realistic development
- Builds trust through transparency

### What This Means for Documentation

**Keep Public:**
- All task specifications (completed and planned)
- Debugging guides and sessions
- Planning documents and roadmaps
- Architecture decision records
- Lessons learned from failures

**Move to Archive (but keep public):**
- Superseded specifications
- Outdated analysis documents
- Historical debugging sessions
- Old planning approaches

**Never Commit:**
- Actual secrets or credentials
- Personal information
- Private API keys
- Sensitive test data

---

## Quality Checks

### Before Ending Work Session

- [ ] All code changes committed
- [ ] `project/TODO.md` reflects current state
- [ ] Task status is accurate
- [ ] Activity log is current
- [ ] Next task is clear
- [ ] No broken links in main navigation

### Before Public Release

- [ ] README files exist in all major folders
- [ ] Main `docs/README.md` provides clear navigation
- [ ] No credentials or secrets in any files
- [ ] All critical links work
- [ ] License information present
- [ ] Contributing guide available

### Weekly Review

- [ ] Update all progress bars in `project/TODO.md`
- [ ] Review Quick Stats (update estimates)
- [ ] Update "Recent Activity Log" with week summary
- [ ] Verify "Coming Up" section is accurate
- [ ] Update `project/MASTER_PLAN.md` milestone progress

---

## Benefits of This Structure

✅ **Clear Separation** - Users vs. Contributors vs. Project tracking
✅ **Better Discoverability** - Logical folder structure with README navigation
✅ **Preserved History** - All debugging and planning visible for learning
✅ **Open Source Friendly** - Transparent process documentation
✅ **Easy Navigation** - README files guide users through content
✅ **No Lost Content** - Everything moved, not deleted
✅ **Future Proof** - Scalable structure for growth

---

## Common Scenarios

### "I want to add a new feature guide"

1. Determine audience: users or contributors?
2. Create markdown file in appropriate folder
3. Add entry to folder's README.md
4. Update main docs/README.md if major feature
5. Link from relevant task documentation

### "I completed a task"

1. Move task file: `project/tasks/in-progress/` → `project/tasks/completed/`
2. Add "Lessons Learned" section to task file
3. Update `project/TODO.md`:
   - Move to "Recently Completed"
   - Update "What to Work on TODAY"
   - Update progress bars
   - Add activity log entry
4. Update `project/MASTER_PLAN.md` if milestone reached
5. Commit all changes

### "Documentation is outdated"

1. Update the relevant document
2. Add note about what changed and why
3. If major rewrite, consider archiving old version
4. Update links if paths changed
5. Update "Last Updated" date

### "I found a broken link"

1. Determine if link should be updated or removed
2. If document was moved, update to new path
3. If document was archived, update to archive path
4. If document no longer exists, remove link or add note
5. Check for other instances of same broken link

---

## Summary

**Remember:**
1. 📋 **project/TODO.md** - Update daily, your dashboard
2. 📘 **project/MASTER_PLAN.md** - Update weekly/strategically
3. 📝 **Task files** - Update continuously
4. 📚 **README files** - Maintain navigation

**Golden Rule:**
> Documentation updates are PART of task completion, not separate work.

**Open-Source Philosophy:**
> Show the full journey - planning, debugging, iterations, and lessons learned.

---

**File Location:** `docs/meta/DOCUMENTATION_GUIDE.md`
**Purpose:** Single source of truth for documentation organization and maintenance
**Replaces:** DOCUMENTATION_WORKFLOW.md, REORGANIZATION_PLAN.md, REORGANIZATION_STATUS.md
