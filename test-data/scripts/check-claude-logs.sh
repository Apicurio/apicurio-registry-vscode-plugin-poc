#!/bin/bash

# Claude Code Log Viewer
# Helps debug MCP server issues

echo "Claude Code Debug Logs"
echo "======================"
echo ""

# Find most recent log
LATEST_LOG=$(ls -t ~/.claude/debug/*.txt 2>/dev/null | head -1)

if [ -z "$LATEST_LOG" ]; then
    echo "❌ No Claude Code logs found at ~/.claude/debug/"
    exit 1
fi

echo "📄 Latest log: $LATEST_LOG"
echo "📅 Modified: $(stat -f "%Sm" "$LATEST_LOG")"
echo "📊 Size: $(stat -f "%z" "$LATEST_LOG" | numfmt --to=iec-i 2>/dev/null || stat -f "%z" "$LATEST_LOG") bytes"
echo ""

# Check for MCP server activity
echo "🔍 MCP Server Activity:"
echo "----------------------"
MCP_LINES=$(grep -c "apicurio-registry" "$LATEST_LOG" 2>/dev/null || echo "0")
echo "  Total apicurio-registry mentions: $MCP_LINES"

# Check connection status
if grep -q "Successfully connected to stdio server" "$LATEST_LOG" 2>/dev/null; then
    echo "  ✅ MCP server connected"
else
    echo "  ❌ MCP server not connected"
fi

# Check for errors
ERROR_COUNT=$(grep -c "Connection error\|STDIO connection dropped" "$LATEST_LOG" 2>/dev/null || echo "0")
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "  ❌ Connection errors: $ERROR_COUNT"
else
    echo "  ✅ No connection errors"
fi

# Check for running tools
RUNNING=$(grep -c "still running" "$LATEST_LOG" 2>/dev/null || echo "0")
if [ "$RUNNING" -gt 0 ]; then
    echo "  ⏳ Tools still running: $RUNNING"
fi

echo ""
echo "📋 Recent MCP Activity (last 20 lines):"
echo "---------------------------------------"
grep -i "apicurio\|list_groups\|Connection\|still running" "$LATEST_LOG" 2>/dev/null | tail -20 || echo "  (no activity found)"

echo ""
echo "💡 Useful commands:"
echo "  - View full log:     cat $LATEST_LOG"
echo "  - Follow in real-time: tail -f $LATEST_LOG"
echo "  - Search for errors:   grep -i error $LATEST_LOG"
echo ""
