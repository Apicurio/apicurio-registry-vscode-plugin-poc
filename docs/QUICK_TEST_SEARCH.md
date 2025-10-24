# Quick Test Guide: Search Feature

**Time Required:** 10-15 minutes
**Goal:** Test the new search functionality

---

## Setup (5 minutes)

### Step 1: Start the Registry

**Option A: From Source (Recommended if Docker not available)**

```bash
# In a separate terminal window
cd /Users/astranier/Documents/dev/apicurio/apicurio-registry/app
../mvnw quarkus:dev
```

Wait for message: "Listening on: http://0.0.0.0:8080"

**Option B: With Docker (if available)**

```bash
docker run -it -p 8080:8080 apicurio/apicurio-registry:latest-snapshot
```

### Step 2: Verify Registry is Running

```bash
curl http://localhost:8080/apis/registry/v3/system/info
```

Should return JSON with registry info.

### Step 3: Add Test Data (Optional but Recommended)

```bash
# Add a sample OpenAPI spec
curl -X POST "http://localhost:8080/apis/registry/v3/groups/test-group/artifacts" \
  -H "Content-Type: application/json" \
  -H "X-Registry-ArtifactId: sample-api" \
  -H "X-Registry-ArtifactType: OPENAPI" \
  -d '{
    "openapi": "3.0.0",
    "info": {
      "title": "Sample Pet Store API",
      "version": "1.0.0",
      "description": "A sample API for testing"
    },
    "paths": {
      "/pets": {
        "get": {
          "summary": "List pets",
          "responses": {"200": {"description": "Success"}}
        }
      }
    }
  }'

# Add another artifact for better testing
curl -X POST "http://localhost:8080/apis/registry/v3/groups/demo-group/artifacts" \
  -H "Content-Type: application/json" \
  -H "X-Registry-ArtifactId: user-api" \
  -H "X-Registry-ArtifactType": "OPENAPI" \
  -d '{
    "openapi": "3.0.0",
    "info": {
      "title": "User Management API",
      "version": "1.0.0",
      "description": "User management system"
    },
    "paths": {
      "/users": {
        "get": {
          "summary": "List users",
          "responses": {"200": {"description": "Success"}}
        }
      }
    }
  }'
```

---

## Testing (10 minutes)

### Step 1: Launch Extension

1. Open VSCode in the plugin folder:
   ```bash
   cd /Users/astranier/Documents/dev/apicurio/apicurio-vscode-plugin
   code .
   ```

2. Press **F5** to launch Extension Development Host
   - A new VSCode window will open with your extension loaded

### Step 2: Connect to Registry

1. In the new window, look for "Apicurio Registry" in the Explorer sidebar
2. Click **"Connect to Registry"** button (🔌 icon)
3. Select "Local Registry" from the list
4. You should see "Connected to Local Registry" message
5. Tree should populate with groups

### Step 3: Test Basic Search

**Test 1: Search by Name**

1. Click the **Search icon (🔍)** in the toolbar
2. Select **"Name"** from the dropdown
3. Enter **"Pet"** (or "User")
4. Press Enter

**✅ Expected:**
- Progress notification appears
- Results show matching artifacts
- Notification: "Found X artifacts matching Name: Pet"
- Artifacts show with group prefix: `test-group/sample-api`
- State emoji (✓) visible
- Click "Clear Filter" to return to normal view

**Test 2: Search by Type**

1. Click Search icon
2. Select **"Type"**
3. Select **"OPENAPI"**

**✅ Expected:**
- Dropdown shows all 9 types (OPENAPI, ASYNCAPI, AVRO, etc.)
- Results show only OPENAPI artifacts
- All your test artifacts appear (they're all OPENAPI)

**Test 3: Search by State**

1. Click Search icon
2. Select **"State"**
3. Select **"ENABLED"**

**✅ Expected:**
- Shows ENABLED, DISABLED, DEPRECATED options
- Results show enabled artifacts
- Most artifacts should be ENABLED by default

**Test 4: Search by Group**

1. Click Search icon
2. Select **"Group"**
3. Enter **"test"**

**✅ Expected:**
- Finds artifacts in "test-group"
- Partial matching works

**Test 5: Clear Filter**

1. After any search, click **"Clear Filter"** in the notification
2. Or click the **Refresh button**

**✅ Expected:**
- Tree returns to grouped view
- All groups visible again

### Step 4: Test Edge Cases

**Test: No Results**

1. Click Search
2. Select "Name"
3. Enter **"XYZNotFound"**

**✅ Expected:**
- Message: "No matching artifacts"
- Helpful description shown
- "Try Again" button in notification

**Test: Validation**

1. Click Search
2. Select "Name"
3. Enter single character **"A"**

**✅ Expected:**
- Error: "Name must be at least 2 characters"
- Cannot proceed

**Test: Cancel**

1. Click Search
2. Select criteria
3. Press **Esc**

**✅ Expected:**
- Wizard cancels cleanly
- No errors

### Step 5: Test Search While Disconnected

1. Click **"Disconnect"** button
2. Try to search

**✅ Expected:**
- Error: "Please connect to a registry first before searching."
- No crash

---

## Quick Checklist

- [ ] Search by Name works
- [ ] Search by Type works (dropdown)
- [ ] Search by State works (dropdown)
- [ ] Search by Group works
- [ ] Search by Description works
- [ ] Search by Labels works (format: key=value)
- [ ] Results display correctly (emojis, icons, descriptions)
- [ ] Clear filter returns to normal view
- [ ] No results handled gracefully
- [ ] Input validation prevents bad inputs
- [ ] Cancel (Esc) works without errors
- [ ] Progress indicators appear
- [ ] Error messages are helpful
- [ ] Can expand filtered artifacts to see versions

---

## Common Issues

### "Extension host terminated unexpectedly"

**Solution:** Check Debug Console for errors. Rebuild with `npm run compile`.

### "No artifacts found" for everything

**Solution:**
- Verify registry is running: `curl http://localhost:8080/apis/registry/v3/system/info`
- Check artifacts exist: `curl http://localhost:8080/apis/registry/v3/search/artifacts`
- Add test data using curl commands above

### Search button not visible

**Solution:**
- Make sure you compiled: `npm run compile`
- Restart Extension Development Host (Ctrl+Shift+F5)

### Connection fails

**Solution:**
- Check settings.json has correct connection:
  ```json
  {
    "apicurioRegistry.connections": [{
      "name": "Local Registry",
      "url": "http://localhost:8080",
      "authType": "none"
    }]
  }
  ```

---

## Success Criteria

✅ You should be able to:
1. Search using all 6 criteria types
2. See results with rich metadata (emojis, icons, descriptions)
3. Clear filters and return to normal view
4. Handle errors gracefully
5. Cancel search without issues

---

## Report Issues

If you find bugs, note:
- What you did (steps)
- What you expected
- What actually happened
- Any error messages in Debug Console

---

## Next Steps After Testing

Once search works well:
1. Test with larger registries (100+ artifacts)
2. Test different artifact types (AsyncAPI, Avro, etc.)
3. Move to next feature: "Add Artifact" wizard

---

**Happy Testing! 🎉**

If everything works, the search feature is ready for use!
