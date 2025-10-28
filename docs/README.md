# Apicurio VSCode Plugin - Documentation

This directory contains all project documentation.

## 📋 Quick Start (Top-Level Files)

**Daily Use:**
- **[TODO.md](TODO.md)** - Your daily task list (check this every morning)
- **[MASTER_PLAN.md](MASTER_PLAN.md)** - Complete roadmap, strategy, and analysis

**Planning:**
- **[VSCODE_PLUGIN_PLAN.md](VSCODE_PLUGIN_PLAN.md)** - Original 4-phase vision
- **[DOCUMENTATION_WORKFLOW.md](DOCUMENTATION_WORKFLOW.md)** - How to maintain documentation

## 📁 Directory Structure

```
docs/
├── README.md                      ← You are here
├── TODO.md                        ← Daily task list
├── MASTER_PLAN.md                 ← Strategic roadmap
├── VSCODE_PLUGIN_PLAN.md          ← Original vision
├── DOCUMENTATION_WORKFLOW.md      ← Doc maintenance guide
│
├── tasks/                         ← Task specifications
│   ├── completed/                 ← ✅ Done (001, 002, 003)
│   ├── in-progress/              ← 🚧 Active work
│   └── todo/                      ← 📋 Pending tasks
│       ├── high-priority/
│       ├── medium-priority/
│       └── low-priority/
│
├── reference/                     ← Analysis & comparisons
│   ├── UX_COMPARISON.md           ← Reference plugin analysis
│   ├── EXISTING_PLUGIN_COMPARISON.md
│   ├── EVALUATION.md
│   └── REPOSITORY_STRUCTURE_ANALYSIS.md
│
├── testing/                       ← Testing guides
│   ├── AUTOMATED_TESTING_GUIDE.md
│   ├── TESTING_GUIDE.md
│   ├── TEST_SUMMARY.md
│   └── QUICK_TEST.md
│
├── archive/                       ← Historical documents
│   ├── phase2/                    ← Phase 2 implementation docs
│   ├── search-feature/            ← Task 001 implementation docs
│   ├── create-artifact-feature/   ← Task 002 implementation docs
│   ├── development.md             ← Old dev guide
│   ├── GIT_SETUP.md               ← Old git guide
│   └── UX_IMPROVEMENTS_TODO.md.old
│
└── prds/                          ← Product requirements (original)
```

## 🎯 Documentation by Purpose

### Daily Work
1. Start your day: Open **[TODO.md](TODO.md)**
2. Check what's in progress or what to work on next
3. Click task spec link to see implementation details

### Understanding the Project
1. **Big Picture:** Read [MASTER_PLAN.md](MASTER_PLAN.md)
2. **Original Vision:** Read [VSCODE_PLUGIN_PLAN.md](VSCODE_PLUGIN_PLAN.md)
3. **Why UX?** Read [reference/UX_COMPARISON.md](reference/UX_COMPARISON.md)

### Working on a Task
1. Read task spec in `tasks/todo/[priority]/XXX-task-name.md`
2. Follow TDD approach: RED → GREEN → REFACTOR
3. When done, move spec to `tasks/completed/`
4. Update TODO.md and MASTER_PLAN.md

### Testing
- **Unit Tests:** See [testing/AUTOMATED_TESTING_GUIDE.md](testing/AUTOMATED_TESTING_GUIDE.md)
- **Manual Tests:** See [testing/TESTING_GUIDE.md](testing/TESTING_GUIDE.md)
- **Quick Tests:** See [testing/QUICK_TEST.md](testing/QUICK_TEST.md)

### Reference & Research
- **UX Analysis:** [reference/UX_COMPARISON.md](reference/UX_COMPARISON.md)
- **Plugin Comparison:** [reference/EXISTING_PLUGIN_COMPARISON.md](reference/EXISTING_PLUGIN_COMPARISON.md)
- **Architecture:** [reference/REPOSITORY_STRUCTURE_ANALYSIS.md](reference/REPOSITORY_STRUCTURE_ANALYSIS.md)

## 📦 Archive

Historical documents are in `archive/` for reference:
- **Phase 2 docs** - Implementation summaries and testing from October
- **Feature-specific docs** - Detailed implementation guides for completed features
- **Deprecated docs** - Old workflows replaced by current process

These are kept for historical reference but are not actively maintained.

## 🔄 Documentation Workflow

See [DOCUMENTATION_WORKFLOW.md](DOCUMENTATION_WORKFLOW.md) for:
- How to update docs when completing tasks
- Weekly review process
- Maintaining consistency across files
- Automated reminders via .cursorrules

## 📊 Current Status

**Phase:** UX Improvements (Sprint 2)
**Progress:** 30% (3 of 10 tasks complete)
**Next Task:** Task 004 or Task 003b

See [TODO.md](TODO.md) for current status and [MASTER_PLAN.md](MASTER_PLAN.md) for detailed progress tracking.

---

**Last Updated:** 2025-10-28
