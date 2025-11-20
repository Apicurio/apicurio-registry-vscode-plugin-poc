# Apicurio Registry API v3.1 Compatibility Guide

**Last Updated:** 2025-11-05
**Registry Version Tested:** Apicurio Registry 3.1.x
**Extension Version:** 1.0.0

## Overview

This document provides a comprehensive analysis of Apicurio Registry API v3.0 vs v3.1 differences, ensuring full compatibility with the VSCode extension.

## Executive Summary

### Critical Changes in v3.1

1. **❌ "latest" version keyword not supported** - Must resolve to actual version string
2. **✅ Content endpoint separation** - Metadata and content use different paths
3. **⚠️ Inconsistent content update endpoints** - Need to verify PUT behavior

### Compatibility Status

| Feature | v3.0 | v3.1 | Status |
|---------|------|------|--------|
| List groups | ✅ | ✅ | Compatible |
| List artifacts | ✅ | ✅ | Compatible |
| List versions | ✅ | ✅ | Compatible |
| Get metadata | ✅ | ✅ | Compatible |
| Get content | ✅ | ✅ | **Fixed** (append /content) |
| Create artifact | ✅ | ✅ | Compatible |
| Create version | ✅ | ✅ | Compatible |
| Update state | ✅ | ✅ | Compatible |
| Delete operations | ✅ | ✅ | Compatible |
| Draft support | ❌ | ✅ | v3.1 only |
| "latest" keyword | ✅ | ❌ | **Workaround** (resolve dynamically) |

---

## Endpoint Inventory

### Read Endpoints (Metadata)

#### 1. List Groups
```http
GET /apis/registry/v3/groups
```
**Status:** ✅ Compatible
**Used in:** `RegistryService.getGroups()`, `RegistryService.searchGroups()`
**Notes:** No known v3.1 changes

#### 2. List Artifacts
```http
GET /apis/registry/v3/groups/{groupId}/artifacts
```
**Status:** ✅ Compatible
**Used in:** `RegistryService.getArtifacts()`
**Notes:** No known v3.1 changes

#### 3. List Versions
```http
GET /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/versions
```
**Status:** ✅ Compatible
**Used in:** `RegistryService.getVersions()`
**Notes:** No known v3.1 changes
**v3.1 Behavior:** Used to resolve "latest" version dynamically

#### 4. Get Version Metadata
```http
GET /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/versions/{version}
```
**Status:** ✅ Compatible
**Used in:** `RegistryService.getVersionMetadata()`
**Returns:** JSON metadata (version info, state, timestamps, etc.)
**Notes:** Returns metadata ONLY, not content

#### 5. Search Artifacts
```http
GET /apis/registry/v3/search/artifacts
```
**Status:** ✅ Compatible
**Used in:** `RegistryService.searchArtifacts()`
**Notes:** No known v3.1 changes

#### 6. Get UI Configuration
```http
GET /apis/registry/v3/system/uiConfig
```
**Status:** ✅ Compatible
**Used in:** `RegistryService.getUIConfig()`, `RegistryService.isDraftSupportEnabled()`
**Notes:** v3.1 adds `features.draftMutability` flag

---

### Read Endpoints (Content)

#### 7. Get Artifact Content
```http
GET /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/versions/{version}/content
```
**Status:** ✅ **Fixed in Task 003** (commit `4f45f9c`)
**Used in:** `RegistryService.getArtifactContent()`
**Returns:** Raw content (YAML, JSON, XML, etc.)

**⚠️ Breaking Change:**
```typescript
// ❌ v3.0 (may have worked without /content)
GET /groups/{groupId}/artifacts/{artifactId}/versions/{version}
// Returns: JSON metadata

// ✅ v3.1 (must use /content suffix)
GET /groups/{groupId}/artifacts/{artifactId}/versions/{version}/content
// Returns: Raw artifact content
```

**Fix Applied:**
- Line 192-193 in `registryService.ts` now appends `/content` to URL
- Header: `Accept: */*` to handle any content type
- Content-Type detection from response headers

---

### Write Endpoints

#### 8. Create Artifact
```http
POST /apis/registry/v3/groups/{groupId}/artifacts
```
**Status:** ✅ Compatible
**Used in:** `RegistryService.createArtifact()`
**Notes:** No known v3.1 changes

#### 9. Create Version / Draft
```http
POST /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/versions
```
**Status:** ✅ Compatible
**Used in:** `RegistryService.createDraftVersion()`
**Body:** `{ content, version?, isDraft?, name?, description?, labels? }`
**Notes:** v3.1 adds `isDraft: true` support for draft versions

#### 10. Update Artifact State
```http
PUT /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/state
```
**Status:** ✅ Compatible
**Used in:** `RegistryService.updateArtifactState()`
**Body:** `{ state: "ENABLED" | "DISABLED" | "DEPRECATED" }`
**Notes:** No known v3.1 changes

#### 11. Update Version State
```http
PUT /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/versions/{version}/state
```
**Status:** ✅ Compatible
**Used in:** `RegistryService.updateVersionState()`, `RegistryService.finalizeDraftVersion()`
**Body:** `{ state: "ENABLED" | "DISABLED" | "DEPRECATED" | "DRAFT" }`
**Notes:** v3.1 adds "DRAFT" state support

#### 12. Update Version Content (Legacy)
```http
PUT /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/versions/{version}
```
**Status:** ⚠️ **INCONSISTENT** - Needs investigation
**Used in:** `RegistryService.updateArtifactContent()` (line 223)
**Body:** Raw content (string)
**Headers:** `Content-Type: <artifactType>`

**⚠️ Potential Issue:**
- This endpoint exists in the codebase but may not work correctly
- Conflicts with GET endpoint returning metadata
- May need `/content` suffix like GET endpoint

#### 13. Update Draft Content (New)
```http
PUT /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/versions/{version}/content
```
**Status:** ✅ Compatible (v3.1 draft feature)
**Used in:** `RegistryService.updateDraftContent()` (line 674)
**Body:** `{ content: <string> }`
**Notes:** Only works for versions in DRAFT state

#### 14. Update Draft Metadata
```http
PUT /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/versions/{version}/meta
```
**Status:** ✅ Compatible (v3.1 draft feature)
**Used in:** `RegistryService.updateDraftMetadata()`
**Body:** `{ name?, description?, labels? }`
**Notes:** Only works for versions in DRAFT state

---

### Delete Endpoints

#### 15. Delete Group
```http
DELETE /apis/registry/v3/groups/{groupId}
```
**Status:** ✅ Compatible
**Used in:** `RegistryService.deleteGroup()`
**Notes:** No known v3.1 changes

#### 16. Delete Artifact
```http
DELETE /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}
```
**Status:** ✅ Compatible
**Used in:** `RegistryService.deleteArtifact()`
**Notes:** No known v3.1 changes

#### 17. Delete Version
```http
DELETE /apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/versions/{version}
```
**Status:** ✅ Compatible
**Used in:** `RegistryService.deleteVersion()`, `RegistryService.discardDraftVersion()`
**Notes:** No known v3.1 changes
**v3.1 Behavior:** Can delete DRAFT versions; published versions protected

---

## Known Issues & Workarounds

### Issue #1: "latest" Version Not Supported

**Problem:**
```http
GET /groups/{groupId}/artifacts/{artifactId}/versions/latest
→ 404 VersionNotFoundException: No version 'latest' found
```

**Root Cause:**
v3.1 does not support "latest" as a special keyword for version identifiers.

**Workaround (Implemented):**
```typescript
// Get all versions and find latest by highest globalId
const versions = await registryService.getVersions(groupId, artifactId);
const latestVersion = versions.reduce((prev, current) => {
    return (current.globalId || 0) > (prev.globalId || 0) ? current : prev;
});
// Use actual version string
await registryService.getArtifactContent(groupId, artifactId, latestVersion.version);
```

**Affected Code:**
- ✅ `src/commands/openCommands.ts` - FIXED (commit `1279cf4`)

**Status:** Resolved

---

### Issue #2: Content Endpoint Separation

**Problem:**
```http
GET /groups/{groupId}/artifacts/{artifactId}/versions/{version}
→ Returns JSON metadata, not artifact content
```

**Expected:**
```http
GET /groups/{groupId}/artifacts/{artifactId}/versions/{version}/content
→ Returns raw artifact content (YAML, JSON, etc.)
```

**Root Cause:**
v3.1 separates metadata and content into different endpoints.

**Fix Applied:**
```typescript
// ✅ Correct v3.1 usage (line 192-193)
const response = await this.client!.get(
    `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}/content`,
    { headers: { 'Accept': '*/*' } }
);
```

**Affected Code:**
- ✅ `src/services/registryService.ts:getArtifactContent()` - FIXED (commit `4f45f9c`)

**Status:** Resolved

---

### Issue #3: Inconsistent Content Update Endpoints

**Problem:**
Two different methods for updating content:

1. **`updateArtifactContent()` (line 223):**
   ```http
   PUT /groups/{groupId}/artifacts/{artifactId}/versions/{version}
   Body: raw content (string)
   ```

2. **`updateDraftContent()` (line 674):**
   ```http
   PUT /groups/{groupId}/artifacts/{artifactId}/versions/{version}/content
   Body: { content: <string> }
   ```

**Questions:**
- ❓ Does PUT `.../versions/{version}` (without /content) work in v3.1?
- ❓ Should all content updates use the `/content` suffix?
- ❓ Is `updateArtifactContent()` ever used in the codebase?

**Investigation Needed:**
- Search codebase for calls to `updateArtifactContent()`
- Test PUT `.../versions/{version}` against v3.1 registry
- Verify expected behavior vs actual behavior
- Align both methods to use consistent endpoint

**Status:** ⚠️ **Needs Investigation**

---

## Version Detection

### System Info Endpoint

```http
GET /apis/registry/v3/system/info
```

**Response:**
```json
{
    "name": "Apicurio Registry",
    "description": "High performance, runtime registry...",
    "version": "3.1.1",
    "builtOn": "2024-10-15T10:30:00Z"
}
```

**Implementation Plan:**
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

**Status:** 📋 To be implemented (Phase 3)

---

## Migration Guide

### For v3.0 Codebases Migrating to v3.1

#### 1. Replace "latest" Version Usage
```typescript
// ❌ Don't use "latest" keyword
const content = await getArtifactContent(groupId, artifactId, "latest");

// ✅ Resolve latest version dynamically
const versions = await getVersions(groupId, artifactId);
const latest = versions.reduce((p, c) => (c.globalId || 0) > (p.globalId || 0) ? c : p);
const content = await getArtifactContent(groupId, artifactId, latest.version);
```

#### 2. Always Append /content to Get Content
```typescript
// ❌ Don't use metadata endpoint for content
GET /groups/{groupId}/artifacts/{artifactId}/versions/{version}

// ✅ Use content endpoint
GET /groups/{groupId}/artifacts/{artifactId}/versions/{version}/content
```

#### 3. Use Draft Features (v3.1 only)
```typescript
// Create draft version
await createDraftVersion(groupId, artifactId, {
    content: "...",
    version: "2.0.0",
    isDraft: true  // v3.1 feature
});

// Update draft content (only works for DRAFT state)
await updateDraftContent(groupId, artifactId, version, newContent);

// Finalize draft
await finalizeDraftVersion(groupId, artifactId, version, "ENABLED");
```

---

## Testing Matrix

### Tested Endpoints (v3.1.1)

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| /groups | GET | ✅ Tested | Works |
| /groups/{gid}/artifacts | GET | ✅ Tested | Works |
| /groups/{gid}/artifacts/{aid}/versions | GET | ✅ Tested | Works |
| /groups/{gid}/artifacts/{aid}/versions/{v} | GET | ✅ Tested | Returns metadata |
| /groups/{gid}/artifacts/{aid}/versions/{v}/content | GET | ✅ Tested | Returns content |
| /groups/{gid}/artifacts | POST | ✅ Tested | Works |
| /groups/{gid}/artifacts/{aid}/versions | POST | ✅ Tested | Draft support |
| /groups/{gid}/artifacts/{aid}/state | PUT | ✅ Tested | Works |
| /groups/{gid}/artifacts/{aid}/versions/{v}/state | PUT | ✅ Tested | Draft transitions |
| /groups/{gid}/artifacts/{aid}/versions/{v}/content | PUT | ✅ Tested | Draft only |
| /groups/{gid}/artifacts/{aid}/versions/{v}/meta | PUT | ✅ Tested | Draft metadata |
| /groups/{gid}/artifacts/{aid} | DELETE | ✅ Tested | Works |
| /groups/{gid}/artifacts/{aid}/versions/{v} | DELETE | ✅ Tested | Works |
| /search/artifacts | GET | ✅ Tested | Works |
| /system/uiConfig | GET | ✅ Tested | Draft flag |
| /system/info | GET | ⏳ Not Tested | To be added |
| /groups/{gid}/artifacts/{aid}/versions/{v} | PUT | ⚠️ Not Tested | Legacy? |

---

## Best Practices for v3.1

### 1. Never Use "latest" Keyword
Always resolve the latest version dynamically using `getVersions()` and sorting by `globalId`.

### 2. Always Use /content Suffix for Content Operations
- **GET content:** Always append `/content`
- **PUT content:** Use `/content` for draft updates

### 3. Check Draft Support Before Using Draft Features
```typescript
const draftSupported = await registryService.isDraftSupportEnabled();
if (draftSupported) {
    // Use draft features
}
```

### 4. Use Consistent Error Handling
v3.1 returns structured error responses:
```json
{
    "message": "Human-readable error message",
    "detail": "Additional details",
    "error_code": 404
}
```

### 5. Encode URL Parameters
Always use `encodeURIComponent()` for groupId, artifactId, and version:
```typescript
const encodedGroupId = encodeURIComponent(groupId);
const encodedArtifactId = encodeURIComponent(artifactId);
```

---

## Open Questions

1. ❓ **Is PUT `.../versions/{version}` (without /content) supported in v3.1?**
   - Currently implemented in `updateArtifactContent()` (line 223)
   - Not used anywhere in codebase
   - May be legacy endpoint

2. ❓ **Should published version content ever be updatable?**
   - Only draft versions seem to allow content updates
   - Need to confirm with registry documentation

3. ❓ **Are there other special version keywords besides "latest"?**
   - "branch:latest" pattern?
   - Any other aliases?

4. ❓ **Does /system/info endpoint exist and return version?**
   - Need to test against v3.1 registry
   - Will enable version detection feature

---

## References

- [Apicurio Registry Documentation](https://www.apicur.io/registry/docs/)
- [Registry API OpenAPI Spec](https://github.com/Apicurio/apicurio-registry/blob/main/app/src/main/resources/apis/registry/v3/openapi.json)
- Task 003: Context Menus (where issues were discovered)
- Commit `1279cf4`: "latest" keyword fix
- Commit `4f45f9c`: Content endpoint fix

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Next Review:** After Phase 3 implementation
**Maintainer:** VSCode Extension Development Team
