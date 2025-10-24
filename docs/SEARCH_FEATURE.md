# Search Feature Guide

**Status:** ✅ Implemented
**Version:** 0.1.0
**Date:** 2025-10-23

## Overview

The Search Artifacts feature allows you to quickly find artifacts in your Apicurio Registry using various search criteria. This feature is inspired by the proven UX pattern from the reference plugin and enhanced with modern capabilities.

---

## How to Use

### Step 1: Open Search

Click the **Search** icon (🔍) in the Apicurio Registry view toolbar, or:
- Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
- Type: `Apicurio Registry: Search Artifacts`

### Step 2: Choose Search Criteria

Select how you want to search:

| Criteria | Description | Example |
|----------|-------------|---------|
| **Name** | Search by artifact name | "User API" |
| **Group** | Search by group ID | "com.example.apis" |
| **Description** | Search by description text | "user management" |
| **Type** | Filter by artifact type | OPENAPI, ASYNCAPI, AVRO, etc. |
| **State** | Filter by state | ENABLED, DISABLED, DEPRECATED |
| **Labels** | Search by label | "environment=production" |

### Step 3: Enter Search Value

Depending on your chosen criteria:

**For Type or State:**
- Select from a dropdown list of available options

**For Name, Group, or Description:**
- Enter your search term (minimum 2 characters)
- The search is case-sensitive (API behavior)

**For Labels:**
- Enter in format: `key=value`
- Example: `environment=production`

### Step 4: View Results

Search results are displayed in the tree view:
- Artifacts are shown at the root level with group prefix: `group/artifact`
- Each artifact shows:
  - ✓ State indicator emoji
  - 📝 Artifact type icon
  - Description preview (first 30 chars)
- Expand artifacts to see their versions

### Step 5: Clear Filter

To return to the normal grouped view:
- Click "Clear Filter" in the notification
- Or click the Refresh button in the toolbar

---

## Search Examples

### Example 1: Find OpenAPI Specifications

1. Click Search icon
2. Select "Type"
3. Select "OPENAPI"
4. **Result:** Shows all OpenAPI artifacts

### Example 2: Find Deprecated Artifacts

1. Click Search icon
2. Select "State"
3. Select "DEPRECATED"
4. **Result:** Shows all deprecated artifacts across all groups

### Example 3: Find Artifacts by Name

1. Click Search icon
2. Select "Name"
3. Enter "User"
4. **Result:** Shows artifacts with "User" in their name

### Example 4: Find Production Artifacts

1. Click Search icon
2. Select "Labels"
3. Enter "environment=production"
4. **Result:** Shows artifacts tagged for production

---

## Features

### ✅ Implemented

- **Multi-criteria search** - 6 different search options
- **Type-specific inputs** - Dropdowns for types and states, text input for others
- **Input validation** - Ensures valid search terms
- **Progress indicators** - Visual feedback during search
- **Result count** - Shows number of matching artifacts
- **Empty state handling** - Helpful message when no results found
- **Error handling** - Clear error messages with retry option
- **Filter management** - Easy clear/retry workflow

### 🎯 UX Highlights

- **Step-by-step wizard** - Guided 2-step process
- **Contextual placeholders** - Helpful examples for each input
- **Instant feedback** - Results appear immediately
- **Clear descriptions** - Each option explained
- **Actionable notifications** - Clear filter or try again buttons

---

## Technical Details

### API Endpoint

```
GET /apis/registry/v3/search/artifacts
```

### Supported Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Artifact name (partial match) |
| `group` | string | Group ID (partial match) |
| `description` | string | Description text (partial match) |
| `type` | enum | Artifact type (exact match) |
| `state` | enum | Artifact state (exact match) |
| `labels` | string | Label key=value (exact match) |
| `limit` | number | Max results (default: 100) |
| `offset` | number | Pagination offset (default: 0) |

### Code Location

```
src/
├── commands/
│   └── searchCommand.ts          # Search wizard implementation
├── services/
│   └── registryService.ts        # API: searchArtifacts()
└── providers/
    └── registryTreeProvider.ts   # Filter management
```

---

## Comparison with Reference Plugin

### What's Better

✅ **Richer artifact display** - State emojis, type icons, truncated descriptions
✅ **Better error handling** - Actionable prompts with retry
✅ **Modern API** - Registry V3 with authentication support
✅ **Input validation** - Prevents invalid searches
✅ **Progress indicators** - Better user feedback

### What's the Same

✅ **Multi-step wizard UX** - Proven 2-step process
✅ **Type-specific inputs** - Dropdowns vs text fields
✅ **Search criteria options** - 6 criteria types
✅ **Result filtering** - Shows only matching artifacts

### Minor Differences

- Reference shows results nested under groups (we show flat with group prefix)
- Reference supports additional criteria like "properties" (not yet implemented)
- We use modern Markdown tooltips (reference uses plain text)

---

## Troubleshooting

### "Please connect to a registry first"

**Cause:** Not connected to any registry
**Solution:** Click "Connect to Registry" button first

### "No artifacts found"

**Cause:** Search criteria too specific or no matching data
**Solution:**
- Try a different search term
- Use fewer characters for broader results
- Check spelling and case-sensitivity

### "Search failed: Failed to search artifacts"

**Cause:** Network error or API unavailable
**Solution:**
- Check registry connection
- Verify registry is running
- Check authentication credentials

### "Label must be in format: key=value"

**Cause:** Invalid label format
**Solution:** Enter label as `key=value`, e.g., `env=prod`

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Command Palette | `Cmd+Shift+P` / `Ctrl+Shift+P` |
| Search within dropdown | Type to filter options |
| Cancel wizard | `Esc` at any step |
| Navigate dropdowns | Arrow keys |
| Select option | `Enter` |

---

## Future Enhancements

Potential improvements for future versions:

- 🔮 **Search history** - Recently used searches
- 🔮 **Saved searches** - Bookmark common queries
- 🔮 **Advanced search** - Combine multiple criteria
- 🔮 **Sort options** - Sort results by name, date, etc.
- 🔮 **Export results** - Save search results
- 🔮 **Search in sidebar** - Inline search field
- 🔮 **Quick filters** - One-click common filters

---

## API Reference

### searchArtifactsCommand()

```typescript
async function searchArtifactsCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void>
```

**Parameters:**
- `registryService` - Registry API service instance
- `treeProvider` - Tree data provider for displaying results

**Returns:** Promise<void>

**Throws:** Shows error notification on failure

### RegistryService.searchArtifacts()

```typescript
async searchArtifacts(
    searchParams: Record<string, string>
): Promise<SearchedArtifact[]>
```

**Parameters:**
- `searchParams` - Query parameters for search API

**Returns:** Array of matching artifacts

**Example:**
```typescript
const results = await registryService.searchArtifacts({
    name: 'User',
    type: 'OPENAPI'
});
```

### RegistryTreeDataProvider.applySearchFilter()

```typescript
applySearchFilter(criterion: string, value: string): void
```

**Parameters:**
- `criterion` - Search criterion (name, type, state, etc.)
- `value` - Search value

**Side Effects:** Refreshes tree view with filtered results

### RegistryTreeDataProvider.clearSearchFilter()

```typescript
clearSearchFilter(): void
```

**Side Effects:** Refreshes tree view to show all items

---

## Related Documentation

- [UX Comparison](./UX_COMPARISON.md) - Detailed UX analysis
- [Testing Guide](./TESTING_GUIDE.md) - How to test search feature
- [API Documentation](https://www.apicur.io/registry/docs/apicurio-registry/3.0.x/index.html) - Registry V3 API

---

**Document Version:** 1.0
**Last Updated:** 2025-10-23
**Author:** Claude Code
**Status:** Complete
