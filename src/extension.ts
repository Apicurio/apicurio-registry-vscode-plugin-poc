import * as vscode from 'vscode';
import { RegistryTreeDataProvider } from './providers/registryTreeProvider';
import { RegistryService } from './services/registryService';
import { ApicurioFileSystemProvider } from './providers/apicurioFileSystemProvider';
import { StatusBarManager } from './ui/statusBarManager';
import { ApicurioUriBuilder } from './utils/uriBuilder';
import { searchArtifactsCommand } from './commands/searchCommand';
import { createArtifactCommand } from './commands/createArtifactCommand';
import {
    copyGroupIdCommand,
    copyArtifactIdCommand,
    copyVersionCommand,
    copyFullReferenceCommand
} from './commands/copyCommands';
import {
    openArtifactCommand,
    openVersionCommand
} from './commands/openCommands';
import {
    changeArtifactStateCommand,
    changeVersionStateCommand
} from './commands/stateCommands';
import { downloadContentCommand } from './commands/downloadCommand';
import {
    deleteGroupCommand,
    deleteArtifactCommand,
    deleteVersionCommand
} from './commands/deleteCommands';
import {
    createDraftVersionCommand,
    finalizeDraftCommand,
    discardDraftCommand,
    editDraftMetadataCommand
} from './commands/draftCommands';

let registryTreeProvider: RegistryTreeDataProvider;
let registryService: RegistryService;

export function activate(context: vscode.ExtensionContext) {
    console.log('Apicurio Registry extension is now active!');

    // Initialize services
    registryService = new RegistryService();

    // Initialize tree data provider
    registryTreeProvider = new RegistryTreeDataProvider(registryService);

    // Register tree view
    const treeView = vscode.window.createTreeView('apicurioRegistry', {
        treeDataProvider: registryTreeProvider,
        showCollapseAll: true
    });

    // Register file system provider for Apicurio URIs
    const fileSystemProvider = new ApicurioFileSystemProvider(registryService);
    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider(
            ApicurioUriBuilder.SCHEME,
            fileSystemProvider,
            { isCaseSensitive: true }
        )
    );

    // Create status bar manager
    const statusBarManager = new StatusBarManager();
    context.subscriptions.push(statusBarManager);

    // Update status bar when active editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            statusBarManager.updateStatusBar(editor);
        })
    );

    // Update status bar for current editor
    statusBarManager.updateStatusBar(vscode.window.activeTextEditor);

    // Register commands
    const refreshCommand = vscode.commands.registerCommand('apicurioRegistry.refresh', () => {
        registryTreeProvider.refresh();
    });

    const connectCommand = vscode.commands.registerCommand('apicurioRegistry.connect', async () => {
        await connectToRegistry();
    });

    const disconnectCommand = vscode.commands.registerCommand('apicurioRegistry.disconnect', () => {
        registryTreeProvider.disconnect();
    });

    const searchCommand = vscode.commands.registerCommand('apicurioRegistry.search', async () => {
        await searchArtifactsCommand(registryService, registryTreeProvider);
    });

    const createArtifact = vscode.commands.registerCommand('apicurioRegistry.createArtifact', async () => {
        await createArtifactCommand(registryService, registryTreeProvider);
    });

    // Copy commands
    const copyGroupId = vscode.commands.registerCommand('apicurioRegistry.copyGroupId', async (node) => {
        await copyGroupIdCommand(node);
    });

    const copyArtifactId = vscode.commands.registerCommand('apicurioRegistry.copyArtifactId', async (node) => {
        await copyArtifactIdCommand(node);
    });

    const copyVersion = vscode.commands.registerCommand('apicurioRegistry.copyVersion', async (node) => {
        await copyVersionCommand(node);
    });

    const copyFullReference = vscode.commands.registerCommand('apicurioRegistry.copyFullReference', async (node) => {
        await copyFullReferenceCommand(node);
    });

    // Open commands
    const openArtifact = vscode.commands.registerCommand('apicurioRegistry.openArtifact', async (node) => {
        await openArtifactCommand(registryService, node);
    });

    const openVersion = vscode.commands.registerCommand('apicurioRegistry.openVersion', async (node) => {
        await openVersionCommand(registryService, node);
    });

    // State commands
    const changeArtifactState = vscode.commands.registerCommand('apicurioRegistry.changeArtifactState', async (node) => {
        await changeArtifactStateCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    const changeVersionState = vscode.commands.registerCommand('apicurioRegistry.changeVersionState', async (node) => {
        await changeVersionStateCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    // Download command
    const downloadContent = vscode.commands.registerCommand('apicurioRegistry.downloadContent', async (node) => {
        await downloadContentCommand(registryService, node);
    });

    // Delete commands
    const deleteGroup = vscode.commands.registerCommand('apicurioRegistry.deleteGroup', async (node) => {
        await deleteGroupCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    const deleteArtifact = vscode.commands.registerCommand('apicurioRegistry.deleteArtifact', async (node) => {
        await deleteArtifactCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    const deleteVersion = vscode.commands.registerCommand('apicurioRegistry.deleteVersion', async (node) => {
        await deleteVersionCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    // Draft commands
    const createDraftVersion = vscode.commands.registerCommand('apicurioRegistry.createDraftVersion', async (node) => {
        await createDraftVersionCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    const finalizeDraft = vscode.commands.registerCommand('apicurioRegistry.finalizeDraft', async (node) => {
        await finalizeDraftCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    const discardDraft = vscode.commands.registerCommand('apicurioRegistry.discardDraft', async (node) => {
        await discardDraftCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    const editDraftMetadata = vscode.commands.registerCommand('apicurioRegistry.editDraftMetadata', async (node) => {
        await editDraftMetadataCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    // Add to context subscriptions
    context.subscriptions.push(
        treeView,
        refreshCommand,
        connectCommand,
        disconnectCommand,
        searchCommand,
        createArtifact,
        copyGroupId,
        copyArtifactId,
        copyVersion,
        copyFullReference,
        openArtifact,
        openVersion,
        changeArtifactState,
        changeVersionState,
        downloadContent,
        deleteGroup,
        deleteArtifact,
        deleteVersion,
        createDraftVersion,
        finalizeDraft,
        discardDraft,
        editDraftMetadata
    );

    // Set context to enable tree view
    vscode.commands.executeCommand('setContext', 'apicurioRegistryEnabled', true);
}

async function connectToRegistry() {
    const config = vscode.workspace.getConfiguration('apicurioRegistry');
    const connections = config.get<any[]>('connections', []);

    if (connections.length === 0) {
        const result = await vscode.window.showInformationMessage(
            'No registry connections configured. Would you like to add one?',
            'Add Connection'
        );

        if (result === 'Add Connection') {
            await vscode.commands.executeCommand('workbench.action.openSettings', 'apicurioRegistry.connections');
        }
        return;
    }

    let selectedConnection;
    if (connections.length === 1) {
        selectedConnection = connections[0];
    } else {
        const connectionNames = connections.map(conn => conn.name);
        const selected = await vscode.window.showQuickPick(connectionNames, {
            placeHolder: 'Select a registry connection'
        });

        if (!selected) {
            return;
        }

        selectedConnection = connections.find(conn => conn.name === selected);
    }

    if (selectedConnection) {
        await registryTreeProvider.connect(selectedConnection);
        vscode.window.showInformationMessage(`Connected to ${selectedConnection.name}`);
    }
}

export function deactivate() {
    console.log('Apicurio Registry extension is deactivated');
}