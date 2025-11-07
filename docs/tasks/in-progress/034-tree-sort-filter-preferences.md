# Task 034: Tree Sort & Filter Preferences

**Status:** 📋 In Progress
**Priority:** 🟢 LOW (Phase 2 - Advanced Features - Polish)
**Estimated Effort:** 2-3 hours
**Phase:** Feature Parity Phase 2

## Overview

Add comprehensive sort and filter preferences for the tree view to give users control over how registry content is displayed. This completes the "Enhanced Tree View" feature by adding the remaining sort/filter capabilities beyond the existing `reverseVersionOrder` preference.

## Strategic Context

**Current State:**
- ✅ Enhanced tooltips implemented (Tasks 026-030, 031)
- ✅ Progressive disclosure with 4-level hierarchy (Task 033)
- ✅ Quick actions via context menus (Task 003)
- ✅ Basic preferences: useArtifactNames, reverseVersionOrder, showArtifactCounts, truncateDescriptions (Task 006)
- ❌ **MISSING:** Comprehensive sort/filter options for tree organization

**User Value:**
- Sort groups/artifacts alphabetically or by modification date
- Filter out disabled artifacts/versions to reduce clutter
- Filter by artifact type (OPENAPI, ASYNCAPI, etc.)
- Hide empty groups to improve navigation
- Customize tree view to match workflow preferences

**Dependencies:**
- Task 006 (User Preferences) - established preference pattern
- Task 033 (Branching) - tree hierarchy finalized

## Implementation Plan

### Phase 1: Add Sort Preferences (45min)

**File:** `package.json` - Add configuration settings

**New Preferences:**

```json
"apicurioRegistry.display.sortGroups": {
  "type": "string",
  "enum": ["alphabetical", "modified-date", "artifact-count"],
  "default": "alphabetical",
  "description": "How to sort groups in tree view"
},
"apicurioRegistry.display.sortArtifacts": {
  "type": "string",
  "enum": ["alphabetical", "modified-date", "artifact-type"],
  "default": "alphabetical",
  "description": "How to sort artifacts within groups"
},
"apicurioRegistry.display.sortBranches": {
  "type": "string",
  "enum": ["system-first", "alphabetical"],
  "default": "system-first",
  "description": "How to sort branches (system branches first or alphabetical)"
}
```

**Implementation:**
- Update `registryTreeProvider.ts` to read sort preferences
- Apply sorting in `getGroups()`, `getArtifacts()`, `getBranches()`
- Use existing configuration change listener to auto-refresh

---

### Phase 2: Add Filter Preferences (45min)

**File:** `package.json` - Add filter configuration

**New Preferences:**

```json
"apicurioRegistry.filter.hideDisabled": {
  "type": "boolean",
  "default": false,
  "description": "Hide disabled artifacts and versions from tree view"
},
"apicurioRegistry.filter.hideDeprecated": {
  "type": "boolean",
  "default": false,
  "description": "Hide deprecated versions from tree view"
},
"apicurioRegistry.filter.hideEmptyGroups": {
  "type": "boolean",
  "default": false,
  "description": "Hide groups that contain no artifacts"
},
"apicurioRegistry.filter.artifactTypes": {
  "type": "array",
  "items": {
    "type": "string",
    "enum": ["OPENAPI", "ASYNCAPI", "AVRO", "PROTOBUF", "JSON", "GRAPHQL", "WSDL", "XSD", "XML"]
  },
  "default": [],
  "description": "Show only these artifact types (empty = show all)"
}
```

**Implementation:**
- Filter in `getGroups()` - hide empty groups if enabled
- Filter in `getArtifacts()` - hide by state/type
- Filter in `getBranchVersions()` and `getVersions()` - hide by state
- Apply filters before returning items

---

### Phase 3: Implement Sorting Logic (30min)

**File:** `src/providers/registryTreeProvider.ts`

**Group Sorting:**
```typescript
private sortGroups(groups: RegistryItem[]): RegistryItem[] {
    const config = this.getConfig();
    const sortBy = config.get<string>('display.sortGroups', 'alphabetical');

    switch (sortBy) {
        case 'modified-date':
            return groups.sort((a, b) => {
                const dateA = new Date(a.metadata?.modifiedOn || 0).getTime();
                const dateB = new Date(b.metadata?.modifiedOn || 0).getTime();
                return dateB - dateA; // Newest first
            });
        case 'artifact-count':
            return groups.sort((a, b) => {
                const countA = a.metadata?.artifactCount || 0;
                const countB = b.metadata?.artifactCount || 0;
                return countB - countA; // Most artifacts first
            });
        case 'alphabetical':
        default:
            return groups.sort((a, b) => a.label.localeCompare(b.label));
    }
}
```

**Artifact Sorting:**
```typescript
private sortArtifacts(artifacts: RegistryItem[]): RegistryItem[] {
    const config = this.getConfig();
    const sortBy = config.get<string>('display.sortArtifacts', 'alphabetical');

    switch (sortBy) {
        case 'modified-date':
            return artifacts.sort((a, b) => {
                const dateA = new Date(a.metadata?.modifiedOn || 0).getTime();
                const dateB = new Date(b.metadata?.modifiedOn || 0).getTime();
                return dateB - dateA;
            });
        case 'artifact-type':
            return artifacts.sort((a, b) => {
                const typeA = a.metadata?.artifactType || '';
                const typeB = b.metadata?.artifactType || '';
                return typeA.localeCompare(typeB);
            });
        case 'alphabetical':
        default:
            return artifacts.sort((a, b) => a.label.localeCompare(b.label));
    }
}
```

**Branch Sorting:**
```typescript
private sortBranches(branches: RegistryItem[]): RegistryItem[] {
    const config = this.getConfig();
    const sortBy = config.get<string>('display.sortBranches', 'system-first');

    if (sortBy === 'alphabetical') {
        return branches.sort((a, b) => a.label.localeCompare(b.label));
    } else {
        // system-first (default, already implemented in Task 033)
        return branches.sort((a, b) => {
            if (a.metadata?.systemDefined && !b.metadata?.systemDefined) return -1;
            if (!a.metadata?.systemDefined && b.metadata?.systemDefined) return 1;
            return a.label.localeCompare(b.label);
        });
    }
}
```

---

### Phase 4: Implement Filtering Logic (30min)

**File:** `src/providers/registryTreeProvider.ts`

**Filter Groups:**
```typescript
private filterGroups(groups: RegistryItem[]): RegistryItem[] {
    const config = this.getConfig();
    const hideEmpty = config.get<boolean>('filter.hideEmptyGroups', false);

    if (hideEmpty) {
        return groups.filter(g => (g.metadata?.artifactCount || 0) > 0);
    }
    return groups;
}
```

**Filter Artifacts:**
```typescript
private filterArtifacts(artifacts: RegistryItem[]): RegistryItem[] {
    const config = this.getConfig();
    const hideDisabled = config.get<boolean>('filter.hideDisabled', false);
    const allowedTypes = config.get<string[]>('filter.artifactTypes', []);

    let filtered = artifacts;

    if (hideDisabled) {
        filtered = filtered.filter(a => a.metadata?.state !== 'DISABLED');
    }

    if (allowedTypes.length > 0) {
        filtered = filtered.filter(a =>
            allowedTypes.includes(a.metadata?.artifactType || '')
        );
    }

    return filtered;
}
```

**Filter Versions:**
```typescript
private filterVersions(versions: RegistryItem[]): RegistryItem[] {
    const config = this.getConfig();
    const hideDisabled = config.get<boolean>('filter.hideDisabled', false);
    const hideDeprecated = config.get<boolean>('filter.hideDeprecated', false);

    let filtered = versions;

    if (hideDisabled) {
        filtered = filtered.filter(v => v.metadata?.state !== 'DISABLED');
    }

    if (hideDeprecated) {
        filtered = filtered.filter(v => v.metadata?.state !== 'DEPRECATED');
    }

    return filtered;
}
```

---

### Phase 5: Update Tree Provider Methods (30min)

**Integrate sort/filter into existing methods:**

```typescript
private async getGroups(): Promise<RegistryItem[]> {
    const groups = await this.registryService.searchGroups();

    // ... existing code to create RegistryItem objects ...

    // Apply filters and sorting
    let filtered = this.filterGroups(groupsWithRules);
    let sorted = this.sortGroups(filtered);

    return sorted;
}

private async getArtifacts(groupId: string): Promise<RegistryItem[]> {
    const artifacts = await this.registryService.getArtifacts(groupId);

    // ... existing code to create RegistryItem objects ...

    // Apply filters and sorting
    let filtered = this.filterArtifacts(artifactsWithRules);
    let sorted = this.sortArtifacts(filtered);

    return sorted;
}

private async getBranches(groupId: string, artifactId: string): Promise<RegistryItem[]> {
    const branches = await this.registryService.getBranches(groupId, artifactId);

    // ... existing code to create RegistryItem objects ...

    // Apply sorting (filtering not needed for branches)
    let sorted = this.sortBranches(branchItems);

    return sorted;
}

private async getBranchVersions(groupId: string, artifactId: string, branchId: string): Promise<RegistryItem[]> {
    let versions = await this.registryService.getBranchVersions(groupId, artifactId, branchId);

    // ... existing code for reverseVersionOrder ...

    // Create RegistryItem objects
    const versionItems = versions.map(version => new RegistryItem(...));

    // Apply filters
    let filtered = this.filterVersions(versionItems);

    return filtered;
}
```

---

## Success Criteria

**Functional:**
- ✅ Users can sort groups by: alphabetical, modification date, artifact count
- ✅ Users can sort artifacts by: alphabetical, modification date, type
- ✅ Users can sort branches by: system-first (default), alphabetical
- ✅ Users can hide disabled artifacts/versions
- ✅ Users can hide deprecated versions
- ✅ Users can hide empty groups
- ✅ Users can filter by artifact types
- ✅ Tree view auto-refreshes when preferences change
- ✅ All preferences have sensible defaults

**UX:**
- ✅ Preferences are in VSCode settings UI under "Apicurio Registry"
- ✅ Preference descriptions are clear and helpful
- ✅ Changes take effect immediately (no reload required)
- ✅ Filters don't break search functionality
- ✅ Sort/filter state persists across sessions

**Quality:**
- ✅ TypeScript compilation successful
- ✅ No new linting errors
- ✅ Existing tests still pass
- ✅ Manual testing confirms all sort/filter options work

---

## Configuration Reference

**Final Configuration Structure:**

```json
"apicurioRegistry.display": {
  "useArtifactNames": boolean,           // Existing (Task 006)
  "reverseVersionOrder": boolean,        // Existing (Task 006)
  "showArtifactCounts": boolean,         // Existing (Task 006)
  "truncateDescriptions": boolean,       // Existing (Task 006)
  "truncateLength": number,              // Existing (Task 006)
  "sortGroups": enum,                    // NEW
  "sortArtifacts": enum,                 // NEW
  "sortBranches": enum                   // NEW
},
"apicurioRegistry.filter": {
  "hideDisabled": boolean,               // NEW
  "hideDeprecated": boolean,             // NEW
  "hideEmptyGroups": boolean,            // NEW
  "artifactTypes": string[]              // NEW
}
```

---

## Files to Modify

**Modified Files:**
1. `package.json` (+60 lines - 7 new configuration properties)
2. `src/providers/registryTreeProvider.ts` (+120 lines - 3 sort methods, 3 filter methods, integration)

**Total:** 2 files, ~180 lines

---

## Testing Plan

### Manual Testing

**Sort Preferences:**
1. Change "Sort Groups" to "Modified Date" → verify groups sort by date (newest first)
2. Change "Sort Groups" to "Artifact Count" → verify groups sort by count (most first)
3. Change "Sort Artifacts" to "Modified Date" → verify artifacts sort by date
4. Change "Sort Artifacts" to "Artifact Type" → verify artifacts group by type
5. Change "Sort Branches" to "Alphabetical" → verify system branches no longer appear first

**Filter Preferences:**
1. Enable "Hide Disabled" → verify disabled artifacts/versions disappear
2. Enable "Hide Deprecated" → verify deprecated versions disappear
3. Enable "Hide Empty Groups" → verify groups with 0 artifacts disappear
4. Set "Artifact Types" to ["OPENAPI"] → verify only OpenAPI artifacts show
5. Set "Artifact Types" to ["OPENAPI", "ASYNCAPI"] → verify both types show

**Integration:**
1. Enable multiple filters → verify they work together
2. Change sort while filters active → verify both apply
3. Clear filters → verify all content returns
4. Verify tree auto-refreshes when preferences change

**Edge Cases:**
- Empty registry with filters enabled
- All artifacts disabled with hideDisabled enabled
- All groups empty with hideEmptyGroups enabled
- Invalid artifact type in filter array

---

## Risk Assessment

**Technical Risks:**
- ✅ LOW: Simple preference additions, no API changes
- ✅ LOW: Sorting/filtering logic is straightforward
- ⚠️ MEDIUM: Performance impact if many items filtered/sorted

**UX Risks:**
- ⚠️ MEDIUM: Too many preferences might overwhelm users
- ✅ LOW: Sensible defaults prevent confusion

**Mitigation:**
- Keep defaults simple (alphabetical sort, no filters)
- Group related preferences together
- Use clear preference names and descriptions
- Test performance with large registries (1000+ artifacts)

---

## Future Enhancements

**Beyond This Task:**
- Search within tree view (Cmd+F in tree)
- Save/load filter presets
- Filter by labels (key=value patterns)
- Sort by custom criteria (user-defined)
- Tree view layout modes (compact, comfortable, spacious)
- Pin favorite groups/artifacts to top

---

## References

- **Task 006:** User Preferences - established preference pattern
- **Task 033:** Branching Support - tree hierarchy finalized
- **FEATURE_ROADMAP.md:** Enhanced Tree View specification

---

**Created:** 2025-11-07
**Target Completion:** 2025-11-07 (same day, 2-3h)
**Status:** 📋 TODO - Ready to start
