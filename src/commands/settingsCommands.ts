import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryTreeDataProvider } from '../providers/registryTreeProvider';
import { ConfigurationProperty, PropertyType } from '../models/registryModels';

/**
 * Property group for UI organization
 */
interface PropertyGroup {
    name: string;
    description: string;
    properties: ConfigurationProperty[];
}

/**
 * Group properties by category
 */
function groupProperties(properties: ConfigurationProperty[]): PropertyGroup[] {
    const groups: Map<string, ConfigurationProperty[]> = new Map([
        ['Authentication', []],
        ['Authorization', []],
        ['Compatibility', []],
        ['Web Console', []],
        ['Semantic Versioning', []],
        ['Additional', []]
    ]);

    for (const prop of properties) {
        const category = categorizeProperty(prop.name);
        groups.get(category)!.push(prop);
    }

    return Array.from(groups.entries())
        .map(([name, props]) => ({
            name,
            description: getGroupDescription(name),
            properties: props
        }))
        .filter(group => group.properties.length > 0); // Only include non-empty groups
}

/**
 * Categorize property by name pattern
 */
function categorizeProperty(name: string): string {
    if (name.includes('authn')) { return 'Authentication'; }
    if (name.includes('authz') || name.includes('owner-only')) { return 'Authorization'; }
    if (name.includes('compat')) { return 'Compatibility'; }
    if (name.includes('ui.') || name.includes('console')) { return 'Web Console'; }
    if (name.includes('semver')) { return 'Semantic Versioning'; }
    return 'Additional';
}

/**
 * Get description for property group
 */
function getGroupDescription(groupName: string): string {
    const descriptions: Record<string, string> = {
        'Authentication': 'Authentication and identity settings',
        'Authorization': 'Access control and permissions',
        'Compatibility': 'Schema compatibility settings',
        'Web Console': 'UI and console configuration',
        'Semantic Versioning': 'Version management settings',
        'Additional': 'Other configuration properties'
    };
    return descriptions[groupName] || '';
}

/**
 * Get type-specific input from user
 */
async function getPropertyValueInput(
    property: ConfigurationProperty
): Promise<string | undefined> {
    switch (property.type) {
        case PropertyType.BOOLEAN:
            const boolChoice = await vscode.window.showQuickPick(
                [
                    { label: 'Enable', value: 'true', description: 'Set to true' },
                    { label: 'Disable', value: 'false', description: 'Set to false' }
                ],
                {
                    title: `Edit Property: ${property.label}`,
                    placeHolder: `Current: ${property.value === 'true' ? 'Enabled' : 'Disabled'}`,
                    ignoreFocusOut: true
                }
            );
            return boolChoice?.value;

        case PropertyType.INTEGER:
        case PropertyType.LONG:
            const numInput = await vscode.window.showInputBox({
                title: `Edit Property: ${property.label}`,
                prompt: property.description,
                value: property.value,
                validateInput: (value) => {
                    if (!/^-?\d+$/.test(value)) {
                        return 'Please enter a valid integer';
                    }
                    return null;
                },
                ignoreFocusOut: true
            });
            return numInput;

        default: // String
            const textInput = await vscode.window.showInputBox({
                title: `Edit Property: ${property.label}`,
                prompt: property.description,
                value: property.value,
                ignoreFocusOut: true
            });
            return textInput;
    }
}

/**
 * Format property value for display
 */
function formatPropertyValue(property: ConfigurationProperty): string {
    if (property.type === PropertyType.BOOLEAN) {
        return property.value === 'true' ? 'Enabled ✓' : 'Disabled ✗';
    }
    return property.value;
}

/**
 * Command to view and manage all settings
 */
export async function viewSettingsCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    try {
        // Fetch all properties
        const properties = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Loading configuration properties...',
                cancellable: false
            },
            async () => {
                return await registryService.getConfigProperties();
            }
        );

        if (properties.length === 0) {
            vscode.window.showInformationMessage(
                'No configuration properties available. Check if RBAC is enabled or if you have admin role.'
            );
            return;
        }

        // Group properties
        const groups = groupProperties(properties);

        // Step 1: Select property group
        const groupItems = groups.map(group => ({
            label: group.name,
            description: `${group.properties.length} properties`,
            detail: group.description,
            group
        }));

        const selectedGroup = await vscode.window.showQuickPick(groupItems, {
            title: 'View Settings - Step 1/2: Select Category',
            placeHolder: 'Choose a property category',
            ignoreFocusOut: true
        });

        if (!selectedGroup) {
            return; // User cancelled
        }

        // Step 2: Select property
        const propertyItems = selectedGroup.group.properties.map(prop => ({
            label: prop.label,
            description: formatPropertyValue(prop),
            detail: prop.description,
            property: prop
        }));

        const selectedProperty = await vscode.window.showQuickPick(propertyItems, {
            title: `View Settings - Step 2/2: ${selectedGroup.label}`,
            placeHolder: 'Choose a property to manage',
            ignoreFocusOut: true
        });

        if (!selectedProperty) {
            return; // User cancelled
        }

        // Step 3: Choose action
        const actionItems = [
            { label: '$(edit) Edit Value', action: 'edit' },
            { label: '$(discard) Reset to Default', action: 'reset' },
            { label: '$(close) Cancel', action: 'cancel' }
        ];

        const selectedAction = await vscode.window.showQuickPick(actionItems, {
            title: `Manage Property: ${selectedProperty.property.label}`,
            placeHolder: 'Choose an action',
            ignoreFocusOut: true
        });

        if (!selectedAction || selectedAction.action === 'cancel') {
            return;
        }

        if (selectedAction.action === 'edit') {
            await editPropertyCommand(registryService, treeProvider, selectedProperty.property);
        } else if (selectedAction.action === 'reset') {
            await resetPropertyCommand(registryService, treeProvider, selectedProperty.property);
        }

    } catch (error: any) {
        if (error.response?.status === 403) {
            vscode.window.showErrorMessage('Settings management requires admin role');
        } else {
            vscode.window.showErrorMessage(`Failed to load settings: ${error.message}`);
        }
    }
}

/**
 * Command to edit a single configuration property
 */
export async function editPropertyCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider,
    property: ConfigurationProperty
): Promise<void> {
    try {
        // Get type-specific input
        const newValue = await getPropertyValueInput(property);

        if (newValue === undefined) {
            return; // User cancelled
        }

        // Update property
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Updating ${property.label}...`,
                cancellable: false
            },
            async () => {
                await registryService.updateConfigProperty(property.name, newValue);
            }
        );

        vscode.window.showInformationMessage(
            `Successfully updated ${property.label} to: ${newValue}`
        );

        // Refresh tree view
        treeProvider.refresh();

    } catch (error: any) {
        if (error.response?.status === 400) {
            vscode.window.showErrorMessage(
                `Invalid value for ${property.label}: ${error.response.data?.message || error.message}`
            );
        } else if (error.response?.status === 403) {
            vscode.window.showErrorMessage('Settings management requires admin role');
        } else {
            vscode.window.showErrorMessage(`Failed to update property: ${error.message}`);
        }
    }
}

/**
 * Command to reset a configuration property to default
 */
export async function resetPropertyCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider,
    property: ConfigurationProperty
): Promise<void> {
    try {
        // Confirm reset
        const confirmation = await vscode.window.showWarningMessage(
            `Reset ${property.label} to default value?`,
            { modal: true, detail: `Current value: ${property.value}` },
            'Reset',
            'Cancel'
        );

        if (confirmation !== 'Reset') {
            return; // User cancelled
        }

        // Delete property (reset to default)
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Resetting ${property.label}...`,
                cancellable: false
            },
            async () => {
                await registryService.deleteConfigProperty(property.name);
            }
        );

        vscode.window.showInformationMessage(
            `Successfully reset ${property.label} to default`
        );

        // Refresh tree view
        treeProvider.refresh();

    } catch (error: any) {
        if (error.response?.status === 404) {
            vscode.window.showWarningMessage(
                `Property ${property.label} not found. It may already be at default value.`
            );
        } else if (error.response?.status === 403) {
            vscode.window.showErrorMessage('Settings management requires admin role');
        } else {
            vscode.window.showErrorMessage(`Failed to reset property: ${error.message}`);
        }
    }
}

/**
 * Command to search/filter properties
 */
export async function searchPropertiesCommand(
    registryService: RegistryService,
    treeProvider: RegistryTreeDataProvider
): Promise<void> {
    try {
        // Step 1: Get search term
        const searchTerm = await vscode.window.showInputBox({
            title: 'Search Settings - Step 1/2: Enter Search Term',
            prompt: 'Search by property name or description',
            placeHolder: 'e.g., auth, compatibility, ui',
            ignoreFocusOut: true
        });

        if (!searchTerm) {
            return; // User cancelled
        }

        // Fetch all properties
        const properties = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Searching properties...',
                cancellable: false
            },
            async () => {
                return await registryService.getConfigProperties();
            }
        );

        // Filter properties
        const filteredProperties = properties.filter(prop =>
            prop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prop.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prop.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredProperties.length === 0) {
            vscode.window.showInformationMessage(
                `No properties found matching "${searchTerm}"`
            );
            return;
        }

        // Step 2: Select property from results
        const propertyItems = filteredProperties.map(prop => ({
            label: prop.label,
            description: formatPropertyValue(prop),
            detail: `${prop.name} - ${prop.description}`,
            property: prop
        }));

        const selectedProperty = await vscode.window.showQuickPick(propertyItems, {
            title: `Search Results - ${filteredProperties.length} found`,
            placeHolder: 'Choose a property to manage',
            ignoreFocusOut: true
        });

        if (!selectedProperty) {
            return; // User cancelled
        }

        // Step 3: Choose action
        const actionItems = [
            { label: '$(edit) Edit Value', action: 'edit' },
            { label: '$(discard) Reset to Default', action: 'reset' },
            { label: '$(close) Cancel', action: 'cancel' }
        ];

        const selectedAction = await vscode.window.showQuickPick(actionItems, {
            title: `Manage Property: ${selectedProperty.property.label}`,
            placeHolder: 'Choose an action',
            ignoreFocusOut: true
        });

        if (!selectedAction || selectedAction.action === 'cancel') {
            return;
        }

        if (selectedAction.action === 'edit') {
            await editPropertyCommand(registryService, treeProvider, selectedProperty.property);
        } else if (selectedAction.action === 'reset') {
            await resetPropertyCommand(registryService, treeProvider, selectedProperty.property);
        }

    } catch (error: any) {
        if (error.response?.status === 403) {
            vscode.window.showErrorMessage('Settings management requires admin role');
        } else {
            vscode.window.showErrorMessage(`Search failed: ${error.message}`);
        }
    }
}
