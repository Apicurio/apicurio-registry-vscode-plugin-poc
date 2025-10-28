# Search Feature Testing Checklist

**Date:** 2025-10-23
**Feature:** Search Artifacts
**Status:** Ready for Testing

---

## Pre-Testing Setup ✅

- [ ] Registry is running at http://localhost:8080
- [ ] VSCode settings.json has connection configured
- [ ] Extension compiled successfully (`npm run compile`)
- [ ] Sample data loaded in registry

---

## Test Cases

### 1. Basic Search Functionality

#### Test 1.1: Search by Name ✓
**Steps:**
1. Press F5 to launch Extension Development Host
2. Open Apicurio Registry view in sidebar
3. Click "Connect to Registry"
4. Select "Local Registry"
5. Click Search icon (🔍) in toolbar
6. Select "Name" as search criteria
7. Enter "Pet" (or another artifact name)
8. Press Enter

**Expected:**
- Search executes with progress indicator
- Results show artifacts containing "Pet"
- Artifacts display with group prefix: `test-group/sample-petstore-api`
- State emoji (✓) visible
- Artifact type icon visible
- Description truncated to 30 chars

**Pass/Fail:** [ ]

---

#### Test 1.2: Search by Type (OpenAPI) ✓
**Steps:**
1. Click Search icon
2. Select "Type"
3. Select "OPENAPI" from dropdown
4. Press Enter

**Expected:**
- Dropdown shows all 9 artifact types
- Description shows "REST API specification"
- Results show only OPENAPI artifacts
- Notification shows count: "Found X artifacts matching Type: OPENAPI"

**Pass/Fail:** [ ]

---

#### Test 1.3: Search by State (Enabled) ✓
**Steps:**
1. Click Search icon
2. Select "State"
3. Select "ENABLED" from dropdown

**Expected:**
- Dropdown shows: ENABLED, DISABLED, DEPRECATED
- Descriptions explain each state
- Results show only enabled artifacts

**Pass/Fail:** [ ]

---

#### Test 1.4: Search by Group ✓
**Steps:**
1. Click Search icon
2. Select "Group"
3. Enter "test-group"

**Expected:**
- Placeholder shows: "e.g., com.example.apis"
- Validation requires 2+ characters
- Results show artifacts from test-group

**Pass/Fail:** [ ]

---

#### Test 1.5: Search by Description ✓
**Steps:**
1. Click Search icon
2. Select "Description"
3. Enter "testing" (or text from your artifact description)

**Expected:**
- Placeholder shows: "e.g., user management"
- Results show artifacts with matching description

**Pass/Fail:** [ ]

---

#### Test 1.6: Search by Labels ✓
**Steps:**
1. Click Search icon
2. Select "Labels"
3. Enter "environment=production"

**Expected:**
- Placeholder shows: "e.g., environment=production"
- Validation checks for "=" character
- Error if format is wrong
- Results show labeled artifacts

**Pass/Fail:** [ ]

---

### 2. Input Validation

#### Test 2.1: Empty Name Input ✗
**Steps:**
1. Search by "Name"
2. Leave input empty
3. Try to submit

**Expected:**
- Error message: "Name cannot be empty"
- Cannot proceed

**Pass/Fail:** [ ]

---

#### Test 2.2: Too Short Input ✗
**Steps:**
1. Search by "Name"
2. Enter single character "A"
3. Try to submit

**Expected:**
- Error message: "Name must be at least 2 characters"
- Cannot proceed

**Pass/Fail:** [ ]

---

#### Test 2.3: Invalid Label Format ✗
**Steps:**
1. Search by "Labels"
2. Enter "production" (without =)
3. Try to submit

**Expected:**
- Error message: "Label must be in format: key=value"
- Cannot proceed

**Pass/Fail:** [ ]

---

### 3. Results Display

#### Test 3.1: Results with Metadata ✓
**Steps:**
1. Search for any artifact
2. Hover over result items

**Expected:**
- Rich Markdown tooltip appears
- Shows artifact name (bold)
- Shows type with description
- Shows state with emoji
- Shows description (if available)

**Pass/Fail:** [ ]

---

#### Test 3.2: Multiple Results ✓
**Steps:**
1. Search by "Type" → "OPENAPI"
2. If you have multiple OpenAPI specs

**Expected:**
- All matching artifacts shown
- Each has correct group prefix
- Notification shows accurate count

**Pass/Fail:** [ ]

---

#### Test 3.3: No Results ✓
**Steps:**
1. Search for non-existent term: "XYZ123NotFound"

**Expected:**
- Tree shows: "No matching artifacts"
- Description: "No artifacts found matching name: XYZ123NotFound"
- Notification with "Try Again" button

**Pass/Fail:** [ ]

---

### 4. Filter Management

#### Test 4.1: Clear Filter ✓
**Steps:**
1. Perform any search
2. Click "Clear Filter" in notification

**Expected:**
- Tree returns to normal grouped view
- All groups and artifacts visible
- Search filter removed

**Pass/Fail:** [ ]

---

#### Test 4.2: Refresh While Filtered ✓
**Steps:**
1. Perform a search
2. Click Refresh button

**Expected:**
- Filter remains active
- Results update from registry
- Still shows filtered view

**Pass/Fail:** [ ]

---

#### Test 4.3: Multiple Searches ✓
**Steps:**
1. Search by "Type" → "OPENAPI"
2. Then search by "State" → "ENABLED"

**Expected:**
- Second search replaces first
- Only ENABLED artifacts shown (not OPENAPI filter)
- Previous filter cleared

**Pass/Fail:** [ ]

---

### 5. Error Handling

#### Test 5.1: Search While Disconnected ✗
**Steps:**
1. Don't connect to registry
2. Try to search

**Expected:**
- Error message: "Please connect to a registry first before searching."
- No API call made

**Pass/Fail:** [ ]

---

#### Test 5.2: Network Error ✗
**Steps:**
1. Connect to registry
2. Stop registry (docker stop)
3. Try to search

**Expected:**
- Progress indicator appears
- After timeout: error notification
- Error message includes retry button
- Clicking retry re-runs search

**Pass/Fail:** [ ]

---

#### Test 5.3: Cancel Wizard ✓
**Steps:**
1. Click Search
2. Select criteria
3. Press Esc before entering value

**Expected:**
- Wizard cancels cleanly
- No error messages
- Tree remains unchanged

**Pass/Fail:** [ ]

---

### 6. UX & Performance

#### Test 6.1: Progress Indicators ✓
**Steps:**
1. Search for anything
2. Watch for feedback

**Expected:**
- Step 1/2 shown in quick pick title
- Progress notification during API call
- Message: "Searching by [criterion]: [value]"

**Pass/Fail:** [ ]

---

#### Test 6.2: Keyboard Navigation ✓
**Steps:**
1. Click Search
2. Use arrow keys in dropdowns
3. Use Enter to select

**Expected:**
- Arrow keys navigate options
- Type to filter dropdown
- Enter selects and proceeds

**Pass/Fail:** [ ]

---

#### Test 6.3: Search Speed ✓
**Steps:**
1. Search with various criteria
2. Note response time

**Expected:**
- Results appear within 1-2 seconds
- No UI freezing
- Smooth transitions

**Pass/Fail:** [ ]

---

### 7. Edge Cases

#### Test 7.1: Special Characters ✓
**Steps:**
1. Search by name with special chars: "API-v2.0"

**Expected:**
- Handles special characters correctly
- No encoding errors

**Pass/Fail:** [ ]

---

#### Test 7.2: Very Long Names ✓
**Steps:**
1. If available, search for artifact with long name

**Expected:**
- Name truncated in tree item
- Full name in tooltip
- No layout issues

**Pass/Fail:** [ ]

---

#### Test 7.3: Case Sensitivity ✓
**Steps:**
1. Search for "pet" (lowercase)
2. Search for "PET" (uppercase)

**Expected:**
- Results may differ (API is case-sensitive)
- Both searches work without error

**Pass/Fail:** [ ]

---

### 8. Integration Tests

#### Test 8.1: Expand Filtered Artifact ✓
**Steps:**
1. Search for an artifact
2. Click to expand it

**Expected:**
- Artifact expands to show versions
- Versions load correctly
- State emojis on versions visible

**Pass/Fail:** [ ]

---

#### Test 8.2: Open Version from Search ✓
**Steps:**
1. Search for artifact
2. Expand to versions
3. Click a version

**Expected:**
- Version content opens
- `apicurioRegistry.openVersion` command works
- (May not be implemented yet - that's OK)

**Pass/Fail:** [ ]

---

#### Test 8.3: Command Palette ✓
**Steps:**
1. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Win/Linux)
2. Type "Search Artifacts"
3. Select command

**Expected:**
- Command appears in palette
- Launches search wizard
- Works same as toolbar button

**Pass/Fail:** [ ]

---

## Summary

**Total Tests:** 27
**Passed:** ___
**Failed:** ___
**Skipped:** ___

---

## Critical Bugs Found

| Bug # | Description | Severity | Steps to Reproduce |
|-------|-------------|----------|-------------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## UX Improvements Suggested

| # | Improvement | Priority |
|---|-------------|----------|
| 1 | | |
| 2 | | |
| 3 | | |

---

## Notes

- Test Environment:
- Registry Version:
- VSCode Version:
- Extension Version: 0.1.0

---

**Tester:** _______________
**Date:** _______________
**Status:** _______________
