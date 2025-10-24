# Task 003: Context Menus

**Status:** 📋 Todo
**Priority:** 🔴 High
**Effort Estimate:** 4-6 hours
**Target Date:** TBD

---

## Description

Add right-click context menus to tree items with actions like Open, Delete, Edit State, Copy ID, etc. Provides quick access to common operations without toolbar or command palette.

## Motivation

Context menus are standard UX pattern in VSCode tree views. Users expect right-click actions for common operations. Reference plugin has comprehensive context menus that improve discoverability and efficiency.

## Requirements

### Group Context Menu
- Create Artifact (opens wizard pre-filled with group)
- Delete Group (with confirmation)
- Copy Group ID
- Refresh

### Artifact Context Menu
- Open/Preview
- Create Version (opens wizard)
- Edit Metadata
- Change State
- Delete Artifact (with confirmation)
- Copy Artifact ID
- Copy Full Reference (groupId:artifactId)

### Version Context Menu
- Open/Preview
- Set as Latest
- Change State
- Delete Version (with confirmation)
- Copy Version
- Download Content

## Implementation Plan

### 1. Add Context Values to Tree Items

**File:** `src/providers/registryTreeProvider.ts`

```typescript
// In getTreeItem() method
switch (element.type) {
    case RegistryItemType.Group:
        treeItem.contextValue = 'group';
        break;
    case RegistryItemType.Artifact:
        treeItem.contextValue = 'artifact';
        break;
    case RegistryItemType.Version:
        treeItem.contextValue = 'version';
        break;
}
```

### 2. Define Context Menus in package.json

```json
{
  "menus": {
    "view/item/context": [
      {
        "command": "apicurioRegistry.createArtifact",
        "when": "view == apicurioRegistry && viewItem == group",
        "group": "1_actions@1"
      },
      {
        "command": "apicurioRegistry.deleteGroup",
        "when": "view == apicurioRegistry && viewItem == group",
        "group": "2_dangerous@1"
      },
      {
        "command": "apicurioRegistry.copyGroupId",
        "when": "view == apicurioRegistry && viewItem == group",
        "group": "3_copy@1"
      },
      {
        "command": "apicurioRegistry.openArtifact",
        "when": "view == apicurioRegistry && viewItem == artifact",
        "group": "1_actions@1"
      },
      {
        "command": "apicurioRegistry.addVersion",
        "when": "view == apicurioRegistry && viewItem == artifact",
        "group": "1_actions@2"
      },
      {
        "command": "apicurioRegistry.editMetadata",
        "when": "view == apicurioRegistry && viewItem == artifact",
        "group": "1_actions@3"
      },
      {
        "command": "apicurioRegistry.changeState",
        "when": "view == apicurioRegistry && viewItem == artifact",
        "group": "1_actions@4"
      },
      {
        "command": "apicurioRegistry.deleteArtifact",
        "when": "view == apicurioRegistry && viewItem == artifact",
        "group": "2_dangerous@1"
      },
      {
        "command": "apicurioRegistry.copyArtifactId",
        "when": "view == apicurioRegistry && viewItem == artifact",
        "group": "3_copy@1"
      },
      {
        "command": "apicurioRegistry.copyFullReference",
        "when": "view == apicurioRegistry && viewItem == artifact",
        "group": "3_copy@2"
      },
      {
        "command": "apicurioRegistry.openVersion",
        "when": "view == apicurioRegistry && viewItem == version",
        "group": "1_actions@1"
      },
      {
        "command": "apicurioRegistry.changeVersionState",
        "when": "view == apicurioRegistry && viewItem == version",
        "group": "1_actions@2"
      },
      {
        "command": "apicurioRegistry.deleteVersion",
        "when": "view == apicurioRegistry && viewItem == version",
        "group": "2_dangerous@1"
      },
      {
        "command": "apicurioRegistry.copyVersion",
        "when": "view == apicurioRegistry && viewItem == version",
        "group": "3_copy@1"
      },
      {
        "command": "apicurioRegistry.downloadContent",
        "when": "view == apicurioRegistry && viewItem == version",
        "group": "3_copy@2"
      }
    ]
  }
}
```

### 3. Create Command Files

**New Files to Create:**

**`src/commands/copyCommands.ts`** - Copy operations
```typescript
export async function copyGroupIdCommand(node: RegistryItem): Promise<void>
export async function copyArtifactIdCommand(node: RegistryItem): Promise<void>
export async function copyFullReferenceCommand(node: RegistryItem): Promise<void>
export async function copyVersionCommand(node: RegistryItem): Promise<void>
```

**`src/commands/openCommand.ts`** - Open/preview operations
```typescript
export async function openArtifactCommand(
    registryService: RegistryService,
    node: RegistryItem
): Promise<void>

export async function openVersionCommand(
    registryService: RegistryService,
    node: RegistryItem
): Promise<void>
```

**`src/commands/changeStateCommand.ts`** - State management
```typescript
export async function changeArtifactStateCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider,
    node: RegistryItem
): Promise<void>

export async function changeVersionStateCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider,
    node: RegistryItem
): Promise<void>
```

**`src/commands/downloadCommand.ts`** - Download content
```typescript
export async function downloadContentCommand(
    registryService: RegistryService,
    node: RegistryItem
): Promise<void>
```

**Note:** Delete operations will be implemented in Task 007

### 4. Update Extension Registration

**File:** `src/extension.ts`

```typescript
import { copyGroupIdCommand, copyArtifactIdCommand, copyFullReferenceCommand, copyVersionCommand } from './commands/copyCommands';
import { openArtifactCommand, openVersionCommand } from './commands/openCommand';
import { changeArtifactStateCommand, changeVersionStateCommand } from './commands/changeStateCommand';
import { downloadContentCommand } from './commands/downloadCommand';

// Register copy commands
context.subscriptions.push(
    vscode.commands.registerCommand('apicurioRegistry.copyGroupId', copyGroupIdCommand),
    vscode.commands.registerCommand('apicurioRegistry.copyArtifactId', copyArtifactIdCommand),
    vscode.commands.registerCommand('apicurioRegistry.copyFullReference', copyFullReferenceCommand),
    vscode.commands.registerCommand('apicurioRegistry.copyVersion', copyVersionCommand)
);

// Register open commands
context.subscriptions.push(
    vscode.commands.registerCommand('apicurioRegistry.openArtifact', async (node) => {
        await openArtifactCommand(registryService, node);
    }),
    vscode.commands.registerCommand('apicurioRegistry.openVersion', async (node) => {
        await openVersionCommand(registryService, node);
    })
);

// Register state commands
context.subscriptions.push(
    vscode.commands.registerCommand('apicurioRegistry.changeState', async (node) => {
        await changeArtifactStateCommand(registryService, registryTreeProvider, node);
    }),
    vscode.commands.registerCommand('apicurioRegistry.changeVersionState', async (node) => {
        await changeVersionStateCommand(registryService, registryTreeProvider, node);
    })
);

// Register download command
context.subscriptions.push(
    vscode.commands.registerCommand('apicurioRegistry.downloadContent', async (node) => {
        await downloadContentCommand(registryService, node);
    })
);
```

## Detailed Workflows

### Copy Operations (Simple)
1. User right-clicks on tree item
2. Selects "Copy [Item] ID"
3. ID copied to clipboard
4. Show confirmation message

### Open/Preview Operations
1. User right-clicks artifact/version
2. Selects "Open" or "Preview"
3. Fetch content from API
4. Open in new editor tab
5. Set appropriate language mode (YAML, JSON, etc.)

### Change State Operations
1. User right-clicks artifact/version
2. Selects "Change State"
3. Show QuickPick with available states:
   - ENABLED
   - DISABLED
   - DEPRECATED
4. User selects new state
5. Update via API
6. Refresh tree

### Download Content
1. User right-clicks version
2. Selects "Download Content"
3. Show save file dialog
4. Fetch content from API
5. Save to selected location
6. Show success message

## API Endpoints Needed

```typescript
// Get artifact content (latest version)
GET /groups/{groupId}/artifacts/{artifactId}

// Get version content
GET /groups/{groupId}/artifacts/{artifactId}/versions/{version}

// Update artifact state
PUT /groups/{groupId}/artifacts/{artifactId}/state

// Update version state
PUT /groups/{groupId}/artifacts/{artifactId}/versions/{version}/state
```

## Testing Plan

### Unit Tests
- [ ] Test context value assignment
- [ ] Test copy operations (mock clipboard)
- [ ] Test state change logic
- [ ] Test download path selection

### Integration Tests
- [ ] Test menu visibility based on context
- [ ] Test open operations with real content
- [ ] Test state updates via API
- [ ] Test download with various file types

### Manual Testing
- [ ] Verify menus appear on right-click
- [ ] Test all menu items for each node type
- [ ] Verify keyboard navigation
- [ ] Test menu grouping and separators
- [ ] Verify icons in context menus

## Dependencies

- **Task 004** (Add Version) - For "Create Version" menu item
- **Task 007** (Delete Operations) - For delete menu items

Can implement copy, open, state change, and download operations independently.

## Reference

- **Reference plugin:** `package.json` menus section and command implementations
- **UX Comparison:** [docs/UX_COMPARISON.md](../../UX_COMPARISON.md) Section 4

## Success Criteria

- [ ] All three node types (group, artifact, version) have context menus
- [ ] Copy operations work and show confirmation
- [ ] Open operations display content in editor
- [ ] State change operations update successfully
- [ ] Download saves files to chosen location
- [ ] Menus are properly grouped and separated
- [ ] Commands are properly documented

---

_Created: 2025-10-24_
