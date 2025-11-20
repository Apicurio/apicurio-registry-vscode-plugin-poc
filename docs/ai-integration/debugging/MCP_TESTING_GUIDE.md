# MCP Integration Testing Guide

**Created**: 2025-11-03
**Purpose**: Manual testing procedures for MCP Integration functionality

---

## Testing Environment Setup

### Step 1: Launch Extension Development Host

1. Open VSCode in the `apicurio-vscode-plugin` directory
2. Press **F5** to launch Extension Development Host
3. Wait for the new VSCode window to open

### Step 2: Verify Extension Loaded

1. In the Extension Development Host window, open Command Palette (**Cmd+Shift+P** / **Ctrl+Shift+P**)
2. Type "Apicurio"
3. You should see these commands:
   - **Apicurio Registry: Connect**
   - **Apicurio Registry: Disconnect**
   - **Apicurio Registry: Refresh**
   - **Apicurio Registry: Search Artifacts**
   - **Apicurio Registry: Create Artifact**
   - **Apicurio MCP: Setup AI Features**
   - **Apicurio MCP: Generate Claude MCP Command**
   - **Apicurio MCP: Verify MCP Configuration**

### Step 3: Configure Registry Connection (Required)

Before testing MCP commands, you need a Registry connection configured:

1. Open Command Palette
2. Run: **"Apicurio Registry: Connect"**
3. If no connections exist, you'll be prompted to add one
4. Click **"Add Connection"**
5. This opens Settings → search for "apicurioRegistry.connections"
6. Add a connection manually in `settings.json`:

```json
{
  "apicurioRegistry.connections": [
    {
      "name": "Local Registry",
      "url": "http://localhost:8080",
      "authType": "none"
    }
  ]
}
```

---

## Test 1: Generate Claude MCP Command

**Command**: "Apicurio MCP: Generate Claude MCP Command"

### Expected Behavior

1. Opens modal dialog with:
   - Title: "Claude MCP command generated"
   - Message showing the full `claude mcp add` command
   - Detail showing: "✓ Command copied to clipboard!"
   - Buttons: "Open Terminal" | "Close"

2. Command format should be:
```bash
claude mcp add apicurio-registry -s local -- \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3 \
  -e APICURIO_MCP_SAFE_MODE=true \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

3. Command should be copied to clipboard automatically

### Testing Steps

1. Open Command Palette
2. Type: "Generate Claude MCP Command"
3. Press Enter
4. **Verify**: Modal dialog appears with command
5. **Verify**: Command includes correct Registry URL
6. Click **"Open Terminal"**
7. **Verify**: Terminal opens
8. **Verify**: You see message: "Paste the command (Cmd+V / Ctrl+V) and press Enter."
9. Paste command in terminal (**Cmd+V** / **Ctrl+V**)
10. **Verify**: Full command appears

### Troubleshooting

**If modal doesn't appear:**
- Check Debug Console for errors (View → Debug Console in Extension Development Host)
- Verify Registry connection is configured

**If command has wrong URL:**
- Check your Registry connection URL in settings
- Command should convert `localhost` → `host.containers.internal`

---

## Test 2: Verify MCP Configuration

**Command**: "Apicurio MCP: Verify MCP Configuration"

### Expected Behavior (Not Configured)

If you haven't run `claude mcp add` yet:

1. Shows warning modal:
   - Title: "MCP Configuration Not Found"
   - Detail explaining MCP server is not configured
   - Button: "Run Setup Wizard"

### Expected Behavior (Configured)

If you've already run `claude mcp add apicurio-registry`:

1. Shows success modal:
   - Title: "MCP Configuration Verified"
   - Detail: "MCP configuration is correct! 🎉"
   - Shows example Claude prompts to try
   - Button: "OK"

### Testing Steps

1. Open Command Palette
2. Type: "Verify MCP"
3. Press Enter
4. **Verify**: Modal appears

**If NOT configured:**
- Click **"Run Setup Wizard"**
- Should launch the full setup wizard (Test 3)

**If configured:**
- Modal shows success message
- Try asking Claude: "List my Apicurio Registry groups"

### Troubleshooting

**If verification fails with error:**
- Check if Claude CLI is installed: `claude --version`
- Check ~/.claude.json exists
- Check Debug Console for specific error

---

## Test 3: Setup AI Features (Full Wizard)

**Command**: "Apicurio MCP: Setup AI Features"

### Expected Flow

#### Step 1: Welcome Screen

Modal dialog:
- Title: "Welcome to Apicurio Registry AI Features Setup"
- Detail explaining what you'll be able to do
- Buttons: "Get Started" | "Cancel"

**Action**: Click **"Get Started"**

#### Step 2: Prerequisite Checks

Extension checks:
1. **Claude CLI installed?** (`claude --version`)
2. **Docker/Podman installed?** (`podman version`)
3. **Registry connection configured?**

**If all pass**: Continues to Step 3

**If any fail**: Shows error modal with specific missing prerequisites

#### Step 3: Scenario Detection

Quick Pick dialog:
- "Where is your Apicurio Registry running?"
- Options:
  - **"$(home) Local (localhost)"** - recommended
  - **"$(cloud) Remote (cloud/server)"** - coming soon

**Action**: Select **"Local (localhost)"**

**Note**: If you select Remote, shows "coming soon" message

#### Step 4: Command Generation

Modal dialog:
- Title: "Run this command in your terminal"
- Shows the full `claude mcp add` command
- "✓ Command copied to clipboard!"
- Buttons: "Open Terminal" | "I ran it, verify now" | "Cancel"

**Action**:
1. Click **"Open Terminal"**
2. Paste command (**Cmd+V** / **Ctrl+V**)
3. Run command
4. Return to modal
5. Click **"I ran it, verify now"**

#### Step 5: Verification

Extension runs `claude mcp list` to check if `apicurio-registry` is configured

**If successful**:
- Shows success modal
- "Setup complete! 🎉"
- Suggests prompts to try

**If failed**:
- Shows warning modal
- Explains possible issues
- Offers to retry

### Testing Steps

1. **Before starting**, make sure:
   - Claude CLI installed: `claude --version`
   - Docker/Podman installed: `podman version` or `docker version`
   - Registry connection configured (Test 1, Step 3)

2. Open Command Palette
3. Type: "Setup AI Features"
4. Follow wizard steps 1-5 above
5. **Verify each modal appears as described**
6. **Complete the full flow**

### Troubleshooting

**Prerequisite check fails:**
- Install missing tool
- Restart wizard

**Verification fails:**
- Check command ran successfully in terminal
- Check for errors in terminal output
- Run manually: `claude mcp list`
- Verify `apicurio-registry` appears in output

---

## Test 4: End-to-End MCP Functionality

After completing setup wizard, test actual AI features:

### With Claude Code CLI

1. Open terminal
2. Start Claude conversation:
```bash
claude chat
```

3. Try these prompts:
```
List my Apicurio Registry groups
```

```
Show me all artifacts in the default group
```

```
Get the latest version of artifact <name>
```

### Expected Results

- Claude should respond with actual data from your Registry
- If Registry is empty, Claude will say "no groups found" or similar
- Responses should be accurate and helpful

### Troubleshooting

**Claude says "I don't have access to that tool":**
- MCP server not configured correctly
- Re-run setup wizard
- Check `~/.claude.json` contains apicurio-registry config

**Claude returns errors:**
- Check Registry is running: `curl http://localhost:8080/apis/registry/v3/system/info`
- Check MCP server container is running: `podman ps | grep apicurio`
- Check container logs: `podman logs <container-id>`

**Connection refused errors:**
- Verify URL conversion: localhost → host.containers.internal
- Verify Registry is accessible from container

---

## Debug Console Monitoring

While testing, keep Debug Console open:

1. In Extension Development Host: **View → Debug Console**
2. Watch for:
   - Command invocations
   - Error messages
   - API calls

Look for patterns like:
```
[Extension Host] Apicurio Registry extension is now active!
[Extension Host] Command: apicurioRegistry.generateClaudeCommand
[Extension Host] MCP command generated
```

---

## Common Issues and Solutions

### Issue 1: Commands don't appear in Command Palette

**Solution:**
1. Close Extension Development Host
2. In main VSCode, run: `npm run compile`
3. Press **F5** again
4. Try again

### Issue 2: Modal dialogs don't show

**Possible causes:**
- Extension not fully loaded
- Error thrown before modal shown
- Modal blocked by VSCode

**Solution:**
1. Check Debug Console for errors
2. Add breakpoint in command implementation
3. Debug step-by-step

### Issue 3: Clipboard not working

**Solution:**
- Try manually copying command from modal
- Verify clipboard permissions
- Check if other apps can access clipboard

### Issue 4: Verification always fails

**Solution:**
1. Check Claude CLI works: `claude --version`
2. Check `~/.claude.json` exists and is valid JSON
3. Check apicurio-registry entry exists:
```bash
claude mcp list
```

### Issue 5: Registry URL wrong

**Solution:**
1. Check settings: `apicurioRegistry.connections`
2. Verify URL format: `http://localhost:8080` (no trailing slash)
3. Extension should add `/apis/registry/v3` automatically

---

## Quick Reference

### Command Names (exact)

- `apicurioRegistry.setupMCP`
- `apicurioRegistry.generateClaudeCommand`
- `apicurioRegistry.verifyMCP`

### Expected Files Modified

After running setup:
- `~/.claude.json` - Contains MCP server configuration

### MCP Server Container

When Claude uses the MCP server:
```bash
# Check if running
podman ps | grep apicurio-registry-mcp

# Check logs
podman logs <container-id>

# Stop manually (if needed)
podman stop <container-id>
```

---

## Success Checklist

After completing all tests, you should have:

- [ ] ✅ Commands appear in Command Palette
- [ ] ✅ Generate command shows correct command with Registry URL
- [ ] ✅ Command copied to clipboard automatically
- [ ] ✅ Verify command detects configuration status
- [ ] ✅ Setup wizard completes successfully
- [ ] ✅ Claude Code can call Registry MCP tools
- [ ] ✅ AI features return real Registry data

---

**Version**: 1.0
**Last Updated**: 2025-11-03
**Status**: Ready for testing
