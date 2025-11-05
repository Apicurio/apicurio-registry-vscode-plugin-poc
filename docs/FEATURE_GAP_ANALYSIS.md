# Feature Gap Analysis: VSCode Plugin vs Web UI

**Date:** 2025-11-05
**Status:** Analysis Complete
**Source:** Apicurio Registry UI App at `/Users/astranier/Documents/dev/apicurio/apicurio-registry/ui/ui-app`

---

## Executive Summary

This document provides a comprehensive comparison between the Apicurio Registry Web UI and the VSCode plugin, identifying feature gaps, unique capabilities, and strategic recommendations for achieving feature parity.

**Key Statistics:**
- **Web UI Features Analyzed:** 100+
- **Critical Gaps Identified:** 15
- **Features Unique to VSCode:** 7
- **Recommended Implementation Phases:** 4

---

## 1. Web UI Feature Inventory

### 1.1 Navigation & Layout

**Main Navigation (Tab-Based):**
- Explore - Browse groups and artifacts hierarchically
- Search - Advanced search across artifacts, versions, and groups
- Drafts - Manage draft versions
- Rules - Global validation rules management
- Roles - User access and role mappings (RBAC)
- Settings - Registry configuration properties

**Routing:**
- Hierarchical: Registry → Groups → Artifacts → Versions
- Breadcrumb navigation (feature-flagged)
- Deep linking to specific resources

**Page Structure:**
- Consistent PatternFly-based design
- Card layouts for grouping
- Toolbar pattern for filtering/actions
- Table/list pattern for data display

### 1.2 Artifact Management

**Artifact Listing:**
- Table view with columns: Name, ID, Type, Modified, State
- Filters: Name, Description, Labels, Type
- Sorting: Multiple options with order
- Pagination
- Type-specific icons
- State badges (ENABLED, DISABLED, DEPRECATED, DRAFT)

**Artifact Creation:**
- 3-step wizard:
  1. Artifact details (group, ID, type, name, description, labels)
  2. Version details (version, name, description, labels)
  3. Content upload (file/URL/manual input)
- Auto-detection of artifact type
- Content validation before creation

**Artifact Operations:**
- View artifact details
- Edit metadata (name, description, labels)
- Delete artifact (with confirmation)
- Change ownership
- Configure rules
- Export as file

**Supported Types:**
- OPENAPI, ASYNCAPI, AVRO, PROTOBUF, JSON, GRAPHQL, KCONNECT, WSDL, XSD, XML

### 1.3 Version Management

**Version Display:**
- Table with columns: Version, Global ID, Content ID, Created On
- Sortable by version, global ID, created date
- State badges
- Version names and descriptions
- Timestamps

**Version Operations:**
- Create new version
- View version content
- Edit draft version
- Delete version (feature-flagged)
- Change version state
- Add to branch
- Download content
- Generate client code

**Version States:**
- ENABLED - Active and available
- DISABLED - Hidden from listings
- DEPRECATED - Marked for removal
- DRAFT - Mutable, can be edited

### 1.4 Draft Management

**Draft Workflow:**
1. Create draft version (mutable content)
2. Edit draft in specialized editor
3. Validate changes
4. Finalize draft → converts to ENABLED state

**Draft Features:**
- Draft creation wizard
- Draft listing page (searchable, filterable)
- Draft editing (per artifact type)
- Draft metadata editing
- Draft from existing version (clone)
- Dry run validation
- Finalize with confirmation
- Delete draft

**Draft Editors:**
- OpenAPI visual editor
- AsyncAPI visual editor
- Protobuf editor
- Generic text editor (Monaco-based)

**Draft Conflict Detection:**
- Polls server every 30 seconds
- Detects concurrent edits
- Overwrite confirmation modal

### 1.5 Content Viewing & Editing

**Content Display:**
- Syntax-highlighted code view
- Visual renderers (OpenAPI, AsyncAPI)
- Documentation generation (OpenAPI)
- Line numbers
- Format/beautify option

**Content Editors:**
- Monaco editor integration
- Syntax highlighting per type
- Auto-formatting
- Real-time validation
- Dirty state tracking
- Save/discard changes
- Compare current vs original
- Download content

**Content Operations:**
- View content
- Edit draft content
- Compare versions (diff view)
- Download content
- Format content
- Validate content

### 1.6 Search & Discovery

**Search Modes:**
1. **Artifact Search** - By group, ID, name, description, labels, global ID
2. **Version Search** - By artifact + version, name, description, labels
3. **Group Search** - By group ID, description, labels

**Search Features:**
- Multi-field filtering
- Label-based search (key:value format)
- Advanced sorting (multiple fields)
- Pagination
- Direct navigation to results
- Clear filters option
- Save search context

**Filter Types:**
- Text filters (name, description, group ID, artifact ID)
- Label filters (click to filter)
- Type filters (dropdown)
- State filters
- Date range filters

### 1.7 Grouping & Organization

**Group Management:**
- Group listing with artifact counts
- Create group (ID, description, labels)
- Edit group metadata
- Delete group (cascades to artifacts)
- Group-level rules
- Change group ownership

**Group Display:**
- Overview tab - metadata and artifacts list
- Rules tab - group-specific validation rules

**Artifact Organization:**
- Default group (always exists)
- Custom groups
- Artifacts filtered/sorted within group
- Create artifact in group context
- Move artifacts via metadata edit

### 1.8 Label Management

**Label Support:**
- Key-value pairs
- Add/edit/remove labels
- Label validation (no duplicates)
- Label display (colored badges)
- Click label to filter
- Search by labels

**Label Locations:**
- Artifact metadata
- Version metadata
- Group metadata
- Draft metadata
- Search filters
- List view columns

### 1.9 Rules & Validation

**Rule Levels:**
1. **Global Rules** - Apply to all artifacts
2. **Group Rules** - Apply to artifacts in group
3. **Artifact Rules** - Apply to specific artifact

**Rule Types:**
- **VALIDITY** - Content must be valid
  - FULL, SYNTAX_ONLY, NONE
- **COMPATIBILITY** - Version compatibility checking
  - BACKWARD, FORWARD, FULL, NONE
  - Transitive variants
- **INTEGRITY** - Reference integrity

**Rule Configuration:**
- Enable/disable rules
- Configure rule settings
- Rule inheritance (global → group → artifact)
- Rule violation display (detailed errors)

### 1.10 Branching

**Branch Features:**
- Create branch (ID, description)
- Add version to branch
- Remove version from branch
- Replace branch versions
- View branch metadata
- Delete branch

**Semantic Versioning:**
- Configurable via settings
- Validation enabled/disabled
- Branching enabled/disabled
- Coerce version numbers

**Branch Operations:**
- View branches list
- Branch detail page
- Version management within branch

### 1.11 Import/Export

**Import:**
- Upload ZIP file
- Drag-and-drop or browse
- Progress indicator
- Imports all artifacts
- Admin-only operation

**Export:**
- Export all artifacts as ZIP
- Download individual artifact
- Proper file extensions (`.json`, `.proto`, `.wsdl`, etc.)
- Proper MIME types
- Admin-only bulk export

### 1.12 Role Management

**Role-Based Access Control:**
- Principal → Role mappings
- Roles: Admin, Developer, Viewer
- Grant/revoke access
- Update existing mappings
- Admin-only page

**Access Control UI:**
- IfAuth component (conditional rendering)
- Role-based feature visibility
- Permission-based operations

### 1.13 Settings/Configuration

**Configuration Groups:**
- Authentication settings
- Authorization settings
- Compatibility settings
- Web console settings
- Semantic versioning settings

**Property Management:**
- List all properties
- Search properties
- Edit property values (inline)
- Type-specific inputs (boolean, string, number)
- Save on change

### 1.14 Advanced Features

**Client Code Generation:**
- Language selection (Java, TypeScript, Go, Python, etc.)
- Configuration options (package, class name, patterns)
- Download generated SDK ZIP
- OpenAPI/AsyncAPI support

**Comments:**
- Add comments to versions
- View comment history
- Edit/delete comments
- Comment metadata

**References:**
- View inbound/outbound references
- Reference metadata
- Dependency visualization

**Ownership:**
- Change artifact owner
- Transfer ownership
- Owner display in metadata

---

## 2. VSCode Plugin Current Features

### 2.1 Implemented Features

**Tree Navigation:**
- ✅ Hierarchical tree view (Groups → Artifacts → Versions)
- ✅ State-specific icons (draft, published, disabled, deprecated)
- ✅ Artifact counts in group labels
- ✅ Tooltips with metadata
- ✅ Collapsible sections

**Search:**
- ✅ Basic search command (single criterion)
- ✅ Filter by: name, group, description, type, state, labels
- ✅ Search result limit (configurable)
- ❌ No multi-field search
- ❌ No version search
- ❌ No saved searches

**Artifact Operations:**
- ✅ View artifact content
- ✅ Copy artifact ID
- ✅ Copy full reference (group:artifact:version)
- ✅ Open artifact in editor
- ✅ Download artifact content
- ✅ Delete artifact
- ✅ Change artifact state
- ❌ No edit metadata
- ❌ No label management

**Version Operations:**
- ✅ View version content
- ✅ Copy version string
- ✅ Open version in editor
- ✅ Download version content
- ✅ Delete version
- ✅ Change version state
- ❌ No create version UI
- ❌ No edit version metadata

**Group Operations:**
- ✅ View group artifacts
- ✅ Copy group ID
- ✅ Delete group
- ❌ No create group UI
- ❌ No edit group metadata

**Draft Support (Infrastructure):**
- ✅ Draft feature detection
- ✅ Draft creation workflow
- ✅ Draft management commands (finalize, discard, edit metadata)
- ✅ Draft visual indicators (icons, badges)
- ✅ Draft list view
- ❌ No draft editing UI (text editor only, no visual editor)

**Text Editing:**
- ✅ Custom URI scheme (apicurio://)
- ✅ FileSystemProvider for save-back
- ✅ Status bar integration
- ✅ Syntax highlighting auto-detection
- ✅ Save & auto-save (optional)
- ✅ Conflict detection
- ✅ State-based editing (drafts editable, published read-only)

**User Preferences:**
- ✅ Display preferences (artifact names vs IDs, version order, counts, truncation)
- ✅ Search preferences (default limit)
- ✅ Configuration auto-refresh

**Multi-Registry:**
- ✅ Multiple registry connections
- ✅ Switch between registries
- ✅ Connection management

**MCP Integration:**
- ✅ MCP server for AI features
- ✅ Setup wizard
- ✅ Configuration management
- ❌ Blocked by Claude Code bug

### 2.2 Unique VSCode Capabilities

**IDE Integration:**
- 💎 Native VSCode tree view in sidebar
- 💎 Command palette integration
- 💎 Keyboard shortcuts
- 💎 Context menu actions
- 💎 File system integration (edit locally)
- 💎 VSCode diff tools
- 💎 Multi-file workflow

**Quick Actions:**
- 💎 Copy to clipboard (one-click)
- 💎 Quick open in editor
- 💎 Inline buttons in tree view
- 💎 Context-sensitive menus

**Local Workflow:**
- 💎 Download and edit locally
- 💎 Offline work capability
- 💎 Version control integration (potential)
- 💎 Git workflow (potential)

---

## 3. Critical Feature Gaps

### 3.1 HIGH PRIORITY GAPS

#### 1. Draft Editing UI ⚠️ CRITICAL

**Web UI Has:**
- Visual OpenAPI editor
- Visual AsyncAPI editor
- Protobuf editor
- Text editor with formatting
- Real-time validation
- Compare changes
- Conflict detection UI

**VSCode Plugin Has:**
- Text editor only (Task 015-017)
- Basic conflict detection
- Save/auto-save

**Gap:**
- ❌ No visual editor for OpenAPI/AsyncAPI
- ❌ No format/beautify option
- ❌ No compare current vs original UI
- ❌ Limited validation feedback

**Impact:** Users can edit drafts as text, but lack rich editing experience

**Status:** Visual editor in Phase 3.2 (Tasks 020-021) - deferred to end

---

#### 2. Advanced Search ⚠️ CRITICAL

**Web UI Has:**
- Search artifacts, versions, groups separately
- Multi-field filtering
- Label-based search
- Advanced sorting
- Search result actions

**VSCode Plugin Has:**
- Single-criterion search only
- Limited to artifacts
- Basic filtering

**Gap:**
- ❌ No version search
- ❌ No group search
- ❌ No multi-field filtering
- ❌ No label filtering
- ❌ No advanced sort options

**Impact:** Discovery limited in large registries

**Recommendation:** Implement multi-field search (2-3h effort)

---

#### 3. Label Management ⚠️ HIGH

**Web UI Has:**
- Add/edit/remove labels (key-value pairs)
- Label display in all views
- Click label to filter
- Label-based search
- Label validation

**VSCode Plugin Has:**
- ❌ No label viewing in tree
- ❌ No label editing
- ❌ No label filtering
- ❌ No label search

**Gap:** Complete absence of label functionality

**Impact:** Cannot use labels for organization/discovery

**Recommendation:** Implement label management (4-6h effort)

---

#### 4. Version Creation ⚠️ HIGH

**Web UI Has:**
- Create version wizard
- Version metadata (version, name, description, labels)
- Content upload (file/URL/text)
- Content validation
- Auto-version generation

**VSCode Plugin Has:**
- ❌ No create version UI
- ❌ No version upload
- ✅ Can create draft (which becomes version on finalize)

**Gap:** Cannot create published versions directly

**Impact:** Must use web UI or finalize drafts

**Recommendation:** Implement create version command (3-4h effort)

---

### 3.2 MEDIUM PRIORITY GAPS

#### 5. Metadata Editing

**Web UI Has:**
- Edit artifact metadata (name, description, labels)
- Edit version metadata
- Edit group metadata
- Inline editing UI

**VSCode Plugin Has:**
- ✅ Edit draft metadata (Task 013)
- ❌ No edit artifact metadata
- ❌ No edit version metadata
- ❌ No edit group metadata

**Gap:** Limited metadata management

**Recommendation:** Implement metadata edit commands (2-3h effort)

---

#### 6. Rules Configuration

**Web UI Has:**
- Global rules page
- Group rules tab
- Artifact rules tab
- Enable/disable rules
- Configure rule settings
- Rule violation display

**VSCode Plugin Has:**
- ❌ No rules viewing
- ❌ No rules configuration
- ❌ No validation error display

**Gap:** Complete absence of rule functionality

**Impact:** Cannot configure validation in VSCode

**Recommendation:** Implement rules UI (6-8h effort)

---

#### 7. Group Management

**Web UI Has:**
- Create group wizard
- Edit group metadata
- Delete group (existing ✅)
- Group-level rules

**VSCode Plugin Has:**
- ✅ Delete group (Task 007)
- ❌ No create group UI
- ❌ No edit group metadata
- ❌ No group rules

**Gap:** Limited group operations

**Recommendation:** Implement create/edit group (2-3h effort)

---

#### 8. Branching Support

**Web UI Has:**
- Create branch
- Add/remove versions from branch
- View branch details
- Branch listing
- Semantic versioning configuration

**VSCode Plugin Has:**
- ❌ No branch support at all

**Gap:** Complete absence of branching

**Impact:** Cannot use advanced version management

**Recommendation:** Implement branching (8-10h effort)

---

### 3.3 LOW PRIORITY GAPS

#### 9. Import/Export

**Web UI Has:**
- Import from ZIP (bulk)
- Export to ZIP (bulk)
- Export individual artifacts
- Progress indicators

**VSCode Plugin Has:**
- ✅ Download individual artifacts
- ❌ No bulk import
- ❌ No bulk export

**Gap:** No bulk operations

**Recommendation:** Implement import/export (4-6h effort)

---

#### 10. Role Management

**Web UI Has:**
- Role mappings page
- Grant/revoke access
- Update roles
- Admin-only operations

**VSCode Plugin Has:**
- ❌ No role management

**Gap:** Admin operations require web UI

**Recommendation:** Low priority (admin-only feature)

---

#### 11. Settings/Configuration

**Web UI Has:**
- Configuration properties list
- Edit properties inline
- Search properties
- Grouped by category

**VSCode Plugin Has:**
- ❌ No settings UI

**Gap:** Configuration requires web UI

**Recommendation:** Low priority (admin-only feature)

---

#### 12. Client Code Generation

**Web UI Has:**
- Generate client wizard
- Language selection
- Configuration options
- Download SDK ZIP

**VSCode Plugin Has:**
- ❌ No code generation

**Gap:** Developers must use web UI

**Recommendation:** Low priority (nice-to-have)

---

#### 13. Comments

**Web UI Has:**
- Add comments to versions
- View comment history
- Edit/delete comments

**VSCode Plugin Has:**
- ❌ No comments support

**Gap:** Collaboration features missing

**Recommendation:** Low priority (collaboration feature)

---

#### 14. References

**Web UI Has:**
- View inbound/outbound references
- Reference metadata
- Dependency visualization

**VSCode Plugin Has:**
- ❌ No reference support

**Gap:** Dependency management limited

**Recommendation:** Low priority (advanced feature)

---

#### 15. Ownership Management

**Web UI Has:**
- Change owner modal
- Transfer ownership
- Owner display

**VSCode Plugin Has:**
- ❌ No ownership management

**Gap:** Cannot change owners

**Recommendation:** Low priority (admin feature)

---

## 4. Unique VSCode Advantages

### 4.1 Current Unique Features

1. **Native IDE Integration**
   - Sidebar tree view
   - Command palette
   - Keyboard shortcuts
   - File system integration

2. **Quick Actions**
   - Copy to clipboard (one-click)
   - Context menu actions
   - Inline tree buttons

3. **Local Workflow**
   - Download and edit locally
   - VSCode diff tools
   - Offline capability

4. **Multi-Registry**
   - Switch between registries
   - Multiple connections
   - Connection management

### 4.2 Potential Unique Features

5. **Git Integration** (Not Yet Built)
   - Commit artifacts to Git
   - Version control workflow
   - Push/pull from repository

6. **Code Snippets** (Not Yet Built)
   - Insert artifact references
   - Auto-complete from registry
   - IntelliSense for schemas

7. **Real-time Validation** (Not Yet Built)
   - Validation in editor
   - Inline error markers
   - Quick fixes

---

## 5. UI Patterns to Adopt

### 5.1 Wizard Pattern

**Web UI Implementation:**
- Multi-step wizards (Create Artifact, Create Draft, etc.)
- Clear progress indication
- Validation per step
- Back/Next navigation

**VSCode Adoption:**
- Use VSCode QuickPick with steps
- Show progress in title
- Validate before proceeding
- Multi-step input flows

**Example Use Cases:**
- Create artifact wizard
- Create version wizard
- Import wizard

---

### 5.2 Confirmation Modals

**Web UI Implementation:**
- Consistent confirmation dialogs
- Clear action buttons
- Warning messages
- Secondary actions (cancel)

**VSCode Adoption:**
- VSCode showWarningMessage with modal options
- Consistent messaging templates
- Clear action choices
- Danger actions highlighted

**Example Use Cases:**
- Delete confirmations
- Overwrite confirmations
- Finalize draft confirmations

---

### 5.3 Toolbar Pattern

**Web UI Implementation:**
- Search + filters + sort + actions in toolbar
- Consistent across list views
- Active filter indicators
- Clear all filters option

**VSCode Adoption:**
- Custom webview with toolbar (for complex UIs)
- Tree view title with filter status
- Quick filter commands
- Status bar integration

**Example Use Cases:**
- Search results view
- Draft list view
- Version list view

---

### 5.4 Empty State Pattern

**Web UI Implementation:**
- Helpful empty states
- Suggest next action
- Visual cues
- Call-to-action buttons

**VSCode Adoption:**
- TreeItem with "No items" + action button
- Welcome view with quick actions
- Helpful messages in tree
- Command suggestions

**Example Use Cases:**
- No artifacts in group
- No drafts found
- No search results

---

### 5.5 Progressive Disclosure

**Web UI Implementation:**
- Tabs for detailed information
- Expandable sections
- Show more/less toggles
- Collapsible panels

**VSCode Adoption:**
- Collapsible tree sections
- Details in hover tooltips
- Quick pick with detailed view
- Command to show more info

**Example Use Cases:**
- Artifact details
- Version metadata
- Rule configuration

---

## 6. Strategic Recommendations

### 6.1 Feature Parity Roadmap

**Phase 1: Core Operations (8-12 weeks)**
- Focus: Essential features for day-to-day use
- Goals: Drafts editing, search, labels, version management
- See FEATURE_ROADMAP.md for details

**Phase 2: Advanced Features (6-8 weeks)**
- Focus: Power user features
- Goals: Rules, branches, metadata editing

**Phase 3: Admin Features (4-6 weeks)**
- Focus: Admin operations
- Goals: Import/export, roles, settings

**Phase 4: Visual Editor (8-10 weeks)**
- Focus: Rich editing experience
- Goals: Visual OpenAPI/AsyncAPI editors
- Status: Deferred to end per user request

### 6.2 Implementation Approach

**Leverage Existing Work:**
- Draft infrastructure complete (Tasks 011-014)
- Text editing complete (Tasks 015-017)
- Build on this foundation

**Reuse Patterns:**
- Copy UI patterns from web app
- Adapt PatternFly components to VSCode
- Maintain consistency with web UI

**VSCode-Native:**
- Use VSCode APIs where appropriate
- Native tree views, quick picks, modals
- Don't force web UI patterns where VSCode has better options

### 6.3 Quality Guidelines

**Testing:**
- TDD approach for all new features
- 80%+ test coverage
- Manual testing in Extension Development Host

**Documentation:**
- Update FEATURE_GAP_ANALYSIS.md as features are implemented
- Maintain FEATURE_ROADMAP.md with progress
- Document UI patterns and decisions

**User Experience:**
- Consistent with VSCode conventions
- Keyboard shortcuts for common actions
- Quick access via command palette
- Helpful error messages

---

## 7. Gap Summary Matrix

| Feature | Web UI | VSCode Plugin | Priority | Effort | Status |
|---------|--------|---------------|----------|--------|--------|
| **Drafts** |
| Create draft | ✅ | ✅ | ✅ Done | - | Task 012 |
| Edit draft (text) | ✅ | ✅ | ✅ Done | - | Task 015-017 |
| Edit draft (visual) | ✅ | ❌ | 🔴 Low | 30-40h | Deferred |
| Finalize draft | ✅ | ✅ | ✅ Done | - | Task 013 |
| Draft metadata | ✅ | ✅ | ✅ Done | - | Task 013 |
| **Search** |
| Basic search | ✅ | ✅ | ✅ Done | - | Task 001 |
| Multi-field search | ✅ | ❌ | 🔴 High | 2-3h | Planned |
| Version search | ✅ | ❌ | 🟡 Medium | 2-3h | Planned |
| Label filtering | ✅ | ❌ | 🔴 High | 2h | Planned |
| **Labels** |
| View labels | ✅ | ❌ | 🔴 High | 2h | Planned |
| Edit labels | ✅ | ❌ | 🔴 High | 3-4h | Planned |
| Filter by labels | ✅ | ❌ | 🔴 High | 2h | Planned |
| **Versions** |
| View version | ✅ | ✅ | ✅ Done | - | Phase 2 |
| Create version | ✅ | ❌ | 🔴 High | 3-4h | Planned |
| Delete version | ✅ | ✅ | ✅ Done | - | Task 007 |
| Edit version metadata | ✅ | ❌ | 🟡 Medium | 2-3h | Planned |
| Change version state | ✅ | ✅ | ✅ Done | - | Task 003b |
| **Artifacts** |
| Create artifact | ✅ | ✅ | ✅ Done | - | Task 002 |
| Delete artifact | ✅ | ✅ | ✅ Done | - | Task 007 |
| Edit artifact metadata | ✅ | ❌ | 🟡 Medium | 2-3h | Planned |
| Change artifact state | ✅ | ✅ | ✅ Done | - | Task 003b |
| **Groups** |
| Create group | ✅ | ❌ | 🟡 Medium | 2h | Planned |
| Delete group | ✅ | ✅ | ✅ Done | - | Task 007 |
| Edit group metadata | ✅ | ❌ | 🟡 Medium | 2h | Planned |
| **Rules** |
| View rules | ✅ | ❌ | 🟡 Medium | 3-4h | Planned |
| Configure rules | ✅ | ❌ | 🟡 Medium | 4-5h | Planned |
| Rule violations | ✅ | ❌ | 🟡 Medium | 2h | Planned |
| **Branches** |
| Create branch | ✅ | ❌ | 🟢 Low | 3-4h | Backlog |
| Manage branches | ✅ | ❌ | 🟢 Low | 5-6h | Backlog |
| **Import/Export** |
| Import ZIP | ✅ | ❌ | 🟢 Low | 3-4h | Backlog |
| Export ZIP | ✅ | ❌ | 🟢 Low | 2-3h | Backlog |
| **Admin** |
| Role management | ✅ | ❌ | 🔵 Future | 4-6h | Future |
| Settings UI | ✅ | ❌ | 🔵 Future | 6-8h | Future |
| Code generation | ✅ | ❌ | 🔵 Future | 4-6h | Future |
| **Collaboration** |
| Comments | ✅ | ❌ | 🔵 Future | 3-4h | Future |
| References | ✅ | ❌ | 🔵 Future | 3-4h | Future |
| Ownership | ✅ | ❌ | 🔵 Future | 2h | Future |

**Legend:**
- 🔴 High Priority - Core functionality, frequently used
- 🟡 Medium Priority - Important but not critical
- 🟢 Low Priority - Nice to have, less frequent use
- 🔵 Future - Advanced features, admin-only, or niche use cases

---

## 8. Conclusion

The Apicurio Registry Web UI is a feature-rich application with comprehensive functionality. The VSCode plugin has achieved solid coverage of core CRUD operations but has significant gaps in:

1. **Draft editing UI** (visual editors deferred to end per user request)
2. **Advanced search** (multi-field, labels, versions)
3. **Label management** (viewing, editing, filtering)
4. **Version creation** (direct version creation without drafts)
5. **Metadata editing** (artifacts, versions, groups)
6. **Rules configuration** (validation rules)
7. **Branching** (semantic versioning)

The plugin has unique advantages in IDE integration, quick actions, and local workflow that the web UI cannot match.

**Strategic approach:**
- Focus on high-priority gaps first (search, labels, version operations)
- Leverage existing draft/editing infrastructure (Tasks 011-017)
- Defer visual editor to end (Phase 3.2 Tasks 020-021)
- Maintain VSCode-native UX patterns
- Achieve feature parity incrementally over 18-24 weeks

See **FEATURE_ROADMAP.md** for detailed implementation plan.

---

**Document Version:** 1.0
**Next Review:** After Phase 1 completion
**Maintained By:** VSCode Extension Development Team
