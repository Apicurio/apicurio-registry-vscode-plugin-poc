# Task 008 - API v3.1 Compatibility Review and Documentation

**Priority:** Medium
**Estimated Time:** 2-3 hours
**Status:** Todo
**Type:** Research & Documentation

## Overview

Create comprehensive documentation of Apicurio Registry API v3.0 vs v3.1 differences, update all API calls to be v3.1-compliant, and add version detection/compatibility checks.

## Background

During Task 003 implementation and testing, two critical API compatibility issues were discovered with Apicurio Registry v3.1:

1. **"latest" version string not supported** - The `latest` keyword doesn't work as a version identifier
2. **Content endpoint separation** - Metadata vs content endpoints use different paths

These discoveries suggest there may be other v3.1 API changes we haven't encountered yet. This task ensures full v3.1 compatibility and documents all changes for future reference.

## Issues Discovered

### Issue #1: "latest" Version Not Supported

**Problem:**
```
GET /groups/{groupId}/artifacts/{artifactId}/versions/latest
→ 404 VersionNotFoundException: No version 'latest' found
```

**Impact:**
- `openArtifactCommand` was failing when trying to open latest version
- Any feature expecting to use "latest" as a version string would fail

**Current Solution (Implemented in Task 003):**
```typescript
// Get all versions and find latest by highest globalId
const versions = await registryService.getVersions(groupId, artifactId);
const latestVersion = versions.reduce((prev, current) => {
    return (current.globalId || 0) > (prev.globalId || 0) ? current : prev;
});
// Use actual version string
await registryService.getArtifactContent(groupId, artifactId, latestVersion.version);
```

**Affected Files:**
- ✅ `src/commands/openCommands.ts` - FIXED
- ❓ Other potential uses of "latest" to investigate

**Reference:** Commit `1279cf4`

### Issue #2: Metadata vs Content Endpoints

**Problem:**
```
GET /groups/{groupId}/artifacts/{artifactId}/versions/{version}
→ Returns version metadata (JSON with version info)

GET /groups/{groupId}/artifacts/{artifactId}/versions/{version}/content
→ Returns actual artifact content (YAML, JSON, etc.)
```

**Impact:**
- Users saw JSON metadata instead of artifact content
- Any feature trying to display or download content was broken

**Current Solution (Implemented in Task 003):**
```typescript
// Changed from:
const response = await this.client!.get(
    `/groups/.../artifacts/.../versions/${version}`
);

// To:
const response = await this.client!.get(
    `/groups/.../artifacts/.../versions/${version}/content`
);
```

**Affected Files:**
- ✅ `src/services/registryService.ts` - FIXED (getArtifactContent)
- ❓ `src/services/registryService.ts` - CHECK (updateArtifactContent)

**Reference:** Commit `4f45f9c`

## Objectives

1. **Comprehensive API Review**
   - Document all v3.0 vs v3.1 endpoint differences
   - Test all currently used endpoints against v3.1
   - Identify potential breaking changes we haven't hit yet

2. **Code Audit**
   - Review all API calls in the codebase
   - Ensure v3.1 compatibility everywhere
   - Add comments documenting v3.1-specific behavior

3. **Version Detection**
   - Add registry version detection
   - Store version info in RegistryService
   - Consider version-specific code paths if needed

4. **Documentation**
   - Create API compatibility matrix
   - Document all endpoint changes
   - Add migration guide for v3.0 → v3.1

5. **Testing**
   - Add tests for version detection
   - Test against both v3.0 and v3.1 if possible
   - Document tested versions

## Research Tasks

### 1. Endpoint Inventory

Create a complete list of all endpoints we use and verify each one:

**Metadata Endpoints:**
- [ ] `GET /system/info` - Get registry info
- [ ] `GET /groups` - List groups
- [ ] `GET /groups/{groupId}/artifacts` - List artifacts
- [ ] `GET /groups/{groupId}/artifacts/{artifactId}` - Get artifact metadata
- [ ] `GET /groups/{groupId}/artifacts/{artifactId}/versions` - List versions
- [ ] `GET /groups/{groupId}/artifacts/{artifactId}/versions/{version}` - Get version metadata

**Content Endpoints:**
- [ ] `GET /groups/{groupId}/artifacts/{artifactId}/versions/{version}/content` - Get content
- [ ] `PUT /groups/{groupId}/artifacts/{artifactId}/versions/{version}/content` - Update content (check if used)

**Create/Update Endpoints:**
- [ ] `POST /groups/{groupId}/artifacts` - Create artifact
- [ ] `POST /groups/{groupId}/artifacts/{artifactId}/versions` - Add version
- [ ] `PUT /groups/{groupId}/artifacts/{artifactId}/state` - Update artifact state (Task 003b)
- [ ] `PUT /groups/{groupId}/artifacts/{artifactId}/versions/{version}/state` - Update version state (Task 003b)

**Delete Endpoints (Task 007):**
- [ ] `DELETE /groups/{groupId}/artifacts/{artifactId}` - Delete artifact
- [ ] `DELETE /groups/{groupId}/artifacts/{artifactId}/versions/{version}` - Delete version

**Search Endpoints:**
- [ ] `GET /search/artifacts` - Search artifacts

**Other Potentially Used:**
- [ ] Branches endpoints (if v3.1 has branches feature)
- [ ] Comments endpoints (if available)
- [ ] Labels/properties endpoints

### 2. Version-Specific Behaviors

Research and document:

**"latest" Keyword:**
- [ ] Does v3.0 support "latest" as version string?
- [ ] Are there other special version keywords?
- [ ] What about "branch:latest" pattern?

**Content Endpoints:**
- [ ] Was `/versions/{version}/content` always separate in v3.0?
- [ ] Are there other metadata/content endpoint pairs?

**State Management:**
- [ ] Are state values same in v3.0 and v3.1?
- [ ] Are state transition rules different?

**API Response Formats:**
- [ ] Are response JSON structures identical?
- [ ] Any new optional fields in v3.1?
- [ ] Any deprecated fields from v3.0?

### 3. Version Detection Implementation

**Add to RegistryService:**
```typescript
export interface RegistryInfo {
    name: string;
    description: string;
    version: string;  // e.g., "3.1.1"
    builtOn: string;
}

export class RegistryService {
    private registryInfo: RegistryInfo | null = null;

    async getRegistryInfo(): Promise<RegistryInfo> {
        if (!this.registryInfo) {
            const response = await this.client!.get('/system/info');
            this.registryInfo = response.data;
        }
        return this.registryInfo;
    }

    async getVersion(): Promise<string> {
        const info = await this.getRegistryInfo();
        return info.version;
    }

    async isVersion31OrLater(): Promise<boolean> {
        const version = await this.getVersion();
        const [major, minor] = version.split('.').map(Number);
        return major > 3 || (major === 3 && minor >= 1);
    }
}
```

**Display in UI:**
- Show registry version in tree view (possibly as a tree item or status bar)
- Log version on connection

## Implementation Plan

### Phase 1: Research & Documentation (1 hour)

1. Test all endpoints against v3.1 registry
2. Document findings in compatibility matrix
3. Check Apicurio Registry v3.1 release notes
4. Check GitHub issues for breaking changes

### Phase 2: Code Audit (0.5 hour)

1. Search codebase for all API endpoint strings
2. Review each endpoint call for v3.1 compatibility
3. Add comments documenting v3.1-specific behavior
4. Flag any questionable usage

### Phase 3: Version Detection (0.5 hour)

1. Implement version detection in RegistryService
2. Add version display to UI
3. Add tests for version parsing
4. Consider version-based feature flags if needed

### Phase 4: Documentation (1 hour)

1. Create `API_COMPATIBILITY.md` with:
   - v3.0 vs v3.1 endpoint differences
   - Breaking changes list
   - Migration guide
   - Best practices for v3.1

2. Update `registryService.ts` JSDoc comments with version notes

3. Add to README:
   - Supported registry versions
   - Known compatibility issues

## Deliverables

### Documentation Files

1. **`docs/API_COMPATIBILITY.md`**
   - Complete endpoint comparison table
   - Breaking changes documentation
   - Migration guide
   - Code examples

2. **`docs/REGISTRY_VERSIONS.md`**
   - Tested versions list
   - Version-specific features
   - Deprecation warnings

3. **Updated README.md**
   - Add "Supported Versions" section
   - Link to compatibility docs

### Code Updates

1. **`src/services/registryService.ts`**
   - Add version detection methods
   - Add JSDoc comments noting v3.1 behavior
   - Ensure all endpoints use v3.1 paths

2. **Tests**
   - Add version detection tests
   - Mock different registry versions
   - Test compatibility layer

## Testing Checklist

- [ ] Test against Apicurio Registry 3.1.1
- [ ] Test against Apicurio Registry 3.0.x (if accessible)
- [ ] Verify all current features work
- [ ] Test version detection
- [ ] Test with version info displayed in UI

## Success Criteria

- [ ] Complete API endpoint compatibility matrix created
- [ ] All v3.1 differences documented
- [ ] Version detection implemented and tested
- [ ] No undocumented API calls in codebase
- [ ] All JSDoc comments updated with version notes
- [ ] Migration guide available for future developers
- [ ] UI displays registry version

## Future Considerations

### Version-Specific Code Paths

If v3.0 support is needed:
```typescript
async openArtifact(groupId: string, artifactId: string) {
    const isV31 = await this.isVersion31OrLater();

    if (isV31) {
        // v3.1: Must resolve latest version dynamically
        const versions = await this.getVersions(groupId, artifactId);
        const latest = this.findLatestVersion(versions);
        return this.getArtifactContent(groupId, artifactId, latest.version);
    } else {
        // v3.0: Can use 'latest' keyword (if supported)
        return this.getArtifactContent(groupId, artifactId, 'latest');
    }
}
```

### Registry Feature Detection

Beyond version numbers, detect capabilities:
```typescript
async supportsFeature(feature: 'branches' | 'comments' | 'latest-keyword'): Promise<boolean> {
    const version = await this.getVersion();

    switch (feature) {
        case 'latest-keyword':
            return this.isVersion30OrEarlier();
        case 'branches':
            return this.isVersion31OrLater();
        default:
            return false;
    }
}
```

## Resources

- Apicurio Registry v3.1 Release Notes
- Apicurio Registry API Documentation
- GitHub Issues for v3.1 breaking changes
- Registry OpenAPI spec comparison

## Related Tasks

- **Task 003:** Context Menus (Where issues were discovered)
- **Task 003b:** State and Download (Will use state endpoints)
- **Task 007:** Delete Operations (Will use delete endpoints)

## Notes

- This task is preventative - avoiding future API compatibility surprises
- Good documentation now saves debugging time later
- Version detection enables graceful degradation if needed
- May discover more v3.1 features we can leverage

## Time Breakdown

- Research & endpoint testing: 1 hour
- Code audit: 0.5 hour
- Version detection implementation: 0.5 hour
- Documentation writing: 1 hour
- **Total:** 2-3 hours
