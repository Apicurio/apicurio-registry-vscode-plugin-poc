# Testing Apicurio Registry MCP Server with MCP Inspector

**Date**: November 13, 2025
**Purpose**: Use the official MCP Inspector to debug and verify the MCP server independently of Claude Code

---

## What is MCP Inspector?

The MCP Inspector is the official debugging tool from the Model Context Protocol team. It provides:

- ✅ **Interactive UI** to test MCP servers
- ✅ **Protocol compliance checking**
- ✅ **Real-time message inspection**
- ✅ **Tool execution testing**
- ✅ **Visual debugging** of requests and responses

**Most importantly:** It will help us verify if the Apicurio Registry MCP server is working correctly, independent of Claude Code's Zod validation bug.

---

## Installation

The MCP Inspector can be run with npx (no installation needed):

```bash
npx @modelcontextprotocol/inspector
```

Or install globally:

```bash
npm install -g @modelcontextprotocol/inspector
```

---

## Test 1: Inspect the Docker/Podman MCP Server

### Start the Inspector

```bash
npx @modelcontextprotocol/inspector \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

### Expected Output

```
Starting MCP inspector...
⚙️ Proxy server listening on localhost:6277
🔑 Session token: <random-token>
🌐 Opening inspector at http://localhost:5173?token=<token>
```

**The Inspector will:**
1. Start a proxy server on port 6277
2. Launch your MCP server
3. Open a browser with the Inspector UI
4. Connect to your MCP server through the proxy

### What to Test

**In the Inspector UI:**

1. **Connection Tab:**
   - ✅ Check server info (should show version 3.1.3-SNAPSHOT)
   - ✅ Verify capabilities (tools, prompts)

2. **Tools Tab:**
   - ✅ Should list all 24 tools
   - ✅ Expand `list_groups` tool
   - ✅ Click "Call Tool"
   - ✅ Verify parameters (order, orderBy)
   - ✅ Set: `order="asc"` and `orderBy="groupId"`
   - ✅ Click "Execute"

3. **Messages Tab:**
   - ✅ Watch real-time JSON-RPC messages
   - ✅ Verify request format
   - ✅ **CHECK THE RESPONSE** - does it have `result` field?
   - ✅ Look for any error messages

4. **Response Verification:**
   - ✅ Response should have: `{"jsonrpc":"2.0","id":X,"result":{...}}`
   - ✅ Result should contain groups array
   - ✅ No Zod errors in console

---

## Test 2: Compare with a Working MCP Server

To verify the Inspector works correctly, let's test with a simple weather MCP server:

### Install Sample MCP Server

```bash
npm install -g @modelcontextprotocol/server-everything
```

### Run Inspector with Sample Server

```bash
npx @modelcontextprotocol/inspector \
  npx -y @modelcontextprotocol/server-everything
```

### Test Sample Server

1. Open the Inspector UI
2. Go to Tools tab
3. Try calling `echo` tool with some text
4. Verify it works without errors

**This confirms the Inspector itself is working.**

---

## Test 3: Inspect with Local JAR (If Built)

If you've already built the local JAR:

```bash
npx @modelcontextprotocol/inspector \
  java \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=true \
  -Dquarkus.log.console.stderr=true \
  -jar /Users/astranier/Documents/dev/apicurio/apicurio-registry/mcp/target/apicurio-registry-mcp-server-3.1.3-SNAPSHOT-runner.jar
```

---

## What to Look For

### ✅ Good Signs (Server is working)

**In the Inspector UI:**
- Server connects successfully
- All 24 tools are listed
- Tool calls return results
- Responses have correct JSON-RPC format: `{"id":X,"result":{...}}`
- No protocol errors
- Groups are returned from `list_groups`

**If this works:** The MCP server is correct. The problem is 100% in Claude Code.

### ❌ Bad Signs (Server has issues)

**In the Inspector UI:**
- Connection fails
- Tools not listed
- Tool calls timeout
- Malformed JSON-RPC responses
- Protocol errors in Messages tab
- Response missing `result` field

**If this fails:** There's an issue with the MCP server itself.

---

## Debugging with Inspector

### Enable Verbose Logging

**Terminal 1 - MCP Server logs:**
```bash
# For Docker/Podman
podman logs -f <container-id>

# For JAR
tail -f /tmp/mcp-server.log
```

**Terminal 2 - Inspector:**
```bash
npx @modelcontextprotocol/inspector \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  -e QUARKUS_LOG_LEVEL=DEBUG \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Browser - Inspector UI:**
- Open Developer Console (F12)
- Watch for any JavaScript errors
- Check Network tab for proxy communication

### Capture Raw Messages

**In the Inspector Messages tab:**
1. Execute `list_groups` tool
2. Copy the Request JSON
3. Copy the Response JSON
4. Save to file for analysis

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_groups",
    "arguments": {
      "order": "asc",
      "orderBy": "groupId"
    }
  }
}
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Groups: ..."
      }
    ]
  }
}
```

---

## Key Difference: Inspector vs Claude Code

### MCP Inspector

**Uses:**
- Standard MCP SDK validation
- Correct JSON-RPC schema discrimination
- Proper request vs response parsing

**Expected behavior:**
- ✅ Should work perfectly with Apicurio Registry MCP server
- ✅ Tool calls succeed
- ✅ Responses parsed correctly

### Claude Code

**Uses:**
- Custom Zod validation
- **BUG:** Wrong schema applied to responses
- Tries to validate response with request schema

**Current behavior:**
- ❌ Zod validation fails
- ❌ Tool calls hang
- ❌ Connection drops

---

## Expected Test Results

### Scenario 1: Inspector Works, Claude Code Fails

**Meaning:**
- ✅ MCP server is correct
- ✅ Protocol implementation is correct
- ❌ Bug is 100% in Claude Code's Zod validation

**Action:**
- Update GitHub issue with Inspector test results
- Provide evidence that server works with official tooling
- Wait for Claude Code fix

### Scenario 2: Both Inspector and Claude Code Fail

**Meaning:**
- ❌ MCP server has protocol compliance issue
- Needs debugging in Apicurio Registry MCP server

**Action:**
- Analyze Inspector error messages
- Compare request/response format with MCP spec
- Fix server implementation

### Scenario 3: Both Work

**Meaning:**
- The bug was intermittent or environment-specific
- May be related to async timing or connection handling

**Action:**
- Test repeatedly to reproduce
- Compare Inspector proxy vs direct stdio connection
- Investigate connection stability

---

## Inspector UI Guide

### Main Sections

**1. Server Info (Top)**
- Server name and version
- Protocol version
- Capabilities (tools, prompts, resources)

**2. Tools Tab**
- List of all available tools
- Click tool to expand details
- Shows input schema
- "Call Tool" button to test execution

**3. Prompts Tab**
- List of available prompts
- Test prompt execution

**4. Resources Tab**
- List of available resources (if any)

**5. Messages Tab**
- Real-time JSON-RPC message log
- Shows all requests and responses
- Expandable JSON viewer
- Timestamp for each message

**6. Logs Tab**
- Server stderr output
- Debug logs
- Error messages

### How to Call a Tool

1. Click **Tools** tab
2. Find `list_groups` in the list
3. Click to expand
4. Click **"Call Tool"** button
5. Fill in parameters:
   - `order`: Select "asc" or "desc"
   - `orderBy`: Select "groupId", "createdOn", or "modifiedOn"
6. Click **"Execute"**
7. Watch Messages tab for request/response
8. Check result in Tool panel

---

## Troubleshooting

### Inspector Won't Start

**Error:**
```
Failed to start proxy server
```

**Solution:**
```bash
# Check if port 6277 is in use
lsof -i :6277
# Kill any process using it
kill -9 <PID>
# Try again
npx @modelcontextprotocol/inspector ...
```

### Browser Doesn't Open

**If browser doesn't auto-open:**

1. Look for the URL in terminal output
2. Manually open: `http://localhost:5173?token=<token>`
3. Copy the token from terminal

### MCP Server Won't Connect

**Error in Inspector:**
```
Failed to connect to MCP server
```

**Debugging:**

```bash
# Test server manually first
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}' | \
podman run -i --rm \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# Should return JSON response
```

### Tool Call Hangs in Inspector

**If `list_groups` hangs:**

1. Check Registry is running: `curl http://host.containers.internal:8080/apis/registry/v3/groups`
2. Check server logs in Inspector Logs tab
3. Look for connection errors
4. Verify REGISTRY_URL is correct

---

## Reporting Results

### If Inspector Works

**Collect this evidence:**

1. **Screenshot:** Tools tab showing all 24 tools
2. **Screenshot:** Successful `list_groups` execution
3. **Screenshot:** Messages tab showing request/response
4. **Export:** Copy response JSON from Messages tab
5. **Logs:** Any relevant server logs from Logs tab

**Add to GitHub issue:**
```markdown
## MCP Inspector Test Results

✅ **The MCP server works perfectly with the official MCP Inspector**

- All 24 tools listed correctly
- Tool calls execute successfully
- Responses are valid JSON-RPC format
- No protocol errors

**Evidence:**
- [Screenshot: Tools list]
- [Screenshot: Successful tool call]
- Response JSON: `{"jsonrpc":"2.0","id":1,"result":{...}}`

**Conclusion:** This confirms the bug is in Claude Code's Zod validation, not the MCP server.
```

### If Inspector Fails

**Collect this evidence:**

1. **Screenshot:** Error message
2. **Screenshot:** Messages tab showing failed request
3. **Logs:** Full server logs from Logs tab
4. **JSON:** Failed request/response

**Report to Apicurio team:**
- Server doesn't work with official Inspector
- Needs protocol compliance fixes
- Attach error details

---

## Quick Start Command

**Test with Docker/Podman MCP Server:**

```bash
# Make sure Registry is running
curl http://host.containers.internal:8080/apis/registry/v3/groups

# Start Inspector
npx @modelcontextprotocol/inspector \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# Inspector will open in browser
# Test: Tools tab → list_groups → Call Tool → Execute
# Check: Messages tab for response format
```

---

## Next Steps After Testing

### If Inspector Succeeds

1. ✅ Document that server works with official tooling
2. ✅ Update GitHub issue with evidence
3. ✅ Emphasize bug is in Claude Code, not server
4. ✅ Wait for Claude Code team to fix Zod validation
5. ✅ Consider alternative LLM integrations meanwhile

### If Inspector Fails

1. ❌ Debug server protocol compliance
2. ❌ Compare with working MCP server examples
3. ❌ Fix issues in Apicurio Registry MCP server
4. ❌ Retest with Inspector
5. ❌ Then test with Claude Code

---

**Last Updated**: November 13, 2025 16:25
**Status**: Ready to test
**Estimated Time**: 10-15 minutes
**Expected Result**: Inspector should work perfectly, confirming Claude Code bug
