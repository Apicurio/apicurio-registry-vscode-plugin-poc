# PRD: Phase 2.1b - Enhanced Status Indicators

**Phase:** 2.1b - Status Indicators and Badges
**Status:** 📝 Planning
**Created:** October 10, 2025
**Estimated Effort:** 3-5 days
**Dependencies:** Phase 2.1a (Custom Icons) ✅ Complete

---

## Table of Contents
1. [Overview](#overview)
2. [Goals and Objectives](#goals-and-objectives)
3. [User Stories](#user-stories)
4. [Current State vs Desired State](#current-state-vs-desired-state)
5. [Functional Requirements](#functional-requirements)
6. [Technical Design](#technical-design)
7. [Implementation Tasks](#implementation-tasks)
8. [Testing Strategy](#testing-strategy)
9. [Success Metrics](#success-metrics)
10. [Out of Scope](#out-of-scope)
11. [Open Questions](#open-questions)

---

## Overview

Phase 2.1b enhances the tree view with advanced status indicators, color coding, and informational badges. Building on the custom icons from Phase 2.1a, this phase adds visual cues that help users quickly identify artifact states, version counts, and group sizes at a glance.

### Problem Statement

Currently (after Phase 2.1a):
- State information is shown via emoji in descriptions (✓, ⚠, ✗)
- Artifact and version counts are shown as plain text
- No color differentiation between states
- No visual prominence for important state changes
- Users must read text to understand status

### Proposed Solution

Enhance the tree view with:
- **Color-coded icons** based on artifact/version state
- **Badge decorations** showing counts prominently
- **Visual state hierarchy** (enabled → draft → deprecated → disabled)
- **Consistent color language** across the extension
- **Accessibility-compliant** color choices

---

## Goals and Objectives

### Primary Goals
1. **Enhance Visual Clarity**: Make states immediately recognizable through color
2. **Improve Scannability**: Enable quick identification of important items
3. **Add Context**: Show counts and status at a glance
4. **Maintain Accessibility**: Ensure colors meet WCAG 2.1 AA standards
5. **Performance**: Keep tree rendering fast even with decorations

### Non-Goals
- Implementing filtering by state (deferred to Phase 2.2)
- Adding custom state definitions (use registry states only)
- Implementing batch state changes (deferred to Phase 2.3)
- Adding state change history (out of scope)

---

## User Stories

### As a Registry User

**Story 1: State Recognition**
```
As a registry user
I want to see artifact states indicated by color
So that I can quickly identify deprecated or disabled artifacts
```
**Acceptance Criteria:**
- Deprecated artifacts show warning color (yellow/orange)
- Disabled artifacts show error color (red/gray)
- Enabled artifacts show success color (green/blue)
- Draft versions show info color (blue/purple)

**Story 2: Count Visibility**
```
As a registry user
I want to see version counts on artifacts
So that I know how many versions exist without expanding
```
**Acceptance Criteria:**
- Version count badge appears on artifact items
- Count updates when versions are added/removed
- Badge is visually distinct and readable

**Story 3: Group Overview**
```
As a registry user
I want to see artifact counts on groups
So that I can identify which groups have content
```
**Acceptance Criteria:**
- Artifact count badge appears on group items
- Empty groups show (0) or different styling
- Count updates on refresh

**Story 4: Visual Hierarchy**
```
As a registry user
I want state colors to indicate severity
So that I can prioritize my attention on problematic items
```
**Acceptance Criteria:**
- Disabled (highest severity) → red
- Deprecated (medium severity) → yellow
- Draft (low severity) → blue
- Enabled (normal) → green/default

---

## Current State vs Desired State

### Current State (Phase 2.1a Complete)

**Group Node:**
```
📁 icon-test-group (9)
```
- ✅ Folder icon
- ✅ Count in description
- ❌ No color coding
- ❌ No badge decoration

**Artifact Node:**
```
🌐 petstore-api ✓ REST API for pet...
```
- ✅ Type-specific icon
- ✅ State emoji
- ✅ Truncated description
- ❌ No color on icon
- ❌ No version count

**Version Node:**
```
🏷️ 1.0.0 ✓
```
- ✅ Tag icon
- ✅ State emoji
- ❌ No color coding

### Desired State (Phase 2.1b Complete)

**Group Node:**
```
📁 icon-test-group                [9]
    ↑                              ↑
    Default color                  Badge decoration
```

**Artifact Node (Deprecated):**
```
🌐 petstore-api ⚠ REST API...    [3]
    ↑            ↑                 ↑
    Orange icon  Emoji             Version count badge
```

**Artifact Node (Disabled):**
```
🔌 db-connector ✗ Database...     [1]
    ↑            ↑                 ↑
    Red/gray     Emoji             Version count badge
```

**Version Node (Draft):**
```
🏷️ 2.0.0-draft 📝
    ↑            ↑
    Blue icon    Draft emoji
```

---

## Functional Requirements

### FR1: State-Based Icon Coloring

**Description:** Icons change color based on artifact or version state

**States and Colors:**

| State | Theme Color | Fallback Hex | Visual Intent |
|-------|-------------|--------------|---------------|
| ENABLED | `charts.green` | `#4CAF50` | Success, normal operation |
| DISABLED | `charts.red` / `disabledForeground` | `#F44336` | Error, item unavailable |
| DEPRECATED | `charts.yellow` / `list.warningForeground` | `#FFA726` | Warning, needs attention |
| DRAFT | `charts.blue` / `editorInfo.foreground` | `#2196F3` | Info, work in progress |

**VSCode Theme Integration:**
- Use VSCode ThemeColor for automatic light/dark theme support
- Fallback to semantic colors if chart colors unavailable
- Ensure 4.5:1 contrast ratio for text (WCAG AA)

**Implementation:**
```typescript
// Example: Deprecated artifact
new vscode.ThemeIcon(
    'symbol-method',  // Icon ID
    new vscode.ThemeColor('list.warningForeground')  // Color
);
```

### FR2: Version Count Badges

**Description:** Show version count on artifact tree items

**Display Rules:**
- Show count for all artifacts with versions
- Format: `[N]` where N is version count
- Position: End of description, after emoji and text
- Update: Refresh when versions added/removed

**Examples:**
```
petstore-api ✓ REST API for pet store...    [5]
user-schema ⚠ Avro schema (old)             [12]
db-connector ✗ Disabled                      [1]
```

**Edge Cases:**
- No versions: Show `[0]` or omit badge
- 1 version: Show `[1]`
- 100+ versions: Show `[99+]` or exact count

### FR3: Artifact Count Badges

**Description:** Show artifact count on group tree items

**Display Rules:**
- Show count for all groups
- Format: `[N]` where N is artifact count
- Position: End of label or in description
- Update: Refresh when artifacts added/removed

**Examples:**
```
default                                      [23]
com.example.apis                             [7]
legacy-schemas                               [0]
```

**Visual States:**
- Empty groups (0): Optionally dim color or different icon
- Small groups (1-10): Normal styling
- Large groups (50+): Consider performance optimization

### FR4: State Decoration Logic

**Description:** Apply decorations consistently across all node types

**Decoration Priority:**
1. **Icon color** (highest priority - immediate recognition)
2. **State emoji** (medium priority - textual confirmation)
3. **Description color** (optional - additional context)

**Consistency Rules:**
- Same state always uses same color
- Color applies to icon, not background
- Emoji always matches state
- Badges use consistent formatting

### FR5: Color Accessibility

**Description:** Ensure colors are accessible to all users

**Requirements:**
- Minimum 4.5:1 contrast ratio for small text
- Minimum 3:1 contrast ratio for icons (WCAG AA)
- Do not rely solely on color (also use emoji/text)
- Test with colorblind simulators
- Support high contrast themes

**Theme Compatibility:**
- Light theme: Use darker, saturated colors
- Dark theme: Use lighter, less saturated colors
- High contrast: Respect user's theme settings
- Automatic adaptation via VSCode ThemeColor

---

## Technical Design

### Architecture Overview

```
RegistryTreeDataProvider.getTreeItem()
    ↓
    ├─→ IconService.getCombinedIcon(type, state)
    │       ↓
    │       └─→ Returns ThemeIcon with color
    │
    ├─→ StateDecoratorService.getStateColor(state)
    │       ↓
    │       └─→ Returns ThemeColor for state
    │
    └─→ BadgeService.formatBadge(count)
            ↓
            └─→ Returns formatted badge string
```

### New Services

#### 1. StateDecoratorService

**Purpose:** Centralize state-to-color mapping

**File:** `src/services/stateDecoratorService.ts`

**Methods:**
```typescript
class StateDecoratorService {
    /**
     * Get theme color for artifact/version state
     */
    static getStateColor(state: string): vscode.ThemeColor | undefined;

    /**
     * Get icon with state-based color
     */
    static getColoredIcon(iconId: string, state: string): vscode.ThemeIcon;

    /**
     * Determine if state should be visually prominent
     */
    static isHighPriorityState(state: string): boolean;
}
```

**Color Mappings:**
```typescript
const STATE_COLORS: Record<string, string> = {
    [ArtifactState.ENABLED]: 'charts.green',
    [ArtifactState.DISABLED]: 'charts.red',
    [ArtifactState.DEPRECATED]: 'list.warningForeground',
    [VersionState.DRAFT]: 'editorInfo.foreground'
};
```

#### 2. BadgeService

**Purpose:** Format count badges consistently

**File:** `src/services/badgeService.ts`

**Methods:**
```typescript
class BadgeService {
    /**
     * Format version count badge
     */
    static formatVersionCount(count: number): string;

    /**
     * Format artifact count badge
     */
    static formatArtifactCount(count: number): string;

    /**
     * Get badge with optional max display
     */
    static formatCount(count: number, maxDisplay?: number): string;
}
```

**Examples:**
```typescript
BadgeService.formatCount(5)      // "[5]"
BadgeService.formatCount(0)      // "" (empty)
BadgeService.formatCount(150, 99) // "[99+]"
```

### Enhanced RegistryTreeDataProvider

**Modifications to `getTreeItem()`:**

```typescript
getTreeItem(element: RegistryItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(element.label);

    switch (element.type) {
        case RegistryItemType.Group:
            treeItem.iconPath = IconService.getGroupIcon();

            // Add artifact count badge
            const artifactCount = element.metadata?.artifactCount || 0;
            const badge = BadgeService.formatArtifactCount(artifactCount);
            treeItem.description = badge;
            break;

        case RegistryItemType.Artifact:
            const state = element.metadata?.state;
            const type = element.metadata?.artifactType;

            // Get colored icon based on state
            treeItem.iconPath = StateDecoratorService.getColoredIcon(
                IconService.getIconForArtifactType(type).id,
                state
            );

            // Build description: emoji + text + version badge
            const stateEmoji = IconService.getStateEmoji(state);
            const description = element.metadata?.description || '';
            const truncated = description.substring(0, 30);
            const versionCount = element.metadata?.versionCount || 0;
            const versionBadge = BadgeService.formatVersionCount(versionCount);

            treeItem.description = `${stateEmoji} ${truncated}${versionBadge}`;
            break;

        case RegistryItemType.Version:
            const versionState = element.metadata?.state;

            // Get colored icon
            treeItem.iconPath = StateDecoratorService.getColoredIcon(
                'tag',
                versionState
            );

            // Add state emoji
            const versionEmoji = IconService.getStateEmoji(versionState);
            treeItem.description = versionEmoji;
            break;
    }

    return treeItem;
}
```

### Data Flow

1. **Tree View Renders**: VSCode calls `getTreeItem()` for each visible node
2. **State Retrieved**: Element metadata contains state information
3. **Color Determined**: StateDecoratorService maps state to ThemeColor
4. **Icon Created**: ThemeIcon created with color
5. **Badge Formatted**: BadgeService formats count
6. **TreeItem Returned**: Complete TreeItem with decorations

### Performance Considerations

**Optimization Strategies:**
1. **Lazy Evaluation**: Only compute decorations when needed
2. **Caching**: Cache ThemeColor instances
3. **Batch Updates**: Minimize tree refresh calls
4. **Incremental Rendering**: Let VSCode handle virtual scrolling

**Expected Performance:**
- Icon color lookup: O(1) - direct map access
- Badge formatting: O(1) - simple string operation
- Per-item overhead: <1ms
- Tree with 1000 items: <1 second to render

---

## Implementation Tasks

### Task 1: Create StateDecoratorService

**Estimated Time:** 4-6 hours

**Subtasks:**
1. Create `src/services/stateDecoratorService.ts`
2. Implement `getStateColor()` method
3. Implement `getColoredIcon()` method
4. Implement `isHighPriorityState()` helper
5. Add JSDoc documentation
6. Export service from module

**Acceptance Criteria:**
- All 4 states map to correct ThemeColors
- Unknown states return undefined
- Case-insensitive state handling
- No external dependencies

### Task 2: Create BadgeService

**Estimated Time:** 3-4 hours

**Subtasks:**
1. Create `src/services/badgeService.ts`
2. Implement `formatVersionCount()` method
3. Implement `formatArtifactCount()` method
4. Implement `formatCount()` with max display
5. Add configuration for badge format
6. Add JSDoc documentation

**Acceptance Criteria:**
- Counts format consistently
- Zero counts handled appropriately
- Large counts (99+) truncate correctly
- Customizable badge characters

### Task 3: Update RegistryTreeDataProvider

**Estimated Time:** 6-8 hours

**Subtasks:**
1. Import StateDecoratorService and BadgeService
2. Update Group node decoration logic
3. Update Artifact node decoration logic
4. Update Version node decoration logic
5. Add version count metadata retrieval
6. Test with all state combinations
7. Update tooltips to include count info

**Acceptance Criteria:**
- All states show correct colors
- All badges display correctly
- Tooltips updated
- No performance regression
- Backward compatible with Phase 2.1a

### Task 4: Create Unit Tests

**Estimated Time:** 6-8 hours

**Subtasks:**
1. Create `src/services/stateDecoratorService.test.ts`
2. Test all state color mappings
3. Test `getColoredIcon()` with all states
4. Create `src/services/badgeService.test.ts`
5. Test badge formatting edge cases
6. Test zero, normal, and large counts
7. Achieve ≥80% code coverage

**Test Cases:**
- StateDecoratorService: ~20 tests
- BadgeService: ~15 tests
- Total: ~35 new tests

**Acceptance Criteria:**
- All tests pass
- Coverage ≥80%
- Edge cases tested
- Performance tests added

### Task 5: Test All State Combinations

**Estimated Time:** 4-6 hours

**Subtasks:**
1. Update `test-icons.sh` to create all state combinations
2. Test ENABLED artifacts with various version counts
3. Test DEPRECATED artifacts
4. Test DISABLED artifacts
5. Test DRAFT versions
6. Test empty groups (0 artifacts)
7. Test large groups (50+ artifacts)
8. Verify color visibility in light and dark themes
9. Test with colorblind simulators
10. Document visual test results

**Acceptance Criteria:**
- All states render correctly
- Colors visible in both themes
- Badges show correct counts
- No visual glitches
- Accessible to colorblind users

---

## Testing Strategy

### Unit Testing

**StateDecoratorService Tests:**
```typescript
describe('StateDecoratorService', () => {
    describe('getStateColor', () => {
        it('should return green for ENABLED state');
        it('should return red for DISABLED state');
        it('should return yellow for DEPRECATED state');
        it('should return blue for DRAFT state');
        it('should return undefined for unknown state');
        it('should handle lowercase states');
        it('should handle null/undefined');
    });

    describe('getColoredIcon', () => {
        it('should create ThemeIcon with state color');
        it('should create icon without color for unknown state');
        it('should preserve icon ID');
    });

    describe('isHighPriorityState', () => {
        it('should return true for DISABLED');
        it('should return true for DEPRECATED');
        it('should return false for ENABLED');
    });
});
```

**BadgeService Tests:**
```typescript
describe('BadgeService', () => {
    describe('formatCount', () => {
        it('should format zero as empty string');
        it('should format single digit');
        it('should format double digit');
        it('should format 99+ for large counts');
        it('should handle negative numbers');
        it('should handle custom max display');
    });

    describe('formatVersionCount', () => {
        it('should format with square brackets');
        it('should omit for zero count');
    });
});
```

### Integration Testing

**Manual Test Scenarios:**

1. **State Color Verification**
   - Create artifacts in each state
   - Verify icon colors match theme
   - Check in light and dark mode
   - Test with high contrast theme

2. **Badge Display**
   - Create group with 0 artifacts
   - Create group with 1 artifact
   - Create group with 50+ artifacts
   - Verify badge formatting

3. **Version Count**
   - Create artifact with 0 versions
   - Create artifact with 1 version
   - Create artifact with 10+ versions
   - Verify count accuracy

4. **Performance**
   - Create registry with 100+ artifacts
   - Measure tree render time
   - Verify smooth scrolling
   - Check memory usage

### Accessibility Testing

**Color Contrast:**
- Use browser DevTools accessibility inspector
- Verify 4.5:1 ratio for text
- Verify 3:1 ratio for icons
- Test with colorblind simulators (Deuteranopia, Protanopia, Tritanopia)

**Screen Reader:**
- Verify state is announced via tooltip
- Verify counts are readable
- Test with VoiceOver (macOS) or Narrator (Windows)

### Visual Regression Testing

**Screenshots:**
- Capture tree view with all states
- Compare against baseline
- Check for color consistency
- Verify badge alignment

---

## Success Metrics

### Functional Metrics
- ✅ All 4 states display correct colors
- ✅ All badges format correctly
- ✅ Version counts accurate
- ✅ Artifact counts accurate
- ✅ Unit tests: 35+ tests passing
- ✅ Code coverage: ≥80%

### Performance Metrics
- Tree render time with 100 items: <2 seconds
- Per-item decoration overhead: <1ms
- Memory increase: <5MB for large registries
- No visual lag when scrolling

### Accessibility Metrics
- Color contrast: 4.5:1 minimum for text
- Color contrast: 3:1 minimum for icons
- Screen reader compatible
- Colorblind user testing: 100% can distinguish states

### User Experience Metrics
- State recognition time: <1 second (vs 3-5 seconds reading text)
- Error detection: 95% of deprecated items noticed immediately
- User satisfaction: Positive feedback on visual clarity

---

## Out of Scope

The following items are explicitly **not** included in Phase 2.1b:

### Deferred to Future Phases

1. **Filtering by State** (Phase 2.2)
   - Filter tree to show only deprecated artifacts
   - Filter by multiple states
   - Save filter preferences

2. **State Change Actions** (Phase 2.3)
   - Context menu: "Mark as Deprecated"
   - Batch state changes
   - State change confirmation dialogs

3. **Custom State Definitions** (Future)
   - User-defined states beyond registry states
   - Custom color mappings
   - State workflows

4. **Advanced Badges** (Future)
   - Badge icons (not just text)
   - Custom badge colors
   - Badge tooltips
   - Multiple badges per item

5. **Sorting by State** (Phase 2.2)
   - Sort artifacts by state
   - Group artifacts by state
   - State-based tree organization

### Explicitly Excluded

1. **Background Colors**: Only icon colors, not item backgrounds
2. **Custom Themes**: Use VSCode theme colors only
3. **Animated States**: No animations or transitions
4. **State History**: No tracking of state changes over time
5. **Real-time Updates**: Requires manual refresh (Phase 3)

---

## Open Questions

### Design Questions

**Q1: Should empty groups (0 artifacts) be visually distinct?**
- Option A: Dim the folder icon
- Option B: Use different icon (empty folder)
- Option C: No visual distinction
- **Decision**: TBD - gather user feedback

**Q2: How should version count badge be positioned?**
- Option A: End of description: `[5]`
- Option B: After label: `petstore-api [5]`
- Option C: In tooltip only
- **Recommendation**: Option A for consistency with artifact count

**Q3: Should we show `[0]` for zero counts or omit the badge?**
- Option A: Show `[0]` to indicate "no versions yet"
- Option B: Omit badge if count is zero
- **Recommendation**: Option B to reduce visual clutter

### Technical Questions

**Q4: Should color caching be implemented in Phase 2.1b?**
- If yes: Add simple Map-based cache
- If no: Defer to performance optimization phase
- **Recommendation**: No, wait for performance data

**Q5: Should badge format be configurable?**
- Format: `[N]` vs `(N)` vs `N`
- Location: Description vs label
- **Recommendation**: Start with `[N]` in description, make configurable in Phase 3

**Q6: How to handle version count retrieval?**
- Option A: Call API for each artifact (slow)
- Option B: Include in artifact list response (requires backend)
- Option C: Lazy load on expand (complexity)
- **Recommendation**: Option A initially, optimize in Phase 3

---

## Dependencies

### Phase Dependencies
- **Requires**: Phase 2.1a (Custom Icons) ✅ Complete
- **Blocks**: Phase 2.1c (Context Menus)
- **Enables**: Phase 2.2 (Search and Filtering)

### External Dependencies
- VSCode API 1.70+ (ThemeColor, ThemeIcon)
- Existing IconService (Phase 2.1a)
- Registry API v3 (artifact and version counts)

### Data Requirements
- Artifact state (already available)
- Version state (already available)
- Version count per artifact (may require API call)
- Artifact count per group (already available)

---

## Risks and Mitigations

### Risk 1: Performance Degradation
**Severity:** Medium
**Probability:** Low

**Impact:**
- Tree rendering becomes slow with decorations
- Scrolling lag with many items

**Mitigation:**
- Benchmark before and after changes
- Profile with Chrome DevTools
- Implement caching if needed
- Lazy load counts on expand

### Risk 2: Color Accessibility
**Severity:** High
**Probability:** Low

**Impact:**
- Colorblind users cannot distinguish states
- Low contrast in some themes

**Mitigation:**
- Use VSCode theme colors (tested by Microsoft)
- Keep emoji indicators as backup
- Test with colorblind simulators
- Follow WCAG 2.1 AA guidelines
- Add user preference for high contrast

### Risk 3: Theme Incompatibility
**Severity:** Medium
**Probability:** Medium

**Impact:**
- Colors don't look good in some custom themes
- Chart colors not available in older VSCode

**Mitigation:**
- Provide fallback colors
- Test with popular themes (Dark+, Light+, Monokai)
- Use semantic colors as fallback
- Document known issues

### Risk 4: API Performance
**Severity:** Medium
**Probability:** Medium

**Impact:**
- Fetching version counts slows tree loading
- Too many API calls

**Mitigation:**
- Cache counts after first fetch
- Lazy load on artifact expand
- Consider batch API endpoint (future)
- Show loading indicator

---

## Timeline

### Week 1: Day 1-2 (Services)
- ✅ Create StateDecoratorService
- ✅ Create BadgeService
- ✅ Write unit tests for both services

### Week 1: Day 3-4 (Integration)
- ✅ Update RegistryTreeDataProvider
- ✅ Implement color decorations
- ✅ Implement badge display

### Week 1: Day 5 (Testing)
- ✅ Manual testing all states
- ✅ Accessibility testing
- ✅ Theme compatibility testing

### Week 2: Day 1-2 (Polish & Documentation)
- ✅ Update test-icons.sh script
- ✅ Write testing guide
- ✅ Create implementation summary
- ✅ Update README with screenshots

### Week 2: Day 3 (Buffer)
- Bug fixes
- Performance optimization
- User feedback incorporation

---

## Appendix

### A. VSCode Theme Color Reference

**Recommended ThemeColors:**
```typescript
// Success/Normal
'charts.green'              // Preferred
'testing.iconPassed'        // Fallback
'terminal.ansiGreen'        // Alternative

// Error/Disabled
'charts.red'                // Preferred
'testing.iconFailed'        // Fallback
'terminal.ansiRed'          // Alternative
'disabledForeground'        // Gray option

// Warning/Deprecated
'charts.yellow'             // Preferred
'list.warningForeground'    // Fallback
'editorWarning.foreground'  // Alternative

// Info/Draft
'charts.blue'               // Preferred
'editorInfo.foreground'     // Fallback
'terminal.ansiBlue'         // Alternative
```

**Documentation:**
https://code.visualstudio.com/api/references/theme-color

### B. WCAG Contrast Requirements

**Level AA (Target):**
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3.0:1 contrast ratio
- Icons/graphics: 3.0:1 contrast ratio

**Level AAA (Stretch):**
- Normal text: 7.0:1 contrast ratio
- Large text: 4.5:1 contrast ratio

**Tools:**
- Chrome DevTools: Lighthouse accessibility audit
- Online: https://webaim.org/resources/contrastchecker/
- VSCode Extension: "Accessibility Insights for Web"

### C. Example Test Data

**test-icons.sh additions:**
```bash
# Create artifacts with different version counts
create_artifact_with_versions "single-version" "OPENAPI" 1
create_artifact_with_versions "many-versions" "ASYNCAPI" 15
create_artifact_with_versions "no-versions" "AVRO" 0

# Create empty group
create_empty_group "empty-group"

# Create large group
create_group_with_artifacts "large-group" 50
```

### D. Color Palette Preview

**Light Theme:**
```
ENABLED:    🟢 Green (#4CAF50)
DEPRECATED: 🟡 Yellow (#FFA726)
DISABLED:   🔴 Red (#F44336)
DRAFT:      🔵 Blue (#2196F3)
```

**Dark Theme:**
```
ENABLED:    🟢 Lighter Green (#66BB6A)
DEPRECATED: 🟡 Lighter Yellow (#FFB74D)
DISABLED:   🔴 Lighter Red (#EF5350)
DRAFT:      🔵 Lighter Blue (#42A5F5)
```

### E. Related Issues and References

**VSCode API:**
- ThemeIcon: https://code.visualstudio.com/api/references/vscode-api#ThemeIcon
- ThemeColor: https://code.visualstudio.com/api/references/vscode-api#ThemeColor
- TreeItem: https://code.visualstudio.com/api/references/vscode-api#TreeItem

**Accessibility:**
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- Colorblind Simulator: https://www.color-blindness.com/coblis-color-blindness-simulator/

---

**PRD Version:** 1.0
**Last Updated:** October 10, 2025
**Author:** Development Team
**Approvers:** TBD
