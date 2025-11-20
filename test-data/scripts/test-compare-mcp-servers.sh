#!/bin/bash

echo "=== Testing Apicurio Registry MCP Server ==="
echo "Sending initialize request..."

podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot <<'EOF' 2>/dev/null
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"capabilities":{},"clientInfo":{"name":"test","version":"1.0"},"protocolVersion":"2024-11-05"}}
EOF

echo ""
echo "=== Checking what appears on stderr ==="
podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot <<'EOF' 1>/dev/null 
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"capabilities":{},"clientInfo":{"name":"test","version":"1.0"},"protocolVersion":"2024-11-05"}}
EOF
