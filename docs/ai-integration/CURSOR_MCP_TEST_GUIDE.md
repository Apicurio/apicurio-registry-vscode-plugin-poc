# Cursor IDE MCP Support Test Guide

**Purpose**: Verify if Cursor IDE supports Model Context Protocol (MCP) servers
**Time Required**: 30-60 minutes
**Date**: 2025-10-31

---

## Prerequisites

- ✅ Apicurio Registry running at http://localhost:8080
- ✅ Podman installed and working
- ✅ MCP server image available: `quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot`

---

## Test Plan Overview

```
1. Install Cursor IDE (10 min)
2. Look for MCP configuration options (5 min)
3. Test MCP server connection (15 min)
4. Verify AI can use MCP tools (10 min)
5. Document results (5 min)
```

---

## Step 1: Install Cursor IDE

### Download and Install

1. **Visit**: https://cursor.com
2. **Download** Cursor for macOS
3. **Install**: Drag to Applications folder
4. **Open** Cursor

### Verify Installation

```bash
# Check Cursor is installed
ls -la /Applications/Cursor.app

# Expected: Cursor.app exists
```

---

## Step 2: Search for MCP Configuration

### Check 1: Settings UI

1. **Open Cursor**
2. **Open Settings**: `Cmd + ,` (Cmd + Comma)
   - **If that doesn't work**: `Cmd + Shift + P` → Type "settings" → Select "Preferences: Open Settings (UI)"
3. **Search for**: "mcp" or "model context protocol"
4. **Look for**:
   - MCP Servers setting
   - Model Context Protocol
   - Server configuration
   - Tools/Function calling settings

**📝 Document**: Take screenshots of any MCP-related settings

### Check 2: Settings JSON

1. **Open Settings JSON**:
   - Press `Cmd + Shift + P` (Command Palette)
   - Type: "settings json"
   - Select: "Preferences: Open User Settings (JSON)"
2. **Look for**: Any MCP-related configuration keys
3. **Search for**:
   - `mcp`
   - `mcpServers`
   - `modelContextProtocol`
   - `contextServers`

**📝 Document**: Note any relevant configuration keys

### Check 3: Documentation Search

1. **Visit**: https://docs.cursor.com
2. **Search for**: "MCP", "Model Context Protocol", "tools", "function calling"
3. **Check**:
   - Integration guides
   - Advanced configuration
   - Extension points

**📝 Document**: Note any relevant documentation

---

## Step 3: Attempt MCP Configuration

### Option A: If MCP Settings Found

If you found MCP configuration in Step 2:

1. **Configure MCP Server** in Cursor settings
2. **Use this configuration**:

```json
{
  "cursor.mcpServers": {
    "apicurio-registry": {
      "command": "podman",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e", "REGISTRY_URL=http://host.containers.internal:8080",
        "-e", "APICURIO_MCP_SAFE_MODE=true",
        "-e", "APICURIO_MCP_PAGING_LIMIT=200",
        "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
      ]
    }
  }
}
```

**Note**: The exact key might be different. Try variations:
- `cursor.mcp.servers`
- `mcp.servers`
- `mcpServers`
- Check docs for exact key name

3. **Save settings**
4. **Restart Cursor**

### Option B: If No MCP Settings Found

Try alternative approaches:

#### Alternative 1: Check for Extensions/Plugins

1. **Open Extensions**: `Cmd + Shift + X`
2. **Search for**: "MCP", "Model Context Protocol"
3. **Check**: Is there an MCP extension available?

#### Alternative 2: Check Cursor AI Settings

1. **Open AI Settings** (if available)
2. **Look for**:
   - Custom tools
   - Function definitions
   - API configurations
   - Server connections

#### Alternative 3: Try Continue.dev Extension

1. **Install Continue.dev** extension in Cursor
2. **Check**: Does it work in Cursor like it does in VSCode?

---

## Step 4: Test MCP Functionality

### Test 1: Check Server Status

**If MCP configuration was possible**:

1. **Check for indicators**:
   - Status bar showing MCP server status
   - Settings panel showing connection state
   - Logs mentioning MCP server

2. **Look for errors**:
   - Check Developer Console: `Help` → `Toggle Developer Tools`
   - Look for MCP-related errors or messages

### Test 2: Try Using MCP Tools

1. **Open Cursor AI Chat** (usually `Cmd + L` or `Cmd + K`)

2. **Test Basic Query**:
```
Can you list the tools available to you?
```

3. **Test Registry Query**:
```
Please list all groups in my Apicurio Registry using the available tools.
```

4. **Test Schema Creation**:
```
Create a simple OpenAPI 3.0 schema for a "hello-world" API in the "test" group in Apicurio Registry.

The API should have:
- One endpoint: GET /hello
- Returns: {"message": "Hello World"}
```

### Expected Results

**✅ MCP WORKS if you see**:
- AI mentions using tools like `list_groups`, `create_artifact`
- AI shows tool calls before executing them
- Schema appears in Apicurio Registry
- AI can list/search Registry content

**❌ MCP DOESN'T WORK if**:
- AI says "I don't have access to tools"
- AI generates schema but doesn't upload it
- No tool calls visible
- Registry remains empty after commands

---

## Step 5: Verify in Apicurio Registry

### Check VSCode Extension

1. **Open VSCode** (keep Cursor open)
2. **Open Apicurio Registry extension**
3. **Refresh** the registry view
4. **Check**: Did the test artifact appear?

### Check Registry API Directly

```bash
# List all groups
curl http://localhost:8080/apis/registry/v3/groups

# Expected: Should see "test" group if AI created it

# List artifacts in test group
curl http://localhost:8080/apis/registry/v3/groups/test/artifacts

# Expected: Should see "hello-world" artifact if AI created it
```

---

## Step 6: Document Results

### Test Results Template

Copy this template and fill it out:

```markdown
# Cursor MCP Test Results

**Date**: 2025-10-31
**Tester**: [Your Name]
**Cursor Version**: [Check Help → About]

## MCP Support: [YES / NO / PARTIAL]

### Configuration

- [ ] MCP settings found in UI
- [ ] MCP configuration documented
- [ ] Successfully configured MCP server
- [ ] MCP server connected

**Configuration Key Used**: [e.g., cursor.mcpServers]

**Configuration That Worked** (if any):
```json
{
  // Paste working config here
}
```

### Functionality

- [ ] AI can see MCP tools
- [ ] AI can execute MCP tools
- [ ] Tools appear in Apicurio Registry
- [ ] Can list Registry content
- [ ] Can create artifacts
- [ ] Can search artifacts

### Test Results

**Query 1 - List Tools**:
Response: [Paste AI response]
Result: [SUCCESS / FAIL]

**Query 2 - List Groups**:
Response: [Paste AI response]
Result: [SUCCESS / FAIL]

**Query 3 - Create Schema**:
Response: [Paste AI response]
Verified in Registry: [YES / NO]
Result: [SUCCESS / FAIL]

### Screenshots

- [ ] Attached: Cursor settings with MCP config
- [ ] Attached: AI chat showing tool usage
- [ ] Attached: Registry with created artifact

### Notes

[Any additional observations, issues, or discoveries]

## Recommendation

Based on this test:
- [ ] ✅ **Recommend Cursor** - MCP works great
- [ ] ⚠️ **Recommend Continue.dev** - MCP not supported or partial
- [ ] ❓ **Need more investigation** - [explain why]

```

---

## Quick Reference: MCP Server Commands

### Start MCP Server Manually (for debugging)

```bash
# Test if MCP server works
podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Expected**: Server waits for input on stdin (MCP protocol)

### Test MCP Protocol Manually

```bash
# Send MCP initialize message
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | \
podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Expected**: JSON-RPC response with server capabilities and tools list

---

## Troubleshooting

### Issue: Can't Find MCP Settings

**Try**:
1. Check if Cursor has updates: `Help` → `Check for Updates`
2. Search docs for "tools", "integrations", "servers"
3. Check Cursor community forum/Discord
4. Try installing Continue.dev extension as fallback

### Issue: MCP Server Won't Connect

**Check**:
```bash
# Verify Registry is accessible
curl http://localhost:8080/apis/registry/v3/system/info

# Test MCP server can start
podman run --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot \
  --help
```

### Issue: AI Doesn't Use Tools

**Possibilities**:
- MCP not supported in Cursor
- Wrong configuration key
- Server not connecting
- Need to enable tools/function calling in AI settings

---

## Alternative Test: Try Continue.dev in Cursor

If native MCP doesn't work, test if Continue.dev extension works:

### Install Continue.dev

1. **Open Extensions** in Cursor: `Cmd + Shift + X`
2. **Search**: "Continue"
3. **Install**: Continue extension
4. **Configure**: MCP server in `~/.continue/config.json`

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "apicurio-registry",
        "command": "podman",
        "args": [
          "run", "-i", "--rm",
          "-e", "REGISTRY_URL=http://host.containers.internal:8080",
          "-e", "APICURIO_MCP_SAFE_MODE=true",
          "-e", "APICURIO_MCP_PAGING_LIMIT=200",
          "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
        ]
      }
    ]
  },
  "models": [
    {
      "title": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "YOUR_API_KEY"
    }
  ]
}
```

5. **Test**: Same queries as above

**Result**:
- If Continue works in Cursor → We can use Cursor + Continue
- If Continue doesn't work → Cursor might not support VSCode extensions fully

---

## Success Criteria

### ✅ CURSOR IS SUITABLE if:

1. Native MCP support found and working, OR
2. Continue.dev extension works in Cursor
3. AI can successfully interact with Registry via MCP
4. User experience is smooth and professional

### ❌ CURSOR IS NOT SUITABLE if:

1. No MCP support found
2. Continue.dev extension doesn't work
3. Configuration is too complex
4. Features are broken or unreliable

---

## Next Steps After Testing

### If Cursor Works ✅

1. **Document** the working configuration
2. **Create** Cursor setup guide for users
3. **Update** team recommendation document
4. **Plan** rollout strategy

### If Cursor Doesn't Work ❌

1. **Document** findings
2. **Recommend** Continue.dev + VSCode approach
3. **Update** team recommendation document
4. **Consider** building custom integration later

---

## Resources

### Cursor
- Website: https://cursor.com
- Docs: https://docs.cursor.com
- Forum: https://forum.cursor.com
- Discord: Check website for invite

### Continue.dev (fallback)
- Website: https://continue.dev
- Docs: https://docs.continue.dev/features/model-context-protocol

### Our MCP Server
- Code: `apicurio-registry/mcp/`
- README: `apicurio-registry/mcp/README.md`
- Docker: `quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot`

---

## Test Checklist

Use this checklist while testing:

- [ ] Cursor installed and running
- [ ] Searched for MCP in settings
- [ ] Checked settings.json for MCP keys
- [ ] Reviewed Cursor documentation
- [ ] Attempted MCP configuration
- [ ] Tested AI chat with Registry queries
- [ ] Verified results in Registry
- [ ] Tried Continue.dev extension (if needed)
- [ ] Documented all findings
- [ ] Created recommendation

---

**Good luck with the test!** 🚀

Please document your findings and share with the team.
