# Design Documentation

Architecture and design decisions for the Apicurio Registry VSCode Extension.

## Design Documents

- [Integration Strategy](integration-strategy.md) - Apicurio Editors integration approach
- [State-Based Editing UX](state-based-editing-ux.md) - User experience design for state management *(if exists)*

## Architecture Overview

The VSCode extension is built with TypeScript and follows these key design principles:

### Separation of Concerns

```
src/
├── extension.ts              # Extension entry point
├── providers/                # VSCode providers (tree, content, etc.)
├── services/                 # Business logic and API clients
├── models/                   # Data models and interfaces
├── commands/                 # Command implementations
└── utils/                    # Utility functions
```

### Key Components

**Registry Service** (`services/registryService.ts`)
- API client for Apicurio Registry
- Connection management
- Authentication handling
- Request/response processing

**Tree Provider** (`providers/registryTreeProvider.ts`)
- Hierarchical view: Groups → Artifacts → Versions
- Search filtering
- Refresh and state management
- Icon and label customization

**Commands** (`commands/`)
- Modular command implementations
- Proper error handling
- User feedback via notifications
- Progress indicators for long operations

### Design Patterns

**Dependency Injection**
- Services injected into providers and commands
- Enables testing with mocks
- Clear dependency graph

**Event-Driven Updates**
- Tree view uses `onDidChangeTreeData` event
- Commands trigger provider refreshes
- Reactive state management

**Error Handling**
- Try-catch for async operations
- User-friendly error messages
- Proper logging for debugging

## API Integration

**Apicurio Registry V3 API**
- RESTful API client using Axios
- Support for multiple storage backends (SQL, KafkaSQL, GitOps)
- Version-aware operations
- Metadata management

See [API Compatibility](../contributors/api-compatibility.md) for supported versions.

## Extension Points

The extension is designed to be extensible:

**Custom Artifact Types**
- Language detection for syntax highlighting
- Type-specific commands and actions
- Validation rules

**Authentication Providers**
- None (development)
- Basic (username/password)
- OIDC (enterprise)

**Storage Backends**
- SQL (PostgreSQL, H2, SQL Server)
- KafkaSQL
- GitOps

## Future Architecture

Planned architectural enhancements:

- **MCP Integration** - Model Context Protocol for AI workflows
- **Content Providers** - Custom editors for different artifact types
- **Validation Engine** - Real-time schema validation
- **Collaboration** - Multi-user workflows and conflict resolution

See [Project Roadmap](../project/ROADMAP.md) for timeline.

## Design Decisions

Key architectural decisions are documented in:
- Task specifications in [tasks/](../project/tasks/)
- [Master Plan](../project/MASTER_PLAN.md)
- Individual design documents in this folder

---

**Last Updated:** 2025-11-20
