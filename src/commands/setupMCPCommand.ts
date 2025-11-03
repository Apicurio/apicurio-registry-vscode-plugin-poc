import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { MCPConfigurationManager } from '../services/mcpConfigurationManager';

interface PrerequisiteCheckResult {
    passed: boolean;
    name: string;
    error?: string;
}

interface SetupScenario {
    label: string;
    description: string;
    scenario: 'local' | 'remote';
}

/**
 * Interactive setup wizard for configuring Claude Code MCP integration.
 * Guides users through the process of setting up AI features.
 */
export async function setupMCPCommand(
    context: vscode.ExtensionContext,
    mcpConfigManager: MCPConfigurationManager
): Promise<void> {
    // Step 1: Welcome
    const start = await showWelcomeScreen();
    if (!start) {
        return;
    }

    // Step 2: Check Prerequisites
    const checks = await runPrerequisiteChecks();
    if (!checks.allPassed) {
        await showPrerequisiteErrors(checks.results);
        return;
    }

    // Step 3: Detect Scenario
    const scenario = await detectScenario();
    if (!scenario) {
        return;
    }

    if (scenario === 'remote') {
        await showRemoteScenarioMessage();
        return;
    }

    // Step 4: Generate Command
    const command = mcpConfigManager.generateClaudeMCPCommand();
    await vscode.env.clipboard.writeText(command);

    // Step 5: Show Command and Wait for User
    const action = await showCommandDialog(command);
    if (!action) {
        return;
    }

    if (action === 'Open Terminal') {
        const terminal = vscode.window.createTerminal('Claude MCP Setup');
        terminal.show();
        vscode.window.showInformationMessage('Paste the command (Cmd+V / Ctrl+V) and press Enter. Then click "I ran it, verify now" to continue.');
        return;
    }

    // Step 6: Verify Configuration
    if (action === 'I ran it, verify now') {
        const verified = await mcpConfigManager.verifyMCPConfiguration();
        if (verified) {
            await showSuccessMessage();
        } else {
            await showVerificationFailure();
        }
    }
}

/**
 * Show welcome screen.
 */
async function showWelcomeScreen(): Promise<boolean> {
    const detail = `This wizard will help you configure Claude Code to work with Apicurio Registry.

You'll be able to:
• Use AI to design and create API schemas
• Analyze and compare versions with AI assistance
• Generate documentation and examples
• Ask questions about your schemas

Let's get started!`;

    const action = await vscode.window.showInformationMessage(
        'Welcome to Apicurio Registry AI Features Setup',
        { modal: true, detail },
        'Get Started',
        'Cancel'
    );

    return action === 'Get Started';
}

/**
 * Run all prerequisite checks.
 */
async function runPrerequisiteChecks(): Promise<{ allPassed: boolean; results: PrerequisiteCheckResult[] }> {
    const results: PrerequisiteCheckResult[] = [];

    // Check 1: Claude CLI
    const claudeCheck = await checkClaudeCLI();
    results.push(claudeCheck);

    // Check 2: Docker/Podman
    const dockerCheck = await checkDocker();
    results.push(dockerCheck);

    // Check 3: Registry Connection
    const registryCheck = await checkRegistryConnection();
    results.push(registryCheck);

    const allPassed = results.every(r => r.passed);
    return { allPassed, results };
}

/**
 * Check if Claude CLI is installed.
 */
async function checkClaudeCLI(): Promise<PrerequisiteCheckResult> {
    return new Promise((resolve) => {
        const process = spawn('claude', ['--version']);

        process.on('close', (code) => {
            if (code === 0) {
                resolve({ passed: true, name: 'Claude CLI' });
            } else {
                resolve({
                    passed: false,
                    name: 'Claude CLI',
                    error: 'Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code'
                });
            }
        });

        process.on('error', () => {
            resolve({
                passed: false,
                name: 'Claude CLI',
                error: 'Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code'
            });
        });
    });
}

/**
 * Check if Docker/Podman is installed.
 */
async function checkDocker(): Promise<PrerequisiteCheckResult> {
    return new Promise((resolve) => {
        const process = spawn('podman', ['version']);

        process.on('close', (code) => {
            if (code === 0) {
                resolve({ passed: true, name: 'Docker/Podman' });
            } else {
                resolve({
                    passed: false,
                    name: 'Docker/Podman',
                    error: 'Docker or Podman not found. Please install Docker Desktop or Podman.'
                });
            }
        });

        process.on('error', () => {
            resolve({
                passed: false,
                name: 'Docker/Podman',
                error: 'Docker or Podman not found. Please install Docker Desktop or Podman.'
            });
        });
    });
}

/**
 * Check if Registry connection is configured.
 */
async function checkRegistryConnection(): Promise<PrerequisiteCheckResult> {
    const config = vscode.workspace.getConfiguration('apicurioRegistry');
    const connections = config.get<any[]>('connections', []);

    if (connections.length === 0) {
        return {
            passed: false,
            name: 'Registry Connection',
            error: 'No Apicurio Registry connection configured. Please add a connection first.'
        };
    }

    return { passed: true, name: 'Registry Connection' };
}

/**
 * Show prerequisite errors.
 */
async function showPrerequisiteErrors(results: PrerequisiteCheckResult[]): Promise<void> {
    const failed = results.filter(r => !r.passed);
    const errorMessages = failed.map(r => `✗ ${r.name}: ${r.error}`).join('\n\n');

    await vscode.window.showErrorMessage(
        'Setup Prerequisites Not Met',
        {
            modal: true,
            detail: `The following prerequisites are missing:\n\n${errorMessages}\n\nPlease install the required tools and try again.`
        },
        'OK'
    );
}

/**
 * Detect scenario (local vs remote).
 */
async function detectScenario(): Promise<'local' | 'remote' | undefined> {
    const config = vscode.workspace.getConfiguration('apicurioRegistry');
    const connections = config.get<any[]>('connections', []);
    const firstConnection = connections[0];

    // Auto-detect based on URL
    const isLocal = firstConnection.url?.includes('localhost') || firstConnection.url?.includes('127.0.0.1');

    const scenarios: SetupScenario[] = [
        {
            label: '$(home) Local (localhost)',
            description: 'Registry running on localhost - recommended for development',
            scenario: 'local'
        },
        {
            label: '$(cloud) Remote (cloud/server)',
            description: 'Registry deployed on remote server - coming soon',
            scenario: 'remote'
        }
    ];

    // Pre-select based on detection
    const preselected = isLocal ? scenarios[0] : scenarios[1];

    const selected = await vscode.window.showQuickPick(scenarios, {
        placeHolder: 'Where is your Apicurio Registry running?',
        ignoreFocusOut: true,
        title: 'Setup AI Features - Registry Location'
    });

    return selected?.scenario;
}

/**
 * Show remote scenario message.
 */
async function showRemoteScenarioMessage(): Promise<void> {
    await vscode.window.showInformationMessage(
        'Remote scenario support is coming soon!',
        {
            modal: true,
            detail: 'Remote deployment scenario (cloud/server) is not yet supported.\n\nFor now, please use a local Registry instance (localhost).\n\nWe\'re working on supporting remote scenarios in a future release.'
        },
        'OK'
    );
}

/**
 * Show command dialog.
 */
async function showCommandDialog(command: string): Promise<string | undefined> {
    const detail = `To enable AI features, run this command in your terminal:

${command}

✓ Command copied to clipboard!

After running the command, click "I ran it, verify now" to complete setup.`;

    return await vscode.window.showInformationMessage(
        'Run this command in your terminal',
        { modal: true, detail },
        'Open Terminal',
        'I ran it, verify now',
        'Cancel'
    );
}

/**
 * Show success message.
 */
async function showSuccessMessage(): Promise<void> {
    const detail = `Setup complete! 🎉

You can now use Claude Code AI features with Apicurio Registry.

Try asking Claude:
• "List my Apicurio Registry groups"
• "Create an OpenAPI schema for a user management API"
• "Show me the latest version of artifact X"

The MCP server will start automatically when Claude needs it.`;

    await vscode.window.showInformationMessage(
        'AI Features Setup Complete!',
        { modal: true, detail },
        'OK'
    );
}

/**
 * Show verification failure message.
 */
async function showVerificationFailure(): Promise<void> {
    const detail = `The MCP server is not configured correctly.

Possible issues:
• Command didn't run successfully
• Claude Code is not connected to the server
• Registry is not accessible

Please try running the command again, or check the documentation for troubleshooting steps.`;

    await vscode.window.showWarningMessage(
        'MCP Configuration Not Verified',
        { modal: true, detail },
        'OK'
    );
}
