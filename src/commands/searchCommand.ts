import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryTreeDataProvider } from '../providers/registryTreeProvider';
import { ArtifactType, ArtifactState } from '../models/registryModels';

/**
 * Search criteria options available to users.
 * Based on Apicurio Registry V3 API search capabilities.
 */
export enum SearchCriteria {
    Name = 'name',
    Group = 'group',
    Description = 'description',
    Type = 'type',
    State = 'state',
    Labels = 'labels'
}

/**
 * Executes the search artifacts command with a multi-step wizard UX.
 * Inspired by reference plugin's proven UX pattern.
 *
 * @param registryService The registry service for API calls
 * @param treeProvider The tree provider to display search results
 */
export async function searchArtifactsCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    // Check if connected
    if (!registryService.isConnected()) {
        vscode.window.showErrorMessage('Please connect to a registry first before searching.');
        return;
    }

    try {
        // Step 1: Choose search criteria
        const searchCriteriaOptions = [
            { label: 'Name', value: SearchCriteria.Name, description: 'Search by artifact name' },
            { label: 'Group', value: SearchCriteria.Group, description: 'Search by group ID' },
            { label: 'Description', value: SearchCriteria.Description, description: 'Search by description text' },
            { label: 'Type', value: SearchCriteria.Type, description: 'Filter by artifact type (OpenAPI, AsyncAPI, etc.)' },
            { label: 'State', value: SearchCriteria.State, description: 'Filter by state (Enabled, Disabled, Deprecated)' },
            { label: 'Labels', value: SearchCriteria.Labels, description: 'Search by label key=value' }
        ];

        const selectedCriteria = await vscode.window.showQuickPick(searchCriteriaOptions, {
            title: 'Search Artifacts - Step 1/2: Select Search Criteria',
            placeHolder: 'Choose how you want to search...'
        });

        if (!selectedCriteria) {
            // User cancelled
            return;
        }

        // Step 2: Get search value based on criteria type
        let searchValue: string | undefined;

        switch (selectedCriteria.value) {
            case SearchCriteria.Type:
                // Show artifact type picker
                const typeOptions = Object.values(ArtifactType).map(type => ({
                    label: type,
                    description: getArtifactTypeDescription(type)
                }));

                const selectedType = await vscode.window.showQuickPick(typeOptions, {
                    title: `Search Artifacts - Step 2/2: Select Artifact Type`,
                    placeHolder: 'Choose an artifact type...'
                });

                if (!selectedType) {
                    return;
                }
                searchValue = selectedType.label;
                break;

            case SearchCriteria.State:
                // Show state picker
                const stateOptions = Object.values(ArtifactState).map(state => ({
                    label: state,
                    description: getStateDescription(state)
                }));

                const selectedState = await vscode.window.showQuickPick(stateOptions, {
                    title: `Search Artifacts - Step 2/2: Select State`,
                    placeHolder: 'Choose a state...'
                });

                if (!selectedState) {
                    return;
                }
                searchValue = selectedState.label;
                break;

            case SearchCriteria.Labels:
                // Text input for labels (key=value format)
                searchValue = await vscode.window.showInputBox({
                    title: `Search Artifacts - Step 2/2: Enter Label`,
                    prompt: 'Enter label in format: key=value',
                    placeHolder: 'e.g., environment=production',
                    validateInput: (value) => {
                        if (!value) {
                            return 'Label cannot be empty';
                        }
                        if (!value.includes('=')) {
                            return 'Label must be in format: key=value';
                        }
                        return null;
                    }
                });
                break;

            default:
                // Text input for name, group, description
                searchValue = await vscode.window.showInputBox({
                    title: `Search Artifacts - Step 2/2: Enter ${selectedCriteria.label}`,
                    prompt: `Enter search term for ${selectedCriteria.label.toLowerCase()}`,
                    placeHolder: getPlaceholderForCriteria(selectedCriteria.value),
                    validateInput: (value) => {
                        if (!value || value.trim().length === 0) {
                            return `${selectedCriteria.label} cannot be empty`;
                        }
                        if (value.trim().length < 2) {
                            return `${selectedCriteria.label} must be at least 2 characters`;
                        }
                        return null;
                    }
                });
                break;
        }

        if (!searchValue) {
            // User cancelled
            return;
        }

        // Execute search
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Searching for artifacts...`,
            cancellable: false
        }, async (progress) => {
            progress.report({ message: `Searching by ${selectedCriteria.label}: "${searchValue}"` });

            // Build search params
            const searchParams: Record<string, string> = {};
            searchParams[selectedCriteria.value] = searchValue!;

            // Get search limit from configuration
            const config = vscode.workspace.getConfiguration('apicurioRegistry');
            const defaultLimit = config.get<number>('search.defaultLimit', 50);

            try {
                // Call search API with configured limit
                const results = await registryService.searchArtifacts(searchParams, defaultLimit);

                // Show results
                if (results.length === 0) {
                    vscode.window.showInformationMessage(
                        `No artifacts found matching ${selectedCriteria.label}: "${searchValue}"`,
                        'Try Again'
                    ).then(selection => {
                        if (selection === 'Try Again') {
                            searchArtifactsCommand(registryService, treeProvider);
                        }
                    });
                } else {
                    // Apply search filter to tree provider
                    treeProvider.applySearchFilter(selectedCriteria.value, searchValue!);

                    vscode.window.showInformationMessage(
                        `Found ${results.length} artifact${results.length === 1 ? '' : 's'} matching ${selectedCriteria.label}: "${searchValue}"`,
                        'Clear Filter'
                    ).then(selection => {
                        if (selection === 'Clear Filter') {
                            treeProvider.clearSearchFilter();
                        }
                    });
                }
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Search failed: ${error instanceof Error ? error.message : String(error)}`,
                    'Try Again'
                ).then(selection => {
                    if (selection === 'Try Again') {
                        searchArtifactsCommand(registryService, treeProvider);
                    }
                });
            }
        });

    } catch (error) {
        console.error('Search command error:', error);
        vscode.window.showErrorMessage(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
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

/**
 * Returns appropriate placeholder text for input fields.
 */
function getPlaceholderForCriteria(criteria: SearchCriteria): string {
    const placeholders: Record<SearchCriteria, string> = {
        [SearchCriteria.Name]: 'e.g., User API',
        [SearchCriteria.Group]: 'e.g., com.example.apis',
        [SearchCriteria.Description]: 'e.g., user management',
        [SearchCriteria.Type]: '',
        [SearchCriteria.State]: '',
        [SearchCriteria.Labels]: 'e.g., environment=production'
    };
    return placeholders[criteria] || '';
}
