# GitHub Issue: Claude Code MCP Integration Complete - Blocked by Claude Code Bug

**Copy this content to create a new issue on GitHub**

---

## Title

```
Claude Code MCP Integration Complete - Blocked by stdio Connection Bug (Claude Code v2.0.31)
```

## Labels

```
bug, blocked, claude-code, mcp, documentation
```

---

## Issue Description

### Summary

The **MCP Integration - Local Scenario** implementation is **100% complete and tested** (56 tests passing), but end-to-end AI features are blocked by a critical bug in **Claude Code v2.0.31** where stdio connections to MCP servers drop prematurely after ~20 seconds.

### Status

✅ **MCP Integration**: Complete and working
❌ **User-facing AI Features**: Blocked by Claude Code bug
📄 **Documentation**: Complete
🧪 **Tests**: 56/56 passing

---

## What We Built

### MCP Integration Components (All Complete ✅)

1. **MCPConfigurationManager** (`src/services/mcpConfigurationManager.ts`)
   - Generates correct Claude MCP CLI commands
   - Handles URL normalization (removes `/apis/registry/v3` - MCP server adds it)
   - Converts `localhost` → `host.containers.internal` for Docker networking
   - 23 tests passing ✅

2. **MCPServerManager** (`src/services/mcpServerManager.ts`)
   - Manages MCP server lifecycle
   - Supports 'claude-code' management mode
   - Verifies MCP configuration via Claude CLI
   - 16 tests passing ✅

3. **Setup Wizard** (`src/commands/setupMCPCommand.ts`)
   - Interactive 7-step configuration wizard
   - Prerequisite checks (Claude CLI, Docker/Podman, Registry connection)
   - Auto-detects local vs remote scenarios
   - Command generation with clipboard integration
   - 7 tests passing ✅

4. **Utility Commands** (`src/commands/mcpUtilityCommands.ts`)
   - `generateClaudeCommand` - Quick command generation
   - `verifyMCP` - Configuration verification
   - 10 tests passing ✅

### Commands Available

- `Apicurio MCP: Setup AI Features` - Full interactive wizard
- `Apicurio MCP: Generate Claude MCP Command` - Quick command generation
- `Apicurio MCP: Verify MCP Configuration` - Status check

### Documentation Created

- ✅ `docs/ai-integration/MCP_ARCHITECTURE_VALIDATION.md` - Architecture and implementation plan
- ✅ `docs/ai-integration/MCP_404_BUG_FIX.md` - URL duplication bug fix
- ✅ `docs/ai-integration/MCP_DEBUGGING_GUIDE.md` - Comprehensive debugging guide
- ✅ `docs/ai-integration/MCP_TESTING_GUIDE.md` - Manual testing procedures
- ✅ `docs/ai-integration/CLAUDE_CODE_BUG_REPORT.md` - Detailed bug analysis
- ✅ `docs/ai-integration/HOW_TO_VIEW_CLAUDE_CODE_LOGS.md` - Debug log access guide

---

## The Blocking Bug

### Symptom

When users ask Claude Code to use MCP tools (e.g., "List my Apicurio Registry groups"):
- Claude Code shows: `⏺ apicurio-registry - list_groups (MCP)`
- Status changes to: `✽ Enchanting… (esc to interrupt)`
- **Hangs indefinitely** - never completes or shows results
- User must press Esc to interrupt

### Root Cause

**From Claude Code debug logs** (`~/.claude/debug/latest`):

```
[DEBUG] MCP server "apicurio-registry": Calling MCP tool: get_group_metadata
[ERROR] Successfully connected to Apicurio Registry version 3.1.1 ✅
[DEBUG] STDIO connection dropped after 20s uptime ❌
[DEBUG] Connection error
[DEBUG] Tool 'get_group_metadata' still running (30s elapsed)
[DEBUG] Tool 'get_group_metadata' still running (510s elapsed)
```

**Analysis**:
1. ✅ MCP server starts successfully
2. ✅ MCP server receives request from Claude Code
3. ✅ MCP server calls Registry API successfully
4. ✅ Registry returns data (verified in container logs)
5. ✅ MCP server sends JSON-RPC response
6. ❌ **stdio connection closes after ~20 seconds**
7. ❌ Claude Code never receives the response
8. ❌ Tool hangs forever waiting for response that never arrives

### Evidence

**MCP Server Container Logs** (Working Correctly ✅):
```
2025-11-03 11:30:56,099 INFO  Successfully connected to Apicurio Registry version 3.1.1 at
http://host.containers.internal:8080/apis/registry/v3

{"jsonrpc":"2.0","id":3,"result":{
  "isError":false,
  "content":[{
    "text":"{\"groupId\":\"ecommerce-apis\",\"createdOn\":\"2025-10-28T08:45:57Z\",...}",
    "type":"text"
  }]
}}
```

**Claude Code Debug Logs** (Connection Drops ❌):
```
Line 147: [DEBUG] STDIO connection dropped after 20s uptime
Line 148: [DEBUG] Connection error
Line 239: [DEBUG] Tool 'get_group_metadata' still running (30s elapsed)
Line 255: [DEBUG] Tool 'get_group_metadata' still running (510s elapsed)
```

### Why This is a Claude Code Bug

- The MCP server is healthy and responding correctly
- The stdio connection should **not** close during tool execution
- MCP connection timeout is 30 seconds, but stdio drops at 20 seconds
- This affects all MCP tools (both simple and complex responses)
- No workaround exists (`MCP_TIMEOUT` environment variable doesn't help)

---

## Testing & Verification

### What Works ✅

**MCP Server Side**:
- ✅ Container starts successfully via stdio transport
- ✅ Connects to Apicurio Registry (version 3.1.1)
- ✅ Advertises all 24 MCP tools to Claude Code
- ✅ Receives MCP requests successfully
- ✅ Calls Registry REST API successfully
- ✅ Returns valid JSON-RPC 2.0 responses

**VSCode Extension Side**:
- ✅ Setup wizard completes successfully
- ✅ Generates correct `claude mcp add` commands
- ✅ Configuration stored correctly in `~/.claude.json`
- ✅ `claude mcp list` shows "Connected" status
- ✅ MCP server container starts when Claude Code conversation begins

### What Doesn't Work ❌

**Claude Code Processing**:
- ❌ stdio connection drops prematurely (~20 seconds)
- ❌ Claude Code never receives MCP tool responses
- ❌ Tool calls hang indefinitely
- ❌ Users cannot use any MCP features

### Test Cases Attempted

**Test 1: List Groups** (Multiple results)
```
Prompt: "List my Apicurio Registry groups"
Expected: Shows 3 groups (ecommerce-apis, internal-apis, test-group)
Actual: Hangs at "Enchanting..." ❌
```

**Test 2: Get Single Group** (Single result)
```
Prompt: "Use get_group_metadata for ecommerce-apis"
Expected: Shows group metadata
Actual: Hangs at "Enchanting..." ❌
```

**Both tests show the same stdio connection drop in debug logs.**

---

## Reproduction Steps

### Prerequisites

1. **Apicurio Registry** running at `http://localhost:8080`
2. **Claude Code CLI** v2.0.31 installed: `npm install -g @anthropic-ai/claude-code`
3. **Podman** installed and running

### Steps

1. **Configure MCP Server**:
   ```bash
   claude mcp add apicurio-registry -s local -- \
     podman run -i --rm \
     -e REGISTRY_URL=http://host.containers.internal:8080 \
     -e APICURIO_MCP_SAFE_MODE=true \
     -e APICURIO_MCP_PAGING_LIMIT=200 \
     quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
   ```

2. **Verify Configuration**:
   ```bash
   claude mcp list
   # Should show: apicurio-registry | Connected | local
   ```

3. **Start Claude Code with Debug**:
   ```bash
   cd /path/to/test/workspace
   claude chat --debug
   ```

4. **Ask Claude Code**:
   ```
   List my Apicurio Registry groups
   ```

5. **Observe**:
   - Shows "⏺ apicurio-registry - list_groups (MCP)"
   - Changes to "✽ Enchanting…"
   - **Hangs indefinitely**

6. **Check Debug Logs**:
   ```bash
   grep "STDIO connection dropped" ~/.claude/debug/latest
   # Shows: STDIO connection dropped after 20s uptime
   ```

7. **Check Container Logs**:
   ```bash
   podman ps | grep apicurio
   podman logs <container-name>
   # Shows: Successfully connected... and valid JSON-RPC response
   ```

**Result**: MCP server works correctly, Claude Code stdio connection drops

---

## Environment

**System**:
- Platform: macOS (Darwin 24.6.0)
- Architecture: arm64 (Apple Silicon)

**Claude Code**:
- Version: 2.0.31 (latest as of 2025-11-03)
- Installation: npm global package
- CLI: `claude --version` → `2.0.31 (Claude Code)`

**MCP Server**:
- Name: apicurio-registry-mcp-server
- Version: 3.1.2-SNAPSHOT
- Framework: Quarkus 3.20.2.2
- Transport: stdio
- Container: Podman 4.x
- Image: `quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot`

**Backend**:
- Apicurio Registry: 3.1.1
- URL: `http://localhost:8080/apis/registry/v3`

---

## Related Issues (Found Online)

We researched similar issues in the Claude Code GitHub repository:

1. **Issue #424**: MCP Timeout needs to be configurable
   - Similar timeout/connection issues
   - `MCP_TIMEOUT` environment variable workaround
   - However, doesn't solve stdio connection drops

2. **Issue #145**: Claude code hangs after successful MCP tool execution
   - Long-running commands cause connection issues
   - Our case: Commands complete in <1 second, still drops

3. **Issue #1611**: MCP servers fail to connect in Claude Code
   - Multiple users experiencing connection stability issues
   - Affects various MCP server types

4. **Issue #913**: Claude Code JSON Truncation Issue
   - JSON responses truncated at fixed positions
   - Probably not our issue (responses are small)

**Common Pattern**: Multiple users experiencing stdio connection and timeout issues with MCP servers in Claude Code v2.0.x

---

## Impact

### User Impact

**Severity**: **CRITICAL** - Core AI features completely unusable

**Users Cannot**:
- ❌ Use AI assistance with Apicurio Registry schemas
- ❌ List, search, or manage Registry artifacts via AI
- ❌ Leverage any of the 24 MCP tools
- ❌ Get AI-powered schema development features

**Users Can Still**:
- ✅ Use VSCode extension for manual Registry browsing (tree view, CRUD)
- ✅ Run the setup wizard to configure MCP
- ✅ Verify MCP configuration status
- ✅ See that MCP server is "Connected"

### Developer Impact

**For Apicurio VSCode Extension Development**:
- ✅ MCP integration **fully implemented and tested**
- ✅ All code complete, documented, and working
- ❌ Cannot demonstrate AI features to end users
- ❌ Cannot deliver complete AI-powered workflow
- ⏸️ **Blocked by downstream Claude Code bug**

### When Can Users Expect This to Work?

**Once Anthropic fixes the stdio connection bug in Claude Code**, the AI features will work immediately with **no changes needed** to our extension. Everything is ready on our side.

---

## Attempted Workarounds

### ❌ Workaround 1: Increase MCP_TIMEOUT
```bash
MCP_TIMEOUT=60000 claude chat
```
**Result**: Still hangs. The connection **drops** (doesn't timeout).

### ❌ Workaround 2: Simpler Responses
**Test**: Use tools that return single objects instead of lists
**Result**: Still hangs with same stdio connection drop.

### ❌ Workaround 3: Fresh Conversation
**Test**: Start new Claude Code conversation (new MCP container)
**Result**: Same issue persists.

### ❌ Workaround 4: Lower Paging Limit
```bash
-e APICURIO_MCP_PAGING_LIMIT=10
```
**Result**: Still hangs (even with only 3 groups).

### ❌ Workaround 5: Disable Safe Mode
```bash
-e APICURIO_MCP_SAFE_MODE=false
```
**Result**: No effect on stdio connection issue.

**Conclusion**: No workaround exists. This requires a fix in Claude Code.

---

## Recommendation

### For Apicurio Users

**Current Status**:
- VSCode extension MCP integration: **Complete** ✅
- AI features: **Blocked by Claude Code bug** ❌
- Manual Registry browsing: **Fully functional** ✅

**Timeline**:
- Monitor Claude Code releases: `npm outdated -g @anthropic-ai/claude-code`
- When Anthropic fixes the stdio connection bug, AI features will work immediately
- No updates needed to Apicurio VSCode extension

### For Anthropic

**We recommend Anthropic investigate**:
1. Why stdio connections to MCP servers close after ~20 seconds
2. Why connections close during active tool execution
3. Why `MCP_TIMEOUT` doesn't prevent stdio connection drops
4. Consider adding configurable stdio keep-alive/heartbeat mechanism

**Bug Report**: Complete analysis available in `docs/ai-integration/CLAUDE_CODE_BUG_REPORT.md`

---

## Testing Once Bug is Fixed

When Anthropic releases a fix:

1. **Update Claude Code**:
   ```bash
   npm update -g @anthropic-ai/claude-code
   claude --version  # Verify new version
   ```

2. **Test Basic Functionality**:
   ```bash
   claude chat
   # Ask: "List my Apicurio Registry groups"
   # Expected: Shows 3 groups with metadata
   ```

3. **Test Other MCP Tools**:
   - Get group metadata
   - List artifacts
   - Search groups
   - Create/update operations

4. **Verify in Debug Logs**:
   ```bash
   grep "completed successfully" ~/.claude/debug/latest
   # Should show successful tool completion
   # Should NOT show "STDIO connection dropped"
   ```

---

## Documentation

All documentation is complete and available in `docs/ai-integration/`:

- **MCP_ARCHITECTURE_VALIDATION.md** - Complete implementation plan and architecture
- **MCP_404_BUG_FIX.md** - URL duplication bug fix documentation
- **MCP_DEBUGGING_GUIDE.md** - 10-step systematic debugging guide
- **MCP_TESTING_GUIDE.md** - Manual testing procedures for all 3 commands
- **CLAUDE_CODE_BUG_REPORT.md** - Detailed bug analysis for Anthropic
- **HOW_TO_VIEW_CLAUDE_CODE_LOGS.md** - How to access and interpret debug logs

---

## References

**Repository**: https://github.com/Apicurio/apicurio-registry-vscode-plugin-poc

**Related Projects**:
- Apicurio Registry: https://github.com/Apicurio/apicurio-registry
- Apicurio Registry MCP Server: https://github.com/Apicurio/apicurio-registry/tree/main/mcp
- Claude Code: https://github.com/anthropics/claude-code

**MCP Specification**: https://modelcontextprotocol.io/

**Commit with Fixes**: `f6761cd` - "docs(mcp): add debug log analysis and stdio connection bug findings"

---

## Conclusion

The **MCP Integration is production-ready** and fully tested. Our implementation follows the MCP specification correctly and works as expected at the protocol level.

The blocking issue is in **Claude Code v2.0.31** where stdio connections to MCP servers drop prematurely. This is a known class of issues affecting multiple MCP server implementations (based on our research of similar GitHub issues).

**We are ready to deliver AI-powered features** as soon as Anthropic resolves the stdio connection stability issue in Claude Code.

---

**Issue Created**: 2025-11-03
**Status**: Blocked - Awaiting Claude Code fix
**Priority**: High - Affects all AI features
**Component**: Claude Code Integration
**Milestone**: MCP Integration - Phase 1

---

**Labels**: `bug`, `blocked`, `claude-code`, `mcp`, `external-dependency`, `documentation`

**Assignees**: @Apicurio/maintainers
**Projects**: Apicurio VSCode Extension
**Milestone**: v0.2.0 - MCP Integration
