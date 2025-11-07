import * as vscode from 'vscode';
import { createCommand } from '../createCommand';
import { createArtifactCommand } from '../createArtifactCommand';
import { createGroupCommand } from '../groupCommands';

// Mock vscode
jest.mock('vscode', () => ({
    window: {
        showQuickPick: jest.fn()
    }
}));

// Mock the underlying commands
jest.mock('../createArtifactCommand');
jest.mock('../groupCommands');

describe('createCommand', () => {
    let mockShowQuickPick: jest.Mock;
    let mockCreateArtifactCommand: jest.Mock;
    let mockCreateGroupCommand: jest.Mock;
    let mockRegistryService: any;
    let mockTreeProvider: any;

    beforeEach(() => {
        mockShowQuickPick = vscode.window.showQuickPick as jest.Mock;
        mockCreateArtifactCommand = createArtifactCommand as jest.Mock;
        mockCreateGroupCommand = createGroupCommand as jest.Mock;

        // Create mock instances
        mockRegistryService = {} as any;
        mockTreeProvider = {} as any;

        jest.clearAllMocks();
    });

    it('should show QuickPick with artifact and group options', async () => {
        mockShowQuickPick.mockResolvedValue(undefined); // User cancels

        await createCommand(mockRegistryService, mockTreeProvider);

        expect(mockShowQuickPick).toHaveBeenCalledWith(
            [
                {
                    label: '$(file-code) Create Artifact',
                    description: 'Create a new artifact (API schema, AsyncAPI, Protobuf, etc.)',
                    value: 'artifact'
                },
                {
                    label: '$(folder) Create Group',
                    description: 'Create a new group to organize artifacts',
                    value: 'group'
                }
            ],
            {
                title: 'Create',
                placeHolder: 'What would you like to create?',
                ignoreFocusOut: true
            }
        );
    });

    it('should call createArtifactCommand when artifact is selected', async () => {
        mockShowQuickPick.mockResolvedValue({
            label: '$(file-code) Create Artifact',
            value: 'artifact'
        });

        await createCommand(mockRegistryService, mockTreeProvider);

        expect(mockCreateArtifactCommand).toHaveBeenCalledWith(mockRegistryService, mockTreeProvider);
        expect(mockCreateGroupCommand).not.toHaveBeenCalled();
    });

    it('should call createGroupCommand when group is selected', async () => {
        mockShowQuickPick.mockResolvedValue({
            label: '$(folder) Create Group',
            value: 'group'
        });

        await createCommand(mockRegistryService, mockTreeProvider);

        expect(mockCreateGroupCommand).toHaveBeenCalledWith(mockRegistryService, mockTreeProvider);
        expect(mockCreateArtifactCommand).not.toHaveBeenCalled();
    });

    it('should do nothing when user cancels', async () => {
        mockShowQuickPick.mockResolvedValue(undefined);

        await createCommand(mockRegistryService, mockTreeProvider);

        expect(mockCreateArtifactCommand).not.toHaveBeenCalled();
        expect(mockCreateGroupCommand).not.toHaveBeenCalled();
    });

});
