# Apicurio Editors Integration Strategy

**Date:** 2025-11-04
**Status:** Active
**Repository:** https://github.com/Apicurio/apicurio-editors

---

## Overview

This document outlines our strategy for integrating code from the @apicurio/apicurio-editors repository into our VSCode extension. The apicurio-editors project provides React-based editors for OpenAPI and AsyncAPI, with the same technology stack as our project.

**Key Advantage:** We can copy and adapt production-ready code instead of building from scratch, reducing Task 020 effort from **60-80 hours** to **30-40 hours** (50% reduction).

---

## Technology Stack Alignment

| Aspect | Apicurio Editors | Our Project | Compatibility |
|--------|-----------------|-------------|---------------|
| Framework | React 18.3.1 | React 19 | ✅ Fully compatible |
| Language | TypeScript | TypeScript | ✅ Perfect match |
| UI Library | PatternFly 6.0.0 | PatternFly 6.4.0 | ✅ Same major version |
| Data Models | @apicurio/data-models 2.2.1 | @apicurio/data-models 2.2.4 | ✅ We're newer! |
| Build Tool | Vite | Vite | ✅ Perfect match |
| State Management | XState 5.18.2 | Zustand | ⚠️ Different - need adaptation |

**Conclusion:** 95% compatibility - only state management needs adaptation.

---

## Already Integrated (Completed)

### Phase 1: Infrastructure (2025-11-04)

**20 files copied (1,191 lines):**

1. **Visitors Package** (12 files) - @apicurio/data-models utilities:
   - `path-items.visitor.ts` - Find/filter paths
   - `schema-definitions.visitor.ts` - Find/filter schemas
   - `response-definitions.visitor.ts` - Find/filter responses
   - `channel-items.visitor.ts` - AsyncAPI channels
   - `message-definitions.visitor.ts` - AsyncAPI messages
   - `security-schemes.visitor.ts` - Security definitions
   - `find-selected-node.visitor.ts` - Navigation helper
   - `detect-override.visitor.ts` - Override detection
   - `has-problems.visitor.ts` - Validation helper
   - `visitor-utils.ts` - Shared utilities
   - Other trait visitors

2. **UI Components** (7 files):
   - `InlineEdit.tsx` + `.module.css` - Click-to-edit component
   - `Markdown.tsx` - Markdown editor/renderer
   - `AccordionSection.tsx` - Collapsible sections
   - `AddPath.tsx` - Add path dialog
   - `AddTag.tsx` - Add tag dialog
   - `isDarkMode.ts` - Theme detection

3. **Proven Integration:**
   - ✅ InfoForm refactored using InlineEdit pattern
   - ✅ Serialization issues resolved (mutate documents directly)
   - ✅ Visual testing confirmed working
   - ✅ Pattern established for all forms

---

## Available for Integration (Task 020)

### Document Designer Components (19 files)

**Location:** `/packages/ui/src/documentDesigner/`

| Component | Size | Purpose | Copy Strategy |
|-----------|------|---------|---------------|
| **Overview.tsx** | 1.9 KB | Title, version, description | ✅ Already used as reference |
| **Contact.tsx** | 2.0 KB | Contact info editing | 🎯 **COPY** - Adapt for our InfoForm |
| **License.tsx** | 597 B | License info editing | 🎯 **COPY** - Adapt for our InfoForm |
| **Servers.tsx** | 1.3 KB | Server list editing | 🎯 **COPY** - Already have ServerForm, use as reference |
| **TagDefinitions.tsx** | 2.4 KB | Tag management | 🎯 **COPY** - New component needed |
| **PathsExplorer.tsx** | 12.2 KB | Path browsing/filtering | 🎯 **COPY** - Large, valuable component |
| **PathsTree.tsx** | 6.6 KB | Path tree view | 🔧 **REFERENCE** - We have NavigationTree |
| **SecurityScheme.tsx** | 3.2 KB | Security scheme editing | 🎯 **COPY** - New component needed |
| **SecurityRequirements.tsx** | 2.8 KB | Security requirements | 🎯 **COPY** - New component needed |
| **OperationLabel.tsx** | 691 B | HTTP method label | 🎯 **COPY** - Utility component |

**Total reusable:** ~35 KB of production code

### Path Designer Components (7 files)

**Location:** `/packages/ui/src/pathDesigner/`

| Component | Size | Purpose | Copy Strategy |
|-----------|------|---------|---------------|
| **PathDesigner.tsx** | 419 B | Main path editor | 🎯 **COPY & ADAPT** |
| **Designer.tsx** | 481 B | Path form layout | 🎯 **COPY & ADAPT** |
| **Info.tsx** | 1.5 KB | Path summary/description | 🎯 **COPY** |
| **Servers.tsx** | 1.3 KB | Path-level servers | 🎯 **COPY** |
| **DesignerLayout.tsx** | 762 B | Layout wrapper | 🔧 **REFERENCE** |

**Operations editing:** Not implemented in apicurio-editors yet (functions throw "not implemented")

**Strategy:**
- ✅ Copy path-level components
- ⚠️ Build operation forms ourselves (not in apicurio-editors)

### Data Type Designer Components (7 files)

**Location:** `/packages/ui/src/dataTypeDesigner/`

| Component | Size | Purpose | Copy Strategy |
|-----------|------|---------|---------------|
| **DataTypeDesigner.tsx** | 439 B | Main schema editor | 🎯 **COPY & ADAPT** |
| **Designer.tsx** | 242 B | Schema form layout | 🎯 **COPY & ADAPT** |
| **Info.tsx** | 1.1 KB | Schema description | 🎯 **COPY** |
| **Properties.tsx** | 2.9 KB | Schema properties editor | 🎯 **COPY** - Valuable! |

**Strategy:**
- ✅ Copy and adapt for schema/component editing
- ✅ Properties.tsx is the most valuable (2.9 KB of complex logic)

### Response Designer Components (6 files)

**Location:** `/packages/ui/src/responseDesigner/`

| Component | Size | Purpose | Copy Strategy |
|-----------|------|---------|---------------|
| **ResponseDesigner.tsx** | 439 B | Main response editor | 🎯 **COPY & ADAPT** |
| **Designer.tsx** | 167 B | Response form layout | 🎯 **COPY & ADAPT** |
| **Info.tsx** | 1.1 KB | Response description | 🎯 **COPY** |

**Strategy:**
- ✅ Copy and adapt for response editing
- ✅ Lightweight components, easy to integrate

---

## State Management Adaptation

### XState → Zustand Migration

**Their Pattern (XState):**
```typescript
// apicurio-editors uses XState actors
const actorRef = useMachineActorRef();
actorRef.send({ type: "CHANGE_TITLE", title: value });

const title = useMachineSelector((state) => state.context.title);
```

**Our Pattern (Zustand):**
```typescript
// We use Zustand stores with direct mutation
const { document, updateDocument } = useDocument();
const { executeCommand } = useCommandHistoryStore();

executeCommand({
    execute: () => {
        document.info.title = value;
        updateDocument(document);
    },
    undo: () => {
        document.info.title = oldValue;
        updateDocument(document);
    }
});
```

**Migration Steps:**
1. Remove XState imports (`useMachineActorRef`, `useMachineSelector`)
2. Replace with our hooks (`useDocument`, `useCommandHistoryStore`)
3. Replace `actorRef.send()` with `executeCommand()`
4. Replace `useMachineSelector()` with direct property access
5. Keep all UI and layout code unchanged

**Effort:** ~30 minutes per component

---

## Revised Task 020 Plan

### New Approach: Copy & Adapt

**Original Plan:** Build all forms from scratch (60-80h)

**Revised Plan:** Copy apicurio-editors code and adapt (30-40h) - **50% faster!**

### Subtask Breakdown (Revised)

#### 1. Contact & License Forms (4-6h) → **2-3h**
**Copy from:** `documentDesigner/Contact.tsx`, `documentDesigner/License.tsx`
- ✅ Copy Contact.tsx (2 KB) - adapt to Zustand
- ✅ Copy License.tsx (597 B) - adapt to Zustand
- ✅ Integrate into InfoForm
- ✅ Test and validate

**Effort Reduction:** 50% (copying vs building)

#### 2. Tag Management (6-8h) → **3-4h**
**Copy from:** `documentDesigner/TagDefinitions.tsx`
- ✅ Copy TagDefinitions.tsx (2.4 KB)
- ✅ Copy AddTag.tsx (already have)
- ✅ Adapt to Zustand
- ✅ Test tag add/remove/edit

**Effort Reduction:** 50%

#### 3. Path Explorer & Management (10-12h) → **6-8h**
**Copy from:** `documentDesigner/PathsExplorer.tsx`, `pathDesigner/*`
- ✅ Copy PathsExplorer.tsx (12 KB - largest component!)
- ✅ Copy AddPath.tsx (already have)
- ✅ Copy pathDesigner/Info.tsx
- ✅ Adapt to Zustand
- ✅ Integrate with NavigationTree

**Effort Reduction:** 40% (large component saves most time)

#### 4. Operation Forms (12-15h) → **12-15h** (unchanged)
**Note:** apicurio-editors doesn't have operation editing implemented yet
- ❌ No reference code available
- 🔧 Build from scratch using InlineEdit pattern
- 🔧 Forms for: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- 🔧 Parameters, request body, responses

**Effort:** Unchanged - must build ourselves

#### 5. Schema/Component Editor (15-20h) → **8-12h**
**Copy from:** `dataTypeDesigner/*`
- ✅ Copy DataTypeDesigner.tsx
- ✅ Copy Properties.tsx (2.9 KB - complex logic!)
- ✅ Copy Info.tsx
- ✅ Adapt to Zustand
- ✅ JSON Schema editor integration

**Effort Reduction:** 45% (Properties.tsx is gold)

#### 6. Response Editor (8-10h) → **4-6h**
**Copy from:** `responseDesigner/*`
- ✅ Copy ResponseDesigner.tsx
- ✅ Copy Info.tsx
- ✅ Adapt to Zustand
- ✅ Media type editing
- ✅ Headers, examples

**Effort Reduction:** 50%

#### 7. Security Components (8-10h) → **4-6h**
**Copy from:** `documentDesigner/SecurityScheme.tsx`, `documentDesigner/SecurityRequirements.tsx`
- ✅ Copy SecurityScheme.tsx (3.2 KB)
- ✅ Copy SecurityRequirements.tsx (2.8 KB)
- ✅ Adapt to Zustand
- ✅ OAuth flows, API keys, HTTP auth

**Effort Reduction:** 50%

### Summary: Effort Reduction

| Subtask | Original | Revised | Savings | Reduction |
|---------|----------|---------|---------|-----------|
| Contact & License | 4-6h | 2-3h | 2-3h | 50% |
| Tag Management | 6-8h | 3-4h | 3-4h | 50% |
| Path Explorer | 10-12h | 6-8h | 4-4h | 40% |
| **Operation Forms** | **12-15h** | **12-15h** | **0h** | **0%** |
| Schema Editor | 15-20h | 8-12h | 7-8h | 45% |
| Response Editor | 8-10h | 4-6h | 4-4h | 50% |
| Security | 8-10h | 4-6h | 4-4h | 50% |
| **TOTAL** | **63-81h** | **39-54h** | **24-27h** | **38-40%** |

**Average Savings:** ~40% reduction (25 hours saved!)

---

## Integration Checklist (Per Component)

### Before Copying

- [ ] Identify source component in apicurio-editors
- [ ] Check file size and complexity
- [ ] Read code to understand XState usage
- [ ] Identify dependencies (other components)

### During Copy

- [ ] Copy component file to our project
- [ ] Copy any CSS modules
- [ ] Remove XState imports
- [ ] Add our hooks (useDocument, useCommandHistoryStore)
- [ ] Replace `actorRef.send()` with `executeCommand()`
- [ ] Replace `useMachineSelector()` with direct access
- [ ] Update imports to our components

### After Copy

- [ ] TypeScript compiles without errors
- [ ] Component renders correctly
- [ ] Test all edit operations
- [ ] Test undo/redo
- [ ] Test validation
- [ ] Visual verification in Extension Development Host

---

## Dependencies to Add (If Needed)

**Markdown Support** (for Markdown component):
```bash
npm install react-markdown remark-gfm rehype-raw
```

**CodeEditor** (for schema/JSON editing):
```bash
npm install @patternfly/react-code-editor
```

**Note:** We already have PatternFly 6.4.0, so most components work out of the box.

---

## Testing Strategy

### Unit Tests

For each copied component:
1. Test rendering with mock data
2. Test edit operations
3. Test validation
4. Test undo/redo

### Integration Tests

1. Test full workflow (create → edit → save)
2. Test navigation between forms
3. Test with real OpenAPI/AsyncAPI documents

### Visual Tests

1. Test in Extension Development Host
2. Test with sample documents
3. Test all themes (light, dark, high-contrast)

---

## Success Criteria

**Task 020 Complete When:**

- ✅ All forms implemented (Contact, License, Tags, Paths, Operations, Schemas, Responses, Security)
- ✅ All forms use InlineEdit pattern consistently
- ✅ All forms integrate with command history (undo/redo)
- ✅ All forms validate input
- ✅ All forms persist changes to document
- ✅ Visual testing confirms good UX
- ✅ TypeScript compiles without errors
- ✅ 80%+ test coverage

---

## Notes

### What Apicurio-Editors Doesn't Have (Yet)

1. **Operation editing** - Functions throw "not implemented"
2. **Parameter editing** - Partially implemented
3. **Request body editing** - Limited implementation
4. **Examples** - Not implemented

**Impact:** We'll build these ourselves using the InlineEdit pattern.

### What We Can Fully Reuse

1. **All Info/Description fields** - Pattern works perfectly
2. **List management** (tags, servers, security) - Reusable patterns
3. **Schema properties editor** - Complex logic we don't want to rebuild
4. **Path explorer** - Large component (12 KB) saves tons of time

---

## Timeline

**Revised Task 020 Timeline:**

- **Week 1 (Day 1-2):** Contact, License, Tags (6-8h)
- **Week 1 (Day 3-5):** Path Explorer & Management (6-8h)
- **Week 2 (Day 1-3):** Operation Forms - build from scratch (12-15h)
- **Week 2 (Day 4-5):** Schema Editor (8-12h)
- **Week 3 (Day 1-2):** Response Editor (4-6h)
- **Week 3 (Day 3):** Security Components (4-6h)

**Total:** 3 weeks instead of 4-5 weeks

---

## Conclusion

**Strategy:** Copy 60-70% of code from apicurio-editors, adapt state management, build missing 30-40% ourselves.

**Benefits:**
- ✅ 40% time savings (~25 hours)
- ✅ Battle-tested code from production Apicurio Studio
- ✅ Consistent UX patterns
- ✅ Reduced bugs (proven code)
- ✅ Faster to market

**Risks:**
- ⚠️ XState → Zustand adaptation might reveal edge cases
- ⚠️ Some components might need significant refactoring
- ⚠️ Missing operation editing means more work there

**Mitigation:**
- ✅ We've already proven the pattern with InfoForm
- ✅ InlineEdit component works perfectly
- ✅ Serialization issues resolved
- ✅ Test coverage will catch issues early

---

**Status:** Ready to begin Task 020 with revised 30-40h estimate! 🚀
