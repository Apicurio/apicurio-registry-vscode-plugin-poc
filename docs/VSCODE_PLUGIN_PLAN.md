# VSCode Plugin for Apicurio Registry - Implementation Plan

## Overview

This document outlines the feasibility study and implementation plan for creating a VSCode extension that integrates Apicurio Registry functionality directly into the VSCode editor. The plugin will provide registry browsing capabilities in the sidebar and enable editing of OpenAPI/AsyncAPI specifications using the existing Apicurio Studio editors.

## Feasibility Assessment

### ✅ Technical Feasibility Confirmed

Based on comprehensive analysis of both the Apicurio Registry codebase and VSCode Extension APIs, this project is **technically feasible** with the following validated capabilities:

1. **Sidebar Integration**: VSCode TreeDataProvider API supports hierarchical registry browsing
2. **Custom Editors**: VSCode Custom Editor API enables OpenAPI/AsyncAPI editing
3. **REST API Integration**: Full support for HTTP requests using existing TypeScript SDK
4. **UI Component Reuse**: Existing Apicurio Studio editors can be integrated via webview

## Current Registry Architecture Analysis

### UI Components Structure

The Apicurio Registry UI is organized into three main modules:

```
ui/
├── ui-app/          # React-based main interface
│   ├── src/app/pages/explore/     # Registry exploration UI
│   ├── src/editors/               # Basic text editors
│   └── package.json               # React + PatternFly dependencies
├── ui-editors/      # Angular-based Apicurio Studio
│   ├── src/app/components/editors/ # Visual API editors
│   └── package.json               # Angular + specialized editing tools
└── ui-docs/         # Documentation interface
```

### Key Features in Current Implementation

#### Explore Page (`ui-app/src/app/pages/explore/ExplorePage.tsx`)
- **Hierarchical Navigation**: Groups → Artifacts → Versions
- **Search and Filtering**: By name, type, and other criteria
- **CRUD Operations**: Create, view, edit, delete artifacts
- **Import/Export**: Bulk operations for registry content
- **Real-time Updates**: Live content synchronization

#### Editor Integration (`ui-app/src/app/pages/editor/EditorPage.tsx`)
- **Draft System**: Content versioning and conflict resolution
- **Multi-format Support**: JSON, YAML, and visual editing modes
- **Live Validation**: Real-time content validation
- **Collaboration**: Concurrent editing with conflict detection

#### API Integration
- **TypeScript SDK**: Located at `/typescript-sdk/`
- **OpenAPI Specifications**: Available at `/app/src/main/resources-unfiltered/META-INF/resources/api-specifications/`
- **Authentication Support**: OIDC integration
- **REST API Endpoints**: Comprehensive CRUD operations

### Existing Editor Architecture

#### Text Editors (`ui-app/src/editors/`)
- `TextEditor.tsx`: Basic Monaco-based text editing
- `OpenApiEditor.tsx`: OpenAPI-specific text editor
- `AsyncApiEditor.tsx`: AsyncAPI-specific text editor
- `ProtoEditor.tsx`: Protocol Buffers editor

#### Visual Editors (`ui-editors/`)
- Angular-based Apicurio Studio integration
- iframe-based embedding approach
- Message passing between parent and iframe
- Support for visual OpenAPI/AsyncAPI editing

## VSCode Extension Architecture

### Core Components

```
VSCode Extension
├── Tree Data Provider (Sidebar)
│   ├── Registry Connection Manager
│   ├── Hierarchical Data Model (Groups → Artifacts → Versions)
│   └── Context Menu Actions (View, Edit, Delete, Export)
├── Custom Editor Provider
│   ├── Text Editor (Monaco-based simple editing)
│   ├── Webview Editor (Apicurio Studio integration)
│   └── Content Synchronization Engine
└── API Integration Layer
    ├── TypeScript SDK Integration
    ├── Authentication Manager (OIDC/Basic Auth)
    └── Real-time Update Handler
```

### VSCode API Integration Points

#### TreeDataProvider Implementation
```typescript
interface RegistryTreeDataProvider extends vscode.TreeDataProvider<RegistryItem> {
  getChildren(element?: RegistryItem): RegistryItem[];
  getTreeItem(element: RegistryItem): vscode.TreeItem;
  refresh(): void;
}
```

#### Custom Editor Provider
```typescript
interface RegistryEditorProvider extends vscode.CustomTextEditorProvider {
  resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel): void;
}
```

## Implementation Phases

### Phase 1: Foundation Setup
**Duration**: 1-2 weeks

#### Tasks:
1. **Extension Scaffold**
   - Initialize VSCode extension project with TypeScript
   - Configure build system (webpack/esbuild)
   - Set up development and testing environment
   - Configure extension manifest (`package.json`)

2. **Registry SDK Integration**
   - Import Apicurio Registry TypeScript SDK
   - Create connection configuration interface
   - Implement authentication handling
   - Create API client wrapper

3. **Basic Tree View**
   - Implement TreeDataProvider interface
   - Create basic registry connection and browsing
   - Add refresh and search capabilities
   - Configure view container in Activity Bar

#### Deliverables:
- Working VSCode extension skeleton
- Registry connectivity established
- Basic sidebar tree view showing registry groups

### Phase 2: Core Tree Functionality
**Duration**: 2-3 weeks

#### Tasks:
1. **Enhanced Tree View**
   - Implement full hierarchy: Groups → Artifacts → Versions
   - Add custom icons for different artifact types
   - Implement context menus and inline actions
   - Add status indicators (draft, published, etc.)

2. **Search and Filtering**
   - Implement search functionality in tree view
   - Add filtering by artifact type and status
   - Create quick search command palette integration
   - Add sorting options

3. **Registry Management**
   - Support multiple registry connections
   - Configuration management for connection settings
   - Connection status indicators
   - Registry switching capabilities

#### Deliverables:
- Full-featured registry browser in sidebar
- Multi-registry support
- Search and filtering capabilities
- Context menu actions

### Phase 3: Editor Integration
**Duration**: 3-4 weeks

#### Tasks:
1. **Custom Text Editor**
   - Implement Custom Text Editor for OpenAPI/AsyncAPI
   - Add syntax highlighting and validation
   - Integrate with VSCode's built-in JSON/YAML support
   - Implement auto-completion based on schemas

2. **Apicurio Studio Integration**
   - Create webview-based custom editor
   - Integrate existing Apicurio Studio editors via iframe
   - Implement bidirectional content synchronization
   - Handle editor state management

3. **Content Synchronization**
   - Implement real-time sync with registry
   - Handle concurrent editing scenarios
   - Add conflict resolution interface
   - Support draft and published version workflows

#### Deliverables:
- Working text editor for API specifications
- Visual editor integration via webview
- Content synchronization with registry
- Conflict resolution capabilities

### Phase 4: Advanced Features
**Duration**: 2-3 weeks

#### Tasks:
1. **File System Integration**
   - Support opening local files in registry editors
   - Implement "push to registry" functionality
   - Add "pull from registry" capabilities
   - Create workspace synchronization features

2. **Developer Experience Enhancement**
   - Add IntelliSense for API specifications
   - Implement code generation from schemas
   - Create validation and testing tools
   - Add documentation preview capabilities

3. **Collaboration Features**
   - Real-time collaboration indicators
   - Change tracking and history
   - Comment and review capabilities
   - Team workspace management

#### Deliverables:
- File system integration
- Enhanced developer tools
- Collaboration features
- Complete VSCode integration

## Technical Specifications

### Extension Configuration

#### Package.json Contributions
```json
{
  "contributes": {
    "views": {
      "explorer": [
        {
          "id": "apicurioRegistry",
          "name": "Apicurio Registry",
          "when": "apicurioRegistryEnabled"
        }
      ]
    },
    "customEditors": [
      {
        "viewType": "apicurio.openapi",
        "displayName": "OpenAPI Editor",
        "selector": [
          {
            "filenamePattern": "*.openapi.{json,yaml,yml}"
          }
        ]
      }
    ],
    "commands": [
      {
        "command": "apicurioRegistry.refresh",
        "title": "Refresh",
        "icon": "$(refresh)"
      }
    ]
  }
}
```

#### Configuration Schema
```json
{
  "configuration": {
    "title": "Apicurio Registry",
    "properties": {
      "apicurioRegistry.connections": {
        "type": "array",
        "description": "Registry connection configurations",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "url": { "type": "string" },
            "authType": { "enum": ["none", "basic", "oidc"] },
            "credentials": { "type": "object" }
          }
        }
      }
    }
  }
}
```

### Security Considerations

#### Webview Content Security Policy
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none';
               script-src vscode-resource: 'unsafe-inline';
               style-src vscode-resource: 'unsafe-inline';
               connect-src https:;">
```

#### Authentication Handling
- Support for OIDC/OAuth2 flows
- Secure credential storage using VSCode's SecretStorage API
- Token refresh and expiration handling
- Support for API keys and basic authentication

### Performance Optimization

#### Tree View Optimization
- Lazy loading of tree nodes
- Virtual scrolling for large registries
- Caching of frequently accessed data
- Incremental updates via registry events

#### Editor Performance
- Content streaming for large specifications
- Efficient diff algorithms for change detection
- Debounced save operations
- Memory management for webview content

## Success Criteria

### Functional Requirements
- ✅ Browse registry content in VSCode sidebar with full hierarchy
- ✅ Edit OpenAPI/AsyncAPI specifications with text and visual editors
- ✅ Synchronize changes bidirectionally between VSCode and registry
- ✅ Support multiple registry connections and environments
- ✅ Maintain compatibility with existing registry features

### Non-Functional Requirements
- **Performance**: Tree view loads within 2 seconds for registries with 1000+ artifacts
- **Usability**: Consistent with VSCode UX patterns and keyboard shortcuts
- **Reliability**: Handle network failures gracefully with retry mechanisms
- **Security**: Secure authentication and credential management
- **Compatibility**: Support VSCode versions 1.70+

## Risk Assessment

### Technical Risks
- **Medium Risk**: Webview performance with large API specifications
  - *Mitigation*: Implement content streaming and lazy loading
- **Low Risk**: VSCode API compatibility changes
  - *Mitigation*: Follow stable API patterns and test with Insiders builds

### Integration Risks
- **Low Risk**: Apicurio Studio iframe integration complexity
  - *Mitigation*: Use proven message passing patterns from existing codebase
- **Low Risk**: TypeScript SDK compatibility
  - *Mitigation*: SDK is actively maintained and well-documented

## Timeline and Milestones

### Month 1: Foundation (Phases 1-2)
- Week 1-2: Extension setup and basic connectivity
- Week 3-4: Complete tree view implementation

### Month 2: Core Features (Phase 3)
- Week 1-2: Text editor implementation
- Week 3-4: Visual editor integration

### Month 3: Polish and Launch (Phase 4)
- Week 1-2: Advanced features and file system integration
- Week 3-4: Testing, documentation, and marketplace preparation

## Conclusion

The VSCode plugin for Apicurio Registry is technically feasible and will provide significant value to developers working with API specifications. The existing registry architecture provides solid foundations for integration, and the VSCode Extension API offers all necessary capabilities for implementation.

The phased approach ensures incremental delivery of value while managing technical complexity. The proposed architecture leverages existing components where possible while providing a native VSCode experience.

## Next Steps

1. **Immediate**: Begin Phase 1 implementation with extension scaffold
2. **Week 1**: Establish registry connectivity and basic tree view
3. **Week 2**: Complete tree functionality and begin editor work
4. **Month 1**: Deliver MVP with core browsing and editing capabilities
5. **Month 2-3**: Iterate based on user feedback and add advanced features

This plan provides a clear roadmap for delivering a comprehensive VSCode extension that brings Apicurio Registry capabilities directly into the developer's IDE workflow.