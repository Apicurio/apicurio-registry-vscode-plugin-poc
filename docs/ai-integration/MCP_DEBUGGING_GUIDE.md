# MCP Debugging Guide - Troubleshooting Hanging Requests

**Created**: 2025-11-03
**Issue**: Claude Code `list_groups` call hangs with "Spelunking..." status

---

## Verified Working Components ✅

1. **MCP Server Running**: Container `elastic_khayyam` is healthy
2. **Tools Advertised**: All 24 tools successfully advertised to Claude Code
3. **Network OK**: Registry accessible from container (`curl` test succeeded)
4. **Configuration OK**: `~/.claude.json` contains correct project-specific MCP config

## Problem

When asking Claude Code: **"List my Apicurio Registry groups"**

**Expected**: Claude Code calls `list_groups` MCP tool and returns results
**Actual**: Shows "Spelunking... (esc to interrupt)" and hangs indefinitely

**No execution logs** appear in MCP server container logs (only initialization logs).

---

## Root Cause Analysis

### MCP Protocol Communication Flow

```
User asks question
    ↓
Claude Code analyzes available tools
    ↓
Claude Code determines which tool to call
    ↓
Claude Code sends JSON-RPC request via stdio
    ↓
MCP Server receives on stdin
    ↓
MCP Server processes request
    ↓
MCP Server sends JSON-RPC response via stdout
    ↓
Claude Code receives response
    ↓
Claude Code shows results to user
```

**The hang could occur at any of these steps.**

### list_groups Tool Signature

```java
List<SearchedGroup> list_groups(
    @ToolArg(description = ORDER) String order,        // REQUIRED
    @ToolArg(description = GROUP_ORDER_BY) String orderBy  // REQUIRED
)
```

**Required Parameters**:
- `order`: "desc" or "asc"
- `orderBy`: "groupId", "createdOn", or "modifiedOn"

**Hypothesis**: Claude Code might be:
1. Unable to determine appropriate parameter values
2. Waiting for user to provide parameters
3. Having issues with stdio communication

---

## Debugging Steps

### Step 1: Test with Explicit Parameters

Instead of asking a generic question, try being **very explicit** about what you want:

**Try This Prompt**:
```
Use the list_groups MCP tool with order="asc" and orderBy="groupId" to list all groups in my Apicurio Registry
```

**Expected Behavior**:
- Claude Code should directly call the tool with specified parameters
- Should skip the "Spelunking" phase
- Should return results quickly

**If this works**: The issue is Claude Code's parameter determination logic.
**If this still hangs**: The issue is deeper (stdio communication or MCP server processing).

---

### Step 2: Monitor MCP Server Logs in Real-Time

Open a new terminal and monitor container logs while making a request:

```bash
podman logs -f elastic_khayyam
```

**In Claude Code**, ask:
```
Use list_groups with order="asc" and orderBy="groupId"
```

**Watch for**:
- Any new log entries after the initialization logs
- Error messages
- Request processing indicators

**If you see new logs**: The request is reaching the server (analyze the logs).
**If you see nothing**: The request is not reaching the MCP server.

---

### Step 3: Test Simple vs Complex Tools

Try a simpler tool with fewer parameters:

**Try This Prompt**:
```
Use the get_artifact_types MCP tool to get the list of supported artifact types
```

`get_artifact_types` has **no required parameters**, so it's easier for Claude Code to call.

**If this works**: Confirms MCP connection is OK, issue is specific to `list_groups`.
**If this also hangs**: Broader MCP communication issue.

---

### Step 4: Check Claude Code's MCP Connection Status

**In your terminal** (from the test workspace directory):

```bash
cd /Users/astranier/apicurio-test-workspace

# Check if MCP server is listed
claude mcp list

# Check for any error messages
claude mcp list --verbose
```

**Expected Output**:
```
┌────────────────────┬───────────┬──────────────┐
│ Name               │ Status    │ Environment  │
├────────────────────┼───────────┼──────────────┤
│ apicurio-registry  │ Connected │ local        │
└────────────────────┴───────────┴──────────────┘
```

**If status is not "Connected"**: MCP server failed to initialize for this conversation.
**If "Connected"**: The connection was established at conversation start.

---

### Step 5: Start a Fresh Claude Code Conversation

MCP servers are initialized **once per conversation**. If there was an initialization issue, it persists for that entire conversation.

**Try**:
1. **Exit current Claude Code conversation** (Esc or close the chat)
2. **Start a NEW conversation**
3. **Wait** for MCP tools to initialize (you might see a brief loading indicator)
4. **Try again**: "List my Apicurio Registry groups"

**Why this might help**:
- MCP server is restarted fresh for new conversation
- Any stuck state is cleared
- Connection is re-established

---

### Step 6: Increase Paging Limit (Potential Timeout Issue)

The MCP server has a paging limit configured. If the Registry has many groups and the call is slow, it might timeout.

**Current configuration**: `APICURIO_MCP_PAGING_LIMIT=200`

**Test with lower limit**:

1. **Remove current MCP configuration**:
   ```bash
   claude mcp remove "apicurio-registry" -s local
   ```

2. **Re-add with lower paging limit**:
   ```bash
   claude mcp add apicurio-registry -s local -- \
     podman run -i --rm \
     -e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3 \
     -e APICURIO_MCP_SAFE_MODE=true \
     -e APICURIO_MCP_PAGING_LIMIT=10 \
     quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
   ```

3. **Start new Claude Code conversation**
4. **Try again**: "List my Apicurio Registry groups"

**If this works**: The issue was related to timeout or performance with higher paging limits.

---

### Step 7: Test with Safe Mode Disabled

Safe mode might add validation or checks that could cause delays.

**Current configuration**: `APICURIO_MCP_SAFE_MODE=true`

**Test with safe mode off**:

```bash
claude mcp remove "apicurio-registry" -s local

claude mcp add apicurio-registry -s local -- \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3 \
  -e APICURIO_MCP_SAFE_MODE=false \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Start new conversation and try again.**

---

### Step 8: Check Registry Response Time

Test how fast the Registry responds to the groups endpoint:

```bash
time curl "http://localhost:8080/apis/registry/v3/groups?limit=10"
```

**Expected**: Response in < 1 second

**If slow (> 5 seconds)**: Registry performance might be causing timeout.
**If fast**: Registry is not the bottleneck.

---

### Step 9: Enable Debug Logging in MCP Server

Check if the MCP server has a debug/verbose mode:

```bash
# Try to find debug flags
podman exec elastic_khayyam java -jar /deployments/apicurio-registry-mcp-server-3.1.2-SNAPSHOT-runner.jar --help
```

Or check Quarkus log level configuration:

```bash
claude mcp remove "apicurio-registry" -s local

claude mcp add apicurio-registry -s local -- \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -e QUARKUS_LOG_LEVEL=DEBUG \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

---

### Step 10: Test with Docker Instead of Podman

Some MCP implementations have better compatibility with Docker's stdio handling:

**If you have Docker installed**:

```bash
claude mcp remove "apicurio-registry" -s local

claude mcp add apicurio-registry -s local -- \
  docker run -i --rm \
  -e REGISTRY_URL=http://host.docker.internal:8080/apis/registry/v3 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Note**: Use `host.docker.internal` instead of `host.containers.internal` for Docker.

---

## Expected Results Summary

| Test | What It Tests | If It Works | If It Fails |
|------|---------------|-------------|-------------|
| **Step 1: Explicit params** | Claude Code's parameter logic | Issue is parameter determination | Issue is deeper (stdio or MCP server) |
| **Step 2: Real-time logs** | Request reaching server | Analyze server logs for errors | Request not reaching server (stdio issue) |
| **Step 3: Simple tool** | Basic MCP communication | MCP works, issue is `list_groups` specific | Broader MCP connection problem |
| **Step 4: Check status** | MCP initialization | MCP server properly connected | Re-initialize MCP server |
| **Step 5: Fresh conversation** | Conversation-level state | Previous conversation had issue | Persistent problem across conversations |
| **Step 6: Lower paging limit** | Timeout/performance | Paging limit was too high | Not a paging issue |
| **Step 7: Disable safe mode** | Safe mode overhead | Safe mode causing delays | Not a safe mode issue |
| **Step 8: Registry performance** | Backend speed | Registry is responsive | Registry performance issue |
| **Step 9: Debug logging** | Server-side visibility | See detailed request processing | No additional logs available |
| **Step 10: Docker vs Podman** | Container runtime compatibility | Podman stdio issue | Not a runtime issue |

---

## What to Report Back

Please share:

1. **Which step(s) you tried**
2. **What happened** (exact behavior)
3. **Any error messages** from:
   - Claude Code
   - Terminal
   - Container logs (`podman logs elastic_khayyam`)
4. **Screenshots** if helpful

---

## Quick Reference Commands

**Check MCP status**:
```bash
cd /Users/astranier/apicurio-test-workspace
claude mcp list
```

**Monitor logs**:
```bash
podman logs -f elastic_khayyam
```

**Check container**:
```bash
podman ps | grep apicurio
```

**Test Registry**:
```bash
curl "http://localhost:8080/apis/registry/v3/groups?limit=10"
```

**Restart MCP setup**:
```bash
claude mcp remove "apicurio-registry" -s local
# Then re-add with desired configuration
```

---

## Known Working Configuration

For reference, here's the configuration that **should** work:

```bash
claude mcp add apicurio-registry -s local -- \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Stored in**: `~/.claude.json` under project-specific section

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Status**: Active debugging
**Next Steps**: Execute debugging steps 1-10 systematically
