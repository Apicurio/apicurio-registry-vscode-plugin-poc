import * as vscode from 'vscode';
import { RegistryTreeDataProvider } from './providers/registryTreeProvider';
import { RegistryService } from './services/registryService';
import { searchArtifactsCommand } from './commands/searchCommand';
import { createArtifactCommand } from './commands/createArtifactCommand';

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

    // Add to context subscriptions
    context.subscriptions.push(
        treeView,
        refreshCommand,
        connectCommand,
        disconnectCommand,
        searchCommand,
        createArtifact
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