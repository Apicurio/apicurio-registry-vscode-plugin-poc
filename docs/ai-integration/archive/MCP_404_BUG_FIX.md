# MCP 404 Bug Fix - Root Cause Analysis

**Date**: 2025-11-03
**Issue**: Claude Code MCP `list_groups` call returns 404 error
**Status**: ✅ **FIXED**

---

## The Problem

When asking Claude Code: **"List my Apicurio Registry groups"**

**Symptom**: Request hung with "Spelunking..." status, then returned an error

**Container Logs Revealed**:
```json
{"jsonrpc":"2.0","id":3,"result":{"isError":true,"content":[
  {"text":"Execution failed: the server returned an unexpected status code and no error class is registered for this code 404"}
]}}
```

The MCP server successfully received the request from Claude Code, but got a **404 Not Found** when calling the Registry API.

---

## Root Cause

### The Bug in MCP Server Code

In `apicurio-registry/mcp/src/main/java/io/apicurio/registry/mcp/RegistryService.java` (line 72):

```java
if (!Pattern.compile(".* /apis/registry/v3/?").matcher(rawBaseUrl).matches()) {
    rawBaseUrl += "/apis/registry/v3";
}
```

**The Problem**: The regex pattern `.* /apis/registry/v3/?` requires a **space before** `/apis/registry/v3`.

**Our URL**: `http://host.containers.internal:8080/apis/registry/v3`

**What Happened**:
1. Pattern doesn't match (no space before `/apis`)
2. Code appends `/apis/registry/v3` to the URL
3. **Final URL**: `http://host.containers.internal:8080/apis/registry/v3/apis/registry/v3` ❌
4. **Result**: 404 Not Found

### VSCode Extension Bug

The VSCode extension was **also adding** `/apis/registry/v3` to the Registry URL:

**In** `src/services/mcpConfigurationManager.ts`:
```typescript
private normalizeRegistryUrl(url: string): string {
    url = url.replace(/\/$/, '');

    // BUG: Adding path when MCP server already adds it
    if (!url.includes('/apis/registry/v3')) {
        url = `${url}/apis/registry/v3`;
    }

    return url;
}
```

**Generated command**:
```bash
-e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3
```

**MCP server then appended the path again**, causing the 404.

---

## The Fix

### VSCode Extension Fix (Committed: e4fd37b)

**Changed** `normalizeRegistryUrl()` to **remove** the path instead of adding it:

```typescript
private normalizeRegistryUrl(url: string): string {
    // Remove trailing slash
    url = url.replace(/\/$/, '');

    // Remove /apis/registry/v3 path if present (MCP server adds it automatically)
    url = url.replace(/\/apis\/registry\/v3$/, '');

    return url;
}
```

**Now generates**:
```bash
-e REGISTRY_URL=http://host.containers.internal:8080
```

The MCP server then correctly appends `/apis/registry/v3` to create:
```
http://host.containers.internal:8080/apis/registry/v3 ✅
```

### Test Updates

Updated all 23 tests to verify the new behavior:
- ✅ Base URL passed without `/apis/registry/v3` path
- ✅ If user's connection includes the path, it's removed
- ✅ All tests passing

---

## How to Test the Fix

### 1. Verify Current MCP Configuration

**In your test workspace**:
```bash
cd /Users/astranier/apicurio-test-workspace
claude mcp list
```

**Expected**: Shows `apicurio-registry` with status "Connected"

**Check configuration**:
```bash
cat ~/.claude.json
```

**Should show**:
```json
{
  "/Users/astranier/apicurio-test-workspace": {
    "mcpServers": {
      "apicurio-registry": {
        "type": "stdio",
        "command": "podman",
        "args": ["run", "-i", "--rm",
                 "-e", "REGISTRY_URL=http://host.containers.internal:8080",
                 ...],
        "env": {}
      }
    }
  }
}
```

**✅ ALREADY FIXED**: I already updated your MCP configuration with the correct URL.

### 2. Test with Claude Code

**Start a fresh Claude Code conversation** (important - MCP initializes per conversation):

1. **Exit current conversation** (if any)
2. **Start new conversation**
3. **Wait** for MCP initialization (you'll see a brief loading indicator)
4. **Try this prompt**:

```
List my Apicurio Registry groups
```

**Expected Result**:
```
I found 3 groups in your Apicurio Registry:

1. ecommerce-apis (created 2025-10-28)
2. internal-apis (created 2025-10-28)
3. test-group (created 2025-10-28)
```

### 3. Monitor Container Logs

In a separate terminal, watch the MCP server logs:

```bash
# Find the container name
podman ps | grep apicurio

# Watch logs
podman logs -f <container-name>
```

**Expected**: Should see successful API calls, no 404 errors.

### 4. Test Other MCP Tools

Try other prompts to verify all MCP tools work:

```
Get information about the ecommerce-apis group
```

```
List all artifacts in the ecommerce-apis group, sorted by name in ascending order
```

```
Show me the latest version of artifact <artifact-name> in group ecommerce-apis
```

---

## VSCode Extension Users

**For developers using the VSCode extension** to generate MCP commands:

### Via Setup Wizard

1. **Open Command Palette**: `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows/Linux)
2. **Run**: `Apicurio MCP: Setup AI Features`
3. **Follow wizard steps**
4. **Generated command will now use correct URL** (without `/apis/registry/v3`)

### Via Quick Command

1. **Open Command Palette**: `Cmd+Shift+P` / `Ctrl+Shift+P`
2. **Run**: `Apicurio MCP: Generate Claude MCP Command`
3. **Copy command from modal**
4. **Paste in terminal and run**

**Both commands now generate**:
```bash
claude mcp add apicurio-registry -s local -- \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

---

## Verification Checklist

After testing, you should confirm:

- [ ] ✅ Claude Code can list groups successfully
- [ ] ✅ No 404 errors in container logs
- [ ] ✅ Other MCP tools work (get_group_metadata, list_artifacts, etc.)
- [ ] ✅ VSCode extension generates correct command (without `/apis/registry/v3`)
- [ ] ✅ Setup wizard generates correct command
- [ ] ✅ All 23 tests passing in mcpConfigurationManager.test.ts

---

## Files Changed

**VSCode Extension**:
- `src/services/mcpConfigurationManager.ts` - Fixed `normalizeRegistryUrl()` method
- `src/services/__tests__/mcpConfigurationManager.test.ts` - Updated 23 tests

**Documentation**:
- `docs/ai-integration/MCP_DEBUGGING_GUIDE.md` - Created comprehensive debugging guide
- `docs/ai-integration/MCP_TESTING_GUIDE.md` - Created manual testing guide
- `docs/ai-integration/MCP_404_BUG_FIX.md` - This document

**Git Commit**: `e4fd37b` - "fix(mcp): remove /apis/registry/v3 from REGISTRY_URL"

---

## Future Improvements

### Potential MCP Server Fix

The regex pattern in the MCP server could be improved:

**Current** (in `apicurio-registry/mcp`):
```java
if (!Pattern.compile(".* /apis/registry/v3/?").matcher(rawBaseUrl).matches()) {
    rawBaseUrl += "/apis/registry/v3";
}
```

**Should be** (remove space requirement):
```java
if (!rawBaseUrl.endsWith("/apis/registry/v3")) {
    rawBaseUrl += "/apis/registry/v3";
}
```

This would make the MCP server more robust and prevent similar issues in the future.

**Action**: Consider filing an issue or PR to the Apicurio Registry MCP server repository.

---

## Success Criteria

**The bug is fixed when**:

✅ **User runs**: "List my Apicurio Registry groups" in Claude Code
✅ **Claude Code**: Uses MCP `list_groups` tool successfully
✅ **Result**: Returns actual groups from the Registry
✅ **Container logs**: Show successful API calls, no 404 errors
✅ **VSCode extension**: Generates commands with base URL only

---

## Timeline

- **2025-11-03 10:30**: MCP server container started
- **2025-11-03 10:54**: First `list_groups` call → 404 error discovered
- **2025-11-03 11:00**: Root cause identified (URL path duplication)
- **2025-11-03 11:15**: VSCode extension fix implemented and tested
- **2025-11-03 11:20**: User's MCP configuration updated
- **2025-11-03 11:25**: Fix committed (e4fd37b)

**Status**: ✅ **READY FOR TESTING**

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Status**: Fix complete, awaiting user testing confirmation
**Next Step**: User to test in fresh Claude Code conversation
