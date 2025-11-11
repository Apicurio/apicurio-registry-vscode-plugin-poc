# Getting Started with Claude Code + Apicurio Registry

**Time Required:** 15-20 minutes
**Difficulty:** Easy
**Prerequisites:** Basic terminal knowledge

This guide will walk you through setting up the complete AI-assisted workflow using Claude Code and the Apicurio Registry MCP Server.

---

## What You'll Get

After completing this guide, you'll be able to:

✅ Use Claude Code to create API schemas by describing them in natural language
✅ Have Claude automatically register schemas in Apicurio Registry
✅ Browse and edit schemas in the VSCode Extension
✅ Ask Claude to update, version, and manage your registry artifacts

---

## Prerequisites Checklist

Before starting, ensure you have:

### Required
- [ ] **Apicurio Registry** running on http://localhost:8080
- [ ] **Docker or Podman** installed and running
- [ ] **Claude Code** installed ([Download](https://claude.ai/code))
- [ ] **Node.js** installed (for VSCode extension)
- [ ] **Basic terminal knowledge** (running commands, navigating directories)

### Optional
- [ ] **VSCode** with Apicurio Extension compiled (for visual browsing)

---

## Step 1: Verify Registry is Running

**Time:** 2 minutes

### Check if Registry is Running

```bash
curl http://localhost:8080/apis/registry/v3/system/info
```

**Expected Output:**
```json
{
  "name": "Apicurio Registry",
  "version": "3.1.1",
  ...
}
```

### If Registry is NOT Running

Start the registry:

```bash
# Option 1: Using Docker
docker run -d --name apicurio-registry \
  -p 8080:8080 \
  apicurio/apicurio-registry:latest-snapshot

# Option 2: Using Podman
podman run -d --name apicurio-registry \
  -p 8080:8080 \
  apicurio/apicurio-registry:latest-snapshot

# Option 3: From source (if you have the registry repo)
cd ../apicurio-registry/app
../mvnw quarkus:dev
```

**Wait 30-60 seconds** for the registry to start, then verify again.

---

## Step 2: Navigate to Apicurio Registry Project

**Time:** 1 minute

**IMPORTANT:** Claude Code MCP configuration is project-specific. You must be in the `apicurio-registry` project directory.

```bash
cd /path/to/apicurio-registry
pwd  # Should show: .../apicurio-registry
```

**Why?** The MCP server configuration is stored in `.claude/mcp_config.json` inside the apicurio-registry project directory.

---

## Step 3: Configure MCP Server

**Time:** 3 minutes

### Check if MCP Server is Already Configured

```bash
claude mcp list
```

**If you see:**
```
apicurio-registry    ✓ Connected
```

**✅ SKIP to Step 4** - Already configured!

---

### If NOT Configured, Add MCP Server

Run this command **from the apicurio-registry directory**:

```bash
claude mcp add --transport stdio \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  -- apicurio-registry podman run -i --rm \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Using Docker instead of Podman?** Replace `podman` with `docker` in the command above.

---

### Verify Configuration

```bash
claude mcp list
```

**Expected Output:**
```
apicurio-registry    ✓ Connected
```

**✅ Success!** MCP server is configured.

---

## Step 4: Test the MCP Server

**Time:** 2 minutes

### Quick Test

Start Claude Code and ask it to list groups:

```bash
claude
```

**In Claude Code, type:**
```
List all groups in the Apicurio Registry
```

**Expected Response:**
```
I'll use the list_groups tool to query the registry...

<tool call: list_groups>
...
</tool call>

The registry currently has the following groups:
1. default (3 artifacts)
2. test-group (2 artifacts)
...
```

**✅ If you see tool calls** - MCP is working!
**❌ If Claude says "I don't have tools available"** - See Troubleshooting section below

---

## Step 5: Create Your First Schema with Claude

**Time:** 3 minutes

### Try Creating a Simple API Schema

**Ask Claude:**
```
Create an OpenAPI 3.0 schema for a simple TODO API:
- Artifact ID: todo-api
- Group: demo
- Endpoints: GET /todos, POST /todos
- TODO model: id, title, completed

Register this in the Apicurio Registry.
```

**Claude should:**
1. Check if "demo" group exists (using `list_groups`)
2. Create the group if needed (using `create_group`)
3. Create the OpenAPI schema (using `create_artifact`)
4. Confirm success

**✅ Success!** You've created your first schema with AI assistance.

---

## Step 6: Verify in Registry

**Time:** 2 minutes

### Check via curl

```bash
curl http://localhost:8080/apis/registry/v3/groups/demo/artifacts
```

**Expected:** You should see `todo-api` in the list.

---

### (Optional) Check via VSCode Extension

If you have the VSCode extension running:

1. Open VSCode with the Apicurio extension
2. Connect to registry (http://localhost:8080)
3. Click Refresh
4. Expand "demo" group
5. See "todo-api" artifact

**✅ Your schema is in the registry!**

---

## Step 7: Try More Advanced Operations

**Time:** 5 minutes

Now that the basics work, try these prompts:

### Create a New Version

```
Update the todo-api schema to add a "priority" field (enum: low, medium, high) to the TODO model. Create this as version 2.
```

### Search for Artifacts

```
Search for all artifacts with "api" in the name
```

### List All Artifacts in a Group

```
Show me all artifacts in the demo group
```

### Create Multiple Schemas

```
Create three more OpenAPI schemas in the demo group:
1. user-api (GET /users, POST /users)
2. product-api (GET /products, POST /products)
3. order-api (GET /orders, POST /orders)
```

---

## Troubleshooting

### Problem: "I don't have access to tools"

**Cause:** Claude Code isn't loading the MCP server

**Solutions:**

1. **Verify you're in the right directory:**
   ```bash
   pwd  # Should show: .../apicurio-registry
   ```

2. **Check MCP configuration:**
   ```bash
   claude mcp list
   ```
   Should show: `apicurio-registry ✓ Connected`

3. **Restart Claude Code:**
   ```bash
   # Exit Claude (Ctrl+D or type "exit")
   # Start again
   claude
   ```

4. **Check logs:**
   ```bash
   tail -f ~/Library/Application\ Support/Claude/logs/mcp-server-apicurio-registry.log
   ```

---

### Problem: "Connection refused" or "404 errors"

**Cause:** Registry not running or wrong URL

**Solutions:**

1. **Verify registry is running:**
   ```bash
   curl http://localhost:8080/apis/registry/v3/system/info
   ```

2. **Check registry logs:**
   ```bash
   # If running in Docker/Podman
   docker logs apicurio-registry
   # or
   podman logs apicurio-registry
   ```

3. **Verify REGISTRY_URL is correct:**
   - Inside container: `http://host.containers.internal:8080`
   - From your machine: `http://localhost:8080`

---

### Problem: MCP Server Won't Start

**Cause:** Container image not available or permissions issue

**Solutions:**

1. **Pull the MCP server image:**
   ```bash
   podman pull quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
   ```

2. **Test container manually:**
   ```bash
   podman run -i --rm \
     -e REGISTRY_URL=http://host.containers.internal:8080 \
     quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
   ```

3. **Check Podman/Docker is running:**
   ```bash
   podman --version
   # or
   docker --version
   ```

---

### Problem: "Safe mode prevents this operation"

**Cause:** `APICURIO_MCP_SAFE_MODE=true` blocks destructive operations

**Solution:**

This is expected! Safe mode prevents:
- Deleting groups
- Deleting artifacts
- Deleting versions
- Updating artifact content (except drafts)

To disable safe mode (use with caution):
```bash
# Remove the MCP server
claude mcp remove apicurio-registry

# Add it again WITHOUT safe mode
claude mcp add --transport stdio \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  -- apicurio-registry podman run -i --rm \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

---

## Next Steps

### Learn More

- **See real workflows:** [REAL_USER_WORKFLOW.md](REAL_USER_WORKFLOW.md)
- **Test your setup:** [QUICK_TEST_STEPS.md](QUICK_TEST_STEPS.md)
- **Understand the architecture:** [AI_WORKFLOW_ARCHITECTURE.md](AI_WORKFLOW_ARCHITECTURE.md)
- **Advanced configuration:** [CLAUDE_CODE_MCP_WORKING_CONFIG.md](CLAUDE_CODE_MCP_WORKING_CONFIG.md)

### Common Use Cases

**Design APIs with AI:**
```
Design an OpenAPI schema for an e-commerce checkout API with
cart, payment, and order confirmation endpoints. Use RESTful best practices.
```

**Version Management:**
```
Create version 2 of the user-api with these changes:
- Add GET /users/{id}/profile endpoint
- Add "avatar_url" field to user model
```

**Schema Validation:**
```
Show me all artifacts in the demo group that are OpenAPI schemas
```

**Batch Operations:**
```
Create 5 test artifacts in the test-apis group:
- product-api, order-api, user-api, payment-api, inventory-api
All should be simple OpenAPI 3.0 schemas with basic CRUD endpoints.
```

---

## Tips for Best Results

### Writing Good Prompts

✅ **Be specific about artifact details:**
```
Create an OpenAPI schema with artifact ID "user-api" in group "services"
```

✅ **Specify versions explicitly:**
```
Create this as version 2 of the existing artifact
```

✅ **Ask Claude to verify first:**
```
Check if the "demo" group exists. If not, create it. Then add the user-api artifact.
```

✅ **Request validation:**
```
List all artifacts in the demo group to verify the user-api was created
```

---

### Working Across Projects

**Remember:** MCP configuration is per-project

- `cd apicurio-registry` → Claude can manage registry
- `cd other-project` → MCP tools not available

**Tip:** Always `pwd` to check your location before starting Claude Code.

---

## Success Checklist

By now, you should be able to:

- [ ] Start Claude Code from apicurio-registry directory
- [ ] See MCP tools available to Claude
- [ ] Ask Claude to list groups
- [ ] Ask Claude to create artifacts
- [ ] See artifacts appear in registry (via curl or VSCode)
- [ ] Create new versions of existing artifacts
- [ ] Search for artifacts

**All checked?** 🎉 **You're all set!**

---

## Quick Reference Card

### Essential Commands

```bash
# Navigate to registry project
cd /path/to/apicurio-registry

# Start Claude Code
claude

# Check MCP status
claude mcp list

# View MCP logs
tail -f ~/Library/Application\ Support/Claude/logs/mcp-server-apicurio-registry.log

# Verify registry
curl http://localhost:8080/apis/registry/v3/system/info
```

### Essential Prompts

```
# List groups
List all groups in the Apicurio Registry

# Create group
Create a group called "my-apis" with description "My API schemas"

# Create artifact
Create an OpenAPI 3.0 schema for [description] in group [name]

# Create version
Update [artifact-id] to add [changes]. Create as version 2.

# Search
Search for artifacts with "[keyword]" in the name
```

---

## Getting Help

**Problems?** → [MCP_DEBUGGING_GUIDE.md](MCP_DEBUGGING_GUIDE.md)
**More examples?** → [REAL_USER_WORKFLOW.md](REAL_USER_WORKFLOW.md)
**Advanced config?** → [CLAUDE_CODE_MCP_WORKING_CONFIG.md](CLAUDE_CODE_MCP_WORKING_CONFIG.md)

---

**Happy schema designing with AI!** 🚀

*Last updated: 2025-11-11*
