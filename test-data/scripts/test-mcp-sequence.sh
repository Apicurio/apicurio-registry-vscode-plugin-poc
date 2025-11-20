#!/bin/bash

# Test complete MCP sequence
(
  # 1. Initialize
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
  sleep 0.5

  # 2. Initialized notification (no id for notifications)
  echo '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}'
  sleep 0.5

  # 3. Call list_groups tool
  echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_groups","arguments":{"order":"asc","orderBy":"groupId"}}}'

  # Wait for response
  sleep 2
) | podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e QUARKUS_LOG_CONSOLE_STDERR=true \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot 2>/dev/null
