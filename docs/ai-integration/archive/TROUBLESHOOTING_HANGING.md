# Troubleshooting: Claude Code Hanging

**Issue:** Claude Code hangs when trying to use MCP tools
**Status:** 🔍 INVESTIGATING

---

## Problem: MCP Server Not Loading

### Root Cause

**Claude Code only loads MCP servers for the EXACT project directory configured in `~/.claude.json`!**

If you have MCP server configured for `/Users/astranier/Documents/dev/apicurio` but run Claude from `/Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin`, the MCP server **will NOT be loaded**.

---

## Quick Diagnosis

### Check 1: Which directory are you in?

```bash
pwd
# Example: /Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin
```

### Check 2: Which directory has the MCP server configured?

```bash
cat ~/.claude.json | jq '.projects | keys' | grep apicurio
```

**Output:**
```
"/Users/astranier/Documents/dev/apicurio"
"/Users/astranier/Documents/dev/apicurio/apicurio-registry"
"/Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin"
```

### Check 3: Which project has apicurio-registry MCP server?

```bash
# Check each directory
cat ~/.claude.json | jq '.projects["/Users/astranier/Documents/dev/apicurio"].mcpServers | keys'
# Output: ["apicurio-registry"]  ← MCP server configured here!

cat ~/.claude.json | jq '.projects["/Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin"].mcpServers | keys'
# Output: null  ← No MCP server!
```

### Check 4: Verify MCP server loads from correct directory

```bash
cd /Users/astranier/Documents/dev/apicurio
claude mcp list
# Should show: apicurio-registry - ✓ Connected
```

---

## Solution Options

### Option 1: Run Claude from the Correct Directory ✅ RECOMMENDED

```bash
cd /Users/astranier/Documents/dev/apicurio
claude
# Now ask: "List all groups in my Apicurio Registry"
```

**Pros:**
- ✅ No configuration changes needed
- ✅ Works immediately

**Cons:**
- ⚠️ Must remember to cd to correct directory first

---

### Option 2: Copy MCP Configuration to Subdirectory

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin

# Add MCP server configuration for THIS directory
claude mcp add --transport stdio apicurio-registry \
  -- podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# Now Claude will load MCP server when run from THIS directory
claude
```

**Pros:**
- ✅ Works from subdirectory
- ✅ Can have different configs per directory

**Cons:**
- ⚠️ Must configure for each directory
- ⚠️ Duplicate configurations to maintain

---

### Option 3: Use Global MCP Configuration (Future)

**Note:** This is not yet supported by Claude Code, but would be the ideal solution.

```bash
# Hypothetical future syntax
claude mcp add --global apicurio-registry ...
```

**Pros:**
- ✅ Works from any directory
- ✅ Single configuration

**Cons:**
- ❌ Not yet available in Claude Code

---

## Debugging Steps

### Step 1: Identify the Issue

**Symptom:** Claude Code hangs or doesn't see MCP tools

**Check Claude logs:**
```bash
tail -100 $(ls -t ~/.claude/debug/*.txt | head -1) | grep "MCP server"
```

**If you see:**
- Only `MCP server "ide"` → apicurio-registry NOT loaded ❌
- Both `MCP server "ide"` AND `MCP server "apicurio-registry"` → Both loaded ✅

### Step 2: Verify Directory Configuration

```bash
# Check current directory
pwd

# Check if THIS directory has MCP server configured
CURRENT_DIR=$(pwd)
cat ~/.claude.json | jq ".projects[\"$CURRENT_DIR\"].mcpServers | keys"
```

**If output is `null`:** MCP server is NOT configured for this directory!

### Step 3: Find Where MCP Server IS Configured

```bash
# List all projects with MCP servers
for dir in $(cat ~/.claude.json | jq -r '.projects | keys[]'); do
  servers=$(cat ~/.claude.json | jq -r ".projects[\"$dir\"].mcpServers | keys[]?" 2>/dev/null)
  if [ ! -z "$servers" ]; then
    echo "Directory: $dir"
    echo "Servers: $servers"
    echo "---"
  fi
done
```

### Step 4: Test from Correct Directory

```bash
cd <directory-with-mcp-server>
claude mcp list
# Should show: apicurio-registry - ✓ Connected

claude
# Test: "List all groups"
```

---

## Common Mistakes

### Mistake 1: Running Claude from Wrong Directory ❌

```bash
# MCP configured for:
/Users/astranier/Documents/dev/apicurio

# But running Claude from:
cd /Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin
claude  # ❌ MCP server NOT loaded!
```

**Fix:**
```bash
cd /Users/astranier/Documents/dev/apicurio
claude  # ✅ MCP server loaded!
```

---

### Mistake 2: Assuming MCP Config is Global ❌

**Claude Code MCP configurations are PER-PROJECT**, not global!

Each project directory can have its own MCP servers configured.

---

### Mistake 3: Not Checking Logs ❌

**Always check Claude logs** to see if MCP server is actually loading:

```bash
tail -f $(ls -t ~/.claude/debug/*.txt | head -1) | grep "MCP server"
```

**What you should see when it works:**
```
[DEBUG] MCP server "apicurio-registry": Initializing
[DEBUG] MCP server "apicurio-registry": Connected
[DEBUG] MCP server "apicurio-registry": Calling MCP tool: list_groups
[DEBUG] MCP server "apicurio-registry": Tool 'list_groups' completed successfully
```

---

## Verification Checklist

Before reporting "hanging" issues, verify:

- [ ] Running Claude from correct directory (where MCP is configured)
- [ ] `claude mcp list` shows apicurio-registry as "✓ Connected"
- [ ] Claude logs show apicurio-registry MCP server loading
- [ ] MCP server works standalone (run test scripts)
- [ ] Configuration has inline `-e` flags (not `env` object)
- [ ] Latest MCP server image pulled
- [ ] Registry is running and accessible at configured URL

---

## Quick Test Script

```bash
#!/bin/bash

echo "=== Claude Code MCP Diagnosis ==="
echo ""

echo "1. Current directory:"
pwd
echo ""

echo "2. MCP configuration for current directory:"
CURRENT_DIR=$(pwd)
cat ~/.claude.json | jq ".projects[\"$CURRENT_DIR\"].mcpServers" 2>/dev/null || echo "No MCP configuration for this directory!"
echo ""

echo "3. All directories with MCP servers:"
for dir in $(cat ~/.claude.json | jq -r '.projects | keys[]'); do
  servers=$(cat ~/.claude.json | jq -r ".projects[\"$dir\"].mcpServers | keys[]?" 2>/dev/null)
  if [ ! -z "$servers" ]; then
    echo "✅ $dir"
    echo "   Servers: $servers"
  fi
done
echo ""

echo "4. MCP server health check:"
claude mcp list 2>&1 | grep apicurio
echo ""

echo "5. Recent Claude logs (MCP activity):"
tail -50 $(ls -t ~/.claude/debug/*.txt | head -1) | grep "MCP server" | tail -10
echo ""

echo "=== Diagnosis Complete ==="
```

Save as `diagnose-mcp.sh`, run:
```bash
chmod +x diagnose-mcp.sh
./diagnose-mcp.sh
```

---

## Still Hanging?

If Claude Code still hangs after running from the correct directory:

1. **Check Registry is running:**
   ```bash
   curl http://localhost:8080/apis/registry/v3/groups
   ```

2. **Test MCP server standalone:**
   ```bash
   ./test-mcp-fixed.sh
   ```

3. **Check Claude logs for actual error:**
   ```bash
   tail -200 $(ls -t ~/.claude/debug/*.txt | head -1) | grep -i error
   ```

4. **Restart Claude Code:**
   ```bash
   pkill -9 claude
   claude
   ```

5. **Check for permission dialogs** - Claude may be waiting for you to approve MCP tool usage!

---

**Last Updated:** 2025-11-13
**Status:** Directory mismatch identified as common cause
