# Task 009: Reverse Version Order Toggle

**Status:** ⏸️ Deferred
**Priority:** 🟢 Low
**Effort Estimate:** 1-2 hours
**Target Date:** Integrate with Task 006

---

## Description

Toolbar toggle button to reverse version sort order (newest first vs oldest first).

## Motivation

Reference plugin has toolbar button to reverse version display order. Some users prefer newest versions first.

## Rationale for Deferral

**Will be integrated with Task 006 (User Preferences)**

Instead of a toolbar button, implement as user preference setting:
- `apicurioRegistry.display.reverseVersionOrder` (boolean)
- Users set preference once in settings
- No toolbar clutter
- More consistent with VSCode patterns

## Implementation (As Part of Task 006)

### Setting
```json
{
  "apicurioRegistry.display.reverseVersionOrder": {
    "type": "boolean",
    "default": false,
    "description": "Show newest versions first"
  }
}
```

### Tree Provider
```typescript
// In buildTree() - apply version ordering
const reverseVersions = config.get<boolean>('display.reverseVersionOrder', false);

if (reverseVersions) {
    versions.reverse();
}
```

## Alternative: Toolbar Button (Not Recommended)

If toolbar button is preferred:

```json
{
  "command": "apicurioRegistry.toggleVersionOrder",
  "title": "Reverse Version Order",
  "icon": "$(arrow-swap)",
  "category": "Apicurio Registry"
}
```

**Cons of toolbar approach:**
- Adds button clutter
- State management complexity
- Per-workspace preference unclear
- Less discoverable than settings

## Reference

- **Reference plugin:** `apicurioVersionsExplorer.reverseDisplay` command
- **UX Comparison:** [docs/UX_COMPARISON.md](../../UX_COMPARISON.md) Section 4

## Decision

**Implement as user preference in Task 006, not separate toolbar button.**

---

_Created: 2025-10-24_
_Status: Will be covered by Task 006_
