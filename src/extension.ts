import * as vscode from 'vscode';
import { RegistryTreeDataProvider } from './providers/registryTreeProvider';
import { RegistryService } from './services/registryService';
import { ApicurioFileSystemProvider } from './providers/apicurioFileSystemProvider';
import { ApicurioVisualEditorProvider } from './providers/apicurioVisualEditorProvider';
import { StatusBarManager } from './ui/statusBarManager';
import { ApicurioUriBuilder } from './utils/uriBuilder';
import { AutoSaveManager } from './services/autoSaveManager';
import { ConflictDetector } from './services/conflictDetector';
import { searchCommand } from './commands/searchCommand';
import { createCommand } from './commands/createCommand';
import { setupMCPCommand } from './commands/setupMCPCommand';
import { editMetadataCommand } from './commands/editMetadataCommand';
import { manageRulesCommand } from './commands/rulesCommand';
import {
    generateClaudeCommandCommand,
    verifyMCPCommand
} from './commands/mcpUtilityCommands';
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
    deleteArtifactCommand,
    deleteVersionCommand
} from './commands/deleteCommands';
import { deleteGroupCommand } from './commands/groupCommands';
import {
    createBranchCommand,
    editBranchMetadataCommand,
    addVersionToBranchCommand,
    deleteBranchCommand
} from './commands/branchCommands';
import {
    createDraftVersionCommand,
    finalizeDraftCommand,
    discardDraftCommand,
    editDraftMetadataCommand
} from './commands/draftCommands';
import {
    startMCPServerCommand,
    stopMCPServerCommand,
    restartMCPServerCommand,
    showMCPQuickActionsCommand,
    showMCPServerStatusCommand
} from './commands/mcpCommands';
import { MCPServerManager } from './services/mcpServerManager';
import { MCPConfigurationManager } from './services/mcpConfigurationManager';
import { MCPStatusBar } from './ui/mcpStatusBar';
import { DEFAULT_MCP_CONFIG } from './models/mcpServerConfig';

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

    // Pass tree view instance to provider for auto-expand functionality
    registryTreeProvider.setTreeView(treeView);

    // Create conflict detector for concurrent edit detection
    const conflictDetector = new ConflictDetector(registryService);

    // Register file system provider for Apicurio URIs
    const fileSystemProvider = new ApicurioFileSystemProvider(registryService, conflictDetector);
    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider(
            ApicurioUriBuilder.SCHEME,
            fileSystemProvider,
            { isCaseSensitive: true }
        )
    );

    // Register visual editor provider for OpenAPI/AsyncAPI files
    const visualEditorProvider = new ApicurioVisualEditorProvider(context);
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            ApicurioVisualEditorProvider.viewType,
            visualEditorProvider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                },
                supportsMultipleEditorsPerDocument: false
            }
        )
    );

    // Clean up conflict tracking when documents are closed
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            if (doc.uri.scheme === ApicurioUriBuilder.SCHEME) {
                conflictDetector.stopTracking(doc.uri);
            }
        })
    );

    // Get auto-save configuration
    const config = vscode.workspace.getConfiguration('apicurioRegistry.autoSave');
    const autoSaveConfig = {
        enabled: config.get<boolean>('enabled', false),
        interval: config.get<number>('interval', 2000),
        saveOnFocusLoss: config.get<boolean>('saveOnFocusLoss', true)
    };

    // Create auto-save manager
    const autoSaveManager = new AutoSaveManager(autoSaveConfig);
    context.subscriptions.push(autoSaveManager);

    // Create status bar manager with auto-save support
    const statusBarManager = new StatusBarManager(autoSaveManager);
    context.subscriptions.push(statusBarManager);

    // Listen for text changes (debounced auto-save)
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.uri.scheme === ApicurioUriBuilder.SCHEME) {
                autoSaveManager.scheduleSave(event.document);
            }
        })
    );

    // Listen for editor changes (save on focus loss)
    let previousEditor: vscode.TextEditor | undefined;
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(async editor => {
            // Save previous editor if it was an Apicurio document
            if (previousEditor?.document.uri.scheme === ApicurioUriBuilder.SCHEME) {
                await autoSaveManager.saveImmediately(previousEditor.document);
            }
            previousEditor = editor;

            // Update status bar
            statusBarManager.updateStatusBar(editor);
        })
    );

    // Update status bar for current editor
    statusBarManager.updateStatusBar(vscode.window.activeTextEditor);

    // Listen for save events to update status bar
    context.subscriptions.push(
        autoSaveManager.onDidSave(uri => {
            const editor = vscode.window.activeTextEditor;
            if (editor?.document.uri.toString() === uri.toString()) {
                statusBarManager.updateStatusBar(editor);
            }
        })
    );

    // Listen for save failures
    context.subscriptions.push(
        autoSaveManager.onSaveFailed(({ uri, error }) => {
            vscode.window.showErrorMessage(
                `Auto-save failed: ${error.message}`,
                'Retry',
                'Disable Auto-Save'
            ).then(action => {
                if (action === 'Retry') {
                    const editor = vscode.window.visibleTextEditors.find(
                        e => e.document.uri.toString() === uri.toString()
                    );
                    if (editor) {
                        autoSaveManager.scheduleSave(editor.document);
                    }
                } else if (action === 'Disable Auto-Save') {
                    vscode.workspace.getConfiguration('apicurioRegistry.autoSave')
                        .update('enabled', false, vscode.ConfigurationTarget.Global);
                }
            });
        })
    );

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('apicurioRegistry.autoSave')) {
                const config = vscode.workspace.getConfiguration('apicurioRegistry.autoSave');
                autoSaveManager.updateConfig({
                    enabled: config.get<boolean>('enabled', false),
                    interval: config.get<number>('interval', 2000),
                    saveOnFocusLoss: config.get<boolean>('saveOnFocusLoss', true)
                });
            }
        })
    );

    // ==================== MCP Server Setup ====================

    // Get MCP configuration
    const mcpConfig = vscode.workspace.getConfiguration('apicurioRegistry.mcp');
    const registryConfig = vscode.workspace.getConfiguration('apicurioRegistry');
    const connections = registryConfig.get<any[]>('connections', []);
    const registryUrl = connections.length > 0 ? connections[0].url : 'http://localhost:8080';

    // Convert localhost to host.containers.internal for MCP server (which runs in container)
    // VSCode extension uses localhost, but containerized MCP server needs host.containers.internal
    const mcpRegistryUrl = registryUrl.replace('localhost', 'host.containers.internal');

    const mcpServerConfig = {
        ...DEFAULT_MCP_CONFIG,
        enabled: mcpConfig.get<boolean>('enabled', true),
        serverType: mcpConfig.get<any>('serverType', 'docker'),
        dockerImage: mcpConfig.get<string>('dockerImage', DEFAULT_MCP_CONFIG.dockerImage),
        jarPath: mcpConfig.get<string>('jarPath', ''),
        port: mcpConfig.get<number>('port', 3000),
        autoStart: mcpConfig.get<boolean>('autoStart', true),
        safeMode: mcpConfig.get<boolean>('safeMode', true),
        pagingLimit: mcpConfig.get<number>('pagingLimit', 200),
        registryUrl: mcpRegistryUrl
    };

    // Create MCP server manager
    const mcpServerManager = new MCPServerManager(mcpServerConfig);
    context.subscriptions.push(mcpServerManager);

    // Create MCP configuration manager
    const mcpConfigurationManager = new MCPConfigurationManager(mcpServerConfig);

    // Create MCP status bar
    const mcpStatusBar = new MCPStatusBar();
    context.subscriptions.push(mcpStatusBar);
    mcpStatusBar.show();

    // Listen for MCP server status changes
    context.subscriptions.push(
        mcpServerManager.onStatusChanged(status => {
            mcpStatusBar.updateStatus(status);
        })
    );

    // Auto-start MCP server if enabled
    // NOTE: Disabled for stdio-based MCP servers - Claude Code manages the lifecycle
    // if (mcpServerConfig.enabled && mcpServerConfig.autoStart) {
    //     setTimeout(() => {
    //         void startMCPServerCommand(mcpServerManager);
    //     }, 2000);
    // }

    // Listen for MCP configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('apicurioRegistry.mcp') || event.affectsConfiguration('apicurioRegistry.connections')) {
                const config = vscode.workspace.getConfiguration('apicurioRegistry.mcp');
                const registryConfig = vscode.workspace.getConfiguration('apicurioRegistry');
                const connections = registryConfig.get<any[]>('connections', []);
                const currentRegistryUrl = connections.length > 0 ? connections[0].url : 'http://localhost:8080';
                const mcpRegistryUrl = currentRegistryUrl.replace('localhost', 'host.containers.internal');

                const updatedConfig = {
                    enabled: config.get<boolean>('enabled', true),
                    serverType: config.get<any>('serverType', 'docker'),
                    dockerImage: config.get<string>('dockerImage', DEFAULT_MCP_CONFIG.dockerImage),
                    jarPath: config.get<string>('jarPath', ''),
                    port: config.get<number>('port', 3000),
                    autoStart: config.get<boolean>('autoStart', true),
                    safeMode: config.get<boolean>('safeMode', true),
                    pagingLimit: config.get<number>('pagingLimit', 200),
                    registryUrl: mcpRegistryUrl
                };
                mcpServerManager.updateConfig(updatedConfig);
                mcpConfigurationManager.updateConfig(updatedConfig);
            }
        })
    );

    // Register commands
    const refreshCommand = vscode.commands.registerCommand('apicurioRegistry.refresh', () => {
        // Clear any active search filter when manually refreshing
        registryTreeProvider.clearSearchFilter();
        registryTreeProvider.refresh();
    });

    const connectCommand = vscode.commands.registerCommand('apicurioRegistry.connect', async () => {
        await connectToRegistry();
    });

    const disconnectCommand = vscode.commands.registerCommand('apicurioRegistry.disconnect', () => {
        registryTreeProvider.disconnect();
    });

    const searchCmd = vscode.commands.registerCommand('apicurioRegistry.search', async () => {
        await searchCommand(registryService, registryTreeProvider);
    });

    const create = vscode.commands.registerCommand('apicurioRegistry.create', async () => {
        await createCommand(registryService, registryTreeProvider);
    });

    const setupMCP = vscode.commands.registerCommand('apicurioRegistry.setupMCP', async () => {
        await setupMCPCommand(context, mcpConfigurationManager);
    });

    const generateClaudeCommand = vscode.commands.registerCommand('apicurioRegistry.generateClaudeCommand', async () => {
        await generateClaudeCommandCommand(mcpConfigurationManager);
    });

    const verifyMCP = vscode.commands.registerCommand('apicurioRegistry.verifyMCP', async () => {
        await verifyMCPCommand(mcpConfigurationManager);
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

    // Metadata editing command (unified for groups, artifacts, and versions)
    const editMetadata = vscode.commands.registerCommand('apicurioRegistry.editMetadata', async (node) => {
        await editMetadataCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    // Rules management commands
    const manageGlobalRules = vscode.commands.registerCommand('apicurioRegistry.manageGlobalRules', async () => {
        await manageRulesCommand(registryService, () => registryTreeProvider.refresh(), undefined, true);
    });

    const manageGroupRules = vscode.commands.registerCommand('apicurioRegistry.manageGroupRules', async (node) => {
        await manageRulesCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    const manageArtifactRules = vscode.commands.registerCommand('apicurioRegistry.manageArtifactRules', async (node) => {
        await manageRulesCommand(registryService, () => registryTreeProvider.refresh(), node);
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

    // Branch commands
    const createBranch = vscode.commands.registerCommand('apicurioRegistry.createBranch', async (node) => {
        await createBranchCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    const editBranchMetadata = vscode.commands.registerCommand('apicurioRegistry.editBranchMetadata', async (node) => {
        await editBranchMetadataCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    const addVersionToBranch = vscode.commands.registerCommand('apicurioRegistry.addVersionToBranch', async (node) => {
        await addVersionToBranchCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    const deleteBranch = vscode.commands.registerCommand('apicurioRegistry.deleteBranch', async (node) => {
        await deleteBranchCommand(registryService, () => registryTreeProvider.refresh(), node);
    });

    // MCP commands
    const mcpStart = vscode.commands.registerCommand('apicurioRegistry.mcp.start', async () => {
        await startMCPServerCommand(mcpServerManager);
    });

    const mcpStop = vscode.commands.registerCommand('apicurioRegistry.mcp.stop', async () => {
        await stopMCPServerCommand(mcpServerManager);
    });

    const mcpRestart = vscode.commands.registerCommand('apicurioRegistry.mcp.restart', async () => {
        await restartMCPServerCommand(mcpServerManager);
    });

    const mcpQuickActions = vscode.commands.registerCommand('apicurioRegistry.mcp.showQuickActions', async () => {
        await showMCPQuickActionsCommand(mcpServerManager);
    });

    const mcpStatus = vscode.commands.registerCommand('apicurioRegistry.mcp.showStatus', async () => {
        await showMCPServerStatusCommand(mcpServerManager);
    });

    const mcpConfigure = vscode.commands.registerCommand('apicurioRegistry.mcp.configureClaude', async () => {
        await mcpConfigurationManager.configureClaudeCode();
    });

    const mcpSetup = vscode.commands.registerCommand('apicurioRegistry.mcp.setup', async () => {
        await mcpConfigurationManager.showSetupWizard();
    });

    // Add to context subscriptions
    context.subscriptions.push(
        treeView,
        refreshCommand,
        connectCommand,
        disconnectCommand,
        searchCmd,
        create,
        setupMCP,
        generateClaudeCommand,
        verifyMCP,
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
        editMetadata,
        manageGlobalRules,
        manageGroupRules,
        manageArtifactRules,
        createDraftVersion,
        finalizeDraft,
        discardDraft,
        editDraftMetadata,
        createBranch,
        editBranchMetadata,
        addVersionToBranch,
        deleteBranch,
        mcpStart,
        mcpStop,
        mcpRestart,
        mcpQuickActions,
        mcpStatus,
        mcpConfigure,
        mcpSetup
    );

    // Listen for configuration changes and refresh tree view
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('apicurioRegistry.display') || e.affectsConfiguration('apicurioRegistry.filter')) {
            // Refresh tree when display or filter settings change
            registryTreeProvider.refresh();
        }
    });
    context.subscriptions.push(configChangeListener);

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