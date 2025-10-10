# PRD: Enhanced Tree View - Phase 2, Step 1

**Document Version:** 1.0
**Date:** October 10, 2025
**Status:** Draft
**Owner:** Apicurio VSCode Extension Team

---

## Executive Summary

This PRD defines the requirements for enhancing the Apicurio Registry VSCode extension's tree view to provide a richer, more intuitive browsing experience. The enhancement focuses on four key areas: complete hierarchy implementation, custom iconography, context menus, and status indicators.

---

## 1. Background & Context

### 1.1 Current State (Phase 1 - Completed)

**What Works:**
- ✅ Basic three-level hierarchy: Groups → Artifacts → Versions
- ✅ Connection to Apicurio Registry v3 API
- ✅ Simple refresh functionality
- ✅ Basic icons using VSCode theme icons (`folder`, `file-code`, `tag`)
- ✅ Simple tooltips showing basic metadata

**Current Limitations:**
- All artifacts use the same generic `file-code` icon regardless of type
- No visual distinction between OPENAPI, ASYNCAPI, AVRO, Protobuf, etc.
- No context menu actions (right-click menu is empty)
- No status indicators for artifact/version states (ENABLED, DISABLED, DEPRECATED, DRAFT)
- Limited metadata display in tree items
- No inline actions besides expand/collapse

### 1.2 User Pain Points

Based on analysis of the current implementation:

1. **Lack of Visual Clarity:** Users cannot quickly identify artifact types at a glance
2. **Missing Actions:** No way to perform common operations (copy, delete, view details) from the tree
3. **State Ambiguity:** Cannot tell if an artifact is deprecated or disabled without clicking
4. **Limited Information:** Metadata like modification dates, creator, labels not visible

---

## 2. Goals & Objectives

### 2.1 Primary Goals

1. **Visual Differentiation:** Users should immediately identify artifact types through custom icons
2. **Actionable Tree:** Enable common workflows directly from the tree view via context menus
3. **Status Transparency:** Make artifact and version states visible at a glance
4. **Enhanced Metadata:** Display relevant information without requiring navigation

### 2.2 Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Icon Coverage | 100% of artifact types have custom icons | All 9 artifact types (OPENAPI, ASYNCAPI, AVRO, PROTOBUF, JSON, GRAPHQL, KCONNECT, WSDL, XSD) |
| Context Menu Actions | ≥5 actions per node type | Right-click menu populated for Groups, Artifacts, Versions |
| Status Visibility | All states visually distinguishable | ENABLED, DISABLED, DEPRECATED, DRAFT shown via decorations |
| User Satisfaction | Improved browsing experience | Qualitative feedback from testing |

### 2.3 Non-Goals (Out of Scope for This Phase)

- Search/filtering functionality (Phase 2, Step 2)
- Inline editing of artifacts
- Drag-and-drop operations
- Custom sorting options
- Multi-select operations

---

## 3. Detailed Requirements

### 3.1 Custom Icons for Artifact Types

#### 3.1.1 Icon Mapping

Each artifact type shall have a distinct, recognizable icon:

| Artifact Type | Icon | Rationale |
|--------------|------|-----------|
| OPENAPI | `symbol-method` or custom API icon | Represents RESTful APIs |
| ASYNCAPI | `radio-tower` or `broadcast` | Represents asynchronous messaging |
| AVRO | `database` or `symbol-structure` | Represents data schemas |
| PROTOBUF | `symbol-class` | Represents structured data |
| JSON | `json` or `symbol-object` | Native JSON representation |
| GRAPHQL | `symbol-interface` or `graph` | Represents GraphQL schemas |
| KCONNECT | `plug` or `extensions` | Represents Kafka connectors |
| WSDL | `globe` or `cloud` | Represents web services |
| XSD | `symbol-namespace` or `code` | Represents XML schemas |

**Implementation Options:**
1. **VSCode ThemeIcons** (Recommended for Phase 2.1): Use built-in codicons
   - Pros: Consistent with VSCode theme, no additional assets needed
   - Cons: Limited customization

2. **Custom SVG Icons** (Future enhancement): Create custom icon set
   - Pros: Perfect visual alignment with Apicurio branding
   - Cons: Requires design resources, maintenance overhead

**Decision:** Start with VSCode ThemeIcons for Phase 2.1, plan custom icons for Phase 3.

#### 3.1.2 Icon Customization by State

Icons should be modified based on state:

```typescript
// Example: Deprecated artifacts get a strikethrough or opacity change
if (artifact.state === 'DEPRECATED') {
    // Add decoration or use different icon variant
}
```

**State Icon Modifications:**
- **DEPRECATED:** Add warning color decoration (yellow/orange)
- **DISABLED:** Gray out icon or add disabled decoration
- **DRAFT:** Add edit decoration or different color

### 3.2 Context Menus and Inline Actions

#### 3.2.1 Group-Level Context Menu

When user right-clicks on a Group node:

| Action | Description | Icon |
|--------|-------------|------|
| **Refresh** | Reload group's artifacts | `$(refresh)` |
| **Copy Group ID** | Copy to clipboard | `$(copy)` |
| **View in Browser** | Open group in Registry UI | `$(globe)` |
| **Create Artifact** | Open create artifact dialog | `$(add)` |
| **Delete Group** | Delete group (with confirmation) | `$(trash)` |
| **Properties** | Show detailed metadata | `$(info)` |

**Implementation:**
```json
// package.json contribution
"menus": {
    "view/item/context": [
        {
            "command": "apicurioRegistry.refreshGroup",
            "when": "view == apicurioRegistry && viewItem == group",
            "group": "navigation"
        }
    ]
}
```

#### 3.2.2 Artifact-Level Context Menu

When user right-clicks on an Artifact node:

| Action | Description | Icon |
|--------|-------------|------|
| **Open Latest Version** | Open most recent version content | `$(file)` |
| **Refresh** | Reload versions | `$(refresh)` |
| **Copy Artifact ID** | Copy to clipboard | `$(copy)` |
| **View in Browser** | Open artifact in Registry UI | `$(globe)` |
| **Create Version** | Create new version | `$(add)` |
| **Update Metadata** | Edit artifact metadata | `$(edit)` |
| **Change State** | Set ENABLED/DISABLED/DEPRECATED | `$(circle-outline)` |
| **Download** | Export artifact content | `$(cloud-download)` |
| **Delete Artifact** | Delete artifact (with confirmation) | `$(trash)` |
| **Properties** | Show detailed metadata | `$(info)` |

#### 3.2.3 Version-Level Context Menu

When user right-clicks on a Version node:

| Action | Description | Icon |
|--------|-------------|------|
| **Open** | View version content | `$(file)` |
| **Copy Version** | Copy version string | `$(copy)` |
| **View in Browser** | Open version in Registry UI | `$(globe)` |
| **Edit** | Edit version content | `$(edit)` |
| **Change State** | Set version state | `$(circle-outline)` |
| **Download** | Export version content | `$(cloud-download)` |
| **Delete Version** | Delete version (with confirmation) | `$(trash)` |
| **Set as Default** | Make this the default version | `$(star)` |
| **Compare** | Compare with another version | `$(diff)` |
| **Properties** | Show detailed metadata | `$(info)` |

#### 3.2.4 Inline Actions (Tree Item Buttons)

Actions that appear as buttons when hovering over tree items:

**Group Inline Actions:**
- Refresh (always visible)
- Create Artifact (on hover)

**Artifact Inline Actions:**
- Open Latest (always visible)
- Create Version (on hover)

**Version Inline Actions:**
- Open (always visible)
- Download (on hover)

### 3.3 Status Indicators

#### 3.3.1 Artifact State Indicators

Visual representations for each state:

| State | Visual Indicator | Implementation |
|-------|-----------------|----------------|
| ENABLED | ✓ Green checkmark decoration | `ThemeIcon with color: 'charts.green'` |
| DISABLED | ✗ Gray X decoration | `ThemeIcon with color: 'charts.gray'` |
| DEPRECATED | ⚠ Orange warning decoration | `ThemeIcon with color: 'charts.orange'` |

**Tree Item Rendering:**
```typescript
// Example implementation
const decoration: vscode.TreeItemDecorationOverlay = {
    badge: '✓', // or icon
    tooltip: 'Enabled',
    color: new vscode.ThemeColor('charts.green')
};
```

#### 3.3.2 Version State Indicators

Additional state for versions:

| State | Visual Indicator | Implementation |
|-------|-----------------|----------------|
| DRAFT | 📝 Pencil icon | `ThemeIcon('edit')` |
| ENABLED | ✓ (same as artifact) | Same as artifact state |
| DISABLED | ✗ (same as artifact) | Same as artifact state |
| DEPRECATED | ⚠ (same as artifact) | Same as artifact state |

#### 3.3.3 Additional Visual Cues

**Label Badges:**
- Show version count on artifact nodes: `my-api (5)`
- Show artifact count on group nodes: `test-group (12)`
- Show labels/tags count: `my-api 🏷️ 3`

**Description Display:**
- Show first 50 characters of description as secondary text
- Truncate with ellipsis: `"This is my API description..."`

**Timestamp Information:**
- Show relative time for modifications: `modified 2 hours ago`
- Format: Use VSCode's relative time formatting

---

## 4. Technical Design

### 4.1 Architecture Changes

#### 4.1.1 Enhanced RegistryItem Model

Current model needs extension to support decorations and descriptions:

```typescript
export class RegistryItem {
    constructor(
        public readonly label: string,
        public readonly type: RegistryItemType,
        public readonly id?: string,
        public readonly metadata?: ItemMetadata, // Enhanced metadata type
        public readonly parentId?: string,
        public readonly groupId?: string
    ) {}

    // New methods
    get stateDecoration(): vscode.DecorationOptions | undefined { }
    get description(): string | undefined { } // Already exists, enhance
    get resourceUri(): vscode.Uri | undefined { } // For icons
    get contextValue(): string { } // Enhanced with more specifics
}

interface ItemMetadata {
    // Existing fields
    artifactCount?: number;
    artifactType?: string;
    state?: string;
    description?: string;
    versionId?: number;
    globalId?: number;
    createdOn?: Date;
    modifiedOn?: Date;

    // New fields for Phase 2
    labels?: Map<string, string>;
    versionCount?: number;
    owner?: string;
    isDefault?: boolean;
}
```

#### 4.1.2 Icon Service

Create a new service to manage icon selection:

```typescript
// src/services/iconService.ts
export class IconService {
    static getIconForArtifactType(type: ArtifactType): vscode.ThemeIcon {
        const iconMap = {
            [ArtifactType.OPENAPI]: new vscode.ThemeIcon('symbol-method'),
            [ArtifactType.ASYNCAPI]: new vscode.ThemeIcon('radio-tower'),
            [ArtifactType.AVRO]: new vscode.ThemeIcon('database'),
            [ArtifactType.PROTOBUF]: new vscode.ThemeIcon('symbol-class'),
            [ArtifactType.JSON]: new vscode.ThemeIcon('json'),
            [ArtifactType.GRAPHQL]: new vscode.ThemeIcon('symbol-interface'),
            [ArtifactType.KCONNECT]: new vscode.ThemeIcon('plug'),
            [ArtifactType.WSDL]: new vscode.ThemeIcon('globe'),
            [ArtifactType.XSD]: new vscode.ThemeIcon('symbol-namespace'),
        };
        return iconMap[type] || new vscode.ThemeIcon('file-code');
    }

    static getIconForState(state: ArtifactState | VersionState): vscode.ThemeIcon {
        // Implementation
    }
}
```

#### 4.1.3 Enhanced Tree Provider

Update `RegistryTreeDataProvider.getTreeItem()`:

```typescript
getTreeItem(element: RegistryItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(element.label);

    // Set icon based on type and state
    treeItem.iconPath = this.getIconForElement(element);

    // Enhanced context value for menu filtering
    treeItem.contextValue = this.getContextValue(element);

    // Add description (artifact count, version info, etc.)
    treeItem.description = this.getDescription(element);

    // Add tooltip with rich information
    treeItem.tooltip = this.getTooltip(element);

    // Add resource state decorations
    treeItem.resourceUri = this.getResourceUri(element);

    return treeItem;
}

private getIconForElement(element: RegistryItem): vscode.ThemeIcon {
    switch (element.type) {
        case RegistryItemType.Artifact:
            const baseIcon = IconService.getIconForArtifactType(
                element.metadata?.artifactType
            );
            // Modify based on state if needed
            return baseIcon;
        // ... other cases
    }
}

private getContextValue(element: RegistryItem): string {
    // Build contextValue with state for menu filtering
    // e.g., "artifact-OPENAPI-ENABLED"
    let contextValue = element.type;
    if (element.metadata?.artifactType) {
        contextValue += `-${element.metadata.artifactType}`;
    }
    if (element.metadata?.state) {
        contextValue += `-${element.metadata.state}`;
    }
    return contextValue;
}
```

### 4.2 Command Implementation

#### 4.2.1 New Commands to Register

```typescript
// src/extension.ts
export function activate(context: vscode.ExtensionContext) {
    // ... existing code

    // Group commands
    context.subscriptions.push(
        vscode.commands.registerCommand('apicurioRegistry.refreshGroup', refreshGroup),
        vscode.commands.registerCommand('apicurioRegistry.copyGroupId', copyGroupId),
        vscode.commands.registerCommand('apicurioRegistry.viewGroupInBrowser', viewGroupInBrowser),
        vscode.commands.registerCommand('apicurioRegistry.createArtifact', createArtifact),
        vscode.commands.registerCommand('apicurioRegistry.deleteGroup', deleteGroup),
        vscode.commands.registerCommand('apicurioRegistry.showGroupProperties', showGroupProperties),

        // Artifact commands
        vscode.commands.registerCommand('apicurioRegistry.openLatestVersion', openLatestVersion),
        vscode.commands.registerCommand('apicurioRegistry.refreshArtifact', refreshArtifact),
        vscode.commands.registerCommand('apicurioRegistry.copyArtifactId', copyArtifactId),
        vscode.commands.registerCommand('apicurioRegistry.viewArtifactInBrowser', viewArtifactInBrowser),
        vscode.commands.registerCommand('apicurioRegistry.createVersion', createVersion),
        vscode.commands.registerCommand('apicurioRegistry.updateMetadata', updateMetadata),
        vscode.commands.registerCommand('apicurioRegistry.changeArtifactState', changeArtifactState),
        vscode.commands.registerCommand('apicurioRegistry.downloadArtifact', downloadArtifact),
        vscode.commands.registerCommand('apicurioRegistry.deleteArtifact', deleteArtifact),
        vscode.commands.registerCommand('apicurioRegistry.showArtifactProperties', showArtifactProperties),

        // Version commands
        vscode.commands.registerCommand('apicurioRegistry.openVersion', openVersion),
        vscode.commands.registerCommand('apicurioRegistry.copyVersion', copyVersion),
        vscode.commands.registerCommand('apicurioRegistry.viewVersionInBrowser', viewVersionInBrowser),
        vscode.commands.registerCommand('apicurioRegistry.editVersion', editVersion),
        vscode.commands.registerCommand('apicurioRegistry.changeVersionState', changeVersionState),
        vscode.commands.registerCommand('apicurioRegistry.downloadVersion', downloadVersion),
        vscode.commands.registerCommand('apicurioRegistry.deleteVersion', deleteVersion),
        vscode.commands.registerCommand('apicurioRegistry.setDefaultVersion', setDefaultVersion),
        vscode.commands.registerCommand('apicurioRegistry.compareVersion', compareVersion),
        vscode.commands.registerCommand('apicurioRegistry.showVersionProperties', showVersionProperties)
    );
}
```

#### 4.2.2 Package.json Contributions

```json
{
    "contributes": {
        "commands": [
            // Group commands
            {
                "command": "apicurioRegistry.refreshGroup",
                "title": "Refresh Group",
                "icon": "$(refresh)"
            },
            {
                "command": "apicurioRegistry.copyGroupId",
                "title": "Copy Group ID",
                "icon": "$(copy)"
            },
            // ... all other commands
        ],
        "menus": {
            "view/title": [
                // Existing toolbar buttons
            ],
            "view/item/context": [
                // Group context menu
                {
                    "command": "apicurioRegistry.refreshGroup",
                    "when": "view == apicurioRegistry && viewItem =~ /^group/",
                    "group": "navigation@1"
                },
                {
                    "command": "apicurioRegistry.copyGroupId",
                    "when": "view == apicurioRegistry && viewItem =~ /^group/",
                    "group": "1_copy@1"
                },
                {
                    "command": "apicurioRegistry.viewGroupInBrowser",
                    "when": "view == apicurioRegistry && viewItem =~ /^group/",
                    "group": "2_view@1"
                },
                {
                    "command": "apicurioRegistry.createArtifact",
                    "when": "view == apicurioRegistry && viewItem =~ /^group/",
                    "group": "3_create@1"
                },
                {
                    "command": "apicurioRegistry.deleteGroup",
                    "when": "view == apicurioRegistry && viewItem =~ /^group/",
                    "group": "9_delete@1"
                },
                {
                    "command": "apicurioRegistry.showGroupProperties",
                    "when": "view == apicurioRegistry && viewItem =~ /^group/",
                    "group": "z_properties@1"
                },

                // Artifact context menu
                {
                    "command": "apicurioRegistry.openLatestVersion",
                    "when": "view == apicurioRegistry && viewItem =~ /^artifact/",
                    "group": "navigation@1"
                },
                // ... all other artifact menu items

                // Version context menu
                {
                    "command": "apicurioRegistry.openVersion",
                    "when": "view == apicurioRegistry && viewItem =~ /^version/",
                    "group": "navigation@1"
                },
                // ... all other version menu items
            ],
            "view/item/inline": [
                // Group inline actions
                {
                    "command": "apicurioRegistry.refreshGroup",
                    "when": "view == apicurioRegistry && viewItem =~ /^group/",
                    "group": "inline"
                },
                {
                    "command": "apicurioRegistry.createArtifact",
                    "when": "view == apicurioRegistry && viewItem =~ /^group/",
                    "group": "inline"
                },

                // Artifact inline actions
                {
                    "command": "apicurioRegistry.openLatestVersion",
                    "when": "view == apicurioRegistry && viewItem =~ /^artifact/",
                    "group": "inline"
                },
                {
                    "command": "apicurioRegistry.createVersion",
                    "when": "view == apicurioRegistry && viewItem =~ /^artifact/",
                    "group": "inline"
                },

                // Version inline actions
                {
                    "command": "apicurioRegistry.openVersion",
                    "when": "view == apicurioRegistry && viewItem =~ /^version/",
                    "group": "inline"
                },
                {
                    "command": "apicurioRegistry.downloadVersion",
                    "when": "view == apicurioRegistry && viewItem =~ /^version/",
                    "group": "inline"
                }
            ]
        }
    }
}
```

---

## 5. User Experience

### 5.1 User Flows

#### Flow 1: Browse and Identify Artifacts by Type

```
User opens APICURIO REGISTRY view
  → Expands a group
  → Sees artifacts with type-specific icons:
     📡 asyncapi-sample (AsyncAPI)
     🔌 kafka-connector (Kafka Connect)
     🗄️ user-schema (Avro)
     🌐 rest-api (OpenAPI)
  → Immediately identifies types without reading labels
  → Hovers to see tooltip with full details
```

#### Flow 2: Perform Action on Artifact

```
User right-clicks on artifact
  → Context menu appears with 10 actions
  → Selects "Download"
  → Save dialog opens
  → File saved to disk
  → Success notification appears
```

#### Flow 3: Check Artifact Status

```
User browses tree
  → Sees visual state indicators:
     ✓ active-api (ENABLED - green checkmark)
     ⚠ old-api (DEPRECATED - orange warning)
     ✗ disabled-api (DISABLED - gray X)
  → Identifies deprecated artifacts immediately
  → Takes appropriate action (update or remove)
```

### 5.2 Visual Design

#### 5.2.1 Tree Item Layout

```
📁 test-group (12)                    [🔄] [+]
   |
   ├─ 🌐 petstore-api ✓ (5)          [📖] [+]
   |    First 50 chars of desc...    modified 2h ago
   |    |
   |    ├─ 📌 1.0.0 ✓                [📖] [⬇]
   |    ├─ 📌 1.0.1 ✓                [📖] [⬇]
   |    └─ 📝 2.0.0-draft 📝          [📖] [⬇]
   |
   ├─ 📡 events-api ⚠ (3)            [📖] [+]
   |    AsyncAPI for events          modified 1d ago
   |
   └─ 🗄️ user-schema ✗ (2)           [📖] [+]
        Avro schema for users        modified 5d ago
```

**Legend:**
- `📁` = Group icon
- `🌐` = OpenAPI icon
- `📡` = AsyncAPI icon
- `🗄️` = Avro icon
- `✓` = Enabled state
- `⚠` = Deprecated state
- `✗` = Disabled state
- `📝` = Draft state
- `(12)` = Count badge
- `[🔄]` = Inline refresh button
- `[+]` = Inline create button
- `[📖]` = Inline open button
- `[⬇]` = Inline download button

---

## 6. Implementation Plan

### 6.1 Development Phases

#### Phase 2.1a: Custom Icons (Week 1)
**Estimated Effort:** 3-5 days

**Tasks:**
1. Create IconService with artifact type mapping
2. Update RegistryTreeDataProvider.getTreeItem() to use IconService
3. Test all 9 artifact types render correctly
4. Update unit tests

**Deliverable:** All artifact types have distinct icons

#### Phase 2.1b: Status Indicators (Week 1)
**Estimated Effort:** 3-5 days

**Tasks:**
1. Add state decoration logic to getTreeItem()
2. Implement color coding for states
3. Add version count badges to artifacts
4. Add artifact count badges to groups
5. Test all state combinations

**Deliverable:** Visual state indicators working for all items

#### Phase 2.1c: Context Menus - Part 1 (Week 2)
**Estimated Effort:** 4-6 days

**Tasks:**
1. Implement Group context menu commands (6 commands)
2. Add package.json menu contributions
3. Test each command end-to-end
4. Add error handling and confirmations

**Deliverable:** Functional group context menu

#### Phase 2.1d: Context Menus - Part 2 (Week 2-3)
**Estimated Effort:** 5-7 days

**Tasks:**
1. Implement Artifact context menu commands (10 commands)
2. Implement Version context menu commands (10 commands)
3. Add package.json menu contributions
4. Test each command end-to-end
5. Add error handling and confirmations

**Deliverable:** Complete context menu system

#### Phase 2.1e: Inline Actions (Week 3)
**Estimated Effort:** 2-3 days

**Tasks:**
1. Add inline action buttons to package.json
2. Test button visibility on hover
3. Ensure proper icon sizing and alignment

**Deliverable:** Inline action buttons functional

#### Phase 2.1f: Enhanced Descriptions (Week 3)
**Estimated Effort:** 2-3 days

**Tasks:**
1. Update getDescription() method
2. Add relative time formatting
3. Truncate long descriptions
4. Add secondary information (tags, owner, etc.)

**Deliverable:** Rich tree item descriptions

### 6.2 Testing Strategy

#### 6.2.1 Unit Tests

```typescript
describe('IconService', () => {
    it('should return correct icon for each artifact type', () => {
        expect(IconService.getIconForArtifactType(ArtifactType.OPENAPI))
            .toEqual(new vscode.ThemeIcon('symbol-method'));
    });

    it('should handle unknown artifact types gracefully', () => {
        expect(IconService.getIconForArtifactType('UNKNOWN' as any))
            .toEqual(new vscode.ThemeIcon('file-code'));
    });
});

describe('RegistryTreeDataProvider - Enhanced', () => {
    it('should set contextValue with type and state', () => {
        const item = new RegistryItem(
            'test-api',
            RegistryItemType.Artifact,
            'test-api',
            { artifactType: 'OPENAPI', state: 'DEPRECATED' }
        );
        const treeItem = provider.getTreeItem(item);
        expect(treeItem.contextValue).toBe('artifact-OPENAPI-DEPRECATED');
    });
});
```

#### 6.2.2 Integration Tests

- Test all context menu commands with mock registry
- Verify icons render for all artifact types
- Test state decorations for all states
- Verify inline actions appear on hover

#### 6.2.3 Manual Testing Checklist

- [ ] All 9 artifact types display correct icons
- [ ] ENABLED state shows green checkmark
- [ ] DEPRECATED state shows orange warning
- [ ] DISABLED state shows gray X
- [ ] DRAFT state shows pencil icon
- [ ] Group context menu has 6 actions
- [ ] Artifact context menu has 10 actions
- [ ] Version context menu has 10 actions
- [ ] Inline actions appear on hover
- [ ] Copy commands work (clipboard)
- [ ] View in browser opens correct URL
- [ ] Delete commands show confirmation
- [ ] Properties command shows metadata panel

---

## 7. Dependencies & Risks

### 7.1 Dependencies

| Dependency | Description | Impact if Unavailable |
|------------|-------------|----------------------|
| VSCode API 1.70+ | Required for ThemeIcon support | Critical - core functionality |
| Apicurio Registry v3 API | Provides metadata for states and types | Critical - no data source |
| Axios | HTTP client for API calls | Critical - already used |

### 7.2 Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Icon choices not intuitive | Medium | Medium | User testing, allow customization in future |
| Context menu actions fail silently | Low | High | Comprehensive error handling, user notifications |
| Performance with large trees | Medium | Medium | Lazy loading, caching, virtualization (future) |
| State decorations conflict with theme | Low | Low | Test with multiple themes, use theme colors |

---

## 8. Success Metrics & KPIs

### 8.1 Functional Metrics

- **Icon Coverage:** 100% (9/9 artifact types)
- **Command Coverage:** 100% (26 commands implemented)
- **State Coverage:** 100% (4 artifact states + 4 version states)
- **Menu Coverage:** 100% (3 node types with context menus)

### 8.2 Quality Metrics

- **Unit Test Coverage:** ≥80% for new code
- **Integration Test Coverage:** All commands tested
- **Bug Density:** <2 bugs per 1000 LOC
- **Code Review Approval:** 100% of PRs reviewed

### 8.3 User Experience Metrics

- **Icon Recognition Rate:** ≥90% (user can identify artifact type at a glance)
- **Action Discovery:** ≥80% (users find context menu actions without documentation)
- **Task Completion Time:** 30% faster for common operations (vs Phase 1)

---

## 9. Open Questions & Decisions

### 9.1 Icon Selection Final Decision
**Question:** Use ThemeIcons vs Custom SVG icons?
**Status:** Decision needed
**Recommendation:** Start with ThemeIcons, plan custom icons for Phase 3

### 9.2 Context Menu Grouping
**Question:** How to organize 10+ menu items?
**Status:** Proposed in section 3.2
**Recommendation:** Use separator groups: navigation, copy, view, create, modify, delete, properties

### 9.3 State Change Confirmation
**Question:** Should destructive actions (delete, state change) require confirmation?
**Status:** Decision needed
**Recommendation:** Yes, use vscode.window.showWarningMessage with Yes/No buttons

### 9.4 Browser Integration
**Question:** What URL format to use for "View in Browser"?
**Status:** Research needed
**Recommendation:** `${registryUrl}/ui/explore/${groupId}/${artifactId}`

---

## 10. Future Enhancements (Out of Scope)

Items to consider for Phase 3:

1. **Custom Icon Set:** Design Apicurio-branded icons for all artifact types
2. **Bulk Operations:** Multi-select in tree for batch delete/export
3. **Drag & Drop:** Move artifacts between groups
4. **Smart Sorting:** Sort by name, date, type, state
5. **Favorites:** Star/pin frequently used artifacts
6. **Recent Items:** Show recently opened artifacts
7. **Tree Filtering:** Filter by type, state, or search term
8. **Keyboard Shortcuts:** Assign shortcuts to common actions
9. **Undo/Redo:** Support for destructive operations
10. **Offline Mode:** Cache tree data for offline browsing

---

## 11. Appendices

### 11.1 VSCode ThemeIcon Reference

Available codicons that can be used:
- `symbol-method`, `symbol-class`, `symbol-interface`, `symbol-object`, `symbol-structure`
- `database`, `plug`, `globe`, `radio-tower`, `broadcast`
- `json`, `file-code`, `tag`, `folder`
- `refresh`, `copy`, `trash`, `edit`, `add`
- `info`, `warning`, `error`, `check`, `circle-outline`
- `star`, `diff`, `cloud-download`

Full list: https://microsoft.github.io/vscode-codicons/dist/codicon.html

### 11.2 VSCode API Resources

- TreeView API: https://code.visualstudio.com/api/extension-guides/tree-view
- Theming: https://code.visualstudio.com/api/extension-guides/color-theme
- Context Menus: https://code.visualstudio.com/api/references/contribution-points#contributes.menus

### 11.3 Apicurio Registry API Reference

- Groups API: `/apis/registry/v3/groups`
- Artifacts API: `/apis/registry/v3/groups/{groupId}/artifacts`
- Versions API: `/apis/registry/v3/groups/{groupId}/artifacts/{artifactId}/versions`
- States: ENABLED, DISABLED, DEPRECATED (artifacts), + DRAFT (versions)

---

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 10, 2025 | Team | Initial draft |

**Approval:**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Technical Lead | | | |
| UX Designer | | | |
