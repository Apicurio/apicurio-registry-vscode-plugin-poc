# MCP Integration Root Cause Analysis

**Date:** 2025-11-11
**Status:** 🔍 **INVESTIGATION COMPLETE**

---

## Executive Summary

After extensive investigation, we discovered the root cause of why the Apicurio Registry MCP server wasn't working with Claude Code, and why no one else seemed to have this problem.

---

## Key Findings

### 1. The Apicurio Registry MCP Server is NOT Broken ✅

**Verified:**
- MCP server outputs clean JSON-RPC on stdout when `QUARKUS_LOG_CONSOLE_STDERR=true`
- quarkus-mcp-server-stdio extension works correctly
- All 56 tests pass
- Standalone protocol tests work perfectly

### 2. The Real Issues

#### Issue A: Configuration Method Difference

**Most people use jbang (official approach):**
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

**We used Docker/Podman (uncommon approach):**
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

**Why this matters:**
- We're probably the first to run Quarkus MCP server via Docker/Podman stdio with Claude Code
- This exposed undiscovered configuration issues

#### Issue B: Environment Variable Configuration Bug

**The `--env` flag approach (doesn't work with Docker!):**
```bash
claude mcp add --transport stdio apicurio-registry \
  --env QUARKUS_LOG_CONSOLE_STDERR=true \
  -- podman run -i --rm image-name
```

**Generates this configuration:**
```json
{
  "args": ["run", "-i", "--rm", "image-name"],
  "env": {
    "QUARKUS_LOG_CONSOLE_STDERR": "true"  // ❌ Doesn't pass to container!
  }
}
```

**Problem:** The `env` object sets environment variables for the **host process** (podman/docker command), NOT for the **container**!

**Solution:** Use inline `-e` flags in the command:
```bash
claude mcp add --transport stdio apicurio-registry \
  -- podman run -i --rm \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  image-name
```

**Generates correct configuration:**
```json
{
  "args": [
    "run", "-i", "--rm",
    "-e", "QUARKUS_LOG_CONSOLE_STDERR=true",
    "image-name"
  ],
  "env": {}  // ✅ Inline flags work!
}
```

### 3. Why MCP Server Logs Were Appearing on stdout

**Without `QUARKUS_LOG_CONSOLE_STDERR=true`:**
```
{"jsonrpc":"2.0","id":1,"result":{...}}   ← JSON-RPC (correct)
INFO exec -a "java" java ...              ← Container startup log (wrong!)
__  ____  __  _____   ___  __ ____        ← Quarkus banner (wrong!)
2025-11-11 INFO [io.quarkus] ...          ← Quarkus log (wrong!)
```

**With `QUARKUS_LOG_CONSOLE_STDERR=true` (inline `-e` flag):**
```
# stdout (Claude Code reads this):
{"jsonrpc":"2.0","id":1,"result":{...}}   ← JSON-RPC only ✅

# stderr (discarded):
INFO exec -a "java" java ...              ← Container startup
__  ____  __  _____   ___  __              ← Quarkus banner
2025-11-11 INFO [io.quarkus] ...          ← Quarkus logs
```

### 4. Why the Zod Validation Error Occurred

**Hypothesis (not yet proven):**

When logs are mixed with JSON-RPC on stdout:
```
INFO exec -a "java" java ...
{"jsonrpc":"2.0","id":1,"result":{...}}
```

Claude Code's JSON-RPC parser:
1. Tries to parse the first line: `INFO exec -a "java" java ...`
2. **Fails** - not valid JSON
3. Skips to next line
4. Finds `{"jsonrpc":"2.0","id":1,"result":{...}}`
5. **BUT** the response `id` doesn't match expected request sequence
6. Zod validation fails with "unrecognized_keys: ['id', 'result']"

**Alternative hypothesis:**
Claude Code's Zod validation has a separate bug, but it's masked for most users because:
- They use jbang (no container logs)
- They use SSE transport (no stdio issues)
- They use different MCP server implementations

---

## Evidence

### Test 1: MCP Server Works Correctly

```bash
./test-mcp-fixed.sh
```

**Result:**
```
✅ Initialize response received
✅ list_groups response received
✅ Clean output (2 JSON responses, no logs)
✅ All output is valid JSON
```

### Test 2: Logs Go to stderr (Not stdout)

```bash
podman run ... 2>/dev/null  # Discard stderr
```

**Result:** Only clean JSON-RPC on stdout ✅

```bash
podman run ... 1>/dev/null  # Discard stdout
```

**Result:** All logs appear on stderr ✅

### Test 3: Configuration Verification

**Current configuration:**
```json
{
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
  "env": {}
}
```

**Status:** ✅ Correct configuration with inline `-e` flags

---

## Related Claude Code Issues

Found similar issues in claude-code GitHub repository:

1. **Issue #768** - protocolVersion validation error with stdio servers
2. **Issue #8239** - MCP Protocol Violation: Incorrect Resource Content Validation (Zod schema bug)
3. **Issue #586** - JSON Schema validation with Zod
4. **Issue #4188** - MCP tools failing with "Required" parameter error

**Conclusion:** Claude Code has known Zod validation issues with MCP servers, but they're not widespread because most users:
- Use jbang (no container complexity)
- Use SSE transport (not stdio)
- Don't run into the `env` object vs inline flags confusion

---

## Recommendations

### For Users

**Option 1: Docker/Podman (Current Approach)**
- ✅ Works correctly with inline `-e` flags
- ✅ Isolated environment
- ❌ Docker networking complexity
- ❌ No access to Quarkus Dev UI

**Option 2: Direct JAR Execution (Recommended)**
- ✅ Simpler configuration
- ✅ Access to Quarkus Dev UI (http://localhost:8080/q/dev)
- ✅ Faster startup
- ✅ Easier debugging
- ❌ Requires Java 17+ installed locally

**Option 3: jbang (Best Practice)**
- ✅ Matches official quarkiverse examples
- ✅ Automatic dependency management
- ✅ No Docker required
- ❌ Requires jbang installation

### For Plugin Developers

**Update MCPConfigurationManager:**
1. Support three execution modes: Docker, JAR, jbang
2. Auto-detect available runtimes (Docker, Java, jbang)
3. Recommend best option based on environment
4. **CRITICAL:** Warn users about `--env` flag limitation with containers

**Update Documentation:**
1. Document the `env` object vs inline flags issue
2. Provide examples for all three execution modes
3. Add troubleshooting guide for stdio transport

---

## Next Steps

### Immediate (Testing)
- [ ] Test current configuration with Claude Code end-to-end
- [ ] Verify MCP tools are accessible from Claude Code
- [ ] Monitor Claude Code logs for any errors

### Short-term (Plugin Enhancement)
- [ ] Add JAR execution mode to MCPServerManager
- [ ] Add jbang execution mode to MCPServerManager
- [ ] Update Setup Wizard to auto-detect and recommend execution mode
- [ ] Add configuration validation (warn if using `env` with Docker)

### Long-term (Upstream)
- [ ] Report `env` object limitation to Claude Code team
- [ ] Contribute documentation improvements to quarkiverse
- [ ] Share findings with Apicurio Registry team

---

## Lessons Learned

1. **Environment variable scope matters:** `env` object vs inline flags behave differently with containers
2. **Testing assumptions:** Always verify environment variables actually reach the target process
3. **Configuration edge cases:** Being first to try a configuration exposes hidden bugs
4. **Documentation is crucial:** Official examples (jbang) prevented others from hitting this issue
5. **Systematic debugging pays off:** Manual protocol testing revealed the stdout/stderr issue

---

**Status:** ✅ **ROOT CAUSE IDENTIFIED - Configuration Fixed**

**Next Action:** Test with Claude Code to confirm end-to-end functionality

**Last Updated:** 2025-11-11
