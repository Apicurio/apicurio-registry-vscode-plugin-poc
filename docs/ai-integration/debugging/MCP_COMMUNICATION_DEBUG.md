# MCP Communication Debugging Guide

**Issue:** Claude Code sends requests to MCP Server, server responds (visible in podman logs), but Claude Code hangs waiting for response.

**Status:** Active debugging
**Date:** 2025-11-11

---

## Problem Description

### Symptoms
- ✅ Claude Code connects to MCP Server successfully
- ✅ Claude Code sends requests (e.g., "List all groups")
- ✅ MCP Server receives request and processes it (visible in podman logs)
- ❌ Claude Code hangs/waits indefinitely
- ❌ Response never reaches Claude Code

### Root Cause Possibilities
1. **stdout/stderr contamination** - Logs polluting stdout channel
2. **Missing newline delimiter** - JSON messages not terminated with `\n`
3. **Invalid JSON-RPC format** - Response not following protocol
4. **Content buffering** - Output not flushed immediately

---

## MCP stdio Protocol Requirements

### Critical Rules

**1. stdout is ONLY for JSON-RPC messages**
```
✅ CORRECT - stdout:
{"jsonrpc":"2.0","id":1,"result":{...}}\n

❌ WRONG - stdout:
Processing request...
{"jsonrpc":"2.0","id":1,"result":{...}}\n
```

**2. All logs MUST go to stderr**
```javascript
// ✅ CORRECT
console.error('Processing list_groups request');  // stderr
console.log(JSON.stringify(response) + '\n');     // stdout

// ❌ WRONG
console.log('Processing list_groups request');    // stdout!
console.log(JSON.stringify(response) + '\n');     // stdout
```

**3. Every message MUST end with newline**
```
✅ CORRECT: {"jsonrpc":"2.0",...}\n
❌ WRONG:   {"jsonrpc":"2.0",...}
```

**4. Messages must be flushed immediately**
```javascript
// ✅ CORRECT
process.stdout.write(JSON.stringify(response) + '\n');

// ❌ WRONG (buffered)
console.log(JSON.stringify(response));  // May be buffered
```

---

## Debugging Steps

### Step 1: Check MCP Server Output

**Run MCP server manually to see raw output:**

```bash
# Terminal 1: Start MCP server manually
podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Send a manual request:**

```bash
# Terminal 2: Send initialize request
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | podman run -i --rm -e REGISTRY_URL=http://host.containers.internal:8080 quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**What to look for:**
- ✅ **GOOD**: Only JSON on stdout, logs on stderr
- ❌ **BAD**: Mixed logs and JSON on stdout
- ❌ **BAD**: No newline after JSON
- ❌ **BAD**: No output at all

---

### Step 2: Check Response Format

**Correct JSON-RPC 2.0 Response Format:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "groups": [
      {
        "groupId": "default",
        "artifactsCount": 3
      }
    ]
  }
}
```

**Must have:**
- ✅ `"jsonrpc": "2.0"` field
- ✅ `"id"` field matching request ID
- ✅ Either `"result"` or `"error"` field
- ✅ Newline (`\n`) at end

---

### Step 3: Test with MCP Inspector

**Install MCP Inspector:**
```bash
npm install -g @modelcontextprotocol/inspector
```

**Run inspection:**
```bash
mcp-inspector podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**What it shows:**
- All stdin/stdout communication
- Protocol violations
- Timing issues
- Malformed messages

---

### Step 4: Check for stdout Pollution

**Common culprits:**

```javascript
// ❌ BAD - These pollute stdout:
console.log('Starting server...');
console.info('Connected to registry');
console.debug('Processing request');

// ✅ GOOD - Use stderr for logs:
console.error('Starting server...');
console.error('Connected to registry');
process.stderr.write('Processing request\n');
```

**Check MCP Server code for:**
- Any `console.log()` calls (should be `console.error()`)
- Any `process.stdout.write()` calls that aren't JSON-RPC
- Any debugging output
- Any progress indicators

---

### Step 5: Verify Newline Termination

**Check if responses end with newline:**

```bash
# Capture raw output
podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot \
  < test-request.json | xxd

# Look for newline (0a) at end of each JSON message
```

---

### Step 6: Test Message Flow

**Create test request file:**

```bash
# test-initialize.json
cat > test-initialize.json << 'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
EOF
```

**Test manually:**

```bash
cat test-initialize.json | podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Expected output (stdout only):**
```json
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{...}},"serverInfo":{...}}}
```

---

## Common Issues and Fixes

### Issue 1: Logs on stdout

**Problem:**
```
Starting MCP server...
Connecting to registry...
{"jsonrpc":"2.0","id":1,"result":{...}}
```

**Fix:** Redirect all logs to stderr
```javascript
// Before
console.log('Starting MCP server...');

// After
console.error('Starting MCP server...');
```

---

### Issue 2: Missing newline

**Problem:**
```javascript
process.stdout.write(JSON.stringify(response));  // No \n
```

**Fix:**
```javascript
process.stdout.write(JSON.stringify(response) + '\n');
```

---

### Issue 3: Buffered output

**Problem:** Output not appearing until process ends

**Fix:** Flush immediately
```javascript
process.stdout.write(JSON.stringify(response) + '\n');
// Node.js typically auto-flushes on \n, but to be safe:
// process.stdout.uncork(); // if using cork()
```

---

### Issue 4: Multiple messages without delimiter

**Problem:**
```
{"jsonrpc":"2.0","id":1,"result":{...}}{"jsonrpc":"2.0","id":2,"result":{...}}
```

**Fix:** Ensure newline between messages
```
{"jsonrpc":"2.0","id":1,"result":{...}}
{"jsonrpc":"2.0","id":2,"result":{...}}
```

---

## Diagnostic Commands

### Check podman logs for stdout pollution

```bash
# Get container ID
podman ps | grep apicurio-registry-mcp

# View real-time logs
podman logs -f <container-id>
```

**Look for:**
- ❌ Any non-JSON text before/after JSON messages
- ❌ Multiple JSON objects without newlines between them
- ❌ Incomplete JSON objects
- ✅ Clean JSON-RPC messages only

---

### Test with minimal client

**Create minimal test client:**

```javascript
// test-client.js
const { spawn } = require('child_process');

const mcp = spawn('podman', [
  'run', '-i', '--rm',
  '-e', 'REGISTRY_URL=http://host.containers.internal:8080',
  'quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot'
]);

mcp.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
  try {
    const parsed = JSON.parse(data.toString());
    console.log('✅ Valid JSON-RPC:', parsed);
  } catch (e) {
    console.log('❌ Invalid JSON:', e.message);
  }
});

mcp.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

// Send initialize
const init = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test', version: '1.0' }
  }
};

mcp.stdin.write(JSON.stringify(init) + '\n');
```

**Run it:**
```bash
node test-client.js
```

---

## MCP Server Code Checklist

**Review MCP server code for:**

- [ ] All `console.log()` changed to `console.error()`
- [ ] All JSON-RPC responses use `process.stdout.write()`
- [ ] Every response ends with `\n`
- [ ] No debugging output on stdout
- [ ] No progress indicators on stdout
- [ ] Response format matches JSON-RPC 2.0 exactly
- [ ] `id` field matches request `id`
- [ ] `jsonrpc` field is always `"2.0"`
- [ ] Has either `result` or `error` field

---

## Expected vs Actual

### Expected Behavior

**Claude Code → MCP Server:**
```
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

**MCP Server → Claude Code (stdout):**
```
{"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}
```

**MCP Server logs (stderr):**
```
[INFO] Received tools/list request
[INFO] Returning 17 tools
```

### Actual Behavior (Broken)

**Claude Code → MCP Server:** ✅ Works
```
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

**MCP Server → ??? (stdout):**
```
[INFO] Received tools/list request
{"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}
[INFO] Returning 17 tools
```
^ Logs polluting stdout! Claude Code can't parse this.

---

## Quick Fix Template

**If MCP server is polluting stdout:**

```diff
- console.log('Processing request:', method);
+ console.error('Processing request:', method);

- console.info('Connected to registry');
+ console.error('Connected to registry');

  // Only stdout should be:
  process.stdout.write(JSON.stringify(response) + '\n');
```

---

## Testing After Fix

**1. Manual test:**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | podman run -i --rm -e REGISTRY_URL=http://host.containers.internal:8080 quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Expected:** Clean JSON on stdout, logs on stderr

**2. Claude Code test:**
```bash
# Restart Claude Code
claude

# Ask:
"List all groups in the Apicurio Registry"
```

**Expected:** Claude Code calls `list_groups` and receives response within 2-3 seconds

---

## Next Steps

1. ✅ Identify which issue is occurring (stdout pollution most likely)
2. ✅ Fix MCP server code (change console.log to console.error)
3. ✅ Rebuild MCP server container
4. ✅ Test with manual request
5. ✅ Test with Claude Code
6. ✅ Document fix

---

## Related Documentation

- MCP stdio Protocol: https://modelcontextprotocol.io/docs/concepts/transports#stdio
- JSON-RPC 2.0 Spec: https://www.jsonrpc.org/specification
- MCP Debugging: `docs/ai-integration/MCP_DEBUGGING_GUIDE.md`

---

**Last Updated:** 2025-11-11
**Status:** Active debugging
