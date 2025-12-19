# Task 037: Settings/Configuration

**Status:** 📋 Planned
**Priority:** High (Phase 3 - Admin & Utility)
**Estimated Effort:** 6-8 hours
**Target Start:** TBD

---

## Goal

Implement Apicurio Registry server configuration management, enabling users to view and edit registry configuration properties through the VSCode extension.

**Feature Parity:** Matches Web UI "Settings" page functionality

---

## Background

### Web UI Current Features

The Apicurio Registry Web UI provides a "Settings" page for server configuration:

1. **Property Groups:**
   - Authentication settings (1 property)
   - Authorization settings (4 properties)
   - Compatibility settings (3 properties)
   - Web console settings (2 properties)
   - Semantic versioning settings (3 properties)
   - Additional properties (dynamic - other config properties)

2. **Operations:**
   - List all configuration properties
   - Search/filter properties by name or description
   - View property details (name, value, type, description)
   - Edit property values (with type-specific inputs)
   - Reset property to default (delete custom value)

3. **Property Types:**
   - **Boolean** - true/false values (rendered as switches)
   - **Integer/Long** - numeric values (validated)
   - **String** - text values

### API Endpoints

```typescript
// List all configuration properties
GET /admin/config/properties
Response: ConfigurationProperty[]

// Get single property
GET /admin/config/properties/{propertyName}
Response: ConfigurationProperty

// Update property value
PUT /admin/config/properties/{propertyName}
Body: { value: string }
Response: 204 No Content

// Delete property (reset to default)
DELETE /admin/config/properties/{propertyName}
Response: 204 No Content
```

### Data Model

```typescript
interface ConfigurationProperty {
    name: string;           // e.g., "apicurio.authn.basic-client-credentials.enabled"
    value: string;          // Always string, even for booleans/numbers
    type: string;           // e.g., "java.lang.Boolean", "java.lang.Integer", "java.lang.String"
    label: string;          // Human-readable name
    description: string;    // Help text
}

interface PropertyGroup {
    name: string;           // "Authentication", "Authorization", etc.
    description: string;
    properties: ConfigurationProperty[];
}
```

---

## Success Criteria

**Must Have:**
- ✅ View all configuration properties organized by group
- ✅ Search/filter properties by name or description
- ✅ Edit property values with type-specific inputs:
  - Boolean → QuickPick (Enable/Disable)
  - Number → InputBox with validation
  - String → InputBox
- ✅ Reset property to default value (delete)
- ✅ Display property metadata (type, description, current value)
- ✅ Error handling for invalid values
- ✅ Comprehensive test coverage (80%+)

**Nice to Have:**
- ⭐ Real-time validation for number inputs
- ⭐ Property value history (if API supports)
- ⭐ Bulk property updates
- ⭐ Configuration templates

---

## Implementation Plan

### Phase 1: Data Models (0.5h)

**File:** `src/models/registryModels.ts`

**Interfaces to Add:**
```typescript
/**
 * Configuration property returned by Registry API
 */
export interface ConfigurationProperty {
    /** Property name (e.g., "apicurio.authn.basic-client-credentials.enabled") */
    name: string;

    /** Property value (always string, even for booleans/numbers) */
    value: string;

    /** Java type (e.g., "java.lang.Boolean", "java.lang.Integer") */
    type: string;

    /** Human-readable label */
    label: string;

    /** Property description/help text */
    description: string;
}

/**
 * Update property request body
 */
export interface UpdatePropertyRequest {
    value: string;
}

/**
 * Property group for UI organization
 */
export interface PropertyGroup {
    name: string;
    description: string;
    properties: ConfigurationProperty[];
}

/**
 * Property type categories
 */
export enum PropertyType {
    BOOLEAN = 'java.lang.Boolean',
    INTEGER = 'java.lang.Integer',
    LONG = 'java.lang.Long',
    STRING = 'java.lang.String'
}
```

### Phase 2: Registry Service Extensions (1.5h)

**File:** `src/services/registryService.ts`

**Methods to Add:**
```typescript
/**
 * Get all configuration properties
 */
async getConfigProperties(): Promise<ConfigurationProperty[]> {
    const response = await this.client.get<ConfigurationProperty[]>(
        '/admin/config/properties'
    );
    return response.data;
}

/**
 * Get single configuration property
 */
async getConfigProperty(propertyName: string): Promise<ConfigurationProperty> {
    const response = await this.client.get<ConfigurationProperty>(
        `/admin/config/properties/${encodeURIComponent(propertyName)}`
    );
    return response.data;
}

/**
 * Update configuration property value
 */
async updateConfigProperty(
    propertyName: string,
    value: string
): Promise<void> {
    await this.client.put(
        `/admin/config/properties/${encodeURIComponent(propertyName)}`,
        { value }
    );
}

/**
 * Delete configuration property (reset to default)
 */
async deleteConfigProperty(propertyName: string): Promise<void> {
    await this.client.delete(
        `/admin/config/properties/${encodeURIComponent(propertyName)}`
    );
}
```

**Error Handling:**
- **403 Forbidden** - Settings management requires admin role
- **404 Not Found** - Property does not exist
- **400 Bad Request** - Invalid property value for type
- **500 Server Error** - Server configuration error

### Phase 3: Settings Commands (3h)

**File:** `src/commands/settingsCommands.ts`

**Commands to Implement:**

#### 3.1 View All Settings
```typescript
/**
 * Open QuickPick to view and manage all settings
 */
export async function viewSettingsCommand(): Promise<void> {
    // 1. Fetch all properties
    // 2. Group by category (Auth, Authorization, Compatibility, etc.)
    // 3. Show QuickPick with groups
    // 4. Select group → show properties in that group
    // 5. Select property → show edit/reset/cancel options
}
```

#### 3.2 Edit Property
```typescript
/**
 * Edit single configuration property
 * Type-specific input (boolean switch, number validation, text)
 */
export async function editPropertyCommand(
    property: ConfigurationProperty
): Promise<void> {
    // 1. Show current value
    // 2. Type-specific input:
    //    - Boolean → QuickPick (Enable/Disable)
    //    - Integer/Long → InputBox with number validation
    //    - String → InputBox
    // 3. Confirm change
    // 4. Update via API
    // 5. Show success/error message
    // 6. Refresh tree view
}
```

#### 3.3 Reset Property
```typescript
/**
 * Reset property to default value (delete)
 */
export async function resetPropertyCommand(
    property: ConfigurationProperty
): Promise<void> {
    // 1. Confirm reset with modal
    // 2. Delete via API
    // 3. Show success message
    // 4. Refresh tree view
}
```

#### 3.4 Search Properties
```typescript
/**
 * Search/filter properties by name or description
 */
export async function searchPropertiesCommand(): Promise<void> {
    // 1. Show InputBox for search term
    // 2. Filter properties (name.includes() || description.includes())
    // 3. Show QuickPick with filtered results
    // 4. Select property → show edit/reset options
}
```

**Utility Functions:**
```typescript
/**
 * Group properties by category
 */
function groupProperties(
    properties: ConfigurationProperty[]
): PropertyGroup[] {
    const groups: Map<string, ConfigurationProperty[]> = new Map([
        ['Authentication', []],
        ['Authorization', []],
        ['Compatibility', []],
        ['Web Console', []],
        ['Semantic Versioning', []],
        ['Additional', []]
    ]);

    for (const prop of properties) {
        const category = categorizeProperty(prop.name);
        groups.get(category)!.push(prop);
    }

    return Array.from(groups.entries()).map(([name, props]) => ({
        name,
        description: getGroupDescription(name),
        properties: props
    }));
}

/**
 * Categorize property by name pattern
 */
function categorizeProperty(name: string): string {
    if (name.includes('authn')) return 'Authentication';
    if (name.includes('authz') || name.includes('owner-only')) return 'Authorization';
    if (name.includes('compat')) return 'Compatibility';
    if (name.includes('ui.') || name.includes('console')) return 'Web Console';
    if (name.includes('semver')) return 'Semantic Versioning';
    return 'Additional';
}

/**
 * Get type-specific input from user
 */
async function getPropertyValueInput(
    property: ConfigurationProperty
): Promise<string | undefined> {
    switch (property.type) {
        case PropertyType.BOOLEAN:
            const boolChoice = await vscode.window.showQuickPick(
                ['Enable', 'Disable'],
                {
                    title: `${property.label}`,
                    placeHolder: `Current: ${property.value === 'true' ? 'Enabled' : 'Disabled'}`
                }
            );
            return boolChoice === 'Enable' ? 'true' : 'false';

        case PropertyType.INTEGER:
        case PropertyType.LONG:
            const numInput = await vscode.window.showInputBox({
                title: `${property.label}`,
                prompt: property.description,
                value: property.value,
                validateInput: (value) => {
                    if (!/^-?\d+$/.test(value)) {
                        return 'Please enter a valid integer';
                    }
                    return null;
                }
            });
            return numInput;

        default: // String
            const textInput = await vscode.window.showInputBox({
                title: `${property.label}`,
                prompt: property.description,
                value: property.value
            });
            return textInput;
    }
}
```

### Phase 4: Tree View Integration (1.5h)

**File:** `src/providers/registryTreeProvider.ts`

**Tree Structure:**
```
📁 Apicurio Registry (localhost:8080)
  ├── ⚙️ Settings (13 properties)
  │   ├── 🔐 Authentication (1)
  │   │   └── ☑️ Basic client credentials: true
  │   ├── 🛡️ Authorization (4)
  │   │   ├── ☑️ Owner-only authorization: false
  │   │   ├── ☑️ Authenticated read access: true
  │   │   └── ...
  │   ├── 🔄 Compatibility (3)
  │   ├── 🖥️ Web Console (2)
  │   └── 🏷️ Semantic Versioning (3)
  ├── 📋 Groups
  └── 👥 Roles
```

**Implementation:**
```typescript
// Add Settings container
interface RegistryItem {
    // ... existing properties
    propertyGroup?: PropertyGroup;
    configProperty?: ConfigurationProperty;
}

enum RegistryItemType {
    // ... existing types
    SETTINGS_CONTAINER = 'settings-container',
    PROPERTY_GROUP = 'property-group',
    CONFIG_PROPERTY = 'config-property'
}

// In getChildren()
if (element === undefined) {
    return [
        createSettingsContainer(),  // ⚙️ Settings
        createGroupsContainer(),    // 📋 Groups
        createRolesContainer()      // 👥 Roles
    ];
}

if (element.type === RegistryItemType.SETTINGS_CONTAINER) {
    return getPropertyGroups();
}

if (element.type === RegistryItemType.PROPERTY_GROUP) {
    return element.propertyGroup!.properties.map(createPropertyTreeItem);
}

// Property tree item
function createPropertyTreeItem(property: ConfigurationProperty): RegistryItem {
    return {
        type: RegistryItemType.CONFIG_PROPERTY,
        configProperty: property,
        label: `${property.label}: ${formatValue(property)}`,
        description: property.name,
        tooltip: createPropertyTooltip(property),
        iconPath: getPropertyIcon(property),
        contextValue: 'config-property'
    };
}

// Icon based on type
function getPropertyIcon(property: ConfigurationProperty): vscode.ThemeIcon {
    switch (property.type) {
        case PropertyType.BOOLEAN:
            return property.value === 'true'
                ? new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'))
                : new vscode.ThemeIcon('x', new vscode.ThemeColor('testing.iconFailed'));
        case PropertyType.INTEGER:
        case PropertyType.LONG:
            return new vscode.ThemeIcon('symbol-number');
        default:
            return new vscode.ThemeIcon('symbol-string');
    }
}

// Tooltip with full details
function createPropertyTooltip(property: ConfigurationProperty): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${property.label}**\n\n`);
    md.appendMarkdown(`${property.description}\n\n`);
    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`• **Name:** ${property.name}\n`);
    md.appendMarkdown(`• **Type:** ${property.type}\n`);
    md.appendMarkdown(`• **Value:** \`${property.value}\`\n`);
    return md;
}
```

### Phase 5: Command Registration (0.5h)

**File:** `src/extension.ts`

```typescript
// Register settings commands
context.subscriptions.push(
    vscode.commands.registerCommand(
        'apicurioRegistry.viewSettings',
        viewSettingsCommand
    ),
    vscode.commands.registerCommand(
        'apicurioRegistry.editProperty',
        (item: RegistryItem) => editPropertyCommand(item.configProperty!)
    ),
    vscode.commands.registerCommand(
        'apicurioRegistry.resetProperty',
        (item: RegistryItem) => resetPropertyCommand(item.configProperty!)
    ),
    vscode.commands.registerCommand(
        'apicurioRegistry.searchProperties',
        searchPropertiesCommand
    )
);
```

**File:** `package.json`

```json
{
  "contributes": {
    "commands": [
      {
        "command": "apicurioRegistry.viewSettings",
        "title": "View All Settings",
        "category": "Apicurio Registry",
        "icon": "$(gear)"
      },
      {
        "command": "apicurioRegistry.editProperty",
        "title": "Edit Property",
        "category": "Apicurio Registry",
        "icon": "$(edit)"
      },
      {
        "command": "apicurioRegistry.resetProperty",
        "title": "Reset to Default",
        "category": "Apicurio Registry",
        "icon": "$(discard)"
      },
      {
        "command": "apicurioRegistry.searchProperties",
        "title": "Search Settings",
        "category": "Apicurio Registry",
        "icon": "$(search)"
      }
    ],
    "menus": {
      "view/item/context": [
        {
          "command": "apicurioRegistry.viewSettings",
          "when": "view == apicurioRegistryView && viewItem == settings-container",
          "group": "inline"
        },
        {
          "command": "apicurioRegistry.editProperty",
          "when": "view == apicurioRegistryView && viewItem == config-property",
          "group": "1_modify@1"
        },
        {
          "command": "apicurioRegistry.resetProperty",
          "when": "view == apicurioRegistryView && viewItem == config-property",
          "group": "1_modify@2"
        }
      ]
    }
  }
}
```

### Phase 6: Test Coverage (2h)

**File:** `src/services/__tests__/registryService.settings.test.ts`

**Test Cases (15 tests):**
```typescript
describe('RegistryService - Configuration', () => {
    describe('getConfigProperties', () => {
        it('should fetch all configuration properties', async () => {});
        it('should handle empty properties list', async () => {});
        it('should handle 403 Forbidden', async () => {});
        it('should handle network errors', async () => {});
    });

    describe('getConfigProperty', () => {
        it('should fetch single property', async () => {});
        it('should handle 404 Not Found', async () => {});
        it('should handle invalid property name', async () => {});
    });

    describe('updateConfigProperty', () => {
        it('should update boolean property', async () => {});
        it('should update integer property', async () => {});
        it('should update string property', async () => {});
        it('should handle 400 Bad Request (invalid value)', async () => {});
        it('should handle 403 Forbidden', async () => {});
    });

    describe('deleteConfigProperty', () => {
        it('should delete property (reset to default)', async () => {});
        it('should handle 404 Not Found', async () => {});
        it('should handle 403 Forbidden', async () => {});
    });
});
```

**File:** `src/commands/__tests__/settingsCommands.test.ts`

**Test Cases (20 tests):**
```typescript
describe('Settings Commands', () => {
    describe('viewSettingsCommand', () => {
        it('should display all property groups', async () => {});
        it('should group properties correctly', async () => {});
        it('should show property count per group', async () => {});
        it('should handle user cancellation at group selection', async () => {});
        it('should handle user cancellation at property selection', async () => {});
        it('should handle empty properties list', async () => {});
        it('should handle API errors gracefully', async () => {});
    });

    describe('editPropertyCommand', () => {
        it('should edit boolean property (enable)', async () => {});
        it('should edit boolean property (disable)', async () => {});
        it('should edit integer property with validation', async () => {});
        it('should reject invalid integer input', async () => {});
        it('should edit string property', async () => {});
        it('should handle user cancellation', async () => {});
        it('should show success message after update', async () => {});
        it('should handle 400 Bad Request error', async () => {});
        it('should handle 403 Forbidden error', async () => {});
    });

    describe('resetPropertyCommand', () => {
        it('should reset property to default', async () => {});
        it('should show confirmation dialog', async () => {});
        it('should handle user cancellation', async () => {});
        it('should handle 404 Not Found', async () => {});
    });

    describe('searchPropertiesCommand', () => {
        it('should filter properties by name', async () => {});
        it('should filter properties by description', async () => {});
        it('should handle no matches', async () => {});
        it('should handle user cancellation', async () => {});
    });
});
```

---

## Edge Cases & Error Handling

1. **No Properties Found:**
   - Show message: "No configuration properties available"
   - Check if RBAC is enabled, suggest admin role

2. **Invalid Property Value:**
   - Catch 400 Bad Request
   - Show detailed error: "Invalid value for {type}: {value}"
   - Re-prompt for correct input

3. **Insufficient Permissions:**
   - Catch 403 Forbidden
   - Show message: "Settings management requires admin role"
   - Hide settings commands for non-admin users

4. **Network Errors:**
   - Retry once automatically
   - Show retry/cancel dialog
   - Log error for debugging

5. **Property Not Found:**
   - Catch 404 Not Found
   - Show message: "Property no longer exists. Refreshing..."
   - Auto-refresh tree view

---

## Testing Strategy

**TDD Approach:**
1. **RED:** Write failing tests first
2. **GREEN:** Implement minimal code to pass tests
3. **REFACTOR:** Improve code while keeping tests green

**Test Coverage:**
- Service methods: 15 tests
- Command implementations: 20 tests
- Utility functions: 5 tests
- **Total:** 40 tests (target: 80%+ coverage)

**Manual Testing:**
1. Verify all property groups display correctly
2. Test editing each property type (boolean, integer, string)
3. Test property reset (delete)
4. Test search/filter functionality
5. Test error handling (403, 404, 400)
6. Test with RBAC enabled/disabled
7. Verify tree view updates after edits

---

## Files to Create/Modify

**New Files:**
- `src/commands/settingsCommands.ts` (~400 lines)
- `src/commands/__tests__/settingsCommands.test.ts` (~500 lines)
- `src/services/__tests__/registryService.settings.test.ts` (~350 lines)

**Modified Files:**
- `src/models/registryModels.ts` (+50 lines)
- `src/services/registryService.ts` (+150 lines)
- `src/providers/registryTreeProvider.ts` (+150 lines)
- `src/extension.ts` (+25 lines)
- `package.json` (+60 lines)

**Total Estimated Lines:** ~1,685 lines

---

## Success Metrics

**Functional:**
- ✅ All 4 commands working (view, edit, reset, search)
- ✅ Type-specific property editing (boolean, integer, string)
- ✅ Property grouping matches Web UI
- ✅ Tree view displays property groups and values
- ✅ All error cases handled gracefully

**Quality:**
- ✅ 40+ tests passing (80%+ coverage)
- ✅ TypeScript compiles with 0 errors
- ✅ No linting warnings in new code
- ✅ All edge cases tested

**UX:**
- ✅ Intuitive property editing workflow
- ✅ Clear property organization by group
- ✅ Type-safe input validation
- ✅ Helpful error messages
- ✅ Confirmation dialogs for destructive actions

---

## References

**API Documentation:**
- Apicurio Registry OpenAPI spec: `/admin/config/properties` endpoints

**Web UI Implementation:**
- `apicurio-registry/ui/ui-app/src/app/pages/settings/SettingsPage.tsx`
- Property grouping logic
- Type-specific input rendering

**Similar Tasks:**
- Task 036: Role Management - Wizard pattern, admin operations
- Task 031: Rules Configuration - Type-specific inputs, QuickPick workflow
- Task 026-030: Metadata Editor - Edit/update patterns

**Documentation:**
- [FEATURE_GAP_ANALYSIS.md](../../FEATURE_GAP_ANALYSIS.md) - Section 1.13
- [TODO.md](../../TODO.md) - Phase 3 progress tracking
- [MASTER_PLAN.md](../../MASTER_PLAN.md) - Strategic roadmap

---

_Created: 2025-12-19_
_Target Completion: TBD_
