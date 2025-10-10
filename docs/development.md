# Development Guide

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Visual Studio Code
- Git

### Initial Setup

1. Clone the repository and install dependencies:
   ```bash
   cd apicurio-vscode-plugin
   npm install
   ```

2. Build the extension:
   ```bash
   npm run compile
   ```

3. Open the project in VS Code:
   ```bash
   code .
   ```

4. Press F5 to run the extension in a new Extension Development Host window

## Development Workflow

### Building

- `npm run compile` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for continuous compilation during development

### Testing

- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint for code quality

### Debugging

1. Set breakpoints in your TypeScript code
2. Press F5 to start debugging
3. The Extension Development Host window will open
4. Use the extension features to trigger your breakpoints

### Project Structure

```
src/
├── extension.ts                    # Main extension entry point
├── providers/
│   └── registryTreeProvider.ts     # Tree view data provider for sidebar
├── services/
│   └── registryService.ts          # Registry API client service
└── models/
    └── registryModels.ts           # Data models and TypeScript interfaces
```

## Key Components

### Extension Activation

The extension is activated when VSCode starts. The main entry point is `src/extension.ts` which:
- Registers the tree data provider
- Sets up commands
- Configures the tree view

### Tree Data Provider

`RegistryTreeDataProvider` implements the VSCode TreeDataProvider interface to show:
- Registry groups (root level)
- Artifacts within groups
- Versions within artifacts

### Registry Service

`RegistryService` handles all API communication with Apicurio Registry:
- Connection management
- Authentication
- CRUD operations for groups, artifacts, and versions

## Configuration

The extension uses VSCode's configuration system. Users can configure connections in their settings:

```json
{
    "apicurioRegistry.connections": [
        {
            "name": "Local Registry",
            "url": "http://localhost:8080",
            "authType": "none"
        }
    ]
}
```

## Commands

- `apicurioRegistry.refresh` - Refresh the tree view
- `apicurioRegistry.connect` - Connect to a registry
- `apicurioRegistry.disconnect` - Disconnect from registry

## Adding New Features

### New Commands

1. Add command to `package.json` contributes.commands
2. Register command in `extension.ts`
3. Implement command logic

### New Tree Items

1. Add new RegistryItemType to `registryModels.ts`
2. Update `getTreeItem()` and `getChildren()` in tree provider
3. Add context menu items in `package.json`

### New API Endpoints

1. Add method to `RegistryService`
2. Add corresponding data models
3. Update tree provider or commands to use new endpoint

## Testing

### Unit Tests

Create test files alongside source files with `.test.ts` extension:

```typescript
// src/services/registryService.test.ts
import { RegistryService } from './registryService';

describe('RegistryService', () => {
    it('should create service instance', () => {
        const service = new RegistryService();
        expect(service).toBeDefined();
    });
});
```

### Integration Tests

For testing with actual VS Code APIs, use the extension test runner:

```bash
npm run test
```

## Debugging Tips

### Common Issues

1. **Extension not activating**: Check `activationEvents` in package.json
2. **Tree not showing**: Verify tree provider registration and context setting
3. **API calls failing**: Check network connectivity and authentication

### Debug Console

Use `console.log()` statements in your code - they will appear in the Debug Console when running the extension.

### VS Code Developer Tools

1. In Extension Development Host, press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
2. Run "Developer: Toggle Developer Tools"
3. Check Console tab for errors and logs

## Release Process

### Building for Release

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Build production version:
   ```bash
   npm run vscode:prepublish
   ```

### Packaging

Install vsce (Visual Studio Code Extension manager):
```bash
npm install -g vsce
```

Package the extension:
```bash
vsce package
```

This creates a `.vsix` file that can be installed in VS Code.

### Publishing

To publish to the marketplace:
```bash
vsce publish
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Submit pull requests for review

## Architecture Decisions

### Why Tree Data Provider?

VSCode's TreeDataProvider is the standard way to create hierarchical views in the sidebar. It provides:
- Lazy loading of tree nodes
- Automatic refresh capabilities
- Context menu integration
- Icon and tooltip support

### Why Axios for HTTP?

While VSCode has built-in fetch capabilities, Axios provides:
- Better error handling
- Request/response interceptors
- Automatic request/response transformation
- Wide ecosystem support

### Authentication Strategy

The extension supports multiple auth types to accommodate different registry configurations:
- `none` - No authentication (development)
- `basic` - Username/password authentication
- `oidc` - OAuth2/OpenID Connect (enterprise)

## Next Steps

### Phase 1 (Current)
- [x] Basic tree view and registry browsing
- [x] Connection management
- [x] API integration

### Phase 2 (Planned)
- [ ] Custom editor for API specifications
- [ ] Content editing and synchronization
- [ ] Syntax highlighting and validation

### Phase 3 (Future)
- [ ] Visual editor integration
- [ ] Collaboration features
- [ ] Advanced search and filtering

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [TreeDataProvider Documentation](https://code.visualstudio.com/api/extension-guides/tree-view)
- [Apicurio Registry API Documentation](https://www.apicur.io/registry/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)