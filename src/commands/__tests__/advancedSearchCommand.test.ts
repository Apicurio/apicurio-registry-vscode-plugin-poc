import * as vscode from 'vscode';
import { advancedSearchCommand, SearchMode } from '../advancedSearchCommand';
import { RegistryService } from '../../services/registryService';
import { RegistryTreeDataProvider } from '../../providers/registryTreeProvider';

// Mock vscode
jest.mock('vscode');

describe('Advanced Search Command', () => {
    let mockRegistryService: jest.Mocked<RegistryService>;
    let mockTreeProvider: jest.Mocked<RegistryTreeDataProvider>;
    let mockShowQuickPick: jest.Mock;
    let mockShowInputBox: jest.Mock;
    let mockShowInformationMessage: jest.Mock;
    let mockShowErrorMessage: jest.Mock;
    let mockWithProgress: jest.Mock;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock RegistryService
        mockRegistryService = {
            isConnected: jest.fn().mockReturnValue(true),
            searchArtifacts: jest.fn(),
            searchVersions: jest.fn(),
            searchGroups: jest.fn(),
        } as any;

        // Mock RegistryTreeDataProvider
        mockTreeProvider = {
            applySearchFilter: jest.fn(),
            clearSearchFilter: jest.fn(),
        } as any;

        // Mock vscode window functions
        mockShowQuickPick = jest.fn();
        mockShowInputBox = jest.fn();
        mockShowInformationMessage = jest.fn();
        mockShowErrorMessage = jest.fn();
        mockWithProgress = jest.fn();

        (vscode.window.showQuickPick as jest.Mock) = mockShowQuickPick;
        (vscode.window.showInputBox as jest.Mock) = mockShowInputBox;
        (vscode.window.showInformationMessage as jest.Mock) = mockShowInformationMessage;
        (vscode.window.showErrorMessage as jest.Mock) = mockShowErrorMessage;
        (vscode.window.withProgress as jest.Mock) = mockWithProgress;

        // Mock workspace configuration
        (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
            get: jest.fn((key: string, defaultValue: any) => {
                if (key === 'search.defaultLimit') return 50;
                return defaultValue;
            })
        });

        // Mock progress
        mockWithProgress.mockImplementation(async (options, task) => {
            return await task({ report: jest.fn() });
        });
    });

    describe('Search Mode Selection', () => {
        it('should show search mode options', async () => {
            mockShowQuickPick.mockResolvedValue(undefined); // User cancels

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowQuickPick).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ label: 'Artifact Search' }),
                    expect.objectContaining({ label: 'Version Search' }),
                    expect.objectContaining({ label: 'Group Search' })
                ]),
                expect.objectContaining({
                    placeHolder: expect.stringContaining('type of search')
                })
            );
        });

        it('should handle user cancellation at mode selection', async () => {
            mockShowQuickPick.mockResolvedValue(undefined);

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.searchArtifacts).not.toHaveBeenCalled();
        });

        it('should show error if not connected', async () => {
            mockRegistryService.isConnected.mockReturnValue(false);

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('connect to a registry')
            );
        });
    });

    describe('Multi-Field Artifact Search', () => {
        it('should allow adding multiple search criteria', async () => {
            // User selects Artifact Search mode
            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'Artifact Search', value: SearchMode.Artifact })
                // Add Name criterion
                .mockResolvedValueOnce({ label: 'Name', value: 'name' })
                // Add Description criterion
                .mockResolvedValueOnce({ label: 'Description', value: 'description' })
                // Done - Search Now
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            // Input values
            mockShowInputBox
                .mockResolvedValueOnce('User API') // name
                .mockResolvedValueOnce('user management'); // description

            mockRegistryService.searchArtifacts.mockResolvedValue([
                { artifactId: 'user-api', name: 'User API', groupId: 'default' }
            ] as any);

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.searchArtifacts).toHaveBeenCalledWith(
                {
                    name: 'User API',
                    description: 'user management'
                },
                50 // default limit
            );
        });

        it('should handle empty criteria list (user selects Done immediately)', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'Artifact Search', value: SearchMode.Artifact })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInformationMessage.mockResolvedValue(undefined);

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('No search criteria')
            );
            expect(mockRegistryService.searchArtifacts).not.toHaveBeenCalled();
        });

        it('should validate label format (key:value)', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'Artifact Search', value: SearchMode.Artifact })
                .mockResolvedValueOnce({ label: 'Labels (key:value)', value: 'labels' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('env:prod'); // valid label

            mockRegistryService.searchArtifacts.mockResolvedValue([]);

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            // Check that validateInput function was provided
            expect(mockShowInputBox).toHaveBeenCalledWith(
                expect.objectContaining({
                    validateInput: expect.any(Function)
                })
            );
        });

        it('should reject invalid label format', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'Artifact Search', value: SearchMode.Artifact })
                .mockResolvedValueOnce({ label: 'Labels (key:value)', value: 'labels' });

            mockShowInputBox.mockImplementation(async (options) => {
                // Test the validation function
                const validate = options?.validateInput;
                if (validate) {
                    expect(validate('invalid')).toBeTruthy(); // Should return error
                    expect(validate('key:value')).toBeUndefined(); // Should be valid
                    expect(validate('key=value')).toBeUndefined(); // Should be valid
                }
                return undefined; // User cancels
            });

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);
        });
    });

    describe('Version Search', () => {
        it('should search versions when mode selected', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'Version Search', value: SearchMode.Version })
                .mockResolvedValueOnce({ label: 'Version', value: 'version' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('1.0.0');

            mockRegistryService.searchVersions.mockResolvedValue([
                {
                    groupId: 'default',
                    artifactId: 'user-api',
                    version: '1.0.0',
                    state: 'ENABLED'
                }
            ] as any);

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.searchVersions).toHaveBeenCalledWith(
                { version: '1.0.0' },
                50
            );
        });

        it('should display version results with artifact context', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'Version Search', value: SearchMode.Version })
                .mockResolvedValueOnce({ label: 'Version', value: 'version' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' })
                .mockResolvedValueOnce(undefined); // Results QuickPick

            mockShowInputBox.mockResolvedValueOnce('1.0.0');

            mockRegistryService.searchVersions.mockResolvedValue([
                {
                    groupId: 'default',
                    artifactId: 'user-api',
                    version: '1.0.0',
                    globalId: 123,
                    state: 'ENABLED'
                }
            ] as any);

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            // Verify QuickPick called with results (4th call)
            expect(mockShowQuickPick).toHaveBeenCalledTimes(4);
            expect(mockShowQuickPick).toHaveBeenNthCalledWith(4,
                expect.arrayContaining([
                    expect.objectContaining({
                        label: expect.stringContaining('1.0.0'),
                        description: 'default/user-api'
                    })
                ]),
                expect.objectContaining({
                    title: expect.stringContaining('1 match')
                })
            );
        });

        it('should search versions by labels', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'Version Search', value: SearchMode.Version })
                .mockResolvedValueOnce({ label: 'Labels (key:value)', value: 'labels' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('release:stable');

            mockRegistryService.searchVersions.mockResolvedValue([]);

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.searchVersions).toHaveBeenCalledWith(
                { labels: 'release:stable' },
                50
            );
        });
    });

    describe('Group Search', () => {
        it('should search groups when mode selected', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'Group Search', value: SearchMode.Group })
                .mockResolvedValueOnce({ label: 'Group ID', value: 'groupId' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('com.example');

            mockRegistryService.searchGroups.mockResolvedValue([
                {
                    groupId: 'com.example.apis',
                    artifactCount: 5,
                    description: 'Example APIs'
                }
            ] as any);

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.searchGroups).toHaveBeenCalledWith(
                { groupId: 'com.example' },
                50
            );
        });

        it('should display group results with artifact counts', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'Group Search', value: SearchMode.Group })
                .mockResolvedValueOnce({ label: 'Description', value: 'description' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' })
                .mockResolvedValueOnce(undefined); // Results QuickPick

            mockShowInputBox.mockResolvedValueOnce('example');

            mockRegistryService.searchGroups.mockResolvedValue([
                {
                    groupId: 'com.example.apis',
                    artifactCount: 10,
                    description: 'Example APIs'
                }
            ] as any);

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            // Verify QuickPick called with results (4th call)
            expect(mockShowQuickPick).toHaveBeenCalledTimes(4);
            expect(mockShowQuickPick).toHaveBeenNthCalledWith(4,
                expect.arrayContaining([
                    expect.objectContaining({
                        label: expect.stringContaining('com.example.apis'),
                        description: '10 artifacts'
                    })
                ]),
                expect.objectContaining({
                    title: expect.stringContaining('1 match')
                })
            );
        });
    });

    describe('Error Handling', () => {
        it('should handle search API errors', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'Artifact Search', value: SearchMode.Artifact })
                .mockResolvedValueOnce({ label: 'Name', value: 'name' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('test');

            mockRegistryService.searchArtifacts.mockRejectedValue(
                new Error('Network error')
            );

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Network error'),
                expect.any(String)
            );
        });

        it('should show message when no results found', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'Artifact Search', value: SearchMode.Artifact })
                .mockResolvedValueOnce({ label: 'Name', value: 'name' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('nonexistent');

            mockRegistryService.searchArtifacts.mockResolvedValue([]);

            mockShowInformationMessage.mockResolvedValue(undefined);

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('No artifacts found'),
                expect.any(String)
            );
        });
    });

    describe('Configuration', () => {
        it('should use configured search limit', async () => {
            // Mock custom limit
            (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
                get: jest.fn((key: string, defaultValue: any) => {
                    if (key === 'search.defaultLimit') return 100;
                    return defaultValue;
                })
            });

            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'Artifact Search', value: SearchMode.Artifact })
                .mockResolvedValueOnce({ label: 'Name', value: 'name' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('test');
            mockRegistryService.searchArtifacts.mockResolvedValue([]);

            await advancedSearchCommand(mockRegistryService, mockTreeProvider);

            expect(mockRegistryService.searchArtifacts).toHaveBeenCalledWith(
                expect.any(Object),
                100 // custom limit
            );
        });
    });
});
