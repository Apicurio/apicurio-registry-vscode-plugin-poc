import * as vscode from 'vscode';
import * as mime from 'mime-types';
import { RegistryService } from '../services/registryService';
import { RegistryTreeDataProvider } from '../providers/registryTreeProvider';
import {
    CreateArtifactRequest,
    ArtifactType,
    GroupMetaData
} from '../models/registryModels';

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
        if (!groupMode) {return;}

        // Step 3: Get group ID
        let groupId: string | undefined;
        if (groupMode === GroupSelectionMode.NEW) {
            groupId = await createNewGroup();
        } else {
            groupId = await selectExistingGroup(registryService);
        }
        if (!groupId) {return;}

        // Step 4: Select artifact type
        const artifactType = await selectArtifactType();
        if (!artifactType) {return;}

        // Step 5: Enter artifact ID (optional)
        const artifactId = await enterArtifactId();
        if (artifactId === null) {return;} // User cancelled

        // Step 6: Enter version (optional)
        const version = await enterVersion();
        if (version === null) {return;}

        // Step 7: Enter name (optional)
        const name = await enterName();
        if (name === null) {return;}

        // Step 8: Enter description (optional)
        const description = await enterDescription();
        if (description === null) {return;}

        // Step 9: Search for file
        const filePath = await selectFile(artifactType);
        if (!filePath) {return;}

        // Step 10: Read file content
        const fileContent = await readFileContent(filePath);
        if (!fileContent) {return;}

        // Step 11: Add labels (optional)
        const labels = await addLabels();
        if (labels === null) {return;}

        // Step 12: Select draft mode (if supported)
        const isDraft = await selectDraftMode(registryService);
        if (isDraft === null) {return;}

        // Step 13: Final confirmation
        const confirmed = await confirmCreation(
            groupId,
            artifactId || '(auto-generated)',
            artifactType,
            version || '1.0.0',
            name,
            filePath,
            labels,
            isDraft
        );
        if (!confirmed) {return;}

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
                        },
                        isDraft: isDraft
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

                if (action === 'Create Another') {
                    // Restart wizard
                    await createArtifactCommand(registryService, treeProvider);
                }
            }
        );
    } catch (error) {
        // Try to handle as rule violation first
        const { handlePotentialRuleViolation } = await import('../utils/ruleErrorParser');
        const handled = await handlePotentialRuleViolation(error);

        if (!handled) {
            // Show generic error if not a rule violation
            vscode.window.showErrorMessage(
                `Failed to create artifact: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}

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
            title: 'Create Artifact - Step 1/13: Select Group Mode',
            placeHolder: 'Choose whether to use an existing group or create a new one'
        }
    );

    return result?.value;
}

async function createNewGroup(): Promise<string | undefined> {
    const groupId = await vscode.window.showInputBox({
        title: 'Create Artifact - Step 2/13: Enter Group ID',
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

    if (groups.length === 0) {
        vscode.window.showWarningMessage('No groups found in the registry. Creating a new group instead.');
        return createNewGroup();
    }

    const items = groups.map((group: GroupMetaData) => ({
        label: group.groupId,
        description: group.description,
        detail: `${group.artifactCount || 0} artifact(s)`
    }));

    const result = await vscode.window.showQuickPick(items, {
        title: 'Create Artifact - Step 2/13: Select Group',
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
        }
    ];

    const result = await vscode.window.showQuickPick(types, {
        title: 'Create Artifact - Step 3/13: Select Artifact Type',
        placeHolder: 'Choose the type of artifact you want to create'
    });

    return result?.value;
}

async function enterArtifactId(): Promise<string | null | undefined> {
    const result = await vscode.window.showInputBox({
        title: 'Create Artifact - Step 4/13: Artifact ID (optional)',
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
        title: 'Create Artifact - Step 5/13: Initial Version (optional)',
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
        title: 'Create Artifact - Step 6/13: Display Name (optional)',
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
        title: 'Create Artifact - Step 7/13: Description (optional)',
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
        [ArtifactType.XSD]: ['**/*.xsd', '**/*.xml']
    };

    const defaultPattern = patterns[artifactType]?.[0] || '**/*.*';

    const searchPattern = await vscode.window.showInputBox({
        title: 'Create Artifact - Step 8/13: Search for File',
        prompt: 'Enter glob pattern to search for files',
        value: defaultPattern,
        placeHolder: 'e.g., **/*.yaml'
    });

    if (!searchPattern) {return undefined;}

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
        title: 'Create Artifact - Step 9/13: Select File',
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
                title: 'Create Artifact - Step 10/13: Add Labels (optional)',
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

async function selectDraftMode(registryService: RegistryService): Promise<boolean | null> {
    // Check if draft support is enabled
    const draftEnabled = await registryService.isDraftSupportEnabled();

    if (!draftEnabled) {
        // Draft not supported, default to published version
        return false;
    }

    // Show draft mode selection
    const result = await vscode.window.showQuickPick(
        [
            {
                label: '$(file) Published Version',
                value: false,
                description: 'Create an immutable, published version',
                detail: 'Cannot be edited after creation'
            },
            {
                label: '$(edit) Draft Version',
                value: true,
                description: 'Create an editable draft version',
                detail: 'Can be modified before finalizing'
            }
        ],
        {
            title: 'Create Artifact - Step 12/13: Select Version Mode',
            placeHolder: 'Choose whether to create as draft or published version',
            ignoreFocusOut: true
        }
    );

    if (!result) {
        return null; // User cancelled
    }

    return result.value;
}

async function confirmCreation(
    groupId: string,
    artifactId: string,
    artifactType: string,
    version: string,
    name: string | undefined,
    filePath: string,
    labels: { [key: string]: string } | undefined,
    isDraft: boolean
): Promise<boolean> {
    const labelsText = labels && Object.keys(labels).length > 0
        ? Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(', ')
        : '(none)';

    const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
    const sizeKB = (stat.size / 1024).toFixed(1);

    const items = [
        `Group:       ${groupId}`,
        `Artifact ID: ${artifactId}`,
        `Type:        ${artifactType}`,
        `Version:     ${version}`,
        name ? `Name:        ${name}` : null,
        `File:        ${vscode.workspace.asRelativePath(filePath)} (${sizeKB} KB)`,
        `Labels:      ${labelsText}`,
        `Mode:        ${isDraft ? 'Draft (editable)' : 'Published (immutable)'}`,
        '',
        'Create this artifact?'
    ].filter(Boolean);

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
            title: 'Create Artifact - Step 13/13: Confirm Creation',
            placeHolder: items.join('\n')
        }
    );

    return result?.value === true;
}
