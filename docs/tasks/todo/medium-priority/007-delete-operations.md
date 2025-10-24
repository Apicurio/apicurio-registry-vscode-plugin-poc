# Task 007: Delete Operations

**Status:** 📋 Todo
**Priority:** 🟡 Medium
**Effort Estimate:** 3-4 hours
**Target Date:** TBD

---

## Description

Delete operations for groups, artifacts, and versions with confirmation dialogs and safety checks.

## Motivation

Essential CRUD operation. Users need ability to delete groups, artifacts, and versions. Must include proper confirmation to prevent accidental deletion.

## Requirements

- Delete entire groups (with all artifacts)
- Delete artifacts (with all versions)
- Delete specific versions
- Confirmation dialogs with details
- Warning for destructive actions
- Validation (e.g., can't delete last version)
- Refresh tree after deletion

## Implementation Plan

### 1. Create Delete Command File

**File:** `src/commands/deleteCommand.ts`

```typescript
export async function deleteGroupCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider,
    groupNode: RegistryItem
): Promise<void> {
    // Get group details
    const groupId = groupNode.groupId!;
    const artifactCount = groupNode.metadata?.artifactCount || 0;

    // Confirmation dialog
    const message = `Delete group "${groupId}"?\n\nThis will delete ${artifactCount} artifact(s) and all their versions. This action cannot be undone.`;
    const confirm = await vscode.window.showWarningMessage(
        message,
        { modal: true },
        'Delete'
    );

    if (confirm !== 'Delete') {
        return;
    }

    // Delete via API
    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Deleting group ${groupId}...`,
                cancellable: false
            },
            async () => {
                await registryService.deleteGroup(groupId);
            }
        );

        vscode.window.showInformationMessage(`Group "${groupId}" deleted successfully`);
        treeProvider.refresh();
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to delete group: ${error.message}`);
    }
}

export async function deleteArtifactCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider,
    artifactNode: RegistryItem
): Promise<void> {
    const groupId = artifactNode.groupId!;
    const artifactId = artifactNode.artifactId!;

    // Get version count
    let versionCount = 0;
    try {
        const versions = await registryService.getVersions(groupId, artifactId);
        versionCount = versions.length;
    } catch (error) {
        // Continue even if can't get count
    }

    // Confirmation
    const message = `Delete artifact "${artifactId}"?\n\nThis will delete ${versionCount} version(s). This action cannot be undone.`;
    const confirm = await vscode.window.showWarningMessage(
        message,
        { modal: true },
        'Delete'
    );

    if (confirm !== 'Delete') {
        return;
    }

    // Delete
    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Deleting artifact ${artifactId}...`,
                cancellable: false
            },
            async () => {
                await registryService.deleteArtifact(groupId, artifactId);
            }
        );

        vscode.window.showInformationMessage(`Artifact "${artifactId}" deleted successfully`);
        treeProvider.refresh();
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to delete artifact: ${error.message}`);
    }
}

export async function deleteVersionCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider,
    versionNode: RegistryItem
): Promise<void> {
    const groupId = versionNode.groupId!;
    const artifactId = versionNode.artifactId!;
    const version = versionNode.version!;

    // Check if it's the last version
    let isLastVersion = false;
    try {
        const versions = await registryService.getVersions(groupId, artifactId);
        isLastVersion = versions.length === 1;
    } catch (error) {
        // Continue
    }

    if (isLastVersion) {
        const message = `Cannot delete version "${version}".\n\nThis is the last version of the artifact. Delete the entire artifact instead.`;
        vscode.window.showWarningMessage(message);
        return;
    }

    // Confirmation
    const message = `Delete version "${version}" of artifact "${artifactId}"?\n\nThis action cannot be undone.`;
    const confirm = await vscode.window.showWarningMessage(
        message,
        { modal: true },
        'Delete'
    );

    if (confirm !== 'Delete') {
        return;
    }

    // Delete
    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Deleting version ${version}...`,
                cancellable: false
            },
            async () => {
                await registryService.deleteVersion(groupId, artifactId, version);
            }
        );

        vscode.window.showInformationMessage(`Version "${version}" deleted successfully`);
        treeProvider.refresh();
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to delete version: ${error.message}`);
    }
}
```

### 2. Add Service Methods

**File:** `src/services/registryService.ts`

```typescript
async deleteGroup(groupId: string): Promise<void> {
    this.ensureConnected();
    const encoded = encodeURIComponent(groupId);
    await this.client!.delete(`/groups/${encoded}`);
}

async deleteArtifact(groupId: string, artifactId: string): Promise<void> {
    this.ensureConnected();
    const encodedGroup = encodeURIComponent(groupId);
    const encodedArtifact = encodeURIComponent(artifactId);
    await this.client!.delete(`/groups/${encodedGroup}/artifacts/${encodedArtifact}`);
}

async deleteVersion(groupId: string, artifactId: string, version: string): Promise<void> {
    this.ensureConnected();
    const encodedGroup = encodeURIComponent(groupId);
    const encodedArtifact = encodeURIComponent(artifactId);
    const encodedVersion = encodeURIComponent(version);
    await this.client!.delete(
        `/groups/${encodedGroup}/artifacts/${encodedArtifact}/versions/${encodedVersion}`
    );
}
```

### 3. Update package.json

```json
{
  "commands": [
    {
      "command": "apicurioRegistry.deleteGroup",
      "title": "Delete Group",
      "category": "Apicurio Registry"
    },
    {
      "command": "apicurioRegistry.deleteArtifact",
      "title": "Delete Artifact",
      "category": "Apicurio Registry"
    },
    {
      "command": "apicurioRegistry.deleteVersion",
      "title": "Delete Version",
      "category": "Apicurio Registry"
    }
  ],
  "menus": {
    "view/item/context": [
      {
        "command": "apicurioRegistry.deleteGroup",
        "when": "view == apicurioRegistry && viewItem == group",
        "group": "2_dangerous@1"
      },
      {
        "command": "apicurioRegistry.deleteArtifact",
        "when": "view == apicurioRegistry && viewItem == artifact",
        "group": "2_dangerous@1"
      },
      {
        "command": "apicurioRegistry.deleteVersion",
        "when": "view == apicurioRegistry && viewItem == version",
        "group": "2_dangerous@1"
      }
    ]
  }
}
```

### 4. Register Commands

**File:** `src/extension.ts`

```typescript
import { deleteGroupCommand, deleteArtifactCommand, deleteVersionCommand } from './commands/deleteCommand';

context.subscriptions.push(
    vscode.commands.registerCommand('apicurioRegistry.deleteGroup', async (node) => {
        await deleteGroupCommand(registryService, registryTreeProvider, node);
    }),
    vscode.commands.registerCommand('apicurioRegistry.deleteArtifact', async (node) => {
        await deleteArtifactCommand(registryService, registryTreeProvider, node);
    }),
    vscode.commands.registerCommand('apicurioRegistry.deleteVersion', async (node) => {
        await deleteVersionCommand(registryService, registryTreeProvider, node);
    })
);
```

## Safety Checks

1. **Last Version Protection** - Cannot delete last version (must delete artifact)
2. **Modal Confirmation** - Uses modal dialog (blocks other actions)
3. **Detailed Message** - Shows what will be deleted (counts, IDs)
4. **Explicit Button** - "Delete" button (not "Yes/OK")
5. **Progress Indicator** - Shows deletion in progress
6. **Error Handling** - Graceful failure with error message

## Testing Plan

### Unit Tests
- [ ] Test confirmation logic
- [ ] Test last version detection
- [ ] Test API calls with proper encoding

### Integration Tests
- [ ] Test delete group with multiple artifacts
- [ ] Test delete artifact with multiple versions
- [ ] Test delete version (not last)
- [ ] Test preventing deletion of last version
- [ ] Test error handling (404, 403)

### Manual Testing
- [ ] Delete empty group
- [ ] Delete group with artifacts
- [ ] Delete artifact with single version
- [ ] Delete artifact with multiple versions
- [ ] Try to delete last version (should prevent)
- [ ] Test cancellation at confirmation
- [ ] Verify tree refreshes after deletion

## Dependencies

- **Task 003** (Context Menus) - For right-click invocation

## Reference

- **Reference plugin:** `apicurioExplorer.ts` delete logic
- **UX Comparison:** [docs/UX_COMPARISON.md](../../UX_COMPARISON.md) Section 4

## Success Criteria

- [ ] Can delete groups from context menu
- [ ] Can delete artifacts from context menu
- [ ] Can delete versions from context menu
- [ ] Cannot delete last version
- [ ] Confirmation dialogs show details
- [ ] Tree refreshes after deletion
- [ ] Error messages are helpful
- [ ] Progress indicators work

---

_Created: 2025-10-24_
