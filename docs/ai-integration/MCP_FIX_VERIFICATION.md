# MCP Communication Fix - Verification Complete

**Date:** 2025-11-11
**Status:** ✅ **FIX VERIFIED - Ready for Testing**

---

## Problem Summary

Claude Code was hanging indefinitely when calling MCP tools, even though the MCP server was responding correctly.

**Root Cause Identified:**

The MCP server configuration in `~/.claude.json` for the `/Users/astranier/Documents/dev/apicurio/apicurio-registry` project was **missing the `QUARKUS_LOG_CONSOLE_STDERR=true` environment variable**.

Without this variable:
- Quarkus logs were being sent to **stdout** (standard output)
- JSON-RPC protocol messages were also on **stdout**
- Claude Code couldn't parse the mixed output
- Result: Claude Code hung waiting for valid JSON-RPC responses

---

## Fix Applied

### 1. Code Changes (Already Complete)

✅ Updated `src/services/mcpServerManager.ts`
✅ Updated `src/services/mcpConfigurationManager.ts`
✅ Updated `test-data/scripts/test-mcp-server.sh`
✅ Updated all AI integration documentation

### 2. MCP Server Configuration (Just Fixed)

**Removed old configuration:**
```bash
claude mcp remove apicurio-registry
```

**Added new configuration with fix:**
```bash
claude mcp add --transport stdio apicurio-registry \
  --env REGISTRY_URL=http://host.containers.internal:8080 \
  --env APICURIO_MCP_SAFE_MODE=true \
  --env APICURIO_MCP_PAGING_LIMIT=200 \
  --env QUARKUS_LOG_CONSOLE_STDERR=true \
  -- podman run -i --rm quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Verification:**
```bash
claude mcp list
```

**Result:**
```
apicurio-registry: podman run -i --rm quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot - ✓ Connected
```

### 3. Configuration Verification

**Checked `~/.claude.json`:**

```json
{
  "apicurio-registry": {
    "type": "stdio",
    "command": "podman",
    "args": [
      "run",
      "-i",
      "--rm",
      "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
    ],
    "env": {
      "REGISTRY_URL": "http://host.containers.internal:8080",
      "APICURIO_MCP_SAFE_MODE": "true",
      "APICURIO_MCP_PAGING_LIMIT": "200",
      "QUARKUS_LOG_CONSOLE_STDERR": "true"  // ✅ NOW PRESENT!
    }
  }
}
```

---

## Verification Tests

### Test 1: MCP Protocol Sequence

**Script:** `./test-mcp-fixed.sh`

**Results:**
```
Testing MCP Server with stdout fix...
=======================================

Validation:
===========
✅ Initialize response received
✅ list_groups response received
✅ Clean output (2 JSON responses, no logs)
✅ All output is valid JSON

Test complete!
```

**Sample Output:**
```json
{"jsonrpc":"2.0","id":1,"result":{"capabilities":{"logging":{},"tools":{},"prompts":{}},"serverInfo":{"title":"apicurio-registry-mcp-server","name":"apicurio-registry-mcp-server","version":"3.1.2-SNAPSHOT"},"protocolVersion":"2024-11-05"}}
{"jsonrpc":"2.0","id":2,"result":{"isError":false,"content":[{"text":"{\"groupId\":\"ecommerce-apis\",...}","type":"text"},{"text":"{\"groupId\":\"internal-apis\",...}","type":"text"},{"text":"{\"groupId\":\"test-group\",...}","type":"text"}]}}
```

**Key Observations:**
1. ✅ Pure JSON-RPC output - no logs mixed in
2. ✅ Proper protocol sequence: initialize → initialized → tools/call
3. ✅ Valid JSON-RPC 2.0 format with `id` and `result` fields
4. ✅ All 3 registry groups returned successfully

---

## Testing with Claude Code

Now that the MCP server is configured correctly, test the complete workflow:

### Step 1: Start a New Claude Code Conversation

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry
claude
```

### Step 2: Test Basic MCP Tool Call

**Prompt:**
```
List all groups in my Apicurio Registry
```

**Expected Behavior:**
- ✅ Claude Code calls `list_groups` MCP tool
- ✅ Response received within 2-3 seconds (no hanging!)
- ✅ Claude displays the 3 groups: ecommerce-apis, internal-apis, test-group

### Step 3: Test Other MCP Tools

**Test artifact listing:**
```
Show me all artifacts in the ecommerce-apis group
```

**Test artifact details:**
```
Get details for the orders-api artifact in ecommerce-apis
```

**Test version listing:**
```
List all versions of the orders-api artifact
```

---

## What Changed

### Before Fix

**Configuration in `~/.claude.json`:**
```json
"env": {
  "REGISTRY_URL": "http://host.containers.internal:8080",
  "APICURIO_MCP_SAFE_MODE": "true",
  "APICURIO_MCP_PAGING_LIMIT": "200"
  // ❌ MISSING: QUARKUS_LOG_CONSOLE_STDERR
}
```

**Behavior:**
- ❌ MCP server sent logs to stdout
- ❌ Claude Code couldn't parse mixed output
- ❌ Claude Code hung indefinitely
- ❌ Zod validation error: "unrecognized_keys"

### After Fix

**Configuration in `~/.claude.json`:**
```json
"env": {
  "REGISTRY_URL": "http://host.containers.internal:8080",
  "APICURIO_MCP_SAFE_MODE": "true",
  "APICURIO_MCP_PAGING_LIMIT": "200",
  "QUARKUS_LOG_CONSOLE_STDERR": "true"  // ✅ ADDED
}
```

**Behavior:**
- ✅ MCP server sends logs to stderr
- ✅ Only JSON-RPC on stdout
- ✅ Claude Code parses responses successfully
- ✅ No more hanging!

---

## Files Modified

### Plugin Code (3 files)
1. `src/services/mcpServerManager.ts`
2. `src/services/mcpConfigurationManager.ts`
3. `test-data/scripts/test-mcp-server.sh`

### Documentation (5 files)
1. `docs/ai-integration/GETTING_STARTED.md`
2. `docs/ai-integration/CLAUDE_CODE_MCP_WORKING_CONFIG.md`
3. `docs/ai-integration/MCP_COMMUNICATION_FIX.md` (new)
4. `docs/ai-integration/MCP_COMMUNICATION_DEBUG.md` (new)
5. `docs/ai-integration/MCP_FIX_IMPLEMENTATION_SUMMARY.md` (new)

### Test Scripts (2 files)
1. `test-mcp-sequence.sh` (new)
2. `test-mcp-fixed.sh` (new)

---

## Next Steps

### 1. Test with Claude Code (PRIORITY)

**Action:** Start a new Claude Code conversation and test the MCP integration

**Commands to run:**
```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry
claude
```

**Test prompts:**
- "List all groups in my Apicurio Registry"
- "Show me artifacts in ecommerce-apis"
- "Get details for orders-api"

**Success Criteria:**
- [ ] Claude Code receives responses within 2-3 seconds
- [ ] No hanging or timeout errors
- [ ] Registry data displayed correctly
- [ ] All 17+ MCP tools accessible

### 2. Test Import/Export Operations (Task 035)

Once MCP integration is verified, test the import/export functionality:

**Test workflow:**
```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin
npm run test -- --grep "importArtifacts"
npm run test -- --grep "exportAll"
```

### 3. Update Documentation

Update `docs/TODO.md` with:
- Mark "Debug MCP Server communication issue" as completed
- Update progress percentages
- Add lessons learned

---

## Lessons Learned

### 1. Environment Variable Location Matters

Two different ways to specify environment variables in `~/.claude.json`:

**Method 1: Inline in args array (used by apicurio-test-workspace):**
```json
"args": [
  "run", "-i", "--rm",
  "-e", "REGISTRY_URL=...",
  "-e", "QUARKUS_LOG_CONSOLE_STDERR=true",
  "image-name"
]
```

**Method 2: Separate env object (used by apicurio-registry):**
```json
"args": ["run", "-i", "--rm", "image-name"],
"env": {
  "REGISTRY_URL": "...",
  "QUARKUS_LOG_CONSOLE_STDERR": "true"
}
```

**Both methods work**, but you must include the environment variable in the method you choose!

### 2. Debugging MCP Issues

**Useful commands:**
```bash
# Check MCP server status
claude mcp list

# View Claude Code logs
ls -lt ~/.claude/debug/*.txt | head -1
cat $(ls -t ~/.claude/debug/*.txt | head -1)

# Test MCP server manually
./test-mcp-fixed.sh

# Check MCP configuration
cat ~/.claude.json | grep -A 20 '"apicurio-registry"'
```

### 3. Stdout vs Stderr Matters

For MCP protocol (stdio transport):
- **stdout** = JSON-RPC messages ONLY
- **stderr** = logs, banners, INFO messages

**Always set `QUARKUS_LOG_CONSOLE_STDERR=true` for Quarkus-based MCP servers!**

---

## Technical Notes

### MCP Protocol Requirements

**stdio transport:**
- Client sends JSON-RPC requests on stdin
- Server responds with JSON-RPC on stdout
- Server logs must go to stderr (not stdout!)

**JSON-RPC 2.0 format:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { ... }
}
```

### Quarkus Logging Configuration

**Environment variable:**
```bash
QUARKUS_LOG_CONSOLE_STDERR=true
```

**Java system property:**
```bash
-Dquarkus.log.console.stderr=true
```

**Effect:**
- Redirects all console logging from stdout to stderr
- Leaves stdout clean for protocol messages
- Essential for MCP stdio transport

---

## Success Metrics

### Code Quality
- ✅ All TypeScript code compiles without errors
- ✅ No linting errors
- ✅ Environment variable added to all code paths

### Testing
- ✅ Test script validates clean JSON-RPC output
- ✅ MCP server shows "✓ Connected" status
- ✅ Protocol sequence works correctly

### Documentation
- ✅ All documentation updated with fix
- ✅ Comprehensive debugging guide created
- ✅ Troubleshooting steps documented

### User Experience
- ⏳ **PENDING:** Test with Claude Code to verify no hanging
- ⏳ **PENDING:** Verify all 17+ MCP tools work correctly
- ⏳ **PENDING:** Complete end-to-end workflow test

---

**Status:** ✅ **FIX COMPLETE - READY FOR TESTING**

**Next Action:** Test with Claude Code to verify the complete workflow

**Expected Result:** Claude Code should now be able to call MCP tools without hanging!

---

**Last Updated:** 2025-11-11
**Verified By:** Claude Code AI Assistant
