# Visual Editor Integration - Phase 1 Testing Guide

## Overview

This guide provides step-by-step instructions to test the Visual Editor Integration Phase 1 POC.

## What Has Been Built

### Phase 1 Completion Status

✅ **Task 1: Package Installation** - Complete
- Installed `@apicurio/openapi-editor` from GitHub
- Installed peer dependencies: `@patternfly/react-table@6.4.0`
- Upgraded `@apicurio/data-models` to 2.2.6
- Used `--legacy-peer-deps` to bypass @types/node conflict

✅ **Task 2: Webview React Wrapper** - Complete
- Created `src/webview/visual-editor/vscode-api.ts` - VSCode API wrapper
- Created `src/webview/visual-editor/VisualEditorApp.tsx` - Main wrapper component
- Created `src/webview/visual-editor/index.tsx` - React entry point
- Created `src/webview/visual-editor/index.html` - HTML template
- Created `src/webview/visual-editor/MockOpenAPIEditor.tsx` - Mock component for POC

✅ **Task 3: Vite Configuration** - Complete
- Updated `vite.config.ts` to build visual-editor as second entry point
- Configured asset paths and output structure
- Build successful: `out/webview/visual-editor/index.html` + assets

✅ **Task 4: POC Creation** - Complete
- Created sample OpenAPI document: `test-data/sample-petstore.json`
- Extension compiled successfully
- Webview built successfully
- Provider already registered in `extension.ts`
- Custom editor already declared in `package.json`

🚧 **Task 5: Verification** - In Progress
- Need manual testing in VSCode Extension Development Host

## File Structure

```
src/webview/visual-editor/
├── index.html                  # HTML template for webview
├── index.tsx                   # React entry point
├── vscode-api.ts              # VSCode API wrapper (type-safe message passing)
├── VisualEditorApp.tsx        # Main wrapper component
└── MockOpenAPIEditor.tsx      # Mock component simulating real API

out/webview/
├── visual-editor/
│   └── index.html             # Built HTML (Vite output)
└── assets/
    ├── visualEditor.js        # 6.02 kB
    ├── base.js                # 194.75 kB (React, Zustand)
    ├── main.js                # 3,800 kB (PatternFly - large!)
    ├── base.css               # 217 kB
    └── main.css               # 596 kB

test-data/
└── sample-petstore.json       # Sample OpenAPI 3.0 document
```

## Testing Instructions

### Step 1: Launch Extension Development Host

1. Open the `apicurio-vscode-plugin` folder in VSCode
2. Press **F5** to launch Extension Development Host
3. A new VSCode window will open with the extension running

### Step 2: Open Sample Document

1. In the Extension Development Host window:
   - Open the `test-data/sample-petstore.json` file

2. **Option A - Right-click context menu:**
   - Right-click on the editor tab
   - Select "Reopen Editor With..."
   - Choose "Apicurio Visual Editor"

3. **Option B - Command palette:**
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Reopen Editor With"
   - Select "Apicurio Visual Editor"

### Step 3: Verify Mock Component Display

The mock component should display:

✅ **Expected UI Elements:**
- Header: "🎨 Mock Visual Editor (POC)"
- Status badges: "✓ Saved" / "● Modified" and version number
- Document Info section showing:
  - OpenAPI Version: 3.0.0
  - Title: Petstore API
  - Version: 1.0.0
  - Description: A simple Petstore API...
- Features checklist with green checkmarks
- "✏️ Simulate Edit" button
- Raw Document section with JSON content
- Footer: "This is a mock component..."

✅ **Expected Styling:**
- Should use VSCode theme colors
- Dark mode: Dark background, light text
- Light mode: Light background, dark text
- PatternFly fonts (Red Hat Display, Red Hat Text, Red Hat Mono)

### Step 4: Test Message Passing

1. Click the "✏️ Simulate Edit" button
2. Observe changes:
   - Status badge changes from "✓ Saved" to "● Modified"
   - Version number increments
   - Description field shows "(edited)" suffix
   - Raw JSON updates

### Step 5: Check Browser Console

1. In Extension Development Host, open Developer Tools:
   - **Help** → **Toggle Developer Tools**

2. Switch to the **Console** tab

3. Look for:
   - ✅ No errors (red messages)
   - ✅ Webview loaded successfully
   - ✅ React app mounted

## Known Issues & Limitations

### 1. Real Package Not Built
**Issue:** @apicurio/openapi-editor GitHub repo doesn't include built dist/ artifacts

**Solution (Phase 1):** Using mock component to validate integration

**Future:** Will replace with real component once package is properly published

### 2. Large Bundle Size
**Warning:** `main.js` is 3.8 MB (PatternFly is large)

**Impact:** Initial load may be slow

**Mitigation (Future):** Code splitting, lazy loading

### 3. Peer Dependency Conflict
**Warning:** `@types/node` version conflict (v16 vs v20+)

**Solution:** Using `--legacy-peer-deps` (safe for types-only conflict)

## Message Passing Protocol

### Extension → Webview Messages

```typescript
{ type: 'init', payload: { uri: string, content: string } }
{ type: 'saveDocument', payload: null }
{ type: 'themeChanged', payload: null }
```

### Webview → Extension Messages

```typescript
{ type: 'ready', payload: null }
{ type: 'change', payload: { content: string } }
{ type: 'request-save', payload: { action: 'write' | 'read' | 'notification', content?: string, message?: string } }
```

## Debugging Tips

### Webview Not Loading

1. Check Developer Tools console for errors
2. Verify files exist:
   ```bash
   ls -la out/webview/visual-editor/
   ls -la out/webview/assets/
   ```
3. Check `apicurioVisualEditorProvider.ts` `getHtmlForWebview()` method

### Document Not Displaying

1. Check if `ready` message was sent (console)
2. Check if `init` message was received (console)
3. Verify JSON parsing in `VisualEditorApp.tsx`

### CSP Errors

Content Security Policy errors indicate security restrictions.

**Check:**
- Nonce is being added to script tags
- CSP meta tag is properly injected
- Asset URLs use `webview.asWebviewUri()`

## Success Criteria

✅ Phase 1 POC is successful if:

1. Visual editor opens when selecting "Reopen Editor With → Apicurio Visual Editor"
2. Mock component displays sample OpenAPI document information
3. Document info shows correct title, version, description
4. "Simulate Edit" button works and triggers UI updates
5. No errors in console
6. Theme adapts to VSCode theme (dark/light)

## Next Steps (Phase 2)

Once Phase 1 testing is complete:

- **Phase 2:** Full feature implementation
  - Import/Export operations
  - Document validation
  - Save/auto-save
  - Dirty state tracking
  - Multi-document support

- **Phase 3:** Real Package Integration
  - Build @apicurio/openapi-editor locally
  - Replace mock component
  - Test with real visual editor

## Rollback Instructions

If testing reveals critical issues:

```bash
# Revert to previous working state
git checkout main
npm install
npm run compile
```

## Support

If you encounter issues during testing:

1. Check console for error messages
2. Review this testing guide
3. Check the mock component code in `MockOpenAPIEditor.tsx`
4. Verify provider code in `apicurioVisualEditorProvider.ts`

---

**Testing Date:** _____________

**Tested By:** _____________

**Result:** ☐ Pass  ☐ Fail  ☐ Needs Revision

**Notes:**
