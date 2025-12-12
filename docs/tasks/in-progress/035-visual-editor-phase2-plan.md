# Task 035: Visual Editor Integration - Phase 2 Planning

**Status:** 📋 PLANNED
**Priority:** 🔴 HIGH
**Effort:** 12-16 hours
**Dependencies:** Phase 1 (Complete ✅)
**Started:** TBD

---

## Overview

Phase 2 replaces the mock OpenAPI editor component with the real `@apicurio/openapi-editor` package, implements full save/load functionality, and adds production-ready features.

### Phase 1 Recap (Completed ✅)

- ✅ Mock component validates integration approach
- ✅ Message passing protocol established
- ✅ Tree view integration working
- ✅ JSON/YAML parsing functional
- ✅ POC tested and merged to main

### Phase 2 Goals

Replace mock with real editor and add:
- ✅ Real @apicurio/openapi-editor component
- ✅ Full save/auto-save functionality
- ✅ Document validation
- ✅ Dirty state tracking
- ✅ Error handling
- ✅ Production-ready UX

---

## Approach Options

### Option A: Build Package Locally (Recommended)

**Process:**
1. Clone @apicurio/openapi-editor repository
2. Build locally to generate dist/ folder
3. Use `npm link` to connect to extension
4. Replace MockOpenAPIEditor with real component

**Pros:**
- Full control over build process
- Can fix bugs and contribute back
- Latest features available
- No waiting for npm publish

**Cons:**
- Requires local build setup
- Need to maintain local clone
- More complex development workflow

**Effort:** 2-3 hours (one-time setup)

### Option B: Wait for NPM Package

**Process:**
1. Wait for maintainer to publish to npm
2. Install via `npm install @apicurio/openapi-editor`
3. Replace mock component

**Pros:**
- Simple installation
- Standard workflow
- Versioned releases

**Cons:**
- Timeline unknown
- May be blocked indefinitely
- No control over release schedule

**Effort:** Unknown timeline

### Option C: Fork and Publish

**Process:**
1. Fork repository
2. Add build artifacts to git
3. Publish to npm under scoped package
4. Install from scoped package

**Pros:**
- Full control
- Can publish immediately
- Standard npm workflow

**Cons:**
- Need to maintain fork
- Package name different
- Sync with upstream manually

**Effort:** 3-4 hours (including setup)

**Recommendation:** **Option A** - Build locally and use npm link

---

## Phase 2 Tasks Breakdown

### Task 2.1: Build Real Editor Package (2-3h)

**Objective:** Get @apicurio/openapi-editor built and linked locally

**Steps:**
1. Clone repository
   ```bash
   git clone https://github.com/Apicurio/apicurio-openapi-editor.git
   cd apicurio-openapi-editor
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Build package
   ```bash
   npm run build
   ```

4. Link package
   ```bash
   npm link
   ```

5. Link in extension
   ```bash
   cd /path/to/apicurio-vscode-plugin
   npm link @apicurio/openapi-editor
   ```

6. Verify dist/ folder created
   ```bash
   ls -la node_modules/@apicurio/openapi-editor/dist/
   ```

**Acceptance Criteria:**
- [ ] Package builds successfully
- [ ] dist/ folder contains compiled code
- [ ] npm link connects packages
- [ ] Extension can import from package
- [ ] No build errors

**Potential Issues:**
- Missing dependencies
- TypeScript errors
- Build script issues

**Mitigation:**
- Check package.json for required peer dependencies
- Review build logs for errors
- Contact maintainer if blockers found

---

### Task 2.2: Replace Mock with Real Component (3-4h)

**Objective:** Swap MockOpenAPIEditor with real OpenAPIEditor

**Changes Required:**

**File: `src/webview/visual-editor/VisualEditorApp.tsx`**
```typescript
// BEFORE
import { OpenAPIEditor, DocumentChangeEvent } from './MockOpenAPIEditor';

// AFTER
import { OpenAPIEditor, DocumentChangeEvent } from '@apicurio/openapi-editor';
```

**File: `package.json`**
```json
{
  "dependencies": {
    "@apicurio/openapi-editor": "file:../apicurio-openapi-editor"
  }
}
```

**Steps:**
1. Update import statement
2. Remove MockOpenAPIEditor.tsx
3. Update package.json dependency
4. Test compilation
5. Verify webview builds
6. Test in Extension Development Host

**Acceptance Criteria:**
- [ ] Real component renders in webview
- [ ] Document loads correctly
- [ ] UI shows OpenAPI editor interface
- [ ] No console errors
- [ ] Theme adapts to VSCode (dark/light)

**Potential Issues:**
- API differences between mock and real
- TypeScript type mismatches
- Missing peer dependencies
- CSS/styling conflicts

**Testing Checklist:**
- [ ] Opens JSON document
- [ ] Opens YAML document
- [ ] Displays OpenAPI 3.0 spec
- [ ] Displays OpenAPI 3.1 spec
- [ ] Displays AsyncAPI spec
- [ ] Dark mode works
- [ ] Light mode works

---

### Task 2.3: Implement Save Functionality (2-3h)

**Objective:** Enable saving edited documents back to registry

**Current State:**
- Mock sends `change` messages but doesn't actually save
- Provider has `updateDocument` but not fully wired

**Changes Required:**

**File: `src/providers/apicurioVisualEditorProvider.ts`**
```typescript
private setupMessageHandling(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel): void {
    webviewPanel.webview.onDidReceiveMessage(
        async message => {
            switch (message.type) {
                case 'ready':
                    this.sendDocumentToWebview(document, webviewPanel.webview);
                    break;

                case 'change':
                    // Auto-save on change (with debounce)
                    await this.updateDocument(document, message.payload.content);
                    break;

                case 'request-save':
                    // Manual save request
                    await this.handleSaveRequest(document, webviewPanel, message.payload);
                    break;

                default:
                    console.warn(`Unknown message type: ${message.type}`);
            }
        }
    );
}
```

**Auto-Save Implementation:**
```typescript
private saveTimeout?: NodeJS.Timeout;

private async updateDocument(document: vscode.TextDocument, content: string): Promise<void> {
    // Debounce saves (wait 2 seconds after last change)
    if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            content
        );
        await vscode.workspace.applyEdit(edit);

        // Auto-save to registry
        await document.save();
    }, 2000);
}
```

**Acceptance Criteria:**
- [ ] Changes auto-save after 2 seconds
- [ ] Manual save (Cmd+S) works
- [ ] Draft versions save to registry
- [ ] Published versions show read-only warning
- [ ] Save errors show user notification
- [ ] Status bar shows save status

**Testing Checklist:**
- [ ] Edit document, wait 2s, verify saved
- [ ] Press Cmd+S, verify immediate save
- [ ] Edit draft version, saves successfully
- [ ] Edit published version, shows warning
- [ ] Network error handled gracefully

---

### Task 2.4: Add Document Validation (1-2h)

**Objective:** Show validation errors from OpenAPI/AsyncAPI spec

**Features:**
- Real-time validation as user edits
- Error markers in editor
- Validation messages panel
- Fix suggestions where applicable

**Implementation:**

The real editor should have built-in validation. We need to:

1. **Enable Validation:**
   ```typescript
   <OpenAPIEditor
       initialContent={initialContent}
       onChange={handleChange}
       features={{
           allowCustomValidations: true
       }}
   />
   ```

2. **Handle Validation Events:**
   ```typescript
   const handleValidation = (errors: ValidationError[]) => {
       // Send validation errors to extension
       postMessageToExtension({
           type: 'validation',
           payload: { errors }
       });
   };
   ```

3. **Display in VSCode:**
   - Use Diagnostics API to show errors
   - Red squiggly underlines
   - Problems panel integration

**Acceptance Criteria:**
- [ ] Invalid OpenAPI shows errors
- [ ] Errors highlight in editor
- [ ] Problems panel shows issues
- [ ] Fixing errors clears markers
- [ ] Validation runs in real-time

---

### Task 2.5: Implement Dirty State Tracking (1h)

**Objective:** Show unsaved changes indicator

**Features:**
- Document title shows `● Modified` when dirty
- Tab shows dot indicator
- Prompt on close if unsaved changes
- Clear dirty state after save

**Implementation:**

**File: `src/webview/visual-editor/VisualEditorApp.tsx`**
```typescript
const handleChange = (event: DocumentChangeEvent) => {
    window.getCurrentContent = event.getContent;

    // Track dirty state
    postMessageToExtension({
        type: 'dirty-state-changed',
        payload: {
            isDirty: event.isDirty
        }
    });

    // Serialize and send content
    const contentStr = serializeContent(event.getContent(), originalFormat);
    postMessageToExtension({
        type: 'change',
        payload: { content: contentStr }
    });
};
```

**Provider Integration:**
```typescript
case 'dirty-state-changed':
    if (message.payload.isDirty) {
        // Mark document as dirty in VSCode
        // VSCode will show dot in tab automatically
    }
    break;
```

**Acceptance Criteria:**
- [ ] Tab shows dot when modified
- [ ] Prompt appears on close if dirty
- [ ] Dot clears after save
- [ ] Works for both manual and auto-save

---

### Task 2.6: Error Handling & UX Polish (2-3h)

**Objective:** Production-ready error handling and user experience

**Features to Add:**

1. **Loading States:**
   ```typescript
   if (isLoading) {
       return <div>Loading editor...</div>;
   }
   ```

2. **Error Boundaries:**
   ```typescript
   class EditorErrorBoundary extends React.Component {
       componentDidCatch(error, errorInfo) {
           postMessageToExtension({
               type: 'error',
               payload: { error: error.message, stack: errorInfo }
           });
       }
   }
   ```

3. **Network Error Handling:**
   ```typescript
   try {
       await registryService.getArtifactContent(...);
   } catch (error) {
       vscode.window.showErrorMessage(
           `Failed to load artifact: ${error.message}`,
           'Retry',
           'Open in Text Editor'
       );
   }
   ```

4. **Graceful Degradation:**
   - If visual editor fails, fallback to text editor
   - Show error message with actionable buttons
   - Log errors for debugging

**Acceptance Criteria:**
- [ ] Loading spinner shows while loading
- [ ] Network errors show retry option
- [ ] Editor crashes show error boundary
- [ ] Fallback to text editor available
- [ ] All errors logged to console

---

### Task 2.7: Theme Integration (1-2h)

**Objective:** Match VSCode theme (dark/light mode)

**Challenges:**
- PatternFly has own theme system
- VSCode provides CSS variables
- Need to bridge the two

**Implementation:**

**File: `src/webview/visual-editor/index.html`**
```html
<style>
    /* VSCode theme variables */
    :root {
        --editor-background: var(--vscode-editor-background);
        --editor-foreground: var(--vscode-editor-foreground);
        --panel-border: var(--vscode-panel-border);
    }

    /* Override PatternFly variables */
    .pf-v6-theme-dark {
        --pf-v6-global--BackgroundColor--100: var(--vscode-editor-background);
        --pf-v6-global--Color--100: var(--vscode-editor-foreground);
    }
</style>
```

**File: `src/webview/visual-editor/VisualEditorApp.tsx`**
```typescript
useEffect(() => {
    // Detect VSCode theme
    const isDark = document.body.classList.contains('vscode-dark');

    // Apply theme to editor
    if (isDark) {
        document.documentElement.classList.add('pf-v6-theme-dark');
    }
}, []);

// Listen for theme changes
useEffect(() => {
    onMessageFromExtension((message) => {
        if (message.type === 'themeChanged') {
            // Update theme
        }
    });
}, []);
```

**Acceptance Criteria:**
- [ ] Editor matches VSCode dark theme
- [ ] Editor matches VSCode light theme
- [ ] Theme switches when VSCode theme changes
- [ ] Colors are readable and consistent
- [ ] No jarring color differences

---

### Task 2.8: Testing & Documentation (2h)

**Objective:** Comprehensive testing and user documentation

**Testing:**

1. **Manual Testing Checklist:**
   - [ ] Open OpenAPI 3.0 document
   - [ ] Open OpenAPI 3.1 document
   - [ ] Open AsyncAPI 2.x document
   - [ ] Edit and save draft version
   - [ ] Attempt to edit published version
   - [ ] Test with large document (500+ lines)
   - [ ] Test with invalid document
   - [ ] Test auto-save (make change, wait 2s)
   - [ ] Test manual save (Cmd+S)
   - [ ] Test close without saving (prompt)
   - [ ] Test dark mode
   - [ ] Test light mode
   - [ ] Test network error handling
   - [ ] Test concurrent edits (conflict detection)

2. **Integration Tests:**
   ```typescript
   test('opens visual editor for OpenAPI document', async () => {
       // Test implementation
   });

   test('saves changes to registry', async () => {
       // Test implementation
   });

   test('shows validation errors', async () => {
       // Test implementation
   });
   ```

3. **Documentation Updates:**
   - Update README with visual editor features
   - Create user guide with screenshots
   - Document keyboard shortcuts
   - Add troubleshooting section

**Acceptance Criteria:**
- [ ] All manual tests pass
- [ ] Integration tests added
- [ ] User documentation complete
- [ ] Screenshots/GIFs added
- [ ] Troubleshooting guide written

---

## Success Criteria

### Must Have (Required for Phase 2 Complete)

- [ ] Real @apicurio/openapi-editor renders correctly
- [ ] Documents load from registry
- [ ] Edits save back to registry
- [ ] Auto-save after 2 seconds
- [ ] Manual save (Cmd+S) works
- [ ] Draft versions editable
- [ ] Published versions read-only
- [ ] Validation errors display
- [ ] Dirty state tracking works
- [ ] Theme matches VSCode
- [ ] Error handling implemented
- [ ] All manual tests pass

### Should Have (Nice to Have)

- [ ] Performance optimized (lazy loading)
- [ ] Keyboard shortcuts documented
- [ ] Undo/redo working
- [ ] Search in editor
- [ ] Multi-document support

### Could Have (Future Enhancements)

- [ ] Live collaboration
- [ ] Change history view
- [ ] Diff view for versions
- [ ] Import/export operations

---

## Timeline Estimate

| Task | Effort | Dependencies |
|------|--------|--------------|
| 2.1: Build Package | 2-3h | None |
| 2.2: Replace Mock | 3-4h | 2.1 |
| 2.3: Save Functionality | 2-3h | 2.2 |
| 2.4: Validation | 1-2h | 2.2 |
| 2.5: Dirty State | 1h | 2.3 |
| 2.6: Error Handling | 2-3h | 2.2 |
| 2.7: Theme Integration | 1-2h | 2.2 |
| 2.8: Testing & Docs | 2h | All above |

**Total: 14-20 hours**

**Recommended Approach:**
- Week 1: Tasks 2.1-2.3 (Setup + Core Functionality)
- Week 2: Tasks 2.4-2.6 (Polish + Error Handling)
- Week 3: Tasks 2.7-2.8 (Theme + Testing)

---

## Risk Assessment

### High Risk

**Risk:** Real editor API differs from mock
**Impact:** Need significant refactoring
**Mitigation:** Review API docs carefully, test early

**Risk:** Build process fails
**Impact:** Cannot use real package
**Mitigation:** Have fallback plan (fork or wait)

### Medium Risk

**Risk:** Large bundle size impacts performance
**Impact:** Slow loading times
**Mitigation:** Code splitting, lazy loading

**Risk:** Theme integration complex
**Impact:** Poor UX (mismatched colors)
**Mitigation:** CSS overrides, manual testing

### Low Risk

**Risk:** Missing features in editor
**Impact:** Some functionality unavailable
**Mitigation:** Report to maintainer, implement workarounds

---

## Dependencies

### External
- @apicurio/openapi-editor (GitHub repo)
- Node.js, npm, git
- Build tools (TypeScript, Vite)

### Internal
- Phase 1 POC (Complete ✅)
- ApicurioFileSystemProvider (Complete ✅)
- Conflict Detection (Complete ✅)
- Auto-save system (Exists, needs integration)

---

## Rollback Plan

If Phase 2 encounters critical blockers:

1. **Option 1:** Continue using mock component
   - Keep POC functional
   - Wait for package improvements
   - Defer Phase 2

2. **Option 2:** Build minimal editor
   - Simple text editor with syntax highlighting
   - Basic validation
   - No visual components

3. **Option 3:** Use alternative package
   - Research other OpenAPI editors
   - Evaluate Swagger Editor
   - Consider building custom

**Decision Point:** End of Task 2.1
**Criteria:** If build fails after 4 hours of troubleshooting, consider alternatives

---

## Next Actions

1. **Review this plan** with stakeholders
2. **Get approval** to proceed with Phase 2
3. **Schedule work** (recommend 2-3 week timeline)
4. **Start with Task 2.1** (Build Package)
5. **Create feature branch:** `task/visual-editor-phase2`

---

## Questions to Answer

Before starting Phase 2:

1. Is the timeline (2-3 weeks) acceptable?
2. Should we prioritize auto-save or manual save first?
3. What validation level is required (strict/lenient)?
4. Are there specific OpenAPI/AsyncAPI versions to support?
5. Should we support read-only mode for published versions?
6. Do we need offline support (cache content)?

---

## Success Metrics

### Quantitative
- Load time < 2 seconds
- Save time < 1 second
- Bundle size < 5 MB (gzipped)
- Zero critical bugs
- 100% manual test pass rate

### Qualitative
- Users prefer visual editor over text
- Positive feedback on UX
- No major usability complaints
- Editor feels integrated (not bolted on)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-11
**Next Review:** Before Phase 2 kickoff
