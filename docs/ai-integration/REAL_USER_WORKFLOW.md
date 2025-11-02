# Real User Workflow - Claude Code + VSCode Plugin

**Target Audience**: Developers using Apicurio Registry (not developing it)

---

## User's Environment

**What the user has:**
- Their own application project (e.g., Spring Boot, Node.js, Python, etc.)
- VSCode installed
- Apicurio Registry VSCode extension installed from marketplace
- Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)
- Access to a **remote** Apicurio Registry server:
  - Company-hosted registry
  - Cloud-hosted registry (e.g., registry.company.com:8080)
  - Managed Apicurio instance

**What the user does NOT have:**
- Apicurio Registry source code
- Registry running locally
- Need to manage/start Registry server

---

## One-Time Setup (5 minutes)

### Step 1: Install Prerequisites

```bash
# Install Claude Code CLI (if not already installed)
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version
```

### Step 2: Install VSCode Extension

1. Open VSCode
2. Go to Extensions (Cmd+Shift+X)
3. Search for "Apicurio Registry"
4. Click "Install"

### Step 3: Connect VSCode Plugin to Registry

1. Open VSCode sidebar (Cmd+Shift+E)
2. Find "APICURIO REGISTRY" section
3. Click "Connect to Registry" (plug icon)
4. Enter your registry details:
   - **Registry URL**: `https://registry.company.com` (your company's registry)
   - **Auth Type**: `oidc` or `basic` (as configured by your admin)
   - **Credentials**: Your registry credentials

✅ You should now see your registry groups in the tree view

### Step 4: Configure Claude Code MCP (One Command)

**From YOUR project directory** (e.g., your Spring Boot app):

```bash
cd ~/projects/my-application

# Add MCP server pointing to YOUR registry
claude mcp add --transport stdio \
  -e REGISTRY_URL=https://registry.company.com \
  -e APICURIO_MCP_SAFE_MODE=true \
  -- apicurio-registry podman run -i --rm \
  quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot
```

**Adjust the URL** to match your registry:
- Company server: `https://registry.company.com`
- Cloud instance: `https://registry.example.cloud`
- Local dev: `http://localhost:8080`

### Step 5: Verify MCP Connection

```bash
claude mcp list
```

Expected output:
```
apicurio-registry: ✓ Connected
```

**Done!** Setup complete. You never need to do this again for this project.

---

## Daily Workflow

### Scenario: Design a New API

**Your project**: Building a microservice that needs an OpenAPI spec

**Goal**: Use AI to design the API schema and store it in your company's registry

#### Step 1: Open Your Project in VSCode

```bash
cd ~/projects/my-microservice
code .
```

You should see:
- **Left sidebar**: Your project files + Apicurio Registry tree view
- **Bottom**: Integrated terminal

#### Step 2: Start Claude in Your Project Terminal

In VSCode terminal:
```bash
claude
```

#### Step 3: Ask Claude to Design Your API

```
I'm building a user management microservice. Create an OpenAPI 3.0 schema with:
- GET /users (list users with pagination)
- GET /users/{id} (get user details)
- POST /users (create user)
- PUT /users/{id} (update user)
- DELETE /users/{id} (delete user)

User model: id, username, email, firstName, lastName, createdAt, updatedAt

Please create this as artifact "user-management-api" in the "microservices" group in Apicurio Registry.
```

**What happens:**
1. Claude generates a valid OpenAPI 3.0 schema
2. Claude uses MCP tools to register it in your company's registry
3. Claude confirms: "Created artifact 'user-management-api' version 1 in group 'microservices'"

#### Step 4: Verify in VSCode

1. Look at Apicurio Registry tree view (left sidebar)
2. Click "Refresh" button
3. Expand "microservices" group
4. You'll see "user-management-api" artifact
5. Right-click → "Open Content"
6. Schema opens in VSCode editor

#### Step 5: Refine the Schema (if needed)

In Claude terminal:
```
The user-management-api looks good, but add these changes:
1. Add a PATCH /users/{id}/password endpoint for password changes
2. Add role field to user model (enum: admin, user, guest)
3. Add authentication requirements to all endpoints

Create this as version 2.
```

**What happens:**
1. Claude retrieves version 1
2. Makes the changes
3. Creates version 2 in the registry
4. You can now see both versions in VSCode tree view

#### Step 6: Use the Schema in Your Code

Now that the schema is in the registry, you can:

**Option A: Download it**
- Right-click artifact → "Download"
- Save to `src/main/resources/openapi.yaml`
- Use in your Spring Boot app

**Option B: Reference it**
- Use Apicurio client library to fetch at runtime
- Keep your app in sync with registry

**Option C: Generate code from it**
- Use OpenAPI generator tools
- Generate API stubs from the schema

---

## Example Workflows

### Workflow 1: Create Multiple Related APIs

**Scenario**: You're building a microservices platform

```bash
# In your project terminal
claude
```

**Prompt:**
```
I'm building an e-commerce platform with these microservices:
1. product-service
2. order-service
3. payment-service
4. inventory-service

Create OpenAPI 3.0 schemas for all four services with basic CRUD operations.
Store them in the "ecommerce" group in Apicurio Registry.
```

**Result:**
- Claude creates 4 artifacts
- All appear in VSCode tree view
- You can review each one
- All your team members can access them from the registry

---

### Workflow 2: Version an Existing API

**Scenario**: Your API needs a breaking change

**VSCode tree view:**
- Right-click existing artifact → "Copy Artifact ID"

**Claude terminal:**
```
I have an existing API "payment-api" that currently uses API keys for auth.
Create a new version that uses OAuth 2.0 instead.
This is a breaking change, so update the version to 2.0.0.
```

**Result:**
- Version 2.0.0 created
- Both versions visible in VSCode
- You can deploy v2 when ready
- Old clients can still use v1

---

### Workflow 3: Create Event Schemas

**Scenario**: Building event-driven architecture

**Claude prompt:**
```
Create AsyncAPI 3.0 schemas for our order processing events:

1. order-created-event
   - orderId, customerId, items, totalAmount, timestamp

2. order-payment-completed-event
   - orderId, paymentId, amount, timestamp

3. order-shipped-event
   - orderId, trackingNumber, carrier, timestamp

Store in "order-events" group.
```

**Result:**
- 3 AsyncAPI schemas created
- Team can implement event producers/consumers
- All schemas versioned and tracked in registry

---

## The Complete Picture

```
┌─────────────────────────────────────────────────────────────┐
│                    VSCode Window                            │
├──────────────┬──────────────────────────────────────────────┤
│              │                                               │
│ YOUR PROJECT │      Editor: openapi.yaml                     │
│   FILES      │      (Schema from registry)                   │
│              │                                               │
│ ├─ src/      │      openapi: 3.0.0                          │
│ ├─ test/     │      info:                                   │
│ └─ pom.xml   │        title: User Management API            │
│              │        version: 1.0.0                         │
│              │                                               │
│ APICURIO     │                                               │
│ REGISTRY     │                                               │
│              │                                               │
│ ├─ Groups    │                                               │
│ │  ├─ micro │                                               │
│ │  │  └─ user-mgmt-api (v1, v2)                            │
│              │                                               │
├──────────────┴──────────────────────────────────────────────┤
│  Terminal: $ claude                                          │
│  > Create an OpenAPI schema for user management...          │
│  ✓ Created artifact 'user-management-api' v1                │
│  > Now add authentication to all endpoints...               │
│  ✓ Created version 2 with authentication                    │
└──────────────────────────────────────────────────────────────┘

REGISTRY SERVER
(Company's Apicurio Registry)
   registry.company.com
         │
         ├─ microservices/
         │  ├─ user-management-api (v1, v2)
         │  ├─ product-api (v1)
         │  └─ order-api (v1, v2, v3)
         │
         └─ events/
            ├─ order-created
            └─ payment-completed
```

**Key Points:**
1. **One VSCode window** - everything in one place
2. **Your project** - not Registry source code
3. **Remote registry** - company's shared registry
4. **Claude in terminal** - bottom of VSCode window
5. **Plugin shows registry** - live view of company's schemas
6. **No context switching** - never leave VSCode

---

## What You DON'T Need

❌ Apicurio Registry source code
❌ Run Registry server locally
❌ Multiple terminal windows
❌ Complex setup scripts
❌ Separate applications
❌ Context switching between apps

---

## What You DO Need

✅ Your application project
✅ VSCode with Apicurio plugin
✅ Claude Code CLI
✅ Connection to company's registry
✅ One terminal in VSCode
✅ 5 minutes for initial setup

---

## Troubleshooting

### "MCP server can't connect to registry"

**Issue**: Registry URL might be wrong

**Check:**
```bash
# Test registry connection
curl https://registry.company.com/apis/registry/v3/system/info
```

**Fix:**
- Verify URL with your admin
- Check firewall/VPN settings
- Ensure authentication credentials are correct

### "No groups showing in VSCode plugin"

**Solutions:**
1. Click "Refresh" button in tree view
2. Verify connection settings (right-click "Connect to Registry")
3. Check registry is accessible
4. Verify credentials are valid

### "Claude says it can't access registry"

**Verify MCP configuration:**
```bash
# From your project directory
claude mcp list

# Should show:
# apicurio-registry: ✓ Connected
```

**If not connected:**
- Check you're in the right project directory
- Re-run the `claude mcp add` command with correct registry URL

---

## Team Collaboration

**The Power**: Everyone on your team can use this workflow!

1. **Developer A** creates API schema with Claude
2. Schema stored in company registry
3. **Developer B** sees it in their VSCode plugin
4. **Developer B** asks Claude to generate client code
5. **Developer C** creates new version with Claude
6. Everyone stays in sync via registry

**No more:**
- Emailing schemas back and forth
- Outdated API specs
- "Which version are we using?"
- Manual schema editing

---

## Next Steps

1. **Try it now**: Follow "One-Time Setup" above
2. **Create your first schema**: Use one of the example workflows
3. **Share with team**: Show them how easy it is
4. **Iterate**: Use Claude to refine schemas based on feedback

---

**Document Version**: 1.0
**Last Updated**: 2025-10-31
**Status**: Production Ready
