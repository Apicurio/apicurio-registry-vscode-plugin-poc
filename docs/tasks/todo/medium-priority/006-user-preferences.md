# Task 006: User Preferences

**Status:** 📋 Todo
**Priority:** 🟡 Medium
**Effort Estimate:** 2-3 hours
**Target Date:** TBD

---

## Description

Add configuration options for user preferences like name display, version order, search limits, and display options.

## Motivation

Users have different preferences for how data is displayed. Reference plugin provides settings for customization. This improves user experience by allowing personalization.

## Settings to Add

### Display Preferences

```json
{
  "apicurioRegistry.display.useArtifactNames": {
    "type": "boolean",
    "default": false,
    "description": "Display artifact names instead of IDs in tree view"
  },
  "apicurioRegistry.display.reverseVersionOrder": {
    "type": "boolean",
    "default": false,
    "description": "Show newest versions first (default: oldest first)"
  },
  "apicurioRegistry.display.showArtifactCounts": {
    "type": "boolean",
    "default": true,
    "description": "Show artifact counts in group labels"
  },
  "apicurioRegistry.display.truncateDescriptions": {
    "type": "boolean",
    "default": true,
    "description": "Truncate long descriptions in tree view"
  },
  "apicurioRegistry.display.truncateLength": {
    "type": "number",
    "default": 30,
    "minimum": 10,
    "maximum": 100,
    "description": "Maximum length for truncated descriptions"
  }
}
```

### Search Preferences

```json
{
  "apicurioRegistry.search.defaultLimit": {
    "type": "number",
    "default": 50,
    "minimum": 1,
    "maximum": 1000,
    "description": "Maximum number of search results to return"
  }
}
```

## Implementation Plan

### 1. Add Settings to package.json

**File:** `package.json`

```json
{
  "contributes": {
    "configuration": {
      "title": "Apicurio Registry",
      "properties": {
        "apicurioRegistry.connections": { /* existing */ },
        "apicurioRegistry.display.useArtifactNames": {
          "type": "boolean",
          "default": false,
          "description": "Display artifact names instead of IDs in tree view"
        },
        "apicurioRegistry.display.reverseVersionOrder": {
          "type": "boolean",
          "default": false,
          "description": "Show newest versions first"
        },
        "apicurioRegistry.display.showArtifactCounts": {
          "type": "boolean",
          "default": true,
          "description": "Show artifact counts in group labels"
        },
        "apicurioRegistry.display.truncateDescriptions": {
          "type": "boolean",
          "default": true,
          "description": "Truncate long descriptions"
        },
        "apicurioRegistry.display.truncateLength": {
          "type": "number",
          "default": 30,
          "minimum": 10,
          "maximum": 100,
          "description": "Maximum description length"
        },
        "apicurioRegistry.search.defaultLimit": {
          "type": "number",
          "default": 50,
          "minimum": 1,
          "maximum": 1000,
          "description": "Default search result limit"
        }
      }
    }
  }
}
```

### 2. Update Tree Provider

**File:** `src/providers/registryTreeProvider.ts`

```typescript
private getConfig() {
    return vscode.workspace.getConfiguration('apicurioRegistry');
}

// In buildTree() method - apply preferences
private async buildTree(): Promise<RegistryItem[]> {
    const config = this.getConfig();
    const useNames = config.get<boolean>('display.useArtifactNames', false);
    const showCounts = config.get<boolean>('display.showArtifactCounts', true);
    const truncate = config.get<boolean>('display.truncateDescriptions', true);
    const truncateLength = config.get<number>('display.truncateLength', 30);
    const reverseVersions = config.get<boolean>('display.reverseVersionOrder', false);

    // Apply preferences when building tree items
    // ...
}

// In getTreeItem() for artifacts
const label = useNames && element.metadata?.name
    ? element.metadata.name
    : element.artifactId;

// For descriptions
let description = element.metadata?.description || '';
if (truncate && description.length > truncateLength) {
    description = description.substring(0, truncateLength) + '...';
}

// For versions
if (reverseVersions) {
    versions.reverse();
}
```

### 3. Add Configuration Change Listener

**File:** `src/extension.ts`

```typescript
export function activate(context: vscode.ExtensionContext) {
    // ...existing code...

    // Listen for configuration changes
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('apicurioRegistry.display')) {
            // Refresh tree when display settings change
            registryTreeProvider.refresh();
        }
    });

    context.subscriptions.push(configChangeListener);
}
```

### 4. Update Search Command

**File:** `src/commands/searchCommand.ts`

```typescript
export async function searchArtifactsCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    const config = vscode.workspace.getConfiguration('apicurioRegistry');
    const defaultLimit = config.get<number>('search.defaultLimit', 50);

    // Use defaultLimit in API call
    const results = await registryService.searchArtifacts(
        criteria,
        value,
        defaultLimit
    );
    // ...
}
```

## Testing Plan

### Unit Tests
- [ ] Test configuration reading
- [ ] Test label generation with name vs ID
- [ ] Test description truncation logic
- [ ] Test version ordering

### Integration Tests
- [ ] Test configuration change triggers refresh
- [ ] Test all settings combinations
- [ ] Test search with custom limit

### Manual Testing
- [ ] Change each setting and verify tree updates
- [ ] Test extreme values (min/max truncate length)
- [ ] Test with artifacts that have/don't have names
- [ ] Verify version order toggle works

## Reference

- **Reference plugin:** `package.json` configuration section
- **UX Comparison:** [docs/UX_COMPARISON.md](../../UX_COMPARISON.md) Section 5

## Success Criteria

- [ ] All settings defined in package.json
- [ ] Settings appear in VSCode preferences UI
- [ ] Tree view updates when settings change
- [ ] Name vs ID preference works
- [ ] Version order preference works
- [ ] Description truncation works
- [ ] Search limit preference works

---

_Created: 2025-10-24_
