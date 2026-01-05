# Task 036: Real-time Validation

## Overview

Implement real-time validation for API specification documents (OpenAPI/AsyncAPI) in the VSCode text editor. Users will see validation errors and warnings as they edit, displayed in:
- The VSCode Problems panel
- Squiggly underlines in the editor (red for errors, yellow for warnings)
- Hover tooltips showing the validation message

## Goals

1. **Real-time feedback**: Validate documents as users type (with debouncing)
2. **VSCode integration**: Use native VSCode diagnostics for familiar UX
3. **Schema validation**: Validate against OpenAPI/AsyncAPI specifications
4. **Line/column mapping**: Show errors at the correct location in the document

## Technical Approach

### Components

1. **ValidationDiagnosticsService** (`src/services/validationDiagnosticsService.ts`)
   - Creates and manages VSCode `DiagnosticCollection`
   - Listens for document changes on `apicurio://` scheme
   - Debounces validation calls (500ms delay)
   - Parses documents using `@apicurio/data-models`
   - Converts validation errors to VSCode `Diagnostic` objects

2. **Document Validation**
   - Parse JSON/YAML content
   - Use `@apicurio/data-models` Library for schema validation
   - Map validation errors to line/column positions

3. **Integration**
   - Register service in `extension.ts`
   - Clean up diagnostics when documents are closed

### Validation Types

1. **Syntax errors**: Invalid JSON/YAML
2. **Schema errors**: Missing required fields (info, title, version, paths/channels)
3. **Structural warnings**: Missing descriptions, deprecated usage

## Implementation Plan

### Phase 1: Core Service
- [x] Create `ValidationDiagnosticsService` class
- [x] Implement debounced validation on document change
- [x] Parse documents and detect syntax errors
- [x] Convert errors to VSCode Diagnostics

### Phase 2: Schema Validation
- [x] Integrate schema validation for OpenAPI/AsyncAPI
- [x] Map validation paths to line numbers
- [x] Support OpenAPI 2.0, 3.0, 3.1 and AsyncAPI

### Phase 3: Integration
- [x] Register service in extension.ts
- [x] Clean up diagnostics on document close
- [ ] Add status bar indicator for validation state (future enhancement)

## Test Cases

### Unit Tests

1. **Syntax validation**
   - Invalid JSON should show syntax error
   - Invalid YAML should show syntax error
   - Valid JSON/YAML should not show syntax errors

2. **Schema validation**
   - Missing `info` should show error
   - Missing `info.title` should show error
   - Missing `paths` and `webhooks` should show error (OpenAPI)
   - Missing `channels` should show error (AsyncAPI)

3. **Debouncing**
   - Multiple rapid changes should only trigger one validation
   - Validation should run after debounce delay

4. **Diagnostics**
   - Diagnostics should have correct severity
   - Diagnostics should have correct line/column
   - Diagnostics should be cleared on document close

### Manual Testing

1. Open an OpenAPI document from registry
2. Delete the `info` section
3. Verify error appears in Problems panel
4. Verify red squiggly line in editor
5. Hover over error to see message
6. Undo change and verify error disappears

## Files to Create/Modify

### New Files
- `src/services/validationDiagnosticsService.ts` - Main validation service
- `src/services/__tests__/validationDiagnosticsService.test.ts` - Unit tests

### Modified Files
- `src/extension.ts` - Register validation service
- `package.json` - Add any new dependencies if needed

## Dependencies

- `@apicurio/data-models` - Already in project for parsing/validation
- `yaml` - Already in project for YAML parsing
- VSCode API - `vscode.languages.createDiagnosticCollection`

## Success Criteria

- [x] Syntax errors are shown as users type
- [x] Schema validation errors are shown
- [x] Errors appear in Problems panel
- [x] Errors show as squiggly lines in editor
- [x] Validation is debounced (not on every keystroke)
- [x] Diagnostics are cleared when documents are closed
- [x] All tests pass (21/21 validation tests passing)

## Completion Notes

**Completed:** 2026-01-05

**Implementation Summary:**
- Created `ValidationDiagnosticsService` with debounced validation (500ms)
- Supports JSON and YAML syntax validation
- Schema validation for OpenAPI (2.0, 3.0, 3.1) and AsyncAPI (2.x)
- Validates required fields: info, info.title, info.version, paths/webhooks (OpenAPI), channels (AsyncAPI)
- Integrated with VSCode diagnostics for Problems panel and editor squiggly lines
- Validates on document open and on every text change (debounced)
- Clears diagnostics when documents are closed

**Files Created:**
- `src/services/validationDiagnosticsService.ts` - Main validation service
- `src/services/__tests__/validationDiagnosticsService.test.ts` - 21 test cases

**Files Modified:**
- `src/extension.ts` - Integration with document lifecycle
- `src/__mocks__/vscode.ts` - Added Diagnostic mocks for testing
- `src/__mocks__/yaml.ts` - Improved YAML mock for error detection

## Notes

- Use debounce of 500ms to balance responsiveness and performance
- Only validate `apicurio://` scheme documents
- Clear diagnostics before each validation run to remove stale errors
- Consider performance for large documents
