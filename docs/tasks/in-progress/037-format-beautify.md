# Task 037: Format/Beautify Command

## Overview

Implement a format/beautify command for API specification documents (OpenAPI/AsyncAPI). Users can format their documents with consistent indentation and structure.

## Goals

1. **Format JSON documents** - Consistent 2-space indentation
2. **Format YAML documents** - Consistent 2-space indentation, proper line width
3. **Preserve format** - JSON stays JSON, YAML stays YAML
4. **Keyboard shortcut** - Standard VSCode formatting shortcut (Shift+Alt+F)
5. **Context menu** - Right-click to format

## Technical Approach

### Components

1. **FormatService** (`src/services/formatService.ts`)
   - Detect document format (JSON/YAML)
   - Parse and re-serialize with consistent formatting
   - Handle errors gracefully

2. **Format Command** (`src/commands/formatCommand.ts`)
   - Register as document formatting provider
   - Apply formatting to entire document
   - Show success/error messages

### Integration Points

- Register as `DocumentFormattingEditProvider` for apicurio scheme
- Support `editor.action.formatDocument` command
- Add to context menu for registry documents

## Implementation Plan

### Phase 1: Format Service
- [x] Create `FormatService` class
- [x] Implement JSON formatting (2-space indent)
- [x] Implement YAML formatting (2-space indent, no line wrapping)
- [x] Handle parse errors gracefully

### Phase 2: VSCode Integration
- [x] Register as DocumentFormattingEditProvider
- [x] Support Shift+Alt+F shortcut
- [ ] Add context menu entry (future enhancement)

### Phase 3: Testing
- [x] Unit tests for format service
- [x] Test JSON formatting
- [x] Test YAML formatting
- [x] Test error handling

## Test Cases

### Unit Tests

1. **JSON Formatting**
   - Minified JSON should be formatted with 2-space indent
   - Already formatted JSON should remain unchanged
   - Invalid JSON should return error

2. **YAML Formatting**
   - Compressed YAML should be formatted with 2-space indent
   - Already formatted YAML should remain unchanged
   - Invalid YAML should return error

3. **Format Detection**
   - JSON content should be detected as JSON
   - YAML content should be detected as YAML

## Files to Create/Modify

### New Files
- `src/services/formatService.ts` - Format service
- `src/services/__tests__/formatService.test.ts` - Unit tests
- `src/commands/formatCommand.ts` - Format command

### Modified Files
- `src/extension.ts` - Register formatting provider
- `package.json` - Add command and menu contributions

## Success Criteria

- [x] JSON documents can be formatted
- [x] YAML documents can be formatted
- [x] Shift+Alt+F works on registry documents
- [x] Format preserves document content (no data loss)
- [x] All tests pass (19/19 format tests passing)

## Completion Notes

**Completed:** 2026-01-05

**Implementation Summary:**
- Created `FormatService` with format detection and formatting
- Supports JSON (2-space indent) and YAML (2-space indent, no line wrapping)
- Supports custom indent size
- Integrated with VSCode as DocumentFormattingEditProvider
- Standard Shift+Alt+F shortcut works on Apicurio documents
- Added `apicurioRegistry.formatDocument` command

**Files Created:**
- `src/services/formatService.ts` - Format service
- `src/services/__tests__/formatService.test.ts` - 19 test cases
- `src/commands/formatCommand.ts` - Format command and provider

**Files Modified:**
- `src/extension.ts` - Register formatting provider and command
- `package.json` - Add format command contribution
