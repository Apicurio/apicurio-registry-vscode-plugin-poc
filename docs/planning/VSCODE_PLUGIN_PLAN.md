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
- **REST API v3**: Direct HTTP calls using Axios
- **OpenAPI Specifications**: Available at `/app/src/main/resources-unfiltered/META-INF/resources/api-specifications/`
- **Authentication Support**: OIDC and Basic Auth integration
- **REST API Endpoints**: Comprehensive CRUD operations via `/apis/registry/v3`

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
    ├── RegistryService (Axios-based REST client)
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

2. **Registry Service Integration**
   - Implement RegistryService using Axios for direct REST API calls
   - Create connection configuration interface
   - Implement authentication handling (Basic Auth & OIDC)
   - Create API client methods for v3 endpoints

3. **Basic Tree View**
   - Implement TreeDataProvider interface
   - Create basic registry connection and browsing
   - Add refresh and search capabilities
   - Configure view container in Activity Bar

#### Deliverables:
- ✅ Working VSCode extension skeleton
- ✅ Registry connectivity established via RegistryService
- ✅ Basic sidebar tree view showing registry groups
- ✅ Authentication support (Basic Auth & OIDC)
- ✅ Direct REST API integration with Axios

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
- ✅ Full-featured registry browser in sidebar
- ✅ Multi-registry support with connection management
- ✅ Search and filtering capabilities
- ✅ Context menu actions
- ✅ Custom icons for all 9 artifact types
- ✅ State indicators (ENABLED, DISABLED, DEPRECATED, DRAFT)
- ✅ Rich tooltips with metadata
- ✅ IconService for centralized icon management

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

## Architectural Decisions

### REST API Integration Strategy

**Decision:** Use direct REST API calls via Axios instead of the TypeScript SDK

**Rationale:**

During Phase 1 implementation, we decided to use direct REST API calls with Axios rather than the TypeScript SDK located at `/typescript-sdk/`. This decision was based on:

1. **Simplicity**: Direct HTTP calls provide more control and transparency
2. **Bundle Size**: Avoiding SDK dependencies keeps the extension lightweight
3. **Flexibility**: Easier to handle VSCode-specific requirements (progress reporting, cancellation)
4. **Version Control**: Direct API calls make it easier to support multiple registry versions
5. **Error Handling**: More granular control over error handling and user feedback

**Implementation:**

The `RegistryService` class (`src/services/registryService.ts`) provides:
- Direct Axios-based HTTP client to `/apis/registry/v3`
- Support for Basic Auth and OIDC authentication
- Type-safe interfaces for all API responses
- Comprehensive error handling with user-friendly messages
- Connection management and state tracking

**Key Methods:**
```typescript
- searchGroups(): Promise<SearchedGroup[]>
- getArtifacts(groupId: string): Promise<SearchedArtifact[]>
- getVersions(groupId: string, artifactId: string): Promise<SearchedVersion[]>
- getArtifactContent(groupId, artifactId, version): Promise<ArtifactContent>
- updateArtifactContent(groupId, artifactId, version, content): Promise<void>
```

**Trade-offs:**
- ✅ **Pros**: Lighter bundle, more control, easier VSCode integration
- ⚠️ **Cons**: Need to manually track API changes, no SDK type safety

**Future Consideration:**
If the TypeScript SDK adds VSCode-specific features or becomes significantly more maintained, we can reconsider this decision. The RegistryService abstraction makes this switch straightforward.

---

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
- **Low Risk**: Direct REST API compatibility
  - *Mitigation*: Using stable v3 API with comprehensive error handling

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

## Implementation Status

### ✅ Completed Phases

#### Phase 1: Foundation Setup (Completed)
- ✅ VSCode extension scaffold with TypeScript and Webpack
- ✅ RegistryService with Axios for direct REST API v3 integration
- ✅ Authentication support (Basic Auth & OIDC)
- ✅ Basic TreeDataProvider implementation
- ✅ Connection management interface
- ✅ Extension manifest configuration

#### Phase 2: Core Tree Functionality (Completed)
- ✅ Full hierarchy navigation (Groups → Artifacts → Versions)
- ✅ Custom icons for all 9 artifact types via IconService
- ✅ State indicators (ENABLED, DISABLED, DEPRECATED, DRAFT)
- ✅ Rich tooltips with markdown and metadata
- ✅ Context menus and inline actions
- ✅ Multi-registry connection support
- ✅ Search and filtering capabilities
- ✅ Comprehensive unit tests with Jest

**Key Files Delivered:**
- `src/extension.ts` - Extension entry point
- `src/services/registryService.ts` - REST API client
- `src/services/iconService.ts` - Icon management
- `src/providers/registryTreeProvider.ts` - Tree view implementation
- `src/models/registryModels.ts` - Type definitions
- `test-icons.sh` - Testing utilities

### 🚧 Current Phase

**Phase 3: Editor Integration** (Next)
- Custom Text Editor for OpenAPI/AsyncAPI
- Webview-based visual editor
- Apicurio Studio integration
- Bidirectional content synchronization
- Draft and conflict resolution

### 📋 Upcoming Phases

**Phase 4: Advanced Features**
- File system integration (push/pull)
- Code generation tools
- Enhanced IntelliSense
- Collaboration features
- Testing and validation tools

---

## Next Steps

### Immediate Actions

1. **Phase 3 Planning**: Create detailed PRD for editor integration
2. **Research**: Study Apicurio Studio editor architecture for webview embedding
3. **Prototype**: Build simple custom text editor proof-of-concept
4. **Design**: Define content synchronization strategy

### Week 1-2 (Phase 3 Start)
1. Implement Custom Text Editor for OpenAPI/AsyncAPI
2. Add syntax highlighting and basic validation
3. Integrate with VSCode's JSON/YAML language support
4. Create edit/save workflows

### Week 3-4 (Phase 3 Continuation)
1. Build webview-based visual editor
2. Integrate Apicurio Studio via iframe
3. Implement bidirectional sync
4. Add draft system and conflict resolution

---

## Conclusion

The VSCode plugin for Apicurio Registry has successfully completed Phases 1 and 2, establishing a solid foundation with registry connectivity, authentication, and a full-featured tree view browser. The implementation uses direct REST API calls via Axios for maximum flexibility and control.

**Current Status:**
- ✅ **Phase 1 & 2 Complete**: Core browsing functionality delivered
- 🚧 **Phase 3 Next**: Editor integration to enable inline editing
- 📋 **Phase 4 Planned**: Advanced developer tools and collaboration

The phased approach has proven effective, delivering incremental value while managing complexity. The architecture is clean, testable, and ready for the next phase of editor integration.

This plan provides a clear roadmap for delivering a comprehensive VSCode extension that brings Apicurio Registry capabilities directly into the developer's IDE workflow.