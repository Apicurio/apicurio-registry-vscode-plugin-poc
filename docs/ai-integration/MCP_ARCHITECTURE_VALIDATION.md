# MCP Architecture Validation - Local & Remote Scenarios

**Date**: 2025-11-02
**Status**: Architecture Validated, Implementation Planned
**Priority**: HIGH - Critical for AI features to work correctly

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Scenario Validation](#scenario-validation)
4. [Gap Analysis](#gap-analysis)
5. [Implementation Plan](#implementation-plan)
6. [Success Criteria](#success-criteria)

---

## Executive Summary

### The Question

**Is the VSCode plugin responsible for activating the MCP connection between Claude Code and Registry MCP Server?**

### The Answer

**Currently: NO** (but there's a mismatch between what the code tries to do and what actually works)

**Recommendation: HYBRID APPROACH**
- VSCode Extension manages MCP server lifecycle (start/stop/health)
- VSCode Extension generates CLI configuration commands for user
- User runs the command to configure Claude Code
- Claude Code manages connection to MCP server

---

## Current Architecture Analysis

### What's Implemented (Code Review)

The VSCode extension has **two MCP management components**:

#### 1. MCPServerManager (`src/services/mcpServerManager.ts`)

**Purpose**: Manage MCP server lifecycle

**Capabilities**:
- Start/stop/restart MCP server
- Support 3 deployment modes: Docker, JAR, External
- Health monitoring with auto-restart
- Status tracking and events

**Current Mode**: Runs server in **detached mode** (`podman run -d`)

**Issue**: Claude Code needs **stdio mode** (`podman run -i`) for MCP protocol communication

#### 2. MCPConfigurationManager (`src/services/mcpConfigurationManager.ts`)

**Purpose**: Auto-configure Claude Code

**Current Approach** (DOESN'T WORK):
```typescript
// Tries to update VSCode settings
await claudeConfig.update('mcpServers', mcpServers, vscode.ConfigurationTarget.Global);
// Updates: 'claude-code.mcpServers' in VSCode settings
```

**What Actually Works** (from testing):
```bash
# Manual CLI configuration
claude mcp add apicurio-registry -s local -- \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# Stores configuration in: ~/.claude.json (NOT VSCode settings)
```

**Root Cause**: Code assumes VSCode settings integration, but Claude Code CLI uses its own config file.

---

## Scenario Validation

### User Requirements (from discussion)

1. **Setup Wizard**: Interactive wizard for both scenarios
2. **Local Scenario**: Extension manages MCP server lifecycle
3. **Remote Scenario**: SSH tunnel + stdio transport (deployment TBD)
4. **Priority**: Local scenario first

### Scenario 1: Local Development (PRIORITY)

**User Story**:
> Developer working on microservice, uses VSCode extension to navigate Registry (localhost:8080), creates/updates artifacts. Wants AI assistance via Claude Code for schema design.

**Architecture**:
```
Developer's Machine
┌─────────────────────────────────────────────────────────────┐
│ VSCode Extension (Primary Orchestrator)                     │
│ ├── MCPServerManager: Starts/stops local MCP server        │
│ ├── MCPConfigurationManager: Generates Claude CLI config   │
│ └── Setup Wizard: Guides user through local setup          │
└─────────────────────────────────────────────────────────────┘
         │ manages ↓                    │ configures ↓
┌──────────────────────┐      ┌────────────────────────────┐
│ MCP Server (Podman)  │      │ Claude Code CLI            │
│ stdio transport      │←─────│ stdio transport            │
│ (run via claude)     │      │ ~/.claude.json config      │
└──────────────────────┘      └────────────────────────────┘
         ↓ connects to
┌──────────────────────┐
│ Local Registry       │
│ localhost:8080       │
└──────────────────────┘
```

**Key Insight**:
- Extension doesn't start the server itself
- Extension generates the correct `claude mcp add` command
- User runs the command (copies from clipboard)
- Claude Code starts MCP server on-demand via stdio

### Scenario 2: Remote/Production (FUTURE)

**User Story**:
> Developer working on project, Registry deployed in cloud (https://registry.company.com), MCP Server also in cloud. Developer wants AI assistance via SSH tunnel.

**Architecture**:
```
Developer's Machine
┌─────────────────────────────────────────────────────────────┐
│ VSCode Extension                                             │
│ └── Setup Wizard: Guides user through remote setup          │
└─────────────────────────────────────────────────────────────┘
         │ configures ↓
┌─────────────────────────────────────────────────────────────┐
│ Claude Code CLI                                              │
│ Command: ssh user@registry.company.com 'podman run -i...'  │
│ Transport: stdio over SSH                                    │
│ Config: ~/.claude.json                                      │
└─────────────────────────────────────────────────────────────┘
         │ SSH tunnel ↓
┌─────────────────────────────────────────────────────────────┐
│ Cloud Environment (registry.company.com)                    │
│ ├── MCP Server (runs on-demand via SSH)                    │
│ └── Apicurio Registry (cloud deployment)                   │
└─────────────────────────────────────────────────────────────┘
```

**Deployment Options** (TBD):
- Option A: MCP Server as Kubernetes sidecar
- Option B: MCP Server as standalone service
- Option C: MCP Server on-demand via SSH (simplest, chosen for now)

---

## Gap Analysis

### What the Code TRIES to Do

```typescript
// MCPConfigurationManager.configureClaudeCode()
const claudeConfig = vscode.workspace.getConfiguration('claude-code');
const mcpServers = claudeConfig.get<any>('mcpServers') || {};
mcpServers['apicurio-registry'] = {
    command: 'podman',
    args: ['run', '-i', '--rm', ...]
};
await claudeConfig.update('mcpServers', mcpServers, vscode.ConfigurationTarget.Global);
```

**Assumption**: Claude Code reads MCP servers from VSCode settings

### What Actually Works

```bash
# User runs this command in terminal
claude mcp add apicurio-registry -s local -- \
  podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080/apis/registry/v3 \
  -e APICURIO_MCP_SAFE_MODE=false \
  -e APICURIO_MCP_PAGING_LIMIT=200 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# This creates/updates: ~/.claude.json
{
  "mcpServers": {
    "apicurio-registry": {
      "command": "podman",
      "args": ["run", "-i", "--rm", ...]
    }
  }
}
```

**Reality**: Claude Code CLI manages its own configuration file

### The Disconnect

| Component | Code Assumption | Reality |
|-----------|----------------|---------|
| **Config Storage** | VSCode settings (`settings.json`) | Claude Code config (`~/.claude.json`) |
| **Config Method** | VSCode API (`claudeConfig.update()`) | CLI command (`claude mcp add`) |
| **Server Startup** | Extension starts in detached mode (`-d` flag) | Claude Code starts via stdio (`-i` flag) |
| **Transport** | HTTP or detached process | stdio (stdin/stdout) |

### What Needs to Change

**Current**:
```typescript
// This doesn't work
await claudeConfig.update('mcpServers', mcpServers, vscode.ConfigurationTarget.Global);
```

**Should Be**:
```typescript
// Generate CLI command for user to run
const cliCommand = this.generateClaudeMCPCommand();
await vscode.env.clipboard.writeText(cliCommand);
vscode.window.showInformationMessage(
    'MCP configuration command copied! Paste and run in terminal:',
    'Open Terminal'
);
```

---

## Implementation Plan

### Phase 1: Fix Local Scenario (2-3 days) - PRIORITY

#### Task 1.1: Fix MCPConfigurationManager

**File**: `src/services/mcpConfigurationManager.ts`

**Current Issue**: Tries to update VSCode settings which doesn't work

**Solution**: Generate CLI commands for user to run

**Changes**:
1. Add `generateClaudeMCPCommand()` method:
   ```typescript
   private generateClaudeMCPCommand(): string {
       const registryUrl = this.config.registryUrl.includes('/apis/registry/v3')
           ? this.config.registryUrl
           : `${this.config.registryUrl}/apis/registry/v3`;

       return `claude mcp add apicurio-registry -s local -- \\
         podman run -i --rm \\
         -e REGISTRY_URL=${this.convertToContainerUrl(registryUrl)} \\
         -e APICURIO_MCP_SAFE_MODE=${this.config.safeMode} \\
         -e APICURIO_MCP_PAGING_LIMIT=${this.config.pagingLimit} \\
         quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot`;
   }

   private convertToContainerUrl(url: string): string {
       // Convert localhost to host.containers.internal for Docker/Podman
       return url.replace('localhost', 'host.containers.internal')
                 .replace('127.0.0.1', 'host.containers.internal');
   }
   ```

2. Replace `configureClaudeCode()` with "Copy & Run" workflow:
   ```typescript
   async configureClaudeCode(): Promise<void> {
       const command = this.generateClaudeMCPCommand();
       await vscode.env.clipboard.writeText(command);

       const action = await vscode.window.showInformationMessage(
           'Claude Code MCP configuration command copied to clipboard!',
           { modal: true, detail: command },
           'Open Terminal',
           'Show Instructions'
       );

       if (action === 'Open Terminal') {
           await vscode.commands.executeCommand('workbench.action.terminal.new');
       } else if (action === 'Show Instructions') {
           this.showDetailedInstructions(command);
       }
   }
   ```

3. Add verification method:
   ```typescript
   async verifyMCPConfiguration(): Promise<boolean> {
       // Check if 'claude' CLI is installed
       // Run 'claude mcp list' to check if apicurio-registry is configured
       // Return true if configured correctly
   }
   ```

**Effort**: 4-6 hours

#### Task 1.2: Enhance MCPServerManager for stdio Support

**File**: `src/services/mcpServerManager.ts`

**Current Issue**: Starts server in detached mode, Claude Code needs stdio mode

**Solution**: Don't start server ourselves, let Claude Code manage it via stdio

**Changes**:
1. Update MCPServerConfig model:
   ```typescript
   export interface MCPServerConfig {
       // ... existing fields
       managementMode: 'extension' | 'claude-code';  // NEW
   }
   ```

2. Modify `startDockerServer()`:
   ```typescript
   private async startDockerServer(): Promise<void> {
       if (this.config.managementMode === 'claude-code') {
           // Don't start server ourselves
           // Just verify configuration is ready
           vscode.window.showInformationMessage(
               'MCP Server will be started by Claude Code when needed'
           );
           this.setStatus('running');  // Assume it will work
           return;
       }

       // Original detached mode code for 'extension' mode
       // (keep for users who want extension to manage it)
   }
   ```

3. Update health checks:
   - For 'claude-code' mode: Check via `claude mcp list`
   - For 'extension' mode: Check via HTTP health endpoint

**Effort**: 3-4 hours

#### Task 1.3: Create Unified Setup Wizard

**File**: `src/commands/setupMCPCommand.ts` (NEW)

**Purpose**: Interactive wizard that guides user through setup

**Flow**:
```
1. Welcome Screen
   "Set up AI features with Claude Code?"

2. Check Prerequisites
   ✓ Claude CLI installed? (run 'claude --version')
   ✓ Podman/Docker installed? (run 'podman version')
   ✓ Registry connection configured?

3. Detect Scenario
   "Is your Registry local or remote?"
   → LOCAL (localhost:8080) - continue
   → REMOTE - show "coming soon" message

4. Generate Configuration
   - Build CLI command
   - Copy to clipboard
   - Show command in modal

5. User Runs Command
   "Please paste and run the command in your terminal"
   [Open Terminal] [I ran it, continue]

6. Verify Configuration
   - Run 'claude mcp list'
   - Check if apicurio-registry appears
   - ✓ Success or ✗ Troubleshoot

7. Success!
   "Setup complete! Try asking Claude: 'List my registry groups'"
```

**Implementation**:
```typescript
export async function setupMCPCommand(
    context: vscode.ExtensionContext,
    mcpConfigManager: MCPConfigurationManager
): Promise<void> {
    // Step 1: Welcome
    const start = await vscode.window.showInformationMessage(
        'Welcome to Apicurio Registry AI Features Setup',
        { modal: true, detail: 'This wizard will help you configure Claude Code...' },
        'Get Started',
        'Cancel'
    );
    if (start !== 'Get Started') return;

    // Step 2: Check prerequisites
    const checks = await runPrerequisiteChecks();
    if (!checks.allPassed) {
        await showPrerequisiteErrors(checks);
        return;
    }

    // Step 3-6: Main wizard flow
    await runSetupWizard(mcpConfigManager);
}
```

**Effort**: 6-8 hours

#### Task 1.4: Update Commands

**File**: `src/extension.ts`, `package.json`

**New Commands**:
1. `apicurioRegistry.setupMCP` - Launch setup wizard
2. `apicurioRegistry.generateClaudeCommand` - Generate CLI command
3. `apicurioRegistry.verifyMCPConnection` - Verify setup

**package.json additions**:
```json
{
  "contributes": {
    "commands": [
      {
        "command": "apicurioRegistry.setupMCP",
        "title": "Setup AI Features (Claude Code)",
        "category": "Apicurio Registry",
        "icon": "$(sparkle)"
      },
      {
        "command": "apicurioRegistry.generateClaudeCommand",
        "title": "Generate Claude MCP Command",
        "category": "Apicurio Registry"
      },
      {
        "command": "apicurioRegistry.verifyMCPConnection",
        "title": "Verify MCP Connection",
        "category": "Apicurio Registry"
      }
    ]
  }
}
```

**Effort**: 2-3 hours

### Phase 2: Add Remote Scenario Support (2-3 days) - DEFERRED

**Priority**: LOW (implement after local scenario working)

**Tasks**:
- Research cloud deployment options
- Implement SSH tunnel configuration
- Update wizard for remote scenario
- Create cloud deployment documentation

### Phase 3: Enhanced UX & Validation (1-2 days) - DEFERRED

**Tasks**:
- Add MCP connection validation
- Add status indicators
- Create troubleshooting guide

### Phase 4: Testing & Documentation (1 day) - DEFERRED

**Tasks**:
- Test local scenario end-to-end
- Update user documentation
- Create video walkthrough

---

## Success Criteria

### Phase 1 Success (Local Scenario)

✅ **User can complete setup in under 5 minutes**:
1. Run command palette: "Setup AI Features"
2. Follow wizard prompts
3. Copy and run CLI command
4. Verify connection working

✅ **MCP connection works**:
- User can ask Claude Code: "List my registry groups"
- Claude Code successfully calls MCP tools
- Results appear in Claude Code chat

✅ **No manual configuration required**:
- Wizard generates correct command automatically
- All environment variables included
- Registry URL converted correctly (localhost → host.containers.internal)

✅ **Error handling**:
- Clear error messages if prerequisites missing
- Helpful troubleshooting tips
- Link to documentation

### Validation Checklist

Before marking Phase 1 complete:

- [ ] MCPConfigurationManager generates correct CLI command
- [ ] Command includes all required environment variables
- [ ] Registry URL converted for container networking
- [ ] Setup wizard guides user step-by-step
- [ ] Wizard verifies prerequisites (Claude CLI, Podman)
- [ ] User can copy/paste command easily
- [ ] Verification step confirms MCP working
- [ ] Error messages are clear and actionable
- [ ] Documentation updated
- [ ] Manual testing on fresh VSCode install

---

## Timeline & Priorities

### Immediate (This Week)

**Focus**: Phase 1 - Local Scenario

| Task | Effort | Priority |
|------|--------|----------|
| 1.1: Fix MCPConfigurationManager | 4-6h | 🔴 HIGH |
| 1.2: Enhance MCPServerManager | 3-4h | 🔴 HIGH |
| 1.3: Create Setup Wizard | 6-8h | 🔴 HIGH |
| 1.4: Update Commands | 2-3h | 🔴 HIGH |

**Total**: 15-21 hours (~2-3 days)

### Next Steps (After Phase 1)

1. **Test with real users** - Get feedback on setup experience
2. **Remote scenario planning** - Research deployment options
3. **Continue Phase 3.1** - Task 017 (Conflict Detection)

### Long-term (Future Releases)

- Remote scenario implementation
- HTTP transport support (alternative to stdio)
- Multi-registry MCP configuration
- Enterprise SSO integration

---

## References

### Documentation
- [CLAUDE_CODE_MCP_WORKING_CONFIG.md](CLAUDE_CODE_MCP_WORKING_CONFIG.md) - Verified working configuration
- [CLAUDE_CODE_MCP_TESTING_GUIDE.md](CLAUDE_CODE_MCP_TESTING_GUIDE.md) - Testing procedures
- [AI_MCP_INTEGRATION_OPTIONS.md](AI_MCP_INTEGRATION_OPTIONS.md) - Options analysis

### Code Locations
- MCP Configuration: `src/services/mcpConfigurationManager.ts`
- MCP Server Manager: `src/services/mcpServerManager.ts`
- MCP Models: `src/models/mcpServerConfig.ts`
- Extension Entry: `src/extension.ts`

### External Resources
- [Claude Code CLI Documentation](https://docs.claude.com/en/docs/claude-code/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Apicurio Registry MCP Server](https://github.com/Apicurio/apicurio-registry/tree/main/mcp)

---

## Decision Log

### 2025-11-02: Architecture Validation

**Decision**: Extension generates CLI commands instead of managing server directly

**Rationale**:
1. Claude Code CLI uses `~/.claude.json`, not VSCode settings
2. stdio transport requires command-line integration
3. User visibility and control over configuration
4. Simpler architecture (less moving parts)
5. Works with existing Claude Code design

**Alternatives Considered**:
- ❌ Extension updates VSCode settings: Doesn't work
- ❌ Extension starts server in detached mode: Claude Code needs stdio
- ❌ Build custom MCP client in extension: Too complex
- ✅ Hybrid: Extension helps, user runs command: **CHOSEN**

### 2025-11-02: Scenario Priority

**Decision**: Local scenario first, remote scenario deferred

**Rationale**:
1. Local development is most common use case
2. Remote deployment architecture still TBD
3. Get local working perfectly before adding complexity
4. User feedback on local setup will inform remote design

---

## Document History

**Version 1.0** - 2025-11-02
- Initial architecture validation
- Two scenarios documented (local + remote)
- Gap analysis completed
- Implementation plan created (4 phases)
- User requirements captured (setup wizard, extension management, SSH tunnel)
- Priority established: Local scenario first

---

**Document Version**: 1.0
**Last Updated**: 2025-11-02
**Status**: ✅ Architecture Validated, Ready for Implementation
**Next Action**: Update TODO.md and begin Phase 1 implementation
