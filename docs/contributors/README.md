# Contributor Guide

Documentation for developers contributing to the Apicurio Registry VSCode Extension.

## Getting Started

- [Development Setup](getting-started.md) - Set up your development environment *(coming soon)*
- [Building](building.md) - Build and package the extension *(coming soon)*
- [Testing](testing.md) - Comprehensive testing guide

## Development

- [Architecture](architecture.md) - Technical architecture overview *(coming soon)*
- [API Compatibility](api-compatibility.md) - Apicurio Registry API version support
- [Code Style](code-style.md) - Coding standards and conventions *(coming soon)*
- [Debugging](debugging.md) - Debugging tips and tools *(coming soon)*

## Project Resources

- [Roadmap](../project/ROADMAP.md) - Feature roadmap and planned work
- [Tasks](../project/tasks/) - Detailed task tracking
- [Master Plan](../project/MASTER_PLAN.md) - Strategic project plan

## Contributing

Thank you for your interest in contributing to the Apicurio Registry VSCode Extension!

### Quick Start for Contributors

1. **Clone the repository**
   ```bash
   git clone https://github.com/Apicurio/apicurio-vscode-plugin.git
   cd apicurio-vscode-plugin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run compile
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Launch in development mode**
   - Open the project in VSCode
   - Press F5 to launch Extension Development Host

### Development Workflow

We follow a **Test-Driven Development (TDD)** approach:

1. Write tests first (RED)
2. Implement minimal code to pass tests (GREEN)
3. Refactor and improve code (REFACTOR)

See [Testing Guide](testing.md) for details.

### Git Workflow

- Always use feature branches: `task/XXX-description`
- Commit frequently with clear messages
- Run tests before merging
- See [project instructions](../../CLAUDE.md) for detailed workflow

### Code Quality

- TypeScript strict mode compliance
- 80%+ test coverage
- ESLint passing
- No TypeScript errors

### Documentation

When contributing:
- Update task documentation in `project/tasks/`
- Document test cases and results
- Update relevant README files
- Keep `project/TODO.md` current

## Open-Source Philosophy

This project embraces transparency:
- All planning documents are public
- Debugging history is preserved
- Task tracking shows our development process
- Learn from our decisions and iterations

We believe showing the full development journey helps the community learn and contribute effectively.

## Questions or Issues?

- Check [existing issues](https://github.com/Apicurio/apicurio-vscode-plugin/issues)
- Review [completed tasks](../project/tasks/completed/) for examples
- See [AI integration docs](../ai-integration/) for MCP features

---

**Last Updated:** 2025-11-20
