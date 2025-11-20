# Testing Guide

This guide explains how to test the Apicurio Registry VSCode extension, including manual testing and automated testing.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Manual Testing](#manual-testing)
- [Automated Testing](#automated-testing)
- [Debugging Tips](#debugging-tips)
- [Test Development Workflow](#test-development-workflow)
- [Best Practices](#best-practices)

---

## Quick Start

### 5-Minute Quick Test

**Option 1: Automated Setup**

```bash
cd apicurio-vscode-plugin
./test-data/scripts/test-setup.sh
```

The script will:
- Install dependencies
- Compile TypeScript
- Optionally start a Docker registry
- Configure VSCode settings
- Add sample data

**Option 2: Manual Setup**

```bash
# 1. Install dependencies
npm install

# 2. Compile
npm run compile

# 3. Start registry (in separate terminal)
docker run -it -p 8080:8080 apicurio/apicurio-registry:latest-snapshot

# 4. Launch in VSCode
code .
# Then press F5
```

### Quick Test Checklist

In the Extension Development Host window:

1. ✅ Open Explorer sidebar (Cmd+Shift+E / Ctrl+Shift+E)
2. ✅ Find "Apicurio Registry" section
3. ✅ Click "Connect to Registry" button (plug icon)
4. ✅ Select "Local Registry" if prompted
5. ✅ See "Connected to Local Registry" message
6. ✅ Expand tree to see Groups → Artifacts → Versions

---

## Prerequisites

Before testing, ensure you have:

1. **Node.js 16+** installed
2. **VSCode** (version 1.70.0 or later)
3. **A running Apicurio Registry instance** (see setup instructions below)

---

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

---

## Manual Testing

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

### Manual Test Scenarios

#### Test 1: Extension Activation ✓

**Goal:** Verify the extension loads correctly

**Steps:**
1. Launch Extension Development Host (F5)
2. Open the Debug Console in the main VSCode window (Cmd+Shift+Y / Ctrl+Shift+Y)
3. Look for the message: `Apicurio Registry extension is now active!`

**Expected Result:**
- Extension activates without errors
- Console shows activation message
- No error messages in the Debug Console

#### Test 2: Tree View Visibility ✓

**Goal:** Verify the tree view appears in the sidebar

**Steps:**
1. In the Extension Development Host window, open the Explorer sidebar
2. Look for "Apicurio Registry" section

**Expected Result:**
- "Apicurio Registry" view is visible in the Explorer
- Shows either "Not connected" message or connection status
- Toolbar buttons (refresh, connect) are visible

#### Test 3: Connect to Registry ✓

**Goal:** Test registry connection functionality

**Steps:**
1. Ensure your local registry is running (http://localhost:8080)
2. In the Apicurio Registry view, click the "Connect to Registry" button (plug icon)
3. If you have multiple connections configured, select "Local Registry"

**Expected Result:**
- Connection succeeds with message: "Connected to Local Registry"
- Tree view refreshes
- If registry has groups, they should appear in the tree

#### Test 4: Browse Groups ✓

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

#### Test 5: Browse Artifacts ✓

**Goal:** Verify artifact listing within groups

**Steps:**
1. Connect to registry
2. Expand a group node

**Expected Result:**
- Artifacts appear as file icons
- Artifact names are displayed
- Tooltips show artifact type
- Artifacts can be expanded to show versions

#### Test 6: Browse Versions ✓

**Goal:** Verify version listing within artifacts

**Steps:**
1. Connect to registry
2. Expand a group
3. Expand an artifact

**Expected Result:**
- Versions appear with tag icons
- Version numbers are displayed
- Tooltips show version state and creation date

#### Test 7: Copy Commands

**Test 7a: Copy Group ID**
1. Right-click on a group
2. Select "Copy Group ID"
3. **Expected:**
   - Notification: "Copied group ID: [group-name]"
   - Clipboard contains the group ID
4. **Verify:** Paste (Cmd+V / Ctrl+V) into any text editor

**Test 7b: Copy Artifact ID**
1. Right-click on an artifact
2. Select "Copy Artifact ID"
3. **Expected:**
   - Notification: "Copied artifact ID: [artifact-name]"
   - Clipboard contains the artifact ID

**Test 7c: Copy Full Reference (Artifact)**
1. Right-click on an artifact
2. Select "Copy Full Reference"
3. **Expected:**
   - Notification: "Copied reference: [group]:[artifact]"
   - Clipboard contains the full reference

**Test 7d: Copy Version**
1. Expand an artifact
2. Right-click on a version
3. Select "Copy Version"
4. **Expected:**
   - Notification: "Copied version: [version]"
   - Clipboard contains the version

**Test 7e: Copy Full Reference (Version)**
1. Right-click on a version
2. Select "Copy Full Reference"
3. **Expected:**
   - Notification: "Copied reference: [group]:[artifact]:[version]"
   - Clipboard contains the full reference

#### Test 8: Open Commands

**Test 8a: Open Artifact (Latest Version)**
1. Right-click on an artifact
2. Select "Open Artifact"
3. **Expected:**
   - Progress notification appears briefly: "Opening [artifact]..."
   - New editor tab opens with the content
   - YAML syntax highlighting (for OpenAPI artifacts)
   - Content shows latest version
   - Tab title shows the artifact name

**Test 8b: Open Specific Version**
1. Expand an artifact
2. Right-click on a specific version
3. Select "Open Version"
4. **Expected:**
   - Progress notification: "Opening [artifact] v[version]..."
   - New editor tab opens
   - YAML syntax highlighting
   - Content shows the specific version

---

## Automated Testing

### Running All Tests

```bash
npm test
```

This runs all unit tests with Jest.

### Running Specific Test Suites

**Search Tests:**
```bash
npx jest --testPathPattern="search"
```

**Export/Import Tests:**
```bash
npx jest --testPathPattern="exportCommand|importCommand"
```

**Service Tests:**
```bash
npx jest registryService.test.ts
```

**Provider Tests:**
```bash
npx jest registryTreeProvider.test.ts
```

**Command Tests:**
```bash
npx jest --testPathPattern="commands"
```

### Running Tests with Coverage

```bash
npm test -- --coverage
```

View coverage report:
```bash
open coverage/lcov-report/index.html
```

**Target Coverage:**
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

### Running Tests in Watch Mode

For continuous test-driven development:

```bash
npx jest --watch
```

Or for specific tests:

```bash
npx jest --testPathPattern="search" --watch
```

### Test Structure

```
src/
├── services/__tests__/
│   ├── registryService.test.ts
│   └── registryService.search.test.ts
├── providers/__tests__/
│   ├── registryTreeProvider.test.ts
│   └── registryTreeProvider.search.test.ts
└── commands/__tests__/
    ├── searchCommand.test.ts
    ├── exportCommand.test.ts
    └── importCommand.test.ts
```

### Test Files and Coverage

**Service Layer Tests:**
- `registryService.test.ts` - Basic service operations
- `registryService.search.test.ts` - Search functionality (13 tests)

**Tree Provider Tests:**
- `registryTreeProvider.test.ts` - Tree operations
- `registryTreeProvider.search.test.ts` - Search filtering (16 tests)

**Command Tests:**
- `searchCommand.test.ts` - Search commands (20 tests)
- `exportCommand.test.ts` - Export operations (14 tests)
- `importCommand.test.ts` - Import operations (19 tests)

---

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

#### Issue: ESLint Error During `npm test`
**Symptom:**
```
Error: .eslintrc.js: Configuration for rule "@typescript-eslint/naming-convention" is invalid
```

**Solution:**
Run tests directly with Jest (bypasses pretest lint):
```bash
npx jest
```

#### Issue: Tests Fail with "Not connected"
**Cause:** Mock provider not properly connected

**Solution:**
Ensure provider is connected in test setup:

```typescript
beforeEach(() => {
    mockService.isConnected = jest.fn().mockReturnValue(true);

    // Connect the provider
    await provider.connect({
        name: 'Test',
        url: 'http://localhost:8080',
        authType: 'none'
    });
});
```

---

## Test Development Workflow

### 1. Write New Test (TDD Approach)

Following the RED-GREEN-REFACTOR cycle:

```typescript
// RED: Write failing test
describe('copyGroupIdCommand', () => {
    it('should copy group ID to clipboard', async () => {
        const mockNode = { groupId: 'test-group' };
        await copyGroupIdCommand(mockNode);
        expect(mockClipboard.writeText).toHaveBeenCalledWith('test-group');
    });
});

// Run test - it MUST fail
npm test  // Expected: FAIL ❌

// GREEN: Write minimal implementation
export async function copyGroupIdCommand(node: RegistryItem): Promise<void> {
    await vscode.env.clipboard.writeText(node.groupId!);
}

// Run test - it MUST pass
npm test  // Expected: PASS ✅

// REFACTOR: Improve code
export async function copyGroupIdCommand(node: RegistryItem): Promise<void> {
    if (!node.groupId) {
        vscode.window.showErrorMessage('No group ID available');
        return;
    }
    await vscode.env.clipboard.writeText(node.groupId);
    vscode.window.showInformationMessage(`Copied: ${node.groupId}`);
}
```

### 2. Run Tests in Watch Mode

```bash
npx jest --watch
```

### 3. Fix Failing Tests

Check test output for details:
- Expected vs Received values
- Stack traces
- Mock call counts

### 4. Update Coverage

After fixes, check coverage:

```bash
npx jest --coverage --verbose
```

---

## Best Practices

### 1. Test Naming

```typescript
// Good
it('should search artifacts by type', async () => { ... });

// Bad
it('test1', async () => { ... });
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should return empty array when no results', async () => {
    // Arrange
    const mockResponse = { data: { artifacts: [] } };
    mockClient.get.mockResolvedValue(mockResponse);

    // Act
    const results = await service.searchArtifacts({ name: 'test' });

    // Assert
    expect(results).toHaveLength(0);
});
```

### 3. Clean Up After Tests

```typescript
afterEach(() => {
    jest.clearAllMocks();
});
```

### 4. Test One Thing Per Test

```typescript
// Good - Tests one specific behavior
it('should validate name is not empty', () => {
    const validator = getNameValidator();
    expect(validator('')).toBe('Name cannot be empty');
});

// Bad - Tests too many things
it('should validate and search', () => {
    // ... tests validation AND search execution
});
```

### 5. Use Descriptive Test Descriptions

```typescript
// Good
describe('Export Commands', () => {
    it('should export all artifacts to ZIP file', async () => {
        // ...
    });
});

// Bad
describe('Tests', () => {
    it('works', () => {
        // ...
    });
});
```

### 6. Mock External Dependencies

```typescript
// VSCode API Mock
jest.mock('vscode');

// Axios Mock
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn().mockReturnValue(mockClient);

// Service Mock
jest.mock('../../services/registryService');
const mockService = new RegistryService() as jest.Mocked<RegistryService>;
```

### 7. Test Error Cases

```typescript
it('should handle network errors gracefully', async () => {
    mockService.exportAll.mockRejectedValue(new Error('Network error'));

    await exportAllCommand(mockService);

    expect(mockShowErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to export')
    );
});
```

---

## Linting

Check code quality:

```bash
npm run lint
```

Fix auto-fixable issues:

```bash
npm run lint -- --fix
```

---

## Test Checklist

Use this checklist to ensure features are thoroughly tested:

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

### Commands
- [ ] Copy commands work (group ID, artifact ID, version, full reference)
- [ ] Open commands work (artifact, version)
- [ ] Search commands work
- [ ] Export commands work
- [ ] Import commands work

### Error Handling
- [ ] Graceful handling when registry unavailable
- [ ] Error messages are user-friendly
- [ ] Extension doesn't crash on errors

### Performance
- [ ] Tree loads within reasonable time (< 2 seconds for small registries)
- [ ] No memory leaks after multiple refresh cycles
- [ ] Smooth expansion/collapse of nodes

### Tests
- [ ] All unit tests passing
- [ ] Code coverage >80%
- [ ] No test warnings
- [ ] Test documentation up-to-date

---

## Additional Resources

- [VSCode Extension API](https://code.visualstudio.com/api)
- [TreeDataProvider Documentation](https://code.visualstudio.com/api/extension-guides/tree-view)
- [Debugging Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing VSCode Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Apicurio Registry API Docs](https://www.apicur.io/registry/docs/)

---

**Last Updated:** 2025-11-20
**Status:** Comprehensive testing guide for manual and automated testing
