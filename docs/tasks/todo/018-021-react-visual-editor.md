# Tasks 018-021: React-Based Visual Editor for OpenAPI/AsyncAPI

**Status:** 📋 Todo
**Priority:** High
**Effort:** 200-280 hours (7 weeks)
**Dependencies:** Tasks 015-017 (Custom Text Document Provider, Save/Auto-Save, Conflict Detection)
**Phase:** 3.2 - Apicurio Studio Integration

---

## Overview

Implement a React-based visual WYSIWYG editor for OpenAPI 2.0/3.0 and AsyncAPI 2.x specifications, providing the same UX as the existing Angular-based Apicurio Studio editor while maintaining strict VSCode Content Security Policy compliance.

**Why React Instead of Angular Webview?**

The original plan (Tasks 018-021 separate) assumed embedding the existing Angular-based Apicurio Studio editor via iframe. However, critical analysis revealed:

❌ **Angular Approach Blocked by CSP:**
- VSCode extensions require strict Content Security Policy
- Angular requires `unsafe-eval` CSP directive for JIT compilation
- **VSCode cannot relax CSP for webviews** - this is a hard blocker
- Even Angular AOT mode requires runtime template compilation in some cases

✅ **React Approach Is Only Viable Option:**
- React runs with strict CSP (no unsafe-eval needed)
- Full control over codebase and updates
- Can reuse ~30% of existing code (@apicurio/data-models, CSS, utilities)
- Smaller bundle size (~800 KB vs ~2-3 MB)
- Better VSCode integration patterns

**Decision Criteria Met:**
1. ✅ Timeline: 7 weeks acceptable
2. ✅ Bundle size: No concerns
3. ✅ CSP: Cannot accept unsafe-eval (blocks Angular)
4. ✅ Maintenance: Prefer full control
5. ✅ Feature parity: Potential gaps acceptable in Phase 3.2

---

## Architecture

### Strategic Design: Build for Reuse

**🎯 Goal:** Build once, use everywhere (VSCode + Apicurio Studio)

**Strategy:**
1. **Weeks 1-7:** Build in VSCode extension with clean abstractions
2. **Week 8+:** Extract to `@apicurio/react-editors` monorepo
3. **Week 9+:** Integrate into Apicurio Studio (replace Angular editor)

**Key Principle:** Design for extraction from day 1 - keep core logic separate from VSCode-specific code.

---

### Technology Stack

**Core Framework:**
- React 18 + TypeScript
- Vite (build tool, fast HMR)
- @vscode/webview-ui-toolkit (VSCode native components, will abstract later)

**State Management:**
- Zustand (lightweight, no boilerplate)
- Immer (immutable updates)
- Command pattern for undo/redo

**Business Logic Reuse:**
- @apicurio/data-models (v1.1.33) - Framework-agnostic library
  - Document models (OpenAPI 2.0/3.0, AsyncAPI 2.x)
  - Visitor pattern for traversal
  - Command pattern for modifications
  - Validation engine

**Form Handling:**
- react-hook-form (performance, validation)
- zod (schema validation)

**Styling:**
- **VSCode version:** @vscode/webview-ui-toolkit (native VSCode components)
- **Web version (future):** PatternFly 5 (latest version, matches Apicurio Studio)
- CSS Modules for custom styles (scoped, portable)
- Theme abstraction via IEditorEnvironment interface

### Component Architecture (Designed for Extraction)

**📁 Folder Structure:** Clean separation between **core** (portable) and **vscode** (VSCode-specific)

```
src/webview/
├── core/                        # 🎯 PORTABLE - Will extract to @apicurio/react-editor-core
│   ├── interfaces/              # Environment abstraction
│   │   ├── IEditorEnvironment.ts    # File ops, messaging, UI, theming
│   │   ├── IFileOperations.ts
│   │   ├── IMessaging.ts
│   │   └── INotifications.ts
│   ├── state/                   # Zustand stores (environment-agnostic)
│   │   ├── documentStore.ts     # OpenAPI/AsyncAPI document
│   │   ├── selectionStore.ts    # Current path/operation selection
│   │   ├── validationStore.ts   # Problems/warnings
│   │   └── undoRedoStore.ts     # Command history
│   ├── components/              # React components (pure, no VSCode deps)
│   │   ├── layout/
│   │   │   ├── MasterLayout.tsx
│   │   │   ├── NavigationTree.tsx
│   │   │   ├── MainEditor.tsx
│   │   │   └── ProblemDrawer.tsx
│   │   ├── forms/
│   │   │   ├── InfoForm.tsx
│   │   │   ├── PathForm.tsx
│   │   │   ├── OperationForm.tsx
│   │   │   ├── ChannelForm.tsx      # AsyncAPI
│   │   │   ├── MessageForm.tsx      # AsyncAPI
│   │   │   ├── DefinitionForm.tsx
│   │   │   ├── ParameterForm.tsx
│   │   │   ├── ResponseForm.tsx
│   │   │   ├── SecurityForm.tsx
│   │   │   └── ServerForm.tsx
│   │   ├── dialogs/
│   │   │   ├── AddPathDialog.tsx
│   │   │   ├── AddOperationDialog.tsx
│   │   │   └── ... (20+ dialogs)
│   │   └── common/
│   │       ├── Button.tsx           # Abstracted (uses env.getButton())
│   │       ├── Input.tsx            # Abstracted (uses env.getInput())
│   │       ├── Select.tsx           # Abstracted dropdown
│   │       ├── FormField.tsx        # Composed with abstracted components
│   │       ├── ValidationMessage.tsx
│   │       └── ... (shared UI components)
│   ├── services/                # Business logic (environment-agnostic)
│   │   ├── documentService.ts   # @apicurio/data-models wrapper
│   │   ├── validationService.ts # Validation logic
│   │   └── commandService.ts    # Undo/redo commands
│   ├── hooks/                   # React hooks (portable)
│   │   ├── useDocument.ts
│   │   ├── useValidation.ts
│   │   └── useEnvironment.ts    # Access IEditorEnvironment
│   └── utils/
│       ├── apiModelHelpers.ts   # @apicurio/data-models helpers
│       └── formHelpers.ts
│
├── vscode/                      # 🔧 VSCode-SPECIFIC - Will extract to @apicurio/react-editor-vscode
│   ├── adapters/
│   │   └── VSCodeEnvironment.ts     # Implements IEditorEnvironment
│   ├── components/
│   │   └── VSCodeThemeProvider.tsx  # VSCode theme integration
│   ├── integration/
│   │   ├── messageHandler.ts        # VSCode postMessage/onMessage
│   │   └── fileSystemAdapter.ts     # VSCode FileSystemProvider bridge
│   └── index.tsx                    # VSCode entry point
│
├── App.tsx                      # Main editor component (uses core + vscode)
└── index.html                   # Vite entry point
```

**🎯 Extraction Plan (Week 8):**
- `src/webview/core/` → `packages/core/src/` in new `apicurio-react-editors` repo
- `src/webview/vscode/` → `packages/vscode/src/`
- Create `packages/web/` for Apicurio Studio integration

### Abstraction Layer: IEditorEnvironment

**🎯 Key to Portability:** All environment-specific operations go through this interface.

```typescript
// src/webview/core/interfaces/IEditorEnvironment.ts

/**
 * Environment abstraction for editor.
 * Implementations:
 * - VSCodeEnvironment (for VSCode extension)
 * - WebEnvironment (for Apicurio Studio web UI)
 */
export interface IEditorEnvironment {
  // File operations
  readFile(uri: string): Promise<string>;
  writeFile(uri: string, content: string): Promise<void>;

  // Messaging
  postMessage(message: EditorMessage): void;
  onMessage(handler: (message: EnvironmentMessage) => void): void;

  // Notifications
  showInfo(message: string): void;
  showWarning(message: string): void;
  showError(message: string): void;

  // Theming
  getTheme(): EditorTheme;
  onThemeChange(handler: (theme: EditorTheme) => void): void;

  // UI components (returns component type)
  getButton(): React.ComponentType<ButtonProps>;
  getInput(): React.ComponentType<InputProps>;
}

export type EditorTheme = 'light' | 'dark' | 'high-contrast';

export interface EditorMessage {
  type: 'change' | 'ready' | 'error';
  payload?: any;
}

export interface EnvironmentMessage {
  type: 'init' | 'save' | 'undo' | 'redo';
  payload?: any;
}
```

**VSCode Implementation:**

```typescript
// src/webview/vscode/adapters/VSCodeEnvironment.ts

import { IEditorEnvironment } from '../../core/interfaces/IEditorEnvironment';
import { VSButton } from '@vscode/webview-ui-toolkit/react';

export class VSCodeEnvironment implements IEditorEnvironment {
  private vscode = acquireVsCodeApi();
  private messageHandlers: Array<(msg: any) => void> = [];

  constructor() {
    window.addEventListener('message', (event) => {
      this.messageHandlers.forEach(handler => handler(event.data));
    });
  }

  async readFile(uri: string): Promise<string> {
    return new Promise((resolve) => {
      this.postMessage({ type: 'readFile', payload: { uri } });
      const handler = (msg: any) => {
        if (msg.type === 'fileContent' && msg.payload.uri === uri) {
          resolve(msg.payload.content);
          this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
        }
      };
      this.messageHandlers.push(handler);
    });
  }

  async writeFile(uri: string, content: string): Promise<void> {
    this.postMessage({ type: 'writeFile', payload: { uri, content } });
  }

  postMessage(message: any): void {
    this.vscode.postMessage(message);
  }

  onMessage(handler: (message: any) => void): void {
    this.messageHandlers.push(handler);
  }

  showInfo(message: string): void {
    this.postMessage({ type: 'notification', payload: { level: 'info', message } });
  }

  showWarning(message: string): void {
    this.postMessage({ type: 'notification', payload: { level: 'warning', message } });
  }

  showError(message: string): void {
    this.postMessage({ type: 'notification', payload: { level: 'error', message } });
  }

  getTheme(): EditorTheme {
    const body = document.body;
    if (body.classList.contains('vscode-dark')) return 'dark';
    if (body.classList.contains('vscode-high-contrast')) return 'high-contrast';
    return 'light';
  }

  onThemeChange(handler: (theme: EditorTheme) => void): void {
    const observer = new MutationObserver(() => {
      handler(this.getTheme());
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  getButton() {
    return VSButton;  // VSCode UI Toolkit button
  }

  getInput() {
    return VSCodeInput;  // Custom wrapped input
  }
}
```

**Web Implementation (Week 8+):**

```typescript
// packages/web/src/adapters/WebEnvironment.ts (future)

export class WebEnvironment implements IEditorEnvironment {
  private baseUrl: string;
  private onSaveCallback?: (content: string) => void;

  constructor(config: { baseUrl: string; onSave?: (content: string) => void }) {
    this.baseUrl = config.baseUrl;
    this.onSaveCallback = config.onSave;
  }

  async readFile(uri: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/artifacts/${uri}`);
    return response.text();
  }

  async writeFile(uri: string, content: string): Promise<void> {
    if (this.onSaveCallback) {
      this.onSaveCallback(content);
    } else {
      await fetch(`${this.baseUrl}/api/artifacts/${uri}`, {
        method: 'PUT',
        body: content
      });
    }
  }

  postMessage(message: any): void {
    window.parent.postMessage(message, '*');
  }

  onMessage(handler: (message: any) => void): void {
    window.addEventListener('message', (event) => handler(event.data));
  }

  showInfo(message: string): void {
    // Use web notification system (e.g., PatternFly Toast)
    toast.info(message);
  }

  getTheme(): EditorTheme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  getButton() {
    return WebButton;  // Standard HTML button or PatternFly button
  }
}
```

---

### Message Passing Protocol

**Core → Environment (via IEditorEnvironment):**

```typescript
// Core components call environment methods
const env = useEnvironment();  // React hook

// Save document
env.writeFile(documentUri, content);

// Show notification
env.showInfo('Document saved successfully');

// Post custom message
env.postMessage({ type: 'change', payload: { isDirty: true } });
```

**Environment → Core (via onMessage):**

```typescript
// Core listens to environment messages
env.onMessage((message) => {
  switch (message.type) {
    case 'init':
      documentStore.loadDocument(message.payload.content);
      break;
    case 'save':
      handleSave();
      break;
    case 'undo':
      undoRedoStore.undo();
      break;
  }
});
```

### Integration with Existing Features

**Reuses Task 015 (Custom Text Document Provider):**
- Visual editor opens via `apicurio://` URI scheme
- Draft vs published version detection
- Status bar integration (📝 draft, 🔒 published)

**Reuses Task 016 (Save & Auto-Save):**
- Webview sends 'change' messages on edits
- Extension triggers auto-save via AutoSaveManager
- Manual save via Cmd+S/Ctrl+S

**Reuses Task 017 (Conflict Detection):**
- Before save, check for conflicts via ConflictDetector
- Show conflict resolution dialog if needed
- Update timestamp tracking after save

---

## Implementation Plan

### Task 018: React Foundation & Setup (Week 1, 35-45h)

**Goal:** Establish React development environment, core infrastructure, and **abstraction layer for portability**

**Subtasks:**

1. **Vite + React Setup (6-8h)**
   - Create `src/webview/` directory structure:
     ```
     src/webview/
     ├── core/          # Portable code
     ├── vscode/        # VSCode-specific
     ├── App.tsx
     └── index.html
     ```
   - Configure Vite for VSCode webview target
   - Set up TypeScript, ESLint, Prettier
   - Configure build to output to `out/webview/`
   - Add CSP meta tag compliance (strict, no unsafe-eval)

2. **Environment Abstraction Layer (8-10h)** ⭐ **NEW - Key to Portability**
   - Create `src/webview/core/interfaces/IEditorEnvironment.ts`
   - Define interface for file ops, messaging, notifications, theming, UI components
   - Create `src/webview/vscode/adapters/VSCodeEnvironment.ts`
   - Implement VSCode-specific environment adapter
   - Create `useEnvironment()` React hook for core components
   - Write unit tests for VSCodeEnvironment adapter

3. **Webview Provider Implementation (6-8h)**
   - Create `ApicurioVisualEditorProvider` implementing `CustomTextEditorProvider`
   - Register editor in `package.json`:
     ```json
     "customEditors": [{
       "viewType": "apicurio.visualEditor",
       "displayName": "Apicurio Visual Editor",
       "selector": [
         { "filenamePattern": "*.{json,yaml,yml}" }
       ],
       "priority": "option"
     }]
     ```
   - Implement `resolveCustomTextEditor()` method
   - Create HTML webview with Vite bundle injection
   - Wire up VSCodeEnvironment adapter
   - Set up message passing (extension ↔ webview)

4. **@apicurio/data-models Integration (6-8h)**
   - Install `@apicurio/data-models` v1.1.33
   - Create `src/webview/core/services/documentService.ts` (portable)
   - Implement document parsing (JSON/YAML → OasDocument/Aai20Document)
   - Implement document serialization (OasDocument → JSON/YAML)
   - Add type detection (OpenAPI 2.0/3.0/3.1, AsyncAPI 2.x)
   - Write unit tests for parsing/serialization

5. **State Management with Zustand (6-8h)**
   - Create `src/webview/core/state/` (portable stores)
   - Create `documentStore.ts`:
     - State: document, isDirty, format
     - Actions: loadDocument, updateDocument, resetDirty
   - Create `selectionStore.ts`:
     - State: selectedPath, selectedOperation
     - Actions: selectPath, selectOperation, clearSelection
   - Create `validationStore.ts`:
     - State: problems array
     - Actions: validate, clearProblems
   - Create `undoRedoStore.ts`:
     - State: commandHistory, currentIndex
     - Actions: execute, undo, redo, canUndo, canRedo

6. **Command Pattern for Undo/Redo (5-7h)**
   - Define `ICommand` interface in `src/webview/core/services/`:
     ```typescript
     interface ICommand {
       execute(document: OasDocument): void;
       undo(document: OasDocument): void;
       redo(document: OasDocument): void;
     }
     ```
   - Implement base commands:
     - `AddPathCommand`
     - `DeletePathCommand`
     - `UpdatePropertyCommand`
     - `AddOperationCommand`
   - Integrate with undoRedoStore
   - Add keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)

**Deliverables:**
- ✅ React + Vite environment working
- ✅ **Abstraction layer (IEditorEnvironment) complete** ⭐ Ready for extraction
- ✅ VSCodeEnvironment adapter functional
- ✅ Webview provider registered and functional
- ✅ Can open OpenAPI/AsyncAPI files in visual editor
- ✅ Document loads and parses correctly
- ✅ State management scaffolding complete (in `core/` for portability)
- ✅ Undo/redo infrastructure working
- ✅ 25+ unit tests for foundation (including environment adapter tests)

**Success Criteria:**
- Open .json/.yaml file → visual editor launches
- Document content loads in React app
- Changes update state (no UI yet)
- Undo/redo commands work
- No CSP violations in console

---

### Task 019: Core UI & Navigation (Weeks 2-3, 55-70h)

**Goal:** Implement main layout, navigation tree, and basic forms

**Subtasks:**

1. **Master Layout Component (8-10h)**
   - Create 3-column layout (navigation | main | properties)
   - Implement title bar with:
     - Document type indicator (OpenAPI 2.0/3.0, AsyncAPI 2.x)
     - Validation status (✓ valid, ⚠️ warnings, ❌ errors)
     - Quick actions (undo, redo, format)
   - Add collapsible panels
   - Responsive design for different viewport sizes
   - Use @vscode/webview-ui-toolkit components

2. **Navigation Tree Component (12-15h)**
   - Left panel: Hierarchical tree of document structure
   - OpenAPI structure:
     - Info
     - Paths
       - /path
         - GET/POST/PUT/DELETE operations
     - Definitions/Components
     - Security
     - Tags
   - AsyncAPI structure:
     - Info
     - Channels
       - channel
         - publish/subscribe operations
     - Components
   - Tree node selection → updates selectionStore
   - Context menu on nodes (add, delete, clone)
   - Icons for different node types

3. **Problem Drawer Component (6-8h)**
   - Bottom panel: List of validation problems
   - Problem types: error, warning, info
   - Click problem → navigate to relevant form
   - Integration with @apicurio/data-models validation
   - Real-time validation on document changes

4. **Info Form (Main Document Info) (10-12h)**
   - Title, version, description
   - Contact information (name, email, URL)
   - License (name, URL)
   - Terms of service
   - Tags (add/remove/edit)
   - External documentation
   - Form validation with react-hook-form + zod
   - Auto-save on blur

5. **Server Form (8-10h)**
   - OpenAPI 3.x: Servers array
   - Server URL, description, variables
   - AsyncAPI: Server object
   - Add/remove servers
   - Validation (URL format, variable interpolation)

6. **Common Components Library (11-15h)**
   - `IconButton` - Consistent button styles
   - `FormField` - Labeled input with validation
   - `ValidationMessage` - Error/warning display
   - `MarkdownEditor` - For description fields
   - `TagInput` - Multi-value tags
   - `DropdownSelect` - Enum selection
   - `JsonSchemaEditor` - Mini schema editor
   - `CodeBlock` - Syntax highlighted examples

**Deliverables:**
- ✅ Master layout with 3 panels
- ✅ Navigation tree showing document structure
- ✅ Problem drawer with validation issues
- ✅ Info form fully functional
- ✅ Server form fully functional
- ✅ Common components reusable
- ✅ 30+ unit tests for UI components

**Success Criteria:**
- Navigation tree renders full document structure
- Clicking tree node loads appropriate form
- Info form can edit title, description, contact, license
- Changes persist in document state
- Validation problems appear in drawer
- Undo/redo works with form changes

---

### Task 020: Forms & Detail Editors (Weeks 4-5, 60-80h)

**Goal:** Implement all form editors for paths, operations, schemas, parameters, responses

**Subtasks:**

1. **Path Form (OpenAPI) (8-10h)**
   - Path string (e.g., `/users/{id}`)
   - Summary, description
   - Parameters (path, query, header, cookie)
   - Operations (GET, POST, PUT, DELETE, etc.)
   - Add/remove operations
   - Clone path

2. **Operation Form (OpenAPI) (12-15h)**
   - Summary, description, operationId
   - Tags, external docs
   - Parameters (inherited + operation-specific)
   - Request body (OpenAPI 3.x)
     - Content types (application/json, etc.)
     - Schema reference or inline
     - Examples
   - Responses
     - Status code, description
     - Content, schema, examples
   - Security requirements
   - Deprecated flag, callbacks, servers

3. **Channel Form (AsyncAPI) (10-12h)**
   - Channel name/path
   - Description, summary
   - Parameters
   - Publish operation
   - Subscribe operation
   - Bindings (protocol-specific)

4. **Message Form (AsyncAPI) (8-10h)**
   - Message name, title, summary
   - Description
   - Payload (schema)
   - Headers (schema)
   - Correlation ID
   - Content type
   - Tags, examples, traits, bindings

5. **Definition/Schema Form (14-18h)**
   - Schema editor for components/definitions
   - JSON Schema properties:
     - Type, format, title, description
     - Properties (object)
     - Items (array)
     - Required fields
     - Enum values
     - Min/max, pattern
     - AllOf/AnyOf/OneOf/Not
   - Visual schema tree view
   - Add/remove properties
   - Nested schema editing

6. **Parameter Form (8-10h)**
   - Name, in (path/query/header/cookie)
   - Description, required
   - Schema or content
   - Style, explode, allowReserved
   - Examples
   - Deprecated flag
   - Validation

7. **Response Form (8-10h)**
   - Status code (200, 404, etc.)
   - Description
   - Headers
   - Content (media types)
   - Schema, examples
   - Links (OpenAPI 3.x)

8. **Security Scheme Form (8-10h)**
   - Security scheme types:
     - apiKey (in query/header/cookie)
     - http (basic/bearer)
     - oauth2 (flows: implicit/authorizationCode/clientCredentials/password)
     - openIdConnect
   - OAuth2 flows configuration
   - Scopes

**Deliverables:**
- ✅ All major forms implemented
- ✅ OpenAPI 2.0/3.0 support complete
- ✅ AsyncAPI 2.x support complete
- ✅ Schema editor functional
- ✅ Form validation comprehensive
- ✅ 50+ unit tests for forms

**Success Criteria:**
- Can edit all parts of OpenAPI/AsyncAPI document
- Schema editor supports nested schemas
- Form validation catches invalid input
- Changes update document state correctly
- All forms auto-save on blur
- Undo/redo works with all forms

---

### Task 021: Dialogs, Integration & Polish (Weeks 6-7, 50-65h)

**Goal:** Complete modal dialogs, VSCode integration, testing, and polish

**Subtasks:**

1. **Modal Dialogs (20-25h)**
   - Implement 20+ dialogs (reuse from Angular editor):
     - Add Path Dialog
     - Add Operation Dialog
     - Add Definition/Schema Dialog
     - Add Parameter Dialog
     - Add Response Dialog
     - Add Security Scheme Dialog
     - Add Server Dialog
     - Add Example Dialog
     - Add Tag Dialog
     - Clone dialogs (path, operation, definition)
     - Rename dialogs
     - Import dialogs (from URL, from file)
   - Dialog validation
   - Keyboard navigation (Tab, Esc)
   - Focus management

2. **VSCode Message Passing (8-10h)**
   - Implement bidirectional communication:
     - Extension → Webview: init, save, undo, redo
     - Webview → Extension: ready, change, error
   - Handle document updates from extension
   - Send changes to extension for persistence
   - Debounce change notifications (500ms)
   - Handle save requests from extension

3. **Save Integration (6-8h)**
   - Implement save handler in webview:
     - Serialize document to JSON/YAML
     - Send to extension via message
   - Extension saves via ApicurioFileSystemProvider (Task 015)
   - Trigger conflict detection (Task 017)
   - Update isDirty state
   - Show save success/error notifications

4. **Format Switching (4-5h)**
   - Support JSON ↔ YAML conversion
   - Preserve format on save (user preference)
   - Format toggle button in toolbar
   - Use js-yaml for YAML parsing/serialization

5. **Unit Testing (8-10h)**
   - Test all stores (document, selection, validation, undoRedo)
   - Test command pattern (execute, undo, redo)
   - Test form components (Info, Path, Operation, etc.)
   - Test dialog components
   - Test message passing service
   - Target: 80%+ code coverage

6. **Integration Testing (6-8h)**
   - Test full workflow:
     1. Open OpenAPI file → visual editor loads
     2. Edit document → state updates
     3. Save → persists to registry
     4. Conflict detection → shows dialog
     5. Undo/redo → reverts changes
   - Test AsyncAPI workflow
   - Test format switching
   - Test validation

7. **Bug Fixes & Polish (8-10h)**
   - Fix UI issues
   - Improve validation messages
   - Add loading states
   - Improve error handling
   - Add keyboard shortcuts
   - Accessibility (ARIA labels, focus management)
   - Performance optimization (lazy loading, memoization)

**Deliverables:**
- ✅ All dialogs implemented
- ✅ VSCode integration complete
- ✅ Save workflow functional
- ✅ Format switching works
- ✅ 60+ unit tests
- ✅ 10+ integration tests
- ✅ No critical bugs
- ✅ 80%+ code coverage

**Success Criteria:**
- Full edit → save → reload workflow works
- Conflict detection triggers on concurrent edits
- All dialogs functional
- Validation comprehensive
- Performance acceptable (< 100ms interactions)
- No CSP violations
- Tests passing

---

## Code Reuse from Angular Editor

**What We Can Reuse (~25% of effort):**

1. **@apicurio/data-models Library (100% reuse)**
   - Document models (OasDocument, Aai20Document)
   - Visitor pattern for traversal
   - Command pattern for modifications
   - Validation engine
   - Already framework-agnostic TypeScript

2. **Business Logic (~50% reuse)**
   - Validation rules (port TypeScript logic)
   - Form schemas (zod schemas based on existing validation)
   - Helper utilities (path parsing, schema traversal)

3. **UX Patterns (100% reuse as reference)**
   - Navigation tree structure (rebuild with VSCode/PatternFly components)
   - Form layouts (adapt to modern UI toolkit)
   - Dialog workflows
   - Validation messaging

**Styling Strategy:**

**VSCode Version (Weeks 1-7):**
- Use `@vscode/webview-ui-toolkit` components
- Native VSCode theming (light, dark, high-contrast)
- Custom CSS Modules for editor-specific layouts
- Zero dependency on Angular CSS

**Web Version (Week 8+):**
- Use PatternFly 5 (latest) components
- Matches Apicurio Studio design system
- Reuse CSS Modules from VSCode version (layout only)
- Replace VSCode components with PatternFly equivalents

**Benefits:**
- ✅ Modern, maintained UI libraries
- ✅ No CSS migration from Angular
- ✅ Native look-and-feel in each environment
- ✅ Easier to adapt to design system updates

**What We Cannot Reuse:**

1. **Angular Components (0% reuse)**
   - 141 Angular components must be rewritten in React
   - Different component model (class-based → functional)
   - Different state management (RxJS → Zustand)
   - Different templating (Angular templates → JSX)

2. **Angular Services (~20% reuse)**
   - Can reuse business logic, not Angular-specific code
   - No dependency injection in React
   - Different lifecycle management

3. **Angular Modules/Routing (0% reuse)**
   - No routing needed (single page)
   - No module system in React

**Estimated Code Reduction:**

Original Angular codebase: 42,380 LOC (180 TS files)
- Remove Angular boilerplate: -30% = 29,666 LOC
- React more concise: -19% = 24,029 LOC
- Reuse data-models/CSS/utils: -30% = 16,820 LOC

**Final estimate: ~17,000 LOC to write** (vs 42,380 from scratch)

---

## MVP Feature Scope

**Must Have (Phase 3.2):**
- ✅ OpenAPI 2.0/3.0 support
- ✅ AsyncAPI 2.x support
- ✅ Navigation tree
- ✅ Info/Contact/License editing
- ✅ Path/Operation editing
- ✅ Schema/Definition editing
- ✅ Parameter/Response editing
- ✅ Validation
- ✅ Undo/Redo
- ✅ Save integration
- ✅ Conflict detection integration

**Nice to Have (Future):**
- ⏸️ Import from URL
- ⏸️ Code generation preview
- ⏸️ Mock server generation
- ⏸️ API documentation preview
- ⏸️ Swagger UI preview
- ⏸️ AsyncAPI visualizer

**Out of Scope:**
- ❌ GraphQL support (not in Angular editor)
- ❌ WSDL/SOAP support
- ❌ Real-time collaboration
- ❌ Git integration (handled by VSCode)
- ❌ Linting/static analysis (beyond validation)

---

## Risk Mitigation

**Risk 1: Underestimating Component Complexity**
- **Mitigation:** Break each form into smaller sub-components
- **Mitigation:** Implement simplest version first, iterate
- **Mitigation:** Weekly reviews to adjust scope if needed

**Risk 2: @apicurio/data-models Integration Issues**
- **Mitigation:** Spike on integration in Task 018 (week 1)
- **Mitigation:** Test with real-world OpenAPI/AsyncAPI files early
- **Mitigation:** Contact Apicurio maintainers if issues arise

**Risk 3: Performance with Large Documents**
- **Mitigation:** Lazy loading for navigation tree
- **Mitigation:** Memoization for expensive computations
- **Mitigation:** Virtual scrolling for large lists
- **Mitigation:** Debounce validation (500ms)

**Risk 4: Feature Parity Gaps**
- **Mitigation:** Focus on 80% use cases first
- **Mitigation:** Document missing features for Phase 4
- **Mitigation:** Get user feedback early (end of Task 019)

**Risk 5: CSP Violations**
- **Mitigation:** Test CSP compliance in Task 018
- **Mitigation:** Use @vscode/webview-ui-toolkit (pre-approved)
- **Mitigation:** No inline styles/scripts, only bundled assets

---

## Phase Gating Criteria

**After Task 018 (Week 1) - GO/NO-GO Decision:**
- ✅ Webview provider working
- ✅ Document loads and parses
- ✅ State management functional
- ✅ No CSP violations
- ✅ Performance acceptable

**After Task 019 (Week 3) - User Review:**
- ✅ Navigation tree functional
- ✅ Info form works
- ✅ Layout looks good
- ✅ User feedback incorporated

**After Task 020 (Week 5) - Feature Complete:**
- ✅ All forms implemented
- ✅ OpenAPI + AsyncAPI support
- ✅ Validation working
- ✅ Undo/redo functional

**After Task 021 (Week 7) - Release Candidate:**
- ✅ Save integration works
- ✅ Conflict detection works
- ✅ Tests passing (80%+ coverage)
- ✅ No critical bugs

---

## Testing Strategy

**Unit Tests (Jest + React Testing Library):**
- Test all Zustand stores
- Test all commands (execute, undo, redo)
- Test all form components (user interactions)
- Test all dialog components
- Test services (document, validation, message passing)

**Integration Tests:**
- Test full workflow (open → edit → save → reload)
- Test conflict detection integration
- Test auto-save integration
- Test undo/redo with multiple changes
- Test format switching (JSON ↔ YAML)

**Manual Testing:**
- Test with real-world OpenAPI/AsyncAPI files
- Test with large documents (100+ paths)
- Test with all artifact types
- Test keyboard navigation
- Test accessibility

**Performance Testing:**
- Measure render time for large documents
- Measure save time
- Measure validation time
- Optimize bottlenecks

---

## Success Criteria

**Functional:**
- ✅ Can open OpenAPI 2.0/3.0 files in visual editor
- ✅ Can open AsyncAPI 2.x files in visual editor
- ✅ Can edit all major sections (info, paths, operations, schemas)
- ✅ Can add/delete/clone elements
- ✅ Validation shows problems in real-time
- ✅ Undo/redo works for all changes
- ✅ Save persists changes to registry
- ✅ Conflict detection prevents data loss

**Technical:**
- ✅ No CSP violations
- ✅ 80%+ test coverage
- ✅ All tests passing
- ✅ TypeScript strict mode compliant
- ✅ ESLint passing
- ✅ Bundle size < 1.2 MB

**UX:**
- ✅ Layout matches Apicurio Studio UX
- ✅ Performance acceptable (< 100ms interactions)
- ✅ Error messages clear and actionable
- ✅ Keyboard shortcuts work
- ✅ Accessible (ARIA, focus management)

**Integration:**
- ✅ Works with Task 015 (Custom Text Document Provider)
- ✅ Works with Task 016 (Save & Auto-Save)
- ✅ Works with Task 017 (Conflict Detection)
- ✅ Status bar integration (📝 draft, 🔒 published)

---

---

## Phase 2: Extraction & Studio Integration (Week 8+)

### Extraction to Monorepo (Week 8, 15-20h)

**Goal:** Extract React editor to standalone `@apicurio/react-editors` repository.

**Tasks:**

1. **Create Repository Structure (3-4h)**
   ```
   apicurio-react-editors/
   ├── packages/
   │   ├── core/              # From src/webview/core/
   │   ├── vscode/            # From src/webview/vscode/
   │   └── web/               # New - for Apicurio Studio
   ├── examples/
   │   ├── vscode-demo/
   │   └── web-demo/
   ├── pnpm-workspace.yaml
   └── package.json
   ```

2. **Extract Core Package (4-5h)**
   - Move `src/webview/core/` → `packages/core/src/`
   - Create `packages/core/package.json`:
     ```json
     {
       "name": "@apicurio/react-editor-core",
       "version": "0.1.0",
       "main": "./dist/index.js",
       "types": "./dist/index.d.ts",
       "peerDependencies": {
         "react": "^18.0.0",
         "@apicurio/data-models": "^1.1.33",
         "zustand": "^4.0.0"
       }
     }
     ```
   - Build and test independently

3. **Extract VSCode Package (3-4h)**
   - Move `src/webview/vscode/` → `packages/vscode/src/`
   - Create `packages/vscode/package.json`:
     ```json
     {
       "name": "@apicurio/react-editor-vscode",
       "version": "0.1.0",
       "dependencies": {
         "@apicurio/react-editor-core": "workspace:*",
         "@vscode/webview-ui-toolkit": "^1.4.0"
       }
     }
     ```

4. **Create Web Package (4-6h)**
   - Create `packages/web/src/adapters/WebEnvironment.ts`
   - Implement web-specific environment adapter
   - Use PatternFly 5 components
   - Create example integration

5. **Update VSCode Extension (2-3h)**
   - Update `apicurio-vscode-plugin/package.json`:
     ```json
     {
       "dependencies": {
         "@apicurio/react-editor-core": "^0.1.0",
         "@apicurio/react-editor-vscode": "^0.1.0"
       }
     }
     ```
   - Import from published packages
   - Verify functionality unchanged

**Deliverables:**
- ✅ New `apicurio-react-editors` repository
- ✅ 3 published npm packages (core, vscode, web)
- ✅ VSCode extension using published packages
- ✅ All tests passing in monorepo

---

### Apicurio Studio Integration (Week 9+, 10-15h)

**Goal:** Replace Angular editor with React editor in Apicurio Studio.

**Tasks:**

1. **Install Packages (1h)**
   ```bash
   cd apicurio-registry/ui/ui-app
   npm install @apicurio/react-editor-core @apicurio/react-editor-web
   ```

2. **Create WebEnvironment Adapter (3-4h)**
   ```typescript
   // ui-app/src/editors/environment/ApicurioWebEnvironment.ts

   export class ApicurioWebEnvironment implements IEditorEnvironment {
     constructor(
       private apiUrl: string,
       private onSave: (content: string) => void
     ) {}

     async readFile(uri: string): Promise<string> {
       const response = await fetch(`${this.apiUrl}/artifacts/${uri}`);
       return response.text();
     }

     async writeFile(uri: string, content: string): Promise<void> {
       this.onSave(content);  // Delegate to parent component
     }

     showInfo(message: string): void {
       // Use PatternFly Alert
       addAlert({ variant: 'info', title: message });
     }

     getButton() {
       return PFButton;  // PatternFly Button
     }

     // ... other methods
   }
   ```

3. **Replace OpenApiEditor Component (3-4h)**
   ```typescript
   // ui-app/src/editors/OpenApiEditor.tsx (BEFORE - Angular iframe)
   export const OpenApiEditor: FunctionComponent<Props> = (props) => {
       const editorUrl = "https://studio.apicur.io";
       return <iframe src={editorUrl} />;
   };

   // ui-app/src/editors/OpenApiEditor.tsx (AFTER - React editor)
   import { ReactEditor } from '@apicurio/react-editor-web';
   import { ApicurioWebEnvironment } from './environment/ApicurioWebEnvironment';

   export const OpenApiEditor: FunctionComponent<Props> = (props) => {
       const environment = new ApicurioWebEnvironment(
           config.apis.registry,
           (content) => props.onChange(content)
       );

       return (
           <ReactEditor
               content={props.content.content}
               format={props.format}
               environment={environment}
           />
       );
   };
   ```

4. **Testing & Bug Fixes (3-5h)**
   - Test with real Registry data
   - Test all OpenAPI/AsyncAPI workflows
   - Fix integration issues
   - Performance testing

**Deliverables:**
- ✅ React editor working in Apicurio Studio
- ✅ Feature parity with Angular editor (MVP scope)
- ✅ All integration tests passing
- ✅ Performance acceptable

---

### Migration Strategy

**Phase 1: Parallel Deployment (v3.1)**
- Deploy React editor alongside Angular editor
- Feature flag to toggle between editors
- Monitor for issues
- Collect user feedback

**Phase 2: Default to React (v3.2)**
- Make React editor default
- Angular editor available as fallback
- Fix reported bugs

**Phase 3: Deprecation (v4.0)**
- Remove Angular editor
- Remove `ui-editors/` folder
- Celebrate single codebase! 🎉

---

## Lessons Learned (To Be Updated)

_This section will be filled in after completing each task._

**Task 018:**
- TBD

**Task 019:**
- TBD

**Task 020:**
- TBD

**Task 021:**
- TBD

**Extraction & Integration:**
- TBD

---

## References

**Apicurio Registry Codebase:**
- `/apicurio-registry/ui/ui-editors/` - Angular editor (reference implementation)
- `/apicurio-registry/ui/ui-app/src/editors/OpenApiEditor.tsx` - React integration pattern

**Documentation:**
- [@apicurio/data-models API Docs](https://www.apicur.io/apicurio-data-models/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [AsyncAPI Specification](https://www.asyncapi.com/docs/reference/specification/latest)
- [VSCode Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [React Documentation](https://react.dev/)

**Libraries:**
- [@apicurio/data-models](https://github.com/Apicurio/apicurio-data-models)
- [@vscode/webview-ui-toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [react-hook-form](https://react-hook-form.com/)
- [zod](https://zod.dev/)

---

**Status:** 📋 Ready to Start
**Next Steps:**
1. Update TODO.md with revised Phase 3.2 plan
2. Update MASTER_PLAN.md with React approach decision
3. Begin Task 018 - React Foundation & Setup
