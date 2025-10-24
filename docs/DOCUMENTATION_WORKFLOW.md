# Documentation Workflow Guide

**Purpose:** How to maintain TODO.md and MASTER_PLAN.md as single source of truth

> 📘 **Cursor Rules:** See [.cursorrules](../.cursorrules) for automated enforcement

---

## Overview

This project uses a **documentation-first approach** where:
- **TODO.md** = Daily quick reference (what to do today)
- **MASTER_PLAN.md** = Strategic overview (complete roadmap)
- **tasks/** = Detailed specifications (how to implement)

**Rule:** Documentation is ALWAYS updated before moving to next task.

---

## Daily Workflow

### 1. Morning Start

```bash
# 1. Open TODO.md
1. Check "What to Work on TODAY" section
2. Click task spec link
3. Read full task specification

# 2. Create feature branch
git checkout main
git pull origin main
git checkout -b task/XXX-short-name

# 3. Start coding
```

**Claude will ask:**
> "Ready to start task XXX?
>
> **Git setup:**
> - Branch name: `task/XXX-short-description`
> - Commands ready to run
>
> **Documentation:**
> - Update TODO.md 'What to Work on TODAY'?
>
> Shall we proceed?"

### 2. During Work

```bash
# As you work
1. Document decisions in task spec file
2. Note any blockers discovered
3. Update implementation notes
```

**Claude will:** Proactively document architectural decisions

### 3. Task Completion

```bash
# STOP - Complete workflow before next task

# 1. Run all tests
npm run test
npm run lint
npm run compile

# 2. Update documentation
# - Move task file to completed/
# - Update TODO.md
# - Update MASTER_PLAN.md (if milestone)

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

**Claude will ask:**
> "Task XXX complete! Let's finalize:
>
> **1. Test Results:**
> - npm run test: [status]
> - npm run lint: [status]
> - npm run compile: [status]
>
> **2. Documentation Updates:**
> - Task file: Move to completed/
> - TODO.md: Update progress
> - MASTER_PLAN.md: [if milestone]
>
> **3. Git Workflow:**
> - Commit all changes
> - Merge to main (only if tests pass ✅)
> - Delete feature branch
>
> Ready to proceed?"

**Complete Checklist:**
- [ ] All tests passing (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compiles (`npm run compile`)
- [ ] Manual testing completed
- [ ] Task file moved: `tasks/todo/` → `tasks/completed/`
- [ ] Added "Lessons Learned" to task file
- [ ] Updated TODO.md "Recently Completed"
- [ ] Updated TODO.md "What to Work on TODAY"
- [ ] Updated TODO.md progress bars
- [ ] Added entry to TODO.md "Recent Activity Log"
- [ ] Updated MASTER_PLAN.md (if milestone reached)
- [ ] All changes committed to feature branch
- [ ] Merged to main (tests passed)
- [ ] Feature branch deleted

---

## Weekly Review (Every Friday)

**Claude will remind:** "It's Friday - weekly documentation review time!"

### Checklist

**TODO.md Updates:**
- [ ] Update all progress bars
- [ ] Review Quick Stats (update estimates)
- [ ] Update "Recent Activity Log" with week summary
- [ ] Verify "Coming Up" section is accurate
- [ ] Update completion percentages

**MASTER_PLAN.md Updates:**
- [ ] Update current sprint section
- [ ] Review milestone progress
- [ ] Update risk management
- [ ] Update "Next Actions"
- [ ] Document any strategic decisions

**Planning:**
- [ ] Review velocity (actual vs. planned)
- [ ] Adjust next week's estimates if needed
- [ ] Identify blockers
- [ ] Plan next sprint if approaching boundary

---

## Sprint Workflow

### Sprint Start (Monday)

**Update TODO.md:**
```markdown
## 🚧 Current Sprint (Sprint X: [dates])

**Goal:** [Sprint goal]
**Focus:** [Main focus area]
**Effort:** [Total estimated hours]

| # | Task | Priority | Effort | Status | Action |
|---|------|----------|--------|--------|--------|
| XXX | Task Name | 🔴 High | Xh | 📋 **Now** | [Start](link) |
...
```

**Update MASTER_PLAN.md:**
- Sprint Planning section
- Sprint X goals and tasks
- Success criteria

### Sprint End (Friday)

**Sprint Retrospective:**
1. Review completed tasks
2. Calculate actual velocity
3. Document lessons learned
4. Update sprint sections in both files

**Update TODO.md:**
- Move sprint to "Recently Completed"
- Clear for next sprint
- Update velocity

**Update MASTER_PLAN.md:**
- Mark sprint complete
- Update milestone progress
- Document sprint outcomes

---

## When to Update What

### TODO.md (Frequent Updates)

**Daily:**
- "What to Work on TODAY" - Every task start
- "Recent Activity Log" - Every task completion
- "Current Sprint" status - Every status change

**Weekly:**
- All progress bars
- Quick Stats
- Completion estimates

**Sprint Boundaries:**
- Current Sprint section
- Recently Completed section
- Velocity

### MASTER_PLAN.md (Strategic Updates)

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

### Task Files (Continuous)

**During Implementation:**
- Implementation notes
- Design decisions
- Blockers encountered

**At Completion:**
- Lessons Learned section
- Issues Resolved
- Future Enhancements
- Testing results

---

## Update Templates

### Task Completion

```markdown
**TODO.md:**
✅ Move to "Recently Completed":
| XXX | Task Name | Xh | YYYY-MM-DD | Phase/Sprint |

✅ Update "What to Work on TODAY":
**Current Task:** **YYY - Next Task** 📋 **START HERE**

✅ Update progress:
- Overall: 30% → 35%
- High Priority: 67% → 100%

✅ Add activity log:
### YYYY-MM-DD
- ✅ Completed Task XXX: Task Name (Xh)
- 📝 Key learning: [insight]

**Task File:**
✅ Move: tasks/todo/high-priority/XXX.md → tasks/completed/XXX.md

✅ Add sections:
## Lessons Learned
- [What worked well]
- [What to improve]

## Issues Resolved
- [Issue]: [Solution]
```

### Weekly Review

```markdown
## Weekly Review - Week of [Date]

**Completed This Week:**
- Task XXX: Name (Xh)
- Task YYY: Name (Xh)
Total: Xh (Velocity: Xh/week)

**Progress Updates:**
- Overall project: XX% → YY%
- Current phase: XX% → YY%
- Sprint completion: XX% → YY%

**Milestones:**
- [Milestone]: XX% complete (target: [date])

**Blockers:**
- [Blocker]: [Status/Resolution]

**Next Week Plan:**
- Task ZZZ: Focus for next week
- Estimated effort: Xh

**Adjustments:**
- [Any estimate adjustments]
- [Any priority changes]
```

---

## Claude's Documentation Responsibilities

### Proactive Prompts

Claude WILL automatically:

✅ **At task completion:**
> "Task XXX complete! Let's update documentation:
> 1. Move task file to completed/
> 2. Update TODO.md (here's the diff)
> 3. Update MASTER_PLAN.md (milestone reached!)
> Shall I proceed?"

✅ **At task start:**
> "Starting task XXX. Should we update TODO.md 'What to Work on TODAY'?"

✅ **Weekly reminder:**
> "It's Friday - weekly review time! Here's our progress this week..."

✅ **Sprint boundaries:**
> "Sprint X ends Friday. Let's prepare the retrospective."

✅ **Architectural decisions:**
> "This decision affects the strategy. I'll document it in MASTER_PLAN.md."

### Verification

Claude WILL verify:
- [ ] All required sections updated
- [ ] Percentages calculated correctly
- [ ] Dates are accurate
- [ ] Links work
- [ ] Consistency across documents

---

## Common Scenarios

### Scenario 1: Just Finished a Task

**You:** "I'm done with task 003!"

**Claude:**
> "Excellent! Task 003 (Context Menus) complete. Let's update documentation together:
>
> **TODO.md updates needed:**
> - Move 003 to Recently Completed
> - Update progress: High Priority 67% → 100%
> - Update "What to Work on TODAY" to Task 004
> - Add activity log entry
>
> **Task file:**
> - Move: tasks/todo/high-priority/003.md → tasks/completed/003.md
> - Add lessons learned section
>
> **MASTER_PLAN.md:**
> - Milestone M3 reached (100%)!
> - Update sprint progress
>
> Ready to proceed with these updates?"

### Scenario 2: Friday Review

**Claude (automatic):**
> "It's Friday! Time for weekly documentation review.
>
> **This week's progress:**
> - Completed: Tasks 003, 004, 007 (12h)
> - Sprint 2: 100% complete! 🎉
> - Overall project: 30% → 50%
>
> **Updates needed:**
> - TODO.md: Progress bars, velocity, sprint section
> - MASTER_PLAN.md: Milestone M3 complete, Sprint 2 retro
>
> Shall we do the review together?"

### Scenario 3: Discovered a Blocker

**You:** "I can't implement the webview, there's an issue with CSP"

**Claude:**
> "Let me document this blocker:
>
> 1. **Task file update:**
>    - Add to Issues section
>    - Note CSP problem and investigation
>
> 2. **TODO.md update:**
>    - Add to Recent Activity Log
>    - Note blocker status
>
> 3. **MASTER_PLAN.md update:**
>    - Add to Risk Management
>    - Update Phase 3 timeline if needed
>
> Should I create these updates?"

---

## Quality Checks

### Before Ending Work Session

- [ ] All code changes committed
- [ ] TODO.md reflects current state
- [ ] Task status is accurate
- [ ] Activity log is current
- [ ] Next task is clear
- [ ] No broken links in docs

### Before Marking Task Complete

- [ ] Task file in completed/ folder
- [ ] Lessons learned documented
- [ ] TODO.md updated
- [ ] Progress percentages recalculated
- [ ] MASTER_PLAN.md updated (if needed)
- [ ] Git commit with proper message

---

## Benefits of This Workflow

✅ **Always know what to work on** - TODO.md "What to Work on TODAY"
✅ **Never lose progress** - All updates documented
✅ **Learn from experience** - Lessons learned captured
✅ **Track velocity** - Improve estimates
✅ **Share knowledge** - Documentation helps team
✅ **Reduce context switching** - Everything in one place
✅ **Better planning** - Data-driven decisions

---

## Tools and Automation

### Cursor Rules (.cursorrules)

The `.cursorrules` file automates:
- Proactive update prompts
- Consistency checks
- Update templates
- Quality verification

### Git Hooks (Optional)

Consider adding:
```bash
# pre-commit hook
# Verify TODO.md and MASTER_PLAN.md are current
```

---

## Troubleshooting

### "I forgot to update TODO.md"

**Solution:**
1. Check Recent Activity Log - what was last entry?
2. Review git commits - what was completed?
3. Update now based on actual state
4. Claude can help reconstruct if needed

### "Progress percentages seem wrong"

**Solution:**
1. Count completed vs total tasks
2. Recalculate: (completed / total) × 100
3. Update all affected sections
4. Verify in MASTER_PLAN.md matches TODO.md

### "Task file in wrong folder"

**Solution:**
1. Move to correct folder based on status
2. Update TODO.md to reflect correct location
3. Verify links still work

---

## Summary

**Remember:**
1. 📋 **TODO.md** - Update daily, your dashboard
2. 📘 **MASTER_PLAN.md** - Update weekly/strategically
3. 📝 **Task files** - Update continuously

**Golden Rule:**
> Documentation updates are PART of task completion, not separate work.

**Claude's Role:**
> Proactive partner in maintaining documentation accuracy and consistency.

---

**Last Updated:** 2025-10-24
**Maintained By:** Development Team
**Enforced By:** `.cursorrules` automation
