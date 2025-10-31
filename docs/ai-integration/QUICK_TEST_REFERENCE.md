# Quick Test Reference - Cursor MCP Support

**Goal**: Test if Cursor IDE supports MCP in 30-60 minutes

---

## Pre-Test: Verify MCP Server Works

```bash
cd <PROJECT_ROOT>
./apicurio-vscode-plugin/docs/testing/test-mcp-server.sh
```

**Expected**: All tests pass ✓

---

## Quick Test (30 min)

### 1. Install Cursor (5 min)
- Visit: https://cursor.com
- Download and install
- Open Cursor

### 2. Search for MCP Settings (5 min)
- Open Settings: `Cmd + ,`
- Search: "mcp" or "model context protocol"
- Check Settings JSON: `Cmd + Shift + P` → "Open User Settings (JSON)"

### 3. Try MCP Configuration (10 min)

**If you found MCP settings**, add this:

```json
{
  "cursor.mcpServers": {
    "apicurio-registry": {
      "command": "podman",
      "args": [
        "run", "-i", "--rm",
        "-e", "REGISTRY_URL=http://host.containers.internal:8080",
        "-e", "APICURIO_MCP_SAFE_MODE=true",
        "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
      ]
    }
  }
}
```

**Note**: Try different key names if needed:
- `cursor.mcp.servers`
- `mcp.servers`
- `mcpServers`

Restart Cursor after configuration.

### 4. Test with AI (10 min)

Open Cursor AI chat (`Cmd + L` or `Cmd + K`) and try:

```
Can you list all groups in my Apicurio Registry?
```

**✅ SUCCESS if**:
- AI uses `list_groups` tool
- Shows tool call
- Returns registry data

**❌ FAIL if**:
- AI says no tools available
- AI makes up data
- No tool calls shown

### 5. Verify (5 min)

Create a test schema:

```
Create a simple OpenAPI 3.0 schema for a "test-api" in the "test" group with one GET /hello endpoint.
```

Then verify:

```bash
curl http://localhost:8080/apis/registry/v3/groups/test/artifacts
```

**Expected**: Should see "test-api" artifact

---

## Result

Fill in your findings:

- [ ] ✅ **CURSOR WORKS** - MCP fully supported
  - Config key used: `_______________`
  - Next step: Recommend Cursor to team

- [ ] ⚠️ **CURSOR PARTIAL** - Some MCP features work
  - Details: `_______________`
  - Next step: Investigate further

- [ ] ❌ **CURSOR DOESN'T WORK** - No MCP support
  - Next step: Recommend Continue.dev instead

---

## Fallback: Test Continue.dev in Cursor

If native MCP doesn't work:

1. Install Continue extension in Cursor
2. Configure in `~/.continue/config.json`:

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
          "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
        ]
      }
    ]
  }
}
```

3. Test same queries

---

## Quick Decision Tree

```
Does Cursor have native MCP support?
├─ YES, works great
│  └─ ✅ RECOMMEND: Cursor IDE
│
├─ NO, but Continue.dev works in Cursor
│  └─ ⚠️ RECOMMEND: Cursor + Continue extension
│
└─ NO, nothing works
   └─ ✅ RECOMMEND: VSCode + Continue.dev
```

---

## Detailed Guide

See: `CURSOR_MCP_TEST_GUIDE.md` for complete testing instructions

---

**Time to test**: 30-60 minutes
**Decision**: Ready after test complete
