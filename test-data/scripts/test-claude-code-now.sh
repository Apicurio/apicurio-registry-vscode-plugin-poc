#!/bin/bash

echo "=== Testing Claude Code MCP Integration ==="
echo ""
echo "Configuration:"
cat ~/.claude.json | jq '.projects["/Users/astranier/Documents/dev/apicurio"].mcpServers["apicurio-registry"]'
echo ""
echo "Starting simple test..."
echo ""

cd /Users/astranier/Documents/dev/apicurio

# Create a simple test file
cat > /tmp/claude-test-prompt.txt <<'EOF'
Using the apicurio-registry MCP server, please call the list_groups tool and show me the results.
EOF

echo "Prompt:"
cat /tmp/claude-test-prompt.txt
echo ""
echo "---"
echo ""

# Run Claude Code with the prompt (with timeout)
cat /tmp/claude-test-prompt.txt | timeout 30s claude 2>&1 || echo "Command timed out or failed"

