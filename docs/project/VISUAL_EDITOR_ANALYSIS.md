# Visual Editor Integration Analysis

**Repository:** https://github.com/Apicurio/apicurio-openapi-editor (private)
**Analysis Date:** 2025-12-11
**Status:** ✅ Repository accessible, analysis complete

---

## Repository Information

### Basic Info
- **Package Name:** `@apicurio/openapi-editor`
- **Version:** 0.1.0 (MVP/early development)
- **Description:** "A reusable React component for visual OpenAPI editing"
- **License:** Apache 2.0
- **Created:** December 2, 2025
- **Last Updated:** December 10, 2025

### Technology Stack
- **Framework:** React 18/19
- **Language:** TypeScript
- **Build Tool:** Vite
- **State Management:** Zustand 5.0
- **UI Components:** PatternFly React v6
  - @patternfly/react-core
  - @patternfly/react-icons
  - @patternfly/react-table
- **Business Logic:** @apicurio/data-models v2.2.6

### Code Statistics
- **TypeScript:** 139,373 bytes (97%)
- **CSS:** 3,342 bytes (2%)
- **JavaScript:** 836 bytes (<1%)
- **HTML:** 391 bytes (<1%)

---

## Package Structure

### Distribution
```json
{
  "main": "./dist/apicurio-openapi-editor.cjs.js",
  "module": "./dist/apicurio-openapi-editor.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/apicurio-openapi-editor.es.js",
      "require": "./dist/apicurio-openapi-editor.cjs.js"
    }
  }
}
```

**Supports:**
- ✅ ES Modules (for modern bundlers like Vite)
- ✅ CommonJS (for older Node.js environments)
- ✅ TypeScript definitions

### Source Structure
```
src/
├── commands/       # Command pattern for undo/redo
├── components/     # React components
│   └── editor/
│       └── OpenAPIEditor.tsx  # Main component
├── hooks/          # React hooks
│   ├── useCommand.ts
│   ├── useDocument.ts
│   ├── useSelection.ts
│   └── useUI.ts
├── models/         # TypeScript interfaces
│   ├── DocumentTypes.ts
│   ├── EditorProps.ts
│   └── SelectionTypes.ts
├── services/       # Services and context
│   └── EditorContext.tsx
└── stores/         # Zustand stores
```

### Test Application
```
test-app/           # Example React app demonstrating usage
├── src/
│   ├── App.tsx    # Usage example
│   └── ...
└── package.json
```

---

## Component API

### Main Component: OpenAPIEditor

**Import:**
```typescript
import { OpenAPIEditor } from '@apicurio/openapi-editor';
import type { OpenAPIEditorProps, DocumentChangeEvent } from '@apicurio/openapi-editor';
```

**Props Interface:**
```typescript
interface OpenAPIEditorProps {
    // Initial OpenAPI content (JSON object or JSON string)
    initialContent?: object | string;

    // Callback when document changes
    onChange?: (event: DocumentChangeEvent) => void;

    // Feature flags
    features?: EditorFeatures;
}

interface DocumentChangeEvent {
    // Whether document has unsaved changes
    isDirty: boolean;

    // Document version number (increments with each change)
    version: number;

    // Accessor to get current content (call only when saving)
    getContent: () => object | null;
}

interface EditorFeatures {
    allowImports?: boolean;
    allowCustomValidations?: boolean;
}
```

**Usage Example:**
```typescript
function App() {
    const handleChange = (event: DocumentChangeEvent) => {
        console.log('Document changed:', {
            isDirty: event.isDirty,
            version: event.version
        });

        // Only call getContent() when actually saving
        if (needToSave) {
            const content = event.getContent();
            saveToRegistry(content);
        }
    };

    return (
        <OpenAPIEditor
            initialContent={openAPIDocument}
            onChange={handleChange}
            features={{
                allowImports: true,
                allowCustomValidations: false
            }}
        />
    );
}
```

### Advanced API (Hooks & Context)

For advanced integration, the library also exports:

**Hooks:**
- `useDocument()` - Access document state
- `useCommand()` - Execute commands (undo/redo)
- `useSelection()` - Current selection state
- `useUI()` - UI state management

**Context:**
- `EditorProvider` - Context provider
- `useEditorServices()` - Access editor services
- `EditorServices` type

---

## Integration Approach for VSCode

### Recommended Approach: **NPM Package + Webview**

**Why this approach:**
1. ✅ Package is designed as reusable React component
2. ✅ Clean, simple API (`<OpenAPIEditor />`)
3. ✅ Proper npm package structure (ES + CJS + TypeScript)
4. ✅ No CSP issues (React works with strict CSP)
5. ✅ Can bundle with Vite for webview

**Integration Steps:**

#### 1. Add Package Dependency
```bash
npm install @apicurio/openapi-editor
```

**Required peer dependencies:**
- @apicurio/data-models ^2.2.6
- @patternfly/react-core ^6.0.0
- @patternfly/react-icons ^6.0.0
- @patternfly/react-table ^6.0.0
- react ^18.0.0 || ^19.0.0
- react-dom ^18.0.0 || ^19.0.0
- zustand ^5.0.0

#### 2. Create Webview React App
```
src/webview/
├── visual-editor/
│   ├── index.tsx           # Entry point
│   ├── VisualEditorApp.tsx # Wrapper component
│   └── vscode-api.ts       # VS Code API wrapper
└── ...
```

**VisualEditorApp.tsx:**
```typescript
import { OpenAPIEditor, DocumentChangeEvent } from '@apicurio/openapi-editor';
import { vscode } from './vscode-api';

export function VisualEditorApp() {
    const [initialContent, setInitialContent] = useState(null);

    const handleChange = (event: DocumentChangeEvent) => {
        // Notify extension of dirty state
        vscode.postMessage({
            type: 'documentChanged',
            isDirty: event.isDirty,
            version: event.version
        });

        // Store getContent callback for save operations
        window.getCurrentContent = event.getContent;
    };

    // Listen for messages from extension
    useEffect(() => {
        window.addEventListener('message', (event) => {
            const message = event.data;
            switch (message.type) {
                case 'loadDocument':
                    setInitialContent(message.content);
                    break;
                case 'saveDocument':
                    const content = window.getCurrentContent?.();
                    vscode.postMessage({
                        type: 'saveComplete',
                        content
                    });
                    break;
            }
        });
    }, []);

    return (
        <OpenAPIEditor
            initialContent={initialContent}
            onChange={handleChange}
        />
    );
}
```

#### 3. Create VSCode Webview Provider
```typescript
// src/providers/visualEditorProvider.ts
export class VisualEditorProvider implements vscode.CustomTextEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new VisualEditorProvider(context);
        return vscode.window.registerCustomEditorProvider(
            'apicurioRegistry.visualEditor',
            provider,
            { webviewOptions: { retainContextWhenHidden: true } }
        );
    }

    async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel
    ) {
        // Set up webview HTML with bundled React app
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        // Send initial content
        webviewPanel.webview.postMessage({
            type: 'loadDocument',
            content: JSON.parse(document.getText())
        });

        // Handle messages from webview
        webviewPanel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'documentChanged':
                    // Update dirty state
                    break;
                case 'saveComplete':
                    // Save to registry via ApicurioFileSystemProvider
                    await this.saveDocument(document, message.content);
                    break;
            }
        });
    }
}
```

#### 4. Build Configuration
```typescript
// vite.config.visual-editor.ts
export default defineConfig({
    build: {
        outDir: 'dist/webview/visual-editor',
        rollupOptions: {
            input: 'src/webview/visual-editor/index.tsx',
            output: {
                entryFileNames: 'visual-editor.js',
                assetFileNames: 'visual-editor.[ext]'
            }
        }
    }
});
```

#### 5. Package.json Updates
```json
{
  "contributes": {
    "customEditors": [
      {
        "viewType": "apicurioRegistry.visualEditor",
        "displayName": "OpenAPI Visual Editor",
        "selector": [
          {
            "filenamePattern": "*.openapi.{json,yaml,yml}"
          }
        ],
        "priority": "option"
      }
    ]
  }
}
```

---

## Integration Effort Estimate

### Task Breakdown

**Phase 1: Package Integration (4-6h)**
- Add @apicurio/openapi-editor + peer dependencies
- Create webview React wrapper component
- Set up Vite build for webview
- Configure bundling and assets

**Phase 2: Webview Provider (6-8h)**
- Implement VisualEditorProvider
- Create webview HTML template
- Set up message passing (extension ↔ webview)
- Wire up to existing URI scheme (apicurio://)

**Phase 3: Save Integration (4-6h)**
- Connect to ApicurioFileSystemProvider (Task 015)
- Implement save workflow
- Connect to conflict detection (Task 017)
- Handle draft vs published versions

**Phase 4: Testing & Polish (4-6h)**
- Unit tests for provider
- Integration tests (load → edit → save)
- Manual testing with various documents
- Error handling and edge cases
- Documentation

**Total Estimated Effort: 18-26 hours**

### Comparison to Original Plan
- **Original:** Build from scratch (200-280h)
- **Integration:** Use package (18-26h)
- **Savings:** 174-254h (90%+ reduction!)

---

## Technology Compatibility

### VSCode Extension Compatibility

| Technology | Visual Editor | VSCode Extension | Compatible? |
|------------|---------------|------------------|-------------|
| React | 18/19 | N/A (webview only) | ✅ Yes |
| TypeScript | 5.9.3 | 5.x | ✅ Yes |
| Vite | 7.2.6 | Can use for webview | ✅ Yes |
| PatternFly | v6 | N/A (webview only) | ✅ Yes |
| Zustand | 5.0 | N/A (webview only) | ✅ Yes |
| @apicurio/data-models | 2.2.6 | Compatible | ✅ Yes |

**CSP Compatibility:**
- ✅ React runs with strict CSP (no unsafe-eval)
- ✅ PatternFly compatible with webviews
- ✅ No known CSP issues

### Existing Infrastructure Integration

| Infrastructure | Status | Integration Point |
|----------------|--------|-------------------|
| ApicurioFileSystemProvider | ✅ Complete | Visual editor saves via provider |
| Conflict Detection | ✅ Complete | Use existing system |
| URI Scheme (apicurio://) | ✅ Complete | Visual editor uses same URIs |
| Draft Support | ✅ Complete | Editor respects draft state |
| Status Bar | ✅ Complete | Can reuse for editor |

**Perfect fit!** All infrastructure needed for visual editor is already complete.

---

## Risks and Mitigations

### Risk 1: Package Size
**Risk:** PatternFly + React might create large bundle
**Impact:** Slow webview loading
**Likelihood:** Medium
**Mitigation:**
- Lazy load visual editor (only when needed)
- Code splitting with Vite
- Tree shaking for PatternFly (only import used components)

### Risk 2: Version Compatibility
**Risk:** Package version may not match our needs
**Impact:** Missing features or bugs
**Likelihood:** Low (v0.1.0 is MVP but functional)
**Mitigation:**
- Test thoroughly with various documents
- Report issues to teammate
- Can temporarily fork if critical bugs found

### Risk 3: PatternFly Theme Conflicts
**Risk:** PatternFly styling may not match VSCode theme
**Impact:** Poor UX (light theme in dark VSCode)
**Likelihood:** High
**Mitigation:**
- Wrap editor in theme adapter
- Map VSCode theme to PatternFly theme
- CSS overrides if needed

### Risk 4: Performance with Large Documents
**Risk:** Large OpenAPI specs may be slow to edit
**Impact:** Poor UX, lag
**Likelihood:** Medium
**Mitigation:**
- Test with large documents
- Use React.memo and optimization techniques
- Report performance issues to teammate

---

## Recommendations

### Immediate Next Steps

1. **Add Package to Dependencies** (30min)
   ```bash
   npm install @apicurio/openapi-editor \
       @apicurio/data-models@^2.2.6 \
       @patternfly/react-core@^6.0.0 \
       @patternfly/react-icons@^6.0.0 \
       @patternfly/react-table@^6.0.0 \
       zustand@^5.0.0
   ```

2. **Create Proof of Concept** (4-6h)
   - Minimal webview with OpenAPIEditor component
   - Load sample document
   - Verify rendering and basic editing
   - Test save workflow

3. **Iterate on POC** (2-3h)
   - Add message passing
   - Connect to file system provider
   - Handle edge cases

4. **Production Implementation** (8-12h)
   - Full webview provider
   - Complete save integration
   - Testing and polish

### Timeline

**Week 1:** POC and validation (6-9h)
**Week 2:** Production implementation (8-12h)
**Week 3:** Testing and polish (4-6h)

**Total: 2-3 weeks, 18-26 hours**

---

## Conclusion

The visual editor integration is **significantly simpler than originally planned**:

- ✅ **Clean npm package** - well-designed React component
- ✅ **Simple API** - just `<OpenAPIEditor />` with props
- ✅ **No CSP issues** - React is webview-compatible
- ✅ **Perfect timing** - our infrastructure (Tasks 015-017) is ready
- ✅ **90% effort reduction** - 18-26h vs 200-280h

**Recommendation:** Proceed with integration as soon as teammate confirms package is stable enough for testing.

**Integration Approach:** NPM package + Vite-bundled webview + message passing

**Estimated Effort:** 18-26 hours (vs 200-280 hours to build from scratch)

**Status:** ✅ Ready to begin integration work
