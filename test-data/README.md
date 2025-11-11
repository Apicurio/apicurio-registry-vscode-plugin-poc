# Test Data

This directory contains sample artifacts and utility scripts for testing the Apicurio VSCode Extension.

## Directory Structure

```
/test-data/
├── artifacts/         # Sample artifact files for testing
└── scripts/          # Utility scripts for test setup
```

## Sample Artifacts (`/artifacts/`)

### OpenAPI Specifications

- **sample-openapi.yaml** - Simple OpenAPI 3.0 example
- **orders-api-v1.yaml** - Orders API specification (v1)
- **products-api-v1.yaml** - Products API specification (v1)
- **users-api-v1.yaml** - Users API specification (v1)
- **users-api-v2.yaml** - Users API specification (v2)

### Avro Schema

- **sample-avro.avsc** - Sample Avro schema definition

### JSON Schema

- **sample-json-schema.json** - Sample JSON Schema definition

## Utility Scripts (`/scripts/`)

### test-setup.sh

**Purpose:** Complete test environment setup for new contributors.

**Usage:**

```bash
./test-data/scripts/test-setup.sh
```

**What it does:**
1. Installs npm dependencies
2. Compiles TypeScript
3. Runs linter
4. Checks for/starts Docker registry (interactive)
5. Creates VSCode settings with registry connection
6. Optionally adds sample data to registry

**Interactive prompts:**
- Start registry with Docker? (y/n)
- Add sample data to registry? (y/n)
- Open project in VSCode? (y/n)

**Requirements:**
- Node.js installed
- Docker installed (optional, for registry)
- VSCode installed (optional, for auto-open)

**Best for:** First-time setup, onboarding new contributors

---

### populate-registry.js / populate-registry.sh

**Purpose:** Quickly populate registry with basic sample artifacts.

**Usage:**

```bash
# Using Node.js directly
node test-data/scripts/populate-registry.js

# Using shell wrapper
./test-data/scripts/populate-registry.sh
```

**What it does:**
- Connects to local Apicurio Registry (http://localhost:8080)
- Creates test groups
- Uploads sample artifacts from `/artifacts/` directory
- Reports success/failure for each artifact

**Requirements:**
- Apicurio Registry running on http://localhost:8080
- Node.js installed
- axios package installed (`npm install`)

**Best for:** Quick registry population for manual testing

---

### test-icons.sh

**Purpose:** Comprehensive icon testing with all 9 artifact types in different states.

**Usage:**

```bash
./test-data/scripts/test-icons.sh
```

**What it does:**
- Creates test group `icon-test-group`
- Uploads 9 artifacts (one for each type):
  1. OPENAPI - REST API (enabled)
  2. ASYNCAPI - Event API (enabled)
  3. AVRO - Data schema (enabled)
  4. PROTOBUF - Protocol Buffers (deprecated)
  5. JSON - JSON Schema (enabled)
  6. GRAPHQL - GraphQL Schema (enabled)
  7. KCONNECT - Kafka Connect (disabled)
  8. WSDL - Web Services (deprecated)
  9. XSD - XML Schema (enabled)
- Tests different states: ENABLED, DEPRECATED, DISABLED

**Requirements:**
- Apicurio Registry running on http://localhost:8080
- curl installed

**Best for:** Testing icon rendering, state indicators, artifact type displays

---

### test-search.sh

**Purpose:** Automated testing for search feature with coverage reporting.

**Usage:**

```bash
./test-data/scripts/test-search.sh
```

**What it does:**
1. Installs dependencies
2. Compiles TypeScript
3. Runs search-related tests
4. Generates coverage report
5. Creates TEST_REPORT.md

**Output files:**
- `test-output.log` - Detailed test output
- `TEST_REPORT.md` - Formatted test report
- `coverage/` - Coverage report directory

**Requirements:**
- Node.js installed
- npm dependencies installed

**Best for:** CI/CD pipelines, automated testing, coverage analysis

---

### test-mcp-server.sh

**Purpose:** Tests MCP (Model Context Protocol) server configuration for Claude Code integration.

**Usage:**

```bash
./test-data/scripts/test-mcp-server.sh
```

**What it tests:**
- Docker/Podman installation
- MCP server container status
- Container configuration
- Registry connectivity
- MCP endpoint health

**Requirements:**
- Docker or Podman installed
- MCP server container configured

**Best for:** Validating MCP/AI integration setup

---

### test-mcp-fixed.sh

**Purpose:** Quick test to verify MCP server stdout/stderr fix for Claude Code compatibility.

**Usage:**

```bash
./test-data/scripts/test-mcp-fixed.sh
```

**What it tests:**
- MCP server responds with clean JSON on stdout (no logs mixed in)
- Logs are properly redirected to stderr
- QUARKUS_LOG_CONSOLE_STDERR=true is working correctly

**How it works:**
- Sends an MCP initialize request to the server
- Captures only stdout output (filters out stderr with `2>/dev/null`)
- Verifies output is pure JSON-RPC with no log pollution

**Expected output:**
```json
{"jsonrpc":"2.0","id":1,"result":{...}}
```

**Requirements:**
- Docker or Podman installed
- Apicurio Registry running on http://localhost:8080

**Best for:** Debugging MCP communication issues, verifying fix is applied

---

## Adding New Test Artifacts

When adding new sample artifacts:

1. Add the file to `/artifacts/` directory
2. Use descriptive names (e.g., `artifact-type-version.ext`)
3. Update `populate-registry.js` if needed to include the new artifact
4. Document the artifact purpose in this README

## Modifying Test Scripts

When modifying utility scripts:

1. Ensure scripts are executable (`chmod +x script.sh`)
2. Test scripts locally before committing
3. Update script documentation in this README
4. Add error handling and clear output messages

## Registry Connection

All scripts default to connecting to:

```
http://localhost:8080
```

To use a different registry URL, modify the scripts or set environment variables as documented in each script.

## Documentation

For testing documentation and guides, see:

```
/docs/testing/
├── guides/         # Testing guides
└── task-tests/    # Task-specific test guides
```

---

**Last Updated:** 2025-11-11
