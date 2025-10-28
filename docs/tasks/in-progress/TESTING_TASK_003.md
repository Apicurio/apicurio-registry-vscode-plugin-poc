# Task 003 - Context Menus - Testing Guide

**Status:** Partial Implementation Complete (Copy + Open Commands)
**Branch:** `task/003-context-menus`
**Date:** 2025-10-27

## What's Implemented

✅ **Copy Commands (11 tests passing)**
- Copy Group ID
- Copy Artifact ID
- Copy Version
- Copy Full Reference (group:artifact or group:artifact:version)

✅ **Open/Preview Commands (16 tests passing)**
- Open Artifact (latest version)
- Open Version (specific version)
- Smart language detection (YAML, JSON, XML, Protobuf, GraphQL, etc.)
- Progress indicators
- Error handling

## Manual Testing Checklist

### Prerequisites

1. **Start Apicurio Registry:**
   ```bash
   # Make sure registry is running
   # Default: http://localhost:8080
   ```

2. **Configure Connection in VSCode:**
   - Open VSCode settings
   - Search for "Apicurio Registry"
   - Add connection:
     ```json
     {
       "name": "Local Registry",
       "url": "http://localhost:8080",
       "authType": "none"
     }
     ```

3. **Load Extension:**
   - Press F5 in VSCode (with apicurio-vscode-plugin open)
   - Extension Development Host window opens
   - Click "Apicurio Registry" in Explorer sidebar
   - Click "Connect to Registry"

### Test: Copy Commands

#### Test 1: Copy Group ID
1. Right-click on a **Group** node in tree
2. Select "Copy Group ID"
3. **Expected:**
   - Notification: "Copied group ID: {groupId}"
   - Clipboard contains the group ID
4. **Verify:** Paste (Cmd/Ctrl+V) into a text editor

#### Test 2: Copy Artifact ID
1. Right-click on an **Artifact** node
2. Select "Copy Artifact ID"
3. **Expected:**
   - Notification: "Copied artifact ID: {artifactId}"
   - Clipboard contains artifact ID
4. **Verify:** Paste into text editor

#### Test 3: Copy Full Reference (Artifact)
1. Right-click on an **Artifact** node
2. Select "Copy Full Reference"
3. **Expected:**
   - Notification: "Copied reference: group:artifact"
   - Clipboard contains "groupId:artifactId" format
4. **Verify:** Should be in format like `default:my-api`

#### Test 4: Copy Version
1. Expand an artifact to see versions
2. Right-click on a **Version** node
3. Select "Copy Version"
4. **Expected:**
   - Notification: "Copied version: {version}"
   - Clipboard contains version string (e.g., "1.0.0")

#### Test 5: Copy Full Reference (Version)
1. Right-click on a **Version** node
2. Select "Copy Full Reference"
3. **Expected:**
   - Notification: "Copied reference: group:artifact:version"
   - Format: `groupId:artifactId:version`
4. **Example:** `default:my-api:1.0.0`

#### Test 6: Error Handling
1. Create a tree node with missing data (edge case)
2. Try to copy
3. **Expected:** Error message shown

### Test: Open Commands

#### Test 7: Open Artifact (Latest Version)
1. Right-click on an **Artifact** node
2. Select "Open Artifact"
3. **Expected:**
   - Progress notification appears briefly
   - New editor tab opens with content
   - Syntax highlighting matches artifact type:
     - OPENAPI/ASYNCAPI → YAML syntax
     - JSON → JSON syntax
     - AVRO → JSON syntax
     - XSD/WSDL → XML syntax
     - GRAPHQL → GraphQL syntax

#### Test 8: Open Specific Version
1. Expand an artifact
2. Right-click on a **Version** node
3. Select "Open Version"
4. **Expected:**
   - Content loads in new tab
   - Title shows artifact + version
   - Correct syntax highlighting

#### Test 9: Multiple Opens
1. Open several artifacts in sequence
2. **Expected:**
   - Each opens in new tab
   - No conflicts
   - All have correct syntax

#### Test 10: Open Error Handling
1. Try to open artifact from disconnected registry
2. **Expected:** Error message displayed

### Test: Context Menu Structure

#### Test 11: Group Context Menu
1. Right-click on **Group**
2. **Expected Menu Items:**
   - Copy Group ID

#### Test 12: Artifact Context Menu
1. Right-click on **Artifact**
2. **Expected Menu Items (in order):**
   - **Navigation Group:**
     - Open Artifact
   - **Copy Group:**
     - Copy Artifact ID
     - Copy Full Reference

#### Test 13: Version Context Menu
1. Right-click on **Version**
2. **Expected Menu Items (in order):**
   - **Navigation Group:**
     - Open Version
   - **Copy Group:**
     - Copy Version
     - Copy Full Reference

### Test: Language Detection

#### Test 14: OpenAPI/AsyncAPI Files
1. Open an OPENAPI or ASYNCAPI artifact
2. **Expected:** YAML syntax highlighting
3. **Verify:** Keywords like `openapi:`, `paths:`, `info:` highlighted

#### Test 15: JSON Schema Files
1. Open a JSON or AVRO artifact
2. **Expected:** JSON syntax highlighting
3. **Verify:** Proper bracket matching, string colors

#### Test 16: XML Files
1. Open XSD or WSDL artifact
2. **Expected:** XML syntax highlighting
3. **Verify:** Tags, attributes properly colored

## Known Limitations (Not Yet Implemented)

❌ **Not in this phase:**
- Change State commands
- Download Content command
- Delete commands (will be in Task 007)
- Edit Metadata (will be in Phase 3)
- Add Version (will be in Task 004)

## Reporting Issues

If you find issues during testing:

1. **Note the steps to reproduce**
2. **Check browser console for errors:**
   - Help → Toggle Developer Tools
   - Check Console tab
3. **Check Extension Host logs:**
   - View → Output → Select "Extension Host"

## Success Criteria

✅ Copy commands work for all node types
✅ Notifications show on successful copy
✅ Open commands display content correctly
✅ Syntax highlighting matches file type
✅ Error messages appear for invalid operations
✅ Context menus show correct items per node type
✅ No console errors during normal operation

## Next Steps

After successful manual testing:

1. **Merge to main:**
   ```bash
   npm run test  # All tests pass
   git checkout main
   git merge task/003-context-menus
   git push
   ```

2. **Continue with remaining Task 003 features:**
   - Change State commands
   - Download Content command

3. **Or proceed to Task 004:**
   - Add Version command (depends on Task 003 foundation)

---

**Testing Date:** _______________
**Tester:** _______________
**Result:** ☐ Pass ☐ Fail ☐ Partial
**Notes:**

