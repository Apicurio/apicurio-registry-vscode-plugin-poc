import * as vscode from 'vscode';
import { searchCommand, SearchMode } from '../searchCommand';
import { RegistryService } from '../../services/registryService';
import { RegistryTreeDataProvider } from '../../providers/registryTreeProvider';

// Mock vscode
jest.mock('vscode');

describe('Unified Search Command', () => {
    let mockRegistryService: jest.Mocked<RegistryService>;
    let mockTreeProvider: jest.Mocked<RegistryTreeDataProvider>;
    let mockShowQuickPick: jest.Mock;
    let mockShowInputBox: jest.Mock;
    let mockShowInformationMessage: jest.Mock;
    let mockShowErrorMessage: jest.Mock;

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
        // Mock as thenable promises to avoid .then() errors
        mockShowInformationMessage = jest.fn().mockResolvedValue(undefined);
        mockShowErrorMessage = jest.fn().mockResolvedValue(undefined);

        (vscode.window.showQuickPick as jest.Mock) = mockShowQuickPick;
        (vscode.window.showInputBox as jest.Mock) = mockShowInputBox;
        (vscode.window.showInformationMessage as jest.Mock) = mockShowInformationMessage;
        (vscode.window.showErrorMessage as jest.Mock) = mockShowErrorMessage;
    });

    describe('Search Type Selection', () => {
        it('should show quick vs advanced search options', async () => {
            mockShowQuickPick.mockResolvedValue(undefined); // User cancels

            await searchCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowQuickPick).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ label: expect.stringContaining('Quick Search') }),
                    expect.objectContaining({ label: expect.stringContaining('Advanced Search') })
                ]),
                expect.objectContaining({
                    title: 'Search Registry'
                })
            );
        });

        it('should handle user cancellation at type selection', async () => {
            mockShowQuickPick.mockResolvedValue(undefined);

            await searchCommand(mockRegistryService, mockTreeProvider);

            expect(mockTreeProvider.applySearchFilter).not.toHaveBeenCalled();
        });

        it('should show error if not connected', async () => {
            mockRegistryService.isConnected.mockReturnValue(false);

            await searchCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('connect to a registry')
            );
        });
    });

    describe('Quick Search Flow', () => {
        it('should perform single-field artifact search', async () => {
            // User selects Quick Search
            mockShowQuickPick
                .mockResolvedValueOnce({ label: '$(search) Quick Search', value: 'quick' })
                .mockResolvedValueOnce({ label: 'Name', value: 'name' });

            mockShowInputBox.mockResolvedValueOnce('User API');
            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchCommand(mockRegistryService, mockTreeProvider);

            // Verify tree provider filter was applied
            expect(mockTreeProvider.applySearchFilter).toHaveBeenCalledWith(
                SearchMode.Artifact,
                { name: 'User API' }
            );

            // Verify information message shown
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Filtering artifacts by:'),
                'Clear Filter'
            );
        });
    });

    describe('Advanced Search - Multi-Field Artifact Search', () => {
        it('should allow adding multiple search criteria', async () => {
            // User selects Advanced Search
            mockShowQuickPick
                .mockResolvedValueOnce({ label: '$(filter) Advanced Search', value: 'advanced' })
                // Then Artifact Search mode
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

            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchCommand(mockRegistryService, mockTreeProvider);

            // Verify tree provider filter was applied
            expect(mockTreeProvider.applySearchFilter).toHaveBeenCalledWith(
                SearchMode.Artifact,
                {
                    name: 'User API',
                    description: 'user management'
                }
            );

            // Verify information message shown with filter details
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Filtering artifacts by:'),
                'Clear Filter'
            );

            // Verify QuickPick calls: type selection + mode + 2 criteria + done = 5
            expect(mockShowQuickPick).toHaveBeenCalledTimes(5);
        });

        it('should handle empty criteria list (user selects Done immediately)', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: '$(filter) Advanced Search', value: 'advanced' })
                .mockResolvedValueOnce({ label: 'Artifact Search', value: SearchMode.Artifact })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('No search criteria')
            );
            expect(mockRegistryService.searchArtifacts).not.toHaveBeenCalled();
        });

        it('should validate label format (key:value)', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: '$(filter) Advanced Search', value: 'advanced' })
                .mockResolvedValueOnce({ label: 'Artifact Search', value: SearchMode.Artifact })
                .mockResolvedValueOnce({ label: 'Labels (key:value)', value: 'labels' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('env:prod'); // valid label

            mockRegistryService.searchArtifacts.mockResolvedValue([]);

            await searchCommand(mockRegistryService, mockTreeProvider);

            // Check that validateInput function was provided
            expect(mockShowInputBox).toHaveBeenCalledWith(
                expect.objectContaining({
                    validateInput: expect.any(Function)
                })
            );
        });

        it('should reject invalid label format', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: '$(filter) Advanced Search', value: 'advanced' })
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

            await searchCommand(mockRegistryService, mockTreeProvider);
        });
    });

    describe('Advanced Search - Version Search', () => {
        it('should search versions when mode selected', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: '$(filter) Advanced Search', value: 'advanced' })
                .mockResolvedValueOnce({ label: 'Version Search', value: SearchMode.Version })
                .mockResolvedValueOnce({ label: 'Version', value: 'version' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('1.0.0');
            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchCommand(mockRegistryService, mockTreeProvider);

            // Verify tree provider filter was applied
            expect(mockTreeProvider.applySearchFilter).toHaveBeenCalledWith(
                SearchMode.Version,
                { version: '1.0.0' }
            );

            // Verify information message shown
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Filtering versions by:'),
                'Clear Filter'
            );
        });

        it('should apply tree filter for version results', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: '$(filter) Advanced Search', value: 'advanced' })
                .mockResolvedValueOnce({ label: 'Version Search', value: SearchMode.Version })
                .mockResolvedValueOnce({ label: 'Version', value: 'version' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('1.0.0');
            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchCommand(mockRegistryService, mockTreeProvider);

            // Verify tree provider filter applied (not QuickPick display)
            expect(mockTreeProvider.applySearchFilter).toHaveBeenCalledWith(
                SearchMode.Version,
                { version: '1.0.0' }
            );

            // Verify QuickPick calls: type selection + mode + criterion + done = 4
            expect(mockShowQuickPick).toHaveBeenCalledTimes(4);
        });

        it('should search versions by labels', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: '$(filter) Advanced Search', value: 'advanced' })
                .mockResolvedValueOnce({ label: 'Version Search', value: SearchMode.Version })
                .mockResolvedValueOnce({ label: 'Labels (key:value)', value: 'labels' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('release:stable');
            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchCommand(mockRegistryService, mockTreeProvider);

            expect(mockTreeProvider.applySearchFilter).toHaveBeenCalledWith(
                SearchMode.Version,
                { labels: 'release:stable' }
            );
        });
    });

    describe('Advanced Search - Group Search', () => {
        it('should search groups when mode selected', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: '$(filter) Advanced Search', value: 'advanced' })
                .mockResolvedValueOnce({ label: 'Group Search', value: SearchMode.Group })
                .mockResolvedValueOnce({ label: 'Group ID', value: 'groupId' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('com.example');
            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchCommand(mockRegistryService, mockTreeProvider);

            // Verify tree provider filter was applied
            expect(mockTreeProvider.applySearchFilter).toHaveBeenCalledWith(
                SearchMode.Group,
                { groupId: 'com.example' }
            );

            // Verify information message shown
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Filtering groups by:'),
                'Clear Filter'
            );
        });

        it('should apply tree filter for group results', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: '$(filter) Advanced Search', value: 'advanced' })
                .mockResolvedValueOnce({ label: 'Group Search', value: SearchMode.Group })
                .mockResolvedValueOnce({ label: 'Description', value: 'description' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('example');
            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchCommand(mockRegistryService, mockTreeProvider);

            // Verify tree provider filter applied (not QuickPick display)
            expect(mockTreeProvider.applySearchFilter).toHaveBeenCalledWith(
                SearchMode.Group,
                { description: 'example' }
            );

            // Verify QuickPick calls: type selection + mode + criterion + done = 4
            expect(mockShowQuickPick).toHaveBeenCalledTimes(4);
        });
    });

    describe('Error Handling', () => {
        it('should handle tree provider filter errors', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: '$(filter) Advanced Search', value: 'advanced' })
                .mockResolvedValueOnce({ label: 'Artifact Search', value: SearchMode.Artifact })
                .mockResolvedValueOnce({ label: 'Name', value: 'name' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('test');

            // Tree provider rejects the filter operation
            mockTreeProvider.applySearchFilter.mockRejectedValue(
                new Error('Network error')
            );

            await searchCommand(mockRegistryService, mockTreeProvider);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Network error'),
                expect.any(String)
            );
        });

        it('should handle empty criteria list', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: '$(filter) Advanced Search', value: 'advanced' })
                .mockResolvedValueOnce({ label: 'Artifact Search', value: SearchMode.Artifact })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchCommand(mockRegistryService, mockTreeProvider);

            // Verify no filter applied for empty criteria
            expect(mockTreeProvider.applySearchFilter).not.toHaveBeenCalled();
            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('No search criteria')
            );
        });
    });

    describe('Clear Filter Functionality', () => {
        it('should allow clearing filter from info message', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: '$(filter) Advanced Search', value: 'advanced' })
                .mockResolvedValueOnce({ label: 'Artifact Search', value: SearchMode.Artifact })
                .mockResolvedValueOnce({ label: 'Name', value: 'name' })
                .mockResolvedValueOnce({ label: '✅ Done - Search Now', value: 'done' });

            mockShowInputBox.mockResolvedValueOnce('test');

            // User clicks "Clear Filter" button
            mockShowInformationMessage.mockImplementation(async (message, ...buttons) => {
                // Simulate user clicking "Clear Filter"
                if (buttons.includes('Clear Filter')) {
                    return 'Clear Filter';
                }
                return undefined;
            });

            await searchCommand(mockRegistryService, mockTreeProvider);

            // Wait for promise chain to complete
            await new Promise(resolve => setTimeout(resolve, 0));

            // Verify filter was applied
            expect(mockTreeProvider.applySearchFilter).toHaveBeenCalledWith(
                SearchMode.Artifact,
                { name: 'test' }
            );

            // Verify clear filter was called
            expect(mockTreeProvider.clearSearchFilter).toHaveBeenCalled();
        });
    });
});
