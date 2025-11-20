# AI Integration Debugging

Debugging documentation for the Apicurio Registry MCP Server and AI integration.

## Overview

This folder contains debugging guides, tools, and troubleshooting documentation for:
- MCP (Model Context Protocol) server setup
- Claude Code integration
- VSCode AI features
- Common issues and solutions

## Quick Reference

- **Common Issues** - Solutions to frequent problems *(coming soon)*
- **Claude Code Setup** - Configuration and testing *(various guides in this folder)*
- **MCP Testing** - Server validation and debugging *(various guides in this folder)*

## Debugging Guides

This folder contains various debugging documents created during development:
- MCP server debugging sessions
- Claude Code configuration guides
- Inspector tool usage
- Connection troubleshooting
- Error analysis and solutions

## Tools

**MCP Inspector**
```bash
npx @modelcontextprotocol/inspector
```

**Debug Scripts**
Located in `/test-data/scripts/`:
- `test-mcp-server.sh` - Validate MCP server setup
- Various testing utilities

## Common Issues

### MCP Server Connection

**Issue:** MCP server not connecting

**Solutions:**
1. Verify Apicurio Registry is running:
   ```bash
   curl http://localhost:8080/apis/registry/v3/system/info
   ```

2. Check MCP server configuration in Claude Code settings

3. Test MCP tools manually:
   ```bash
   npx @modelcontextprotocol/inspector
   ```

### Claude Code Integration

**Issue:** Tools not appearing in Claude Code

**Solutions:**
1. Verify MCP server is configured in Claude settings
2. Check server logs for errors
3. Restart Claude Code
4. Review debugging guides in this folder

## Development Process

This folder preserves our debugging history to help:
- Contributors troubleshoot similar issues
- Understand MCP integration patterns
- Learn from our development process
- Document solutions for common problems

## Related Documentation

- [AI Integration Overview](../README.md) - Main AI integration docs
- [Architecture](../architecture.md) - MCP architecture design
- [Getting Started](../getting-started.md) - Setup guide for users
- [Archive](../archive/README.md) - Historical debugging sessions

---

**Last Updated:** 2025-11-20
