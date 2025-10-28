# Create Artifact - Deep Analysis

**Date:** 2025-10-23
**Feature:** Add Create Artifact Functionality
**Priority:** HIGH (Point 2 in UX Comparison)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Reference Implementation Analysis](#reference-implementation-analysis)
3. [Apicurio Registry V3 API Analysis](#apicurio-registry-v3-api-analysis)
4. [User Experience Flow](#user-experience-flow)
5. [Implementation Requirements](#implementation-requirements)
6. [Technical Specifications](#technical-specifications)
7. [Validation Rules](#validation-rules)
8. [Error Handling](#error-handling)
9. [Testing Strategy](#testing-strategy)
10. [Implementation Plan](#implementation-plan)

---

## Executive Summary

### What is "Create Artifact"?

A wizard-based workflow that guides users through uploading a new API specification or schema to the Apicurio Registry. This is a **critical** feature for the VSCode extension as it enables the primary use case: managing API artifacts from within the IDE.

### Why is this Important?

- **Core Functionality**: Without this, users can only browse/view artifacts, not create them
- **Developer Workflow**: Integrates artifact creation directly into the development process
- **File Integration**: Leverages VSCode's workspace to select and upload local files
- **Proven UX**: Reference plugin shows this is a well-used, mature feature

### Key Statistics from Reference Plugin

- **11-step wizard** with validation at each step
- **10 artifact types** supported (OPENAPI, AVRO, PROTOBUF, JSON, ASYNCAPI, GRAPHQL, KCONNECT, WSDL, XSD, XML)
- **2 group selection modes**: New group or existing group
- **File search integration**: Uses VSCode `workspace.findFiles()` API
- **MIME type detection**: Automatic content-type detection
- **Confirmation step**: Final review before upload

---

## Reference Implementation Analysis

### File Location

`reference/apicurio-registry-vscode-plugin/src/apicurioExplorer.ts`

Lines 131-234: `addArtifact()` method

### Complete Workflow (11 Steps)

#### Step 1: New or Existing Group?

```typescript
const existingGroup = await vscode.window.showQuickPick(
    ['NEW', 'EXISTING'],
    {
        title: 'New or existing group ?',
    }
);
```

**Options:**
- `NEW` - Create a new group
- `EXISTING` - Use an existing group

**User Action:** Select from dropdown

---

#### Step 2a: If NEW Group - Enter Group ID

```typescript
groupId = await vscode.window.showInputBox({
    title: 'Create a new Group ID',
});
```

**Input:** Free text group ID
**Validation:** Required, will be validated in Step 3

---

#### Step 3a: If NEW Group - Confirm Group ID

```typescript
const confirmGroupId = await vscode.window.showInputBox({
    title: 'Confirm new Group ID',
});

if (groupId != confirmGroupId) {
    vscode.window.showErrorMessage('Group ID did not match with confirmation.');
    return Promise.resolve();
}
```

**Purpose:** Prevent typos in critical group ID
**Validation:** Must exactly match Step 2a input

**UX Note:** This double-entry pattern is unusual in modern UIs but provides safety for destructive/important operations

---

#### Step 2b: If EXISTING Group - Select Group from List

```typescript
const groups = this.getGroups(); // API call: GET /groups
groupId = await vscode.window.showQuickPick(groups, {
    title: 'Choose group :',
});
```

**API Call:** `GET /apis/registry/v3/groups`
**Data Source:** Live list from registry
**Display:** Group IDs as dropdown items

---

#### Step 3b: If EXISTING Group - Confirm Selection

```typescript
const confirm = await vscode.window.showQuickPick(
    ['yes', 'no'],
    {
        title: `Do you want to use group : '${groupId}'`,
        canPickMany: false,
    }
);

if (confirm != 'yes') {
    return Promise.resolve(); // Cancel
}
```

**Purpose:** Additional confirmation before proceeding
**Options:** Yes/No

---

#### Step 4: Validation - Group Must Be Defined

```typescript
if (!groupId || groupId == '') {
    vscode.window.showErrorMessage('No group defined.');
    return Promise.resolve();
}
```

**Validation:** Non-empty group ID
**Error Handling:** Show error and abort

---

#### Step 5: Select Artifact Type

```typescript
const artifactType = await vscode.window.showQuickPick(
    [
        'AVRO',
        'PROTOBUF',
        'JSON',
        'OPENAPI',
        'ASYNCAPI',
        'GRAPHQL',
        'KCONNECT',
        'WSDL',
        'XSD',
        'XML',
    ],
    {
        title: 'Choose an artifact type to push :',
    }
);
```

**Options:** 10 artifact types
**Display:** Uppercase names
**User Action:** Select from dropdown

**Validation:**
```typescript
if (!artifactType) {
    vscode.window.showErrorMessage('No defined type.');
    return Promise.resolve();
}
```

---

#### Step 6: Enter Artifact ID

```typescript
const artifactId = await vscode.window.showInputBox({
    title: 'Artifact ID',
});

if (!artifactId) {
    vscode.window.showErrorMessage('No defined artifact ID.');
    return Promise.resolve();
}
```

**Input:** Free text artifact ID
**Validation:** Required (non-empty)
**Example:** `user-api`, `customer-schema`

**API V3 Note:** If not provided, registry can auto-generate. Reference plugin requires it.

---

#### Step 7: Enter Initial Version

```typescript
const version = await vscode.window.showInputBox({
    title: 'Initial version',
    placeHolder: '1.0.0',
});

if (!version) {
    vscode.window.showErrorMessage('No defined version.');
    return Promise.resolve();
}
```

**Input:** Free text version
**Placeholder:** `1.0.0` (semantic versioning suggestion)
**Validation:** Required
**Examples:** `1.0.0`, `v1`, `1.0.0-SNAPSHOT`

---

#### Step 8: Search for File - Enter Glob Pattern

```typescript
const searchQuery = await vscode.window.showInputBox({
    title: 'Search for file :',
    placeHolder: '**/*.json',
});
```

**Input:** Glob pattern for file search
**Placeholder:** `**/*.json`
**Purpose:** Filter workspace files
**Examples:**
- `**/*.json` - All JSON files
- `**/*.yaml` - All YAML files
- `specs/**/*.openapi.yaml` - OpenAPI files in specs folder

---

#### Step 9: Select File from Search Results

```typescript
const finds: any = await vscode.workspace.findFiles(searchQuery);
const elements: string[] = [];
for (const i in finds) {
    if (finds[i].scheme == 'file') {
        elements.push(finds[i].path);
    }
}

const currentFile = await vscode.window.showQuickPick(elements, {
    title: 'Select file :',
});

if (currentFile == undefined) {
    vscode.window.showErrorMessage('No selected files.');
    return Promise.resolve();
}
```

**Process:**
1. Execute glob search via `vscode.workspace.findFiles()`
2. Filter to `file://` scheme only (exclude remote files)
3. Extract file paths
4. Display as QuickPick dropdown
5. User selects one file

**Validation:** At least one file must be selected

---

#### Step 10: Read File Content

```typescript
const fileBody = await vscode.workspace.fs.readFile(vscode.Uri.file(currentFile));

if (fileBody == undefined) {
    vscode.window.showErrorMessage(`Unable to load the file '${currentFile}'.`);
    return Promise.resolve();
}

const body = fileBody.toString();
```

**Process:**
1. Read file using VSCode filesystem API
2. Convert bytes to string
3. Validate file was read successfully

**Error Handling:** Show error if file cannot be read

---

#### Step 11: Final Confirmation

```typescript
const confirm = await vscode.window.showQuickPick(
    ['yes', 'no'],
    {
        title: `Create ${artifactType} artifact with identifiers '${groupId}:${artifactId}:${version}' ?`,
        canPickMany: false,
    }
);

if (confirm != 'yes') {
    return Promise.resolve(); // Cancel
}
```

**Display:** Summary of what will be created
**Format:** `{type} artifact with identifiers '{group}:{artifactId}:{version}'`
**Example:** `OPENAPI artifact with identifiers 'apis/user-api:1.0.0'`
**Options:** Yes/No

---

### API Request Construction (Reference Plugin)

```typescript
const path = _.tools.getQueryPath(
    { id: null, group: groupId },
    'group',
    {
        ifExists: 'FAIL'
    }
);
// Result: /groups/{groupId}/artifacts?ifExists=FAIL

const mimeType = mime.lookup(currentFile);
const headers = {
    'X-Registry-Version': version,
    'X-Registry-ArtifactId': artifactId,
    'X-Registry-ArtifactType': artifactType,
    'Content-Type': mimeType,
};

await _.tools.query(path, 'POST', body, headers);
```

**HTTP Method:** `POST`
**Endpoint:** `/groups/{groupId}/artifacts?ifExists=FAIL`
**Headers:**
- `X-Registry-Version` - Initial version number
- `X-Registry-ArtifactId` - Artifact identifier
- `X-Registry-ArtifactType` - Type (OPENAPI, AVRO, etc.)
- `Content-Type` - MIME type (auto-detected from file extension)

**Body:** File content as-is (string)

**Query Parameters:**
- `ifExists=FAIL` - Fail if artifact already exists

---

## Apicurio Registry V3 API Analysis

### Endpoint

```
POST /groups/{groupId}/artifacts
```

### Request Headers (Reference Plugin V2 Style)

The reference plugin uses **V2 API style** with headers:

```http
POST /groups/my-apis/artifacts?ifExists=FAIL
X-Registry-Version: 1.0.0
X-Registry-ArtifactId: user-api
X-Registry-ArtifactType: OPENAPI
Content-Type: application/json

{... artifact content ...}
```

### Request Body (V3 API Style)

The **V3 API** uses a different approach with JSON request body:

```typescript
interface CreateArtifact {
    artifactId?: string;           // Optional (can be auto-generated)
    artifactType?: string;          // Optional (can be auto-detected)
    name?: string;                  // Display name
    description?: string;           // Description
    labels?: { [key: string]: string };  // Key-value labels

    firstVersion?: {
        version?: string;           // Optional (auto-increment if not provided)
        content: {
            content: string;        // The actual artifact content
            contentType: string;    // MIME type
            references?: ArtifactReference[];  // References to other artifacts
        };
        name?: string;              // Version name
        description?: string;       // Version description
        labels?: { [key: string]: string };  // Version labels
        branches?: string[];        // Branch names (default: ["latest"])
        isDraft?: boolean;          // Draft version (skip rules)
    };
}
```

### Query Parameters

```typescript
interface QueryParams {
    ifExists?: 'FAIL' | 'UPDATE' | 'RETURN' | 'RETURN_OR_UPDATE';
    canonical?: boolean;  // Canonicalize content before storing
    dryRun?: boolean;     // Validate but don't persist
}
```

**ifExists Options:**
- `FAIL` (default) - Return 409 if artifact exists
- `UPDATE` - Create new version if artifact exists
- `RETURN` - Return existing artifact metadata
- `RETURN_OR_UPDATE` - Return existing or create new version

### Response

```typescript
interface CreateArtifactResponse {
    artifact: {
        groupId: string;
        artifactId: string;
        artifactType: string;
        owner: string;
        createdOn: number;
        modifiedOn: number;
        modifiedBy: string;
        name?: string;
        description?: string;
        labels?: { [key: string]: string };
    };
    version?: {
        version: string;
        groupId: string;
        artifactId: string;
        name?: string;
        description?: string;
        owner: string;
        createdOn: number;
        artifactType: string;
        state: 'ENABLED' | 'DISABLED' | 'DEPRECATED' | 'DRAFT';
        labels?: { [key: string]: string };
        contentId: string;
        globalId: string;
    };
}
```

### V3 API Implementation (from GroupsResourceImpl.java)

```java
@POST
@Path("/groups/{groupId}/artifacts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public CreateArtifactResponse createArtifact(
    @PathParam("groupId") String groupId,
    @QueryParam("ifExists") IfArtifactExists ifExists,
    @QueryParam("canonical") Boolean canonical,
    @QueryParam("dryRun") Boolean dryRun,
    CreateArtifact data
) {
    // ... implementation ...
}
```

**Key Features:**
1. **Auto-generation**: Artifact ID can be auto-generated if not provided
2. **Auto-detection**: Artifact type can be auto-detected from content
3. **Validation**: Validates group ID and artifact ID format
4. **Rules**: Applies configured rules unless `isDraft=true`
5. **References**: Supports artifact references (for schemas that reference other schemas)
6. **Branches**: Supports version branches (default: "latest")
7. **Owner**: Automatically sets owner from security principal

---

## User Experience Flow

### Comparison: Reference vs Proposed

| Step | Reference Plugin | Proposed (V3 API) | Notes |
|------|------------------|-------------------|-------|
| **1** | New or Existing Group? | ✅ Keep | Good UX pattern |
| **2a** | Enter Group ID | ✅ Keep | Required for new groups |
| **3a** | Confirm Group ID | ⚠️ **Optional** | Consider making optional |
| **2b** | Select Existing Group | ✅ Keep | Essential |
| **3b** | Confirm Group Selection | ⚠️ **Remove** | Unnecessary friction |
| **4** | (Validation) | ✅ Keep | Automatic |
| **5** | Select Artifact Type | ✅ Keep + **Enhance** | Add descriptions + icons |
| **6** | Enter Artifact ID | ✅ Keep + **Enhance** | Make optional, show auto-gen option |
| **7** | Enter Initial Version | ✅ Keep + **Enhance** | Make optional, default to "1.0.0" |
| **8** | Enter File Search Pattern | ✅ Keep + **Enhance** | Smart defaults based on artifact type |
| **9** | Select File | ✅ Keep + **Enhance** | Show file preview |
| **10** | (Read File) | ✅ Keep | Automatic |
| **11** | Final Confirmation | ✅ Keep + **Enhance** | Show complete summary |
| **NEW** | N/A | ➕ **Add Name** | Optional display name |
| **NEW** | N/A | ➕ **Add Description** | Optional description |
| **NEW** | N/A | ➕ **Add Labels** | Optional key-value labels |

---

### Proposed Workflow (12-14 Steps)

#### **Step 1: New or Existing Group?**

```
┌─────────────────────────────────────────────┐
│ Create Artifact - Step 1/12                │
│ Select Group Mode                           │
├─────────────────────────────────────────────┤
│ > 📁 Use existing group                     │
│   ➕ Create new group                        │
└─────────────────────────────────────────────┘
```

**Improvement:** Use icons for visual clarity

---

#### **Step 2a (New Group): Enter Group ID**

```
┌─────────────────────────────────────────────┐
│ Create Artifact - Step 2/12                │
│ Enter Group ID                              │
├─────────────────────────────────────────────┤
│ Group ID: ___________________________       │
│                                             │
│ Examples: com.example, apis, schemas        │
│ Note: Use lowercase, dots/dashes allowed    │
└─────────────────────────────────────────────┘
```

**Improvements:**
- Examples shown
- Validation hints
- **Remove confirmation step** (too much friction)

---

#### **Step 2b (Existing Group): Select Group**

```
┌─────────────────────────────────────────────┐
│ Create Artifact - Step 2/12                │
│ Select Group                                │
├─────────────────────────────────────────────┤
│ > default (5 artifacts)                     │
│   com.example.apis (12 artifacts)           │
│   internal.schemas (3 artifacts)            │
│   test-group (1 artifact)                   │
└─────────────────────────────────────────────┘
```

**Improvements:**
- Show artifact count per group
- **Remove confirmation step** (unnecessary)

---

#### **Step 3: Select Artifact Type**

```
┌─────────────────────────────────────────────┐
│ Create Artifact - Step 3/12                │
│ Select Artifact Type                        │
├─────────────────────────────────────────────┤
│ > 📄 OPENAPI      - OpenAPI/Swagger specs   │
│   📦 AVRO         - Apache Avro schemas     │
│   🔧 PROTOBUF     - Protocol Buffers        │
│   📋 JSON         - JSON Schema             │
│   📡 ASYNCAPI     - AsyncAPI specs          │
│   🔗 GRAPHQL      - GraphQL schemas         │
│   🔌 KCONNECT     - Kafka Connect schemas   │
│   📰 WSDL         - Web Services (SOAP)     │
│   📝 XSD          - XML Schema Definition   │
│   📑 XML          - Generic XML             │
└─────────────────────────────────────────────┘
```

**Improvements:**
- Icons for each type
- Descriptions for clarity
- Sorted by popularity (OPENAPI first)

---

#### **Step 4: Enter Artifact ID (Optional)**

```
┌─────────────────────────────────────────────┐
│ Create Artifact - Step 4/12                │
│ Artifact ID (optional)                      │
├─────────────────────────────────────────────┤
│ Artifact ID: ___________________________    │
│                                             │
│ ✓ Leave empty to auto-generate             │
│ Examples: user-api, customer-schema         │
│ Note: Lowercase, dashes/underscores allowed │
└─────────────────────────────────────────────┘
```

**Improvements:**
- **Make optional** (V3 API supports auto-generation)
- Clear indication that empty = auto-generate
- Validation hints

---

#### **Step 5: Enter Initial Version (Optional)**

```
┌─────────────────────────────────────────────┐
│ Create Artifact - Step 5/12                │
│ Initial Version (optional)                  │
├─────────────────────────────────────────────┤
│ Version: 1.0.0__________________________    │
│                                             │
│ ✓ Default: 1.0.0                            │
│ Examples: 1.0.0, v1, 1.0.0-SNAPSHOT         │
└─────────────────────────────────────────────┘
```

**Improvements:**
- **Pre-filled with "1.0.0"**
- Optional (can use empty = auto-increment)
- Placeholder shows default

---

#### **Step 6: Enter Name (Optional, NEW)**

```
┌─────────────────────────────────────────────┐
│ Create Artifact - Step 6/12                │
│ Display Name (optional)                     │
├─────────────────────────────────────────────┤
│ Name: _________________________________     │
│                                             │
│ Human-readable name for this artifact       │
│ Example: User Management API                │
└─────────────────────────────────────────────┘
```

**New Feature:** Leverage V3 API metadata support

---

#### **Step 7: Enter Description (Optional, NEW)**

```
┌─────────────────────────────────────────────┐
│ Create Artifact - Step 7/12                │
│ Description (optional)                      │
├─────────────────────────────────────────────┤
│ Description: ___________________________    │
│                                             │
│ Brief description of this artifact          │
│ Example: REST API for user management       │
└─────────────────────────────────────────────┘
```

**New Feature:** Better documentation support

---

#### **Step 8: Search for File**

```
┌─────────────────────────────────────────────┐
│ Create Artifact - Step 8/12                │
│ Search for File                             │
├─────────────────────────────────────────────┤
│ Search pattern: **/*.yaml_______________    │
│                                             │
│ 💡 Suggested patterns for OPENAPI:          │
│    **/*.yaml, **/*.yml, **/*.json           │
│    specs/**/*.openapi.yaml                  │
└─────────────────────────────────────────────┘
```

**Improvements:**
- **Smart defaults based on artifact type**
- Suggestions for common patterns
- Pre-filled with intelligent default

---

#### **Step 9: Select File**

```
┌─────────────────────────────────────────────┐
│ Create Artifact - Step 9/12                │
│ Select File                                 │
├─────────────────────────────────────────────┤
│ > 📄 src/api/user-api.yaml (3.2 KB)         │
│   📄 specs/openapi/customer.yaml (5.1 KB)   │
│   📄 docs/api-spec.yaml (1.8 KB)            │
│                                             │
│ Found 3 files matching **/*.yaml            │
└─────────────────────────────────────────────┘
```

**Improvements:**
- **Show file size**
- Icons for file types
- Summary count

---

#### **Step 10: Preview File Content (NEW)**

```
┌─────────────────────────────────────────────┐
│ Create Artifact - Step 10/12               │
│ Preview Content                             │
├─────────────────────────────────────────────┤
│ File: src/api/user-api.yaml                 │
│ Size: 3.2 KB                                │
│ Type: application/x-yaml                    │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ openapi: 3.0.0                          │ │
│ │ info:                                   │ │
│ │   title: User API                       │ │
│ │   version: 1.0.0                        │ │
│ │ ...                                     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ > ✓ Use this file                           │
│   ← Choose different file                   │
└─────────────────────────────────────────────┘
```

**New Feature:** Preview before upload

---

#### **Step 11: Add Labels (Optional, NEW)**

```
┌─────────────────────────────────────────────┐
│ Create Artifact - Step 11/12               │
│ Add Labels (optional)                       │
├─────────────────────────────────────────────┤
│ Add labels to organize artifacts            │
│                                             │
│ > ➕ Add label                               │
│   ⏭ Skip                                     │
│                                             │
│ Current labels:                             │
│ (none)                                      │
└─────────────────────────────────────────────┘
```

**New Feature:** Metadata organization

If user selects "Add label":

```
┌─────────────────────────────────────────────┐
│ Enter label (key=value format)              │
├─────────────────────────────────────────────┤
│ Label: environment=production____________   │
│                                             │
│ Format: key=value                           │
│ Example: team=backend, version=v1           │
└─────────────────────────────────────────────┘
```

Then show updated list with option to add more or continue.

---

#### **Step 12: Final Confirmation**

```
┌─────────────────────────────────────────────┐
│ Create Artifact - Step 12/12               │
│ Confirm Creation                            │
├─────────────────────────────────────────────┤
│ Review artifact details:                    │
│                                             │
│ Group:       com.example                    │
│ Artifact ID: user-api                       │
│ Type:        OPENAPI                        │
│ Version:     1.0.0                          │
│ Name:        User Management API            │
│ File:        src/api/user-api.yaml (3.2 KB) │
│ Labels:      environment=production         │
│                                             │
│ > ✅ Create artifact                         │
│   ❌ Cancel                                  │
└─────────────────────────────────────────────┘
```

**Improvements:**
- **Complete summary** of all inputs
- Visual confirmation
- Clear create/cancel options

---

### Progress Indication During Upload

```
┌─────────────────────────────────────────────┐
│ Creating artifact...                        │
├─────────────────────────────────────────────┤
│ [████████████████░░░░░░░░] 75%              │
│                                             │
│ ✓ Validating content                        │
│ ✓ Applying rules                            │
│ ⟳ Uploading to registry...                  │
│   Creating metadata                         │
└─────────────────────────────────────────────┘
```

---

### Success Notification

```
┌─────────────────────────────────────────────┐
│ ✅ Artifact created successfully             │
├─────────────────────────────────────────────┤
│ com.example/user-api:1.0.0                  │
│                                             │
│ Global ID: 12345                            │
│ Content ID: abc-def-123                     │
│                                             │
│ [View in Tree] [Create Another] [Close]     │
└─────────────────────────────────────────────┘
```

**Actions:**
- **View in Tree** - Expand tree to show new artifact
- **Create Another** - Restart wizard
- **Close** - Dismiss notification

---

## Implementation Requirements

### 1. Service Layer (RegistryService)

#### New Method: `createArtifact()`

```typescript
/**
 * Creates a new artifact in the registry
 * @param groupId - Group identifier
 * @param data - Artifact creation data
 * @returns Created artifact metadata
 */
async createArtifact(
    groupId: string,
    data: CreateArtifactRequest
): Promise<CreateArtifactResponse> {
    this.ensureConnected();

    const response = await this.client!.post(
        `/groups/${groupId}/artifacts`,
        data,
        {
            params: {
                ifExists: data.ifExists || 'FAIL',
                canonical: data.canonical,
                dryRun: data.dryRun
            }
        }
    );

    return response.data;
}
```

#### Supporting Method: `getGroups()`

```typescript
/**
 * Retrieves list of all groups
 * @returns Array of group IDs
 */
async getGroups(): Promise<GroupMetaData[]> {
    this.ensureConnected();

    const response = await this.client!.get('/groups', {
        params: {
            limit: 1000,
            offset: 0
        }
    });

    return response.data.groups || [];
}
```

---

### 2. Models (registryModels.ts)

```typescript
export interface CreateArtifactRequest {
    artifactId?: string;
    artifactType?: string;
    name?: string;
    description?: string;
    labels?: { [key: string]: string };
    firstVersion?: {
        version?: string;
        content: {
            content: string;
            contentType: string;
            references?: ArtifactReference[];
        };
        name?: string;
        description?: string;
        labels?: { [key: string]: string };
        branches?: string[];
        isDraft?: boolean;
    };
    // Query params
    ifExists?: 'FAIL' | 'UPDATE' | 'RETURN' | 'RETURN_OR_UPDATE';
    canonical?: boolean;
    dryRun?: boolean;
}

export interface CreateArtifactResponse {
    artifact: ArtifactMetaData;
    version?: VersionMetaData;
}

export interface GroupMetaData {
    groupId: string;
    description?: string;
    artifactCount?: number;
    labels?: { [key: string]: string };
    owner?: string;
    createdOn?: number;
    modifiedOn?: number;
    modifiedBy?: string;
}

export interface ArtifactReference {
    groupId?: string;
    artifactId: string;
    version?: string;
    name?: string;
}
```

---

### 3. Command Layer (createArtifactCommand.ts)

```typescript
import * as vscode from 'vscode';
import * as mime from 'mime-types';
import { RegistryService } from '../services/registryService';
import { RegistryTreeDataProvider } from '../providers/registryTreeProvider';
import { CreateArtifactRequest } from '../models/registryModels';

export enum ArtifactType {
    OPENAPI = 'OPENAPI',
    AVRO = 'AVRO',
    PROTOBUF = 'PROTOBUF',
    JSON = 'JSON',
    ASYNCAPI = 'ASYNCAPI',
    GRAPHQL = 'GRAPHQL',
    KCONNECT = 'KCONNECT',
    WSDL = 'WSDL',
    XSD = 'XSD',
    XML = 'XML'
}

export enum GroupSelectionMode {
    NEW = 'new',
    EXISTING = 'existing'
}

export async function createArtifactCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    // Step 1: Check connection
    if (!registryService.isConnected()) {
        vscode.window.showErrorMessage(
            'Please connect to a registry first before creating artifacts.'
        );
        return;
    }

    try {
        // Step 2: Select group mode
        const groupMode = await selectGroupMode();
        if (!groupMode) return;

        // Step 3: Get group ID
        let groupId: string | undefined;
        if (groupMode === GroupSelectionMode.NEW) {
            groupId = await createNewGroup(registryService);
        } else {
            groupId = await selectExistingGroup(registryService);
        }
        if (!groupId) return;

        // Step 4: Select artifact type
        const artifactType = await selectArtifactType();
        if (!artifactType) return;

        // Step 5: Enter artifact ID (optional)
        const artifactId = await enterArtifactId();
        if (artifactId === null) return; // User cancelled

        // Step 6: Enter version (optional)
        const version = await enterVersion();
        if (version === null) return;

        // Step 7: Enter name (optional)
        const name = await enterName();
        if (name === null) return;

        // Step 8: Enter description (optional)
        const description = await enterDescription();
        if (description === null) return;

        // Step 9: Search for file
        const filePath = await selectFile(artifactType);
        if (!filePath) return;

        // Step 10: Read file content
        const fileContent = await readFileContent(filePath);
        if (!fileContent) return;

        // Step 11: Add labels (optional)
        const labels = await addLabels();
        if (labels === null) return;

        // Step 12: Final confirmation
        const confirmed = await confirmCreation(
            groupId,
            artifactId || '(auto-generated)',
            artifactType,
            version || '1.0.0',
            name,
            filePath,
            labels
        );
        if (!confirmed) return;

        // Execute creation with progress
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Creating artifact...',
                cancellable: false
            },
            async (progress) => {
                progress.report({ message: 'Validating content' });

                const contentType = mime.lookup(filePath) || 'application/octet-stream';

                const request: CreateArtifactRequest = {
                    artifactId: artifactId || undefined,
                    artifactType,
                    name,
                    description,
                    labels: labels && Object.keys(labels).length > 0 ? labels : undefined,
                    firstVersion: {
                        version: version || undefined,
                        content: {
                            content: fileContent,
                            contentType
                        }
                    },
                    ifExists: 'FAIL'
                };

                progress.report({ message: 'Uploading to registry' });

                const response = await registryService.createArtifact(groupId, request);

                progress.report({ message: 'Artifact created' });

                // Refresh tree
                treeProvider.refresh();

                // Show success message
                const action = await vscode.window.showInformationMessage(
                    `✅ Artifact created: ${response.artifact.groupId}/${response.artifact.artifactId}${response.version ? ':' + response.version.version : ''}`,
                    'View in Tree',
                    'Create Another'
                );

                if (action === 'View in Tree') {
                    // TODO: Expand tree to show new artifact
                } else if (action === 'Create Another') {
                    // Restart wizard
                    await createArtifactCommand(registryService, treeProvider);
                }
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to create artifact: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

// Helper functions...
async function selectGroupMode(): Promise<GroupSelectionMode | undefined> {
    const result = await vscode.window.showQuickPick(
        [
            {
                label: '$(folder) Use existing group',
                value: GroupSelectionMode.EXISTING,
                description: 'Select from existing groups in the registry'
            },
            {
                label: '$(add) Create new group',
                value: GroupSelectionMode.NEW,
                description: 'Create a new group for this artifact'
            }
        ],
        {
            title: 'Create Artifact - Step 1/12: Select Group Mode',
            placeHolder: 'Choose whether to use an existing group or create a new one'
        }
    );

    return result?.value;
}

async function createNewGroup(service: RegistryService): Promise<string | undefined> {
    const groupId = await vscode.window.showInputBox({
        title: 'Create Artifact - Step 2/12: Enter Group ID',
        prompt: 'Enter a unique group identifier',
        placeHolder: 'e.g., com.example, apis, schemas',
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Group ID cannot be empty';
            }
            if (!/^[a-z0-9._-]+$/i.test(value)) {
                return 'Group ID can only contain letters, numbers, dots, dashes, and underscores';
            }
            if (value.length > 512) {
                return 'Group ID is too long (max 512 characters)';
            }
            return null;
        }
    });

    return groupId?.trim();
}

async function selectExistingGroup(service: RegistryService): Promise<string | undefined> {
    const groups = await service.getGroups();

    const items = groups.map(group => ({
        label: group.groupId,
        description: group.description,
        detail: `${group.artifactCount || 0} artifact(s)`
    }));

    const result = await vscode.window.showQuickPick(items, {
        title: 'Create Artifact - Step 2/12: Select Group',
        placeHolder: 'Choose an existing group'
    });

    return result?.label;
}

async function selectArtifactType(): Promise<string | undefined> {
    const types = [
        {
            label: '$(file) OPENAPI',
            value: ArtifactType.OPENAPI,
            description: 'OpenAPI/Swagger API specifications',
            detail: 'REST API documentation format'
        },
        {
            label: '$(package) AVRO',
            value: ArtifactType.AVRO,
            description: 'Apache Avro schemas',
            detail: 'Data serialization format'
        },
        {
            label: '$(tools) PROTOBUF',
            value: ArtifactType.PROTOBUF,
            description: 'Protocol Buffers',
            detail: 'Google\'s data interchange format'
        },
        {
            label: '$(note) JSON',
            value: ArtifactType.JSON,
            description: 'JSON Schema',
            detail: 'JSON data validation'
        },
        {
            label: '$(radio-tower) ASYNCAPI',
            value: ArtifactType.ASYNCAPI,
            description: 'AsyncAPI specifications',
            detail: 'Event-driven API documentation'
        },
        {
            label: '$(link) GRAPHQL',
            value: ArtifactType.GRAPHQL,
            description: 'GraphQL schemas',
            detail: 'GraphQL type definitions'
        },
        {
            label: '$(plug) KCONNECT',
            value: ArtifactType.KCONNECT,
            description: 'Kafka Connect schemas',
            detail: 'Kafka connector configurations'
        },
        {
            label: '$(file-code) WSDL',
            value: ArtifactType.WSDL,
            description: 'Web Services Description Language',
            detail: 'SOAP web services'
        },
        {
            label: '$(file-text) XSD',
            value: ArtifactType.XSD,
            description: 'XML Schema Definition',
            detail: 'XML structure definition'
        },
        {
            label: '$(code) XML',
            value: ArtifactType.XML,
            description: 'Generic XML',
            detail: 'XML documents'
        }
    ];

    const result = await vscode.window.showQuickPick(types, {
        title: 'Create Artifact - Step 3/12: Select Artifact Type',
        placeHolder: 'Choose the type of artifact you want to create'
    });

    return result?.value;
}

async function enterArtifactId(): Promise<string | null | undefined> {
    const result = await vscode.window.showInputBox({
        title: 'Create Artifact - Step 4/12: Artifact ID (optional)',
        prompt: 'Enter artifact identifier (leave empty to auto-generate)',
        placeHolder: 'e.g., user-api, customer-schema',
        validateInput: (value) => {
            if (value && !/^[a-z0-9._-]+$/i.test(value)) {
                return 'Artifact ID can only contain letters, numbers, dots, dashes, and underscores';
            }
            if (value && value.length > 512) {
                return 'Artifact ID is too long (max 512 characters)';
            }
            return null;
        }
    });

    if (result === undefined) {
        return null; // User cancelled
    }

    return result?.trim() || undefined;
}

async function enterVersion(): Promise<string | null | undefined> {
    const result = await vscode.window.showInputBox({
        title: 'Create Artifact - Step 5/12: Initial Version (optional)',
        prompt: 'Enter initial version number (default: 1.0.0)',
        value: '1.0.0',
        placeHolder: '1.0.0'
    });

    if (result === undefined) {
        return null;
    }

    return result?.trim() || undefined;
}

async function enterName(): Promise<string | null | undefined> {
    const result = await vscode.window.showInputBox({
        title: 'Create Artifact - Step 6/12: Display Name (optional)',
        prompt: 'Enter a human-readable name for this artifact',
        placeHolder: 'e.g., User Management API'
    });

    if (result === undefined) {
        return null;
    }

    return result?.trim() || undefined;
}

async function enterDescription(): Promise<string | null | undefined> {
    const result = await vscode.window.showInputBox({
        title: 'Create Artifact - Step 7/12: Description (optional)',
        prompt: 'Enter a brief description',
        placeHolder: 'e.g., REST API for user management operations'
    });

    if (result === undefined) {
        return null;
    }

    return result?.trim() || undefined;
}

async function selectFile(artifactType: string): Promise<string | undefined> {
    // Suggest file patterns based on artifact type
    const patterns: { [key: string]: string[] } = {
        [ArtifactType.OPENAPI]: ['**/*.yaml', '**/*.yml', '**/*.json', '**/*.openapi.*'],
        [ArtifactType.AVRO]: ['**/*.avsc', '**/*.avro', '**/*.json'],
        [ArtifactType.PROTOBUF]: ['**/*.proto'],
        [ArtifactType.JSON]: ['**/*.json', '**/*.schema.json'],
        [ArtifactType.ASYNCAPI]: ['**/*.yaml', '**/*.yml', '**/*.json', '**/*.asyncapi.*'],
        [ArtifactType.GRAPHQL]: ['**/*.graphql', '**/*.gql'],
        [ArtifactType.WSDL]: ['**/*.wsdl', '**/*.xml'],
        [ArtifactType.XSD]: ['**/*.xsd', '**/*.xml'],
        [ArtifactType.XML]: ['**/*.xml']
    };

    const defaultPattern = patterns[artifactType]?.[0] || '**/*.*';

    const searchPattern = await vscode.window.showInputBox({
        title: 'Create Artifact - Step 8/12: Search for File',
        prompt: 'Enter glob pattern to search for files',
        value: defaultPattern,
        placeHolder: 'e.g., **/*.yaml'
    });

    if (!searchPattern) return undefined;

    // Find files matching pattern
    const files = await vscode.workspace.findFiles(searchPattern);

    if (files.length === 0) {
        vscode.window.showWarningMessage(`No files found matching pattern: ${searchPattern}`);
        return undefined;
    }

    // Show file picker
    const fileItems = await Promise.all(files.map(async (uri) => {
        const stat = await vscode.workspace.fs.stat(uri);
        const sizeKB = (stat.size / 1024).toFixed(1);
        return {
            label: `$(file) ${vscode.workspace.asRelativePath(uri)}`,
            description: `${sizeKB} KB`,
            detail: uri.fsPath,
            uri
        };
    }));

    const result = await vscode.window.showQuickPick(fileItems, {
        title: 'Create Artifact - Step 9/12: Select File',
        placeHolder: `Found ${files.length} file(s) matching ${searchPattern}`
    });

    return result?.uri.fsPath;
}

async function readFileContent(filePath: string): Promise<string | undefined> {
    try {
        const uri = vscode.Uri.file(filePath);
        const fileBytes = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(fileBytes).toString('utf-8');
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
        );
        return undefined;
    }
}

async function addLabels(): Promise<{ [key: string]: string } | null | undefined> {
    const labels: { [key: string]: string } = {};

    while (true) {
        const currentLabelsText = Object.keys(labels).length === 0
            ? '(none)'
            : Object.entries(labels).map(([k, v]) => `  ${k}=${v}`).join('\n');

        const action = await vscode.window.showQuickPick(
            [
                {
                    label: '$(add) Add label',
                    value: 'add'
                },
                {
                    label: '$(arrow-right) Continue',
                    value: 'continue',
                    description: Object.keys(labels).length > 0
                        ? `${Object.keys(labels).length} label(s) added`
                        : 'Skip adding labels'
                }
            ],
            {
                title: 'Create Artifact - Step 11/12: Add Labels (optional)',
                placeHolder: `Current labels:\n${currentLabelsText}`
            }
        );

        if (!action || action.value === 'continue') {
            return labels;
        }

        if (action.value === 'add') {
            const labelInput = await vscode.window.showInputBox({
                title: 'Enter Label',
                prompt: 'Enter label in key=value format',
                placeHolder: 'e.g., environment=production',
                validateInput: (value) => {
                    if (!value || !value.includes('=')) {
                        return 'Label must be in format: key=value';
                    }
                    const [key] = value.split('=');
                    if (!key || key.trim().length === 0) {
                        return 'Label key cannot be empty';
                    }
                    return null;
                }
            });

            if (!labelInput) {
                continue; // User cancelled, show menu again
            }

            const [key, ...valueParts] = labelInput.split('=');
            const value = valueParts.join('='); // Handle values with = in them
            labels[key.trim()] = value.trim();
        }
    }
}

async function confirmCreation(
    groupId: string,
    artifactId: string,
    artifactType: string,
    version: string,
    name: string | undefined,
    filePath: string,
    labels: { [key: string]: string } | undefined
): Promise<boolean> {
    const labelsText = labels && Object.keys(labels).length > 0
        ? Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(', ')
        : '(none)';

    const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
    const sizeKB = (stat.size / 1024).toFixed(1);

    const message = [
        'Review artifact details:',
        '',
        `Group:       ${groupId}`,
        `Artifact ID: ${artifactId}`,
        `Type:        ${artifactType}`,
        `Version:     ${version}`,
        name ? `Name:        ${name}` : null,
        `File:        ${vscode.workspace.asRelativePath(filePath)} (${sizeKB} KB)`,
        `Labels:      ${labelsText}`
    ].filter(Boolean).join('\n');

    const result = await vscode.window.showQuickPick(
        [
            {
                label: '$(check) Create artifact',
                value: true
            },
            {
                label: '$(x) Cancel',
                value: false
            }
        ],
        {
            title: 'Create Artifact - Step 12/12: Confirm Creation',
            placeHolder: message
        }
    );

    return result?.value === true;
}
```

---

### 4. Package.json Updates

```json
{
    "contributes": {
        "commands": [
            {
                "command": "apicurioRegistry.createArtifact",
                "title": "Create Artifact",
                "icon": "$(add)",
                "category": "Apicurio Registry"
            }
        ],
        "menus": {
            "view/title": [
                {
                    "command": "apicurioRegistry.createArtifact",
                    "when": "view == apicurioRegistry",
                    "group": "navigation@2"
                }
            ],
            "view/item/context": [
                {
                    "command": "apicurioRegistry.createArtifact",
                    "when": "view == apicurioRegistry && viewItem == group",
                    "group": "inline"
                }
            ]
        }
    }
}
```

---

### 5. Extension.ts Registration

```typescript
import { createArtifactCommand } from './commands/createArtifactCommand';

// In activate() function
const createArtifact = vscode.commands.registerCommand(
    'apicurioRegistry.createArtifact',
    async () => {
        await createArtifactCommand(registryService, registryTreeProvider);
    }
);

context.subscriptions.push(createArtifact);
```

---

## Validation Rules

### Group ID Validation

```typescript
function validateGroupId(groupId: string): string | null {
    if (!groupId || groupId.trim().length === 0) {
        return 'Group ID cannot be empty';
    }
    if (!/^[a-z0-9._-]+$/i.test(groupId)) {
        return 'Group ID can only contain letters, numbers, dots, dashes, and underscores';
    }
    if (groupId.length > 512) {
        return 'Group ID is too long (max 512 characters)';
    }
    return null;
}
```

### Artifact ID Validation

```typescript
function validateArtifactId(artifactId: string | undefined): string | null {
    if (!artifactId) {
        return null; // Optional
    }
    if (!/^[a-z0-9._-]+$/i.test(artifactId)) {
        return 'Artifact ID can only contain letters, numbers, dots, dashes, and underscores';
    }
    if (artifactId.length > 512) {
        return 'Artifact ID is too long (max 512 characters)';
    }
    return null;
}
```

### Label Validation

```typescript
function validateLabel(label: string): string | null {
    if (!label || !label.includes('=')) {
        return 'Label must be in format: key=value';
    }
    const [key, ...valueParts] = label.split('=');
    if (!key || key.trim().length === 0) {
        return 'Label key cannot be empty';
    }
    const value = valueParts.join('=');
    if (value.length === 0) {
        return 'Label value cannot be empty';
    }
    return null;
}
```

### File Validation

```typescript
async function validateFile(filePath: string): Promise<string | null> {
    try {
        const uri = vscode.Uri.file(filePath);
        const stat = await vscode.workspace.fs.stat(uri);

        if (stat.size === 0) {
            return 'File is empty';
        }

        if (stat.size > 10 * 1024 * 1024) { // 10 MB limit
            return 'File is too large (max 10 MB)';
        }

        return null;
    } catch (error) {
        return `Cannot access file: ${error instanceof Error ? error.message : String(error)}`;
    }
}
```

---

## Error Handling

### API Errors

```typescript
try {
    const response = await registryService.createArtifact(groupId, request);
    // Success handling
} catch (error: any) {
    if (error.response) {
        switch (error.response.status) {
            case 409:
                vscode.window.showErrorMessage(
                    `Artifact ${groupId}/${artifactId} already exists. ` +
                    'Choose a different artifact ID or group.'
                );
                break;
            case 400:
                vscode.window.showErrorMessage(
                    'Invalid artifact data: ' + (error.response.data?.message || 'Bad request')
                );
                break;
            case 401:
                vscode.window.showErrorMessage(
                    'Authentication required. Please check your registry credentials.'
                );
                break;
            case 403:
                vscode.window.showErrorMessage(
                    'Permission denied. You do not have permission to create artifacts in this group.'
                );
                break;
            case 404:
                vscode.window.showErrorMessage(
                    `Group ${groupId} not found. It may have been deleted.`
                );
                break;
            default:
                vscode.window.showErrorMessage(
                    `Failed to create artifact: ${error.response.data?.message || error.message}`
                );
        }
    } else {
        vscode.window.showErrorMessage(
            `Network error: ${error.message || 'Cannot connect to registry'}`
        );
    }
}
```

### User Cancellation

```typescript
if (!result) {
    // User cancelled - silently return
    return;
}
```

### File Read Errors

```typescript
try {
    const content = await readFileContent(filePath);
    if (!content) {
        throw new Error('File content is empty');
    }
} catch (error) {
    vscode.window.showErrorMessage(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
    );
    return;
}
```

---

## Testing Strategy

### Unit Tests

**File:** `src/commands/__tests__/createArtifactCommand.test.ts`

```typescript
describe('createArtifactCommand', () => {
    describe('Group Selection', () => {
        it('should prompt for group mode selection');
        it('should create new group when NEW selected');
        it('should select existing group when EXISTING selected');
        it('should validate group ID format');
        it('should cancel if group selection cancelled');
    });

    describe('Artifact Type Selection', () => {
        it('should show all 10 artifact types');
        it('should cancel if type not selected');
    });

    describe('Artifact ID Entry', () => {
        it('should accept valid artifact ID');
        it('should accept empty for auto-generation');
        it('should validate artifact ID format');
    });

    describe('File Selection', () => {
        it('should suggest patterns based on artifact type');
        it('should find files matching pattern');
        it('should show file size in selection');
        it('should read file content');
    });

    describe('Label Management', () => {
        it('should add labels in key=value format');
        it('should validate label format');
        it('should allow multiple labels');
        it('should allow skipping labels');
    });

    describe('Artifact Creation', () => {
        it('should create artifact with all fields');
        it('should create artifact with minimal fields');
        it('should show progress during creation');
        it('should refresh tree after creation');
        it('should show success notification');
    });

    describe('Error Handling', () => {
        it('should handle 409 conflict error');
        it('should handle 400 validation error');
        it('should handle 401 authentication error');
        it('should handle file read errors');
        it('should handle network errors');
    });
});
```

### Integration Tests

1. **End-to-End Workflow**: Complete wizard flow with real registry
2. **File Upload**: Upload various file types (JSON, YAML, XML)
3. **Error Scenarios**: Test all error conditions
4. **Cancellation**: Test cancelling at each step

### Manual Testing Checklist

See `docs/CREATE_ARTIFACT_TESTING_CHECKLIST.md` (to be created)

---

## Implementation Plan

### Phase 1: Core Functionality (2-3 days)

- [ ] **Day 1**: Service layer
  - Create `createArtifact()` method in RegistryService
  - Create `getGroups()` method
  - Add models to registryModels.ts
  - Unit tests for service layer

- [ ] **Day 2-3**: Command implementation
  - Create createArtifactCommand.ts
  - Implement all wizard steps (1-12)
  - Add validation logic
  - Error handling

### Phase 2: UX Enhancements (1-2 days)

- [ ] **Enhancements**:
  - Smart file pattern suggestions
  - File size display
  - Label management UI
  - Progress indicators
  - Success notifications

### Phase 3: Testing (1 day)

- [ ] **Testing**:
  - Unit tests for command layer
  - Integration tests
  - Manual testing with real registry
  - Edge case testing

### Phase 4: Documentation (0.5 days)

- [ ] **Documentation**:
  - User guide
  - Testing checklist
  - API documentation
  - Code comments

---

## Total Effort Estimate

- **Development**: 3-5 days
- **Testing**: 1 day
- **Documentation**: 0.5 days
- **Total**: 4.5-6.5 days

---

## Dependencies

### NPM Packages

```json
{
    "dependencies": {
        "mime-types": "^2.1.35"
    },
    "devDependencies": {
        "@types/mime-types": "^2.1.1"
    }
}
```

### VSCode APIs Used

- `vscode.window.showQuickPick()` - Multi-step wizard
- `vscode.window.showInputBox()` - Text input
- `vscode.window.withProgress()` - Progress indication
- `vscode.workspace.findFiles()` - File search
- `vscode.workspace.fs.readFile()` - File reading
- `vscode.workspace.asRelativePath()` - Path display

---

## Comparison with Reference Plugin

| Aspect | Reference Plugin | Proposed Implementation | Improvement |
|--------|------------------|-------------------------|-------------|
| **API Version** | V2 (headers) | V3 (JSON body) | ✅ Modern API |
| **Group Confirmation** | Yes (2 steps) | No (1 step) | ✅ Reduced friction |
| **Auto-generation** | No | Yes (ID & version) | ✅ More flexible |
| **Metadata** | None | Name, description, labels | ✅ Richer data |
| **File Preview** | No | Optional | ✅ Better UX |
| **Progress** | No | Yes | ✅ Better feedback |
| **Error Handling** | Basic | Comprehensive | ✅ Better DX |
| **Validation** | Basic | Advanced | ✅ Fewer errors |

---

## Success Criteria

✅ **Feature Complete** when:

1. Users can create artifacts through 12-step wizard
2. All 10 artifact types supported
3. Group creation and selection working
4. File search and upload working
5. Validation prevents invalid inputs
6. Errors handled gracefully
7. Progress feedback shown
8. Tree refreshes after creation
9. Success notification displayed
10. All tests passing (>80% coverage)

---

**Document Version:** 1.0
**Status:** Specification Complete - Ready for Implementation
**Next Action:** Begin Phase 1 implementation
