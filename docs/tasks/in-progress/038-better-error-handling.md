# Task 038: Better Error Handling

## Overview

Implement a centralized error handling system with an output channel for verbose logging, custom error classes, and improved user-facing error messages.

## Goals

1. **Output Channel** - Dedicated output channel for detailed error logs
2. **Custom Error Classes** - Type-safe error handling with specific error types
3. **Error Handler Utility** - Centralized error handling with consistent behavior
4. **Improved Messages** - More contextual and actionable error messages

## Technical Approach

### Components

1. **ErrorHandlerService** (`src/services/errorHandlerService.ts`)
   - Output channel management
   - Error logging with timestamps
   - User notification (error/warning/info)
   - Error classification

2. **Custom Error Classes** (`src/errors/apicurioErrors.ts`)
   - `ApicurioError` - Base error class
   - `NetworkError` - Connection/API errors
   - `ValidationError` - Input validation errors
   - `NotFoundError` - Missing resource errors
   - `AuthenticationError` - Auth-related errors

### Integration Points

- Replace ad-hoc `showErrorMessage` calls with error handler
- Add output channel to extension activation
- Provide "Show Details" action for complex errors

## Implementation Plan

### Phase 1: Error Classes & Handler Service
- [x] Create custom error classes
- [x] Create ErrorHandlerService with output channel
- [x] Add logging with timestamps
- [x] Add "Show Details" action

### Phase 2: Integration
- [x] Register output channel in extension.ts
- [ ] Update key commands to use error handler (future enhancement)

### Phase 3: Testing
- [x] Unit tests for error classes
- [x] Unit tests for error handler service
- [x] Test error logging and user notifications

## Test Cases

### Unit Tests

1. **Error Classes**
   - ApicurioError should include code and userMessage
   - NetworkError should include status code
   - ValidationError should include field info
   - NotFoundError should include resource type

2. **ErrorHandlerService**
   - Should log errors to output channel
   - Should show error message to user
   - Should provide "Show Details" action
   - Should format error with timestamp
   - Should classify errors by type

## Files to Create/Modify

### New Files
- `src/errors/apicurioErrors.ts` - Custom error classes
- `src/services/errorHandlerService.ts` - Error handler service
- `src/services/__tests__/errorHandlerService.test.ts` - Unit tests
- `src/errors/__tests__/apicurioErrors.test.ts` - Unit tests

### Modified Files
- `src/extension.ts` - Register output channel

## Success Criteria

- [x] Custom error classes with type safety
- [x] Output channel showing detailed error logs
- [x] "Show Details" action on error messages
- [x] All tests passing (33 tests: 16 error classes + 17 error handler)

## Completion Notes

**Completed:** 2026-01-07

**Implementation Summary:**
- Created 6 custom error classes: ApicurioError, NetworkError, ValidationError, NotFoundError, AuthenticationError, OperationError
- Created ErrorHandlerService with output channel "Apicurio Registry"
- Errors include timestamps, codes, and user-friendly messages
- "Show Details" action shows output channel for debugging
- Singleton pattern for global error handler access

**Files Created:**
- `src/errors/apicurioErrors.ts` - 6 custom error classes
- `src/errors/__tests__/apicurioErrors.test.ts` - 16 test cases
- `src/services/errorHandlerService.ts` - Error handler service
- `src/services/__tests__/errorHandlerService.test.ts` - 17 test cases

**Files Modified:**
- `src/extension.ts` - Register error handler service
- `src/__mocks__/vscode.ts` - Add OutputChannel mock
