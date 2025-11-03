# How to View Claude Code Logs

**Date**: 2025-11-03
**Purpose**: Debug and monitor Claude Code MCP integration

---

## **Quick Access to Logs**

### **Option 1: Real-Time Debug Mode** (Recommended)

```bash
cd /path/to/your/workspace
claude chat --debug
```

**Shows**:
- Real-time MCP protocol messages
- Tool execution details
- Connection status
- Errors and warnings

**Filter to MCP only**:
```bash
claude chat --debug mcp
```

---

### **Option 2: View Log Files**

**Log Directory**:
```
~/.claude/debug/
```

**Latest log** (symlink):
```bash
cat ~/.claude/debug/latest
```

**List recent logs**:
```bash
ls -lt ~/.claude/debug/ | head -10
```

**Search for specific errors**:
```bash
grep -i "error\|timeout\|dropped" ~/.claude/debug/latest
```

**Search for MCP activity**:
```bash
grep -i "mcp\|apicurio" ~/.claude/debug/latest
```

---

## **What We Found in Your Logs**

### **The Critical Bug** 🐛

From `~/.claude/debug/latest`:

```
[DEBUG] MCP server "apicurio-registry": Calling MCP tool: get_group_metadata
[ERROR] Successfully connected to Apicurio Registry version 3.1.1
[DEBUG] STDIO connection dropped after 20s uptime ❌
[DEBUG] Connection error
[DEBUG] Tool 'get_group_metadata' still running (30s elapsed)
[DEBUG] Tool 'get_group_metadata' still running (510s elapsed)
```

**Problem**: stdio connection closes after ~20 seconds while tool is still executing

**Impact**: Claude Code never receives the MCP response, hangs forever

---

## **Key Log Patterns to Look For**

### **Healthy MCP Connection**

```
[DEBUG] MCP server "apicurio-registry": Starting connection with timeout of 30000ms
[DEBUG] MCP server "apicurio-registry": Successfully connected to stdio server in XXXms
[DEBUG] MCP server "apicurio-registry": Connection established with capabilities
[DEBUG] MCP server "apicurio-registry": Tool 'xxx' completed successfully in XXms
```

### **Unhealthy MCP Connection**

```
[DEBUG] STDIO connection dropped after XXs uptime ❌
[DEBUG] Connection error
[DEBUG] Tool 'xxx' still running (XXs elapsed) ❌
[ERROR] MCP server "xxx": Server stderr: <error message>
```

### **Timeout Issues**

```
[DEBUG] Execution timeout: 10000ms  (10 seconds - too short!)
[DEBUG] MCP server timeout: 30000ms  (30 seconds)
```

**Note**: If execution timeout < tool execution time, connection will drop!

---

## **Environment Variables for Debugging**

### **MCP_TIMEOUT** (Increase MCP timeout)

```bash
MCP_TIMEOUT=60000 claude chat
```

**Default**: 30,000ms (30 seconds)
**Recommended**: 60,000ms (60 seconds) for complex operations

### **Enable All Debug Output**

```bash
claude chat --debug
```

### **Verbose Mode**

```bash
claude chat --verbose --debug
```

---

## **Common Issues and Log Signatures**

### **Issue 1: stdio Connection Drops**

**Symptoms**:
```
STDIO connection dropped after 20s uptime
Connection error
Tool 'xxx' still running
```

**Cause**: stdio pipe closes before tool completes
**Fix**: This is a Claude Code bug - report to Anthropic

---

### **Issue 2: Timeout Too Short**

**Symptoms**:
```
[DEBUG] Execution timeout: 10000ms
Tool 'xxx' still running (30s elapsed)
```

**Cause**: Execution timeout shorter than tool execution
**Fix**: Increase MCP_TIMEOUT environment variable

---

### **Issue 3: MCP Server Fails to Start**

**Symptoms**:
```
[ERROR] MCP server "xxx" Server stderr: <startup error>
[DEBUG] MCP server "xxx": Failed to connect
```

**Cause**: MCP server can't start (missing dependencies, port conflicts, etc.)
**Fix**: Check container logs (`podman logs <container>`)

---

### **Issue 4: Registry Not Accessible**

**Symptoms**:
```
[ERROR] Server stderr: Connection refused
[ERROR] Server stderr: 404 Not Found
```

**Cause**: Registry URL incorrect or Registry not running
**Fix**:
- Verify Registry is running: `curl http://localhost:8080/apis/registry/v3/system/info`
- Check Registry URL in MCP config

---

## **Monitoring MCP Server Container**

**While Claude Code is running**, check the MCP server container:

### **Find Running Container**

```bash
podman ps | grep apicurio
```

### **Watch Container Logs in Real-Time**

```bash
podman logs -f <container-name>
```

**Look for**:
- `Successfully connected to Apicurio Registry version X.X.X` ✅
- `{"jsonrpc":"2.0","id":X,"result":{...}}` (successful response) ✅
- `404` or `Connection refused` (error) ❌

---

## **Debugging Workflow**

### **Step 1: Start with Debug Mode**

```bash
cd /path/to/workspace
claude chat --debug mcp
```

### **Step 2: Monitor in Separate Terminals**

**Terminal 1**: Claude Code with debug
```bash
MCP_TIMEOUT=60000 claude chat --debug
```

**Terminal 2**: MCP server container logs
```bash
podman ps | grep apicurio  # Get container name
podman logs -f <container-name>
```

**Terminal 3**: Debug log tail
```bash
tail -f ~/.claude/debug/latest
```

### **Step 3: Try MCP Command**

In Claude Code:
```
Use the get_group_metadata MCP tool to get information about the "ecommerce-apis" group
```

### **Step 4: Analyze Logs**

**In Terminal 1** (Claude Code debug), look for:
- Tool call initiated
- Connection status
- Any errors or warnings

**In Terminal 2** (Container logs), look for:
- Request received
- Registry API call
- JSON-RPC response sent

**In Terminal 3** (Debug log), look for:
- `STDIO connection dropped` ❌
- `Tool completed successfully` ✅
- Timeout messages

---

## **Useful Log Search Commands**

**Find all MCP tool calls**:
```bash
grep "Calling MCP tool" ~/.claude/debug/latest
```

**Find connection drops**:
```bash
grep -i "dropped\|connection error" ~/.claude/debug/latest
```

**Find timeouts**:
```bash
grep -i "timeout" ~/.claude/debug/latest
```

**Find successful completions**:
```bash
grep "completed successfully" ~/.claude/debug/latest
```

**Show last 100 lines with context**:
```bash
tail -100 ~/.claude/debug/latest | grep -C 5 "apicurio"
```

---

## **What to Include in Bug Reports**

When reporting issues to Anthropic, include:

1. **Claude Code version**:
   ```bash
   claude --version
   ```

2. **Relevant debug log section**:
   ```bash
   grep -A 10 "Calling MCP tool" ~/.claude/debug/latest
   ```

3. **MCP server container logs**:
   ```bash
   podman logs <container-name>
   ```

4. **MCP configuration**:
   ```bash
   claude mcp list
   cat ~/.claude.json  # (redact sensitive data)
   ```

5. **Steps to reproduce**
6. **Expected vs actual behavior**

---

## **Quick Reference**

| What | Command |
|------|---------|
| Start debug mode | `claude chat --debug` |
| View latest log | `cat ~/.claude/debug/latest` |
| Search logs | `grep -i "error" ~/.claude/debug/latest` |
| MCP only debug | `claude chat --debug mcp` |
| Increase timeout | `MCP_TIMEOUT=60000 claude chat` |
| List MCP servers | `claude mcp list` |
| Check container | `podman ps \| grep apicurio` |
| Container logs | `podman logs -f <container>` |

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Status**: Active debugging guide
