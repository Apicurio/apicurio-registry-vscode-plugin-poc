# Plugin Workflow Testing Guide

**Date:** 2025-11-11
**Purpose:** Test the complete VSCode plugin workflow with Claude Code MCP integration

---

## Overview

This guide walks through testing the **complete plugin workflow** from VSCode extension to Claude Code integration.

---

## Prerequisites

✅ Apicurio Registry running at `http://localhost:8080`
✅ Claude Code CLI installed
✅ VSCode with Apicurio Registry extension
✅ Podman or Docker installed

---

## Test Workflow

### Step 1: Open Plugin in VSCode

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin
code .
```

### Step 2: Run Extension in Development Mode

1. Press **F5** to launch Extension Development Host
2. A new VSCode window will open with the extension loaded

### Step 3: Configure Registry Connection

In the Extension Development Host window:

1. Open Command Palette (`Cmd+Shift+P`)
2. Run: **"Apicurio Registry: Add Connection"**
3. Enter Registry URL: `http://localhost:8080/apis/registry/v3`
4. Test the connection

### Step 4: Setup MCP Server

In the Extension Development Host window:

1. Open Command Palette (`Cmd+Shift+P`)
2. Run: **"Apicurio Registry: Setup MCP Server"**
3. Follow the wizard:
   - Choose **Docker/Podman** mode
   - The wizard will generate the `claude mcp add` command
   - The command will be **copied to clipboard**

### Step 5: Verify Generated Command

The command should look like this:

```bash
claude mcp add --transport stdio apicurio-registry -- \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Critical Check:** Verify that:
- ✅ Environment variables are **inline** with `-e` flags (NOT using `--env`)
- ✅ `QUARKUS_LOG_CONSOLE_STDERR=true` is present
- ✅ Server name comes BEFORE the `--` separator

### Step 6: Run the Command

1. Open a terminal in the plugin project directory
2. Paste the command (it's in your clipboard)
3. Press Enter to run it

**Expected Output:**
```
Added stdio MCP server apicurio-registry with command: podman run -i --rm -e REGISTRY_URL=... to local config
```

### Step 7: Verify MCP Configuration

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin
claude mcp list
```

**Expected Output:**
```
Checking MCP server health...
apicurio-registry: podman run -i --rm -e REGISTRY_URL=... - ✓ Connected
```

### Step 8: Verify Configuration Format

```bash
cat ~/.claude.json | jq '.projects["/Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin"].mcpServers["apicurio-registry"]'
```

**Expected Output:**
```json
{
  "type": "stdio",
  "command": "podman",
  "args": [
    "run",
    "-i",
    "--rm",
    "-e",
    "REGISTRY_URL=http://host.containers.internal:8080",
    "-e",
    "APICURIO_MCP_SAFE_MODE=true",
    "-e",
    "APICURIO_MCP_PAGING_LIMIT=200",
    "-e",
    "QUARKUS_LOG_CONSOLE_STDERR=true",
    "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
  ],
  "env": {}
}
```

**Critical Check:** Environment variables should be **in the args array** with `-e` flags, NOT in the `env` object!

### Step 9: Test with Claude Code

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin
claude
```

**Test prompts:**

**Test 1: List Groups**
```
List all groups in my Apicurio Registry
```

**Expected:** Response within 2-3 seconds showing: ecommerce-apis, internal-apis, test-group

**Test 2: List Artifacts**
```
Show me all artifacts in the ecommerce-apis group
```

**Expected:** Response showing artifacts like orders-api, payments-api, etc.

**Test 3: Get Artifact Details**
```
Get details for the orders-api artifact
```

**Expected:** Response showing artifact metadata and versions

### Step 10: Check Logs (If Issues Occur)

```bash
ls -lt ~/.claude/debug/*.txt | head -1
cat $(ls -t ~/.claude/debug/*.txt | head -1) | grep -i "apicurio\|error"
```

**Look for:**
- ✅ "Successfully connected to Apicurio Registry"
- ✅ "Tool 'list_groups' completed successfully"
- ❌ "Connection error"
- ❌ "STDIO connection dropped"

---

## Common Issues

### Issue 1: "Connection dropped after Xs"

**Cause:** Environment variables not being passed to container

**Fix:** Verify that env vars are **inline in args array**, not in separate `env` object:

```bash
# CORRECT
"args": ["run", "-i", "--rm", "-e", "VAR=value", "image"]

# INCORRECT
"args": ["run", "-i", "--rm", "image"],
"env": {"VAR": "value"}
```

### Issue 2: "unrecognized_keys" validation error

**Cause:** Logs polluting stdout

**Fix:** Verify `QUARKUS_LOG_CONSOLE_STDERR=true` is present in args

### Issue 3: Claude Code hangs indefinitely

**Cause:** Multiple possible causes

**Debug steps:**
1. Test MCP server manually:
   ```bash
   ./test-mcp-fixed.sh
   ```
2. Check Claude Code logs for errors
3. Verify Registry is accessible at `http://host.containers.internal:8080`

---

## Success Criteria

Plugin workflow is successful when:

- ✅ VSCode extension generates correct `claude mcp add` command
- ✅ Command uses inline `-e` flags (not `--env`)
- ✅ `claude mcp list` shows "✓ Connected"
- ✅ Configuration has env vars in `args` array
- ✅ Claude Code responds to MCP tool calls within 2-3 seconds
- ✅ No "Connection dropped" errors in logs
- ✅ All 17+ MCP tools are accessible

---

## Current Status

**Plugin Code:**
- ✅ `mcpConfigurationManager.ts` generates correct command format
- ✅ `mcpServerManager.ts` has QUARKUS_LOG_CONSOLE_STDERR configured
- ✅ All documentation updated with correct format

**Testing Status:**
- ⏳ **PENDING:** Test VSCode extension in development mode
- ⏳ **PENDING:** Verify setup wizard generates correct command
- ⏳ **PENDING:** Test complete workflow with Claude Code

---

## Next Steps

1. **Launch Extension Development Host** (F5 in VSCode)
2. **Run Setup Wizard** to generate command
3. **Execute command** in terminal
4. **Test with Claude Code** to verify integration

---

## Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Setup wizard opens and runs
- [ ] Generated command has inline `-e` flags
- [ ] Command includes `QUARKUS_LOG_CONSOLE_STDERR=true`
- [ ] `claude mcp add` command succeeds
- [ ] `claude mcp list` shows "✓ Connected"
- [ ] Configuration uses `args` array for env vars
- [ ] Claude Code responds to "List all groups"
- [ ] No hanging or timeout errors
- [ ] Logs show successful tool calls

---

**Last Updated:** 2025-11-11
