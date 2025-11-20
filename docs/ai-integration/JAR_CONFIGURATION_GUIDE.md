# JAR-Based MCP Server Configuration Guide

**Date**: 2025-11-20
**Status**: ✅ RECOMMENDED FOR DEVELOPMENT
**MCP Server**: JAR-based execution (requires Java 17+)
**Use Case**: When you want to run the MCP server without Docker/Podman

---

## Overview

The Apicurio Registry MCP Server can be run directly as a Java application using the JAR file. This mode is ideal for:

- **Development environments** where you're building the MCP server from source
- **Scenarios without Docker/Podman** (corporate restrictions, performance considerations)
- **Debugging** the MCP server with Java debugger tools
- **Custom Java configurations** (memory settings, debugging flags, etc.)

---

## Prerequisites

### 1. Java 17 or Higher

**Check your Java version:**
```bash
java -version
```

**Expected output:**
```
openjdk version "17.0.2" 2022-01-18
OpenJDK Runtime Environment (build 17.0.2+8)
OpenJDK 64-Bit Server VM (build 17.0.2+8, mixed mode)
```

**If Java 17+ is not installed:**

**macOS (Homebrew):**
```bash
brew install openjdk@17
```

**macOS (Manual):**
Download from [Adoptium](https://adoptium.net/)

**Linux (Ubuntu/Debian):**
```bash
sudo apt install openjdk-17-jdk
```

**Linux (RHEL/Fedora):**
```bash
sudo dnf install java-17-openjdk-devel
```

**Windows:**
Download from [Adoptium](https://adoptium.net/) or [Oracle](https://www.oracle.com/java/technologies/downloads/)

---

### 2. MCP Server JAR File

**Build from source:**
```bash
cd /path/to/apicurio-registry/mcp
./mvnw clean package
```

**JAR location after build:**
```
<APICURIO_REGISTRY_ROOT>/mcp/target/apicurio-registry-mcp-server-<VERSION>-runner.jar
```

Example:
```
~/projects/apicurio-registry/mcp/target/apicurio-registry-mcp-server-3.1.3-SNAPSHOT-runner.jar
```

**Or download from release artifacts** (when available)

---

### 3. Apicurio Registry Running

The MCP server needs to connect to a running Apicurio Registry instance:

```bash
# Verify Registry is running
curl http://localhost:8080/apis/registry/v3/system/info
```

---

## Configuration via VSCode Plugin

### Method 1: Setup Wizard (Recommended)

1. **Open Command Palette:** `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)

2. **Run:** `Apicurio Registry: Setup AI Features`

3. **Select Server Type:** Choose "JAR File"

4. **Java Validation:**
   - Plugin will auto-detect your Java installation
   - If Java 17+ is found, you'll see: `✓ Java 17 detected`
   - If not found, you'll be prompted to install or configure Java path

5. **Configure JAR Path:**
   - Option 1: **Browse** - Use file picker to select the JAR file
   - Option 2: **Manual Entry** - Type the full path to the JAR file

6. **Validation:**
   - Plugin will verify the JAR file exists
   - Plugin will check the file has `.jar` extension

7. **Generate Configuration:**
   - Plugin will generate the Claude Code CLI command
   - Command will be copied to clipboard

8. **Run Command:**
   - Paste and execute the command in your terminal
   - Verify with: `claude mcp list`

---

### Method 2: Manual Configuration

**Step 1: Configure Settings**

Open VSCode Settings (`Cmd+,` or `Ctrl+,`) and search for "Apicurio MCP":

```json
{
  "apicurioRegistry.mcp.enabled": true,
  "apicurioRegistry.mcp.serverType": "jar",
  "apicurioRegistry.mcp.jarPath": "<PATH_TO_JAR>/apicurio-registry-mcp-server-<VERSION>-runner.jar",
  "apicurioRegistry.mcp.javaPath": "" // Leave empty for auto-detection
}
```

**Example (macOS with Homebrew Java):**
```json
{
  "apicurioRegistry.mcp.enabled": true,
  "apicurioRegistry.mcp.serverType": "jar",
  "apicurioRegistry.mcp.jarPath": "~/projects/apicurio-registry/mcp/target/apicurio-registry-mcp-server-3.1.3-SNAPSHOT-runner.jar",
  "apicurioRegistry.mcp.javaPath": "/opt/homebrew/opt/openjdk@17/bin/java"
}
```

**Example (Linux):**
```json
{
  "apicurioRegistry.mcp.enabled": true,
  "apicurioRegistry.mcp.serverType": "jar",
  "apicurioRegistry.mcp.jarPath": "/opt/apicurio/apicurio-registry-mcp-server-3.1.3-runner.jar",
  "apicurioRegistry.mcp.javaPath": "/usr/lib/jvm/java-17-openjdk/bin/java"
}
```

**Step 2: Generate Command**

Run command: `Apicurio Registry: Generate Claude MCP Command`

**Step 3: Execute Command**

Copy the generated command and run in terminal.

---

## Claude Code CLI Configuration

### Standard Configuration

```bash
claude mcp add apicurio-registry -s local -- \
  java \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=false \
  -Dapicurio.mcp.paging.limit=200 \
  -Dquarkus.log.console.stderr=true \
  -jar <PATH_TO_JAR>/apicurio-registry-mcp-server-<VERSION>-runner.jar
```

**Example:**
```bash
claude mcp add apicurio-registry -s local -- \
  java \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=false \
  -Dapicurio.mcp.paging.limit=200 \
  -Dquarkus.log.console.stderr=true \
  -jar ~/projects/apicurio-registry/mcp/target/apicurio-registry-mcp-server-3.1.3-SNAPSHOT-runner.jar
```

### With Custom Java Path

If using a specific Java version (e.g., Homebrew-installed Java 17):

```bash
claude mcp add apicurio-registry -s local -- \
  /opt/homebrew/opt/openjdk@17/bin/java \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=false \
  -Dapicurio.mcp.paging.limit=200 \
  -Dquarkus.log.console.stderr=true \
  -jar /path/to/apicurio-registry-mcp-server-3.1.3-SNAPSHOT-runner.jar
```

---

## Configuration Options

### System Properties

All configuration is passed via Java system properties (`-D` flags):

#### registry.url
**Purpose:** URL of the Apicurio Registry instance

**Format:** `http://HOST:PORT` (without `/apis/registry/v3` - server adds this automatically)

**Examples:**
```bash
# Local development
-Dregistry.url=http://localhost:8080

# Remote registry
-Dregistry.url=https://registry.company.com

# Different port
-Dregistry.url=http://localhost:9090
```

**Important:** Do NOT include `/apis/registry/v3` path - the MCP server adds it automatically.

---

#### apicurio.mcp.safe-mode
**Purpose:** Controls whether destructive operations are allowed

**Values:**
- `false` - All operations allowed (recommended for development)
- `true` - Prevents delete operations

**Examples:**
```bash
# Development (full functionality)
-Dapicurio.mcp.safe-mode=false

# Production (read-only mode)
-Dapicurio.mcp.safe-mode=true
```

---

#### apicurio.mcp.paging.limit
**Purpose:** Maximum number of items returned per page

**Default:** 200

**Range:** 1-1000

**Examples:**
```bash
# Standard
-Dapicurio.mcp.paging.limit=200

# Small result sets (faster)
-Dapicurio.mcp.paging.limit=50

# Large result sets (more memory)
-Dapicurio.mcp.paging.limit=500
```

---

#### quarkus.log.console.stderr
**Purpose:** Send logs to stderr for MCP protocol compliance

**Value:** `true` (required for Claude Code compatibility)

**Why:** MCP protocol uses stdout for JSON-RPC messages, so logs must go to stderr

---

### Advanced Java Options

You can add additional JVM options for debugging, memory tuning, etc.:

#### Debug Mode

```bash
claude mcp add apicurio-registry -s local -- \
  java \
  -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=false \
  -Dquarkus.log.console.stderr=true \
  -jar /path/to/apicurio-registry-mcp-server.jar
```

Then attach your Java debugger to port 5005.

#### Memory Settings

```bash
claude mcp add apicurio-registry -s local -- \
  java \
  -Xmx512m \
  -Xms256m \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=false \
  -Dquarkus.log.console.stderr=true \
  -jar /path/to/apicurio-registry-mcp-server.jar
```

#### Logging Configuration

```bash
claude mcp add apicurio-registry -s local -- \
  java \
  -Dquarkus.log.level=DEBUG \
  -Dquarkus.log.console.stderr=true \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=false \
  -jar /path/to/apicurio-registry-mcp-server.jar
```

---

## Verification

### Step 1: Check Configuration

```bash
claude mcp get apicurio-registry
```

**Expected output:**
```
apicurio-registry:
  Scope: Local config (private to you in this project)
  Status: ✓ Connected
  Type: stdio
  Command: java
  Args: -Dregistry.url=http://localhost:8080 -jar /path/to/server.jar
```

### Step 2: List MCP Servers

```bash
claude mcp list
```

**Expected output:**
```
Checking MCP server health...

apicurio-registry: java -jar ... - ✓ Connected
```

### Step 3: Test in Claude Code

Start a new conversation and ask:
```
List my Apicurio Registry groups
```

Claude should connect to the MCP server and return your groups.

---

## Troubleshooting

### Issue: "Java command not found"

**Symptoms:**
- Error when running `java -version`
- MCP server fails to start

**Solution:**

1. **Verify Java installation:**
   ```bash
   which java
   java -version
   ```

2. **Set JAVA_HOME (if needed):**

   **macOS (Homebrew):**
   ```bash
   export JAVA_HOME=$(/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home)
   export PATH="$JAVA_HOME/bin:$PATH"
   ```

   **Linux:**
   ```bash
   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
   export PATH="$JAVA_HOME/bin:$PATH"
   ```

3. **Use full Java path in configuration:**
   ```bash
   claude mcp add apicurio-registry -s local -- \
     /opt/homebrew/opt/openjdk@17/bin/java \
     -Dregistry.url=http://localhost:8080 \
     -jar /path/to/server.jar
   ```

---

### Issue: "JAR file not found"

**Symptoms:**
- Error: "Unable to access jarfile"
- MCP server fails to start

**Solution:**

1. **Verify JAR path:**
   ```bash
   ls -la /path/to/apicurio-registry-mcp-server.jar
   ```

2. **Use absolute path:**
   ```bash
   # ✓ Good (absolute path)
   -jar /opt/apicurio/apicurio-registry-mcp-server.jar

   # ✓ Also good (home directory expansion works)
   -jar ~/projects/apicurio-registry/mcp/target/server.jar

   # ✗ Bad (relative path may not work in all contexts)
   -jar ./mcp/target/server.jar
   ```

3. **Check file permissions:**
   ```bash
   chmod +r <PATH_TO_JAR>/apicurio-registry-mcp-server.jar
   ```

---

### Issue: "Registry connection failed"

**Symptoms:**
- MCP server starts but operations fail
- "Connection refused" errors

**Solution:**

1. **Verify Registry is running:**
   ```bash
   curl http://localhost:8080/apis/registry/v3/groups
   ```

2. **Check Registry URL in configuration:**
   ```bash
   # ✓ Correct
   -Dregistry.url=http://localhost:8080

   # ✗ Wrong (don't include API path)
   -Dregistry.url=http://localhost:8080/apis/registry/v3
   ```

3. **Check firewall/network:**
   - Ensure port 8080 is accessible
   - Check if localhost resolves correctly

---

### Issue: "Java version too old"

**Symptoms:**
- Error: "UnsupportedClassVersionError"
- Error: "has been compiled by a more recent version"

**Solution:**

1. **Check Java version:**
   ```bash
   java -version
   ```

2. **Upgrade to Java 17+:**
   ```bash
   # macOS
   brew install openjdk@17

   # Linux (Ubuntu/Debian)
   sudo apt install openjdk-17-jdk
   ```

3. **Update Java path in VSCode settings:**
   ```json
   {
     "apicurioRegistry.mcp.javaPath": "/opt/homebrew/opt/openjdk@17/bin/java"
   }
   ```

---

## Comparison: JAR vs Docker

| Feature | JAR Mode | Docker Mode |
|---------|----------|-------------|
| **Setup Complexity** | Medium (requires Java 17+) | Easy (just needs Docker) |
| **Performance** | Native performance | Container overhead |
| **Debugging** | Easy (Java debugger) | Harder (container debugging) |
| **Resource Usage** | Lower (no container) | Higher (container overhead) |
| **Isolation** | Shares host Java | Isolated environment |
| **Updates** | Rebuild JAR | Pull new image |
| **Best For** | Development, debugging | Production, consistency |

---

## Best Practices

### Development Environment

```bash
# Recommended settings for local development
claude mcp add apicurio-registry -s local -- \
  java \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=false \
  -Dapicurio.mcp.paging.limit=200 \
  -Dquarkus.log.level=INFO \
  -Dquarkus.log.console.stderr=true \
  -jar /path/to/apicurio-registry-mcp-server.jar
```

### Production/Shared Environment

```bash
# Recommended settings for shared Registry
claude mcp add apicurio-registry -s local -- \
  java \
  -Xmx256m \
  -Dregistry.url=https://registry.company.com \
  -Dapicurio.mcp.safe-mode=true \
  -Dapicurio.mcp.paging.limit=100 \
  -Dquarkus.log.console.stderr=true \
  -jar /path/to/apicurio-registry-mcp-server.jar
```

### Debugging

```bash
# Enable remote debugging
claude mcp add apicurio-registry -s local -- \
  java \
  -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 \
  -Dquarkus.log.level=DEBUG \
  -Dquarkus.log.console.stderr=true \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=false \
  -jar /path/to/apicurio-registry-mcp-server.jar
```

---

## Example: Complete Setup

Here's a complete example from scratch:

```bash
# 1. Build the MCP server JAR
cd <APICURIO_REGISTRY_ROOT>/mcp
./mvnw clean package

# 2. Verify Java installation
java -version
# openjdk version "17.0.2"

# 3. Verify Registry is running
curl http://localhost:8080/apis/registry/v3/groups

# 4. Configure Claude Code MCP
claude mcp add apicurio-registry -s local -- \
  java \
  -Dregistry.url=http://localhost:8080 \
  -Dapicurio.mcp.safe-mode=false \
  -Dapicurio.mcp.paging.limit=200 \
  -Dquarkus.log.console.stderr=true \
  -jar <PATH_TO_JAR>/apicurio-registry-mcp-server-<VERSION>-runner.jar

# 5. Verify configuration
claude mcp list
# apicurio-registry: java -jar ... - ✓ Connected

# 6. Test in Claude Code
# Start new conversation and ask:
# "List my Apicurio Registry groups"
```

---

## See Also

- **Docker Configuration:** `CLAUDE_CODE_MCP_WORKING_CONFIG.md`
- **Setup Guide:** `GETTING_STARTED.md`
- **Troubleshooting:** `MCP_DEBUGGING_GUIDE.md`
- **Testing:** `QUICK_TEST_STEPS.md`

---

## Document History

**Version 1.0** - 2025-11-20
- Initial JAR configuration guide
- Added Java detection and validation
- Added troubleshooting guide
- Added advanced configuration examples
- Added comparison with Docker mode

---

**Document Version**: 1.0
**Last Updated**: 2025-11-20
**Status**: ✅ JAR mode fully supported
