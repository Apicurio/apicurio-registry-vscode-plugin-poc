# Phase 3.2: React vs Angular Architecture Decision

**Date:** 2025-11-03
**Decision:** React Rewrite Approach
**Effort Impact:** 40-60h → 200-260h

---

## Executive Summary

Phase 3.2 was originally planned as embedding the existing Angular-based Apicurio Studio editor via iframe (40-60 hours). After detailed analysis, this approach was **rejected** due to VSCode Content Security Policy constraints that block Angular's required `unsafe-eval` CSP directive.

**Decision:** Rewrite the visual editor in React (200-260 hours over 7 weeks).

---

## Analysis Background

### Original Plan (Tasks 018-021)

The initial Phase 3.2 plan assumed:
- Embed existing Angular-based Apicurio Studio editor
- Use iframe + postMessage for integration
- Leverage 42,380 LOC existing codebase
- Minimal custom development (40-60h)

### Research Conducted

1. **Analyzed Apicurio Registry Codebase:**
   - Explored `/apicurio-registry/ui/ui-editors/` (Angular 18 app)
   - 42,380 LOC, 141 Angular components
   - Uses @apicurio/data-models (v1.1.33) for business logic
   - Identified message passing protocol (apicurio-editingInfo, apicurio_onChange)

2. **Analyzed Integration Patterns:**
   - Found existing React integration in `/ui/ui-app/src/editors/OpenApiEditor.tsx`
   - Documented iframe embedding approach
   - Identified bidirectional communication pattern

3. **Evaluated CSP Requirements:**
   - **Critical Finding:** VSCode extensions require strict CSP
   - Angular requires `unsafe-eval` for JIT compilation
   - **Blocker:** VSCode cannot relax CSP for webviews

---

## Comparison: Angular vs React

### Approach A: Angular Webview (Iframe Embedding)

**Pros:**
- ✅ Reuses 100% of existing codebase (42,380 LOC)
- ✅ No feature gaps (identical UX)
- ✅ Quick implementation (45-57 hours)
- ✅ Auto-updates with Registry releases

**Cons:**
- ❌ **BLOCKER:** Requires `unsafe-eval` CSP directive
- ❌ **VSCode cannot relax CSP** - technically infeasible
- ❌ Large bundle size (~2-3 MB)
- ❌ No control over codebase
- ❌ iframe overhead (memory, performance)

**Effort:** 45-57 hours
- Task 018: Webview provider (15-20h)
- Task 019: Message passing (12-15h)
- Task 020: Configuration (8-10h)
- Task 021: Synchronization (10-12h)

**Verdict:** ❌ **BLOCKED by CSP constraint**

---

### Approach B: React Rewrite

**Pros:**
- ✅ **CSP compliant** (no unsafe-eval needed)
- ✅ Full control over features and updates
- ✅ Smaller bundle size (~800 KB - 1.2 MB)
- ✅ Better VSCode integration patterns
- ✅ Can reuse ~30% of code (@apicurio/data-models, CSS, business logic)
- ✅ React more maintainable long-term

**Cons:**
- ❌ Significant effort (200-280 hours)
- ❌ 7-week timeline
- ❌ Must rewrite 141 Angular components
- ❌ Potential feature gaps (acceptable for Phase 3.2)
- ❌ Manual updates (not synced with Registry)

**Effort:** 200-280 hours
- Task 018: React Foundation (35-45h)
- Task 019: Core UI (55-70h)
- Task 020: Forms (60-80h)
- Task 021: Integration (50-65h)

**Verdict:** ✅ **Only viable option**

---

## Decision Criteria

Five criteria were evaluated:

| Criterion | Angular | React | User Answer | Winner |
|-----------|---------|-------|-------------|--------|
| **Timeline** | 2 weeks | 7 weeks | "I can wait 7 weeks" | React ✅ |
| **Bundle Size** | ~2-3 MB | ~800 KB | "no concerns for that" | React ✅ |
| **CSP Policy** | Requires unsafe-eval | Strict compliant | "no" (cannot accept unsafe-eval) | React ✅ |
| **Maintenance** | Auto-updates | Full control | "full control" | React ✅ |
| **Feature Parity** | 100% | Potential gaps | "gaps are ok in this phase" | React ✅ |

**Result:** 5/5 criteria favor React approach (CSP being the blocker for Angular)

---

## Technical Details

### VSCode Content Security Policy

VSCode extensions enforce strict CSP for webviews:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none';
               script-src ${webview.cspSource};
               style-src ${webview.cspSource};">
```

**Key Constraint:** `unsafe-eval` is not allowed and cannot be enabled.

**Why Angular Fails:**
- Angular JIT compiler requires runtime template evaluation
- Even Angular AOT mode uses runtime compilation for some features
- `unsafe-eval` is a hard requirement for Angular

**Why React Succeeds:**
- React uses JSX → JavaScript compilation at build time
- No runtime evaluation needed
- Fully compatible with strict CSP

### Code Reuse Strategy

**100% Reuse:**
- @apicurio/data-models library (framework-agnostic TypeScript)
  - Document models (OasDocument, Aai20Document)
  - Visitor pattern for traversal
  - Command pattern for modifications
  - Validation engine

**70% Reuse:**
- CSS styles (adapt to VSCode theming)
- Layout patterns (3-column design)
- Component styling

**50% Reuse:**
- Business logic (validation rules, helpers)
- Form schemas (adapt to zod/react-hook-form)
- Utility functions

**0% Reuse:**
- Angular components (141 components → React rewrite)
- Angular services (RxJS → Zustand)
- Angular templates → JSX

**Estimated LOC:**
- Original: 42,380 LOC (180 TypeScript files)
- After reuse: ~17,000 LOC to write

---

## Technology Stack (React Approach)

**Core:**
- React 18 (functional components, hooks)
- TypeScript 5.x (strict mode)
- Vite (build tool, fast HMR)

**VSCode Integration:**
- @vscode/webview-ui-toolkit (native VSCode components)
- VSCode Webview API
- Custom TextEditorProvider

**State Management:**
- Zustand (lightweight, no boilerplate)
- Immer (immutable updates)
- Command pattern (undo/redo)

**Business Logic:**
- @apicurio/data-models v1.1.33 (reused from Angular)

**Forms:**
- react-hook-form (performance, validation)
- zod (schema validation)

**Styling:**
- CSS Modules (scoped styles)
- @vscode/webview-ui-toolkit theming

---

## Implementation Plan

### Phase Breakdown

**Week 1: Foundation (Task 018, 35-45h)**
- React + Vite setup
- Webview provider
- @apicurio/data-models integration
- Zustand stores (document, selection, validation, undo/redo)
- Command pattern infrastructure

**Weeks 2-3: Core UI (Task 019, 55-70h)**
- Master layout (3-column)
- Navigation tree
- Problem drawer
- Info form (title, contact, license)
- Server form
- Common component library

**Weeks 4-5: Forms (Task 020, 60-80h)**
- Path/operation forms (OpenAPI)
- Channel/message forms (AsyncAPI)
- Schema/definition editor
- Parameter/response editors
- Security scheme forms

**Weeks 6-7: Integration (Task 021, 50-65h)**
- Modal dialogs (20+ dialogs)
- VSCode message passing
- Save integration (Task 015)
- Conflict detection (Task 017)
- Testing (80%+ coverage)
- Bug fixes and polish

### Phase Gating

**Week 1 GO/NO-GO:**
- ✅ Webview provider working
- ✅ Document loads and parses
- ✅ No CSP violations
- ✅ State management functional

**Week 3 User Review:**
- ✅ Navigation tree functional
- ✅ Info form works
- ✅ User feedback incorporated

**Week 5 Feature Complete:**
- ✅ All forms implemented
- ✅ Validation working

**Week 7 Release Candidate:**
- ✅ Save integration works
- ✅ Tests passing
- ✅ No critical bugs

---

## Risks and Mitigation

### Risk 1: Underestimating Complexity
**Mitigation:**
- Weekly phase gating reviews
- Start with MVP scope
- Iterate based on feedback

### Risk 2: @apicurio/data-models Integration
**Mitigation:**
- Spike on integration in Week 1
- Test with real-world files early
- Contact Apicurio maintainers if needed

### Risk 3: Performance with Large Documents
**Mitigation:**
- Lazy loading for tree
- Virtual scrolling for lists
- Memoization for expensive operations
- Debounced validation (500ms)

### Risk 4: Feature Gaps
**Mitigation:**
- Focus on 80% use cases first
- Document missing features
- User feedback at Week 3

---

## Success Criteria

**Functional:**
- ✅ Can open OpenAPI 2.0/3.0 files
- ✅ Can open AsyncAPI 2.x files
- ✅ Can edit all major sections
- ✅ Validation works
- ✅ Undo/redo works
- ✅ Save integration works

**Technical:**
- ✅ No CSP violations
- ✅ 80%+ test coverage
- ✅ TypeScript strict mode
- ✅ Bundle size < 1.2 MB

**UX:**
- ✅ Layout matches Apicurio Studio
- ✅ Performance acceptable (< 100ms interactions)
- ✅ Keyboard shortcuts work
- ✅ Accessible (ARIA, focus)

**Integration:**
- ✅ Works with Task 015 (File System Provider)
- ✅ Works with Task 016 (Auto-Save)
- ✅ Works with Task 017 (Conflict Detection)

---

## MVP Feature Scope

**Must Have (Phase 3.2):**
- OpenAPI 2.0/3.0 support
- AsyncAPI 2.x support
- Navigation tree
- Info/Contact/License editing
- Path/Operation editing
- Schema/Definition editing
- Parameter/Response editing
- Validation
- Undo/Redo
- Save integration

**Nice to Have (Future):**
- Import from URL
- Code generation preview
- Mock server generation
- API documentation preview

**Out of Scope:**
- GraphQL support
- WSDL/SOAP support
- Real-time collaboration
- Git integration

---

## References

**Analysis Sources:**
- `/apicurio-registry/ui/ui-editors/` - Angular editor codebase
- `/apicurio-registry/ui/ui-app/src/editors/OpenApiEditor.tsx` - React integration pattern
- VSCode Extension API documentation
- VSCode CSP documentation

**Implementation Spec:**
- [Tasks 018-021 Specification](../tasks/todo/018-021-react-visual-editor.md)

**Project Planning:**
- [TODO.md](../TODO.md)
- [MASTER_PLAN.md](../MASTER_PLAN.md)

---

## Conclusion

The React rewrite approach is the **only viable option** due to VSCode's strict Content Security Policy requirements. While the effort is significant (200-260 hours vs 40-60 hours), the approach provides:

1. **Technical Feasibility:** Complies with VSCode CSP (no unsafe-eval)
2. **Full Control:** Complete ownership of codebase and features
3. **Better Integration:** Native VSCode patterns and components
4. **Code Reuse:** Can leverage @apicurio/data-models and other utilities (~30%)
5. **Smaller Bundle:** ~800 KB vs ~2-3 MB

The 7-week timeline is acceptable, and the investment will pay off with a maintainable, performant visual editor fully integrated with the VSCode extension.

---

**Document Version:** 1.0
**Author:** Development Team
**Date:** 2025-11-03
**Status:** Decision Final - Proceeding with React Approach
