# Apicurio Registry VSCode Extension

A Visual Studio Code extension that provides integration with Apicurio Registry, allowing you to browse, view, and edit API specifications directly from your IDE.

## Features

- **Registry Browser**: Browse registry groups, artifacts, and versions in the VSCode sidebar
- **Multiple Connections**: Connect to multiple registry instances
- **API Specification Editing**: Edit OpenAPI and AsyncAPI specifications with syntax highlighting
- **Content Synchronization**: Sync changes between your local workspace and the registry
- **Authentication Support**: Support for various authentication methods (basic auth, OIDC)

## Supported Registry Versions

This extension is compatible with **Apicurio Registry 3.1.x** and later.

**Tested Versions:**
- ✅ Apicurio Registry 3.1.1 (fully supported)
- ✅ Apicurio Registry 3.1.0 (fully supported)

**Key Features by Version:**
- **v3.1+**: Draft version support, content/metadata endpoint separation
- **v3.0**: Basic CRUD operations (limited draft support)

**Note:** Some features require v3.1 or later. The extension automatically detects registry version and adjusts behavior accordingly. See [docs/API_COMPATIBILITY.md](docs/API_COMPATIBILITY.md) for detailed compatibility information.

## Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run compile`
4. Open in VSCode and press F5 to run in a new Extension Development Host window

## Configuration

Configure registry connections in VSCode settings:

```json
{
    "apicurioRegistry.connections": [
        {
            "name": "Local Registry",
            "url": "http://localhost:8080",
            "authType": "none"
        },
        {
            "name": "Production Registry",
            "url": "https://registry.example.com",
            "authType": "oidc",
            "credentials": {
                "clientId": "registry-client"
            }
        }
    ]
}
```

## Usage

1. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run "Apicurio Registry: Connect to Registry"
3. Select a configured connection
4. Browse registry content in the sidebar
5. Click on versions to view content
6. Edit API specifications with full IDE support

## Development

### Prerequisites

- Node.js 16+
- npm or yarn
- Visual Studio Code
- Docker (for running local registry)

### Quick Start

**Automated Setup (Recommended):**
```bash
./test-setup.sh
```
This script will set up everything you need including dependencies, registry, and sample data.

**Manual Setup:**
```bash
# 1. Install dependencies
npm install

# 2. Build the extension
npm run compile

# 3. Start local registry (in separate terminal)
docker run -it -p 8080:8080 apicurio/apicurio-registry:latest-snapshot

# 4. Open in VSCode and press F5
code .
```

### Testing

See **[QUICK_TEST.md](QUICK_TEST.md)** for a 5-minute quick start guide.

See **[docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** for comprehensive testing instructions.

### Scripts

- `npm run compile` - Compile TypeScript
- `npm run watch` - Watch mode for development
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `./test-setup.sh` - Automated test environment setup

### Architecture

```
src/
├── extension.ts              # Main extension entry point
├── providers/
│   └── registryTreeProvider.ts   # Tree view data provider
├── services/
│   └── registryService.ts        # Registry API client
└── models/
    └── registryModels.ts         # Data models and types
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [Apicurio Registry](https://github.com/Apicurio/apicurio-registry) - The main registry project
- [Apicurio Studio](https://github.com/Apicurio/apicurio-studio) - Web-based API design studio

## Support

For issues and questions:
- [GitHub Issues](https://github.com/apicurio/apicurio-vscode-extension/issues)
- [Apicurio Community](https://github.com/Apicurio/apicurio-registry/discussions)