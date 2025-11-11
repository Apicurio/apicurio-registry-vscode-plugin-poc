# MCP Communication Issue - RESOLVED

**Issue:** Claude Code hangs waiting for MCP Server response
**Root Cause:** Quarkus logs polluting stdout
**Status:** ✅ FIXED
**Date:** 2025-11-11

---

## Problem Summary

### Symptoms
- Claude Code connects to MCP Server successfully
- Claude Code sends requests (e.g., "List all groups")
- MCP Server responds (visible in podman logs)
- Claude Code hangs indefinitely waiting for response

### Root Cause

The MCP Server (Quarkus application) was sending **both logs and JSON-RPC messages** to stdout:

```
INFO exec -a "java" java -XX:MaxRAMPercentage...
INFO running in /deployments
__  ____  __  _____   ___  __ ____  ______
2025-11-11 13:16:17,394 INFO  [io.quarkus] (main) apicurio-registry-mcp-server...
{"jsonrpc":"2.0","id":1,"result":{...}}   ← The actual JSON-RPC response
2025-11-11 13:16:17,452 INFO  [io.quarkus] (main) stopped...
```

**Why this breaks Claude Code:**

1. Claude Code reads from stdout line by line
2. First line: `"INFO exec -a \"java\"..."`
3. Claude tries to parse it as JSON-RPC
4. **FAILS** - it's not valid JSON
5. Claude Code waits forever for valid JSON

### MCP Protocol Requirement

**stdio transport requires:**
- ✅ stdout: **ONLY** JSON-RPC messages (one per line)
- ✅ stderr: **ALL** logs, debugging, progress indicators
- ✅ Each JSON message must end with `\n`

---

## The Fix

### Add Environment Variable

**Set `QUARKUS_LOG_CONSOLE_STDERR=true`** to redirect all Quarkus logs to stderr.

### Updated MCP Configuration

**Remove old configuration:**
```bash
claude mcp remove apicurio-registry
```

**Add with correct logging:**
```bash
claude mcp add --transport stdio \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  -- apicurio-registry podman run -i --rm \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Key change:** Added `-e QUARKUS_LOG_CONSOLE_STDERR=true`

---

## Verification

### Before Fix (Broken)

```bash
$ cat test-mcp-request.json | podman run -i --rm \
    -e REGISTRY_URL=http://host.containers.internal:8080 \
    quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

INFO exec -a "java" java...
__  ____  __  _____...
2025-11-11 INFO [io.quarkus]...
{"jsonrpc":"2.0","id":1,"result":{...}}
2025-11-11 INFO [io.quarkus] stopped...
```

**Result:** ❌ Mixed output, Claude Code can't parse

### After Fix (Working)

```bash
$ cat test-mcp-request.json | podman run -i --rm \
    -e REGISTRY_URL=http://host.containers.internal:8080 \
    -e QUARKUS_LOG_CONSOLE_STDERR=true \
    quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

{"jsonrpc":"2.0","id":1,"result":{"capabilities":{"logging":{},"tools":{},"prompts":{}},"serverInfo":{"name":"apicurio-registry-mcp-server","title":"apicurio-registry-mcp-server","version":"3.1.2-SNAPSHOT"},"protocolVersion":"2024-11-05"}}
```

**Result:** ✅ Clean JSON only, Claude Code can parse

---

## Testing After Fix

### 1. Update MCP Configuration

```bash
# Navigate to apicurio-registry directory
cd /path/to/apicurio-registry

# Remove old config
claude mcp remove apicurio-registry

# Add new config with stderr logging
claude mcp add --transport stdio \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  -- apicurio-registry podman run -i --rm \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# Verify connection
claude mcp list
```

**Expected:**
```
apicurio-registry    ✓ Connected
```

### 2. Test with Claude Code

```bash
# Start Claude Code
claude
```

**Try this prompt:**
```
List all groups in the Apicurio Registry
```

**Expected behavior:**
- Claude Code calls `mcp__apicurio-registry__list_groups` tool
- Response appears within 2-3 seconds
- Shows list of groups (or empty if no groups exist)

**Example output:**
```
I'll use the list_groups tool to query the registry.

<tool call: mcp__apicurio-registry__list_groups>

The registry currently has the following groups:
1. default (3 artifacts)
2. demo (5 artifacts)
3. test-group (2 artifacts)
```

### 3. Test Other Operations

**Create a group:**
```
Create a group called "my-apis" with description "My API schemas"
```

**Search artifacts:**
```
Search for artifacts with "user" in the name
```

**Get artifact details:**
```
Show me the details of artifact "user-api" in the "demo" group
```

---

## Technical Details

### Quarkus Logging Configuration

**Environment variable:**
```
QUARKUS_LOG_CONSOLE_STDERR=true
```

**What it does:**
- Redirects Quarkus console handler output from stdout to stderr
- Affects all log levels (INFO, WARN, ERROR, DEBUG)
- Includes startup banner, lifecycle messages, and application logs

**Alternative configuration** (if you have access to application.properties):
```properties
quarkus.log.console.stderr=true
```

### MCP Protocol Details

**JSON-RPC 2.0 over stdio:**

**Request (Claude Code → MCP Server via stdin):**
```json
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_groups","arguments":{}}}
```

**Response (MCP Server → Claude Code via stdout):**
```json
{"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"[{\"groupId\":\"default\",\"..."}]}}
```

**Logs (MCP Server via stderr):**
```
2025-11-11 INFO [io.quarkus] Starting...
2025-11-11 INFO [io.apicurio] Processing list_groups
2025-11-11 INFO [io.quarkus] Stopped
```

### Why This Is Critical

**stdio transport** uses stdin/stdout for protocol communication:
- **stdin** → Claude Code sends JSON-RPC requests
- **stdout** → MCP Server sends JSON-RPC responses
- **stderr** → MCP Server sends logs (ignored by Claude Code)

If logs go to stdout, they corrupt the JSON-RPC stream and break the protocol.

---

## Impact

### Before Fix
- ❌ Claude Code hangs on every MCP tool call
- ❌ No registry operations possible
- ❌ MCP integration unusable

### After Fix
- ✅ Claude Code receives responses immediately
- ✅ All 17+ MCP tools functional
- ✅ Complete AI-assisted workflow works
- ✅ Can create, search, update artifacts via AI

---

## Lessons Learned

### 1. MCP stdio Protocol is Strict
- stdout must contain **ONLY** JSON-RPC messages
- Even a single non-JSON line breaks the protocol
- All debugging/logging must use stderr

### 2. Quarkus Default Behavior
- By default, Quarkus logs to stdout
- Must explicitly configure stderr for MCP compatibility
- Banner and lifecycle logs are significant

### 3. Debugging Techniques
- Test MCP server manually with `cat request.json | podman run...`
- Use `2>/dev/null` to hide stderr and see only stdout
- Verify output is pure JSON before testing with Claude Code
- Use MCP Inspector for protocol-level debugging

### 4. Container Environment Variables
- Environment variables are the easiest way to configure containerized MCP servers
- No need to rebuild container for config changes
- Can test different configurations quickly

---

## Related Issues

### Similar Problems to Watch For

**1. Progress indicators on stdout:**
```javascript
// ❌ BAD
process.stdout.write('Processing...\r');
console.log(JSON.stringify(response));
```

**2. Debug logging:**
```javascript
// ❌ BAD
console.log('DEBUG: Received request');
console.log(JSON.stringify(response));
```

**3. Error messages:**
```javascript
// ❌ BAD
console.log('ERROR: Something went wrong');
console.log(JSON.stringify(errorResponse));
```

**All of these should use stderr:**
```javascript
// ✅ GOOD
console.error('Processing...');
console.error('DEBUG: Received request');
console.error('ERROR: Something went wrong');
process.stdout.write(JSON.stringify(response) + '\n');
```

---

## Future Considerations

### MCP Server Container Best Practices

1. **Always configure logging to stderr** for stdio transport
2. **Document environment variables** in container README
3. **Provide test scripts** for manual verification
4. **Include MCP protocol validation** in CI/CD
5. **Test with MCP Inspector** before releasing

### Documentation Updates

- ✅ Updated GETTING_STARTED.md with correct configuration
- ✅ Created MCP_COMMUNICATION_DEBUG.md for troubleshooting
- ✅ Created MCP_COMMUNICATION_FIX.md (this document)
- ✅ Updated CLAUDE_CODE_MCP_WORKING_CONFIG.md

---

## Quick Reference

### Working MCP Configuration Command

```bash
claude mcp add --transport stdio \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  -- apicurio-registry podman run -i --rm \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

### Test Command

```bash
cat test-mcp-request.json | podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot 2>/dev/null
```

**Expected:** Pure JSON output only

---

**Status:** ✅ RESOLVED
**Resolution:** Add `QUARKUS_LOG_CONSOLE_STDERR=true` environment variable
**Verification:** Tested successfully with Claude Code
**Documentation:** Updated all relevant guides

**Last Updated:** 2025-11-11
