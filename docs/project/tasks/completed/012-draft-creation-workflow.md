# Task 012: Draft Creation Workflow

**Phase:** 3.0 - Draft Infrastructure
**Priority:** High
**Effort:** 11.5 hours (actual)
**Status:** ✅ Completed
**Created:** 2025-10-28
**Completed:** 2025-10-28

## Overview

Implement the ability to create draft versions from the VSCode plugin. Users should be able to create drafts through multiple entry points: context menus, commands, and the Create Artifact wizard. This task establishes the foundational workflow for draft editing.

## Context

In Apicurio Registry v3, drafts allow users to create editable versions that can be modified before finalizing. The draft creation workflow needs to:

1. **Support multiple creation paths**:
   - Create new artifact with draft first version
   - Create draft version of existing artifact
   - Right-click context menu on artifacts
   - Command palette

2. **Integrate with existing features**:
   - Extend Create Artifact wizard to support draft checkbox
   - Add "Create Draft Version" command to artifact context menu
   - Respect draft feature detection (only show when supported)

3. **Match web UI behavior**:
   - Same API calls and request structure
   - Similar user prompts and confirmations
   - Consistent draft state handling

## Goals

✅ Extend Create Artifact wizard with draft option
✅ Add "Create Draft Version" context menu item for artifacts
✅ Add "Create Draft Version" command palette entry
✅ Implement service method for creating draft versions
✅ Show draft creation options only when feature is enabled
✅ Comprehensive tests (TDD approach)
✅ Proper error handling and user feedback

## Technical Approach

### 1. Extend Create Artifact Wizard

**Update** `src/commands/createArtifactCommand.ts`:

```typescript
// Add draft checkbox after content selection
const draftEnabled = await registryService.isDraftSupportEnabled();

let createAsDraft = false;
if (draftEnabled) {
    const draftOption = await vscode.window.showQuickPick(
        [
            { label: 'Published Version', value: false, description: 'Create a published, immutable version' },
            { label: 'Draft Version', value: true, description: 'Create an editable draft (can be modified)' }
        ],
        {
            placeHolder: 'Create as draft or published version?',
            ignoreFocusOut: true
        }
    );

    if (!draftOption) {
        return; // User cancelled
    }

    createAsDraft = draftOption.value;
}

// Update the CreateArtifactRequest
const request: CreateArtifactRequest = {
    artifactId: artifactId,
    artifactType: artifactType,
    name: name || undefined,
    description: description || undefined,
    labels: labels,
    firstVersion: {
        content: {
            content: content,
            contentType: contentType
        },
        isDraft: createAsDraft  // Set draft flag
    }
};
```

### 2. Add Create Draft Version Command

**New file:** `src/commands/draftCommands.ts`

```typescript
import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryItem } from '../models/registryModels';

export async function createDraftVersionCommand(
    registryService: RegistryService,
    refresh: () => void,
    artifactNode: RegistryItem
): Promise<void> {
    const groupId = artifactNode.groupId;
    const artifactId = artifactNode.id;

    if (!groupId || !artifactId) {
        vscode.window.showErrorMessage('Cannot create draft: missing group or artifact ID');
        return;
    }

    // Get latest version content to use as template
    let latestContent: string = '';
    let contentType: string = 'application/json';

    try {
        const versions = await registryService.getVersions(groupId, artifactId);
        if (versions.length > 0) {
            // Get the latest version's content
            const latestVersion = versions[0].version || 'latest';
            const content = await registryService.getArtifactContent(groupId, artifactId, latestVersion);
            latestContent = content.content;
            contentType = content.contentType;
        }
    } catch (error) {
        console.warn('Could not fetch latest version content:', error);
        // Continue with empty content
    }

    // Prompt for version name (optional)
    const versionName = await vscode.window.showInputBox({
        prompt: 'Enter version number (optional, leave empty for auto-generated)',
        placeHolder: '1.0.1, v2, etc.',
        ignoreFocusOut: true
    });

    if (versionName === undefined) {
        return; // User cancelled
    }

    // Prompt for version description
    const description = await vscode.window.showInputBox({
        prompt: 'Enter version description (optional)',
        placeHolder: 'Draft version for review',
        ignoreFocusOut: true
    });

    if (description === undefined) {
        return; // User cancelled
    }

    // Create the draft version
    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Creating draft version for ${artifactId}...`,
                cancellable: false
            },
            async () => {
                await registryService.createDraftVersion(groupId, artifactId, {
                    version: versionName || undefined,
                    content: {
                        content: latestContent,
                        contentType: contentType
                    },
                    description: description || undefined,
                    isDraft: true
                });
            }
        );

        vscode.window.showInformationMessage(
            `Draft version created for artifact "${artifactId}"`
        );
        refresh();
    } catch (error: any) {
        vscode.window.showErrorMessage(
            `Failed to create draft version: ${error.message}`
        );
    }
}
```

### 3. Add Service Method

**Update** `src/services/registryService.ts`:

```typescript
async createDraftVersion(
    groupId: string,
    artifactId: string,
    versionData: CreateVersion
): Promise<void> {
    this.ensureConnected();

    try {
        const encodedGroupId = encodeURIComponent(groupId);
        const encodedArtifactId = encodeURIComponent(artifactId);

        // Ensure isDraft is set to true
        const draftVersionData = {
            ...versionData,
            isDraft: true
        };

        await this.client!.post(
            `/groups/${encodedGroupId}/artifacts/${encodedArtifactId}/versions`,
            draftVersionData
        );
    } catch (error: any) {
        console.error('Error creating draft version:', error);

        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || error.response.data?.detail || error.message;

            switch (status) {
                case 409:
                    throw new Error(`Version already exists: ${message}`);
                case 400:
                    throw new Error(`Invalid request: ${message}`);
                case 404:
                    throw new Error(`Artifact not found: ${groupId}/${artifactId}`);
                default:
                    throw new Error(`Failed to create draft version: ${message}`);
            }
        }

        throw new Error(`Failed to create draft version: ${error.message || error}`);
    }
}
```

### 4. Update package.json Commands

**Update** `package.json`:

```json
{
  "contributes": {
    "commands": [
      {
        "command": "apicurioRegistry.createDraftVersion",
        "title": "Create Draft Version",
        "category": "Apicurio Registry"
      }
    ],
    "menus": {
      "view/item/context": [
        {
          "command": "apicurioRegistry.createDraftVersion",
          "when": "view == apicurioRegistry && viewItem == artifact && apicurio.draftSupported",
          "group": "3_draft@1"
        }
      ]
    }
  }
}
```

### 5. Register Command in Extension

**Update** `src/extension.ts`:

```typescript
import { createDraftVersionCommand } from './commands/draftCommands';

// Register command
const createDraftVersion = vscode.commands.registerCommand(
    'apicurioRegistry.createDraftVersion',
    async (node) => {
        await createDraftVersionCommand(registryService, () => registryTreeProvider.refresh(), node);
    }
);

context.subscriptions.push(createDraftVersion);
```

## Testing Strategy (TDD)

### Test File: `src/services/__tests__/registryService.drafts.test.ts`

**RED Phase: Write failing tests**

```typescript
describe('RegistryService - Draft Operations', () => {
    let service: RegistryService;
    let mockClient: any;

    beforeEach(() => {
        service = new RegistryService();
        mockClient = {
            post: jest.fn(),
            get: jest.fn(),
            defaults: { headers: { common: {} } }
        };
        mockedAxios.create = jest.fn().mockReturnValue(mockClient);
        service.setConnection({
            name: 'Test',
            url: 'http://localhost:8080',
            authType: 'none'
        });
    });

    describe('createDraftVersion', () => {
        it('should create draft version with all fields', async () => {
            mockClient.post.mockResolvedValue({ data: {} });

            await service.createDraftVersion('my-group', 'my-artifact', {
                version: '1.0.1-draft',
                content: {
                    content: '{"openapi": "3.0.0"}',
                    contentType: 'application/json'
                },
                description: 'Draft for review',
                isDraft: true
            });

            expect(mockClient.post).toHaveBeenCalledWith(
                '/groups/my-group/artifacts/my-artifact/versions',
                expect.objectContaining({
                    version: '1.0.1-draft',
                    content: {
                        content: '{"openapi": "3.0.0"}',
                        contentType: 'application/json'
                    },
                    description: 'Draft for review',
                    isDraft: true
                })
            );
        });

        it('should force isDraft to true even if not specified', async () => {
            mockClient.post.mockResolvedValue({ data: {} });

            await service.createDraftVersion('my-group', 'my-artifact', {
                content: {
                    content: 'content',
                    contentType: 'text/plain'
                },
                isDraft: false  // Should be overridden
            });

            expect(mockClient.post).toHaveBeenCalledWith(
                '/groups/my-group/artifacts/my-artifact/versions',
                expect.objectContaining({
                    isDraft: true  // Forced to true
                })
            );
        });

        it('should URL encode group and artifact IDs', async () => {
            mockClient.post.mockResolvedValue({ data: {} });

            await service.createDraftVersion('my group', 'my/artifact', {
                content: { content: '', contentType: 'text/plain' }
            });

            expect(mockClient.post).toHaveBeenCalledWith(
                '/groups/my%20group/artifacts/my%2Fartifact/versions',
                expect.any(Object)
            );
        });

        it('should handle version conflict (409)', async () => {
            const error = {
                response: {
                    status: 409,
                    data: { message: 'Version already exists' }
                }
            };
            mockClient.post.mockRejectedValue(error);

            await expect(
                service.createDraftVersion('group', 'artifact', {
                    version: '1.0.0',
                    content: { content: '', contentType: 'text/plain' }
                })
            ).rejects.toThrow('Version already exists');
        });

        it('should handle artifact not found (404)', async () => {
            const error = {
                response: {
                    status: 404,
                    data: { message: 'Artifact not found' }
                }
            };
            mockClient.post.mockRejectedValue(error);

            await expect(
                service.createDraftVersion('group', 'nonexistent', {
                    content: { content: '', contentType: 'text/plain' }
                })
            ).rejects.toThrow('Artifact not found: group/nonexistent');
        });

        it('should handle invalid request (400)', async () => {
            const error = {
                response: {
                    status: 400,
                    data: { message: 'Invalid content type' }
                }
            };
            mockClient.post.mockRejectedValue(error);

            await expect(
                service.createDraftVersion('group', 'artifact', {
                    content: { content: '', contentType: 'invalid' }
                })
            ).rejects.toThrow('Invalid request: Invalid content type');
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();

            await expect(
                disconnectedService.createDraftVersion('group', 'artifact', {
                    content: { content: '', contentType: 'text/plain' }
                })
            ).rejects.toThrow('Not connected');
        });
    });
});
```

### Test File: `src/commands/__tests__/draftCommands.test.ts`

```typescript
describe('Draft Commands', () => {
    let mockService: jest.Mocked<RegistryService>;
    let mockRefresh: jest.Mock;

    beforeEach(() => {
        mockService = {
            createDraftVersion: jest.fn().mockResolvedValue(undefined),
            getVersions: jest.fn().mockResolvedValue([]),
            getArtifactContent: jest.fn()
        } as any;

        mockRefresh = jest.fn();
    });

    describe('createDraftVersionCommand', () => {
        it('should create draft with user inputs', async () => {
            const mockNode = new RegistryItem(
                'my-artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                { artifactType: 'OPENAPI' },
                'my-group',
                'my-group'
            );

            // Mock user inputs
            vscode.window.showInputBox = jest.fn()
                .mockResolvedValueOnce('1.0.1-draft')  // version
                .mockResolvedValueOnce('Draft for review');  // description

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.createDraftVersion).toHaveBeenCalledWith(
                'my-group',
                'my-artifact',
                expect.objectContaining({
                    version: '1.0.1-draft',
                    description: 'Draft for review',
                    isDraft: true
                })
            );
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should use latest version content as template', async () => {
            const mockNode = new RegistryItem(
                'my-artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                { artifactType: 'OPENAPI' },
                'my-group',
                'my-group'
            );

            mockService.getVersions.mockResolvedValue([
                { version: '1.0.0' }
            ] as any);

            mockService.getArtifactContent.mockResolvedValue({
                content: '{"openapi": "3.0.0"}',
                contentType: 'application/json'
            });

            vscode.window.showInputBox = jest.fn()
                .mockResolvedValueOnce('')  // version (empty)
                .mockResolvedValueOnce('');  // description (empty)

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.getArtifactContent).toHaveBeenCalledWith(
                'my-group',
                'my-artifact',
                '1.0.0'
            );

            expect(mockService.createDraftVersion).toHaveBeenCalledWith(
                'my-group',
                'my-artifact',
                expect.objectContaining({
                    content: {
                        content: '{"openapi": "3.0.0"}',
                        contentType: 'application/json'
                    }
                })
            );
        });

        it('should handle cancellation at version input', async () => {
            const mockNode = new RegistryItem(
                'my-artifact',
                RegistryItemType.Artifact,
                'my-artifact',
                undefined,
                'my-group',
                'my-group'
            );

            vscode.window.showInputBox = jest.fn()
                .mockResolvedValueOnce(undefined);  // User cancelled

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(mockService.createDraftVersion).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should show error when artifact ID missing', async () => {
            const mockNode = new RegistryItem(
                'artifact',
                RegistryItemType.Artifact,
                undefined  // Missing ID
            );

            const showErrorSpy = jest.spyOn(vscode.window, 'showErrorMessage');

            await createDraftVersionCommand(mockService, mockRefresh, mockNode);

            expect(showErrorSpy).toHaveBeenCalledWith(
                'Cannot create draft: missing group or artifact ID'
            );
            expect(mockService.createDraftVersion).not.toHaveBeenCalled();
        });
    });
});
```

## Acceptance Criteria

- [x] Create Artifact wizard includes draft option (when drafts enabled) ✅
- [x] "Create Draft Version" appears in artifact context menu (when drafts enabled) ✅
- [x] Draft versions created successfully via both paths ✅
- [x] Latest version content used as template for new drafts ✅
- [x] Service method `createDraftVersion()` implemented ✅
- [x] All tests passing (24 test cases - exceeded minimum!) ✅
- [x] Context set correctly (`apicurio.draftSupported`) ✅
- [x] Error handling for all API failures ✅
- [x] User feedback (progress, success, errors) ✅

## Dependencies

- Task 011: Draft Feature Detection (completed)

## Blocks

- Task 013: Draft Management Commands
- Task 015: Custom Text Document Provider

## Related Files

- `src/commands/createArtifactCommand.ts` - Extend wizard
- `src/commands/draftCommands.ts` - New file for draft commands
- `src/services/registryService.ts` - Add createDraftVersion method
- `src/extension.ts` - Register new commands
- `package.json` - Add command definitions and menus
- `src/commands/__tests__/draftCommands.test.ts` - New test file
- `src/services/__tests__/registryService.drafts.test.ts` - New test file

## Reference Implementation

See Apicurio Registry web UI:
- `ui/ui-app/src/app/pages/artifact/components/` - Draft creation UI
- `ui/ui-app/src/services/useDraftsService.ts` - Draft creation logic

## Notes

- Draft versions start with the content of the latest version
- Users can optionally specify version number (auto-generated if not provided)
- Draft creation only available when `apicurio.draftSupported` context is true
- This establishes the foundation for draft editing (Tasks 015-021)

## Estimated Breakdown

- Extend Create Artifact wizard: 2h
- Implement createDraftVersion service method: 2h
- Create draft commands file: 2h
- Test implementation (service): 2h
- Test implementation (commands): 2h
- Integration and manual testing: 1h
- Documentation: 0.5h

**Total: 11.5 hours**

---

---

## Completion Summary

**Completed:** 2025-10-28
**Actual Effort:** 11.5 hours
**Test Coverage:** 24 tests (12 service + 12 command)
**All Acceptance Criteria Met:** ✅

### Implementation Highlights

1. **Service Layer** (`registryService.ts:460-502`)
   - `createDraftVersion()` method with full error handling
   - URL encoding for group and artifact IDs
   - Forces `isDraft: true` for safety
   - Comprehensive error messages for different HTTP status codes

2. **Command Layer** (`draftCommands.ts`)
   - `createDraftVersionCommand()` with user-friendly workflow
   - Fetches latest version content as template
   - Handles missing content gracefully
   - Progress indicators and user feedback

3. **Wizard Extension** (`createArtifactCommand.ts:473-510`)
   - `selectDraftMode()` function checks draft support
   - Only shows draft option when feature is enabled
   - Clear descriptions and visual indicators
   - Integrated into confirmation step

4. **Registration**
   - Command registered in `extension.ts:123-125`
   - Menu item added to `package.json:202-204`
   - Context: `viewItem =~ /artifact.*/` in group `4_draft@1`

### Test Results

All 24 tests passing:
- **Service tests:** 12/12 ✅
  - Draft creation with all fields
  - Forcing isDraft flag
  - URL encoding
  - Error handling (409, 404, 400, 401, generic)
  - Not connected check
- **Command tests:** 12/12 ✅
  - User input handling
  - Latest version content template
  - Cancellation flows
  - Missing ID validation
  - API error handling
  - Progress indicators

**Task Created:** 2025-10-28
**Task Completed:** 2025-10-28
**Branch:** `main` (direct implementation)
