#!/bin/bash

# Test MCP Server with QUARKUS_LOG_CONSOLE_STDERR=true fix
# This script validates that the MCP server outputs clean JSON-RPC responses

echo "Testing MCP Server with stdout fix..."
echo "======================================="
echo ""

# Run the complete MCP sequence
OUTPUT=$(
  (
    # 1. Initialize
    echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
    sleep 0.5

    # 2. Initialized notification
    echo '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}'
    sleep 0.5

    # 3. Call list_groups tool
    echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_groups","arguments":{"order":"asc","orderBy":"groupId"}}}'

    # Wait for response
    sleep 2
  ) | podman run -i --rm \
    -e REGISTRY_URL=http://host.containers.internal:8080 \
    -e APICURIO_MCP_SAFE_MODE=true \
    -e APICURIO_MCP_PAGING_LIMIT=200 \
    -e QUARKUS_LOG_CONSOLE_STDERR=true \
    quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot 2>/dev/null
)

echo "Raw Output:"
echo "$OUTPUT"
echo ""

# Parse and validate responses
echo "Validation:"
echo "==========="

# Check for initialize response
if echo "$OUTPUT" | grep -q '"id":1'; then
    echo "✅ Initialize response received"
else
    echo "❌ Initialize response missing"
fi

# Check for list_groups response
if echo "$OUTPUT" | grep -q '"id":2'; then
    echo "✅ list_groups response received"
else
    echo "❌ list_groups response missing"
fi

# Check that output contains only JSON (no logs)
LINE_COUNT=$(echo "$OUTPUT" | wc -l | tr -d ' ')
if [ "$LINE_COUNT" -eq 2 ]; then
    echo "✅ Clean output (2 JSON responses, no logs)"
else
    echo "⚠️  Output has $LINE_COUNT lines (expected 2)"
fi

# Verify JSON is valid
if echo "$OUTPUT" | jq empty 2>/dev/null; then
    echo "✅ All output is valid JSON"
else
    echo "❌ Output contains invalid JSON"
fi

echo ""
echo "Test complete!"
