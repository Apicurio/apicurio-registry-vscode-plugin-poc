# Task 020: Forms & Detail Editors (REVISED with Apicurio-Editors Integration)

**Status:** 📋 Todo → Ready to Start
**Priority:** High
**Effort:** 30-40 hours (REVISED from 60-80h - 40% reduction!)
**Dependencies:** Task 019 (Complete ✅), Apicurio-Editors Integration (Complete ✅)
**Phase:** 3.2 - React Visual Editor

---

## 🎯 Revision Summary

**Date:** 2025-11-04

**Key Discovery:** The @apicurio/apicurio-editors repository provides production-ready React components for OpenAPI/AsyncAPI editing that we can copy and adapt.

**Impact:**
- **Original Estimate:** 60-80 hours (build from scratch)
- **Revised Estimate:** 30-40 hours (copy & adapt)
- **Time Savings:** 25-40 hours (40% reduction!)

**Strategy:** Copy ~60-70% of code from apicurio-editors, adapt XState→Zustand state management, build missing 30-40% ourselves.

**See:** [APICURIO_EDITORS_INTEGRATION_STRATEGY.md](../../APICURIO_EDITORS_INTEGRATION_STRATEGY.md)

---

## Overview

Implement all form editors for OpenAPI/AsyncAPI documents by copying and adapting components from apicurio-editors, using the proven InlineEdit pattern established in InfoForm refactor.

**Technology Stack:**
- React 19 + TypeScript
- PatternFly 6.4.0 (UI components)
- @apicurio/data-models 2.2.4 (document models)
- Zustand (state management)
- InlineEdit component (from apicurio-editors)

---

## Subtasks (Revised with Copy/Adapt Strategy)

### 1. Contact & License Components (2-3h) ✨ **50% FASTER**

**Copy from:** `apicurio-editors/packages/ui/src/documentDesigner/`

**Files to copy:**
- `Contact.tsx` (2.0 KB)
- `License.tsx` (597 B)

**What to do:**
1. Copy Contact.tsx → `src/webview/components/forms/ContactSection.tsx`
2. Copy License.tsx → `src/webview/components/forms/LicenseSection.tsx`
3. Remove XState imports (`useMachineActorRef`, `useMachineSelector`)
4. Add our hooks (`useDocument`, `useCommandHistoryStore`)
5. Replace `actorRef.send()` with `executeCommand()` pattern
6. Replace `useMachineSelector()` with `info?.contact`, `info?.license`
7. Integrate into InfoForm as collapsible sections
8. Test edit/save/undo operations

**Original Estimate:** 4-6h
**Revised Estimate:** 2-3h
**Savings:** 2-3h

---

### 2. Tag Management (3-4h) ✨ **50% FASTER**

**Copy from:** `apicurio-editors/packages/ui/src/documentDesigner/`

**Files to copy:**
- `TagDefinitions.tsx` (2.4 KB)
- `AddTag.tsx` (already copied ✅)

**What to do:**
1. Copy TagDefinitions.tsx → `src/webview/components/forms/TagsSection.tsx`
2. Adapt XState → Zustand
3. Use AddTag dialog for adding tags
4. Implement tag edit/remove/reorder
5. Add to DocumentDesigner as section
6. Test full tag management workflow

**Original Estimate:** 6-8h
**Revised Estimate:** 3-4h
**Savings:** 3-4h

---

### 3. Path Explorer & Management (6-8h) ✨ **40% FASTER**

**Copy from:** `apicurio-editors/packages/ui/src/documentDesigner/` & `pathDesigner/`

**Files to copy:**
- `PathsExplorer.tsx` (12.2 KB) - **Largest component!**
- `pathDesigner/PathDesigner.tsx` (419 B)
- `pathDesigner/Info.tsx` (1.5 KB)
- `pathDesigner/Servers.tsx` (1.3 KB)
- `AddPath.tsx` (already copied ✅)

**What to do:**
1. Copy PathsExplorer.tsx → `src/webview/components/paths/PathsExplorer.tsx`
2. Copy pathDesigner/* → `src/webview/components/paths/`
3. Adapt XState → Zustand (all 3 files)
4. Integrate with NavigationTree for path selection
5. Path filtering, search functionality
6. Add/clone/delete path operations
7. Test complete path management workflow

**Original Estimate:** 10-12h
**Revised Estimate:** 6-8h
**Savings:** 4-4h

---

### 4. Operation Forms (12-15h) ⚠️ **BUILD FROM SCRATCH**

**Note:** Apicurio-editors doesn't have operation editing implemented (functions throw "not implemented")

**Must build ourselves:**

**Components to create:**
- `OperationForm.tsx` - Main operation editor
- `RequestBodySection.tsx` - Request body with media types
- `ResponsesSection.tsx` - Response list
- `ParametersSection.tsx` - Parameter list (inherited + operation)
- `SecuritySection.tsx` - Security requirements

**What to build:**
1. **OperationForm.tsx:**
   - Summary, description, operationId (InlineEdit)
   - Tags dropdown (multi-select)
   - External docs (URL)
   - Deprecated checkbox
   - Servers override

2. **RequestBodySection.tsx:**
   - Required checkbox
   - Description
   - Content types (application/json, etc.)
   - Schema reference picker
   - Examples

3. **ResponsesSection.tsx:**
   - Status code dropdown (200, 404, 500, etc.)
   - Description (InlineEdit)
   - Headers
   - Content types + schemas
   - Examples
   - Add/remove responses

4. **ParametersSection.tsx:**
   - Parameter list (path, query, header, cookie)
   - Show inherited from path
   - Add/remove/override parameters
   - Parameter editor dialog

5. **SecuritySection.tsx:**
   - Security requirement selector
   - Scope selector (for OAuth2)
   - Add/remove requirements

**Pattern:** Use InlineEdit, DescriptionList, and AccordionSection like InfoForm

**Original Estimate:** 12-15h
**Revised Estimate:** 12-15h (unchanged)
**Savings:** 0h

---

### 5. Schema/Component Editor (8-12h) ✨ **45% FASTER**

**Copy from:** `apicurio-editors/packages/ui/src/dataTypeDesigner/`

**Files to copy:**
- `DataTypeDesigner.tsx` (439 B)
- `Properties.tsx` (2.9 KB) - **Most valuable!**
- `Info.tsx` (1.1 KB)

**What to do:**
1. Copy DataTypeDesigner.tsx → `src/webview/components/schemas/SchemaEditor.tsx`
2. Copy Properties.tsx → `src/webview/components/schemas/SchemaProperties.tsx`
3. Copy Info.tsx → `src/webview/components/schemas/SchemaInfo.tsx`
4. Adapt XState → Zustand
5. Add JSON Schema editing features:
   - Type selector (string, number, object, array, boolean, null)
   - Format selector (date-time, email, uri, etc.)
   - Min/max validators
   - Pattern (regex)
   - Enum values
   - Required fields
   - AllOf/AnyOf/OneOf/Not
6. Visual property tree
7. Add/remove/edit properties
8. Nested schema support
9. Test complex schemas

**Original Estimate:** 15-20h
**Revised Estimate:** 8-12h
**Savings:** 7-8h

---

### 6. Response Editor (4-6h) ✨ **50% FASTER**

**Copy from:** `apicurio-editors/packages/ui/src/responseDesigner/`

**Files to copy:**
- `ResponseDesigner.tsx` (439 B)
- `Info.tsx` (1.1 KB)

**What to do:**
1. Copy ResponseDesigner.tsx → `src/webview/components/responses/ResponseEditor.tsx`
2. Copy Info.tsx → `src/webview/components/responses/ResponseInfo.tsx`
3. Adapt XState → Zustand
4. Add response-specific features:
   - Status code selector
   - Headers editor
   - Media types (application/json, etc.)
   - Schema selector
   - Examples
   - Links (OpenAPI 3.x)
5. Test response editing workflow

**Original Estimate:** 8-10h
**Revised Estimate:** 4-6h
**Savings:** 4-4h

---

### 7. Security Components (4-6h) ✨ **50% FASTER**

**Copy from:** `apicurio-editors/packages/ui/src/documentDesigner/`

**Files to copy:**
- `SecurityScheme.tsx` (3.2 KB)
- `SecurityRequirements.tsx` (2.8 KB)

**What to do:**
1. Copy SecurityScheme.tsx → `src/webview/components/security/SecuritySchemeEditor.tsx`
2. Copy SecurityRequirements.tsx → `src/webview/components/security/SecurityRequirements.tsx`
3. Adapt XState → Zustand
4. Security scheme types:
   - apiKey (in: query/header/cookie)
   - http (scheme: basic/bearer)
   - oauth2 (flows: implicit/authorizationCode/clientCredentials/password)
   - openIdConnect (URL)
5. OAuth2 flows editor:
   - Authorization URL
   - Token URL
   - Scopes (name + description)
6. Test all security types

**Original Estimate:** 8-10h
**Revised Estimate:** 4-6h
**Savings:** 4-4h

---

## AsyncAPI Components (Build Ourselves)

**Note:** Apicurio-editors focuses on OpenAPI, limited AsyncAPI support

### 8. Channel Form (6-8h)

**Must build ourselves:**

**Component:** `ChannelForm.tsx`

**What to build:**
- Channel name/path (InlineEdit)
- Description (TextArea)
- Parameters (list)
- Publish operation (reference to Message)
- Subscribe operation (reference to Message)
- Bindings (protocol-specific - AMQP, MQTT, Kafka, etc.)

**Pattern:** Use InlineEdit + DescriptionList like OpenAPI forms

### 9. Message Form (6-8h)

**Must build ourselves:**

**Component:** `MessageForm.tsx`

**What to build:**
- Message name, title (InlineEdit)
- Summary, description (TextArea)
- Payload (schema reference)
- Headers (schema reference)
- Correlation ID
- Content type
- Tags
- Examples
- Message traits
- Bindings

**Pattern:** Use InlineEdit + DescriptionList

---

## Effort Summary (Revised)

| Subtask | Original | Revised | Savings | Strategy |
|---------|----------|---------|---------|----------|
| 1. Contact & License | 4-6h | 2-3h | 2-3h | ✨ Copy & Adapt |
| 2. Tag Management | 6-8h | 3-4h | 3-4h | ✨ Copy & Adapt |
| 3. Path Explorer | 10-12h | 6-8h | 4-4h | ✨ Copy & Adapt |
| **4. Operation Forms** | **12-15h** | **12-15h** | **0h** | ⚠️ Build (not in apicurio-editors) |
| 5. Schema Editor | 15-20h | 8-12h | 7-8h | ✨ Copy & Adapt |
| 6. Response Editor | 8-10h | 4-6h | 4-4h | ✨ Copy & Adapt |
| 7. Security | 8-10h | 4-6h | 4-4h | ✨ Copy & Adapt |
| 8. Channel Form | - | 6-8h | - | 🔧 Build (AsyncAPI) |
| 9. Message Form | - | 6-8h | - | 🔧 Build (AsyncAPI) |
| **TOTAL** | **63-81h** | **51-70h** | **24-31h** | **38% reduction** |

**Conservative Estimate:** 55-65 hours
**Aggressive Estimate:** 40-50 hours
**Target:** **50 hours** (middle ground)

---

## Deliverables

**All forms implemented:**
- ✅ Contact & License sections (in InfoForm)
- ✅ Tag management
- ✅ Path explorer & management
- ✅ Operation forms (GET/POST/PUT/DELETE/PATCH/OPTIONS/HEAD)
- ✅ Schema/component editor
- ✅ Response editor
- ✅ Security scheme editor
- ✅ Channel form (AsyncAPI)
- ✅ Message form (AsyncAPI)

**Quality criteria:**
- ✅ All forms use InlineEdit pattern consistently
- ✅ All forms integrate with command history (undo/redo)
- ✅ All forms validate input
- ✅ All forms persist changes to document
- ✅ 80%+ test coverage
- ✅ TypeScript compiles without errors
- ✅ Visual testing confirms good UX

---

## Success Criteria

**Functional:**
- Can edit all parts of OpenAPI 2.0/3.0/3.1 document
- Can edit all parts of AsyncAPI 2.x document
- Schema editor supports nested schemas
- Form validation catches invalid input
- Changes update document state correctly
- Undo/redo works with all forms

**Technical:**
- Clean code following InfoForm pattern
- Consistent use of InlineEdit component
- Proper @apicurio/data-models mutation (no cloning!)
- All forms serialize correctly

**UX:**
- Click-to-edit interaction (InlineEdit)
- Inline save/cancel buttons
- Keyboard shortcuts (Enter=save, Escape=cancel)
- Real-time validation feedback
- Clean DescriptionList layout

---

## Dependencies

**From apicurio-editors (already copied):**
- ✅ InlineEdit component
- ✅ Markdown component
- ✅ AccordionSection component
- ✅ AddPath, AddTag dialogs
- ✅ Visitors package

**To copy during Task 020:**
- Contact.tsx, License.tsx
- TagDefinitions.tsx
- PathsExplorer.tsx
- pathDesigner/* (Info, Servers)
- dataTypeDesigner/* (Properties, Info)
- responseDesigner/* (Info)
- SecurityScheme.tsx, SecurityRequirements.tsx

**Additional dependencies (if needed):**
```bash
npm install react-markdown remark-gfm rehype-raw  # For Markdown
npm install @patternfly/react-code-editor         # For code/schema editing
```

---

## Testing Strategy

### Unit Tests (Per Component)

**Test coverage:**
- Component rendering with mock data
- Edit operations
- Validation (URL, email, required fields, etc.)
- Undo/redo
- Save/cancel

**Target:** 80%+ coverage per component

### Integration Tests

**Workflows to test:**
1. Create new path → add operation → add parameters → add response
2. Edit schema → add properties → set required fields → validate
3. Add security scheme → apply to operation → test scopes
4. Full document round-trip (edit → save → reload → verify)

### Visual Tests

**Test scenarios:**
1. Test all forms in Extension Development Host
2. Test with real OpenAPI/AsyncAPI samples
3. Test all themes (light, dark, high-contrast)
4. Test keyboard navigation
5. Test screen reader accessibility

---

## Timeline (3 Weeks)

### Week 1: Foundation & Path Management (16-20h)

**Day 1-2:**
- Contact & License components (2-3h)
- Tag management (3-4h)
- **Total:** 5-7h

**Day 3-5:**
- Path Explorer (6-8h)
- Basic path editing (4-5h)
- **Total:** 10-13h

### Week 2: Operations & Schemas (16-20h)

**Day 1-3:**
- Operation forms (12-15h)
- Parameters, request body, responses
- **Total:** 12-15h

**Day 4-5:**
- Schema editor start (4-5h)
- **Total:** 4-5h

### Week 3: Schemas, Responses, Security, AsyncAPI (16-20h)

**Day 1:**
- Schema editor complete (4-7h)

**Day 2:**
- Response editor (4-6h)

**Day 3:**
- Security components (4-6h)

**Day 4-5:**
- AsyncAPI (Channel + Message forms) (12-16h)

---

## Risk Mitigation

**Risk 1:** XState → Zustand adaptation takes longer than expected

**Mitigation:**
- ✅ Pattern proven with InfoForm refactor
- ✅ Documented in APICURIO_EDITORS_INTEGRATION_STRATEGY.md
- ✅ Consistent pattern across all forms

**Risk 2:** Some components need significant refactoring

**Mitigation:**
- ✅ Start with simplest components (Contact, License)
- ✅ Test each component before moving to next
- ✅ Fall back to building from scratch if copy doesn't work

**Risk 3:** Missing operation editing means more work

**Mitigation:**
- ✅ We have InlineEdit pattern established
- ✅ Operation forms follow same pattern as InfoForm
- ✅ No new patterns to learn - just more forms

**Risk 4:** Bundle size increases significantly

**Mitigation:**
- ✅ Tree-shaking removes unused code
- ✅ Code splitting for large components
- ✅ Monitor bundle size during development

---

## Notes

### What We Already Have

- ✅ InlineEdit component (working perfectly in InfoForm)
- ✅ InfoForm pattern (proven and tested)
- ✅ ServerForm (can reference for server editing)
- ✅ NavigationTree (for path/schema navigation)
- ✅ Command pattern (undo/redo working)
- ✅ Document mutation pattern (no cloning!)
- ✅ Visitors package (for document traversal)

### What Apicurio-Editors Gives Us

- ✅ ~35 KB of production-tested code
- ✅ Complex logic (PathsExplorer - 12 KB, SchemaProperties - 2.9 KB)
- ✅ Battle-tested patterns from Apicurio Studio
- ✅ Consistent UX across all forms

### What We Build Ourselves

- Operation forms (not in apicurio-editors)
- AsyncAPI forms (limited in apicurio-editors)
- VSCode-specific integrations
- Custom dialogs and workflows

---

## Conclusion

**Revised Strategy:** Copy 60-70% from apicurio-editors, build 30-40% ourselves

**Time Savings:** 24-31 hours (38-40% reduction!)

**Confidence:** High - InfoForm refactor proved the pattern works

**Ready to Start:** ✅ All dependencies integrated, pattern established

---

**Status:** Ready to begin! 🚀
