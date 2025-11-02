# Quick Test Steps - Claude Code + VSCode Plugin

**Quick reference for testing the integrated workflow**

---

## 🚀 Quick Start (5 minutes)

### 1. Setup (one-time)

```bash
# Terminal 1: Start Registry
cd apicurio-registry/app
../mvnw quarkus:dev

# Terminal 2: Configure MCP
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry
claude mcp add --transport stdio \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -- apicurio-registry podman run -i --rm \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# Verify
claude mcp list  # Should show: ✓ Connected
```

### 2. Launch VSCode Plugin

```bash
cd apicurio-vscode-plugin
code .
# Press F5 to launch Extension Development Host
```

### 3. Connect Plugin to Registry

In Extension Development Host:
1. Open Explorer (Cmd+Shift+E)
2. Find "APICURIO REGISTRY" section
3. Click "Connect to Registry"
4. URL: `http://localhost:8080`
5. Auth: `none`

---

## ✅ Quick Tests

### Test 1: List Groups (30 seconds)

**Claude terminal:**
```bash
cd apicurio-registry
claude
```

**Prompt:**
```
List all groups in the Apicurio Registry
```

**Verify:** Groups match in both Claude output and VSCode tree view

---

### Test 2: Create Group (1 minute)

**Claude prompt:**
```
Create a new group called "test-apis" with description "Testing AI integration"
```

**Verify:**
1. Refresh VSCode tree view
2. New group "test-apis" appears

---

### Test 3: Create OpenAPI Schema (2 minutes)

**Claude prompt:**
```
Create an OpenAPI 3.0 schema for a simple TODO API:
- Artifact ID: todo-api
- Group: test-apis
- Endpoints: GET /todos, POST /todos, GET /todos/{id}, PUT /todos/{id}, DELETE /todos/{id}
- TODO model: id, title, completed, createdAt

Register this in the Apicurio Registry.
```

**Verify:**
1. Refresh VSCode tree view
2. Expand "test-apis" group
3. See "todo-api" artifact
4. Right-click → Open Content
5. Schema loads in editor

---

### Test 4: Create New Version (1 minute)

**Claude prompt:**
```
Update the todo-api schema to add a new field "priority" (enum: low, medium, high) to the TODO model. Create this as version 2.
```

**Verify:**
1. Refresh tree view
2. Expand "todo-api"
3. See version 2
4. Open both versions, compare

---

## 🎯 One-Line Tests

Quick smoke tests:

```bash
# From apicurio-registry directory

# List groups
echo "List all groups" | claude -p

# Create group
echo "Create group 'demo' with description 'Demo group'" | claude -p

# Search
echo "Search for artifacts with 'api' in the name" | claude -p
```

---

## 🔍 Verification Checklist

After each test:
- [ ] Claude response is correct
- [ ] No errors in Claude output
- [ ] VSCode tree view updates after refresh
- [ ] Can open artifact content in editor
- [ ] Content is valid (OpenAPI/AsyncAPI/etc.)

---

## 🐛 Quick Troubleshooting

**MCP not connected?**
```bash
# Check directory
pwd  # Should be: .../apicurio-registry

# Re-check connection
claude mcp list
```

**Plugin not showing data?**
1. Is registry running? `curl http://localhost:8080/apis/registry/v3/system/info`
2. Click Refresh button in tree view
3. Check VSCode Developer Tools for errors

**Claude can't create artifact?**
- Check artifact ID has no spaces
- Check group exists first
- Try simpler schema

---

## 📝 Test Template

Use this for consistent testing:

```
Test: [What you're testing]
Claude Prompt: [Exact prompt used]
Expected: [What should happen]
Actual: [What actually happened]
VSCode: [What VSCode shows]
Status: ✅ Pass / ❌ Fail
Notes: [Any observations]
```

Example:
```
Test: Create AsyncAPI schema
Claude Prompt: "Create AsyncAPI 3.0 schema for order events in test-apis group"
Expected: Claude creates artifact, returns success
Actual: Created artifact "order-events" version 1
VSCode: Artifact appears in test-apis group, content is valid AsyncAPI
Status: ✅ Pass
Notes: Schema generation took ~5 seconds, content looks good
```

---

## 🎬 Demo Script (5 minutes)

Perfect for showing someone the integration:

1. **Show empty registry** (VSCode tree view)

2. **Ask Claude to create group:**
   ```
   Create a group called "demo-apis" for demonstration purposes
   ```

3. **Show group appears in VSCode** (refresh tree)

4. **Ask Claude to create schema:**
   ```
   Create an OpenAPI 3.0 schema for a simple user API with GET and POST /users endpoints.
   Use artifact ID "user-api" in group "demo-apis".
   ```

5. **Show artifact in VSCode** (refresh, expand, open)

6. **Ask Claude to enhance schema:**
   ```
   Add a PATCH /users/{id} endpoint to update user email. Create as version 2.
   ```

7. **Show version 2 in VSCode** (compare versions)

8. **Finale:**
   ```
   Create three more APIs: product-api, order-api, and inventory-api, all in the demo-apis group.
   ```

9. **Show final state** (VSCode tree with all artifacts)

**Demo time: ~5 minutes**
**Wow factor: High** ⭐

---

## 🎯 Success Metrics

After testing, you should achieve:

- ✅ 100% of Claude-created artifacts visible in VSCode
- ✅ 100% of manually created artifacts visible to Claude
- ✅ < 10 seconds from creation to visibility (with refresh)
- ✅ Zero errors in normal workflow
- ✅ Valid schemas generated by Claude
- ✅ Bidirectional sync working (Claude ↔️ VSCode)

---

**Version**: 1.0
**Updated**: 2025-10-31
