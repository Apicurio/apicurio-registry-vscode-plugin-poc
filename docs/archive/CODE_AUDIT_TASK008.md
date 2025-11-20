# Code Audit Report - Task 008: API v3.1 Compatibility

**Date:** 2025-11-05
**Auditor:** Claude Code
**Scope:** All API endpoint usage for v3.1 compatibility

---

## Executive Summary

**Status:** ⚠️ 2 Issues Found
- 1 Critical Bug (v3.1 compatibility)
- 1 Dead Code (unused method)

**Overall Assessment:** Generally good API hygiene. All API calls centralized in RegistryService. Two issues need addressing.

---

## Audit Methodology

1. **Endpoint Inventory:** Cataloged all API endpoints in RegistryService
2. **Usage Search:** Searched for direct API calls outside RegistryService
3. **Version String Search:** Searched for "latest" keyword usage
4. **Dead Code Detection:** Searched for unused methods

---

## Findings

### Finding #1: Bug in draftCommands.ts - "latest" Fallback

**Severity:** 🔴 **CRITICAL** (v3.1 compatibility bug)

**Location:** `src/commands/draftCommands.ts:26`

**Code:**
```typescript
const versions = await registryService.getVersions(groupId, artifactId);
if (versions.length > 0) {
    // Get the latest version's content
    const latestVersion = versions[0].version || 'latest';  // ❌ BUG
    const content = await registryService.getArtifactContent(groupId, artifactId, latestVersion);
    latestContent = content.content;
    contentType = content.contentType;
}
```

**Issues:**
1. **Incorrect assumption:** `versions[0]` is not guaranteed to be the latest version
   - Versions array may not be sorted
   - Should sort by `globalId` to find latest

2. **v3.1 incompatibility:** Fallback to `'latest'` string will fail in v3.1
   - v3.1 does not support "latest" keyword (Issue #1 from API_COMPATIBILITY.md)
   - Will result in 404 error

**Impact:**
- If `versions[0].version` is undefined/null, code will fail
- User will see error when trying to create draft
- Same bug that was fixed in `openCommands.ts` (commit `1279cf4`)

**Recommended Fix:**
```typescript
const versions = await registryService.getVersions(groupId, artifactId);
if (versions.length > 0) {
    // Sort to find latest version by globalId
    const latestVersion = versions.reduce((prev, current) => {
        return (current.globalId || 0) > (prev.globalId || 0) ? current : prev;
    });

    // Guard against missing version string
    if (!latestVersion.version) {
        console.warn('Latest version has no version string, skipping template');
    } else {
        const content = await registryService.getArtifactContent(
            groupId,
            artifactId,
            latestVersion.version
        );
        latestContent = content.content;
        contentType = content.contentType;
    }
}
```

**Test Impact:**
The unit test in `draftCommands.test.ts:298` explicitly tests the fallback to "latest":
```typescript
it('should use "latest" as version if versions array has no version property', async () => {
```

This test will need to be updated to reflect the new behavior (skip template instead of using "latest").

**Priority:** 🔴 **HIGH** - Fix immediately

---

### Finding #2: Dead Code - updateArtifactContent()

**Severity:** 🟡 **LOW** (code quality)

**Location:** `src/services/registryService.ts:214-235`

**Code:**
```typescript
async updateArtifactContent(groupId: string, artifactId: string, version: string, content: ArtifactContent): Promise<void> {
    this.ensureConnected();

    try {
        const encodedGroupId = encodeURIComponent(groupId);
        const encodedArtifactId = encodeURIComponent(artifactId);
        const encodedVersion = encodeURIComponent(version);

        await this.client!.put(
            `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions/${encodedVersion}`,
            content.content,
            {
                headers: {
                    'Content-Type': content.contentType
                }
            }
        );
    } catch (error) {
        console.error('Error updating artifact content:', error);
        throw new Error(`Failed to update content for ${groupId}/${artifactId}@${version}: ${error}`);
    }
}
```

**Issues:**
1. **Unused:** Not called anywhere in the codebase
2. **Potentially incompatible:** Uses PUT `.../versions/{version}` without `/content` suffix
   - Conflicts with GET endpoint (which requires `/content`)
   - May not work in v3.1 (needs testing)
3. **Superseded:** Replaced by `updateDraftContent()` which uses correct `/content` endpoint

**Recommended Action:**
```typescript
/**
 * @deprecated Use updateDraftContent() instead.
 * This method may not work correctly with v3.1 due to endpoint inconsistency.
 * Kept for reference only.
 */
async updateArtifactContent(...) {
    throw new Error('updateArtifactContent is deprecated. Use updateDraftContent() instead.');
}
```

Or simply remove the method entirely.

**Priority:** 🟡 **MEDIUM** - Clean up during next refactor

---

## Positive Findings

### ✅ Good: Centralized API Logic
- All API calls are in `RegistryService`
- No hardcoded endpoint strings outside service
- Single source of truth for endpoint paths
- Easy to audit and maintain

### ✅ Good: Consistent Error Handling
- All methods have try-catch blocks
- Structured error messages
- HTTP status code handling
- User-friendly error text

### ✅ Good: URL Encoding
- All groupId, artifactId, version parameters properly encoded with `encodeURIComponent()`
- No injection vulnerabilities

### ✅ Good: Previous Fixes Applied
- `openCommands.ts` correctly resolves "latest" version (commit `1279cf4`)
- `getArtifactContent()` correctly uses `/content` endpoint (commit `4f45f9c`)

---

## Endpoint Usage Summary

| Endpoint | Times Used | Locations |
|----------|-----------|-----------|
| GET /groups | 2 | getGroups(), searchGroups() |
| GET /groups/{g}/artifacts | 1 | getArtifacts() |
| GET /groups/{g}/artifacts/{a}/versions | 1 | getVersions() |
| GET /groups/{g}/artifacts/{a}/versions/{v} | 1 | getVersionMetadata() |
| GET /groups/{g}/artifacts/{a}/versions/{v}/content | 1 | getArtifactContent() |
| POST /groups/{g}/artifacts | 1 | createArtifact() |
| POST /groups/{g}/artifacts/{a}/versions | 1 | createDraftVersion() |
| PUT /groups/{g}/artifacts/{a}/state | 1 | updateArtifactState() |
| PUT /groups/{g}/artifacts/{a}/versions/{v}/state | 2 | updateVersionState(), finalizeDraftVersion() |
| PUT /groups/{g}/artifacts/{a}/versions/{v}/content | 1 | updateDraftContent() |
| PUT /groups/{g}/artifacts/{a}/versions/{v}/meta | 1 | updateDraftMetadata() |
| PUT /groups/{g}/artifacts/{a}/versions/{v} | 1 | updateArtifactContent() **UNUSED** |
| DELETE /groups/{g} | 1 | deleteGroup() |
| DELETE /groups/{g}/artifacts/{a} | 1 | deleteArtifact() |
| DELETE /groups/{g}/artifacts/{a}/versions/{v} | 2 | deleteVersion(), discardDraftVersion() |
| GET /search/artifacts | 1 | searchArtifacts() |
| GET /system/uiConfig | 1 | getUIConfig() |

**Total:** 17 endpoints, 19 usages, 1 unused

---

## Recommendations

### Immediate Actions (This Task)

1. ✅ **Fix draftCommands.ts bug**
   - Apply same pattern as openCommands.ts
   - Sort by globalId to find latest
   - Remove "latest" fallback
   - Update unit test

2. ✅ **Mark updateArtifactContent() as deprecated**
   - Add @deprecated JSDoc tag
   - Document replacement method
   - Consider removal in future refactor

3. ✅ **Add JSDoc comments to all RegistryService methods**
   - Document v3.1-specific behaviors
   - Note which features require v3.1
   - Warn about breaking changes from v3.0

### Future Actions (Not This Task)

4. ⏭️ **Test updateArtifactContent() endpoint**
   - Determine if PUT `.../versions/{version}` works in v3.1
   - Document behavior
   - Remove or fix method

5. ⏭️ **Add registry version detection**
   - Implement `getRegistryInfo()` method
   - Add `/system/info` endpoint
   - Enable version-based feature flags

6. ⏭️ **Create helper method for "find latest"**
   - Reused pattern in multiple places
   - Extract to `findLatestVersion(versions)` utility
   - Reduce code duplication

---

## Testing Impact

### Tests Requiring Updates

1. **`src/commands/__tests__/draftCommands.test.ts:298`**
   - Test: `should use "latest" as version if versions array has no version property`
   - Current: Expects fallback to "latest"
   - New: Should expect warning and skip template (or error)

---

## Checklist

- [x] Reviewed all RegistryService methods
- [x] Searched for "latest" keyword usage
- [x] Searched for updateArtifactContent() usage
- [x] Searched for direct API calls outside RegistryService
- [x] Documented all findings
- [x] Prioritized fixes
- [x] Identified test impact

---

## Sign-off

**Audit Complete:** 2025-11-05
**Status:** 2 issues identified, ready for fixes
**Next Steps:** Apply fixes and proceed to Phase 3 (Version Detection)
