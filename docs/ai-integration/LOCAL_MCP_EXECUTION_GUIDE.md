# Local MCP Server Execution Guide

**Date**: November 13, 2025
**Purpose**: Run Apicurio Registry MCP Server locally (JAR/jbang) instead of Docker/Podman

---

## Why Switch to Local Execution?

**Benefits:**
- ✅ Access Quarkus Dev UI for monitoring
- ✅ Easier debugging with direct log access
- ✅ Simpler environment variable handling
- ✅ Faster startup (no container overhead)
- ✅ Hot reload in dev mode

**Note:** This will NOT fix the Claude Code Zod validation bug, but it will make development and debugging much easier.

---

## Prerequisites

### 1. Install Java 17+

**Check if Java is installed:**
```bash
java -version
```

**If not installed, install Java 17 or later:**

**Option A: Using Homebrew (recommended for macOS)**
```bash
brew install openjdk@17

# Add to PATH (add to ~/.zshrc or ~/.bash_profile)
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"

# Reload shell
source ~/.zshrc
```

**Option B: Using SDKMAN**
```bash
# Install SDKMAN
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# Install Java
sdk install java 17.0.9-tem
sdk use java 17.0.9-tem
```

**Option C: Download from Oracle/Adoptium**
- Download from: https://adoptium.net/
- Install the PKG installer
- Set JAVA_HOME in your shell profile

**Verify installation:**
```bash
java -version
# Should show: openjdk version "17.x.x" or similar
```

### 2. Verify Maven is Available

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry
./mvnw --version
```

Should show Maven and Java versions.

---

## Build the MCP Server

### From the Registry Root

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry
./mvnw clean install -pl mcp -am -DskipTests
```

**What this does:**
- `-pl mcp` - Build the mcp module
- `-am` - Also make (build) dependencies
- `-DskipTests` - Skip tests for faster build

**Expected output:**
```
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

**JAR location:**
```
/Users/astranier/Documents/dev/apicurio/apicurio-registry/mcp/target/apicurio-registry-mcp-server-3.1.3-SNAPSHOT-runner.jar
```

---

## Option 1: Run with JAR (Production Mode)

### Basic Execution

```bash
java -jar \
  /Users/astranier/Documents/dev/apicurio/apicurio-registry/mcp/target/apicurio-registry-mcp-server-3.1.3-SNAPSHOT-runner.jar
```

### With Configuration

```bash
java \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=true \
  -Dapicurio.mcp.paging.limit=200 \
  -Dquarkus.log.console.stderr=true \
  -jar /Users/astranier/Documents/dev/apicurio/apicurio-registry/mcp/target/apicurio-registry-mcp-server-3.1.3-SNAPSHOT-runner.jar
```

### With File Logging (for debugging)

```bash
java \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=true \
  -Dquarkus.log.console.stderr=true \
  -Dquarkus.log.file.enable=true \
  -Dquarkus.log.file.path=/tmp/mcp-server.log \
  -Dquarkus.log.level=DEBUG \
  -jar /Users/astranier/Documents/dev/apicurio/apicurio-registry/mcp/target/apicurio-registry-mcp-server-3.1.3-SNAPSHOT-runner.jar
```

**Monitor logs:**
```bash
tail -f /tmp/mcp-server.log
```

---

## Option 2: Run with Quarkus Dev Mode (Development)

**Benefits:**
- ✅ Hot reload on code changes
- ✅ Access to Quarkus Dev UI at http://localhost:8080/q/dev
- ✅ Better debugging with live metrics
- ✅ Automatic rebuild on save

### Start in Dev Mode

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry/mcp
../mvnw quarkus:dev \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=true \
  -Dquarkus.log.console.stderr=true
```

### Access Dev UI

**Open in browser:**
```
http://localhost:8080/q/dev
```

**Dev UI features:**
- Configuration editor
- Log viewer
- Metrics
- Health checks
- Endpoint list
- MCP tools inspection

**Note:** The MCP server stdio transport conflicts with interactive Dev UI in the same terminal. You'll need to either:
1. Use file logging and monitor logs separately
2. Run Dev UI in a different mode
3. Access Dev UI before starting stdio communication

---

## Option 3: Run with jbang

**Install jbang:**
```bash
brew install jbangdev/tap/jbang
```

**Create jbang script** (optional - for convenience):

Create `run-mcp-server.java`:
```java
//usr/bin/env jbang "$0" "$@" ; exit $?
//DEPS io.quarkiverse.mcp:quarkus-mcp-server-stdio:1.0.0
//DEPS io.apicurio:apicurio-registry-mcp-server:3.1.3-SNAPSHOT

public class run_mcp_server {
    public static void main(String[] args) {
        io.quarkus.runtime.Quarkus.run(args);
    }
}
```

**Run:**
```bash
jbang run-mcp-server.java
```

**Note:** jbang approach may require additional configuration. The JAR approach is simpler and recommended.

---

## Update Claude Code Configuration

### Current Configuration (Docker/Podman)

```json
{
  "mcpServers": {
    "apicurio-registry": {
      "type": "stdio",
      "command": "podman",
      "args": [
        "run", "-i", "--rm",
        "-e", "REGISTRY_URL=http://host.containers.internal:8080",
        "-e", "APICURIO_MCP_SAFE_MODE=true",
        "-e", "APICURIO_MCP_PAGING_LIMIT=200",
        "-e", "QUARKUS_LOG_CONSOLE_STDERR=true",
        "quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot"
      ],
      "env": {}
    }
  }
}
```

### New Configuration (Local JAR)

**Edit:** `~/.claude.json` for project `/Users/astranier/Documents/dev/apicurio`

```json
{
  "mcpServers": {
    "apicurio-registry": {
      "type": "stdio",
      "command": "java",
      "args": [
        "-Dregistry.url=http://localhost:8080",
        "-Dapicurio.mcp.safe-mode=true",
        "-Dapicurio.mcp.paging.limit=200",
        "-Dquarkus.log.console.stderr=true",
        "-jar",
        "/Users/astranier/Documents/dev/apicurio/apicurio-registry/mcp/target/apicurio-registry-mcp-server-3.1.3-SNAPSHOT-runner.jar"
      ],
      "env": {}
    }
  }
}
```

**Key differences:**
- `command: "java"` instead of `"podman"`
- Properties use `-D` flags instead of `-e` flags
- Direct path to JAR file
- Use `localhost:8080` instead of `host.containers.internal:8080`

---

## Testing the Local Setup

### 1. Build the JAR

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry
./mvnw clean install -pl mcp -am -DskipTests
```

### 2. Test Standalone

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | \
java -Dquarkus.log.console.stderr=true -jar \
/Users/astranier/Documents/dev/apicurio/apicurio-registry/mcp/target/apicurio-registry-mcp-server-3.1.3-SNAPSHOT-runner.jar \
2>/tmp/mcp-test-stderr.log

# Should output JSON-RPC response
cat /tmp/mcp-test-stderr.log  # Check logs went to stderr
```

### 3. Update Claude Code Config

```bash
# Backup current config
cp ~/.claude.json ~/.claude.json.backup

# Edit ~/.claude.json manually or use:
claude mcp remove apicurio-registry

claude mcp add --transport stdio apicurio-registry -- java \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=true \
  -Dapicurio.mcp.paging.limit=200 \
  -Dquarkus.log.console.stderr=true \
  -jar /Users/astranier/Documents/dev/apicurio/apicurio-registry/mcp/target/apicurio-registry-mcp-server-3.1.3-SNAPSHOT-runner.jar
```

### 4. Test with Claude Code

```bash
cd /Users/astranier/Documents/dev/apicurio
claude mcp list
# Should show apicurio-registry with "java" command

# Test connection (will still hit the Zod bug, but at least we can see local logs)
claude
> use the list_groups MCP tool
```

---

## Debugging with Local Execution

### Enable Debug Logging

**Add to Java command:**
```
-Dquarkus.log.level=DEBUG \
-Dquarkus.log.file.enable=true \
-Dquarkus.log.file.path=/tmp/mcp-server-debug.log
```

**Monitor in real-time:**
```bash
tail -f /tmp/mcp-server-debug.log
```

### Access Quarkus Metrics

If running in dev mode, the Dev UI provides:

1. **Request metrics:** Count, duration, errors
2. **Registry client metrics:** API calls to Registry server
3. **Memory/CPU usage**
4. **Active connections**

### Compare Docker vs Local Logs

**Docker logs:**
```bash
podman logs <container-id>
```

**Local logs:**
```bash
cat /tmp/mcp-server-debug.log
```

**Key things to compare:**
- Startup time
- Response times
- Error patterns
- Log format (should be identical)

---

## Troubleshooting

### Java Not Found

**Error:**
```
Unable to locate a Java Runtime
```

**Solution:**
Install Java 17+ (see Prerequisites section)

### JAR Not Found

**Error:**
```
Error: Unable to access jarfile
```

**Solution:**
```bash
# Rebuild the MCP server
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry
./mvnw clean install -pl mcp -am -DskipTests

# Verify JAR exists
ls -lh mcp/target/*.jar
```

### Wrong Java Version

**Error:**
```
UnsupportedClassVersionError
```

**Solution:**
```bash
# Check Java version
java -version

# Should be 17 or higher
# If not, install correct version and update JAVA_HOME
```

### Registry Connection Failed

**Error in logs:**
```
Failed to connect to Apicurio Registry
```

**Solution:**
```bash
# Verify Registry is running
curl http://localhost:8080/apis/registry/v3/groups

# If using Docker, use localhost (NOT host.containers.internal)
-Dregistry.url=http://localhost:8080
```

### Zod Error Still Occurs

**Expected:** The Zod validation bug in Claude Code will still occur with local execution.

**But now you have:**
- ✅ Direct access to MCP server logs
- ✅ Ability to add debug logging
- ✅ Dev UI for monitoring
- ✅ Easier testing and iteration

**You can:**
1. Monitor exact request/response flow
2. Verify JSON-RPC protocol compliance
3. Measure response times
4. Test fixes locally before building containers

---

## Development Workflow

### Make Code Changes

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry/mcp

# Edit source files
code src/main/java/io/apicurio/registry/mcp/

# Option 1: Rebuild and test (prod mode)
../mvnw clean install -DskipTests
java -jar target/*.jar

# Option 2: Use dev mode (auto-reload)
../mvnw quarkus:dev
```

### Test Changes with Claude Code

```bash
# Rebuild
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry
./mvnw clean install -pl mcp -am -DskipTests

# Restart Claude Code to pick up new JAR
cd /Users/astranier/Documents/dev/apicurio
claude
> use the list_groups tool
```

### Monitor Performance

**In dev mode, access:**
```
http://localhost:8080/q/dev
```

**Check:**
- Request count and latency
- Memory usage
- Thread pools
- Registry API calls

---

## Next Steps

### 1. Install Java

```bash
brew install openjdk@17
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
```

### 2. Build MCP Server

```bash
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry
./mvnw clean install -pl mcp -am -DskipTests
```

### 3. Update Claude Code Config

Edit `~/.claude.json` to use `java -jar` instead of `podman run`

### 4. Test

```bash
cd /Users/astranier/Documents/dev/apicurio
claude mcp list
claude
> use list_groups tool
```

### 5. Monitor and Debug

Use file logging and tail -f to watch what's happening in real-time

---

## Summary

**Local execution advantages:**
- Direct log access
- Dev UI for monitoring
- Faster iteration
- Easier debugging
- No container complexity

**Will it fix the Claude Code bug?**
No - the Zod validation bug is in Claude Code itself.

**But you'll have:**
- Better visibility into what's happening
- Ability to verify MCP server behavior
- Tools to help debug and test
- Access to Quarkus Dev UI features

---

**Last Updated**: November 13, 2025 16:15
**Status**: Ready to implement
**Estimated Time**: 15-30 minutes (depending on Java installation)
