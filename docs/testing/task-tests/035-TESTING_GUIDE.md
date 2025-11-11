# Task 035: Import/Export Operations - Testing Guide

**Task:** Import/Export Operations
**Status:** 🚧 Ready for Testing
**Tester:** Manual testing required
**Date:** 2025-11-07

---

## Quick Test Checklist

Use this checklist to track your testing progress:

- [ ] **Test 1:** Export All Artifacts
- [ ] **Test 2:** Import Valid ZIP
- [ ] **Test 3:** Import with Conflicts
- [ ] **Test 4:** Export Group (not implemented)
- [ ] **Edge Case:** Empty Registry Export
- [ ] **Edge Case:** Invalid ZIP Import

**Estimated Testing Time:** 15-20 minutes

---

## Prerequisites

Before testing, ensure:
- ✅ Extension compiled successfully (`npm run compile`)
- ✅ Extension Development Host running (Press F5)
- ✅ Connected to Apicurio Registry
- ✅ Registry has test data (run `node test-data/scripts/populate-registry.js` if empty)

---

## Test 1: Export All Artifacts

**Goal:** Verify that all registry artifacts can be exported to a ZIP file.

### Steps

1. In the Apicurio Registry tree view, locate the toolbar at the top
2. Click the **cloud download icon** (☁️↓) labeled "Export All Artifacts"
3. In the save dialog:
   - Default filename should be `registry-export-YYYY-MM-DD.zip`
   - Choose a save location (e.g., Desktop)
   - Click "Export Registry"

### Expected Results

✅ **During Export:**
- Progress notification appears: "Exporting registry"
- Message updates: "Fetching artifacts from registry..."
- Message updates: "Saving file (X.X KB/MB)..."
- Progress completes: "Complete!"

✅ **After Export:**
- Success notification: "Registry exported successfully to [path]"
- "Reveal in Finder" button appears
- ZIP file exists at chosen location
- File size is reasonable (>0 bytes, matches progress message)

✅ **Click "Reveal in Finder":**
- Finder/Explorer opens showing the ZIP file

### Pass Criteria

- [x] Progress notification displayed
- [x] ZIP file created at correct location
- [x] File size matches expected size
- [x] "Reveal in Finder" works correctly
- [x] No errors in console

### Troubleshooting

**Issue:** No progress notification appears
**Fix:** Check Developer Console (Help → Toggle Developer Tools) for errors

**Issue:** Export fails with "Not connected to registry"
**Fix:** Ensure you're connected to a registry (check tree view shows groups)

**Issue:** File size is 0 bytes
**Fix:** Registry might be empty - populate with test data first

---

## Test 2: Import Valid ZIP

**Goal:** Verify that a valid ZIP file can be imported successfully.

### Steps

1. **Prerequisites:** Have a ZIP file from Test 1 (export)
2. Clear the registry (optional - to see import clearly):
   - Delete all groups manually, OR
   - Use a fresh registry instance
3. Click the **cloud upload icon** (☁️↑) labeled "Import Artifacts from ZIP"
4. In the file picker:
   - Navigate to your exported ZIP file
   - Click "Import Registry"
5. **Modal confirmation** appears with warning:
   - Message: "Import artifacts from [path]?"
   - Warning: "⚠️ Warning: This may overwrite existing artifacts with the same IDs."
   - Click **"Import"** button

### Expected Results

✅ **During Import:**
- Progress notification appears: "Importing artifacts"
- Message updates: "Reading ZIP file (X.X KB/MB)..."
- Message updates: "Uploading to registry..."
- Progress completes: "Complete!"

✅ **After Import:**
- Success notification: "Artifacts imported successfully"
- Tree view **refreshes automatically**
- Imported groups/artifacts appear in tree
- All artifacts from ZIP are now visible

### Pass Criteria

- [x] Modal confirmation shown before import
- [x] Progress notification displayed
- [x] Import completes without errors
- [x] Tree refreshes automatically
- [x] All expected artifacts appear in tree
- [x] No errors in console

### Troubleshooting

**Issue:** Import hangs on "Uploading to registry..."
**Fix:** Check registry is running and accessible

**Issue:** Tree doesn't refresh after import
**Fix:** Manually click refresh button - may be a bug

**Issue:** Some artifacts missing after import
**Fix:** Check if they were filtered out by user preferences

---

## Test 3: Import with Conflicts

**Goal:** Verify that import conflict errors are handled gracefully.

### Steps

1. **Prerequisites:** Registry has existing artifacts (from Test 2)
2. Try to import the **same ZIP file again** (artifacts already exist)
3. Click cloud upload icon
4. Select the same ZIP file
5. Click "Import" in confirmation dialog

### Expected Results

✅ **During Import:**
- Progress notification appears
- Import attempt begins

❌ **Import Fails (Expected):**
- Error notification appears
- Error message: "Import failed: Some artifacts already exist (conflict)"
- Helpful suggestion: "To resolve: 1. Delete conflicting artifacts first, or 2. Export current registry as backup before importing"

✅ **After Error:**
- Tree view remains unchanged
- No partial import (no new artifacts added)
- Registry state unchanged

### Pass Criteria

- [x] Error message is clear and specific
- [x] Error suggests resolution steps
- [x] No partial import occurred
- [x] Registry state is unchanged
- [x] User understands what went wrong

### Troubleshooting

**Issue:** Import succeeds instead of failing
**Fix:** Registry API might be configured to allow overwrites - check registry version

**Issue:** Partial import occurred (some artifacts added)
**Fix:** This is a registry API behavior - document as known issue

---

## Test 4: Export Group (Future Feature)

**Goal:** Verify "not implemented" message for group-specific export.

### Steps

1. Right-click on any **group** in the tree view
2. Select **"Export Group"** from context menu

### Expected Results

✅ **Information Dialog:**
- Title: Information
- Message: "Group-specific export not yet implemented."
- Suggestion: "Use 'Export All Artifacts' to export the entire registry, then filter manually."
- Button: "Export All Instead"

✅ **Click "Export All Instead":**
- Triggers Test 1 flow (Export All)
- File save dialog appears

### Pass Criteria

- [x] Context menu shows "Export Group" option
- [x] Dialog explains feature not implemented
- [x] Offers alternative solution
- [x] "Export All Instead" button works

---

## Edge Case Tests

### Edge Case 1: Empty Registry Export

**Goal:** Verify export works even with empty registry.

**Steps:**
1. Delete all groups from registry (empty state)
2. Click "Export All"
3. Save ZIP file

**Expected:**
- ✅ Export succeeds (no errors)
- ✅ ZIP file created (may be very small, ~1-2 KB)
- ✅ ZIP contains minimal data (metadata only)

---

### Edge Case 2: Invalid ZIP Import

**Goal:** Verify error handling for non-registry ZIP files.

**Steps:**
1. Create or find a random ZIP file (not registry export)
2. Try to import it
3. Confirm import

**Expected:**
- ❌ Import fails
- ✅ Error message: "Import failed: Invalid or corrupted ZIP file"
- ✅ Suggestion: "Ensure the ZIP file was created by Apicurio Registry export."

---

## Test Results Template

Copy this template to record your test results:

```
Date: YYYY-MM-DD
Tester: [Your Name]
Extension Version: 0.2.0
Registry Version: 3.1.1

Test 1: Export All Artifacts
Status: [ ] PASS [ ] FAIL
Notes:

Test 2: Import Valid ZIP
Status: [ ] PASS [ ] FAIL
Notes:

Test 3: Import with Conflicts
Status: [ ] PASS [ ] FAIL
Notes:

Test 4: Export Group
Status: [ ] PASS [ ] FAIL
Notes:

Edge Case 1: Empty Registry
Status: [ ] PASS [ ] FAIL
Notes:

Edge Case 2: Invalid ZIP
Status: [ ] PASS [ ] FAIL
Notes:

Overall Result: [ ] ALL PASS [ ] SOME FAILURES

Issues Found:
1.
2.

Suggestions:
1.
2.
```

---

## Common Issues & Solutions

### Issue: "Not connected to registry"
**Solution:**
1. Click "Connect to Registry" button
2. Select your registry connection
3. Wait for tree to populate

### Issue: ZIP file is 0 bytes
**Solution:**
1. Check registry has data (tree view shows groups)
2. Check network connectivity to registry
3. Check browser console for API errors

### Issue: Import says "conflict" but I want to overwrite
**Solution:**
1. Currently not supported - delete existing artifacts first
2. Or: Export current state as backup, then delete, then import

### Issue: Tree doesn't refresh after import
**Solution:**
1. Click manual refresh button (🔄)
2. If issue persists, report as bug

---

## Reporting Issues

If you find bugs during testing, report them with:

1. **Test name** (e.g., "Test 2: Import Valid ZIP")
2. **Steps to reproduce**
3. **Expected result**
4. **Actual result**
5. **Console errors** (if any)
6. **Screenshots** (if helpful)

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark test results in this document
2. ✅ Update task spec with "Manual Testing Complete"
3. ✅ Move task to `tasks/completed/`
4. ✅ Update TODO.md
5. ✅ Commit documentation updates

---

**Last Updated:** 2025-11-07
**Status:** Ready for Testing
