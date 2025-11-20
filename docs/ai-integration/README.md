# AI Integration with Claude Code

**Status:** ⚠️ **BLOCKED - MCP SDK Bug**
**Last Updated:** 2025-11-14
**Integration:** Claude Code + MCP Server
**Issue:** Critical bug in `@modelcontextprotocol/sdk` blocks all stdio tool invocation

This directory contains documentation for the AI-assisted development workflow using Claude Code and the Apicurio Registry MCP Server.

## ⚠️ CRITICAL BUG NOTICE

**A critical bug has been discovered in the Model Context Protocol TypeScript SDK that blocks all MCP tool invocation over stdio transport.**

**Read:** [`MCP_SDK_BUG_INVESTIGATION.md`](MCP_SDK_BUG_INVESTIGATION.md) for complete investigation details.

**Status:**
- ✅ Apicurio Registry MCP Server is **correct** and protocol-compliant
- ❌ Bug is in `@modelcontextprotocol/sdk` (affects Claude Code, MCP Inspector, and all SDK-based clients)
- ⏳ Waiting for MCP SDK team to fix the issue

**Impact:** MCP integration is currently **unusable** for stdio transport until SDK is fixed.

---

## Quick Start

### 🚀 For New Users

**Start here:** [`GETTING_STARTED.md`](GETTING_STARTED.md)

Complete setup guide for getting Claude Code working with the Apicurio Registry MCP Server (15-20 minutes).

---

## Essential Documentation

### Setup & Configuration

#### 1. **CLAUDE_CODE_MCP_WORKING_CONFIG.md** ⭐ PRIMARY REFERENCE
**The authoritative configuration guide**

- ✅ Complete working configuration
- ✅ Step-by-step setup instructions
- ✅ Troubleshooting common issues
- ✅ Verified to work

**Use this for:** Setting up Claude Code integration

---

#### 2. **GETTING_STARTED.md** 🚀 START HERE
**Quick start guide for new users**

- Complete setup walkthrough
- Prerequisites checklist
- First-time configuration
- Verification steps

**Use this for:** Your first setup

---

### Testing & Workflows

#### 3. **QUICK_TEST_STEPS.md** ⚡ TESTING GUIDE
**Quick testing procedures**

- 5-minute quick start
- Test scenarios (create groups, artifacts, versions)
- Verification checklist
- Demo script

**Use this for:** Verifying your setup works

---

#### 4. **REAL_USER_WORKFLOW.md** 💼 USER GUIDE
**Real-world usage patterns**

- Actual usage examples
- Common AI prompts
- Best practices
- Workflow tips

**Use this for:** Learning how to use the integration effectively

---

### Troubleshooting & Debugging

#### 5. **MCP_DEBUGGING_GUIDE.md** 🔧 TROUBLESHOOTING
**Comprehensive debugging reference**

- Common error patterns
- Diagnostic commands
- Fix procedures
- Known issues

**Use this for:** When something goes wrong

---

#### 6. **HOW_TO_VIEW_CLAUDE_CODE_LOGS.md** 📋 LOG VIEWING
**Quick reference for log locations**

- Log file locations (macOS/Windows/Linux)
- How to view logs
- What to look for
- Common patterns

**Use this for:** Checking what Claude Code is doing

---

### Architecture & Advanced

#### 7. **AI_WORKFLOW_ARCHITECTURE.md** 📐 ARCHITECTURE
**Complete architecture documentation**

- Full workflow design
- Architecture decisions
- Integration patterns
- Future roadmap

**Use this for:** Understanding the big picture

---

#### 8. **MCP_ARCHITECTURE_VALIDATION.md** ✅ VALIDATION
**Architecture verification**

- MCP protocol validation
- Performance analysis
- Tool implementations verified
- Architecture review results

**Use this for:** Technical deep dive

---

## Testing Documentation

### Active Testing Guides

- **CLAUDE_CODE_MCP_TESTING_GUIDE.md** - Complete testing procedures
- **MCP_TESTING_GUIDE.md** - General MCP testing
- **QUICK_TEST_STEPS.md** - Quick verification tests

---

## Planning & Design

- **PHASE_3.2_REACT_DECISION.md** - React UI integration planning
- **AI_INTEGRATION_ANALYSIS.md** - Analysis of all AI integration work

---

## Archive

Historical documentation moved to [`/archive/`](archive/):

- AI_MCP_INTEGRATION_OPTIONS.md - Initial solution exploration (6 options evaluated)
- CURSOR_MCP_TEST_GUIDE.md - Cursor IDE testing (path not chosen)
- CLAUDE_CODE_BUG_REPORT.md - Bug report submitted to Anthropic
- MCP_404_BUG_FIX.md - 404 error debugging and resolution
- GITHUB_ISSUE_TEMPLATE.md - Issue template for bug submission
- QUICK_TEST_REFERENCE.md - Cursor quick test (outdated)

---

## Current Status

### ✅ Working
- Claude Code + MCP Server integration
- All 17+ MCP tools functional
- stdio transport working
- Connection to local registry
- Complete documentation

### 📊 Statistics
- **Tools:** 17+ registry operations
- **Documentation:** 14 active files
- **Status:** Production ready
- **Support:** Comprehensive guides

---

## Quick Links

### I want to...

**Set up Claude Code integration**
→ Read [GETTING_STARTED.md](GETTING_STARTED.md)

**Fix a problem**
→ Read [MCP_DEBUGGING_GUIDE.md](MCP_DEBUGGING_GUIDE.md)

**Learn the configuration**
→ Read [CLAUDE_CODE_MCP_WORKING_CONFIG.md](CLAUDE_CODE_MCP_WORKING_CONFIG.md)

**See example workflows**
→ Read [REAL_USER_WORKFLOW.md](REAL_USER_WORKFLOW.md)

**Understand the architecture**
→ Read [AI_WORKFLOW_ARCHITECTURE.md](AI_WORKFLOW_ARCHITECTURE.md)

**View Claude Code logs**
→ Read [HOW_TO_VIEW_CLAUDE_CODE_LOGS.md](HOW_TO_VIEW_CLAUDE_CODE_LOGS.md)

**Test my setup**
→ Read [QUICK_TEST_STEPS.md](QUICK_TEST_STEPS.md)

---

## Prerequisites

Before setting up the integration, ensure you have:

- ✅ **Apicurio Registry** running (http://localhost:8080)
- ✅ **Docker or Podman** installed
- ✅ **Claude Code** installed
- ✅ **VSCode Extension** compiled and running

See [GETTING_STARTED.md](GETTING_STARTED.md) for detailed prerequisites.

---

## Architecture Overview

```
┌─────────────────┐
│   Claude Code   │ ◄─── User interacts with AI
└────────┬────────┘
         │ MCP Protocol (stdio)
         ▼
┌─────────────────┐
│   MCP Server    │ ◄─── 17+ tools exposed
│   (Container)   │
└────────┬────────┘
         │ REST API (v3)
         ▼
┌─────────────────┐
│ Apicurio        │ ◄─── Stores artifacts
│ Registry        │
└─────────────────┘
         ▲
         │ REST API
         │
┌─────────────────┐
│ VSCode          │ ◄─── Browse & edit
│ Extension       │
└─────────────────┘
```

---

## Workflow Example

```
User: "Create an OpenAPI schema for a user API in the demo group"
  │
  ▼
Claude Code processes prompt
  │
  ▼
Calls MCP tools:
  1. list_groups (verify demo group exists)
  2. create_artifact (create user-api in demo group)
  │
  ▼
MCP Server executes operations on registry
  │
  ▼
Registry stores the artifact
  │
  ▼
VSCode Extension shows new artifact (after refresh)
```

---

## Support

### Getting Help

1. **Check logs:** See [HOW_TO_VIEW_CLAUDE_CODE_LOGS.md](HOW_TO_VIEW_CLAUDE_CODE_LOGS.md)
2. **Debugging:** See [MCP_DEBUGGING_GUIDE.md](MCP_DEBUGGING_GUIDE.md)
3. **Configuration:** See [CLAUDE_CODE_MCP_WORKING_CONFIG.md](CLAUDE_CODE_MCP_WORKING_CONFIG.md)

### Common Issues

**Claude Code can't connect to MCP server?**
- Check you're in the correct directory (apicurio-registry project root)
- Verify MCP server is configured: `claude mcp list`
- Check logs in `~/Library/Application Support/Claude/logs/`

**MCP tools not available?**
- Restart Claude Code
- Verify MCP server container can start: `./test-data/scripts/test-mcp-server.sh`
- Check REGISTRY_URL environment variable

**VSCode Extension not showing artifacts?**
- Verify registry is running: `curl http://localhost:8080/apis/registry/v3/system/info`
- Click Refresh button in tree view
- Check connection configuration

---

## Contributing

When adding new documentation:

1. Follow existing naming patterns
2. Update this README with link
3. Add to appropriate section
4. Include "Use this for" description
5. Keep examples up-to-date

---

## Version History

**v2.0** (2025-11-11)
- Updated to reflect Claude Code integration
- Moved historical docs to /archive/
- Created GETTING_STARTED.md
- Consolidated documentation

**v1.0** (2025-10-31)
- Initial AI integration documentation
- Solution exploration phase
- Cursor/Continue.dev evaluation

---

**Ready to get started?** → [GETTING_STARTED.md](GETTING_STARTED.md)
