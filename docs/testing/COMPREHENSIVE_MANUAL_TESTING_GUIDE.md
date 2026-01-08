# Comprehensive Manual Testing Guide

**Apicurio Registry VSCode Extension**
**Last Updated:** 2026-01-08
**Version:** Covers all features through Phase 3

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Connection & Setup](#2-connection--setup)
3. [Tree View & Navigation](#3-tree-view--navigation)
4. [Search Features](#4-search-features)
5. [Create Operations](#5-create-operations)
6. [Copy Commands](#6-copy-commands)
7. [Open Commands](#7-open-commands)
8. [State Management](#8-state-management)
9. [Download & Export](#9-download--export)
10. [Delete Operations](#10-delete-operations)
11. [Metadata Editing](#11-metadata-editing)
12. [Rules Configuration](#12-rules-configuration)
13. [Branching Support](#13-branching-support)
14. [Draft Management](#14-draft-management)
15. [Group Management](#15-group-management)
16. [Import/Export Operations](#16-importexport-operations)
17. [Role Management](#17-role-management)
18. [Settings/Configuration](#18-settingsconfiguration)
19. [Visual Editor](#19-visual-editor)
20. [Format/Beautify](#20-formatbeautify)
21. [Error Handling](#21-error-handling)
22. [MCP Integration](#22-mcp-integration)

---

## 1. Prerequisites

### Environment Setup

**Required:**
- VSCode 1.80.0 or later
- Node.js 18.x or later
- Apicurio Registry 3.x running locally or accessible remotely

**Optional:**
- Docker/Podman (for MCP server integration)
- Java 17+ (for JAR mode MCP server)

### Starting the Registry

**Using Docker:**
```bash
docker run -p 8080:8080 quay.io/apicurio/apicurio-registry:latest-release
```

**Verify Registry is Running:**
```bash
curl http://localhost:8080/apis/registry/v3/system/info
```

### Installing the Extension

1. Open VSCode
2. Press F5 to launch Extension Development Host
3. OR install from VSIX: `code --install-extension apicurio-registry-x.x.x.vsix`

---

## 2. Connection & Setup

### TC-2.1: Configure Registry Connection

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Settings (Ctrl+,) | Settings page opens |
| 2 | Search "apicurioRegistry.connections" | Connection settings appear |
| 3 | Click "Edit in settings.json" | JSON settings file opens |
| 4 | Add connection: `[{"name": "Local", "url": "http://localhost:8080"}]` | Valid JSON saved |
| 5 | Save file | Settings applied |

### TC-2.2: Connect to Registry

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Connect" button in Apicurio Registry view | Quick pick appears if multiple connections |
| 2 | Select connection (or auto-connects if single) | Tree view populates with groups |
| 3 | Verify status bar | Shows connected status |

### TC-2.3: Disconnect from Registry

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Disconnect" button in view toolbar | Tree view clears |
| 2 | Verify status | Shows disconnected state |

### TC-2.4: Connection Error Handling

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Configure invalid URL: `http://localhost:9999` | - |
| 2 | Attempt to connect | Error message displayed |
| 3 | Error should include helpful message | Shows "Failed to connect" with URL |

---

## 3. Tree View & Navigation

### TC-3.1: View Groups

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Connect to registry | Groups listed in tree view |
| 2 | Verify default group exists | "default" group shown |
| 3 | Hover over group | Tooltip shows description, artifact count |

### TC-3.2: Expand Group to View Artifacts

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click expand arrow on group | Artifacts listed under group |
| 2 | Verify artifact info | Type icon, name/ID, state emoji |
| 3 | Hover over artifact | Tooltip shows full metadata |

### TC-3.3: Expand Artifact to View Versions

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click expand arrow on artifact | Versions listed under artifact |
| 2 | Verify version info | Version number, state, global ID |
| 3 | Hover over version | Tooltip shows creation date, labels |

### TC-3.4: Refresh Tree View

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Refresh" button in toolbar | Tree view reloads |
| 2 | Any search filters cleared | Full tree displayed |

### TC-3.5: Sort Preferences

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Settings → "apicurioRegistry.display.sortGroups" | Sort option visible |
| 2 | Change to "modified-date" | Groups sorted by modification date |
| 3 | Change "sortArtifacts" to "artifact-type" | Artifacts grouped by type |

### TC-3.6: Filter Preferences

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set "filter.hideDisabled" to true | DISABLED artifacts hidden |
| 2 | Set "filter.hideDeprecated" to true | DEPRECATED versions hidden |
| 3 | Set "filter.hideEmptyGroups" to true | Empty groups hidden |

---

## 4. Search Features

### TC-4.1: Basic Search by Name

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click search icon (magnifying glass) in toolbar | Search wizard opens |
| 2 | Select "name" as search criteria | Input box appears |
| 3 | Enter artifact name | Filtered results in tree view |
| 4 | Click Refresh to clear search | Full tree restored |

### TC-4.2: Search by Artifact Type

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click search icon | Search wizard opens |
| 2 | Select "type" as criteria | Dropdown of artifact types appears |
| 3 | Select "OPENAPI" | Only OpenAPI artifacts shown |

### TC-4.3: Advanced Multi-Field Search

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "Advanced Search" | Search mode selection appears |
| 2 | Select "Artifact Search" | Multi-field wizard starts |
| 3 | Add "Name" criterion: "User" | Criterion added |
| 4 | Add "Type" criterion: "OPENAPI" | Second criterion added |
| 5 | Select "Done - Search Now" | Results show matching artifacts |

### TC-4.4: Version Search

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Advanced Search → "Version Search" | Version search starts |
| 2 | Enter version "1.0.0" | Versions matching shown |
| 3 | Verify context | Group/Artifact IDs displayed |

### TC-4.5: Group Search

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Advanced Search → "Group Search" | Group search starts |
| 2 | Enter description keyword | Matching groups shown |
| 3 | Verify artifact counts | Counts displayed correctly |

### TC-4.6: Label Filtering

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Advanced Search | Select "Labels" criterion |
| 2 | Enter "env:prod" | Validation passes |
| 3 | Enter "invalid" (no colon) | Validation error shown |

---

## 5. Create Operations

### TC-5.1: Create Artifact with All Fields

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "Create Artifact" | Wizard starts |
| 2 | Select "Use existing group" | Group selection appears |
| 3 | Select "default" group | Artifact type selection appears |
| 4 | Select "OPENAPI" | File search appears |
| 5 | Enter "**/*.yaml" | YAML files listed |
| 6 | Select an OpenAPI file | File content loaded |
| 7 | Enter artifact ID: "test-api" | Validation passes |
| 8 | Enter version: "1.0.0" | Optional, defaults to 1.0.0 |
| 9 | Enter name: "Test API" | Optional name |
| 10 | Enter description | Optional description |
| 11 | Add labels: "env=test" | Labels stored |
| 12 | Confirm creation | Artifact created |
| 13 | Tree view refreshes | New artifact visible |

### TC-5.2: Create Artifact with Minimal Fields

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create artifact wizard | Start wizard |
| 2 | Select existing group | Group selected |
| 3 | Select artifact type | Type selected |
| 4 | Select file | File selected |
| 5 | Skip all optional fields | Auto-generated ID and version |
| 6 | Confirm | Artifact created with auto-generated ID |

### TC-5.3: Create Group

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "Create Group" | Wizard starts |
| 2 | Enter group ID: "my-schemas" | Validation passes |
| 3 | Enter description (optional) | Description saved |
| 4 | Add labels (optional) | Labels added |
| 5 | Confirm creation | Group created |
| 6 | New group appears in tree | Tree refreshed |

### TC-5.4: Add Version to Artifact

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click artifact | Context menu appears |
| 2 | Select "Add Version" | Version wizard starts |
| 3 | Select file with new content | File loaded |
| 4 | Enter version number | Version identifier set |
| 5 | Confirm | New version created |
| 6 | Version appears under artifact | Tree updated |

### TC-5.5: Duplicate Artifact ID Error

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Attempt to create artifact with existing ID | - |
| 2 | Complete wizard | Error: "Artifact already exists" (409) |

---

## 6. Copy Commands

### TC-6.1: Copy Group ID

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click group in tree | Context menu appears |
| 2 | Select "Copy Group ID" | Group ID copied to clipboard |
| 3 | Paste somewhere | Correct group ID pasted |
| 4 | Info message shown | "Copied: <groupId>" |

### TC-6.2: Copy Artifact ID

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click artifact in tree | Context menu appears |
| 2 | Select "Copy Artifact ID" | Artifact ID copied |
| 3 | Verify notification | "Copied: <artifactId>" |

### TC-6.3: Copy Version

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click version in tree | Context menu appears |
| 2 | Select "Copy Version" | Version string copied |
| 3 | Verify content | Version number in clipboard |

### TC-6.4: Copy Full Reference

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click version | Context menu appears |
| 2 | Select "Copy Full Reference" | Full reference copied |
| 3 | Verify format | `groupId/artifactId@version` |

---

## 7. Open Commands

### TC-7.1: Open Artifact (Latest Version)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Double-click artifact OR right-click → "Open" | Editor opens |
| 2 | Verify content | Latest version content displayed |
| 3 | Verify syntax highlighting | Correct for content type |
| 4 | Verify read-only (if published) | Cannot edit published version |

### TC-7.2: Open Specific Version

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click version → "Open" | Editor opens |
| 2 | Verify version matches | Correct version content |
| 3 | Status bar shows | Version info displayed |

### TC-7.3: Open in Visual Editor (OpenAPI)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click OpenAPI artifact | Context menu appears |
| 2 | Select "Open in Visual Editor" | Visual editor opens |
| 3 | Verify editor loads | OpenAPI visual interface shown |
| 4 | Navigation tree visible | API structure in left panel |

### TC-7.4: Open Draft Version (Editable)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open a draft version | Editor opens |
| 2 | Verify editable | Status bar shows draft icon |
| 3 | Make changes | Changes allowed |
| 4 | Save (Ctrl+S) | Changes saved to registry |

---

## 8. State Management

### TC-8.1: Change Artifact State to Disabled

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click enabled artifact | Context menu appears |
| 2 | Select "Change State" | State picker appears |
| 3 | Select "Disabled" | State changed |
| 4 | Verify in tree view | Artifact shows disabled state |

### TC-8.2: Change Artifact State to Deprecated

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click artifact → "Change State" | State picker appears |
| 2 | Select "Deprecated" | State changed |
| 3 | Warning icon appears | Visual indicator updated |

### TC-8.3: Change Version State

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click version → "Change State" | State options appear |
| 2 | Select new state | State applied to version only |
| 3 | Verify other versions unchanged | Isolation confirmed |

---

## 9. Download & Export

### TC-9.1: Download Artifact Content

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click artifact → "Download Content" | Save dialog appears |
| 2 | Choose location and filename | File saved |
| 3 | Open downloaded file | Content matches artifact |

### TC-9.2: Download Version Content

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click version → "Download Content" | Save dialog appears |
| 2 | Save file | Specific version content saved |

---

## 10. Delete Operations

### TC-10.1: Delete Version

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click version (not last) → "Delete Version" | Confirmation dialog |
| 2 | Click "Delete" | Version deleted |
| 3 | Tree refreshes | Version no longer visible |

### TC-10.2: Cannot Delete Last Version

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click the only version → "Delete Version" | Warning message |
| 2 | Message explains | "Cannot delete last version" |
| 3 | Suggests | "Delete the entire artifact instead" |

### TC-10.3: Delete Artifact

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click artifact → "Delete Artifact" | Modal confirmation |
| 2 | Shows version count | "This will delete N version(s)" |
| 3 | Click "Delete" | Artifact and versions deleted |
| 4 | Tree refreshes | Artifact gone |

### TC-10.4: Delete Group

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click group → "Delete Group" | Modal confirmation |
| 2 | Shows artifact count | "Group contains N artifact(s)" |
| 3 | Warning about cascade | Cascade delete explained |
| 4 | Click "Delete" | Group and all contents deleted |

### TC-10.5: Delete Cancellation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start delete operation | Confirmation dialog |
| 2 | Click "Cancel" | Nothing deleted |
| 3 | Tree unchanged | All items remain |

---

## 11. Metadata Editing

### TC-11.1: Edit Group Description

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click group → "Edit Metadata" | Wizard opens |
| 2 | Select "Edit Description" | Input box appears |
| 3 | Enter new description | Description updated |
| 4 | Tree tooltip updated | New description shown |

### TC-11.2: Edit Artifact Name

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click artifact → "Edit Metadata" | Options appear |
| 2 | Select "Edit Name" | Input box appears |
| 3 | Enter new name | Name saved |
| 4 | Tree label updated | Shows new name |

### TC-11.3: Add Label to Artifact

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Edit Metadata → "Manage Labels" | Label manager opens |
| 2 | Select "Add Label" | Input box appears |
| 3 | Enter "env=production" | Label added |
| 4 | Select "Done" | Labels saved |
| 5 | Verify tooltip | Shows "env=production" |
| 6 | Verify description | Shows "(1 label)" |

### TC-11.4: Remove Label

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Manage Labels → "Remove Label" | Existing labels listed |
| 2 | Select label to remove | Label removed |
| 3 | Done | Changes saved |

### TC-11.5: Edit Version Metadata

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click version → "Edit Metadata" | Options appear |
| 2 | Edit name and description | Changes saved |
| 3 | Add labels | Labels added |

### TC-11.6: Label Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add label without equals sign | Validation error |
| 2 | Enter "invalidlabel" | "Labels must be key=value" |

---

## 12. Rules Configuration

### TC-12.1: View Global Rules

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "Manage Global Rules" | Rules picker opens |
| 2 | View available rules | VALIDITY, COMPATIBILITY, INTEGRITY |
| 3 | See current status | Enabled/Disabled for each |

### TC-12.2: Enable Validity Rule

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Manage Global Rules | Rules list appears |
| 2 | Select "Validity" | Action options appear |
| 3 | Select "Enable" | Configuration picker appears |
| 4 | Select "FULL" | Rule enabled |
| 5 | Rule applies globally | All artifacts validated |

### TC-12.3: Configure Compatibility Rule

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Manage Global Rules → "Compatibility" | Action picker |
| 2 | Select "Enable" | Level picker appears |
| 3 | Select "BACKWARD_TRANSITIVE" | Rule configured |

### TC-12.4: Manage Group Rules

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click group → "Manage Rules" | Group rules picker |
| 2 | Enable Validity rule | Applies to group only |
| 3 | Overrides global rules | For artifacts in this group |

### TC-12.5: Manage Artifact Rules

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click artifact → "Manage Rules" | Artifact rules picker |
| 2 | Configure rules | Applies to artifact only |
| 3 | Highest priority | Overrides group and global |

### TC-12.6: Disable Rule

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Manage Rules → Select enabled rule | Action picker |
| 2 | Select "Disable" | Rule disabled |
| 3 | Rule no longer applies | Validation skipped |

### TC-12.7: Rule Violation Error

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable strict VALIDITY rule | Rule active |
| 2 | Try to add invalid content | Validation fails |
| 3 | Error message | Shows rule violation details |
| 4 | Suggestions provided | "Fix content or disable rule" |

---

## 13. Branching Support

### TC-13.1: View Branches

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Expand artifact in tree | Branches folder visible |
| 2 | Expand branches | System and custom branches listed |
| 3 | "latest" branch shown | System branch indicator |

### TC-13.2: Create Branch

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click artifact → "Create Branch" | Wizard starts |
| 2 | Enter branch ID: "feature-v2" | ID validated |
| 3 | Enter description | Optional description |
| 4 | Confirm | Branch created |
| 5 | Branch appears in tree | Under artifact |

### TC-13.3: Edit Branch Metadata

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click custom branch → "Edit Metadata" | Editor opens |
| 2 | Update description | Changes saved |

### TC-13.4: Add Version to Branch

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click branch → "Add Version" | Version picker appears |
| 2 | Select versions (multi-select) | Multiple versions selectable |
| 3 | Confirm | Versions added to branch |
| 4 | Expand branch | Added versions visible |

### TC-13.5: Delete Custom Branch

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click custom branch → "Delete" | Confirmation dialog |
| 2 | Confirm | Branch deleted |

### TC-13.6: Cannot Delete System Branch

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click "latest" branch | Context menu |
| 2 | "Delete" not available OR shows error | System branch protected |

---

## 14. Draft Management

### TC-14.1: Create Draft Version

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click artifact → "Create Draft Version" | Wizard starts |
| 2 | Select file with content | Content loaded |
| 3 | Enter version number | Version set |
| 4 | Confirm creation | Draft created |
| 5 | Draft icon shown | Edit icon, blue color |

### TC-14.2: Edit Draft Content

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open draft version | Editor opens |
| 2 | Status bar shows draft | Draft indicator visible |
| 3 | Make changes | Editing allowed |
| 4 | Save (Ctrl+S) | Changes saved to registry |

### TC-14.3: Edit Draft Metadata

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click draft → "Edit Draft Metadata" | Metadata editor |
| 2 | Update name, description | Changes saved |

### TC-14.4: Finalize Draft

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click draft → "Finalize Draft" | Confirmation dialog |
| 2 | Warning about immutability | User informed |
| 3 | Select target state (ENABLED) | State chosen |
| 4 | Confirm | Draft finalized |
| 5 | Icon changes | No longer draft indicator |
| 6 | Content becomes read-only | Cannot edit published |

### TC-14.5: Discard Draft

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click draft → "Discard Draft" | Confirmation dialog |
| 2 | Warning about deletion | "Cannot be undone" |
| 3 | Confirm | Draft deleted |
| 4 | Version removed from tree | Tree updated |

### TC-14.6: Draft Commands Only for Drafts

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click published version | Context menu |
| 2 | Draft commands not visible | "Finalize Draft" not shown |

---

## 15. Group Management

### TC-15.1: Create Group with Full Metadata

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "Create Group" | Wizard starts |
| 2 | Enter group ID | Validation passes |
| 3 | Enter description | Optional |
| 4 | Add labels | Optional labels |
| 5 | Confirm | Group created |

### TC-15.2: Create Group - Minimal

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create Group wizard | Start |
| 2 | Enter only group ID | Required field |
| 3 | Skip optional fields | Defaults used |
| 4 | Confirm | Group created |

### TC-15.3: Duplicate Group ID Error

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create group with existing ID | - |
| 2 | Confirm | Error: "Group already exists" (409) |

### TC-15.4: Invalid Group ID

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter group ID with spaces | Validation fails |
| 2 | Error message | "Invalid group ID format" |

---

## 16. Import/Export Operations

### TC-16.1: Export All Artifacts

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "Export All" | Save dialog appears |
| 2 | Choose location | File path selected |
| 3 | Save | Progress indicator shown |
| 4 | Export completes | ZIP file created |
| 5 | File size shown | "Exported X.X MB" |

### TC-16.2: Import Artifacts

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "Import Artifacts" | File picker appears |
| 2 | Select ZIP file | File loaded |
| 3 | Confirm import | Progress shown |
| 4 | Import completes | Artifacts added to registry |
| 5 | Tree refreshes | New artifacts visible |

### TC-16.3: Import Conflict Handling

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Import ZIP with existing artifacts | - |
| 2 | Conflict detected | User prompted |
| 3 | Options presented | Skip, Overwrite, Cancel |

---

## 17. Role Management

### TC-17.1: View Current User Role

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "View Current User Role" | Role info shown |
| 2 | Displays role name | Admin, Developer, or Read-only |

### TC-17.2: Create Role Mapping

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "Create Role Mapping" | Wizard starts |
| 2 | Enter principal ID | User/group ID entered |
| 3 | Select role | Role options shown |
| 4 | Confirm | Role mapping created |

### TC-17.3: Update Role Mapping

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View role mappings | List of mappings |
| 2 | Select mapping to update | Role picker |
| 3 | Select new role | Role changed |

### TC-17.4: Delete Role Mapping

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select role mapping | Context menu |
| 2 | Delete mapping | Confirmation dialog |
| 3 | Confirm | Mapping removed |

---

## 18. Settings/Configuration

### TC-18.1: View Server Settings

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "View Settings" | Settings tree appears |
| 2 | Properties listed | All configuration properties |
| 3 | Current values shown | Descriptions included |

### TC-18.2: Edit Configuration Property

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click property → "Edit" | Editor opens |
| 2 | Enter new value | Validation applied |
| 3 | Save | Property updated |

### TC-18.3: Reset Property to Default

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click property → "Reset to Default" | Confirmation |
| 2 | Confirm | Property reset |

### TC-18.4: Search Properties

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "Search Properties" | Search input |
| 2 | Enter keyword | Filtered results |

---

## 19. Visual Editor

### TC-19.1: Open OpenAPI in Visual Editor

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click OpenAPI artifact | Context menu |
| 2 | Select "Open in Visual Editor" | Visual editor opens |
| 3 | Verify components | Navigation tree, main panel |
| 4 | Verify content loads | API structure visible |

### TC-19.2: Navigate API Structure

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Expand nodes in navigation tree | Hierarchy visible |
| 2 | Click on path | Path details shown in main panel |
| 3 | Click on schema | Schema editor displayed |

### TC-19.3: Edit API Info

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select "Info" in navigation | Info form displayed |
| 2 | Edit title | Click to edit |
| 3 | Save | Changes persisted |
| 4 | Verify in source | Source updated |

### TC-19.4: Visual Editor for YAML Format

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open YAML-format OpenAPI | Visual editor opens |
| 2 | Make changes | Changes saved |
| 3 | Verify format preserved | YAML format maintained |

---

## 20. Format/Beautify

### TC-20.1: Format JSON Document

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open JSON artifact content | Editor opens |
| 2 | Press Shift+Alt+F | Document formatted |
| 3 | Verify indentation | 2-space indent applied |
| 4 | Verify syntax | Valid JSON maintained |

### TC-20.2: Format YAML Document

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open YAML artifact | Editor opens |
| 2 | Format document | YAML beautified |
| 3 | Verify structure | Valid YAML maintained |

### TC-20.3: Format via Command

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "Format Document" | Document formatted |

---

## 21. Error Handling

### TC-21.1: Network Error Display

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Disconnect network | - |
| 2 | Attempt operation | Error message appears |
| 3 | "Show Details" action | Output channel opens |
| 4 | Detailed logs visible | Timestamp, error code, stack |

### TC-21.2: Validation Error

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit invalid data | Error shown |
| 2 | Message is user-friendly | Clear explanation |
| 3 | Field indicated | Which field failed |

### TC-21.3: Not Found Error

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Try to access deleted resource | 404 error |
| 2 | Clear message | "Resource not found" |
| 3 | Resource type indicated | "Artifact", "Version", etc. |

### TC-21.4: Output Channel Logging

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open "Apicurio Registry" output channel | Channel visible |
| 2 | Perform operations | Logs appear |
| 3 | Errors include timestamps | ISO format dates |
| 4 | Error codes included | NETWORK_ERROR, VALIDATION_ERROR, etc. |

---

## 22. MCP Integration

### TC-22.1: Setup MCP via Wizard

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "Setup AI Features" | Wizard starts |
| 2 | Prerequisites checked | Claude CLI, Docker/Podman |
| 3 | Scenario detected | Local or Remote |
| 4 | Command generated | claude mcp add command |
| 5 | Command copied | To clipboard |

### TC-22.2: Generate Claude Command

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "Generate Claude Command" | Command generated |
| 2 | Correct registry URL | Uses configured connection |
| 3 | Correct image | MCP server image specified |

### TC-22.3: Verify MCP Configuration

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Command Palette → "Verify MCP" | Verification runs |
| 2 | Status reported | Configured/Not configured |
| 3 | Details shown | Server info, connection status |

---

## Test Results Template

Use this template to record test results:

```markdown
## Test Session: [DATE]

**Tester:** [Name]
**Extension Version:** [Version]
**Registry Version:** [Version]
**Environment:** [Local/Remote]

### Results Summary

| Category | Passed | Failed | Skipped |
|----------|--------|--------|---------|
| Connection | 4/4 | 0 | 0 |
| Tree View | 6/6 | 0 | 0 |
| Search | 6/6 | 0 | 0 |
| ... | ... | ... | ... |

### Failed Tests

| Test ID | Description | Expected | Actual | Notes |
|---------|-------------|----------|--------|-------|
| TC-X.X | ... | ... | ... | ... |

### Issues Found

1. [Issue description]
2. [Issue description]
```

---

## Quick Reference Card

**Keyboard Shortcuts:**
- Format Document: `Shift+Alt+F`
- Open Command Palette: `Ctrl+Shift+P` / `Cmd+Shift+P`
- Refresh Tree: Click refresh icon

**Common Commands:**
- `Apicurio Registry: Search`
- `Apicurio Registry: Create Artifact`
- `Apicurio Registry: Create Group`
- `Apicurio Registry: Advanced Search`
- `Apicurio Registry: Setup AI Features`

**Context Menu Groups:**
- Copy operations: Group 1
- Open operations: Group 2
- State/Metadata: Group 5
- Rules: Group 6
- Delete (dangerous): Group 9

---

*Document End*
