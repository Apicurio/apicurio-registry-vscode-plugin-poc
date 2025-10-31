# AI-Powered Schema Development Workflow Architecture

**Goal**: Enable seamless workflow in VSCode: AI → Schema Design → Registry & Validate → Edit → Implement

**Date**: 2025-10-31
**Status**: MCP Server integration partially complete, implementation step missing

---

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [Proposed Workflow](#proposed-workflow)
3. [Detailed Step-by-Step](#detailed-step-by-step)
4. [Missing Pieces & Recommendations](#missing-pieces--recommendations)
5. [MCP Server Connection Issues](#mcp-server-connection-issues)
6. [Implementation Roadmap](#implementation-roadmap)

---

## Current Architecture

### 1. MCP Server (Java/Quarkus)

**Location**: `apicurio-registry/mcp/`

**Capabilities**:
- **Groups**: create, get, list, search, update
- **Artifacts**: create, get, list, search, update
- **Versions**: create, get, list, search, update
- **Configuration**: get, list, update (restricted)
- **System prompts**: `create_new_artifact_version` for guided workflows
- **Safe mode**: Prevents destructive operations by default

**Technology**:
- Built with Quarkus MCP server extension
- Communicates with Apicurio Registry 3.x via REST API
- Supports stdio-based MCP protocol for Claude Desktop/Code integration

**Configuration**:
```bash
# Environment variables
REGISTRY_URL=localhost:8080
APICURIO_MCP_SAFE_MODE=true
APICURIO_MCP_PAGING_LIMIT=200
APICURIO_MCP_PAGING_LIMIT_ERROR=true
```

### 2. VSCode Extension with MCP Integration

**Location**: `apicurio-vscode-plugin/`

**Current Features**:

#### MCP Management
- **MCPServerManager** (`src/services/mcpServerManager.ts`):
  - Auto-starts MCP server (Docker/JAR/External modes)
  - Health monitoring and auto-restart
  - Podman/Docker support

- **MCPConfigurationManager** (`src/services/mcpConfigurationManager.ts`):
  - Auto-configures Claude Code settings
  - Setup wizard for first-time users
  - Manual configuration fallback

- **MCP Status Bar** (`src/ui/mcpStatusBar.ts`):
  - Real-time server status display
  - Quick actions menu

#### Registry Integration
- **Registry Tree Provider**: Hierarchical browser (Groups → Artifacts → Versions)
- **File System Provider**: Edit schemas directly in VSCode with custom URI scheme (`apicurio://`)
- **Auto-save Manager**: Debounced auto-save to draft versions
- **CRUD Commands**: Full create/read/update/delete operations

#### Schema Editing
- Open artifacts/versions in VSCode editor
- Draft version support
- Auto-save with configurable intervals
- Syntax highlighting (via VSCode language detection)
- Download/upload capabilities

---

## Proposed Workflow

### Complete AI-Powered Development Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. AI-Assisted Schema Design                  │
│  User: "Create OpenAPI schema for user management API"          │
│  Claude Code → MCP Server → Apicurio Registry                   │
│  ✅ WORKING                                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    2. Registry & Validate                        │
│  MCP Server validates syntax                                     │
│  Registry validates compatibility rules                          │
│  ✅ PARTIALLY WORKING (automatic validation)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    3. Edit Schema (if needed)                    │
│  Browse registry in VSCode tree view                             │
│  Right-click → "Open Artifact" or "Create Draft Version"        │
│  Edit with auto-save to registry                                │
│  ✅ WORKING                                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    4. Implement API Logic                        │
│  Right-click → "Generate API Implementation"                    │
│  Claude Code generates implementation code                       │
│  ⚠️  MISSING - NEEDS IMPLEMENTATION                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Step-by-Step

### Step 1: AI-Assisted Schema Design ✅

**Status**: Already working!

**User Experience**:
1. User opens Claude Code chat in VSCode
2. User asks: *"Create an OpenAPI schema for a user management API with CRUD operations for users with fields: id, name, email, role"*
3. Claude Code (via MCP) automatically:
   - Generates the OpenAPI schema using AI
   - Creates artifact: `create_artifact(groupId="default", artifactId="user-api", artifactType="OPENAPI")`
   - Uploads first version: `create_version(groupId="default", artifactId="user-api", content=<generated-schema>)`
4. Schema is now registered in Apicurio Registry

**Setup Required**:
```bash
# In VSCode Command Palette (Cmd+Shift+P)
> Apicurio MCP: Setup AI Features

# Or manually configure in settings.json
"claude-code.mcpServers": {
  "apicurio-registry": {
    "command": "podman",
    "args": [
      "run", "-i", "--rm",
      "-e", "REGISTRY_URL=http://host.containers.internal:8080",
      "-e", "APICURIO_MCP_SAFE_MODE=true",
      "-e", "APICURIO_MCP_PAGING_LIMIT=200",
      "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
    ]
  }
}
```

**Available MCP Tools**:
- `list_groups()` - List all registry groups
- `create_artifact(groupId, artifactId, artifactType, ...)` - Create new artifact
- `create_version(groupId, artifactId, content, ...)` - Upload schema version
- `search_artifacts(name, description, labels, ...)` - Find existing schemas
- System prompt: `create_new_artifact_version` - Guided workflow

### Step 2: Registry & Validate ✅

**Status**: Partially working (validation happens automatically)

**What Happens Automatically**:
- **Syntax Validation**: When a version is created via MCP, Apicurio Registry validates:
  - OpenAPI 2.0/3.0/3.1 syntax
  - AsyncAPI 2.x/3.x syntax
  - Avro schema syntax
  - Protobuf syntax
  - JSON Schema syntax
  - GraphQL SDL syntax
- **Compatibility Validation**: Based on configured rules (if enabled)
- **Error Reporting**: MCP returns detailed errors to Claude if validation fails

**What Could Be Improved**:
- Explicit `validate_artifact()` MCP tool for on-demand validation
- `check_compatibility()` tool for pre-flight checks
- `get_validation_errors()` for detailed error analysis

### Step 3: Edit Schema ✅

**Status**: Already working!

**User Experience**:
1. User opens VSCode sidebar → "Apicurio Registry" view
2. User navigates tree: `default` group → `user-api` artifact → version `1`
3. User right-clicks:
   - **"Open Version"** - Opens read-only view
   - **"Create Draft Version"** - Creates editable draft
4. Schema opens in VSCode editor with:
   - Full syntax highlighting (JSON/YAML)
   - Auto-save to registry (configurable interval, default 2000ms)
   - Save on focus loss
   - Standard VSCode editing features
5. When done editing:
   - Right-click draft → "Finalize Draft" - Publishes as new version
   - Or "Discard Draft" - Cancels changes

**Configuration**:
```json
{
  "apicurioRegistry.autoSave.enabled": true,
  "apicurioRegistry.autoSave.interval": 2000,
  "apicurioRegistry.autoSave.saveOnFocusLoss": true
}
```

**Available Commands**:
- `apicurioRegistry.openArtifact` - Open latest version
- `apicurioRegistry.openVersion` - Open specific version
- `apicurioRegistry.createDraftVersion` - Create editable draft
- `apicurioRegistry.finalizeDraft` - Publish draft as version
- `apicurioRegistry.discardDraft` - Delete draft
- `apicurioRegistry.editDraftMetadata` - Edit name/description/labels

### Step 4: Implement API Logic ⚠️

**Status**: MISSING - This is the gap!

**Proposed Solutions**:

#### **Option A: MCP Tool for Code Generation** (Recommended for MCP-first approach)

Add new MCP tools to `apicurio-registry/mcp/`:

```java
@Tool(description = "Get the full content of an artifact version for code generation")
String get_artifact_content(
    @ToolArg(description = "Group ID") String groupId,
    @ToolArg(description = "Artifact ID") String artifactId,
    @ToolArg(description = "Version (optional, defaults to latest)") String version
) {
    // Returns the complete schema content
}

@Tool(description = "Generate API implementation code from an OpenAPI/AsyncAPI schema")
String generate_api_implementation(
    @ToolArg(description = "Group ID") String groupId,
    @ToolArg(description = "Artifact ID") String artifactId,
    @ToolArg(description = "Version") String version,
    @ToolArg(description = "Target language") String language,
    @ToolArg(description = "Framework") String framework
) {
    // 1. Fetch schema from registry
    // 2. Return schema + instructions for Claude to generate code
    // 3. Or integrate OpenAPI Generator directly
}
```

**Add System Prompts**:
- `implement_api_from_openapi` - Guide Claude to generate server code
- `implement_client_from_openapi` - Generate client SDKs
- `generate_test_cases` - Create API test suite

#### **Option B: VSCode Command + Claude Integration** (Recommended for UX)

Add to `apicurio-vscode-plugin/src/commands/`:

```typescript
// File: src/commands/generateImplementationCommand.ts

export async function generateImplementationCommand(
    registryService: RegistryService,
    node: ArtifactNode | VersionNode
) {
    // 1. Extract groupId, artifactId, version from node
    const { groupId, artifactId, version } = extractNodeInfo(node);

    // 2. Fetch schema content from registry
    const content = await registryService.getArtifactContent(groupId, artifactId, version);
    const metadata = await registryService.getVersionMetadata(groupId, artifactId, version);

    // 3. Ask user for preferences
    const language = await vscode.window.showQuickPick(
        ['Java (Spring Boot)', 'Java (Quarkus)', 'TypeScript (Express)', 'Python (FastAPI)', 'Go (Gin)'],
        { placeHolder: 'Select target language and framework' }
    );

    // 4. Create temporary file with schema
    const schemaUri = vscode.Uri.parse(`apicurio://${groupId}/${artifactId}/${version}`);

    // 5. Open Claude Code chat with context
    await vscode.commands.executeCommand('claude-code.newChat');

    // 6. Send prompt to Claude Code
    const prompt = `I have an ${metadata.type} schema for "${metadata.name}".
Please generate a complete ${language} implementation with:
- All endpoints/operations defined in the schema
- Request/response models
- Basic validation
- Error handling
- README with setup instructions

The schema is available at: ${schemaUri}`;

    // Note: Currently no public API to send message to Claude Code
    // User would paste this or we show it in a notification
    vscode.window.showInformationMessage(prompt, 'Copy Prompt').then(action => {
        if (action === 'Copy Prompt') {
            vscode.env.clipboard.writeText(prompt);
        }
    });
}
```

Register command in `extension.ts`:
```typescript
const generateImplementation = vscode.commands.registerCommand(
    'apicurioRegistry.generateImplementation',
    async (node) => {
        await generateImplementationCommand(registryService, node);
    }
);
```

#### **Option C: Hybrid Approach** (BEST - Recommended)

Combine both approaches:

1. **Add MCP tool** `get_artifact_content()` to fetch full schema
2. **Add VSCode command** "Generate API Implementation" that:
   - Fetches schema via Registry Service
   - Creates a new chat in Claude Code (if API available)
   - OR copies a pre-formatted prompt with schema context
   - Claude uses `get_artifact_content()` MCP tool + AI to generate implementation
3. **Add system prompt** in MCP server to guide Claude:

```java
// In apicurio-registry/mcp/src/main/java/io/apicurio/registry/mcp/servers/MCPPrompts.java

@Prompt(name = "implement_api_from_schema", description = "Generate API implementation from a schema")
public String implementApiFromSchema(
    @PromptArg(description = "Group ID") String groupId,
    @PromptArg(description = "Artifact ID") String artifactId,
    @PromptArg(description = "Target language and framework") String target
) {
    return """
You are an expert API developer. Your task is to generate a complete, production-ready API implementation from the schema.

Schema Location: %s/%s (use get_artifact_content to fetch it)
Target: %s

Steps:
1. Fetch the schema content using get_artifact_content(%s, %s)
2. Analyze the schema to understand all endpoints, models, and operations
3. Generate implementation code with:
   - All endpoints/routes defined in the schema
   - Request/response DTOs/models with validation
   - Error handling and proper HTTP status codes
   - OpenAPI/AsyncAPI documentation comments
   - Basic business logic placeholders
   - README with setup and run instructions
   - Unit tests for main endpoints

Best Practices:
- Follow the target framework's conventions
- Use dependency injection where appropriate
- Implement proper error handling
- Add input validation
- Include logging
- Generate clean, maintainable code

Please provide the complete implementation.
""".formatted(groupId, artifactId, target, groupId, artifactId);
}
```

**User Experience**:
1. User right-clicks artifact in tree view → "Generate API Implementation"
2. VSCode shows quick pick: "Select language: Java (Spring Boot), TypeScript (Express), ..."
3. VSCode opens Claude Code with pre-filled prompt + system prompt context
4. Claude fetches schema via `get_artifact_content()` MCP tool
5. Claude generates complete implementation code
6. User reviews and saves to workspace

---

## Missing Pieces & Recommendations

### 1. Add MCP Tools for Implementation (HIGH PRIORITY)

**New tools to add to `apicurio-registry/mcp/`**:

| Tool | Description | Priority |
|------|-------------|----------|
| `get_artifact_content(groupId, artifactId, version?)` | Fetch full schema content | **HIGH** |
| `get_version_metadata(groupId, artifactId, version)` | Get version details | **HIGH** |
| `validate_artifact(groupId, artifactId, version)` | Explicit validation | MEDIUM |
| `compare_versions(groupId, artifactId, v1, v2)` | Diff two versions | MEDIUM |
| `get_artifact_references(groupId, artifactId)` | Find schema dependencies | LOW |

**Why `get_artifact_content` is critical**:
- Currently, MCP tools only return metadata, not content
- Claude needs the actual schema to generate implementation code
- Without this, Claude can't see OpenAPI paths, models, etc.

**Implementation** (add to `ArtifactsMCPServer.java`):
```java
@Tool(description = """
    Get the complete content of an artifact version. \
    Returns the full schema document (OpenAPI, AsyncAPI, Avro, etc.) \
    which can be used for code generation, analysis, or documentation.""")
String get_artifact_content(
    @ToolArg(description = GROUP_ID) String groupId,
    @ToolArg(description = ARTIFACT_ID) String artifactId,
    @ToolArg(description = VERSION, required = false) String version
) {
    return handleError(() -> service.getArtifactContent(
        groupId,
        artifactId,
        version != null ? version : "latest"
    ));
}
```

### 2. Add System Prompts (MEDIUM PRIORITY)

**New prompts to add to `MCPPrompts.java`**:

| Prompt | Description |
|--------|-------------|
| `implement_api_from_openapi` | Generate REST API server implementation |
| `implement_client_from_openapi` | Generate API client/SDK |
| `implement_asyncapi_consumer` | Generate event consumer |
| `implement_asyncapi_producer` | Generate event producer |
| `generate_test_cases` | Generate API test suite |
| `generate_documentation` | Generate API documentation from schema |

### 3. Add VSCode Commands (MEDIUM PRIORITY)

**New commands to add to extension**:

| Command | Menu Location | Function |
|---------|---------------|----------|
| `apicurioRegistry.generateImplementation` | Right-click artifact | Open implementation wizard |
| `apicurioRegistry.generateClient` | Right-click artifact | Generate client SDK |
| `apicurioRegistry.generateTests` | Right-click artifact | Generate test cases |
| `apicurioRegistry.compareVersions` | Right-click version | Show diff between versions |
| `apicurioRegistry.validateArtifact` | Right-click artifact/version | Run explicit validation |

**Add to `package.json` commands**:
```json
{
  "command": "apicurioRegistry.generateImplementation",
  "title": "Generate API Implementation",
  "category": "Apicurio Registry",
  "icon": "$(code)"
},
{
  "command": "apicurioRegistry.generateClient",
  "title": "Generate Client SDK",
  "category": "Apicurio Registry"
},
{
  "command": "apicurioRegistry.generateTests",
  "title": "Generate Test Cases",
  "category": "Apicurio Registry"
}
```

### 4. Enhanced Claude Code Integration (LOW PRIORITY)

**Nice-to-have features**:
- Direct API to send messages to Claude Code chat (if/when available)
- Pre-configured chat templates for common tasks
- Context-aware prompts based on artifact type
- Automatic workspace setup after code generation

### 5. Code Generator Integration (OPTIONAL)

**Alternative to AI generation**:
- Integrate OpenAPI Generator directly in MCP server
- Integrate AsyncAPI Generator
- Offer choice: "AI Generation" vs "Template Generation"

**Pros**:
- Faster generation
- Consistent output
- No AI token cost

**Cons**:
- Less flexible
- Template-based (not customizable)
- Limited to supported generators

**Recommendation**: Start with AI generation (more flexible), add template generators later as optimization.

---

## MCP Server Connection Issues

### Problem: MCP Server Not Connecting

**Common Causes**:

#### 1. **Claude Code Configuration Not Set**

**Symptoms**:
- MCP tools not available in Claude Code
- No "Apicurio Registry" in MCP server list
- Claude responds: "I don't have access to Apicurio Registry"

**Solution**:
```bash
# In VSCode Command Palette
> Apicurio MCP: Setup AI Features

# Follow wizard to auto-configure Claude Code
# Or manually add to ~/.config/Code/User/globalStorage/anthropic.claude-code/settings.json
```

**Manual Configuration**:
```json
{
  "mcpServers": {
    "apicurio-registry": {
      "command": "podman",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e", "REGISTRY_URL=http://host.containers.internal:8080",
        "-e", "APICURIO_MCP_SAFE_MODE=true",
        "-e", "APICURIO_MCP_PAGING_LIMIT=200",
        "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
      ]
    }
  }
}
```

**Important**:
- Use `host.containers.internal` instead of `localhost` for Registry URL
- This allows the containerized MCP server to reach the host machine
- Only needed when MCP server runs in Docker/Podman

#### 2. **Registry URL Incorrect**

**Symptoms**:
- MCP server starts but tools fail with connection errors
- Health check fails: `ECONNREFUSED localhost:8080`

**Solution**:
```bash
# Check Registry is running
curl http://localhost:8080/apis/registry/v3/system/info

# If using Docker MCP server, use host.containers.internal
REGISTRY_URL=http://host.containers.internal:8080

# If using JAR MCP server, use localhost
REGISTRY_URL=http://localhost:8080
```

**Docker/Podman Networking**:
```bash
# Option 1: Use host networking (Linux only)
podman run -i --rm --network=host \
  -e REGISTRY_URL=http://localhost:8080 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# Option 2: Use host.containers.internal (Mac/Windows)
podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

#### 3. **MCP Server Not Starting**

**Symptoms**:
- VSCode extension shows "MCP Server: Error"
- Red status bar indicator
- No Docker/Podman container running

**Debugging Steps**:

**Check 1: Docker/Podman installed**
```bash
podman version
# Or
docker version

# If not installed:
# Mac: brew install podman-desktop
# Linux: sudo dnf install podman
# Windows: Install Docker Desktop
```

**Check 2: Container starts manually**
```bash
# Test manual start
podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# Should show: "Listening on stdin for MCP messages..."
# Ctrl+C to stop

# Check if image needs pulling
podman pull quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Check 3: VSCode Extension Logs**
```bash
# Open VSCode Developer Tools
# Help → Toggle Developer Tools → Console tab
# Look for errors from apicurio-registry extension
```

**Check 4: MCP Server Logs**
```bash
# Enable file logging in Claude Code config
{
  "mcpServers": {
    "apicurio-registry": {
      "command": "podman",
      "args": [
        "run", "-i", "--rm",
        "-e", "REGISTRY_URL=http://host.containers.internal:8080",
        "-e", "QUARKUS_LOG_LEVEL=DEBUG",
        "-e", "QUARKUS_LOG_FILE_ENABLE=true",
        "-e", "QUARKUS_LOG_FILE_PATH=/tmp/mcp-server.log",
        "-v", "/tmp:/tmp",
        "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
      ]
    }
  }
}

# Check logs
tail -f /tmp/mcp-server.log
```

#### 4. **Claude Code Not Restarting MCP Server**

**Symptoms**:
- Changed MCP configuration but tools not updated
- Old version of MCP server still running

**Solution**:
```bash
# Restart Claude Code completely
# VSCode: Cmd+Q (quit) then reopen
# OR reload window: Cmd+Shift+P → "Reload Window"

# Check running containers
podman ps
# If stale container exists:
podman stop <container-id>
```

#### 5. **Permission Issues**

**Symptoms**:
- VSCode extension can't spawn podman/docker process
- Error: "EACCES: permission denied"

**Solution**:
```bash
# Check podman socket permissions (Linux)
systemctl --user status podman.socket

# Add user to docker group (if using Docker)
sudo usermod -aG docker $USER
# Log out and back in

# Or use rootless podman (recommended)
podman system migrate
```

### Verification Checklist

After fixing issues, verify MCP connection:

**1. VSCode Extension Status**:
- [ ] Status bar shows "MCP Server: Running" (green)
- [ ] Click status bar → "MCP Server Status" shows healthy

**2. Claude Code Status**:
- [ ] Open Claude Code chat
- [ ] Click tools icon (hammer) in chat input
- [ ] Should see "Apicurio Registry" server listed
- [ ] Expand to see available tools: `list_groups`, `create_artifact`, etc.

**3. Test MCP Functionality**:
```
Claude Code Chat:
> List all groups in my Apicurio Registry

Expected: Claude uses list_groups() tool and returns results
```

**4. Full Integration Test**:
```
Claude Code Chat:
> Create a new OpenAPI 3.0 schema for a "pet-store" API in the "examples" group with:
  - GET /pets - list all pets
  - POST /pets - create a pet
  - GET /pets/{id} - get a pet by ID

Expected:
- Claude creates artifact using create_artifact()
- Claude generates OpenAPI schema
- Claude creates version using create_version()
- Schema appears in VSCode Apicurio Registry tree view
```

### Advanced Debugging

**Enable MCP Protocol Debugging**:

**Option 1: Intercept stdio**
```bash
# Create wrapper script: /tmp/mcp-debug.sh
#!/bin/bash
tee /tmp/mcp-stdin.log | podman run -i --rm \
  -e REGISTRY_URL=http://host.containers.internal:8080 \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot \
  | tee /tmp/mcp-stdout.log

# Make executable
chmod +x /tmp/mcp-debug.sh

# Use in Claude Code config
{
  "mcpServers": {
    "apicurio-registry": {
      "command": "/tmp/mcp-debug.sh",
      "args": []
    }
  }
}

# Tail logs to see MCP messages
tail -f /tmp/mcp-stdin.log /tmp/mcp-stdout.log
```

**Option 2: Use JAR mode for easier debugging**
```bash
# Build MCP server locally
cd apicurio-registry/mcp
mvn clean install -DskipTests

# Run with debugging
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
  -Dregistry.url=http://localhost:8080 \
  -jar target/apicurio-registry-mcp-server-3.0.10-SNAPSHOT-runner.jar

# Configure Claude Code to use JAR
{
  "mcpServers": {
    "apicurio-registry": {
      "command": "java",
      "args": [
        "-jar",
        "<PROJECT_ROOT>/apicurio-registry/mcp/target/apicurio-registry-mcp-server-3.0.10-SNAPSHOT-runner.jar",
        "-Dregistry.url=http://localhost:8080"
      ]
    }
  }
}
```

**Option 3: Test MCP server directly**
```bash
# Send raw MCP initialize message
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | \
  podman run -i --rm \
    -e REGISTRY_URL=http://host.containers.internal:8080 \
    quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot

# Expected: JSON-RPC response with server capabilities and tools list
```

---

## Implementation Roadmap

### Phase 1: Complete Basic MCP Integration (1-2 days)

**Goal**: Ensure MCP server connection works reliably

- [x] MCP server implementation (already done)
- [x] VSCode extension MCP management (already done)
- [ ] Fix MCP server connection issues (see troubleshooting section)
- [ ] Add `get_artifact_content()` MCP tool ⭐ **CRITICAL**
- [ ] Test end-to-end: Claude Code → MCP → Registry
- [ ] Documentation for users on setup

**Deliverables**:
- Working MCP connection
- Users can ask Claude to create/list/search artifacts
- Claude can fetch full schema content

### Phase 2: Add Implementation Generation (2-3 days)

**Goal**: Enable AI-powered code generation from schemas

- [ ] Add `get_artifact_content()` tool to MCP server
- [ ] Add system prompt: `implement_api_from_schema`
- [ ] Add VSCode command: "Generate API Implementation"
- [ ] Create implementation workflow UI
- [ ] Test with OpenAPI, AsyncAPI schemas

**Deliverables**:
- Right-click artifact → "Generate Implementation"
- Claude generates complete API code
- Code saved to workspace

### Phase 3: Enhanced Validation & Analysis (1-2 days)

**Goal**: Better schema validation and comparison

- [ ] Add `validate_artifact()` MCP tool
- [ ] Add `compare_versions()` MCP tool
- [ ] Add validation UI in VSCode
- [ ] Add diff viewer for version comparison

**Deliverables**:
- Explicit validation command
- Visual diff between schema versions
- Better error reporting

### Phase 4: Advanced Features (3-5 days)

**Goal**: Complete the developer experience

- [ ] Add client SDK generation
- [ ] Add test case generation
- [ ] Add documentation generation
- [ ] Integration with OpenAPI/AsyncAPI generators (optional)
- [ ] Schema linting and best practices analysis
- [ ] Workspace templates for generated code

**Deliverables**:
- Complete toolkit for schema-driven development
- One-click generation of server, client, tests, docs
- Production-ready code output

### Phase 5: Polish & Documentation (2-3 days)

**Goal**: Make it production-ready

- [ ] Comprehensive user documentation
- [ ] Video tutorials / GIFs
- [ ] Error handling improvements
- [ ] Performance optimization
- [ ] Unit tests for VSCode extension
- [ ] Integration tests for MCP server

**Deliverables**:
- Published documentation
- Example workflows
- Stable, tested codebase

---

## Quick Start Guide

### For Users

**1. Prerequisites**:
- VSCode installed
- Claude Code extension installed
- Docker/Podman installed
- Apicurio Registry 3.x running (http://localhost:8080)

**2. Install Apicurio Registry Extension**:
```bash
# Install from VSIX or marketplace
code --install-extension apicurio-registry-<version>.vsix
```

**3. Configure Registry Connection**:
```bash
# VSCode Settings → Apicurio Registry → Connections
# Add connection:
{
  "name": "Local Registry",
  "url": "http://localhost:8080",
  "authType": "none"
}
```

**4. Setup AI Features**:
```bash
# Command Palette (Cmd+Shift+P)
> Apicurio MCP: Setup AI Features

# Follow wizard:
# 1. Select "Docker" server type
# 2. Configure Claude Code → Yes
# 3. Done!
```

**5. Test Integration**:
```bash
# Open Claude Code chat
# Ask: "List all groups in my Apicurio Registry"
# Should see Claude using MCP tools and returning results
```

**6. Create Your First Schema**:
```bash
# In Claude Code chat:
> Create an OpenAPI 3.0 schema for a simple TODO API in the "my-apis" group

# Claude will:
# - Create the artifact
# - Generate the schema
# - Upload to registry
```

**7. Edit & Implement**:
```bash
# 1. Browse to artifact in VSCode sidebar
# 2. Right-click → "Create Draft Version"
# 3. Edit schema
# 4. Auto-save happens automatically
# 5. Right-click → "Finalize Draft"
# 6. Right-click → "Generate API Implementation" (once Phase 2 is complete)
```

### For Developers

**1. Clone & Build**:
```bash
cd <PROJECT_ROOT>

# Build MCP server
cd apicurio-registry
./mvnw clean install -pl mcp -am -DskipTests

# Build VSCode extension
cd ../apicurio-vscode-plugin
npm install
npm run compile
```

**2. Run in Development**:
```bash
# Terminal 1: Start Registry
cd apicurio-registry/app
../mvnw quarkus:dev

# Terminal 2: Start MCP server (for testing)
cd apicurio-registry/mcp
java -jar target/apicurio-registry-mcp-server-*-runner.jar

# Terminal 3: Run VSCode extension
cd apicurio-vscode-plugin
# Press F5 in VSCode to launch Extension Development Host
```

**3. Test Changes**:
```bash
# MCP server changes:
mvn clean install -DskipTests
# Restart Claude Code

# VSCode extension changes:
npm run compile
# Reload VSCode window (Cmd+R in Extension Development Host)
```

---

## References

### Documentation
- [MCP Protocol Specification](https://modelcontextprotocol.io/introduction)
- [Quarkus MCP Server Extension](https://docs.quarkiverse.io/quarkus-mcp-server/dev/index.html)
- [Apicurio Registry Documentation](https://www.apic.io/registry/)
- [VSCode Extension API](https://code.visualstudio.com/api)

### Code Locations
- MCP Server: `apicurio-registry/mcp/`
- VSCode Extension: `apicurio-vscode-plugin/`
- MCP Tools: `apicurio-registry/mcp/src/main/java/io/apicurio/registry/mcp/servers/`
- VSCode Commands: `apicurio-vscode-plugin/src/commands/`

### Key Files
- MCP Server README: `apicurio-registry/mcp/README.md`
- Extension Entry Point: `apicurio-vscode-plugin/src/extension.ts`
- MCP Configuration: `apicurio-vscode-plugin/src/services/mcpConfigurationManager.ts`
- Project Instructions: `apicurio/CLAUDE.md`

---

## Contact & Support

**Issues**:
- MCP Server: [Apicurio Registry GitHub Issues](https://github.com/Apicurio/apicurio-registry/issues)
- VSCode Extension: [Apicurio VSCode Plugin GitHub Issues](https://github.com/Apicurio/apicurio-vscode-plugin/issues)

**Community**:
- [Apicurio Community](https://www.apic.io/community/)
- [Apicurio Slack](https://apicurio.slack.com/)
