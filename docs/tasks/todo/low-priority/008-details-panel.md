# Task 008: Details Panel

**Status:** ⏸️ Deferred
**Priority:** 🟢 Low
**Effort Estimate:** 6-8 hours
**Target Date:** Phase 3/4

---

## Description

Optional hybrid approach: keep hierarchical tree + add Details panel that shows metadata when item selected. Similar to VSCode's Timeline or Outline views.

## Motivation

Reference plugin uses three-panel design (artifacts, versions, metadata). Details panel provides best of both worlds: hierarchical tree + dedicated metadata space.

## Rationale for Deferral

1. **Current tooltips are sufficient** - Rich Markdown tooltips provide adequate metadata display
2. **Higher priority features missing** - CRUD operations more important than UI polish
3. **Adds complexity** - Requires managing multiple tree providers and selection state
4. **Can revisit later** - Better suited for Phase 3 when focusing on visual polish
5. **Low user demand** - Not identified as critical missing feature

## Future Implementation (If Needed)

### Design
```
┌────────────────────────────────────────┐
│ 🔌 Apicurio Registry                   │
│ ├─ 📁 com.example (2)                  │
│ │  └─ 🔷 UserAPI ✓                     │  ← Selected
│ └─ 📁 org.acme (1)                     │
├────────────────────────────────────────┤
│ ℹ️ Details                              │
│ ┌──────────────────────────────────────┐│
│ │ UserAPI                              ││
│ │                                      ││
│ │ Type: OPENAPI                        ││
│ │ State: ENABLED                       ││
│ │ Description: User management API     ││
│ │                                      ││
│ │ Created: 2025-10-20 10:30 AM         ││
│ │ Modified: 2025-10-23 3:45 PM         ││
│ │ Owner: admin                         ││
│ │                                      ││
│ │ Labels:                              ││
│ │   - env: production                  ││
│ │   - team: backend                    ││
│ │                                      ││
│ │ [Edit Metadata]                      ││
│ └──────────────────────────────────────┘│
└────────────────────────────────────────┘
```

### Implementation Outline

1. **Add view in package.json**
```json
{
  "views": {
    "explorer": [
      {
        "id": "apicurioRegistry",
        "name": "Apicurio Registry"
      },
      {
        "id": "apicurioDetails",
        "name": "Details",
        "when": "apicurioItemSelected"
      }
    ]
  }
}
```

2. **Create details tree provider**
3. **Listen to selection events**
4. **Update details panel on selection**
5. **Add edit button for metadata**

## Reference

- **Reference plugin:** Multi-panel design (apicurioMetasExplorer)
- **UX Comparison:** [docs/UX_COMPARISON.md](../../UX_COMPARISON.md) Section 1

---

_Created: 2025-10-24_
_Status: Deferred to Phase 3_
