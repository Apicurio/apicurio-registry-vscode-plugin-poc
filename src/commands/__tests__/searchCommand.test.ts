import * as vscode from 'vscode';
import { searchArtifactsCommand, SearchCriteria } from '../searchCommand';
import { RegistryService } from '../../services/registryService';
import { RegistryTreeDataProvider } from '../../providers/registryTreeProvider';

// Mock vscode
jest.mock('vscode');

// Mock dependencies
jest.mock('../../services/registryService');
jest.mock('../../providers/registryTreeProvider');

describe('searchArtifactsCommand', () => {
    let mockService: jest.Mocked<RegistryService>;
    let mockTreeProvider: jest.Mocked<RegistryTreeDataProvider>;
    let mockShowQuickPick: jest.SpyInstance;
    let mockShowInputBox: jest.SpyInstance;
    let mockShowErrorMessage: jest.SpyInstance;
    let mockShowInformationMessage: jest.SpyInstance;
    let mockWithProgress: jest.SpyInstance;

    beforeEach(() => {
        // Create mocks
        mockService = new RegistryService() as jest.Mocked<RegistryService>;
        mockTreeProvider = new RegistryTreeDataProvider(mockService) as jest.Mocked<RegistryTreeDataProvider>;

        // Mock VSCode window functions
        mockShowQuickPick = jest.spyOn(vscode.window, 'showQuickPick');
        mockShowInputBox = jest.spyOn(vscode.window, 'showInputBox');
        mockShowErrorMessage = jest.spyOn(vscode.window, 'showErrorMessage');
        mockShowInformationMessage = jest.spyOn(vscode.window, 'showInformationMessage');
        mockWithProgress = jest.spyOn(vscode.window, 'withProgress');

        // Mock tree provider methods
        mockTreeProvider.applySearchFilter = jest.fn();
        mockTreeProvider.clearSearchFilter = jest.fn();

        // Default: service is connected
        mockService.isConnected = jest.fn().mockReturnValue(true);
        mockService.searchArtifacts = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Connection Check', () => {
        it('should show error when not connected', async () => {
            mockService.isConnected = jest.fn().mockReturnValue(false);
            mockShowErrorMessage.mockResolvedValue(undefined);

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                'Please connect to a registry first before searching.'
            );
            expect(mockShowQuickPick).not.toHaveBeenCalled();
        });

        it('should proceed when connected', async () => {
            mockService.isConnected = jest.fn().mockReturnValue(true);
            mockShowQuickPick.mockResolvedValue(undefined); // User cancels

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockShowQuickPick).toHaveBeenCalled();
        });
    });

    describe('Search Criteria Selection', () => {
        it('should show all 6 search criteria options', async () => {
            mockShowQuickPick.mockResolvedValue(undefined);

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockShowQuickPick).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ label: 'Name' }),
                    expect.objectContaining({ label: 'Group' }),
                    expect.objectContaining({ label: 'Description' }),
                    expect.objectContaining({ label: 'Type' }),
                    expect.objectContaining({ label: 'State' }),
                    expect.objectContaining({ label: 'Labels' })
                ]),
                expect.objectContaining({
                    title: 'Search Artifacts - Step 1/2: Select Search Criteria'
                })
            );
        });

        it('should cancel when user dismisses criteria selection', async () => {
            mockShowQuickPick.mockResolvedValue(undefined);

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockShowInputBox).not.toHaveBeenCalled();
            expect(mockService.searchArtifacts).not.toHaveBeenCalled();
        });
    });

    describe('Search by Name', () => {
        it('should prompt for name input', async () => {
            mockShowQuickPick.mockResolvedValue({ label: 'Name', value: SearchCriteria.Name });
            mockShowInputBox.mockResolvedValue(undefined); // User cancels

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockShowInputBox).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Search Artifacts - Step 2/2: Enter Name',
                    prompt: 'Enter search term for name',
                    placeHolder: 'e.g., User API'
                })
            );
        });

        it('should validate name input length', async () => {
            mockShowQuickPick.mockResolvedValue({ label: 'Name', value: SearchCriteria.Name });
            mockShowInputBox.mockResolvedValue('A'); // Too short

            await searchArtifactsCommand(mockService, mockTreeProvider);

            const inputBoxCall = mockShowInputBox.mock.calls[0][0];
            const validator = inputBoxCall.validateInput;

            expect(validator('')).toBe('Name cannot be empty');
            expect(validator('A')).toBe('Name must be at least 2 characters');
            expect(validator('AB')).toBeNull();
        });
    });

    describe('Search by Type', () => {
        it('should show artifact type dropdown', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'Type', value: SearchCriteria.Type })
                .mockResolvedValueOnce(undefined); // User cancels type selection

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockShowQuickPick).toHaveBeenNthCalledWith(2,
                expect.arrayContaining([
                    expect.objectContaining({ label: 'OPENAPI' }),
                    expect.objectContaining({ label: 'ASYNCAPI' }),
                    expect.objectContaining({ label: 'AVRO' }),
                    expect.objectContaining({ label: 'PROTOBUF' }),
                    expect.objectContaining({ label: 'JSON' }),
                    expect.objectContaining({ label: 'GRAPHQL' }),
                    expect.objectContaining({ label: 'KCONNECT' }),
                    expect.objectContaining({ label: 'WSDL' }),
                    expect.objectContaining({ label: 'XSD' })
                ]),
                expect.objectContaining({
                    title: 'Search Artifacts - Step 2/2: Select Artifact Type'
                })
            );
        });
    });

    describe('Search by State', () => {
        it('should show state dropdown', async () => {
            mockShowQuickPick
                .mockResolvedValueOnce({ label: 'State', value: SearchCriteria.State })
                .mockResolvedValueOnce(undefined);

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockShowQuickPick).toHaveBeenNthCalledWith(2,
                expect.arrayContaining([
                    expect.objectContaining({ label: 'ENABLED' }),
                    expect.objectContaining({ label: 'DISABLED' }),
                    expect.objectContaining({ label: 'DEPRECATED' })
                ]),
                expect.objectContaining({
                    title: 'Search Artifacts - Step 2/2: Select State'
                })
            );
        });
    });

    describe('Search by Labels', () => {
        it('should prompt for label in key=value format', async () => {
            mockShowQuickPick.mockResolvedValue({ label: 'Labels', value: SearchCriteria.Labels });
            mockShowInputBox.mockResolvedValue(undefined);

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockShowInputBox).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Search Artifacts - Step 2/2: Enter Label',
                    prompt: 'Enter label in format: key=value',
                    placeHolder: 'e.g., environment=production'
                })
            );
        });

        it('should validate label format', async () => {
            mockShowQuickPick.mockResolvedValue({ label: 'Labels', value: SearchCriteria.Labels });
            mockShowInputBox.mockResolvedValue('invalid');

            await searchArtifactsCommand(mockService, mockTreeProvider);

            const inputBoxCall = mockShowInputBox.mock.calls[0][0];
            const validator = inputBoxCall.validateInput;

            expect(validator('invalid')).toBe('Label must be in format: key=value');
            expect(validator('key=value')).toBeNull();
        });
    });

    describe('Search Execution', () => {
        it('should execute search with selected criteria', async () => {
            const mockResults = [
                {
                    groupId: 'test',
                    artifactId: 'api',
                    artifactType: 'OPENAPI',
                    state: 'ENABLED'
                }
            ];

            mockShowQuickPick.mockResolvedValue({ label: 'Name', value: SearchCriteria.Name });
            mockShowInputBox.mockResolvedValue('test');
            mockService.searchArtifacts = jest.fn().mockResolvedValue(mockResults);
            mockWithProgress.mockImplementation((options, task) => task({ report: jest.fn() }));
            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockService.searchArtifacts).toHaveBeenCalledWith({ name: 'test' });
            expect(mockTreeProvider.applySearchFilter).toHaveBeenCalledWith('name', 'test');
        });

        it('should show progress indicator during search', async () => {
            mockShowQuickPick.mockResolvedValue({ label: 'Name', value: SearchCriteria.Name });
            mockShowInputBox.mockResolvedValue('test');
            mockService.searchArtifacts = jest.fn().mockResolvedValue([]);
            mockWithProgress.mockImplementation((options, task) => task({ report: jest.fn() }));
            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockWithProgress).toHaveBeenCalledWith(
                expect.objectContaining({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Searching for artifacts...'
                }),
                expect.any(Function)
            );
        });

        it('should show results count notification', async () => {
            const mockResults = [{ groupId: 'test', artifactId: 'api1' }];

            mockShowQuickPick.mockResolvedValue({ label: 'Type', value: SearchCriteria.Type });
            mockShowQuickPick.mockResolvedValueOnce({ label: 'Name', value: SearchCriteria.Name });
            mockShowQuickPick.mockResolvedValueOnce({ label: 'OPENAPI' });
            mockService.searchArtifacts = jest.fn().mockResolvedValue(mockResults);
            mockWithProgress.mockImplementation((options, task) => task({ report: jest.fn() }));
            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Found 1 artifact'),
                'Clear Filter'
            );
        });

        it('should handle plural in results notification', async () => {
            const mockResults = [
                { groupId: 'test', artifactId: 'api1' },
                { groupId: 'test', artifactId: 'api2' }
            ];

            mockShowQuickPick.mockResolvedValue({ label: 'Name', value: SearchCriteria.Name });
            mockShowInputBox.mockResolvedValue('api');
            mockService.searchArtifacts = jest.fn().mockResolvedValue(mockResults);
            mockWithProgress.mockImplementation((options, task) => task({ report: jest.fn() }));
            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Found 2 artifacts'),
                'Clear Filter'
            );
        });
    });

    describe('No Results Handling', () => {
        it('should show message when no results found', async () => {
            mockShowQuickPick.mockResolvedValue({ label: 'Name', value: SearchCriteria.Name });
            mockShowInputBox.mockResolvedValue('nonexistent');
            mockService.searchArtifacts = jest.fn().mockResolvedValue([]);
            mockWithProgress.mockImplementation((options, task) => task({ report: jest.fn() }));
            mockShowInformationMessage.mockResolvedValue(undefined);

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockShowInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('No artifacts found'),
                'Try Again'
            );
        });

        it('should allow retry when no results', async () => {
            mockShowQuickPick.mockResolvedValue({ label: 'Name', value: SearchCriteria.Name });
            mockShowInputBox.mockResolvedValue('test');
            mockService.searchArtifacts = jest.fn().mockResolvedValue([]);
            mockWithProgress.mockImplementation((options, task) => task({ report: jest.fn() }));
            mockShowInformationMessage.mockResolvedValue('Try Again');

            await searchArtifactsCommand(mockService, mockTreeProvider);

            // Should attempt to run command again (recursive call)
            expect(mockShowInformationMessage).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should show error message on search failure', async () => {
            mockShowQuickPick.mockResolvedValue({ label: 'Name', value: SearchCriteria.Name });
            mockShowInputBox.mockResolvedValue('test');
            mockService.searchArtifacts = jest.fn().mockRejectedValue(new Error('Network error'));
            mockWithProgress.mockImplementation((options, task) => task({ report: jest.fn() }));
            mockShowErrorMessage.mockResolvedValue(undefined);

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Search failed'),
                'Try Again'
            );
        });

        it('should allow retry on error', async () => {
            mockShowQuickPick.mockResolvedValue({ label: 'Name', value: SearchCriteria.Name });
            mockShowInputBox.mockResolvedValue('test');
            mockService.searchArtifacts = jest.fn().mockRejectedValue(new Error('Network error'));
            mockWithProgress.mockImplementation((options, task) => task({ report: jest.fn() }));
            mockShowErrorMessage.mockResolvedValue('Try Again');

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockShowErrorMessage).toHaveBeenCalled();
        });
    });

    describe('Clear Filter', () => {
        it('should clear filter when user clicks Clear Filter button', async () => {
            const mockResults = [{ groupId: 'test', artifactId: 'api' }];

            mockShowQuickPick.mockResolvedValue({ label: 'Name', value: SearchCriteria.Name });
            mockShowInputBox.mockResolvedValue('test');
            mockService.searchArtifacts = jest.fn().mockResolvedValue(mockResults);
            mockWithProgress.mockImplementation((options, task) => task({ report: jest.fn() }));
            mockShowInformationMessage.mockResolvedValue('Clear Filter');

            await searchArtifactsCommand(mockService, mockTreeProvider);

            expect(mockTreeProvider.clearSearchFilter).toHaveBeenCalled();
        });
    });
});
