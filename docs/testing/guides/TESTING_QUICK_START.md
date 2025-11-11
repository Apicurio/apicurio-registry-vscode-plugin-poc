# Quick Start Guide - Manual Testing

## Prerequisites ✅

- ✅ Apicurio Registry v3.1.1 running at http://localhost:8080
- ✅ Registry populated with test data (3 groups, 5 artifacts, 8 versions total)
- ✅ VSCode extension compiled and ready
- ✅ Connection already configured in `.vscode/settings.json`

## Step-by-Step Testing Instructions

### 1. Launch Extension Development Host

1. **Open VSCode** with this project (`apicurio-vscode-plugin`)
2. **Press F5** (or Run → Start Debugging)
3. A new window will open with title **"[Extension Development Host]"**

### 2. Open Apicurio Registry View

In the Extension Development Host window:

1. Look at the **Explorer** sidebar (left side)
2. Find the **"Apicurio Registry"** section
3. It should show a tree view with a "Connect" button

### 3. Connect to Registry

**Option A: Connection Already Configured** (Recommended)

Since the connection is already in `.vscode/settings.json`:

1. Click the **"Connect to Registry"** button (plug icon) in the tree view toolbar
2. You should see a quick pick showing: **"Local Registry"**
3. **Select "Local Registry"**
4. You should see a notification: **"Connected to Local Registry"**

**Option B: If Connection Dialog Appears**

If VSCode asks you to configure a connection:

1. Click **"Add Connection"** or go to Settings
2. Search for: **"Apicurio Registry"**
3. Click **"Edit in settings.json"**
4. Add this configuration:

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

5. Save the file
6. Go back to the Extension Development Host and click "Connect to Registry"

### 4. Browse the Registry

After connecting, you should see the tree expand to show:

```
Apicurio Registry
├── ecommerce-apis
│   ├── orders-api
│   │   └── 1.0.0
│   ├── products-api
│   │   └── 1.0.0
│   └── users-api
│       ├── 1.0.0
│       └── 2.0.0
├── internal-apis
│   └── openapi-sample
│       └── 1.0.0
└── test-group
    └── test-api
        ├── 1.0.0
        ├── 1.1.0
        └── 2.0.0
```

### 5. Test Copy Commands

#### Test 1: Copy Group ID
1. **Right-click** on **ecommerce-apis** group
2. Select **"Copy Group ID"**
3. **Expected:**
   - Notification: "Copied group ID: ecommerce-apis"
   - Clipboard contains: `ecommerce-apis`
4. **Verify:** Paste (Cmd+V on Mac, Ctrl+V on Windows) into any text editor

#### Test 2: Copy Artifact ID
1. **Right-click** on **users-api** artifact
2. Select **"Copy Artifact ID"**
3. **Expected:**
   - Notification: "Copied artifact ID: users-api"
   - Clipboard contains: `users-api`

#### Test 3: Copy Full Reference (Artifact)
1. **Right-click** on **users-api** artifact
2. Select **"Copy Full Reference"**
3. **Expected:**
   - Notification: "Copied reference: ecommerce-apis:users-api"
   - Clipboard contains: `ecommerce-apis:users-api`

#### Test 4: Copy Version
1. **Expand** the **users-api** artifact
2. **Right-click** on version **1.0.0**
3. Select **"Copy Version"**
4. **Expected:**
   - Notification: "Copied version: 1.0.0"
   - Clipboard contains: `1.0.0`

#### Test 5: Copy Full Reference (Version)
1. **Right-click** on version **1.0.0** under users-api
2. Select **"Copy Full Reference"**
3. **Expected:**
   - Notification: "Copied reference: ecommerce-apis:users-api:1.0.0"
   - Clipboard contains: `ecommerce-apis:users-api:1.0.0`

### 6. Test Open Commands

#### Test 6: Open Artifact (Latest Version)
1. **Right-click** on **users-api** artifact
2. Select **"Open Artifact"**
3. **Expected:**
   - Progress notification appears briefly: "Opening users-api..."
   - New editor tab opens with the content
   - **YAML syntax highlighting** (keywords like `openapi:`, `info:`, `paths:` are colored)
   - Content shows version 2.0.0 (latest version)
   - Tab title shows the artifact name

#### Test 7: Open Specific Version
1. **Expand** the **users-api** artifact
2. **Right-click** on version **1.0.0**
3. Select **"Open Version"**
4. **Expected:**
   - Progress notification: "Opening users-api v1.0.0..."
   - New editor tab opens
   - **YAML syntax highlighting**
   - Content shows version 1.0.0 (simpler than v2.0.0)
   - You should notice differences (v1.0.0 has fewer endpoints)

#### Test 8: Multiple Opens
1. Open **users-api** → Open Artifact
2. Open **products-api** → Open Artifact
3. Open **orders-api** → Open Artifact
4. **Expected:**
   - 3 separate tabs open
   - Each has correct content and syntax highlighting
   - No conflicts or errors

#### Test 9: Language Detection Test
Test different artifact types (if available):
1. Open any **OPENAPI** artifact → Should have **YAML** syntax highlighting
2. Check the bottom-right of the editor for language indicator
3. **Expected:** Should show "YAML" or "OpenAPI"

### 7. Test Context Menus

#### Group Context Menu
1. **Right-click** on **ecommerce-apis** group
2. **Expected menu items:**
   - Copy Group ID

#### Artifact Context Menu
1. **Right-click** on **users-api** artifact
2. **Expected menu items (in order):**
   - **Navigation section:**
     - Open Artifact
   - **Copy section:** (separated by line)
     - Copy Artifact ID
     - Copy Full Reference

#### Version Context Menu
1. **Right-click** on version **1.0.0**
2. **Expected menu items (in order):**
   - **Navigation section:**
     - Open Version
   - **Copy section:** (separated by line)
     - Copy Version
     - Copy Full Reference

## Troubleshooting

### Registry Not Connecting
- Check registry is running: `curl http://localhost:8080/apis/registry/v3/system/info`
- Check connection settings in `.vscode/settings.json`

### No Groups Showing
- Click the Refresh button (circular arrow icon)
- Disconnect and reconnect

### Context Menu Items Missing
- Make sure you're right-clicking on the correct item type
- Check the VSCode Output panel for errors (View → Output → Select "Extension Host")

### Syntax Highlighting Not Working
- This is expected - the artifact is in an untitled document
- The language should still be set correctly (check bottom-right of editor)

## Success Criteria ✅

- [ ] Can connect to registry
- [ ] All 3 groups are visible
- [ ] Can expand groups to see artifacts
- [ ] Can expand artifacts to see versions
- [ ] Copy Group ID works and shows notification
- [ ] Copy Artifact ID works and shows notification
- [ ] Copy Version works and shows notification
- [ ] Copy Full Reference works for artifacts and versions
- [ ] Open Artifact opens latest version with YAML highlighting
- [ ] Open Version opens specific version
- [ ] No errors in Output panel
- [ ] Context menus show correct items for each node type

## After Testing

Once you've verified all tests pass:
1. Fill out the testing results in `TESTING_TASK_003.md`
2. Report any issues found
3. Decide next steps: merge to main or continue with remaining Task 003 features
