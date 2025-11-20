# Testing Documentation

This directory contains legacy testing documentation for the Apicurio VSCode Extension.

**NOTE:** Testing documentation has been consolidated. Please see:
- **[Comprehensive Testing Guide](../contributors/testing.md)** - Complete testing guide for contributors

This directory is kept for historical reference only.

## Legacy Directory Structure

```
/docs/testing/
└── guides/                    # Original testing guides (consolidated)
```

## Testing Guides (`/guides/`)

### Original Testing Documentation (Historical)

These guides have been consolidated into `docs/contributors/testing.md`:

- **TESTING_GUIDE.md** - Original comprehensive testing guide
- **AUTOMATED_TESTING_GUIDE.md** - Original automated testing setup
- **QUICK_TEST.md** - Original quick smoke test
- **TEST_SUMMARY.md** - Original test summary
- **TESTING_QUICK_START.md** - Original quick start guide

## Test Data and Scripts

Test data (sample artifacts) and utility scripts are located at:

```
/test-data/
├── artifacts/         # Sample artifact files
└── scripts/          # Utility scripts
```

See `/test-data/README.md` for details on:
- Sample artifacts for testing
- Populating registry with test data
- Testing MCP server configuration

## Quick Start

### For Manual Testing

1. **Populate test data** (if needed):
   ```bash
   node test-data/scripts/populate-registry.js
   ```

2. **Follow testing guides**:
   - General testing: See `guides/TESTING_GUIDE.md`
   - Quick test: See `guides/QUICK_TEST.md`
   - Task-specific: Check `task-tests/` for individual feature tests

### For Automated Testing

See `guides/AUTOMATED_TESTING_GUIDE.md` for setup and running automated tests.

## Running Tests

### Unit Tests

```bash
npm run test
```

### Linting

```bash
npm run lint
```

### TypeScript Compilation

```bash
npm run compile
```

### MCP Server Testing

```bash
./test-data/scripts/test-mcp-server.sh
```

## Contributing

When adding new features:

1. Create a task-specific testing guide in `task-tests/` (e.g., `XXX-TESTING_GUIDE.md`)
2. Document test cases in the task specification
3. Add sample artifacts to `/test-data/artifacts/` if needed
4. Update this README with any new testing resources

## Test Documentation Requirements

Per the Definition of Done in `CLAUDE.md`:

- [ ] Test cases documented in task spec
- [ ] Manual test guide created (for complex features)
- [ ] Test results recorded (pass/fail)
- [ ] Edge cases identified and tested

---

**Last Updated:** 2025-11-11
