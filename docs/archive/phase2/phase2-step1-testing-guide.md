# Phase 2.1a Testing Guide: Custom Icons

## Overview

This guide walks you through testing the Custom Icons implementation for Phase 2.1a of the Enhanced Tree View feature.

## Prerequisites

1. **Registry Running:** Ensure Apicurio Registry is running at `http://localhost:8080`
2. **Extension Compiled:** Extension must be compiled with latest changes
3. **VSCode Ready:** Extension Development Host window ready

## Quick Start Testing

### Step 1: Compile the Extension

```bash
cd apicurio-vscode-plugin
npm run compile
```

### Step 2: Launch Extension

1. In VSCode, open the `apicurio-vscode-plugin` directory
2. Press `F5` to launch Extension Development Host
3. Open a folder in the Extension Development Host window
4. Navigate to the APICURIO REGISTRY view in Explorer sidebar

### Step 3: Add Test Data

Run the test data script to create artifacts of all 9 types:

```bash
cd apicurio-vscode-plugin
./test-icons.sh
```

This will create:
- 1 group: `icon-test-group`
- 9 artifacts (one for each type)
- Mixed states: ENABLED, DEPRECATED, DISABLED

### Step 4: View Icons in Extension

1. In Extension Development Host, click **Connect to Registry**
2. Click the **Refresh** button (🔄)
3. Expand the `icon-test-group` node
4. Observe the icons for each artifact

## Expected Results

### Icon Mapping Verification

Each artifact should display a unique icon:

| Artifact | Type | Expected Icon | Icon ID |
|----------|------|---------------|---------|
| petstore-api | OPENAPI | Method symbol | `symbol-method` |
| events-api | ASYNCAPI | Radio tower | `radio-tower` |
| user-schema | AVRO | Database | `database` |
| product-proto | PROTOBUF | Class symbol | `symbol-class` |
| order-schema | JSON | JSON icon | `json` |
| blog-graphql | GRAPHQL | Interface symbol | `symbol-interface` |
| db-connector | KCONNECT | Plug/connector | `plug` |
| payment-service | WSDL | Globe | `globe` |
| invoice-xsd | XSD | Namespace symbol | `symbol-namespace` |

### State Indicators

Artifacts should show state emojis in descriptions:

- **petstore-api**: ✓ (ENABLED)
- **events-api**: ✓ (ENABLED)
- **user-schema**: ✓ (ENABLED)
- **product-proto**: ⚠ (DEPRECATED)
- **order-schema**: ✓ (ENABLED)
- **blog-graphql**: ✓ (ENABLED)
- **db-connector**: ✗ (DISABLED)
- **payment-service**: ⚠ (DEPRECATED)
- **invoice-xsd**: ✓ (ENABLED)

### Enhanced Tooltips

When hovering over artifacts, tooltips should show:

**Example for petstore-api:**
```
petstore-api

- Type: OpenAPI Specification
- State: ✓ Enabled
- Description: REST API for pet store operations
```

**Example for product-proto (deprecated):**
```
product-proto

- Type: Protocol Buffers Schema
- State: ⚠ Deprecated
- Description: Product schema (deprecated - use v2)
```

### Group Display

The group node should show:
- Folder icon
- Artifact count in description: `icon-test-group (9)`

### Version Display

Expand any artifact to see versions:
- Tag icon (`tag`)
- Version number as label
- State emoji in description (if applicable)

## Manual Test Checklist

### Icon Display Tests

- [ ] OPENAPI shows method/API icon (not generic file icon)
- [ ] ASYNCAPI shows radio tower/broadcast icon
- [ ] AVRO shows database icon
- [ ] PROTOBUF shows class/structure icon
- [ ] JSON shows JSON icon
- [ ] GRAPHQL shows interface/graph icon
- [ ] KCONNECT shows plug/connector icon
- [ ] WSDL shows globe/web service icon
- [ ] XSD shows namespace/XML icon
- [ ] Unknown type shows fallback `file-code` icon

### State Indicator Tests

- [ ] ENABLED artifacts show ✓ emoji
- [ ] DEPRECATED artifacts show ⚠ emoji
- [ ] DISABLED artifacts show ✗ emoji
- [ ] State emoji appears in artifact description
- [ ] State emoji appears in version description

### Tooltip Tests

- [ ] Hovering shows markdown-formatted tooltip
- [ ] Tooltip includes artifact name in bold
- [ ] Tooltip shows human-readable type label
- [ ] Tooltip shows state with emoji
- [ ] Tooltip shows description if present
- [ ] Version tooltips show Global ID
- [ ] Version tooltips show creation date

### Description Tests

- [ ] Groups show artifact count: `(9)`
- [ ] Artifacts show state emoji + description
- [ ] Long descriptions are truncated to 30 chars
- [ ] Truncated descriptions end with `...`

### Context Value Tests

- [ ] Group nodes have `contextValue: 'group'`
- [ ] Artifact nodes have `contextValue: 'artifact-TYPE'`
  - Example: `'artifact-OPENAPI'`
- [ ] Version nodes have `contextValue: 'version'`

## Unit Test Execution

Run the unit tests to verify IconService functionality:

```bash
npm test iconService.test.ts
```

### Expected Test Results

All tests should pass:

```
 PASS  src/services/iconService.test.ts
  IconService
    getIconForArtifactType
      ✓ should return symbol-method icon for OPENAPI
      ✓ should return radio-tower icon for ASYNCAPI
      ✓ should return database icon for AVRO
      ✓ should return symbol-class icon for PROTOBUF
      ✓ should return json icon for JSON
      ✓ should return symbol-interface icon for GRAPHQL
      ✓ should return plug icon for KCONNECT
      ✓ should return globe icon for WSDL
      ✓ should return symbol-namespace icon for XSD
      ✓ should return file-code icon for unknown type
      ✓ should handle undefined artifact type
      ✓ should handle lowercase artifact types
    getIconForState
      ✓ should return check icon for ENABLED
      ✓ should return circle-slash icon for DISABLED
      ✓ should return warning icon for DEPRECATED
      ✓ should return edit icon for DRAFT
      ✓ should return undefined for unknown state
      ✓ should handle lowercase state values
    ... (all tests passing)

Test Suites: 1 passed, 1 total
Tests:       30+ passed, 30+ total
```

## Troubleshooting

### Icons Not Showing

**Symptom:** All artifacts show generic file icon

**Possible Causes:**
1. Extension not recompiled after changes
2. Extension Development Host not restarted
3. VSCode cache issue

**Solutions:**
```bash
# Recompile
npm run compile

# Restart debugging session
# In main VSCode: Stop (Shift+F5), then Start (F5)

# Clear VSCode cache (if needed)
rm -rf ~/.vscode/extensions/.obsolete
```

### State Emojis Not Appearing

**Symptom:** No ✓, ⚠, or ✗ symbols in descriptions

**Possible Causes:**
1. Artifacts created without state metadata
2. Font doesn't support emoji characters

**Solutions:**
1. Recreate test data with `./test-icons.sh`
2. Check registry API response includes `state` field
3. Verify terminal/VSCode uses emoji-capable font

### Tooltips Not Showing Markdown

**Symptom:** Tooltip is plain text, not formatted

**Possible Causes:**
1. `vscode.MarkdownString` not used correctly
2. VSCode version too old

**Solutions:**
1. Verify VSCode version ≥ 1.70.0
2. Check code uses `new vscode.MarkdownString()`

### Test Data Script Fails

**Symptom:** `./test-icons.sh` returns errors

**Possible Causes:**
1. Registry not running
2. Network/connectivity issues
3. API version mismatch

**Solutions:**
```bash
# Check registry is running
curl http://localhost:8080/apis/registry/v3/system/info

# Start registry if needed
docker run -it -p 8080:8080 apicurio/apicurio-registry:latest-snapshot

# Check script permissions
chmod +x test-icons.sh
```

## Visual Comparison

### Before (Phase 1)

```
📁 test-group
   ├─ 📄 petstore-api          (all same icon)
   ├─ 📄 events-api            (all same icon)
   ├─ 📄 user-schema           (all same icon)
   └─ 📄 product-proto         (all same icon)
```

### After (Phase 2.1a)

```
📁 test-group (9)
   ├─ 🌐 petstore-api ✓ REST API for pet...
   ├─ 📡 events-api ✓ Event-driven mess...
   ├─ 🗄️  user-schema ✓ Avro schema for u...
   ├─ 📦 product-proto ⚠ Product schema (d...
   ├─ 📄 order-schema ✓ JSON Schema for o...
   ├─ 🔷 blog-graphql ✓ GraphQL schema fo...
   ├─ 🔌 db-connector ✗ Database connecto...
   ├─ 🌍 payment-service ⚠ Legacy payment s...
   └─ 📋 invoice-xsd ✓ XML schema for in...
```

## Performance Testing

### Large Registry Test

Test with many artifacts to ensure no performance degradation:

1. Create 100+ artifacts using a script
2. Expand groups and measure response time
3. Verify UI remains responsive

**Acceptance Criteria:**
- Tree loads within 2 seconds for 100 artifacts
- Scrolling is smooth
- No memory leaks after multiple refresh cycles

## Success Criteria

Phase 2.1a is complete when:

- ✅ All 9 artifact types display unique icons
- ✅ Icons are visually distinct and recognizable
- ✅ State indicators (emojis) appear for all states
- ✅ Tooltips show enhanced markdown-formatted information
- ✅ Descriptions show artifact counts and truncated text
- ✅ Unit tests achieve ≥80% code coverage
- ✅ All manual tests pass
- ✅ No performance regression vs Phase 1

## Next Steps

After Phase 2.1a testing is complete:

1. **Document any issues** found during testing
2. **Create bug reports** for any failures
3. **Proceed to Phase 2.1b:** Status Indicators (enhanced)
4. **Update user documentation** with icon legend

## Feedback

If you discover any issues or have suggestions:

1. Create an issue in the GitHub repository
2. Include screenshots showing the problem
3. Provide steps to reproduce
4. Tag with `phase-2` and `icons` labels
