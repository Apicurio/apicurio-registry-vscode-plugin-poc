# Task 004: Add Version Command

**Status:** 📋 Todo
**Priority:** 🟡 Medium
**Effort Estimate:** 4-6 hours
**Target Date:** TBD

---

## Description

Upload new version workflow for existing artifacts. Allows users to add new versions to artifacts without recreating the entire artifact.

## Motivation

Essential CRUD operation for artifact versioning. Users need to update existing artifacts with new versions as their schemas/APIs evolve.

## Requirements

- Upload new version to existing artifact
- Support optional version number (auto-increment if not specified)
- Reuse file selection UX from create artifact
- Support version metadata (name, description, labels)
- Validate version doesn't already exist
- Refresh tree after successful upload

## Workflow

```
1. [Invocation] Right-click artifact → "Add Version" OR command palette
2. [Connection Check] Verify connected to registry
3. [Artifact Selection] If from command palette: select group → artifact
4. [Version Entry] Enter version number (optional, auto-increment suggested)
5. [Name Entry] Enter version name (optional)
6. [Description Entry] Enter version description (optional)
7. [File Search] Enter file search pattern (smart default based on artifact type)
8. [File Selection] Select file from search results (with size display)
9. [Labels] Add labels (optional, multiple key-value pairs)
10. [Confirmation] Show summary and confirm
11. [Creation] Upload version with progress indicator
12. [Refresh] Update tree view to show new version
```

## Implementation Plan

### 1. Create Command File

**File:** `src/commands/addVersionCommand.ts`

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as mime from 'mime-types';
import { RegistryService } from '../services/registryService';
import { RegistryTreeDataProvider } from '../providers/registryTreeProvider';
import { RegistryItem, RegistryItemType } from '../models/registryModels';

export async function addVersionCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider,
    artifactNode?: RegistryItem
): Promise<void> {
    try {
        // Step 1: Ensure connected
        if (!registryService.isConnected()) {
            vscode.window.showErrorMessage('Not connected to registry. Please connect first.');
            return;
        }

        // Step 2: Get artifact (from parameter or selection)
        let groupId: string;
        let artifactId: string;
        let artifactType: string;

        if (artifactNode && artifactNode.type === RegistryItemType.Artifact) {
            // Invoked from context menu
            groupId = artifactNode.groupId!;
            artifactId = artifactNode.artifactId!;
            artifactType = artifactNode.metadata?.type || '';
        } else {
            // Invoked from command palette - need to select
            const artifact = await selectArtifact(registryService);
            if (!artifact) {
                return; // User cancelled
            }
            groupId = artifact.groupId;
            artifactId = artifact.artifactId;
            artifactType = artifact.artifactType;
        }

        // Step 3: Enter version (optional)
        const version = await enterVersion(groupId, artifactId, registryService);
        if (version === undefined) {
            return; // User cancelled
        }

        // Step 4: Enter name (optional)
        const name = await enterName();
        if (name === undefined) {
            return; // User cancelled
        }

        // Step 5: Enter description (optional)
        const description = await enterDescription();
        if (description === undefined) {
            return; // User cancelled
        }

        // Step 6: Select file
        const filePath = await selectFile(artifactType);
        if (!filePath) {
            return; // User cancelled
        }

        // Step 7: Read file content
        const content = await readFileContent(filePath);
        if (!content) {
            return;
        }

        // Step 8: Detect content type
        const contentType = mime.lookup(filePath) || 'application/octet-stream';

        // Step 9: Add labels (optional)
        const labels = await addLabels();
        if (labels === undefined) {
            return; // User cancelled
        }

        // Step 10: Confirm
        const confirmed = await confirmCreation(
            groupId,
            artifactId,
            version,
            name,
            description,
            labels,
            path.basename(filePath)
        );
        if (!confirmed) {
            return;
        }

        // Step 11: Create version
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Creating version ${version || '(auto)'} for ${artifactId}...`,
                cancellable: false
            },
            async () => {
                await registryService.createVersion(groupId, artifactId, {
                    version: version || undefined,
                    content: {
                        content: content,
                        contentType: contentType
                    },
                    name: name || undefined,
                    description: description || undefined,
                    labels: labels || undefined
                });
            }
        );

        // Step 12: Success and refresh
        vscode.window.showInformationMessage(
            `Version ${version || '(auto)'} created successfully for ${artifactId}`
        );
        treeProvider.refresh();

    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to create version: ${error.message}`);
    }
}

// Helper functions (similar to createArtifactCommand.ts)
async function selectArtifact(service: RegistryService): Promise<any> { /* ... */ }
async function enterVersion(groupId: string, artifactId: string, service: RegistryService): Promise<string | null | undefined> { /* ... */ }
async function enterName(): Promise<string | null | undefined> { /* ... */ }
async function enterDescription(): Promise<string | null | undefined> { /* ... */ }
async function selectFile(artifactType: string): Promise<string | undefined> { /* ... */ }
async function readFileContent(filePath: string): Promise<string | undefined> { /* ... */ }
async function addLabels(): Promise<{ [key: string]: string } | null | undefined> { /* ... */ }
async function confirmCreation(...): Promise<boolean> { /* ... */ }
```

### 2. Add Service Method

**File:** `src/services/registryService.ts`

```typescript
async createVersion(
    groupId: string,
    artifactId: string,
    data: CreateVersion
): Promise<VersionMetaData> {
    this.ensureConnected();

    try {
        const encodedGroupId = encodeURIComponent(groupId);
        const encodedArtifactId = encodeURIComponent(artifactId);

        const response = await this.client!.post(
            `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions`,
            data
        );

        return response.data;
    } catch (error: any) {
        console.error('Error creating version:', error);

        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || error.response.data?.detail || error.message;

            switch (status) {
                case 409:
                    throw new Error(`Version already exists: ${message}`);
                case 400:
                    throw new Error(`Invalid request: ${message}`);
                case 401:
                    throw new Error('Authentication required');
                case 403:
                    throw new Error('Permission denied');
                case 404:
                    throw new Error(`Artifact not found: ${groupId}:${artifactId}`);
                default:
                    throw new Error(`Failed to create version: ${message}`);
            }
        }

        throw new Error(`Failed to create version: ${error.message || error}`);
    }
}

// Get existing versions to suggest next version
async getVersions(groupId: string, artifactId: string): Promise<VersionMetaData[]> {
    this.ensureConnected();

    try {
        const encodedGroupId = encodeURIComponent(groupId);
        const encodedArtifactId = encodeURIComponent(artifactId);

        const response = await this.client!.get(
            `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions`,
            {
                params: {
                    limit: 100,
                    offset: 0
                }
            }
        );

        return response.data.versions || [];
    } catch (error) {
        console.error('Error fetching versions:', error);
        throw new Error(`Failed to fetch versions: ${error}`);
    }
}
```

### 3. Update package.json

```json
{
  "contributes": {
    "commands": [
      {
        "command": "apicurioRegistry.addVersion",
        "title": "Add Version",
        "category": "Apicurio Registry"
      }
    ],
    "menus": {
      "view/item/context": [
        {
          "command": "apicurioRegistry.addVersion",
          "when": "view == apicurioRegistry && viewItem == artifact",
          "group": "1_actions@2"
        }
      ]
    }
  }
}
```

### 4. Register Command

**File:** `src/extension.ts`

```typescript
import { addVersionCommand } from './commands/addVersionCommand';

const addVersion = vscode.commands.registerCommand(
    'apicurioRegistry.addVersion',
    async (node?: RegistryItem) => {
        await addVersionCommand(registryService, registryTreeProvider, node);
    }
);

context.subscriptions.push(addVersion);
```

## Version Auto-Increment Logic

```typescript
async function enterVersion(
    groupId: string,
    artifactId: string,
    service: RegistryService
): Promise<string | null | undefined> {
    // Get existing versions
    let suggestedVersion = '1.0.0';
    try {
        const versions = await service.getVersions(groupId, artifactId);
        if (versions.length > 0) {
            // Sort versions and suggest next
            const latestVersion = versions[0].version;
            suggestedVersion = incrementVersion(latestVersion);
        }
    } catch (error) {
        // If can't fetch versions, use default suggestion
        console.warn('Could not fetch versions for auto-increment:', error);
    }

    const version = await vscode.window.showInputBox({
        title: 'Step 4/9: Enter Version Number',
        prompt: `Version number (leave empty for auto-increment, suggested: ${suggestedVersion})`,
        placeHolder: suggestedVersion,
        validateInput: (value) => {
            if (!value) {
                return null; // Empty is OK (auto-increment)
            }
            // Validate semver format
            if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(value)) {
                return 'Invalid version format. Use semantic versioning (e.g., 1.0.0)';
            }
            return null;
        }
    });

    return version;
}

function incrementVersion(version: string): string {
    // Simple patch increment (1.0.0 → 1.0.1)
    const parts = version.split('.');
    if (parts.length >= 3) {
        const patch = parseInt(parts[2]) + 1;
        return `${parts[0]}.${parts[1]}.${patch}`;
    }
    return version;
}
```

## API Endpoint

**POST** `/groups/{groupId}/artifacts/{artifactId}/versions`

**Request Body:**
```json
{
  "version": "1.1.0",           // Optional - auto-generated if omitted
  "content": {
    "content": "...",           // File content
    "contentType": "application/json"
  },
  "name": "Version 1.1",        // Optional
  "description": "Bug fixes",   // Optional
  "labels": {                   // Optional
    "release": "stable"
  }
}
```

**Response:**
```json
{
  "version": "1.1.0",
  "groupId": "com.example",
  "artifactId": "UserAPI",
  "name": "Version 1.1",
  "description": "Bug fixes",
  "owner": "admin",
  "createdOn": 1729771234567,
  "artifactType": "OPENAPI",
  "state": "ENABLED",
  "labels": {
    "release": "stable"
  },
  "contentId": "abc123",
  "globalId": "456"
}
```

## Testing Plan

### Unit Tests
- [ ] Test version auto-increment logic
- [ ] Test file selection and content reading
- [ ] Test label management
- [ ] Test validation logic

### Integration Tests
- [ ] Test creating version via API
- [ ] Test duplicate version handling (409)
- [ ] Test with various file types
- [ ] Test version sorting after creation

### Manual Testing
- [ ] Test from context menu
- [ ] Test from command palette
- [ ] Test auto-increment suggestion
- [ ] Test with all artifact types
- [ ] Test error handling (duplicate, invalid)

## Dependencies

- **Task 003** (Context Menus) - For right-click invocation

## Reference

- **Reference plugin:** `apicurioExplorer.ts` lines 234-297
- **UX Comparison:** [docs/UX_COMPARISON.md](../../UX_COMPARISON.md) Section 4

## Success Criteria

- [ ] Can create new version from context menu
- [ ] Can create new version from command palette
- [ ] Version auto-increment suggests next version
- [ ] File selection reuses smart patterns from create artifact
- [ ] Labels can be added to versions
- [ ] Tree refreshes and shows new version
- [ ] Error handling for duplicate versions
- [ ] Progress indicator during upload

---

_Created: 2025-10-24_
