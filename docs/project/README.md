# Project Planning & Tracking

Project management documentation for the Apicurio Registry VSCode Extension.

## Current Status

- [TODO](TODO.md) - Current tasks and priorities
- [Tasks](tasks/) - Detailed task tracking and history

## Planning Documents

- [Roadmap](ROADMAP.md) - Feature roadmap and timeline
- [Master Plan](MASTER_PLAN.md) - Strategic project plan and architecture
- [Feature Gap Analysis](FEATURE_GAP_ANALYSIS.md) - Comparison with other tools
- [VSCode Plugin Plan](VSCODE_PLUGIN_PLAN.md) - Original 4-phase vision

## Task Organization

Tasks are organized by status and priority:

```
tasks/
├── completed/        # Finished tasks with full documentation
├── in-progress/      # Currently active tasks
└── planned/          # Future tasks organized by priority
    ├── high/         # High priority features
    ├── medium/       # Medium priority features
    └── low/          # Low priority features
```

See [tasks/README.md](tasks/README.md) for task documentation standards.

## Project Phases

### Phase 1: Foundation ✅ COMPLETE
- Extension scaffold
- Registry connection
- Tree view navigation
- Basic CRUD operations

### Phase 2: Enhanced Tree View ✅ COMPLETE
- Context menus
- Copy commands
- Open artifact/version
- Metadata display
- Tree customization

### Phase 3: Advanced Features 🚧 IN PROGRESS (25% Complete)
- Search functionality ✅
- Content editor
- Version history
- Import/Export ✅
- Conflict resolution
- State management

### Phase 4: Enterprise Features 📋 PLANNED
- Branching support
- Advanced validation
- Rules management
- Team collaboration

### Phase 5: AI Integration 📋 PLANNED
- MCP server integration
- Claude Code workflows
- Intelligent code generation

See [ROADMAP.md](ROADMAP.md) for detailed timeline.

## Development Principles

This is an **open-source project** that values:

- **Transparency** - All planning and decision-making is public
- **Quality** - Test-driven development with 80%+ coverage
- **Documentation** - Every task is fully documented
- **Community** - Learn from our process and contribute

## Progress Tracking

We maintain detailed documentation of:
- Task specifications and requirements
- Implementation details and decisions
- Test results and edge cases
- Lessons learned and improvements

This transparency helps contributors understand the codebase and make informed decisions.

## For Contributors

- See [Contributor Guide](../contributors/README.md) for development setup
- Check [TODO.md](TODO.md) for current priorities
- Review [completed tasks](tasks/completed/) for implementation examples
- Follow our [TDD workflow](../../CLAUDE.md#test-driven-development-tdd---mandatory)

---

**Last Updated:** 2025-11-20
**Current Phase:** Phase 3 - Advanced Features (25% Complete)
