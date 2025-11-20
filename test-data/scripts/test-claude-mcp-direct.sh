#!/bin/bash

echo "Testing if Claude Code can communicate with MCP server..."
echo ""

# Start MCP server in background
podman run -d --name test-mcp-server \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot \
  2>/dev/null

CONTAINER_ID=$(podman ps -q --filter "name=test-mcp-server")

if [ -z "$CONTAINER_ID" ]; then
  echo "❌ Failed to start container"
  exit 1
fi

echo "✅ Container started: $CONTAINER_ID"
echo ""

# Try to send initialize via podman exec
echo "Sending initialize request..."
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | \
  podman exec -i $CONTAINER_ID cat

echo ""
echo "Cleaning up..."
podman stop $CONTAINER_ID >/dev/null 2>&1
podman rm $CONTAINER_ID >/dev/null 2>&1
