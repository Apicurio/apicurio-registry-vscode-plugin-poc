# Manual MCP Debugging Guide

**Purpose:** Debug MCP server communication issues manually

---

## Current Issue

**Symptom:** Claude Code hangs when calling MCP tools, connection drops after ~46 seconds

**Error Found:**
```
Claude Code Zod validation error:
- Expects: JSON-RPC requests (with "method" field)
- Receives: JSON-RPC responses (with "id" and "result")
- Result: Schema validation fails, treats response as invalid
```

---

## Debugging Tools Available

### 1. Raw MCP Communication Test
```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin
./debug-mcp-raw.sh
```

**What it shows:**
- Every JSON-RPC request sent
- Every JSON-RPC response received
- Whether stdout is clean (no logs mixed in)
- Response structure (id, result, error)

### 2. Live Claude Code Log Monitoring
```bash
# Terminal 1: Watch logs
tail -f $(ls -t ~/.claude/debug/*.txt | head -1) | grep --line-buffered "apicurio"

# Terminal 2: Run Claude Code
cd /Users/astranier/apicurio-test-workspace
claude
```

### 3. Check Recent Logs
```bash
./check-claude-logs.sh
```

### 4. Extract Full Error Details
```bash
python3 << 'PYEOF'
import re
with open('$(ls -t ~/.claude/debug/*.txt | head -1)', 'r') as f:
    content = f.read()
    matches = list(re.finditer(r'\[DEBUG\] MCP server "apicurio-registry": Connection error: \[', content))
    if matches:
        start = matches[-1].start()
        end = min(start + 3000, len(content))
        print(content[start:end])
PYEOF
```

---

## Key Files & Locations

### Configuration Files
```bash
# Claude Code global config
cat ~/.claude.json | jq '.projects["/Users/astranier/apicurio-test-workspace"]'

# Project-specific settings
cat /Users/astranier/apicurio-test-workspace/.claude/settings.local.json

# User settings
cat ~/.claude/settings.json
```

### Log Files
```bash
# List all logs (newest first)
ls -lth ~/.claude/debug/*.txt | head -10

# View latest log
cat $(ls -t ~/.claude/debug/*.txt | head -1)

# Follow latest log in real-time
tail -f $(ls -t ~/.claude/debug/*.txt | head -1)
```

### MCP Server Image
```bash
# Check current version
podman images | grep apicurio-registry-mcp-server

# Pull latest
podman pull quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# Check container logs (if running detached)
podman logs <container-id>
```

---

## Manual Test Commands

### Test 1: Verify MCP Server Works (Standalone)
```bash
(
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
  sleep 0.5
  echo '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}'
  sleep 0.5
  echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_groups","arguments":{"order":"asc","orderBy":"groupId"}}}'
  sleep 3
) | podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot 2>/dev/null
```

**Expected:** Two JSON responses, clean output

### Test 2: Verify Configuration
```bash
cd /Users/astranier/apicurio-test-workspace
claude mcp list
```

**Expected:** `apicurio-registry - ✓ Connected`

### Test 3: Check Environment Variables in Config
```bash
cat ~/.claude.json | jq '.projects["/Users/astranier/apicurio-test-workspace"].mcpServers["apicurio-registry"].args'
```

**Expected:** Should see `-e QUARKUS_LOG_CONSOLE_STDERR=true` in args array

### Test 4: Verify Registry is Accessible
```bash
curl -s http://localhost:8080/apis/registry/v3/groups | jq .
```

**Expected:** List of groups from Registry

---

## What to Look For

### In MCP Server Output (Standalone Test)

**✅ Good:**
```json
{"jsonrpc":"2.0","id":1,"result":{"capabilities":{...}}}
{"jsonrpc":"2.0","id":2,"result":{"isError":false,"content":[...]}}
```

**❌ Bad:**
```
INFO [io.quarkus] apicurio-registry-mcp-server started...  # Logs on stdout
{"jsonrpc":"2.0","id":1,"result":{...}}  # Mixed with logs
```

### In Claude Code Logs

**✅ Good:**
```
[DEBUG] MCP server "apicurio-registry": Successfully connected to stdio server
[DEBUG] MCP server "apicurio-registry": Calling MCP tool: list_groups
[DEBUG] MCP server "apicurio-registry": Tool 'list_groups' completed successfully
```

**❌ Bad:**
```
[DEBUG] MCP server "apicurio-registry": STDIO connection dropped after 46s uptime
[DEBUG] MCP server "apicurio-registry": Connection error: [...]
[DEBUG] MCP server "apicurio-registry": Tool 'list_groups' still running (30s elapsed)
```

### In Configuration

**✅ Good format (env vars inline):**
```json
{
  "args": [
    "run", "-i", "--rm",
    "-e", "REGISTRY_URL=...",
    "-e", "QUARKUS_LOG_CONSOLE_STDERR=true",
    "image"
  ],
  "env": {}
}
```

**❌ Bad format (env vars in object - doesn't work for Docker):**
```json
{
  "args": ["run", "-i", "--rm", "image"],
  "env": {
    "REGISTRY_URL": "...",
    "QUARKUS_LOG_CONSOLE_STDERR": "true"
  }
}
```

---

## Debugging Scenarios

### Scenario 1: Server Crashes Immediately

**Symptoms:**
- `claude mcp list` shows "✗ Not connected"
- Container exits right after start

**Debug steps:**
```bash
# Run server with stderr visible
podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot \
  --help

# Check if Registry is accessible
curl http://localhost:8080/apis/registry/v3/groups
```

### Scenario 2: Server Connects but Hangs

**Symptoms:**
- `claude mcp list` shows "✓ Connected"
- Claude Code hangs when calling tools
- Logs show "still running" messages

**Debug steps:**
```bash
# Test manually first
./debug-mcp-raw.sh

# Compare with Claude Code
tail -f $(ls -t ~/.claude/debug/*.txt | head -1) | grep "apicurio"

# Check for validation errors
grep -A 50 "Connection error" $(ls -t ~/.claude/debug/*.txt | head -1)
```

### Scenario 3: Stdout Pollution

**Symptoms:**
- Manual test shows logs mixed with JSON
- "Connection error" about invalid JSON

**Debug steps:**
```bash
# Test stdout cleanliness
./test-mcp-fixed.sh

# Verify QUARKUS_LOG_CONSOLE_STDERR is set
cat ~/.claude.json | jq '.projects["/Users/astranier/apicurio-test-workspace"].mcpServers["apicurio-registry"]'
```

### Scenario 4: Zod Validation Error

**Symptoms:**
- Logs show: `"unrecognized_keys": ["id", "result"]`
- Connection drops after 46s
- Manual tests work perfectly

**This is the current issue!**

**Debug steps:**
```bash
# Extract full error
python3 << 'PYEOF'
import re, json
with open('$(ls -t ~/.claude/debug/*.txt | head -1)', 'r') as f:
    content = f.read()
    matches = list(re.finditer(r'Connection error: \[', content))
    if matches:
        start = matches[-1].start() + 18
        # Try to find the end of the JSON array
        depth = 1
        pos = start
        while depth > 0 and pos < len(content):
            if content[pos] == '[': depth += 1
            if content[pos] == ']': depth -= 1
            pos += 1
        error_json = content[start:pos]
        try:
            print(json.dumps(json.loads(error_json), indent=2))
        except:
            print(error_json)
PYEOF
```

---

## Environment Variables for More Debug Info

```bash
# Enable verbose MCP debugging
export MCP_DEBUG=1

# Enable Claude Code debug logging
export ANTHROPIC_LOG=debug

# Then run Claude Code
cd /Users/astranier/apicurio-test-workspace
claude
```

---

## Quick Reference Commands

```bash
# Test MCP server manually
./debug-mcp-raw.sh

# Watch Claude Code logs live
tail -f $(ls -t ~/.claude/debug/*.txt | head -1) | grep "apicurio"

# Check MCP configuration
claude mcp list

# Pull latest server image
podman pull quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# View full error from logs
./check-claude-logs.sh

# Test Registry connectivity
curl http://localhost:8080/apis/registry/v3/groups

# Verify env vars are inline
cat ~/.claude.json | jq '.projects["/Users/astranier/apicurio-test-workspace"].mcpServers["apicurio-registry"].args' | grep -c "QUARKUS_LOG_CONSOLE_STDERR"
```

---

## Known Issues

### Issue: Zod Validation Error (Current)

**Error:**
```json
{
  "code": "invalid_union",
  "unionErrors": [{
    "issues": [{
      "code": "unrecognized_keys",
      "keys": ["id", "result"],
      "message": "Unrecognized key(s) in object: 'id', 'result'"
    }]
  }]
}
```

**Analysis:**
- Claude Code is applying the wrong Zod schema
- Expecting JSON-RPC request (with "method")
- Receiving JSON-RPC response (with "id" and "result")
- This is a Claude Code bug, not MCP server issue

**Evidence:**
- ✅ Manual tests work perfectly
- ✅ Configuration is correct
- ✅ stdout is clean
- ❌ Claude Code validation fails

**Workaround:** None currently - this is a Claude Code bug

---

## Next Steps

1. **Verify server works:** `./debug-mcp-raw.sh`
2. **Test with Claude Code:** `cd /Users/astranier/apicurio-test-workspace && claude`
3. **Monitor logs:** `tail -f $(ls -t ~/.claude/debug/*.txt | head -1)`
4. **Extract error:** See "Scenario 4: Zod Validation Error" above
5. **Report if needed:** Gather all evidence for bug report

---

**Last Updated:** 2025-11-11
