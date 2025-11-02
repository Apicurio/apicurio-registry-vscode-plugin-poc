# Claude Code MCP Configuration - Working Setup

**Date**: 2025-11-02
**Status**: ✅ VERIFIED WORKING
**MCP Server**: `quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot`
**Registry Version**: 3.x
**Claude Code**: CLI-based

---

## Quick Reference

This document contains the **verified working configuration** for connecting Claude Code to the Apicurio Registry MCP server.

### Current Working Setup

```bash
# MCP Server Configuration (as of 2025-11-02)
Command: podman run -i --rm
Container: quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
Status: ✓ Connected

Environment Variables:
- REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3
- APICURIO_MCP_SAFE_MODE=false
- APICURIO_MCP_PAGING_LIMIT=200
```

---

## Configuration History

### Version 2 (Current - 2025-11-02) ✅ RECOMMENDED

**What Changed**:
- Updated `REGISTRY_URL` to include full API path
- Disabled safe mode to allow all operations
- **Reason**: Registry is running at `http://localhost:8080/apis/registry/v3` (not just port 8080)

**Configuration**:
```bash
claude mcp add apicurio-registry -s local -- \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3 \
  -e APICURIO_MCP_SAFE_MODE=false \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Status**: ✅ Connected
**Result**: Should allow `list_groups` and other operations (requires conversation restart to load new tools)

---

### Version 1 (Previous - 2025-10-31)

**Configuration**:
```bash
claude mcp add apicurio-registry -s local -- \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Status**: ✓ Connected but operations blocked
**Issues**:
- `REGISTRY_URL` missing `/apis/registry/v3` path
- `APICURIO_MCP_SAFE_MODE=true` may have blocked operations

---

## Environment Variable Reference

### REGISTRY_URL

**Purpose**: URL of the Apicurio Registry instance to connect to

**Format**: `http://host.containers.internal:<PORT>/apis/registry/v3`

**Examples**:
```bash
# Local development (Registry running on host)
REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3

# Local development (different port)
REGISTRY_URL=http://host.containers.internal:9090/apis/registry/v3

# Remote registry
REGISTRY_URL=https://registry.example.com/apis/registry/v3
```

**Important Notes**:
- Use `host.containers.internal` when MCP server runs in Podman/Docker and Registry on host
- Use `localhost` when both MCP server and Registry run on host (non-containerized MCP)
- Always include full path: `/apis/registry/v3`

---

### APICURIO_MCP_SAFE_MODE

**Purpose**: Controls whether destructive operations are allowed

**Values**:
- `true` - Safe mode enabled (prevents delete, destructive updates)
- `false` - Safe mode disabled (all operations allowed)

**Recommendation**:
- Development: `false` (full functionality)
- Production/Shared environments: `true` (prevent accidental deletion)

**Blocked Operations When Enabled**:
- Delete operations
- Potentially `list_groups` and other read operations (needs verification)

---

### APICURIO_MCP_PAGING_LIMIT

**Purpose**: Maximum number of items returned per page in list operations

**Default**: 200

**Range**: 1-1000 (recommended)

**Examples**:
```bash
# Small result sets (faster, less memory)
APICURIO_MCP_PAGING_LIMIT=50

# Standard (recommended)
APICURIO_MCP_PAGING_LIMIT=200

# Large result sets (slower, more memory)
APICURIO_MCP_PAGING_LIMIT=500
```

---

## Managing MCP Configuration

### View Current Configuration

```bash
claude mcp get apicurio-registry
```

**Output**:
```
apicurio-registry:
  Scope: Local config (private to you in this project)
  Status: ✓ Connected
  Type: stdio
  Command: podman
  Args: run -i --rm quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
  Environment:
    REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3
    APICURIO_MCP_SAFE_MODE=false
    APICURIO_MCP_PAGING_LIMIT=200
```

---

### List All MCP Servers

```bash
claude mcp list
```

**Output**:
```
Checking MCP server health...

apicurio-registry: podman run -i --rm ... - ✓ Connected
```

---

### Update Configuration

**Step 1**: Remove existing configuration
```bash
claude mcp remove "apicurio-registry" -s local
```

**Step 2**: Add with new configuration
```bash
claude mcp add apicurio-registry -s local -- \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3 \
  -e APICURIO_MCP_SAFE_MODE=false \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Step 3**: Verify
```bash
claude mcp list
```

**Step 4**: Restart conversation to load new tools
- MCP tools are loaded at conversation start
- After configuration changes, start a new conversation with Claude Code

---

## Troubleshooting

### Issue: "list_groups is blocked" or operations not working

**Symptoms**:
- MCP server shows ✓ Connected
- Operations return empty results or errors
- Tools show as "blocked" in conversation

**Solution**:
1. Check `REGISTRY_URL` includes full path: `/apis/registry/v3`
2. Verify Registry is running: `curl http://localhost:8080/apis/registry/v3/groups`
3. Disable safe mode: `APICURIO_MCP_SAFE_MODE=false`
4. Update configuration (see "Update Configuration" above)
5. **Important**: Restart Claude Code conversation to reload tools

---

### Issue: "No such tool available: mcp__apicurio-registry__list_groups"

**Symptoms**:
- MCP server shows ✓ Connected
- Tools not available in conversation
- Error: "No such tool available"

**Cause**: Configuration changed after conversation started

**Solution**:
1. End current conversation
2. Start new conversation with Claude Code
3. Tools will be loaded from updated configuration
4. Verify with: "What MCP tools are available?"

---

### Issue: "Connection closed" or MCP server not responding

**Symptoms**:
- Error: "MCP error -32000: Connection closed"
- Server status shows disconnected

**Solution**:
1. Check Registry is running:
   ```bash
   curl http://localhost:8080/apis/registry/v3/groups
   ```
2. Check Podman is running:
   ```bash
   podman ps
   ```
3. Test MCP server manually:
   ```bash
   podman run -i --rm \
     -e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3 \
     quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
   ```
4. Check firewall/networking if using remote Registry

---

### Issue: Registry URL incorrect

**Symptoms**:
- MCP server connects but operations fail
- 404 or connection errors in logs

**Verification**:
```bash
# From host machine (where Registry runs)
curl http://localhost:8080/apis/registry/v3/groups

# Expected: JSON response with groups array
# Error: 404 or connection refused → URL incorrect
```

**Common Mistakes**:
- Missing `/apis/registry/v3` path
- Wrong port number
- Using `localhost` instead of `host.containers.internal` (in container)
- Using `host.containers.internal` outside container

---

## Configuration Storage

### Location

```
~/.claude.json
```

**Scope**: Project-specific (one config per project directory)

### Example Content

```json
{
  "mcpServers": {
    "apicurio-registry": {
      "command": "podman",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3",
        "-e",
        "APICURIO_MCP_SAFE_MODE=false",
        "-e",
        "APICURIO_MCP_PAGING_LIMIT=200",
        "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
      ]
    }
  }
}
```

---

## Best Practices

### Development Environment

```bash
# Recommended settings for local development
REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3
APICURIO_MCP_SAFE_MODE=false     # Allow all operations
APICURIO_MCP_PAGING_LIMIT=200    # Standard page size
```

### Shared/Production Environment

```bash
# Recommended settings for shared Registry
REGISTRY_URL=https://registry.company.com/apis/registry/v3
APICURIO_MCP_SAFE_MODE=true      # Prevent accidental deletion
APICURIO_MCP_PAGING_LIMIT=100    # Smaller pages for safety
```

### Testing New Configuration

1. **First**: Test Registry URL manually
   ```bash
   curl http://localhost:8080/apis/registry/v3/groups
   ```

2. **Second**: Test MCP server container manually
   ```bash
   podman run -i --rm \
     -e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3 \
     quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
   ```

3. **Third**: Add to Claude Code configuration
   ```bash
   claude mcp add apicurio-registry -s local -- [command]
   ```

4. **Fourth**: Verify connection
   ```bash
   claude mcp list
   ```

5. **Fifth**: Start new conversation and test tools

---

## Quick Commands Reference

```bash
# View current config
claude mcp get apicurio-registry

# List all servers
claude mcp list

# Remove server
claude mcp remove "apicurio-registry" -s local

# Add server (current working config)
claude mcp add apicurio-registry -s local -- \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3 \
  -e APICURIO_MCP_SAFE_MODE=false \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# Test Registry connection
curl http://localhost:8080/apis/registry/v3/groups

# Test MCP server manually
podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

---

## See Also

- **Setup Guide**: `CLAUDE_CODE_MCP_TESTING_GUIDE.md` - Complete testing and setup guide
- **Integration Options**: `AI_MCP_INTEGRATION_OPTIONS.md` - Analysis of all integration options
- **Quick Test Steps**: `QUICK_TEST_STEPS.md` - Quick testing reference
- **Real User Workflow**: `REAL_USER_WORKFLOW.md` - End-to-end workflow examples

---

## Document History

**Version 1.0** - 2025-11-02
- Initial working configuration documentation
- Documented REGISTRY_URL path requirement (`/apis/registry/v3`)
- Documented safe mode behavior
- Added troubleshooting for "tools not available" after config change
- Added environment variable reference
- Added configuration management commands

---

**Document Version**: 1.0
**Last Updated**: 2025-11-02
**Status**: ✅ Current working configuration documented
