# Phase 1 Testing Guide

This guide walks you through testing the Phase 1 implementation of the Apicurio Registry VSCode extension.

## Prerequisites

Before testing, ensure you have:

1. **Node.js 16+** installed
2. **VSCode** (version 1.70.0 or later)
3. **A running Apicurio Registry instance** (see setup instructions below)

## Setup Instructions

### 1. Install Dependencies

```bash
cd apicurio-vscode-plugin
npm install
```

This will install all required dependencies including:
- TypeScript compiler
- Webpack bundler
- ESLint for code quality
- Jest for testing
- VSCode extension APIs

### 2. Set Up a Local Apicurio Registry Instance

You have several options for running a registry instance:

#### Option A: Using Docker (Quickest)

```bash
docker pull apicurio/apicurio-registry:latest-snapshot
docker run -it -p 8080:8080 apicurio/apicurio-registry:latest-snapshot
```

The registry will be available at `http://localhost:8080`

#### Option B: From Source (in the apicurio-registry directory)

```bash
cd ../apicurio-registry
./mvnw clean install -DskipTests
cd app
../mvnw quarkus:dev
```

The registry will be available at `http://localhost:8080`

#### Verify Registry is Running

Open your browser and navigate to:
- API: http://localhost:8080/apis
- UI: http://localhost:8080/ui (if running the full stack)

### 3. Configure VSCode Extension Settings

Before running the extension, configure a registry connection:

1. Open VSCode settings (Cmd+, on Mac, Ctrl+, on Windows/Linux)
2. Search for "Apicurio Registry"
3. Click "Edit in settings.json"
4. Add the following configuration:

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

Or create a `.vscode/settings.json` file in your workspace:

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

## Testing Methods

### Method 1: Extension Development Host (Recommended)

This is the primary way to test VSCode extensions during development.

#### Steps:

1. **Open the extension project in VSCode:**
   ```bash
   cd apicurio-vscode-plugin
   code .
   ```

2. **Build the extension:**
   - Press `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows/Linux)
   - Select "npm: compile" or run:
     ```bash
     npm run compile
     ```

3. **Launch Extension Development Host:**
   - Press `F5` or go to Run → Start Debugging
   - This will:
     - Compile the extension
     - Open a new VSCode window with the extension loaded
     - Attach the debugger

4. **Look for the Apicurio Registry view:**
   - In the new window, check the Explorer sidebar (Cmd+Shift+E / Ctrl+Shift+E)
   - You should see "Apicurio Registry" in the sidebar

### Method 2: Watch Mode for Development

For continuous development with auto-recompilation:

1. **Start watch mode:**
   ```bash
   npm run watch
   ```

2. **In a separate terminal or VSCode:**
   - Press F5 to launch Extension Development Host
   - Make code changes - they'll automatically recompile
   - Reload the Extension Development Host window (Cmd+R / Ctrl+R) to see changes

## Test Scenarios

### Test 1: Extension Activation ✓

**Goal:** Verify the extension loads correctly

**Steps:**
1. Launch Extension Development Host (F5)
2. Open the Debug Console in the main VSCode window (Cmd+Shift+Y / Ctrl+Shift+Y)
3. Look for the message: `Apicurio Registry extension is now active!`

**Expected Result:**
- Extension activates without errors
- Console shows activation message
- No error messages in the Debug Console

### Test 2: Tree View Visibility ✓

**Goal:** Verify the tree view appears in the sidebar

**Steps:**
1. In the Extension Development Host window, open the Explorer sidebar
2. Look for "Apicurio Registry" section

**Expected Result:**
- "Apicurio Registry" view is visible in the Explorer
- Shows either "Not connected" message or connection status
- Toolbar buttons (refresh, connect) are visible

### Test 3: Connect to Registry ✓

**Goal:** Test registry connection functionality

**Steps:**
1. Ensure your local registry is running (http://localhost:8080)
2. In the Apicurio Registry view, click the "Connect to Registry" button (plug icon)
3. If you have multiple connections configured, select "Local Registry"

**Expected Result:**
- Connection succeeds with message: "Connected to Local Registry"
- Tree view refreshes
- If registry has groups, they should appear in the tree

### Test 4: Browse Groups ✓

**Goal:** Verify group listing works

**Prerequisites:**
- Registry must have at least one group with artifacts

**Steps to Add Test Data (if needed):**
```bash
# Using the Registry REST API
curl -X POST http://localhost:8080/apis/registry/v3/groups/test-group/artifacts \
  -H "Content-Type: application/json" \
  -H "X-Registry-ArtifactId: my-api" \
  -H "X-Registry-ArtifactType: OPENAPI" \
  -d '{
    "openapi": "3.0.0",
    "info": {
      "title": "Test API",
      "version": "1.0.0"
    },
    "paths": {}
  }'
```

**Test Steps:**
1. Connect to registry
2. Expand the tree view

**Expected Result:**
- Groups appear as folder icons
- Groups can be expanded
- Group tooltips show artifact count

### Test 5: Browse Artifacts ✓

**Goal:** Verify artifact listing within groups

**Steps:**
1. Connect to registry
2. Expand a group node

**Expected Result:**
- Artifacts appear as file icons
- Artifact names are displayed
- Tooltips show artifact type
- Artifacts can be expanded to show versions

### Test 6: Browse Versions ✓

**Goal:** Verify version listing within artifacts

**Steps:**
1. Connect to registry
2. Expand a group
3. Expand an artifact

**Expected Result:**
- Versions appear with tag icons
- Version numbers are displayed
- Tooltips show version state and creation date

### Test 7: Refresh Functionality ✓

**Goal:** Test manual refresh

**Steps:**
1. Connect to registry
2. Add a new artifact to the registry (via UI or API)
3. Click the refresh button (circular arrow icon) in the tree view

**Expected Result:**
- Tree view refreshes
- New artifact appears in the list
- No errors in Debug Console

### Test 8: Disconnect Functionality ✓

**Goal:** Test disconnection

**Steps:**
1. Connect to registry
2. Run the "Disconnect" command (Cmd+Shift+P → "Disconnect")

**Expected Result:**
- Tree view shows "Not connected" message
- Connection is cleared
- No errors in Debug Console

### Test 9: Error Handling - Registry Unavailable ✗

**Goal:** Test behavior when registry is not available

**Steps:**
1. Stop your registry instance (Ctrl+C in the terminal running it)
2. Try to connect to the registry

**Expected Result:**
- Friendly error message appears
- Extension doesn't crash
- Error is logged to Debug Console

### Test 10: Multiple Connections Support ✓

**Goal:** Verify multiple connection configurations

**Steps:**
1. Add multiple connections to settings:
   ```json
   {
       "apicurioRegistry.connections": [
           {
               "name": "Local Registry",
               "url": "http://localhost:8080",
               "authType": "none"
           },
           {
               "name": "Dev Registry",
               "url": "http://dev.example.com:8080",
               "authType": "none"
           }
       ]
   }
   ```
2. Click "Connect to Registry"

**Expected Result:**
- Quick pick menu appears with both connection options
- Can select either connection
- Selected connection is used for API calls

## Debugging Tips

### View Extension Logs

1. **Debug Console:**
   - In the main VSCode window (not Extension Development Host)
   - View → Debug Console (Cmd+Shift+Y / Ctrl+Shift+Y)
   - Shows `console.log()` output from your extension

2. **Developer Tools:**
   - In the Extension Development Host window
   - Help → Toggle Developer Tools
   - Check the Console tab for browser-side errors

### Set Breakpoints

1. Open any `.ts` file in the extension
2. Click in the gutter to set a breakpoint
3. Trigger the code path (e.g., click connect button)
4. Debugger will pause at the breakpoint
5. Inspect variables, step through code, etc.

### Common Issues

#### Issue: "Extension host terminated unexpectedly"
**Solution:** Check Debug Console for errors. Usually caused by:
- Syntax errors in TypeScript
- Missing dependencies
- Runtime errors in extension code

#### Issue: Tree view doesn't appear
**Solution:**
- Check that `apicurioRegistryEnabled` context is set
- Verify package.json contributes section is correct
- Look for activation errors in Debug Console

#### Issue: "Cannot connect to registry"
**Solution:**
- Verify registry is running: `curl http://localhost:8080/apis`
- Check connection URL in settings
- Look for CORS or network errors in Developer Tools console

#### Issue: Changes not reflected
**Solution:**
- Recompile: `npm run compile`
- Reload Extension Development Host: Cmd+R / Ctrl+R
- Or restart debugging session

## Running Automated Tests

### Unit Tests (Jest)

Currently, test files need to be created. When implemented, run:

```bash
npm test
```

### Linting

Check code quality:

```bash
npm run lint
```

Fix auto-fixable issues:

```bash
npm run lint -- --fix
```

## Test Checklist

Use this checklist to ensure all Phase 1 features are working:

### Extension Scaffold
- [ ] Extension activates without errors
- [ ] TypeScript compiles without errors
- [ ] Webpack bundles successfully
- [ ] No linting errors

### Tree View
- [ ] Tree view appears in sidebar
- [ ] "Not connected" state displays correctly
- [ ] Connect button works
- [ ] Disconnect button works
- [ ] Refresh button works

### Registry Connection
- [ ] Can connect to local registry
- [ ] Connection settings are read correctly
- [ ] Multiple connections can be configured
- [ ] Connection selection works

### Hierarchy Navigation
- [ ] Groups load and display
- [ ] Groups can be expanded
- [ ] Artifacts load within groups
- [ ] Artifacts can be expanded
- [ ] Versions load within artifacts
- [ ] Correct icons for each level

### Error Handling
- [ ] Graceful handling when registry unavailable
- [ ] Error messages are user-friendly
- [ ] Extension doesn't crash on errors

### Performance
- [ ] Tree loads within reasonable time (< 2 seconds for small registries)
- [ ] No memory leaks after multiple refresh cycles
- [ ] Smooth expansion/collapse of nodes

## Next Steps

Once Phase 1 testing is complete and all tests pass:

1. **Document any bugs found** in GitHub issues
2. **Move to Phase 2** - Enhanced tree functionality and search
3. **Consider adding:**
   - Unit tests for service classes
   - Integration tests with mock registry
   - E2E tests for user workflows

## Additional Resources

- [VSCode Extension API](https://code.visualstudio.com/api)
- [TreeDataProvider Documentation](https://code.visualstudio.com/api/extension-guides/tree-view)
- [Debugging Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Apicurio Registry API Docs](https://www.apicur.io/registry/docs/)
