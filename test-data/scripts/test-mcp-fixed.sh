#!/bin/bash

echo "Testing MCP server with stderr logging..."
echo ""
echo "=== Sending initialize request ==="

cat test-mcp-request.json | podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

echo ""
echo "=== Expected: Only JSON on stdout (above), logs on stderr ==="
