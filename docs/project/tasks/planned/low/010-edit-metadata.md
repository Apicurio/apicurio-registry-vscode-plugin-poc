# Task 010: Edit Metadata UI

**Status:** ⏸️ Deferred
**Priority:** 🟢 Low
**Effort Estimate:** 4-5 hours
**Target Date:** Phase 3

---

## Description

Dedicated UI for editing artifact metadata (name, description, labels) after creation.

## Motivation

Users may need to update artifact metadata after creation. Reference plugin has dedicated metadata editing UI.

## Rationale for Deferral

1. **Lower priority than CRUD** - Create/delete operations more important
2. **Metadata set during creation** - Users can set metadata when creating artifact
3. **Infrequent operation** - Most users don't frequently edit metadata
4. **Better with webview** - Should be implemented with webview in Phase 3 for better UX
5. **Workaround available** - Can delete and recreate artifact if metadata needs changing

## Future Implementation (Phase 3)

### Approach: Multi-Step Wizard (Simpler)

```typescript
export async function editMetadataCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider,
    artifactNode: RegistryItem
): Promise<void> {
    const groupId = artifactNode.groupId!;
    const artifactId = artifactNode.artifactId!;

    // Get current metadata
    const metadata = await registryService.getArtifactMetadata(groupId, artifactId);

    // Step 1: Edit name
    const name = await vscode.window.showInputBox({
        title: 'Edit Artifact Name',
        value: metadata.name || '',
        prompt: 'Leave empty to remove name'
    });

    // Step 2: Edit description
    const description = await vscode.window.showInputBox({
        title: 'Edit Artifact Description',
        value: metadata.description || '',
        prompt: 'Leave empty to remove description'
    });

    // Step 3: Edit labels (reuse label manager from create artifact)
    const labels = await editLabels(metadata.labels || {});

    // Update via API
    await registryService.updateArtifactMetadata(groupId, artifactId, {
        name,
        description,
        labels
    });

    treeProvider.refresh();
}
```

### Approach: Webview Form (Better UX)

```html
<!-- HTML form with all fields -->
<form>
    <input type="text" name="name" value="{{name}}" />
    <textarea name="description">{{description}}</textarea>
    <div id="labels">
        <!-- Dynamic label key-value inputs -->
    </div>
    <button type="submit">Save</button>
</form>
```

**Recommendation:** Implement webview form in Phase 3 when adding visual editors.

## API Endpoint

**PUT** `/groups/{groupId}/artifacts/{artifactId}`

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "labels": {
    "env": "production",
    "team": "backend"
  }
}
```

## Context Menu Integration

```json
{
  "command": "apicurioRegistry.editMetadata",
  "when": "view == apicurioRegistry && viewItem == artifact",
  "group": "1_actions@3"
}
```

## Dependencies

- **Task 003** (Context Menus) - For right-click invocation
- **Phase 3** - For webview implementation

## Reference

- **Reference plugin:** `apicurioMetasExplorer.editMetas` command
- **UX Comparison:** [docs/UX_COMPARISON.md](../../UX_COMPARISON.md) Section 4

## Success Criteria (When Implemented)

- [ ] Can edit artifact name
- [ ] Can edit artifact description
- [ ] Can edit labels (add, remove, modify)
- [ ] Changes persist via API
- [ ] Tree view updates after edit
- [ ] Validation for label keys
- [ ] Option to remove fields (set to null)

---

_Created: 2025-10-24_
_Status: Deferred to Phase 3 (webview implementation)_
