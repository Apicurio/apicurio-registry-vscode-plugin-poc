#!/bin/bash

# Manual MCP Server Debugging
# Shows raw stdin/stdout communication

echo "=== MCP Server Raw Communication Test ==="
echo ""
echo "This will show you EXACTLY what the MCP server sends/receives"
echo ""

# Create a temporary file to log everything
LOGFILE="/tmp/mcp-debug-$(date +%s).log"
echo "📝 Logging to: $LOGFILE"
echo ""

# Function to send JSON-RPC and show request/response
send_and_show() {
    local request="$1"
    local description="$2"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📤 SENDING: $description"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$request" | jq '.' 2>/dev/null || echo "$request"
    echo ""
}

# Start the MCP server in background
echo "🚀 Starting MCP server..."
echo ""

(
    # 1. Initialize
    INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"manual-debug","version":"1.0"}}}'
    echo "$INIT"
    echo "SENT: $INIT" >> "$LOGFILE"
    sleep 1

    # 2. Initialized notification
    NOTIF='{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}'
    echo "$NOTIF"
    echo "SENT: $NOTIF" >> "$LOGFILE"
    sleep 1

    # 3. List groups tool call
    TOOL='{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_groups","arguments":{"order":"asc","orderBy":"groupId"}}}'
    echo "$TOOL"
    echo "SENT: $TOOL" >> "$LOGFILE"

    # Wait for response
    sleep 5

) | podman run -i --rm \
    -e REGISTRY_URL=http://host.containers.internal:8080 \
    -e APICURIO_MCP_SAFE_MODE=true \
    -e APICURIO_MCP_PAGING_LIMIT=200 \
    -e QUARKUS_LOG_CONSOLE_STDERR=true \
    quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot 2>&1 | tee -a "$LOGFILE" | while IFS= read -r line; do

    # Check if it's JSON (starts with {)
    if [[ "$line" =~ ^\{.*\}$ ]]; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📥 RECEIVED JSON:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "$line" | jq '.' 2>/dev/null || echo "$line"
        echo ""

        # Parse the response
        METHOD=$(echo "$line" | jq -r '.method // "N/A"')
        ID=$(echo "$line" | jq -r '.id // "N/A"')
        HAS_RESULT=$(echo "$line" | jq 'has("result")')
        HAS_ERROR=$(echo "$line" | jq 'has("error")')

        echo "  📋 Type: $([ "$HAS_RESULT" = "true" ] && echo "RESPONSE" || echo "REQUEST/NOTIFICATION")"
        echo "  🆔 ID: $ID"
        [ "$METHOD" != "N/A" ] && echo "  🔧 Method: $METHOD"
        [ "$HAS_RESULT" = "true" ] && echo "  ✅ Has result: YES"
        [ "$HAS_ERROR" = "true" ] && echo "  ❌ Has error: YES"
        echo ""
    else
        # Non-JSON output (logs, errors)
        echo "📝 [STDERR/LOG]: $line"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test Complete!"
echo "📝 Full log saved to: $LOGFILE"
echo ""
echo "💡 To analyze the log:"
echo "   cat $LOGFILE | grep -A 5 'RECEIVED'"
echo "   cat $LOGFILE | jq ."
