import * as vscode from 'vscode';
import { RegistryService } from '../services/registryService';
import { RegistryItem, RegistryItemType, RuleType, Rule } from '../models/registryModels';

/**
 * Manage rules command - works for global, group, and artifact rules
 *
 * @param registryService - Registry service for API calls
 * @param refresh - Function to refresh the tree view
 * @param node - The tree node (group/artifact) or undefined for global rules
 * @param isGlobal - True if managing global rules
 */
export async function manageRulesCommand(
    registryService: RegistryService,
    refresh: () => void,
    node?: RegistryItem,
    isGlobal = false
): Promise<void> {
    try {
        // Validate node for non-global operations
        if (!isGlobal && (!node || !node.id)) {
            vscode.window.showErrorMessage('Invalid node: Missing ID');
            return;
        }

        // Determine entity type and fetch current rules
        let entityType: 'global' | 'group' | 'artifact';
        let currentRuleTypes: RuleType[];
        let currentRules: Map<RuleType, Rule> = new Map();

        if (isGlobal) {
            entityType = 'global';
            currentRuleTypes = await registryService.getGlobalRules();

            // Fetch details for each rule
            for (const ruleType of currentRuleTypes) {
                const rule = await registryService.getGlobalRule(ruleType);
                currentRules.set(ruleType, rule);
            }
        } else if (node!.type === RegistryItemType.Group) {
            entityType = 'group';
            const groupId = node!.id!;
            currentRuleTypes = await registryService.getGroupRules(groupId);

            for (const ruleType of currentRuleTypes) {
                const rule = await registryService.getGroupRule(groupId, ruleType);
                currentRules.set(ruleType, rule);
            }
        } else if (node!.type === RegistryItemType.Artifact) {
            entityType = 'artifact';
            const groupId = node!.groupId!;
            const artifactId = node!.id!;
            currentRuleTypes = await registryService.getArtifactRules(groupId, artifactId);

            for (const ruleType of currentRuleTypes) {
                const rule = await registryService.getArtifactRule(groupId, artifactId, ruleType);
                currentRules.set(ruleType, rule);
            }
        } else {
            vscode.window.showErrorMessage('Unsupported node type for rules management');
            return;
        }

        // Show rule selection QuickPick
        const selectedRule = await showRuleSelectionPicker(currentRules, entityType);
        if (!selectedRule) {
            return; // User cancelled
        }

        // Determine if rule is enabled
        const isEnabled = currentRules.has(selectedRule);

        // Show action picker (Enable/Configure/Disable)
        const action = await showActionPicker(isEnabled);
        if (!action) {
            return; // User cancelled
        }

        // Handle the selected action
        if (action === 'enable' || action === 'configure') {
            // Show configuration options
            const config = await showConfigPicker(selectedRule,
                isEnabled ? currentRules.get(selectedRule)?.config : undefined);
            if (!config) {
                return; // User cancelled
            }

            // Create or update rule
            if (isEnabled) {
                // Update existing rule
                await updateRule(registryService, entityType, selectedRule, config, node);
            } else {
                // Create new rule
                await createRule(registryService, entityType, selectedRule, config, node);
            }

            vscode.window.showInformationMessage(
                `${selectedRule} rule ${isEnabled ? 'updated' : 'enabled'} with config: ${config}`
            );
        } else if (action === 'disable') {
            // Delete rule
            await deleteRule(registryService, entityType, selectedRule, node);
            vscode.window.showInformationMessage(`${selectedRule} rule disabled`);
        }

        refresh();

    } catch (error) {
        console.error('Error managing rules:', error);
        vscode.window.showErrorMessage(
            `Failed to manage rules: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Show QuickPick for rule selection
 */
async function showRuleSelectionPicker(
    currentRules: Map<RuleType, Rule>,
    entityType: 'global' | 'group' | 'artifact'
): Promise<RuleType | undefined> {
    const items = [
        {
            label: currentRules.has(RuleType.VALIDITY) ? '✓ Validity Rule' : '☐ Validity Rule',
            description: currentRules.has(RuleType.VALIDITY)
                ? currentRules.get(RuleType.VALIDITY)!.config
                : 'Not configured',
            detail: 'Ensure that content is valid when creating artifacts',
            value: RuleType.VALIDITY
        },
        {
            label: currentRules.has(RuleType.COMPATIBILITY) ? '✓ Compatibility Rule' : '☐ Compatibility Rule',
            description: currentRules.has(RuleType.COMPATIBILITY)
                ? currentRules.get(RuleType.COMPATIBILITY)!.config
                : 'Not configured',
            detail: 'Enforce compatibility when creating new versions',
            value: RuleType.COMPATIBILITY
        },
        {
            label: currentRules.has(RuleType.INTEGRITY) ? '✓ Integrity Rule' : '☐ Integrity Rule',
            description: currentRules.has(RuleType.INTEGRITY)
                ? currentRules.get(RuleType.INTEGRITY)!.config
                : 'Not configured',
            detail: 'Enforce artifact reference integrity',
            value: RuleType.INTEGRITY
        }
    ];

    const selected = await vscode.window.showQuickPick(items, {
        title: `Manage ${entityType === 'global' ? 'Global' : entityType.charAt(0).toUpperCase() + entityType.slice(1)} Rules`,
        placeHolder: 'Select a rule to configure...'
    });

    return selected?.value;
}

/**
 * Show QuickPick for action selection (Enable/Configure/Disable)
 */
async function showActionPicker(isEnabled: boolean): Promise<'enable' | 'configure' | 'disable' | undefined> {
    type ActionItem = { label: string; description: string; value: 'enable' | 'configure' | 'disable' };

    const items: ActionItem[] = isEnabled
        ? [
            { label: 'Configure', description: 'Change rule configuration', value: 'configure' },
            { label: 'Disable', description: 'Remove this rule', value: 'disable' }
          ]
        : [
            { label: 'Enable', description: 'Add this rule', value: 'enable' }
          ];

    const selected = await vscode.window.showQuickPick(items, {
        title: 'Rule Action',
        placeHolder: 'What would you like to do?'
    });

    return selected?.value;
}

/**
 * Show QuickPick for configuration options based on rule type
 */
async function showConfigPicker(ruleType: RuleType, currentConfig?: string): Promise<string | undefined> {
    let items: Array<{ label: string; description: string; value: string }>;

    switch (ruleType) {
        case RuleType.VALIDITY:
            items = [
                {
                    label: 'SYNTAX_ONLY',
                    description: 'Validate syntax only',
                    value: 'SYNTAX_ONLY'
                },
                {
                    label: 'FULL',
                    description: 'Full semantic validation',
                    value: 'FULL'
                }
            ];
            break;

        case RuleType.COMPATIBILITY:
            items = [
                {
                    label: 'BACKWARD',
                    description: 'New schema can read old data',
                    value: 'BACKWARD'
                },
                {
                    label: 'BACKWARD_TRANSITIVE',
                    description: 'Compatible with all previous schemas',
                    value: 'BACKWARD_TRANSITIVE'
                },
                {
                    label: 'FORWARD',
                    description: 'Old schema can read new data',
                    value: 'FORWARD'
                },
                {
                    label: 'FORWARD_TRANSITIVE',
                    description: 'Compatible with all future schemas',
                    value: 'FORWARD_TRANSITIVE'
                },
                {
                    label: 'FULL',
                    description: 'Both backward and forward compatible',
                    value: 'FULL'
                },
                {
                    label: 'FULL_TRANSITIVE',
                    description: 'Fully compatible (all versions)',
                    value: 'FULL_TRANSITIVE'
                },
                {
                    label: 'NONE',
                    description: 'No compatibility enforcement',
                    value: 'NONE'
                }
            ];
            break;

        case RuleType.INTEGRITY:
            items = [
                {
                    label: 'NO_DUPLICATES',
                    description: 'Prevent duplicate references',
                    value: 'NO_DUPLICATES'
                },
                {
                    label: 'ALL_REFS_MAPPED',
                    description: 'All references must be mapped',
                    value: 'ALL_REFS_MAPPED'
                },
                {
                    label: 'REFS_EXIST',
                    description: 'Referenced artifacts must exist',
                    value: 'REFS_EXIST'
                }
            ];
            break;
    }

    const selected = await vscode.window.showQuickPick(items, {
        title: `Configure ${ruleType} Rule`,
        placeHolder: currentConfig ? `Current: ${currentConfig}` : 'Select configuration...'
    });

    return selected?.value;
}

/**
 * Create a new rule
 */
async function createRule(
    registryService: RegistryService,
    entityType: 'global' | 'group' | 'artifact',
    ruleType: RuleType,
    config: string,
    node?: RegistryItem
): Promise<void> {
    if (entityType === 'global') {
        await registryService.createGlobalRule(ruleType, config);
    } else if (entityType === 'group') {
        await registryService.createGroupRule(node!.id!, ruleType, config);
    } else if (entityType === 'artifact') {
        await registryService.createArtifactRule(node!.groupId!, node!.id!, ruleType, config);
    }
}

/**
 * Update an existing rule
 */
async function updateRule(
    registryService: RegistryService,
    entityType: 'global' | 'group' | 'artifact',
    ruleType: RuleType,
    config: string,
    node?: RegistryItem
): Promise<void> {
    if (entityType === 'global') {
        await registryService.updateGlobalRule(ruleType, config);
    } else if (entityType === 'group') {
        await registryService.updateGroupRule(node!.id!, ruleType, config);
    } else if (entityType === 'artifact') {
        await registryService.updateArtifactRule(node!.groupId!, node!.id!, ruleType, config);
    }
}

/**
 * Delete a rule
 */
async function deleteRule(
    registryService: RegistryService,
    entityType: 'global' | 'group' | 'artifact',
    ruleType: RuleType,
    node?: RegistryItem
): Promise<void> {
    if (entityType === 'global') {
        await registryService.deleteGlobalRule(ruleType);
    } else if (entityType === 'group') {
        await registryService.deleteGroupRule(node!.id!, ruleType);
    } else if (entityType === 'artifact') {
        await registryService.deleteArtifactRule(node!.groupId!, node!.id!, ruleType);
    }
}
