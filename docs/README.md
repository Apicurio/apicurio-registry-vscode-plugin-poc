# Apicurio Registry VSCode Extension - Documentation

Welcome to the documentation for the Apicurio Registry VSCode Extension!

## 📚 Documentation Sections

### For Users

- **[User Guide](users/)** - Installation, features, and usage
  - [Installation](users/installation.md) *(coming soon)*
  - [Quick Start](users/quick-start.md) *(coming soon)*
  - [Features](users/features/) *(coming soon)*
  - [Troubleshooting](users/troubleshooting.md) *(coming soon)*

### For Contributors

- **[Contributor Guide](contributors/)** - How to contribute
  - [Getting Started](contributors/getting-started.md) *(coming soon)*
  - [Testing](contributors/testing.md) - Comprehensive testing guide
  - [Architecture](contributors/architecture.md) *(coming soon)*
  - [API Compatibility](contributors/api-compatibility.md)

### Project Information

- **[Project Planning](project/)** - Tasks, roadmap, and status
  - [TODO](project/TODO.md) - Current tasks and priorities
  - [Roadmap](project/ROADMAP.md) - Feature roadmap
  - [Master Plan](project/MASTER_PLAN.md) - Strategic plan
  - [Tasks](project/tasks/) - Detailed task tracking
- **[Design Decisions](design/)** - Architecture and design documentation
  - [Integration Strategy](design/integration-strategy.md)

### AI Integration

- **[AI Integration](ai-integration/)** - MCP/AI features
  - [Getting Started](ai-integration/getting-started.md) *(if exists)*
  - [Architecture](ai-integration/architecture.md)
  - [Debugging](ai-integration/debugging/) - Debugging guides

### Reference

- **[Reference Material](reference/)** - Technical reference *(if exists)*
- **[Archive](archive/)** - Historical documentation

---

## 📁 Directory Structure

```
docs/
├── README.md                      ← You are here
│
├── users/                         ← User documentation
│   ├── README.md                  ← User guide index
│   ├── installation.md            ← How to install (coming soon)
│   ├── quick-start.md             ← Getting started (coming soon)
│   ├── troubleshooting.md         ← Common issues (coming soon)
│   └── features/                  ← Feature documentation (coming soon)
│
├── contributors/                  ← Developer documentation
│   ├── README.md                  ← Contributor guide index
│   ├── getting-started.md         ← Dev setup (coming soon)
│   ├── building.md                ← Build instructions (coming soon)
│   ├── testing.md                 ← Testing guide
│   ├── architecture.md            ← Technical architecture (coming soon)
│   ├── api-compatibility.md       ← API version support
│   ├── code-style.md              ← Coding standards (coming soon)
│   └── debugging.md               ← Debugging guide (coming soon)
│
├── project/                       ← Project planning & tracking
│   ├── README.md                  ← Project docs index
│   ├── TODO.md                    ← Current tasks
│   ├── ROADMAP.md                 ← Feature roadmap
│   ├── MASTER_PLAN.md             ← Strategic plan
│   ├── FEATURE_GAP_ANALYSIS.md    ← Gap analysis
│   └── tasks/                     ← Task tracking
│       ├── README.md              ← Task tracking guide
│       ├── completed/             ← Finished tasks
│       ├── in-progress/           ← Active tasks
│       └── planned/               ← Future tasks
│           ├── high/              ← High priority
│           ├── medium/            ← Medium priority
│           └── low/               ← Low priority
│
├── design/                        ← Design decisions
│   ├── README.md                  ← Design docs index
│   ├── integration-strategy.md    ← Integration approach
│   └── state-based-editing-ux.md  ← UX design (if exists)
│
├── ai-integration/                ← AI/MCP integration
│   ├── README.md                  ← AI integration index
│   ├── getting-started.md         ← Setup guide (if exists)
│   ├── architecture.md            ← MCP architecture
│   ├── debugging/                 ← Debugging guides
│   │   ├── README.md              ← Debugging index
│   │   └── [various guides]       ← Debug docs
│   └── archive/                   ← Historical debugging
│       └── README.md              ← Archive index
│
├── reference/                     ← Reference material
│   └── [analysis docs]            ← Technical references (if exists)
│
├── testing/                       ← Legacy testing docs
│   └── README.md                  ← Points to contributors/testing.md
│
├── archive/                       ← Historical/outdated docs
│   └── README.md                  ← Archive index
│
└── meta/                          ← Documentation about documentation
    ├── README.md                  ← Meta docs index
    └── DOCUMENTATION_GUIDE.md     ← Complete documentation guide
```

---

## 🚀 Quick Links

### Getting Started

**New Users:**
1. [Installation Guide](users/installation.md) *(coming soon)*
2. [Quick Start](users/quick-start.md) *(coming soon)*

**New Contributors:**
1. [Contributor Guide](contributors/README.md)
2. [Testing Guide](contributors/testing.md)
3. [Project TODO](project/TODO.md)

### Current Work

- **[TODO](project/TODO.md)** - Daily task list and current priorities
- **[In Progress Tasks](project/tasks/in-progress/)** - Active development
- **[Planned Tasks](project/tasks/planned/)** - Upcoming work

### Understanding the Project

- **[Roadmap](project/ROADMAP.md)** - Feature roadmap and timeline
- **[Master Plan](project/MASTER_PLAN.md)** - Strategic overview
- **[Feature Gap Analysis](project/FEATURE_GAP_ANALYSIS.md)** - Comparison analysis

---

## 🎯 Documentation by Purpose

### Daily Work

1. **Start your day:** Open [project/TODO.md](project/TODO.md)
2. **Check active tasks:** Browse [project/tasks/in-progress/](project/tasks/in-progress/)
3. **Pick next task:** Review [project/tasks/planned/](project/tasks/planned/)
4. **Read task spec:** Follow TDD: RED → GREEN → REFACTOR

### Testing

- **Comprehensive Guide:** [contributors/testing.md](contributors/testing.md)
- **Quick Test:** 5-minute smoke test checklist
- **Automated Tests:** Jest unit tests
- **Manual Tests:** Extension Development Host testing

### Understanding Architecture

- **Code Architecture:** [contributors/architecture.md](contributors/architecture.md) *(coming soon)*
- **Design Decisions:** [design/](design/)
- **Integration Strategy:** [design/integration-strategy.md](design/integration-strategy.md)
- **API Compatibility:** [contributors/api-compatibility.md](contributors/api-compatibility.md)

### AI/MCP Integration

- **Getting Started:** [ai-integration/getting-started.md](ai-integration/getting-started.md) *(if exists)*
- **Architecture:** [ai-integration/architecture.md](ai-integration/architecture.md)
- **Debugging:** [ai-integration/debugging/](ai-integration/debugging/)
- **Troubleshooting:** Check debugging guides

---

## 📦 Open-Source Philosophy

This project embraces **complete transparency**:

- **All planning is public** - See our thought process in [project/](project/)
- **Debugging history preserved** - Learn from our iterations in [ai-integration/archive/](ai-integration/archive/)
- **Task tracking visible** - Follow our development in [project/tasks/](project/tasks/)
- **Lessons learned documented** - Each completed task includes learnings

We believe showing the full development journey helps the community learn and contribute more effectively.

---

## 📊 Project Status

**Current Phase:** Phase 3 - Advanced Features (25% Complete)

**Completed:**
- ✅ Phase 1: Foundation (Extension scaffold, connection, tree view)
- ✅ Phase 2: Enhanced Tree View (Context menus, commands, metadata)

**In Progress:**
- 🚧 Phase 3: Advanced Features (Search ✅, Import/Export ✅, Content editor, Version history, State management)

**Planned:**
- 📋 Phase 4: Enterprise Features
- 📋 Phase 5: AI Integration

See [project/ROADMAP.md](project/ROADMAP.md) for detailed timeline and [project/TODO.md](project/TODO.md) for current tasks.

---

## 🔄 Documentation Maintenance

This documentation follows a clear structure:

**Users** - End-user documentation for using the extension
**Contributors** - Developer documentation for building and testing
**Project** - Planning, tasks, and roadmap tracking
**Design** - Architecture and design decisions
**AI Integration** - MCP/AI feature documentation and debugging
**Reference** - Technical reference material
**Archive** - Historical documentation

When contributing, please:
1. Keep documentation up-to-date with code changes
2. Document new features in appropriate sections
3. Update task specs when completing work
4. Add lessons learned to completed tasks

**See also:** [Documentation Guide](meta/DOCUMENTATION_GUIDE.md) - Complete guide for organizing and maintaining documentation

---

## 📞 Questions or Issues?

- **Issues:** [GitHub Issues](https://github.com/Apicurio/apicurio-vscode-plugin/issues)
- **Contributor Guide:** [contributors/README.md](contributors/README.md)
- **Project Planning:** [project/README.md](project/README.md)

---

**Last Updated:** 2025-11-20
**Documentation Structure:** Reorganized for public release
**Status:** Core structure complete, detailed guides coming soon
