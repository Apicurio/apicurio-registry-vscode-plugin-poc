# Bug Report: MCP Server Sending `_meta: null` Breaks MCP SDK Validation

**Reporter**: Alexandre Stranier (VSCode Plugin Team)
**Date**: November 14, 2025
**Severity**: CRITICAL - Blocks all MCP tool invocation
**Component**: `apicurio-registry-mcp-server` (Docker image)

---

## Summary

The Apicurio Registry MCP Server is including `"_meta": null` fields in tool call responses, which causes Zod validation errors in the MCP TypeScript SDK used by Claude Code and the official MCP Inspector.

**Result**: All MCP tool calls fail, making the integration completely unusable.

---

## Reproduction

### 1. Start the MCP Server

```bash
podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

### 2. Send a Tool Call

```bash
(
  echo '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
  sleep 0.5
  echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'
  sleep 0.5
  echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
  sleep 0.5
  echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_groups","arguments":{"order":"asc","orderBy":"groupId"}}}'
  sleep 2
) | podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot 2>/dev/null
```

### 3. Observe the Response

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "isError": false,
    "content": [
      {
        "text": "{...}",
        "_meta": null,     ← PROBLEM
        "annotations": null,
        "type": "text"
      }
    ],
    "structuredContent": null,
    "_meta": null        ← PROBLEM
  }
}
```

---

## The Problem

### MCP SDK Zod Schema Expects:

- `_meta` field should be **omitted entirely**, OR
- `_meta` field should be **an object** (for pagination)

### What the Server Sends:

- `"_meta": null` ❌

### MCP SDK Error:

```
ZodError: [
  {
    "code": "invalid_type",
    "expected": "object",
    "received": "null",
    "path": ["result", "_meta"],
    "message": "Expected object, received null"
  }
]
```

---

## MCP Specification

According to the official MCP specification (2025-06-18), the `CallToolResult` schema is:

```typescript
{
  content: [ContentBlock],
  structuredContent?: Object,
  isError: boolean
}
```

**The `_meta` field is NOT part of the specification for `CallToolResult`.**

Reference: https://modelcontextprotocol.io/specification/2025-06-18/server/tools

---

## Suggested Fix

### Location

File: `apicurio-registry/mcp/src/main/java/io/apicurio/registry/mcp/ObjectMapperCustomizerImpl.java`

### Current Code (Line 14-32)

```java
@ApplicationScoped
public class ObjectMapperCustomizerImpl implements ObjectMapperCustomizer {

    @Override
    public void customize(ObjectMapper mapper) {
        mapper.registerModule(new JavaTimeModule());

        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        mapper.setMixInResolver(new ClassIntrospector.MixInResolver() {
            @Override
            public Class<?> findMixInClassFor(Class<?> cls) {
                return Mixin.class;
            }

            @Override
            public ClassIntrospector.MixInResolver copy() {
                return this;
            }
        });
    }
    // ...
}
```

### Proposed Fix

Add one line to skip null fields during serialization:

```java
@ApplicationScoped
public class ObjectMapperCustomizerImpl implements ObjectMapperCustomizer {

    @Override
    public void customize(ObjectMapper mapper) {
        mapper.registerModule(new JavaTimeModule());

        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // FIX: Don't serialize null fields
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        mapper.setMixInResolver(new ClassIntrospector.MixInResolver() {
            @Override
            public Class<?> findMixInClassFor(Class<?> cls) {
                return Mixin.class;
            }

            @Override
            public ClassIntrospector.MixInResolver copy() {
                return this;
            }
        });
    }
    // ...
}
```

**Import needed:**
```java
import com.fasterxml.jackson.annotation.JsonInclude;
```

---

## Impact

### Before Fix (Current State)

- ❌ All MCP tool calls fail with Zod validation error
- ❌ Claude Code integration broken
- ❌ MCP Inspector testing broken
- ❌ VSCode extension MCP integration unusable

### After Fix

- ✅ MCP SDK accepts responses
- ✅ Claude Code integration works
- ✅ MCP Inspector testing works
- ✅ VSCode extension can use MCP tools

---

## Alternative Fix (If Pagination Support Needed)

If the `_meta` field is intentionally used for pagination, it should be an object, not null:

```java
// Instead of setting _meta to null
content.set_meta(null);  // ❌ Wrong

// Either omit it entirely or set to empty object
content.set_meta(Collections.emptyMap());  // ✅ Correct
```

However, **the simplest fix is to just skip null fields entirely** using `JsonInclude.Include.NON_NULL`.

---

## Testing After Fix

### 1. Rebuild and Run

```bash
cd apicurio-registry/mcp
mvn clean install -DskipTests
podman build -t apicurio-registry-mcp-server:test .
podman run -i --rm -e REGISTRY_URL=http://host.containers.internal:8080 \
  apicurio-registry-mcp-server:test
```

### 2. Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  apicurio-registry-mcp-server:test
```

### 3. Verify Response Format

The response should NOT contain any `_meta` fields:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "isError": false,
    "content": [
      {
        "text": "{...}",
        "type": "text"
        // No _meta field ✅
      }
    ]
    // No _meta field ✅
  }
}
```

---

## Additional Context

### Investigation Timeline

1. **Nov 3**: Discovered MCP integration hanging with Zod errors
2. **Nov 13**: Fixed Docker environment variable configuration
3. **Nov 14**: Tested with MCP Inspector - same Zod error
4. **Nov 14**: Direct protocol test revealed `_meta: null` in server responses
5. **Nov 14**: Confirmed bug is in server serialization, not MCP SDK

### Files for Reference

- **Detailed investigation**: `/apicurio-vscode-plugin/docs/ai-integration/APICURIO_MCP_SERVER_BUG.md`
- **Test script**: `/tmp/test-tools-call.sh`
- **MCP Inspector guide**: `/apicurio-vscode-plugin/docs/ai-integration/MCP_INSPECTOR_TEST.md`

---

## Questions?

Contact: Alexandre Stranier (VSCode Plugin Team)

**Priority**: Please fix ASAP - this blocks the entire MCP integration for the VSCode extension.

---

## Summary for Quick Action

**What**: Server sends `"_meta": null`, MCP SDK expects omitted or object
**Where**: `ObjectMapperCustomizerImpl.java` line 18
**Fix**: Add `mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);`
**Test**: Use MCP Inspector to verify no `_meta` fields in responses
**Impact**: Unblocks entire MCP integration
