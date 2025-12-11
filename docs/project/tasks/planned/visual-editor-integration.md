# Visual Editor Integration Task (Phase 4)

**Status:** ⏸️ BLOCKED - Waiting for external repository
**Priority:** High (deferred to Phase 4)
**Effort:** TBD (pending repository analysis)
**Dependencies:**
- External: apicurio-openapi-editor repository (https://github.com/Apicurio/apicurio-openapi-editor)
- Internal: Tasks 015-017 (Text editor infrastructure) - ✅ COMPLETE
**Phase:** 4 - Visual Editor Integration

---

## Overview

Integrate the external visual editor being developed by a teammate into the VSCode extension. The visual editor is being built in a separate repository (apicurio-openapi-editor) and will be integrated as a package rather than built from scratch.

**Strategic Change:**
- **Original Plan:** Build React-based visual editor from scratch (200-280h)
- **New Approach:** Integrate external package developed by teammate (effort TBD)
- **Rationale:** Avoid duplication of effort, leverage teammate's work

---

## Current Status

**BLOCKED:** Repository does not exist yet (404 error when attempting to access)
- Repository URL: https://github.com/Apicurio/apicurio-openapi-editor
- Status: Not created or URL incorrect
- Next Step: Wait for repository to be created and initial code to be available

**When repository becomes available:**
1. Analyze repository structure and technology stack
2. Understand the editor's API and integration points
3. Determine integration approach (npm package, iframe, webview, etc.)
4. Create detailed integration plan with effort estimates
5. Update this specification with specific implementation tasks

---

## Integration Approaches (To Be Determined)

Once the repository is available, we'll evaluate the following integration approaches:

### Option 1: NPM Package Integration
**Description:** Visual editor published as npm package, imported into VSCode extension
**Pros:**
- Clean dependency management
- Automatic updates via package.json
- Standard JavaScript bundling
**Cons:**
- Requires editor to be designed as library/component
- May need wrapper code for VSCode integration
**Best For:** If editor is built as reusable React/TypeScript package

### Option 2: Iframe Embedding
**Description:** Editor hosted separately, embedded via iframe in webview
**Pros:**
- Complete isolation between editor and extension
- Editor can be updated independently
- No bundling complexity
**Cons:**
- Content Security Policy restrictions
- Message passing complexity
- Performance considerations
**Best For:** If editor is web application with separate deployment

### Option 3: Webview Direct Integration
**Description:** Editor code bundled directly into VSCode webview
**Pros:**
- Full control over rendering
- Direct VSCode API access
- No CSP issues
**Cons:**
- Requires compatible technology stack
- May need significant adaptation
- Bundling complexity
**Best For:** If editor is built with VSCode webview in mind

---

## Preliminary Integration Tasks

These tasks will be refined once repository structure is known:

### Task 1: Repository Analysis (2-4h)
**Goal:** Understand the visual editor architecture
- Technology stack (React, Angular, Vue, etc.)
- Build system and bundling approach
- API surface and integration points
- Dependencies and requirements
- Deployment model

**Deliverables:**
- Architecture analysis document
- Integration approach recommendation
- Effort estimates for integration work

### Task 2: Integration Proof of Concept (4-6h)
**Goal:** Validate chosen integration approach
- Create minimal VSCode webview host
- Load visual editor in webview
- Test basic functionality
- Verify CSP compliance
- Identify integration challenges

**Deliverables:**
- Working POC demonstrating editor loading
- List of integration issues to resolve
- Updated effort estimates

### Task 3: VSCode Integration Layer (8-12h, estimated)
**Goal:** Create production-ready integration
- Webview provider implementation
- Message passing between extension and editor
- State synchronization
- Error handling
- Configuration management

**Deliverables:**
- Visual editor webview provider
- Extension ↔ editor communication layer
- Configuration UI
- Documentation

### Task 4: Save Infrastructure Integration (4-6h, estimated)
**Goal:** Connect editor to existing save infrastructure
- Integrate with ApicurioFileSystemProvider (Task 015)
- Connect to conflict detection system (Task 017)
- Implement auto-save if needed
- Handle draft vs published versions

**Deliverables:**
- Save integration working
- Conflict resolution working
- Draft editing supported

### Task 5: Testing & Polish (6-10h, estimated)
**Goal:** Ensure production quality
- Unit tests for integration layer
- Integration tests for full workflow
- Performance testing
- Error scenario testing
- User acceptance testing

**Deliverables:**
- Test suite (80%+ coverage)
- Performance benchmarks
- Bug fixes
- Documentation updates

---

## Dependencies

### External Dependencies
- ✅ **Teammate Development:** Visual editor being developed in separate repository
- ⏸️ **Repository Availability:** Repository must be created and accessible
- ⏸️ **Initial Release:** Editor must have initial working version
- ⏸️ **Documentation:** Editor API and integration docs must be available

### Internal Dependencies (Complete)
- ✅ **Task 015:** Custom Text Document Provider - provides infrastructure for file operations
- ✅ **Task 016:** Save & Auto-Save - save workflow established
- ✅ **Task 017:** Conflict Detection - conflict resolution system ready

---

## Success Criteria

Integration is successful when:
- [ ] Visual editor loads correctly in VSCode webview
- [ ] Can open OpenAPI/AsyncAPI documents in visual editor
- [ ] Can edit documents using visual editor UI
- [ ] Changes sync with text editor (if both open)
- [ ] Save workflow integrates with existing infrastructure (Tasks 015-017)
- [ ] Conflict detection works for visual editor edits
- [ ] Draft vs published version handling works
- [ ] No CSP violations or security issues
- [ ] Performance is acceptable (editor loads in <2 seconds)
- [ ] 80%+ test coverage for integration code

---

## Next Steps

**Immediate:**
1. ⏸️ Wait for external repository to be created
2. Monitor repository URL for availability
3. Continue with Phase 3 tasks (Admin & Utility features)

**When repository becomes available:**
1. Execute Task 1: Repository Analysis
2. Update this specification with specific integration approach
3. Create detailed task breakdown with effort estimates
4. Update MASTER_PLAN.md and TODO.md with new timeline
5. Begin integration work

---

## References

**Planning Documents:**
- [MASTER_PLAN.md](../../MASTER_PLAN.md) - Phase 4: Visual Editor Integration
- [TODO.md](../../TODO.md) - Phase 4 section
- [018-021-react-visual-editor.md](018-021-react-visual-editor.md) - Original (superseded) plan

**Related Tasks:**
- Task 015: Custom Text Document Provider
- Task 016: Save & Auto-Save
- Task 017: Conflict Detection

**External Resources:**
- Repository: https://github.com/Apicurio/apicurio-openapi-editor (not yet available)

---

**Last Updated:** 2025-11-XX
**Next Review:** When external repository becomes available
