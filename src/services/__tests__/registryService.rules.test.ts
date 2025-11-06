import { RegistryService } from '../registryService';
import axios from 'axios';
import { RuleType, Rule } from '../../models/registryModels';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RegistryService - Rules Management', () => {
    let registryService: RegistryService;
    let mockClient: any;
    const baseURL = 'http://localhost:8080/apis/registry/v3';

    beforeEach(() => {
        registryService = new RegistryService();

        // Create mock axios instance
        mockClient = {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            defaults: {
                headers: {
                    common: {}
                }
            }
        };

        mockedAxios.create = jest.fn().mockReturnValue(mockClient);

        // Set up connection
        registryService.setConnection({
            name: 'Test Registry',
            url: 'http://localhost:8080',
            authType: 'none'
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Global Rules', () => {
        describe('getGlobalRules', () => {
            it('should fetch all global rules', async () => {
                const mockRules: RuleType[] = [RuleType.VALIDITY, RuleType.COMPATIBILITY];
                mockClient.get.mockResolvedValue({ data: mockRules });

                const rules = await registryService.getGlobalRules();

                expect(mockClient.get).toHaveBeenCalledWith('/admin/rules');
                expect(rules).toEqual(mockRules);
            });
        });

        describe('getGlobalRule', () => {
            it('should fetch a specific global rule', async () => {
                const mockRule: Rule = { ruleType: RuleType.VALIDITY, config: 'FULL' };
                mockClient.get.mockResolvedValue({ data: mockRule });

                const rule = await registryService.getGlobalRule(RuleType.VALIDITY);

                expect(mockClient.get).toHaveBeenCalledWith(`/admin/rules/VALIDITY`);
                expect(rule).toEqual(mockRule);
            });
        });

        describe('createGlobalRule', () => {
            it('should create a global rule', async () => {
                const mockRule: Rule = { ruleType: RuleType.VALIDITY, config: 'FULL' };
                mockClient.post.mockResolvedValue({ data: mockRule });

                const rule = await registryService.createGlobalRule(RuleType.VALIDITY, 'FULL');

                expect(mockClient.post).toHaveBeenCalledWith(
                    `/admin/rules`,
                    { ruleType: 'VALIDITY', config: 'FULL' }
                );
                expect(rule).toEqual(mockRule);
            });
        });

        describe('updateGlobalRule', () => {
            it('should update a global rule configuration', async () => {
                const mockRule: Rule = { ruleType: RuleType.COMPATIBILITY, config: 'BACKWARD' };
                mockClient.put.mockResolvedValue({ data: mockRule });

                const rule = await registryService.updateGlobalRule(RuleType.COMPATIBILITY, 'BACKWARD');

                expect(mockClient.put).toHaveBeenCalledWith(
                    `/admin/rules/COMPATIBILITY`,
                    { config: 'BACKWARD' }
                );
                expect(rule).toEqual(mockRule);
            });
        });

        describe('deleteGlobalRule', () => {
            it('should delete a global rule', async () => {
                mockClient.delete.mockResolvedValue({ data: null });

                await registryService.deleteGlobalRule(RuleType.INTEGRITY);

                expect(mockClient.delete).toHaveBeenCalledWith(`/admin/rules/INTEGRITY`);
            });
        });
    });

    describe('Group Rules', () => {
        const groupId = 'test-group';

        describe('getGroupRules', () => {
            it('should fetch all group rules', async () => {
                const mockRules: RuleType[] = [RuleType.VALIDITY];
                mockClient.get.mockResolvedValue({ data: mockRules });

                const rules = await registryService.getGroupRules(groupId);

                expect(mockClient.get).toHaveBeenCalledWith(`/groups/${groupId}/rules`);
                expect(rules).toEqual(mockRules);
            });
        });

        describe('getGroupRule', () => {
            it('should fetch a specific group rule', async () => {
                const mockRule: Rule = { ruleType: RuleType.COMPATIBILITY, config: 'BACKWARD' };
                mockClient.get.mockResolvedValue({ data: mockRule });

                const rule = await registryService.getGroupRule(groupId, RuleType.COMPATIBILITY);

                expect(mockClient.get).toHaveBeenCalledWith(`/groups/${groupId}/rules/COMPATIBILITY`);
                expect(rule).toEqual(mockRule);
            });
        });

        describe('createGroupRule', () => {
            it('should create a group rule', async () => {
                const mockRule: Rule = { ruleType: RuleType.VALIDITY, config: 'SYNTAX_ONLY' };
                mockClient.post.mockResolvedValue({ data: mockRule });

                const rule = await registryService.createGroupRule(groupId, RuleType.VALIDITY, 'SYNTAX_ONLY');

                expect(mockClient.post).toHaveBeenCalledWith(
                    `/groups/${groupId}/rules`,
                    { ruleType: 'VALIDITY', config: 'SYNTAX_ONLY' }
                );
                expect(rule).toEqual(mockRule);
            });
        });

        describe('updateGroupRule', () => {
            it('should update a group rule configuration', async () => {
                const mockRule: Rule = { ruleType: RuleType.COMPATIBILITY, config: 'FULL' };
                mockClient.put.mockResolvedValue({ data: mockRule });

                const rule = await registryService.updateGroupRule(groupId, RuleType.COMPATIBILITY, 'FULL');

                expect(mockClient.put).toHaveBeenCalledWith(
                    `/groups/${groupId}/rules/COMPATIBILITY`,
                    { config: 'FULL' }
                );
                expect(rule).toEqual(mockRule);
            });
        });

        describe('deleteGroupRule', () => {
            it('should delete a group rule', async () => {
                mockClient.delete.mockResolvedValue({ data: null });

                await registryService.deleteGroupRule(groupId, RuleType.VALIDITY);

                expect(mockClient.delete).toHaveBeenCalledWith(`/groups/${groupId}/rules/VALIDITY`);
            });
        });
    });

    describe('Artifact Rules', () => {
        const groupId = 'test-group';
        const artifactId = 'test-artifact';

        describe('getArtifactRules', () => {
            it('should fetch all artifact rules', async () => {
                const mockRules: RuleType[] = [RuleType.VALIDITY, RuleType.COMPATIBILITY, RuleType.INTEGRITY];
                mockClient.get.mockResolvedValue({ data: mockRules });

                const rules = await registryService.getArtifactRules(groupId, artifactId);

                expect(mockClient.get).toHaveBeenCalledWith(
                    `/groups/${groupId}/artifacts/${artifactId}/rules`
                );
                expect(rules).toEqual(mockRules);
            });
        });

        describe('getArtifactRule', () => {
            it('should fetch a specific artifact rule', async () => {
                const mockRule: Rule = { ruleType: RuleType.INTEGRITY, config: 'REFS_EXIST' };
                mockClient.get.mockResolvedValue({ data: mockRule });

                const rule = await registryService.getArtifactRule(groupId, artifactId, RuleType.INTEGRITY);

                expect(mockClient.get).toHaveBeenCalledWith(
                    `/groups/${groupId}/artifacts/${artifactId}/rules/INTEGRITY`
                );
                expect(rule).toEqual(mockRule);
            });
        });

        describe('createArtifactRule', () => {
            it('should create an artifact rule', async () => {
                const mockRule: Rule = { ruleType: RuleType.COMPATIBILITY, config: 'BACKWARD_TRANSITIVE' };
                mockClient.post.mockResolvedValue({ data: mockRule });

                const rule = await registryService.createArtifactRule(
                    groupId,
                    artifactId,
                    RuleType.COMPATIBILITY,
                    'BACKWARD_TRANSITIVE'
                );

                expect(mockClient.post).toHaveBeenCalledWith(
                    `/groups/${groupId}/artifacts/${artifactId}/rules`,
                    { ruleType: 'COMPATIBILITY', config: 'BACKWARD_TRANSITIVE' }
                );
                expect(rule).toEqual(mockRule);
            });
        });

        describe('updateArtifactRule', () => {
            it('should update an artifact rule configuration', async () => {
                const mockRule: Rule = { ruleType: RuleType.VALIDITY, config: 'FULL' };
                mockClient.put.mockResolvedValue({ data: mockRule });

                const rule = await registryService.updateArtifactRule(
                    groupId,
                    artifactId,
                    RuleType.VALIDITY,
                    'FULL'
                );

                expect(mockClient.put).toHaveBeenCalledWith(
                    `/groups/${groupId}/artifacts/${artifactId}/rules/VALIDITY`,
                    { config: 'FULL' }
                );
                expect(rule).toEqual(mockRule);
            });
        });

        describe('deleteArtifactRule', () => {
            it('should delete an artifact rule', async () => {
                mockClient.delete.mockResolvedValue({ data: null });

                await registryService.deleteArtifactRule(groupId, artifactId, RuleType.COMPATIBILITY);

                expect(mockClient.delete).toHaveBeenCalledWith(
                    `/groups/${groupId}/artifacts/${artifactId}/rules/COMPATIBILITY`
                );
            });
        });
    });
});
