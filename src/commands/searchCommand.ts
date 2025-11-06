import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryTreeDataProvider } from '../providers/registryTreeProvider';
import { ArtifactType, ArtifactState } from '../models/registryModels';

/**
 * Search mode determines which entity type to search for.
 */
export enum SearchMode {
    Artifact = 'artifact',
    Version = 'version',
    Group = 'group'
}

/**
 * Unified search command combining quick and advanced search capabilities.
 * - Quick Search: Single-field artifact search (most common use case)
 * - Advanced Search: Multi-field search with mode selection (artifact/version/group)
 *
 * @param registryService The registry service for API calls
 * @param treeProvider The tree provider to display search results
 */
export async function searchCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    // Check if connected
    if (!registryService.isConnected()) {
        vscode.window.showErrorMessage('Please connect to a registry first before searching.');
        return;
    }

    try {
        // Step 1: Choose search type
        const searchTypeOptions = [
            {
                label: '$(search) Quick Search',
                description: 'Search artifacts by a single criterion (name, type, state, etc.)',
                value: 'quick'
            },
            {
                label: '$(filter) Advanced Search',
                description: 'Multi-field search across artifacts, versions, or groups',
                value: 'advanced'
            }
        ];

        const selectedType = await vscode.window.showQuickPick(searchTypeOptions, {
            title: 'Search Registry',
            placeHolder: 'Choose search type...'
        });

        if (!selectedType) {
            return; // User cancelled
        }

        if (selectedType.value === 'quick') {
            await executeQuickSearch(registryService, treeProvider);
        } else {
            await executeAdvancedSearch(registryService, treeProvider);
        }

    } catch (error) {
        console.error('Search command error:', error);
        vscode.window.showErrorMessage(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Quick search: Single-field artifact search.
 */
async function executeQuickSearch(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    // Step 1: Choose search criterion
    const criteriaOptions = [
        { label: 'Name', value: 'name', description: 'Search by artifact name' },
        { label: 'Description', value: 'description', description: 'Search by description text' },
        { label: 'Type', value: 'artifactType', description: 'Filter by artifact type (OpenAPI, AsyncAPI, etc.)' },
        { label: 'State', value: 'state', description: 'Filter by state (ENABLED, DISABLED, DEPRECATED)' },
        { label: 'Group', value: 'group', description: 'Filter by group ID' },
        { label: 'Labels', value: 'labels', description: 'Search by label (key:value format)' }
    ];

    const selectedCriterion = await vscode.window.showQuickPick(criteriaOptions, {
        title: 'Quick Search - Step 1/2: Select Criterion',
        placeHolder: 'Choose what to search by...'
    });

    if (!selectedCriterion) {
        return;
    }

    // Step 2: Get search value
    const searchValue = await getInputForCriterion(selectedCriterion.label, selectedCriterion.value);

    if (!searchValue) {
        return;
    }

    // Execute search with single criterion
    const criteria: Record<string, string> = {
        [selectedCriterion.value]: searchValue
    };

    await executeSearch(registryService, treeProvider, SearchMode.Artifact, criteria);
}

/**
 * Advanced search: Multi-field search with mode selection.
 */
async function executeAdvancedSearch(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    // Step 1: Select search mode
    const searchMode = await selectSearchMode();
    if (!searchMode) {
        return;
    }

    // Step 2: Collect search criteria
    const criteria = await collectSearchCriteria(searchMode);
    if (!criteria || Object.keys(criteria).length === 0) {
        vscode.window.showInformationMessage('No search criteria specified. Please add at least one criterion.');
        return;
    }

    // Step 3: Execute search
    await executeSearch(registryService, treeProvider, searchMode, criteria);
}

/**
 * Show search mode selection dialog.
 */
async function selectSearchMode(): Promise<SearchMode | undefined> {
    const modeOptions = [
        {
            label: 'Artifact Search',
            description: 'Search for artifacts by name, description, labels, type, etc.',
            value: SearchMode.Artifact
        },
        {
            label: 'Version Search',
            description: 'Search for versions across all artifacts',
            value: SearchMode.Version
        },
        {
            label: 'Group Search',
            description: 'Search for groups by ID, description, or labels',
            value: SearchMode.Group
        }
    ];

    const selected = await vscode.window.showQuickPick(modeOptions, {
        title: 'Advanced Search - Step 1: Select Search Type',
        placeHolder: 'Choose the type of search to perform...'
    });

    return selected?.value;
}

/**
 * Collect multiple search criteria from user.
 */
async function collectSearchCriteria(mode: SearchMode): Promise<Record<string, string>> {
    const criteria: Record<string, string> = {};
    const criteriaOptions = getCriteriaOptions(mode);

    while (true) {
        // Add "Done" option
        const options = [
            ...criteriaOptions,
            {
                label: '✅ Done - Search Now',
                description: Object.keys(criteria).length > 0
                    ? `Search with ${Object.keys(criteria).length} criterion/criteria`
                    : 'Start search (at least one criterion required)',
                value: 'done'
            }
        ];

        const selected = await vscode.window.showQuickPick(options, {
            title: `Advanced Search - Step 2: Add Search Criteria (${Object.keys(criteria).length} added)`,
            placeHolder: 'Select a criterion to add, or click Done to search...'
        });

        if (!selected) {
            return {}; // User cancelled
        }

        if (selected.value === 'done') {
            break;
        }

        // Get value for selected criterion
        const value = await getInputForCriterion(selected.label, selected.value);
        if (value) {
            criteria[selected.value] = value;
        }
    }

    return criteria;
}

/**
 * Get available search criteria based on mode.
 */
function getCriteriaOptions(mode: SearchMode): Array<{ label: string; description: string; value: string }> {
    const commonOptions = [
        { label: 'Name', description: 'Search by name', value: 'name' },
        { label: 'Description', description: 'Search by description text', value: 'description' },
        { label: 'Labels (key:value)', description: 'Filter by labels in key:value format', value: 'labels' }
    ];

    switch (mode) {
        case SearchMode.Artifact:
            return [
                ...commonOptions,
                { label: 'Group ID', description: 'Filter by group ID', value: 'group' },
                { label: 'Type', description: 'Filter by artifact type', value: 'artifactType' },
                { label: 'State', description: 'Filter by state (ENABLED, DISABLED, DEPRECATED)', value: 'state' }
            ];

        case SearchMode.Version:
            return [
                { label: 'Version', description: 'Search by version identifier', value: 'version' },
                ...commonOptions,
                { label: 'Group ID', description: 'Filter by group ID', value: 'groupId' },
                { label: 'Artifact ID', description: 'Filter by artifact ID', value: 'artifactId' },
                { label: 'State', description: 'Filter by state', value: 'state' }
            ];

        case SearchMode.Group:
            return [
                { label: 'Group ID', description: 'Search by group ID', value: 'groupId' },
                ...commonOptions
            ];

        default:
            return commonOptions;
    }
}

/**
 * Get input value for a specific criterion.
 */
async function getInputForCriterion(label: string, criterion: string): Promise<string | undefined> {
    // Special handling for artifact type
    if (criterion === 'artifactType') {
        const typeOptions = Object.values(ArtifactType).map(type => ({
            label: type,
            description: getArtifactTypeDescription(type)
        }));

        const selected = await vscode.window.showQuickPick(typeOptions, {
            title: `Select Artifact Type`,
            placeHolder: 'Choose an artifact type...'
        });

        return selected?.label;
    }

    // Special handling for state
    if (criterion === 'state') {
        const stateOptions = Object.values(ArtifactState).map(state => ({
            label: state,
            description: getStateDescription(state)
        }));

        const selected = await vscode.window.showQuickPick(stateOptions, {
            title: `Select State`,
            placeHolder: 'Choose a state...'
        });

        return selected?.label;
    }

    // Special handling for labels
    if (criterion === 'labels') {
        return await vscode.window.showInputBox({
            title: `Enter ${label}`,
            prompt: 'Enter label in format: key:value or key=value',
            placeHolder: 'e.g., environment:prod or team=backend',
            validateInput: validateLabelFormat
        });
    }

    // Default text input for other criteria
    return await vscode.window.showInputBox({
        title: `Enter ${label}`,
        prompt: `Enter search term for ${label.toLowerCase()}`,
        placeHolder: getPlaceholderForCriterion(criterion),
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return `${label} cannot be empty`;
            }
            if (value.trim().length < 2) {
                return `${label} must be at least 2 characters`;
            }
            return undefined;
        }
    });
}

/**
 * Validate label format (must be key:value or key=value).
 */
function validateLabelFormat(input: string): string | undefined {
    if (!input) {
        return 'Label cannot be empty';
    }
    if (!input.includes(':') && !input.includes('=')) {
        return 'Labels must be in format "key:value" or "key=value"';
    }
    return undefined;
}

/**
 * Get placeholder text for criterion input.
 */
function getPlaceholderForCriterion(criterion: string): string {
    const placeholders: Record<string, string> = {
        'name': 'e.g., User API',
        'description': 'e.g., user management',
        'groupId': 'e.g., com.example.apis',
        'group': 'e.g., com.example.apis',
        'artifactId': 'e.g., user-api',
        'version': 'e.g., 1.0.0',
        'artifactType': 'e.g., OPENAPI',
        'state': 'e.g., ENABLED'
    };
    return placeholders[criterion] || '';
}

/**
 * Execute the search and filter the tree view.
 */
async function executeSearch(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider,
    mode: SearchMode,
    criteria: Record<string, string>
): Promise<void> {
    try {
        // Apply search filter to tree provider
        // This will trigger tree refresh with filtered results and auto-expand
        await treeProvider.applySearchFilter(mode, criteria);

        const criteriaDesc = formatCriteriaDescription(criteria);

        // Show success message with option to clear filter
        vscode.window.showInformationMessage(
            `Filtering ${mode}s by: ${criteriaDesc}`,
            'Clear Filter'
        ).then(selection => {
            if (selection === 'Clear Filter') {
                treeProvider.clearSearchFilter();
            }
        });

    } catch (error) {
        vscode.window.showErrorMessage(
            `Search failed: ${error instanceof Error ? error.message : String(error)}`,
            'Try Again'
        ).then(selection => {
            if (selection === 'Try Again') {
                searchCommand(registryService, treeProvider);
            }
        });
    }
}

/**
 * Format criteria for display in result message.
 */
function formatCriteriaDescription(criteria: Record<string, string>): string {
    return Object.entries(criteria)
        .map(([key, value]) => `${key}: "${value}"`)
        .join(', ');
}

/**
 * Returns a user-friendly description for each artifact type.
 */
function getArtifactTypeDescription(type: ArtifactType): string {
    const descriptions: Record<ArtifactType, string> = {
        [ArtifactType.OPENAPI]: 'REST API specification',
        [ArtifactType.ASYNCAPI]: 'Async messaging API specification',
        [ArtifactType.AVRO]: 'Apache Avro schema',
        [ArtifactType.PROTOBUF]: 'Protocol Buffers schema',
        [ArtifactType.JSON]: 'JSON Schema',
        [ArtifactType.GRAPHQL]: 'GraphQL schema',
        [ArtifactType.KCONNECT]: 'Kafka Connect schema',
        [ArtifactType.WSDL]: 'Web Services Description Language',
        [ArtifactType.XSD]: 'XML Schema Definition'
    };
    return descriptions[type] || 'Unknown type';
}

/**
 * Returns a user-friendly description for each state.
 */
function getStateDescription(state: ArtifactState): string {
    const descriptions: Record<ArtifactState, string> = {
        [ArtifactState.ENABLED]: 'Active and available',
        [ArtifactState.DISABLED]: 'Disabled and unavailable',
        [ArtifactState.DEPRECATED]: 'Deprecated but still available'
    };
    return descriptions[state] || 'Unknown state';
}
