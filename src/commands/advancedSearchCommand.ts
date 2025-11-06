import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryTreeDataProvider } from '../providers/registryTreeProvider';

/**
 * Search mode determines which entity type to search for.
 */
export enum SearchMode {
    Artifact = 'artifact',
    Version = 'version',
    Group = 'group'
}

/**
 * Advanced search command with multi-field filtering.
 * Supports artifact, version, and group search with multiple criteria.
 */
export async function advancedSearchCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    // Check if connected
    if (!registryService.isConnected()) {
        vscode.window.showErrorMessage('Please connect to a registry first before searching.');
        return;
    }

    try {
        // Step 1: Select search mode
        const searchMode = await selectSearchMode();
        if (!searchMode) {
            return; // User cancelled
        }

        // Step 2: Collect search criteria
        const criteria = await collectSearchCriteria(searchMode);
        if (!criteria || Object.keys(criteria).length === 0) {
            vscode.window.showInformationMessage('No search criteria specified. Please add at least one criterion.');
            return;
        }

        // Step 3: Execute search
        await executeSearch(registryService, treeProvider, searchMode, criteria);

    } catch (error) {
        console.error('Advanced search error:', error);
        vscode.window.showErrorMessage(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
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
    if (criterion === 'labels') {
        return await vscode.window.showInputBox({
            title: `Enter ${label}`,
            prompt: 'Enter label in format: key:value or key=value',
            placeHolder: 'e.g., environment:prod or team=backend',
            validateInput: validateLabelFormat
        });
    }

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
                advancedSearchCommand(registryService, treeProvider);
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

