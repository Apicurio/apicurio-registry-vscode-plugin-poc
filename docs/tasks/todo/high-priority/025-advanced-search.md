# Task 025: Advanced Search

**Status:** Todo
**Priority:** 🔴 High
**Estimated Effort:** 2-3h
**Feature Parity Phase:** Phase 1 - Core Operations

---

## Overview

Implement advanced multi-field search functionality to achieve feature parity with the Apicurio Registry Web UI. Current search only supports single-criterion filtering; this task adds multi-field search, label filtering, version search, and group search.

**Related:** [FEATURE_GAP_ANALYSIS.md](../../FEATURE_GAP_ANALYSIS.md#2-advanced-search-critical) - Gap #2

---

## Current State

**What Works:**
- ✅ Basic search command (Task 001) - single criterion
- ✅ Filter by: name, group, description, type, state, labels
- ✅ Search result limit (configurable via Task 006)
- ✅ Tree view filtering

**What's Missing:**
- ❌ Multi-field search (combine multiple criteria)
- ❌ Version search (only artifacts searchable)
- ❌ Group search (only artifacts searchable)
- ❌ Label filtering (key:value format)
- ❌ Advanced sort options
- ❌ Saved searches

---

## Goals

### Primary Goals

1. **Multi-Field Search** - Combine multiple search criteria simultaneously
2. **Label Filtering** - Search by labels in key:value format
3. **Version Search** - Search for specific versions across artifacts
4. **Group Search** - Search for groups by ID, description, labels

### Secondary Goals

5. **Enhanced UI** - Better search experience in VSCode
6. **Clear Results** - Organized presentation of search results

---

## Requirements

### Functional Requirements

**FR-1: Multi-Field Artifact Search**
- Allow user to specify multiple criteria: name AND description AND labels
- Combine criteria with AND logic
- Display active filters in search results
- Clear individual or all filters

**FR-2: Label Filtering**
- Accept labels in "key:value" format
- Support multiple label filters
- Validate label format before search
- Show label chips in results

**FR-3: Version Search**
- Search versions by version identifier
- Search versions by name, description
- Search versions by labels
- Show version results with artifact context (groupId/artifactId)

**FR-4: Group Search**
- Search groups by group ID
- Search groups by description
- Search groups by labels
- Show artifact counts in results

### Non-Functional Requirements

**NFR-1: Performance**
- Search completes within 2 seconds for 1000+ results
- Pagination respected (limit from Task 006 preference)

**NFR-2: UX**
- Follows VSCode QuickPick patterns
- Keyboard navigable
- Clear error messages
- Results sortable

---

## Implementation Plan

### Phase 1: Multi-Field Artifact Search (1-1.5h)

**Step 1:** Enhance Search UI
```typescript
// src/commands/searchCommand.ts

export async function searchArtifactsCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    // Step 1: Ask for search mode
    const searchMode = await vscode.window.showQuickPick(
        [
            { label: 'Artifact Search', value: 'artifact' },
            { label: 'Version Search', value: 'version' },
            { label: 'Group Search', value: 'group' }
        ],
        { placeHolder: 'Select search type' }
    );

    if (!searchMode) return;

    // Step 2: Collect criteria based on mode
    const criteria = await collectSearchCriteria(searchMode.value);

    // Step 3: Execute search
    const results = await executeSearch(registryService, searchMode.value, criteria);

    // Step 4: Display results
    await displaySearchResults(treeProvider, results, criteria);
}
```

**Step 2:** Add Multi-Field Input
```typescript
async function collectSearchCriteria(mode: string): Promise<SearchCriteria> {
    const criteria: Record<string, string> = {};

    while (true) {
        const field = await vscode.window.showQuickPick(
            [
                { label: 'Name', value: 'name' },
                { label: 'Description', value: 'description' },
                { label: 'Labels (key:value)', value: 'labels' },
                { label: 'Type', value: 'artifactType' },
                { label: '✅ Done - Search Now', value: 'done' }
            ],
            { placeHolder: 'Add search criterion' }
        );

        if (!field || field.value === 'done') break;

        const value = await vscode.window.showInputBox({
            prompt: `Enter ${field.label}`,
            validateInput: field.value === 'labels' ? validateLabelFormat : undefined
        });

        if (value) {
            criteria[field.value] = value;
        }
    }

    return criteria;
}
```

**Step 3:** Validate Labels
```typescript
function validateLabelFormat(input: string): string | undefined {
    // Accept "key:value" or "key=value" format
    if (!input.includes(':') && !input.includes('=')) {
        return 'Labels must be in format "key:value" or "key=value"';
    }
    return undefined;
}
```

### Phase 2: Version Search (0.5-1h)

**Step 1:** Add Version Search Endpoint
```typescript
// src/services/registryService.ts

async searchVersions(
    searchParams: Record<string, string>,
    limit?: number
): Promise<SearchedVersion[]> {
    this.ensureConnected();

    try {
        const params: Record<string, any> = {
            limit: limit || 100,
            offset: 0
        };

        Object.keys(searchParams).forEach(key => {
            if (searchParams[key]) {
                params[key] = searchParams[key];
            }
        });

        const response = await this.client!.get('/search/versions', {
            params
        });

        return response.data.versions || [];
    } catch (error) {
        console.error('Error searching versions:', error);
        throw new Error(`Failed to search versions: ${error}`);
    }
}
```

**Step 2:** Display Version Results
```typescript
function displayVersionResults(
    results: SearchedVersion[],
    criteria: SearchCriteria
): void {
    const items = results.map(v => ({
        label: `${v.groupId}/${v.artifactId}@${v.version}`,
        description: v.state,
        detail: `Global ID: ${v.globalId}, Created: ${v.createdOn}`
    }));

    vscode.window.showQuickPick(items, {
        placeHolder: `Found ${items.length} versions matching criteria`
    });
}
```

### Phase 3: Group Search (0.5h)

**Step 1:** Add Group Search Endpoint
```typescript
// src/services/registryService.ts

async searchGroupsAdvanced(
    searchParams: Record<string, string>,
    limit?: number
): Promise<SearchedGroup[]> {
    // Similar to searchVersions but for groups
    // Endpoint: GET /search/groups
}
```

**Step 2:** Display Group Results
```typescript
function displayGroupResults(
    results: SearchedGroup[],
    criteria: SearchCriteria
): void {
    const items = results.map(g => ({
        label: g.groupId || 'default',
        description: `${g.artifactCount} artifacts`,
        detail: g.description
    }));

    vscode.window.showQuickPick(items, {
        placeHolder: `Found ${items.length} groups matching criteria`
    });
}
```

---

## Testing Strategy

### Unit Tests (TDD Approach)

**Test File:** `src/commands/__tests__/advancedSearchCommand.test.ts`

```typescript
describe('Advanced Search Command', () => {
    describe('Multi-Field Search', () => {
        it('should search by name AND description', async () => {
            // RED: Test multi-field search
            // GREEN: Implement multi-field logic
            // REFACTOR: Optimize query building
        });

        it('should search by labels in key:value format', async () => {
            // Test label parsing and filtering
        });

        it('should validate label format', async () => {
            // Test invalid formats rejected
        });
    });

    describe('Version Search', () => {
        it('should search versions by version identifier', async () => {
            // Test version search endpoint
        });

        it('should display version results with context', async () => {
            // Test groupId/artifactId shown
        });
    });

    describe('Group Search', () => {
        it('should search groups by description', async () => {
            // Test group search endpoint
        });

        it('should display artifact counts', async () => {
            // Test count display
        });
    });
});
```

### Manual Testing

**Test Scenarios:**

1. **Multi-Field Artifact Search**
   - Search by name="User" AND type="OPENAPI"
   - Verify only matching artifacts shown
   - Test with 3+ criteria

2. **Label Filtering**
   - Search by labels="env:prod"
   - Search by labels="team:backend"
   - Test invalid format shows error

3. **Version Search**
   - Search versions by version="1.0.0"
   - Verify groupId/artifactId context shown
   - Test with labels filter

4. **Group Search**
   - Search groups by description
   - Verify artifact counts displayed
   - Test label filtering

---

## Success Criteria

- [ ] Can search artifacts with multiple criteria
- [ ] Can search versions across artifacts
- [ ] Can search groups by various fields
- [ ] Label filtering works in key:value format
- [ ] Search results clearly show active filters
- [ ] All tests passing (15+ tests)
- [ ] Manual testing completed
- [ ] Documentation updated

---

## Dependencies

**Prerequisites:**
- Task 001 (Search Command) - ✅ Complete
- Task 006 (User Preferences) - ✅ Complete (search limit)

**API Endpoints:**
- `GET /search/artifacts` - ✅ Existing
- `GET /search/versions` - Check availability
- `GET /search/groups` - Check availability

**Models:**
- `SearchedArtifact` - ✅ Existing
- `SearchedVersion` - ✅ Existing
- `SearchedGroup` - ✅ Existing

---

## Notes

### API Compatibility

Check Apicurio Registry API v3.1 for search endpoints:
- `/search/artifacts` - ✅ Confirmed available
- `/search/versions` - Verify availability
- `/search/groups` - Verify availability

If version/group search endpoints not available, use existing endpoints and filter client-side.

### UX Patterns

Follow VSCode patterns from Task 001:
- QuickPick for mode selection
- InputBox for criterion values
- QuickPick for results display
- Clear error messages

### Performance

- Respect search limit from Task 006 preference
- Show loading indicator for slow searches
- Pagination for large result sets

---

## Future Enhancements

**Not in scope for this task:**

- Saved searches (Phase 2 feature)
- Search history
- Advanced sorting UI
- Export search results
- Search by date range
- Full-text search

These can be added in Phase 2 if needed.

---

## Related Tasks

- Task 001: Search Command (foundation)
- Task 006: User Preferences (search limit)
- Task 026: Label Management (label editing)
- FEATURE_ROADMAP Phase 1.1: Advanced Search

---

**Created:** 2025-11-05
**Updated:** 2025-11-05
**Author:** Development Team
