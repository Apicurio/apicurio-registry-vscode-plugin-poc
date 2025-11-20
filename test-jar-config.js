#!/usr/bin/env node
/**
 * Test script for JAR configuration
 * Tests the command generation without requiring VSCode
 */

// Simulate the configuration
const config = {
    enabled: true,
    serverType: 'jar',
    dockerImage: 'quay.io/apicurio/apicurio-registry-mcp-server:latest-snapshot',
    jarPath: '/Users/astranier/Documents/dev/apicurio/apicurio-registry/mcp/target/apicurio-registry-mcp-server-3.1.3-SNAPSHOT-runner.jar',
    port: 3000,
    autoStart: true,
    registryUrl: 'http://localhost:8080',
    safeMode: false,
    pagingLimit: 200,
    managementMode: 'extension'
};

// Simulate getJavaCommand
function getJavaCommand() {
    // In the real implementation, this would check VSCode settings
    // For testing, we'll use the Homebrew path
    return '/opt/homebrew/opt/openjdk@17/bin/java';
}

// Simulate normalizeRegistryUrl
function normalizeRegistryUrl(url) {
    url = url.replace(/\/$/, '');
    url = url.replace(/\/apis\/registry\/v3$/, '');
    return url;
}

// Generate the command
function generateClaudeMCPCommand(config) {
    const registryUrl = normalizeRegistryUrl(config.registryUrl);

    if (!config.jarPath) {
        throw new Error('JAR path not configured');
    }

    const javaCommand = getJavaCommand();

    return `claude mcp add apicurio-registry -s local -- \\
  ${javaCommand} \\
  -Dregistry.url=${registryUrl} \\
  -Dapicurio.mcp.safe-mode=${config.safeMode} \\
  -Dapicurio.mcp.paging.limit=${config.pagingLimit} \\
  -Dquarkus.log.console.stderr=true \\
  -jar ${config.jarPath}`;
}

// Test
console.log('=== JAR Configuration Test ===\n');
console.log('Configuration:');
console.log(JSON.stringify(config, null, 2));
console.log('\n=== Generated Command ===\n');

try {
    const command = generateClaudeMCPCommand(config);
    console.log(command);
    console.log('\n=== Test Result ===');
    console.log('✅ Command generation: SUCCESS');

    // Validate command structure
    const checks = [
        { test: command.includes('/opt/homebrew/opt/openjdk@17/bin/java'), desc: 'Java path correct' },
        { test: command.includes('-Dregistry.url=http://localhost:8080'), desc: 'Registry URL correct' },
        { test: command.includes('-Dapicurio.mcp.safe-mode=false'), desc: 'Safe mode setting correct' },
        { test: command.includes('-Dapicurio.mcp.paging.limit=200'), desc: 'Paging limit correct' },
        { test: command.includes('-Dquarkus.log.console.stderr=true'), desc: 'Stderr logging enabled' },
        { test: command.includes('-jar'), desc: 'JAR flag present' },
        { test: command.includes('apicurio-registry-mcp-server'), desc: 'JAR path correct' },
        { test: command.indexOf('-jar') > command.lastIndexOf('-D'), desc: 'JAR flag after system properties' }
    ];

    console.log('\n=== Validation Checks ===');
    let allPassed = true;
    checks.forEach(check => {
        const status = check.test ? '✅' : '❌';
        console.log(`${status} ${check.desc}`);
        if (!check.test) allPassed = false;
    });

    console.log('\n=== Overall Result ===');
    if (allPassed) {
        console.log('✅ All checks passed! Command is valid.');
        process.exit(0);
    } else {
        console.log('❌ Some checks failed. Command may have issues.');
        process.exit(1);
    }

} catch (error) {
    console.error('❌ Error generating command:', error.message);
    process.exit(1);
}
