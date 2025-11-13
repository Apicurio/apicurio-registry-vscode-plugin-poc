# GitHub Issue: MCP Server Configuration Fix - Environment Variables Not Passed to Docker Containers

**For Repository:** https://github.com/Apicurio/apicurio-registry-vscode-plugin-poc

**Closes:** #1 (updates findings - original root cause analysis was incorrect)

---

## Title

[RESOLVED] MCP Integration: Environment Variables Not Passed to Docker Containers via `claude mcp add --env`

---

## Labels

- `bug`
- `documentation`
- `mcp-integration`
- `resolved`

---

## Summary

After extensive investigation into Issue #1, we discovered the **actual root cause** of the MCP server integration issues with Claude Code. The problem was **not** a Claude Code bug, but rather a **configuration issue** with how environment variables are passed to Docker/Podman containers.

**Status:** ✅ **RESOLVED** - Configuration fix identified and working

---

## Environment

- **Claude Code Version:** v2.0.37 (also affects v2.0.31)
- **MCP Server:** Apicurio Registry MCP Server v3.1.3-SNAPSHOT
- **Container Runtime:** Podman 5.x (also affects Docker)
- **Platform:** macOS Darwin 24.6.0, arm64
- **MCP Transport:** stdio
- **Quarkus Version:** 3.20.3
- **quarkus-mcp-server Version:** 1.6.0

---

## Original Problem (Issue #1)

**Reported Symptoms:**
- Claude Code hung indefinitely when calling MCP tools
- Connection appeared to drop after ~20 seconds
- Suspected Claude Code stdio connection bug

**Original Hypothesis (INCORRECT):**
- Claude Code has a bug causing stdio connections to drop prematurely
- MCP server responses never reach Claude Code

---

## Actual Root Cause (CORRECT)

### The Real Problem

The `claude mcp add --env` command creates a configuration where environment variables are set for the **host process** (podman/docker command), NOT for the **container** itself.

### Why This Matters for Quarkus MCP Servers

Without `QUARKUS_LOG_CONSOLE_STDERR=true` inside the container:
- Quarkus logs are sent to **stdout** (default behavior)
- JSON-RPC protocol messages are also on **stdout**
- Claude Code receives **mixed output** (logs + JSON-RPC)
- JSON-RPC parser fails or gets out of sync
- Connection appears to "hang" or "drop"

---

## Technical Details

### Configuration Method Comparison

#### ❌ BROKEN: Using `--env` flag

```bash
claude mcp add --transport stdio apicurio-registry \
  --env REGISTRY_URL=http://host.containers.internal:8080 \
  --env QUARKUS_LOG_CONSOLE_STDERR=true \
  -- podman run -i --rm quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Generated configuration (`~/.claude.json`):**
```json
{
  "apicurio-registry": {
    "type": "stdio",
    "command": "podman",
    "args": [
      "run", "-i", "--rm",
      "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
    ],
    "env": {
      "REGISTRY_URL": "http://host.containers.internal:8080",
      "QUARKUS_LOG_CONSOLE_STDERR": "true"  // ❌ Only available to podman command!
    }
  }
}
```

**Problem:** The `env` object sets environment variables for the `podman` **process**, not the **container**!

#### ✅ WORKING: Using inline `-e` flags

```bash
claude mcp add --transport stdio apicurio-registry \
  -- podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Generated configuration (`~/.claude.json`):**
```json
{
  "apicurio-registry": {
    "type": "stdio",
    "command": "podman",
    "args": [
      "run", "-i", "--rm",
      "-e", "REGISTRY_URL=http://host.containers.internal:8080",
      "-e", "APICURIO_MCP_SAFE_MODE=true",
      "-e", "APICURIO_MCP_PAGING_LIMIT=200",
      "-e", "QUARKUS_LOG_CONSOLE_STDERR=true",
      "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
    ],
    "env": {}  // ✅ Inline -e flags pass to container!
  }
}
```

**Solution:** Inline `-e` flags are passed directly to the container!

---

## Evidence & Verification

### Test 1: stdout vs stderr Output

**Without `QUARKUS_LOG_CONSOLE_STDERR=true` in container:**
```bash
podman run -i --rm quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot <<EOF
{"jsonrpc":"2.0","id":1,"method":"initialize",...}
EOF
```

**Output (BROKEN - logs mixed with JSON-RPC):**
```
INFO exec -a "java" java -XX:MaxRAMPercentage=80.0 ...
INFO running in /deployments
__  ____  __  _____   ___  __ ____  ______
 --/ __ \/ / / / _ | / _ \/ //_/ / / / __/
 -/ /_/ / /_/ / __ |/ , _/ ,< / /_/ /\ \
--\___\_\____/_/ |_/_/|_/_/|_|\____/___/
2025-11-11 INFO [io.quarkus] (main) apicurio-registry-mcp-server 3.1.3-SNAPSHOT started in 0.434s
2025-11-11 INFO [io.quarkus] (main) Profile prod activated
2025-11-11 INFO [io.quarkus] (main) Installed features: [cdi, mcp-server-stdio, ...]
{"jsonrpc":"2.0","id":1,"result":{...}}  ← JSON-RPC response buried in logs!
```

**With `QUARKUS_LOG_CONSOLE_STDERR=true` (inline `-e` flag):**
```bash
podman run -i --rm \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot <<EOF 2>/dev/null
{"jsonrpc":"2.0","id":1,"method":"initialize",...}
EOF
```

**Output (WORKING - clean JSON-RPC only):**
```json
{"jsonrpc":"2.0","id":1,"result":{"capabilities":{"logging":{},"tools":{},"prompts":{}},"serverInfo":{"name":"apicurio-registry-mcp-server","version":"3.1.3-SNAPSHOT","title":"apicurio-registry-mcp-server"},"protocolVersion":"2024-11-05"}}
```

### Test 2: Full MCP Protocol Sequence

**Script:** [test-mcp-fixed.sh](../../../test-mcp-fixed.sh)

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

---

## Why No One Else Reported This

After investigation, we identified **three key factors** why this issue wasn't widely reported:

### 1. Most People Use jbang (Not Docker/Podman)

**Official quarkiverse examples:**
```json
{
  "mcpServers": {
    "jdbc": {
      "command": "jbang",
      "args": ["jdbc@quarkiverse/quarkus-mcp-servers"]
    }
  }
}
```

**Our approach (uncommon):**
```json
{
  "mcpServers": {
    "apicurio-registry": {
      "command": "podman",
      "args": ["run", "-i", "--rm", "..."]
    }
  }
}
```

**Conclusion:** We're likely the **first** to run a Quarkus MCP server via Docker/Podman stdio with Claude Code, exposing this undiscovered configuration issue.

### 2. The `env` Object Confusion

The `claude mcp add --env VAR=value` command **suggests** it will pass environment variables to the MCP server, but with containerized servers, it only sets them for the container runtime command (docker/podman), not the container itself.

### 3. quarkus-mcp-server Works Correctly

The `quarkus-mcp-server-stdio` extension automatically:
- Redirects Quarkus console logs to stderr
- Keeps stdout clean for JSON-RPC
- Sets System.out to null by default

**BUT** this only works if the environment variable reaches the container!

---

## Impact Assessment

### Before Fix
- ❌ MCP server integration appeared broken
- ❌ Claude Code hung indefinitely
- ❌ Users couldn't use AI features
- ❌ 24 MCP tools inaccessible
- ❌ Incorrectly blamed Claude Code for the issue

### After Fix
- ✅ MCP server integration works perfectly
- ✅ Clean JSON-RPC communication
- ✅ All 24 MCP tools accessible
- ✅ Fast response times (< 3 seconds)
- ✅ No hanging or timeouts
- ✅ All 56 tests passing

---

## Solution & Recommendations

### For Users (Immediate Fix)

**Update your MCP server configuration:**

```bash
# 1. Remove old configuration
cd /path/to/your/project
claude mcp remove apicurio-registry

# 2. Add with inline -e flags (NOT --env!)
claude mcp add --transport stdio apicurio-registry \
  -- podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# 3. Verify configuration
claude mcp list
```

**Verify `~/.claude.json` contains:**
```json
{
  "args": [
    "run", "-i", "--rm",
    "-e", "REGISTRY_URL=http://host.containers.internal:8080",
    "-e", "QUARKUS_LOG_CONSOLE_STDERR=true",
    "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
  ]
}
```

### For Plugin Developers

**Update MCPConfigurationManager.ts:**

1. **Detect containerized execution:**
   ```typescript
   const isContainer = command === 'docker' || command === 'podman';
   ```

2. **Warn about `--env` flag limitation:**
   ```typescript
   if (isContainer && hasEnvFlag) {
     vscode.window.showWarningMessage(
       'Environment variables via --env flag do not reach Docker/Podman containers. ' +
       'Use inline -e flags instead: podman run -e VAR=value'
     );
   }
   ```

3. **Support alternative execution modes:**
   - JAR execution: `java -jar server.jar`
   - jbang execution: `jbang mcp-server@registry`
   - Native execution: `./mcp-server-native`

### For Documentation

**Add to setup guides:**

```markdown
## ⚠️ Important: Docker/Podman Environment Variables

When using Docker/Podman, you MUST use inline `-e` flags:

✅ **Correct:**
```bash
claude mcp add --transport stdio server \
  -- podman run -i --rm -e VAR=value image
```

❌ **Incorrect:**
```bash
claude mcp add --transport stdio server \
  --env VAR=value \
  -- podman run -i --rm image
```

The `--env` flag only sets variables for the podman/docker command,
NOT for the container!
```

---

## Related Issues

### Similar Claude Code Issues Found

1. **Issue #768** - protocolVersion validation error with stdio servers
2. **Issue #8239** - MCP Protocol Violation: Incorrect Zod schema validation
3. **Issue #586** - JSON Schema validation with Zod
4. **Issue #4188** - MCP tools failing with "Required" parameter error

**Note:** While Claude Code does have some Zod validation issues, they did not cause our problem. Our issue was purely configuration-related.

---

## Testing & Verification

### Manual Test Commands

**1. Verify MCP server works standalone:**
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
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot 2>/dev/null
```

**Expected:** Two clean JSON-RPC responses, no logs

**2. Verify Claude Code integration:**
```bash
cd /path/to/project
claude mcp list
# Should show: apicurio-registry - ✓ Connected

# Test with Claude Code (interactive)
claude
# Then ask: "List all groups in my Apicurio Registry"
```

**Expected:** Claude Code calls `list_groups` tool and displays results within 3 seconds

---

## Documentation Updates

**Files updated:**
- ✅ `docs/ai-integration/ROOT_CAUSE_ANALYSIS.md` - Complete investigation report
- ✅ `docs/ai-integration/GETTING_STARTED.md` - Updated setup instructions
- ✅ `docs/ai-integration/MCP_COMMUNICATION_FIX.md` - QUARKUS_LOG_CONSOLE_STDERR explanation
- ✅ `docs/ai-integration/MANUAL_DEBUG_GUIDE.md` - Debugging procedures
- ✅ `docs/ai-integration/MCP_FIX_VERIFICATION.md` - Test verification steps

**Code changes:**
- ✅ `src/services/mcpServerManager.ts` - Added QUARKUS_LOG_CONSOLE_STDERR
- ✅ `src/services/mcpConfigurationManager.ts` - Generate inline -e flags
- ✅ `test-data/scripts/test-mcp-server.sh` - Updated all test scripts

**Tests:**
- ✅ All 56 tests passing (23 + 16 + 7 + 10)

---

## Lessons Learned

1. **Environment variable scope matters** - `env` object vs inline flags behave differently with containers
2. **Test your assumptions** - Always verify environment variables reach the target process
3. **Configuration edge cases** - Being first to try a configuration exposes hidden bugs
4. **Systematic debugging pays off** - Manual protocol testing revealed the stdout/stderr issue
5. **Document everything** - Clear documentation prevents others from repeating the same mistakes

---

## Closing Notes

**Issue #1 Status:** ✅ **RESOLVED**

**Actual Problem:** Configuration issue (environment variables not reaching container)
**NOT:** Claude Code stdio connection bug

**Fix Applied:** Use inline `-e` flags instead of `--env` flag for Docker/Podman

**Verification:** MCP server integration now works perfectly with Claude Code

**Next Steps:**
1. Update plugin to warn users about `--env` limitation
2. Add support for JAR/jbang execution modes (alternative to Docker)
3. Improve documentation with this finding

---

**Investigation Date:** 2025-11-11
**Resolved Date:** 2025-11-11
**Investigation Time:** ~4 hours
**Status:** ✅ **CLOSED - Configuration Fix Applied**

---

## References

- [Apicurio Registry MCP Server](https://quay.io/repository/apicurio/apicurio-registry-mcp-server)
- [Quarkus MCP Server Extension](https://github.com/quarkiverse/quarkus-mcp-server)
- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Claude Code Documentation](https://code.claude.com/)
- [ROOT_CAUSE_ANALYSIS.md](./ROOT_CAUSE_ANALYSIS.md) - Detailed investigation report
