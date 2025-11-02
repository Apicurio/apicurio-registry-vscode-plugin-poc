# Claude Code + MCP + VSCode Plugin Testing Guide

**Date**: 2025-10-31
**Status**: Ready for testing
**Goal**: Test the complete AI-powered schema workflow using Claude Code CLI with MCP integration

---

## Prerequisites

### 1. Environment Setup

Ensure you have:
- ✅ Apicurio Registry running at `localhost:8080`
- ✅ Podman installed and working (`podman --version`)
- ✅ Claude Code CLI installed (`claude --version`)
- ✅ VSCode installed
- ✅ Apicurio VSCode extension source code

**Verify Registry:**
```bash
curl http://localhost:8080/apis/registry/v3/system/info
# Should return JSON with version info
```

**Verify Podman:**
```bash
podman --version
# Should show: podman version 5.2.0 or later
```

**Verify Claude Code:**
```bash
claude --version
# Should show: 2.0.x (Claude Code)
```

### 2. Start Registry (if not running)

```bash
cd apicurio-registry/app
../mvnw quarkus:dev
```

Wait for: `Listening on: http://localhost:8080`

---

## Part 1: MCP Server Setup

### Step 1: Configure MCP Server

**From the `apicurio-registry` directory:**

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry

# Add MCP server
claude mcp add --transport stdio \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -- apicurio-registry podman run -i --rm \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Expected output:**
```
Added stdio MCP server apicurio-registry with command: podman run -i --rm...
File modified: /Users/astranier/.claude.json [project: /Users/astranier/Documents/dev/apicurio/apicurio-registry]
```

### Step 2: Verify MCP Connection

```bash
claude mcp list
```

**Expected output:**
```
Checking MCP server health...

apicurio-registry: podman run -i --rm quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot - ✓ Connected
```

✅ **Checkpoint**: You should see `✓ Connected`

### Step 3: Test MCP Tools (Optional)

```bash
# Get details about the MCP server
claude mcp get apicurio-registry
```

**Expected output:**
```
apicurio-registry:
  Scope: Local config (private to you in this project)
  Status: ✓ Connected
  Type: stdio
  Command: podman
  Args: run -i --rm quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
  Environment:
    REGISTRY_URL=http://host.containers.internal:8080
    APICURIO_MCP_SAFE_MODE=true
    APICURIO_MCP_PAGING_LIMIT=200
```

---

## Part 2: VSCode Plugin Setup

### Step 1: Open VSCode Plugin Project

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin
code .
```

### Step 2: Install Dependencies

In VSCode terminal:
```bash
npm install
```

### Step 3: Compile Plugin

```bash
npm run compile
```

**Expected output:**
```
> apicurio-vscode-extension@0.2.0 compile
> tsc -p ./
```

✅ **Checkpoint**: No TypeScript errors

### Step 4: Run Plugin in Extension Development Host

**Option A: Using F5 (Recommended)**
1. Open VSCode
2. Press `F5` to launch Extension Development Host
3. A new VSCode window will open with "[Extension Development Host]" in title

**Option B: Using Command Palette**
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: "Debug: Start Debugging"
3. Select "Run Extension"

### Step 5: Connect to Registry in Extension

In the **Extension Development Host** window:

1. Open Explorer sidebar (Cmd+Shift+E)
2. Look for "APICURIO REGISTRY" section
3. Click "Connect to Registry" button (plug icon)
4. Enter connection details:
   - **Registry URL**: `http://localhost:8080`
   - **Auth Type**: `none` (for local dev)
5. Click "Connect"

✅ **Checkpoint**: You should see registry groups appear in tree view

---

## Part 3: End-to-End Workflow Testing

Now we'll test the complete workflow: VSCode Plugin + Claude Code CLI + MCP integration.

### Test 1: List Groups with Claude

**Goal**: Verify Claude can see registry groups via MCP tools

**In the Extension Development Host terminal:**

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry
claude
```

**At the Claude prompt, type:**
```
List all groups in the Apicurio Registry
```

**Expected behavior:**
- Claude uses the `apicurio_registry_list_groups` MCP tool
- Shows list of groups from the registry
- If registry is empty, shows "No groups found" or similar

**Verify in VSCode:**
- The plugin tree view should show the same groups
- Groups should match between Claude's output and the tree view

✅ **Checkpoint**: Claude can list groups via MCP

---

### Test 2: Create a New Group with Claude

**Goal**: Create a group using AI, verify it appears in plugin

**In Claude terminal, type:**
```
Create a new group called "test-apis" with description "Test API schemas created with AI"
```

**Expected behavior:**
- Claude uses `apicurio_registry_create_group` MCP tool
- Creates the group in the registry
- Returns success message

**Verify in VSCode:**
1. Click "Refresh" button in Apicurio Registry tree view
2. You should see the new "test-apis" group appear
3. Expand the group - it should be empty (no artifacts yet)

✅ **Checkpoint**: Group created via Claude appears in plugin

---

### Test 3: Create an OpenAPI Schema with Claude

**Goal**: Have Claude generate and register a complete OpenAPI schema

**In Claude terminal, type:**
```
Create an OpenAPI 3.0 schema for a simple user management API with the following:
- Artifact ID: user-api
- Group: test-apis
- Endpoints:
  - GET /users - list all users
  - GET /users/{id} - get user by ID
  - POST /users - create new user
  - PUT /users/{id} - update user
  - DELETE /users/{id} - delete user
- User model with: id, username, email, createdAt

Please create this artifact in the Apicurio Registry.
```

**Expected behavior:**
- Claude generates a valid OpenAPI 3.0 schema
- Claude uses `apicurio_registry_create_artifact` MCP tool
- Artifact is created in the "test-apis" group
- Returns artifact ID and version info

**Verify in VSCode:**
1. Refresh the tree view
2. Expand "test-apis" group
3. You should see "user-api" artifact
4. Click on it to expand versions
5. You should see version "1" (or "1.0.0")
6. Right-click on version → "Open Content"
7. Schema should open in editor showing the OpenAPI spec

✅ **Checkpoint**: AI-generated schema appears in plugin and can be viewed

---

### Test 4: Modify Schema with Claude

**Goal**: Have Claude update the existing schema

**In Claude terminal, type:**
```
Update the user-api schema to add a new endpoint:
- PATCH /users/{id}/status - update user status

The status should be an enum: active, inactive, suspended

Please create this as a new version of the existing artifact.
```

**Expected behavior:**
- Claude retrieves the current schema
- Modifies it to add the new endpoint
- Creates a new version using `apicurio_registry_create_version`
- Returns new version number

**Verify in VSCode:**
1. Refresh the tree view
2. Expand "user-api" artifact
3. You should see version "2" appear
4. Right-click version 2 → "Open Content"
5. Verify the PATCH endpoint is present
6. Compare with version 1 to see the difference

✅ **Checkpoint**: Schema updates via Claude create new versions

---

### Test 5: Search for Artifacts with Claude

**Goal**: Test search functionality via MCP

**In Claude terminal, type:**
```
Search for all artifacts with "user" in the name
```

**Expected behavior:**
- Claude uses `apicurio_registry_search_artifacts` MCP tool
- Returns list of matching artifacts
- Should find "user-api" we created earlier

**Verify in VSCode:**
1. Use VSCode plugin's search functionality (if available)
2. Or manually verify the search results match what's in tree view

✅ **Checkpoint**: Search works via MCP

---

### Test 6: Get Artifact Metadata with Claude

**Goal**: Verify Claude can retrieve detailed artifact information

**In Claude terminal, type:**
```
Show me detailed information about the user-api artifact in the test-apis group
```

**Expected behavior:**
- Claude uses `apicurio_registry_get_artifact_metadata` MCP tool
- Shows artifact details: ID, name, description, versions, labels, etc.

**Verify in VSCode:**
1. Right-click on "user-api" artifact → check properties/metadata
2. Information should match what Claude shows

✅ **Checkpoint**: Metadata retrieval works

---

### Test 7: Create Multiple Schemas at Once

**Goal**: Test batch creation and verify plugin updates

**In Claude terminal, type:**
```
Create three AsyncAPI schemas in the test-apis group:

1. order-events (Artifact ID: order-events)
   - Order created event
   - Order updated event
   - Order cancelled event

2. payment-events (Artifact ID: payment-events)
   - Payment initiated event
   - Payment completed event
   - Payment failed event

3. notification-events (Artifact ID: notification-events)
   - Email notification event
   - SMS notification event

Please create all three as AsyncAPI 3.0 schemas.
```

**Expected behavior:**
- Claude creates all three artifacts
- Each has valid AsyncAPI 3.0 content
- All appear in the "test-apis" group

**Verify in VSCode:**
1. Refresh tree view
2. Expand "test-apis" group
3. You should see 4 artifacts total:
   - user-api (OpenAPI)
   - order-events (AsyncAPI)
   - payment-events (AsyncAPI)
   - notification-events (AsyncAPI)
4. Open each one to verify content

✅ **Checkpoint**: Batch creation works, plugin shows all artifacts

---

## Part 4: Advanced Testing

### Test 8: Use Plugin Context in Claude Prompts

**Goal**: Reference artifacts from plugin in Claude prompts

**Workflow:**
1. In VSCode tree view, right-click "user-api" → "Copy Artifact ID"
2. In Claude terminal, type:
```
I just copied an artifact ID. Can you show me all versions of that artifact and their differences?
```

**Note**: This tests if we can pass context from plugin to Claude

---

### Test 9: Error Handling

**Goal**: Test how Claude handles errors

**In Claude terminal, try:**
```
Create an artifact with ID "invalid artifact id" (with spaces - should fail)
```

**Expected behavior:**
- MCP tool returns error
- Claude explains the error to you
- Suggests fix (remove spaces from ID)

✅ **Checkpoint**: Error handling works correctly

---

### Test 10: Safe Mode Verification

**Goal**: Verify SAFE_MODE prevents destructive operations

**In Claude terminal, try:**
```
Delete the test-apis group
```

**Expected behavior:**
- If `APICURIO_MCP_SAFE_MODE=true`, should refuse or warn
- Claude should explain that safe mode prevents deletion

✅ **Checkpoint**: Safe mode protection working

---

## Part 5: Integration Scenarios

### Scenario 1: Full Schema Design Workflow

**Story**: Design a complete API from scratch

1. **Planning with Claude:**
```
I want to design a REST API for a blog platform. Help me plan the resources and endpoints.
```

2. **Schema Generation:**
```
Based on our discussion, create an OpenAPI 3.0 schema with all the endpoints we discussed.
Create it as artifact "blog-api" in group "test-apis".
```

3. **Review in VSCode:**
   - Open the schema in VSCode
   - Review the generated spec
   - Use plugin to navigate structure

4. **Refinement:**
```
The blog-api schema looks good, but add pagination parameters to the GET /posts endpoint.
Create this as a new version.
```

5. **Final Verification:**
   - Check both versions in VSCode
   - Compare changes
   - Verify all requirements met

✅ **Success**: Complete schema lifecycle managed

---

### Scenario 2: Schema Migration

**Story**: Migrate existing schemas to new format

1. **Check existing schemas:**
```
List all artifacts and show me which ones use OpenAPI 2.0 (Swagger)
```

2. **Migration:**
```
For any OpenAPI 2.0 schemas, create new versions upgraded to OpenAPI 3.0
```

3. **Verification in VSCode:**
   - Compare old and new versions
   - Verify conversion correctness

✅ **Success**: Migration automated with AI

---

### Scenario 3: Documentation Generation

**Story**: Generate documentation for existing schemas

1. **Request documentation:**
```
For the user-api schema, generate comprehensive API documentation including:
- Overview
- Authentication requirements
- All endpoints with examples
- Response codes and error handling
```

2. **Review in VSCode:**
   - Open the schema
   - Verify documentation quality
   - Check examples are valid

✅ **Success**: AI-generated documentation

---

## Troubleshooting

### Issue: MCP Server Not Connected

**Symptoms:**
- `claude mcp list` shows no servers
- Claude can't use registry tools

**Solution:**
```bash
# Check you're in the right directory
pwd
# Should be: /Users/astranier/Documents/dev/apicurio/apicurio-registry

# If not, cd there and check again
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry
claude mcp list
```

---

### Issue: Plugin Not Showing Artifacts

**Symptoms:**
- Tree view is empty
- "Connect to Registry" fails

**Solution:**
1. Verify registry is running:
   ```bash
   curl http://localhost:8080/apis/registry/v3/system/info
   ```

2. Check connection settings in plugin

3. Click "Refresh" button

4. Check VSCode Developer Tools console for errors:
   - Help → Toggle Developer Tools
   - Look for errors in Console tab

---

### Issue: Claude Can't See New Artifacts

**Symptoms:**
- Created artifact in plugin manually
- Claude can't find it

**Solution:**
- This is expected - there's no real-time sync
- Claude queries MCP server which queries Registry
- Refresh should work on both sides

---

### Issue: Schema Creation Fails

**Symptoms:**
- Claude tries to create schema but gets error

**Common causes:**
1. **Invalid artifact ID**: Must not have spaces, special chars
2. **Group doesn't exist**: Create group first
3. **Network issue**: Check registry is reachable
4. **MCP timeout**: Large schemas may timeout

**Solution:**
- Start with small, simple schemas
- Create groups first
- Use valid artifact IDs (lowercase, hyphens ok)

---

## Success Criteria

After completing all tests, you should be able to:

✅ Configure Claude Code CLI to use Registry MCP server
✅ See MCP server status as "Connected"
✅ Run VSCode plugin in Extension Development Host
✅ Connect plugin to local Registry
✅ Use Claude to list registry groups via MCP
✅ Create groups using Claude
✅ Create OpenAPI schemas using Claude
✅ Create AsyncAPI schemas using Claude
✅ See Claude-created artifacts in VSCode plugin
✅ Open and view schemas in VSCode editor
✅ Create new versions of schemas using Claude
✅ Search for artifacts using Claude
✅ Complete full design workflow: plan → create → review → refine

---

## Next Steps After Testing

Once testing is complete:

1. **Document findings**:
   - What works well?
   - What's confusing?
   - What could be improved?

2. **Create user documentation**:
   - Setup guide for end users
   - Common workflows
   - Best practices

3. **Enhance VSCode plugin** (optional):
   - Add "Open with Claude" command
   - Add MCP server status indicator
   - Generate setup commands

4. **Share with team**:
   - Demo the workflow
   - Gather feedback
   - Plan next features

---

## Tips for Effective Testing

1. **Use descriptive prompts**: Tell Claude exactly what you want
2. **Start simple**: Create small schemas first
3. **Verify each step**: Check plugin after each Claude operation
4. **Explore variations**: Try different schema types (OpenAPI, AsyncAPI, Avro, etc.)
5. **Test error cases**: See how Claude handles invalid inputs
6. **Document issues**: Note any bugs or UX problems
7. **Think like a user**: Would your developers use this workflow?

---

## Resources

- **Claude Code Docs**: https://docs.claude.com/en/docs/claude-code/
- **MCP Protocol**: https://modelcontextprotocol.io
- **Apicurio Registry**: http://localhost:8080/ui
- **OpenAPI Spec**: https://spec.openapis.org/oas/v3.0.0
- **AsyncAPI Spec**: https://www.asyncapi.com/docs/reference/specification/v3.0.0

---

**Document Version**: 1.0
**Last Updated**: 2025-10-31
**Status**: Ready for testing
