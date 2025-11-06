import * as vscode from 'vscode';
import { manageRulesCommand } from '../rulesCommand';
import { RegistryService } from '../../services/registryService';
import { RegistryItem, RegistryItemType, RuleType } from '../../models/registryModels';

// Mock vscode
jest.mock('vscode', () => ({
    window: {
        showQuickPick: jest.fn(),
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
    },
    QuickPickItemKind: {
        Separator: -1
    }
}));

describe('Rules Command', () => {
    let mockRegistryService: jest.Mocked<RegistryService>;
    let mockRefresh: jest.Mock;

    beforeEach(() => {
        // Create mock registry service
        mockRegistryService = {
            getGroupRules: jest.fn(),
            getGroupRule: jest.fn(),
            createGroupRule: jest.fn(),
            updateGroupRule: jest.fn(),
            deleteGroupRule: jest.fn(),
            getArtifactRules: jest.fn(),
            getArtifactRule: jest.fn(),
            createArtifactRule: jest.fn(),
            updateArtifactRule: jest.fn(),
            deleteArtifactRule: jest.fn(),
            getGlobalRules: jest.fn(),
            getGlobalRule: jest.fn(),
            createGlobalRule: jest.fn(),
            updateGlobalRule: jest.fn(),
            deleteGlobalRule: jest.fn(),
        } as any;

        mockRefresh = jest.fn();
        jest.clearAllMocks();
    });

    describe('Group Rules Management', () => {
        it('should manage rules for a group', async () => {
            const groupNode: RegistryItem = {
                label: 'test-group',
                type: RegistryItemType.Group,
                id: 'test-group'
            } as RegistryItem;

            // Mock: No rules configured initially
            mockRegistryService.getGroupRules.mockResolvedValue([]);

            // Mock: User selects "Validity Rule"
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: RuleType.VALIDITY })
                // Mock: User selects "Enable"
                .mockResolvedValueOnce({ value: 'enable' })
                // Mock: User selects "FULL" config
                .mockResolvedValueOnce({ value: 'FULL' });

            mockRegistryService.createGroupRule.mockResolvedValue({
                ruleType: RuleType.VALIDITY,
                config: 'FULL'
            });

            await manageRulesCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockRegistryService.getGroupRules).toHaveBeenCalledWith('test-group');
            expect(mockRegistryService.createGroupRule).toHaveBeenCalledWith(
                'test-group',
                RuleType.VALIDITY,
                'FULL'
            );
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should update existing group rule configuration', async () => {
            const groupNode: RegistryItem = {
                label: 'test-group',
                type: RegistryItemType.Group,
                id: 'test-group'
            } as RegistryItem;

            // Mock: COMPATIBILITY rule already exists
            mockRegistryService.getGroupRules.mockResolvedValue([RuleType.COMPATIBILITY]);
            mockRegistryService.getGroupRule.mockResolvedValue({
                ruleType: RuleType.COMPATIBILITY,
                config: 'BACKWARD'
            });

            // Mock: User selects "Compatibility Rule"
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: RuleType.COMPATIBILITY })
                // Mock: User selects "Configure"
                .mockResolvedValueOnce({ value: 'configure' })
                // Mock: User changes to "FULL"
                .mockResolvedValueOnce({ value: 'FULL' });

            mockRegistryService.updateGroupRule.mockResolvedValue({
                ruleType: RuleType.COMPATIBILITY,
                config: 'FULL'
            });

            await manageRulesCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockRegistryService.updateGroupRule).toHaveBeenCalledWith(
                'test-group',
                RuleType.COMPATIBILITY,
                'FULL'
            );
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should disable group rule', async () => {
            const groupNode: RegistryItem = {
                label: 'test-group',
                type: RegistryItemType.Group,
                id: 'test-group'
            } as RegistryItem;

            // Mock: VALIDITY rule exists
            mockRegistryService.getGroupRules.mockResolvedValue([RuleType.VALIDITY]);
            mockRegistryService.getGroupRule.mockResolvedValue({
                ruleType: RuleType.VALIDITY,
                config: 'FULL'
            });

            // Mock: User selects "Validity Rule"
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: RuleType.VALIDITY })
                // Mock: User selects "Disable"
                .mockResolvedValueOnce({ value: 'disable' });

            await manageRulesCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockRegistryService.deleteGroupRule).toHaveBeenCalledWith(
                'test-group',
                RuleType.VALIDITY
            );
            expect(mockRefresh).toHaveBeenCalled();
        });
    });

    describe('Artifact Rules Management', () => {
        it('should manage rules for an artifact', async () => {
            const artifactNode: RegistryItem = {
                label: 'test-artifact',
                type: RegistryItemType.Artifact,
                id: 'test-artifact',
                groupId: 'test-group'
            } as RegistryItem;

            // Mock: No rules configured
            mockRegistryService.getArtifactRules.mockResolvedValue([]);

            // Mock: User enables COMPATIBILITY rule
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: RuleType.COMPATIBILITY })
                .mockResolvedValueOnce({ value: 'enable' })
                .mockResolvedValueOnce({ value: 'BACKWARD' });

            mockRegistryService.createArtifactRule.mockResolvedValue({
                ruleType: RuleType.COMPATIBILITY,
                config: 'BACKWARD'
            });

            await manageRulesCommand(mockRegistryService, mockRefresh, artifactNode);

            expect(mockRegistryService.getArtifactRules).toHaveBeenCalledWith(
                'test-group',
                'test-artifact'
            );
            expect(mockRegistryService.createArtifactRule).toHaveBeenCalledWith(
                'test-group',
                'test-artifact',
                RuleType.COMPATIBILITY,
                'BACKWARD'
            );
            expect(mockRefresh).toHaveBeenCalled();
        });

        it('should update existing artifact rule', async () => {
            const artifactNode: RegistryItem = {
                label: 'test-artifact',
                type: RegistryItemType.Artifact,
                id: 'test-artifact',
                groupId: 'test-group'
            } as RegistryItem;

            mockRegistryService.getArtifactRules.mockResolvedValue([RuleType.INTEGRITY]);
            mockRegistryService.getArtifactRule.mockResolvedValue({
                ruleType: RuleType.INTEGRITY,
                config: 'REFS_EXIST'
            });

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: RuleType.INTEGRITY })
                .mockResolvedValueOnce({ value: 'configure' })
                .mockResolvedValueOnce({ value: 'ALL_REFS_MAPPED' });

            mockRegistryService.updateArtifactRule.mockResolvedValue({
                ruleType: RuleType.INTEGRITY,
                config: 'ALL_REFS_MAPPED'
            });

            await manageRulesCommand(mockRegistryService, mockRefresh, artifactNode);

            expect(mockRegistryService.updateArtifactRule).toHaveBeenCalledWith(
                'test-group',
                'test-artifact',
                RuleType.INTEGRITY,
                'ALL_REFS_MAPPED'
            );
        });
    });

    describe('Global Rules Management', () => {
        it('should manage global rules', async () => {
            const globalNode: RegistryItem = {
                label: 'Global Rules',
                type: RegistryItemType.Connection,
                id: 'global'
            } as RegistryItem;

            mockRegistryService.getGlobalRules.mockResolvedValue([]);

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: RuleType.VALIDITY })
                .mockResolvedValueOnce({ value: 'enable' })
                .mockResolvedValueOnce({ value: 'SYNTAX_ONLY' });

            mockRegistryService.createGlobalRule.mockResolvedValue({
                ruleType: RuleType.VALIDITY,
                config: 'SYNTAX_ONLY'
            });

            await manageRulesCommand(mockRegistryService, mockRefresh, globalNode, true);

            expect(mockRegistryService.getGlobalRules).toHaveBeenCalled();
            expect(mockRegistryService.createGlobalRule).toHaveBeenCalledWith(
                RuleType.VALIDITY,
                'SYNTAX_ONLY'
            );
            expect(mockRefresh).toHaveBeenCalled();
        });
    });

    describe('User Cancellation', () => {
        it('should handle cancellation at rule selection', async () => {
            const groupNode: RegistryItem = {
                label: 'test-group',
                type: RegistryItemType.Group,
                id: 'test-group'
            } as RegistryItem;

            mockRegistryService.getGroupRules.mockResolvedValue([]);

            // Mock: User cancels at rule selection
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce(undefined);

            await manageRulesCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockRegistryService.createGroupRule).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle cancellation at action selection', async () => {
            const groupNode: RegistryItem = {
                label: 'test-group',
                type: RegistryItemType.Group,
                id: 'test-group'
            } as RegistryItem;

            mockRegistryService.getGroupRules.mockResolvedValue([RuleType.VALIDITY]);
            mockRegistryService.getGroupRule.mockResolvedValue({
                ruleType: RuleType.VALIDITY,
                config: 'FULL'
            });

            // Mock: User selects rule, then cancels at action
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: RuleType.VALIDITY })
                .mockResolvedValueOnce(undefined);

            await manageRulesCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockRegistryService.updateGroupRule).not.toHaveBeenCalled();
            expect(mockRegistryService.deleteGroupRule).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should handle cancellation at config selection', async () => {
            const groupNode: RegistryItem = {
                label: 'test-group',
                type: RegistryItemType.Group,
                id: 'test-group'
            } as RegistryItem;

            mockRegistryService.getGroupRules.mockResolvedValue([]);

            // Mock: User enables rule but cancels config selection
            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: RuleType.COMPATIBILITY })
                .mockResolvedValueOnce({ value: 'enable' })
                .mockResolvedValueOnce(undefined);

            await manageRulesCommand(mockRegistryService, mockRefresh, groupNode);

            expect(mockRegistryService.createGroupRule).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle missing group ID', async () => {
            const invalidNode: RegistryItem = {
                label: 'invalid',
                type: RegistryItemType.Group,
                id: undefined
            } as any;

            await manageRulesCommand(mockRegistryService, mockRefresh, invalidNode);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Invalid node')
            );
        });

        it('should handle API errors gracefully', async () => {
            const groupNode: RegistryItem = {
                label: 'test-group',
                type: RegistryItemType.Group,
                id: 'test-group'
            } as RegistryItem;

            mockRegistryService.getGroupRules.mockRejectedValue(new Error('API Error'));

            await manageRulesCommand(mockRegistryService, mockRefresh, groupNode);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Failed to manage rules')
            );
        });

        it('should handle rule creation errors', async () => {
            const groupNode: RegistryItem = {
                label: 'test-group',
                type: RegistryItemType.Group,
                id: 'test-group'
            } as RegistryItem;

            mockRegistryService.getGroupRules.mockResolvedValue([]);

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: RuleType.VALIDITY })
                .mockResolvedValueOnce({ value: 'enable' })
                .mockResolvedValueOnce({ value: 'FULL' });

            mockRegistryService.createGroupRule.mockRejectedValue(
                new Error('Rule already exists')
            );

            await manageRulesCommand(mockRegistryService, mockRefresh, groupNode);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Failed to manage rules')
            );
            expect(mockRefresh).not.toHaveBeenCalled();
        });
    });

    describe('Rule Configuration Options', () => {
        it('should show correct VALIDITY config options', async () => {
            const groupNode: RegistryItem = {
                label: 'test-group',
                type: RegistryItemType.Group,
                id: 'test-group'
            } as RegistryItem;

            mockRegistryService.getGroupRules.mockResolvedValue([]);

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: RuleType.VALIDITY })
                .mockResolvedValueOnce({ value: 'enable' })
                .mockResolvedValueOnce({ value: 'SYNTAX_ONLY' });

            mockRegistryService.createGroupRule.mockResolvedValue({
                ruleType: RuleType.VALIDITY,
                config: 'SYNTAX_ONLY'
            });

            await manageRulesCommand(mockRegistryService, mockRefresh, groupNode);

            // Verify config options were shown
            const configCall = (vscode.window.showQuickPick as jest.Mock).mock.calls[2];
            expect(configCall[0]).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ value: 'SYNTAX_ONLY' }),
                    expect.objectContaining({ value: 'FULL' })
                ])
            );
        });

        it('should show correct COMPATIBILITY config options', async () => {
            const groupNode: RegistryItem = {
                label: 'test-group',
                type: RegistryItemType.Group,
                id: 'test-group'
            } as RegistryItem;

            mockRegistryService.getGroupRules.mockResolvedValue([]);

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: RuleType.COMPATIBILITY })
                .mockResolvedValueOnce({ value: 'enable' })
                .mockResolvedValueOnce({ value: 'BACKWARD_TRANSITIVE' });

            mockRegistryService.createGroupRule.mockResolvedValue({
                ruleType: RuleType.COMPATIBILITY,
                config: 'BACKWARD_TRANSITIVE'
            });

            await manageRulesCommand(mockRegistryService, mockRefresh, groupNode);

            // Verify compatibility options were shown
            const configCall = (vscode.window.showQuickPick as jest.Mock).mock.calls[2];
            expect(configCall[0]).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ value: 'BACKWARD' }),
                    expect.objectContaining({ value: 'BACKWARD_TRANSITIVE' }),
                    expect.objectContaining({ value: 'FORWARD' }),
                    expect.objectContaining({ value: 'FORWARD_TRANSITIVE' }),
                    expect.objectContaining({ value: 'FULL' }),
                    expect.objectContaining({ value: 'FULL_TRANSITIVE' }),
                    expect.objectContaining({ value: 'NONE' })
                ])
            );
        });

        it('should show correct INTEGRITY config options', async () => {
            const groupNode: RegistryItem = {
                label: 'test-group',
                type: RegistryItemType.Group,
                id: 'test-group'
            } as RegistryItem;

            mockRegistryService.getGroupRules.mockResolvedValue([]);

            (vscode.window.showQuickPick as jest.Mock)
                .mockResolvedValueOnce({ value: RuleType.INTEGRITY })
                .mockResolvedValueOnce({ value: 'enable' })
                .mockResolvedValueOnce({ value: 'REFS_EXIST' });

            mockRegistryService.createGroupRule.mockResolvedValue({
                ruleType: RuleType.INTEGRITY,
                config: 'REFS_EXIST'
            });

            await manageRulesCommand(mockRegistryService, mockRefresh, groupNode);

            // Verify integrity options were shown
            const configCall = (vscode.window.showQuickPick as jest.Mock).mock.calls[2];
            expect(configCall[0]).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ value: 'NO_DUPLICATES' }),
                    expect.objectContaining({ value: 'ALL_REFS_MAPPED' }),
                    expect.objectContaining({ value: 'REFS_EXIST' })
                ])
            );
        });
    });
});
