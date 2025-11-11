#!/bin/bash

# Automated Test Runner for Search Feature
# This script runs all search-related tests and generates a report

set -e

echo "🧪 Apicurio VSCode Extension - Search Feature Test Automation"
echo "=============================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the apicurio-vscode-plugin directory"
    exit 1
fi

echo -e "${BLUE}Step 1: Installing dependencies...${NC}"
echo "-----------------------------------"
if npm install --silent; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Compiling TypeScript...${NC}"
echo "-------------------------------"
if npm run compile --silent; then
    echo -e "${GREEN}✓ TypeScript compiled${NC}"
else
    echo -e "${RED}❌ Compilation failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Running Search Feature Tests${NC}"
echo "--------------------------------------"
echo ""

# Run only search-related tests
echo "Running tests..."
npm test -- --testPathPattern="search" --coverage --verbose 2>&1 | tee test-output.log

# Check test result
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All search tests passed!${NC}"
    TEST_STATUS="PASSED"
else
    echo ""
    echo -e "${RED}❌ Some tests failed${NC}"
    TEST_STATUS="FAILED"
fi

echo ""
echo -e "${BLUE}Step 4: Generating Test Report${NC}"
echo "--------------------------------"

# Create test report
cat > TEST_REPORT.md <<EOF
# Search Feature Test Report

**Date:** $(date '+%Y-%m-%d %H:%M:%S')
**Status:** $TEST_STATUS
**Test Suite:** Search Feature

---

## Test Summary

\`\`\`
$(grep -A 20 "Test Suites:" test-output.log | head -25 || echo "Test summary not available")
\`\`\`

---

## Coverage Report

\`\`\`
$(grep -A 10 "Coverage summary" test-output.log || echo "Coverage report not available")
\`\`\`

---

## Detailed Output

See \`test-output.log\` for full test output.

---

## Test Files

- \`src/services/__tests__/registryService.search.test.ts\`
- \`src/providers/__tests__/registryTreeProvider.search.test.ts\`
- \`src/commands/__tests__/searchCommand.test.ts\`

---

## Next Steps

- [ ] Review any failing tests
- [ ] Check coverage report in \`coverage/\` directory
- [ ] Run manual testing if needed

EOF

echo -e "${GREEN}✓ Test report generated: TEST_REPORT.md${NC}"

echo ""
echo -e "${BLUE}Step 5: Coverage Report${NC}"
echo "------------------------"

if [ -d "coverage" ]; then
    echo -e "${GREEN}✓ Coverage report available at: coverage/lcov-report/index.html${NC}"
    echo ""
    echo "To view coverage:"
    echo "  open coverage/lcov-report/index.html"
else
    echo -e "${YELLOW}⚠ Coverage report not generated${NC}"
fi

echo ""
echo "=============================================================="
echo -e "${GREEN}🎉 Test Automation Complete!${NC}"
echo "=============================================================="
echo ""
echo "Results:"
echo "  - Test Status: $TEST_STATUS"
echo "  - Test Output: test-output.log"
echo "  - Test Report: TEST_REPORT.md"
echo "  - Coverage: coverage/lcov-report/index.html"
echo ""

# Exit with test status
if [ "$TEST_STATUS" = "PASSED" ]; then
    exit 0
else
    exit 1
fi
