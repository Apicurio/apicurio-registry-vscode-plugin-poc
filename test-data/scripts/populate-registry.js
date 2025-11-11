#!/usr/bin/env node

/**
 * Populate Apicurio Registry with test data for VSCode extension testing
 */

const fs = require('fs');
const path = require('path');
const https = require('http'); // Using http for localhost

const REGISTRY_URL = process.env.REGISTRY_URL || 'http://localhost:8080';
const API_BASE = `${REGISTRY_URL}/apis/registry/v3`;

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m'
};

async function httpRequest(url, options = {}, body = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 80,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data ? (res.headers['content-type']?.includes('json') ? JSON.parse(data) : data) : null
                });
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

async function createArtifact(groupId, artifactId, name, description, version, filePath) {
    process.stdout.write(`Creating artifact ${artifactId} (${version})... `);

    try {
        const content = fs.readFileSync(filePath, 'utf8');

        const payload = {
            artifactId: artifactId,
            artifactType: 'OPENAPI',
            name: name,
            description: description,
            firstVersion: {
                version: version,
                content: {
                    content: content,
                    contentType: 'application/x-yaml'
                }
            }
        };

        const response = await httpRequest(
            `${API_BASE}/groups/${encodeURIComponent(groupId)}/artifacts`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            payload
        );

        if (response.status === 200 || response.status === 201) {
            console.log(`${colors.green}✓${colors.reset}`);
            return true;
        } else {
            console.log(`${colors.red}✗ (HTTP ${response.status})${colors.reset}`);
            console.log(response.data);
            return false;
        }
    } catch (error) {
        console.log(`${colors.red}✗ (${error.message})${colors.reset}`);
        return false;
    }
}

async function addVersion(groupId, artifactId, version, filePath) {
    process.stdout.write(`Adding version ${version} to ${artifactId}... `);

    try {
        const content = fs.readFileSync(filePath, 'utf8');

        const payload = {
            version: version,
            content: {
                content: content,
                contentType: 'application/x-yaml'
            }
        };

        const response = await httpRequest(
            `${API_BASE}/groups/${encodeURIComponent(groupId)}/artifacts/${encodeURIComponent(artifactId)}/versions`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            payload
        );

        if (response.status === 200 || response.status === 201) {
            console.log(`${colors.green}✓${colors.reset}`);
            return true;
        } else {
            console.log(`${colors.red}✗ (HTTP ${response.status})${colors.reset}`);
            console.log(response.data);
            return false;
        }
    } catch (error) {
        console.log(`${colors.red}✗ (${error.message})${colors.reset}`);
        return false;
    }
}

async function main() {
    console.log('==========================================');
    console.log('Apicurio Registry Test Data Population');
    console.log('==========================================');
    console.log(`Registry URL: ${REGISTRY_URL}`);
    console.log('');

    // Check registry connectivity
    console.log('Checking registry connectivity...');
    try {
        const response = await httpRequest(`${API_BASE}/system/info`);
        if (response.status === 200) {
            console.log(`${colors.green}✓ Registry is accessible${colors.reset}`);
            console.log(`  Version: ${response.data.version}`);
            console.log('');
        } else {
            console.log(`${colors.red}✗ Cannot connect to registry${colors.reset}`);
            process.exit(1);
        }
    } catch (error) {
        console.log(`${colors.red}✗ Cannot connect to registry: ${error.message}${colors.reset}`);
        process.exit(1);
    }

    const scriptDir = __dirname;

    // Group 1: E-commerce APIs
    console.log('==========================================');
    console.log('Group 1: ecommerce-apis');
    console.log('==========================================');

    await createArtifact(
        'ecommerce-apis',
        'users-api',
        'Users API',
        'User management API for e-commerce platform',
        '1.0.0',
        path.join(scriptDir, 'users-api-v1.yaml')
    );

    await addVersion(
        'ecommerce-apis',
        'users-api',
        '2.0.0',
        path.join(scriptDir, 'users-api-v2.yaml')
    );

    await createArtifact(
        'ecommerce-apis',
        'products-api',
        'Products API',
        'Product catalog management API',
        '1.0.0',
        path.join(scriptDir, 'products-api-v1.yaml')
    );

    await createArtifact(
        'ecommerce-apis',
        'orders-api',
        'Orders API',
        'Order processing and management API',
        '1.0.0',
        path.join(scriptDir, 'orders-api-v1.yaml')
    );

    console.log('');

    // Group 2: Internal APIs
    console.log('==========================================');
    console.log('Group 2: internal-apis');
    console.log('==========================================');

    await createArtifact(
        'internal-apis',
        'openapi-sample',
        'Sample OpenAPI',
        'Sample OpenAPI specification for testing',
        '1.0.0',
        path.join(scriptDir, 'sample-openapi.yaml')
    );

    console.log('');

    // Group 3: Testing Group (for manual tests)
    console.log('==========================================');
    console.log('Group 3: test-group');
    console.log('==========================================');

    await createArtifact(
        'test-group',
        'test-api',
        'Test API',
        'Multi-version API for testing VSCode extension features',
        '1.0.0',
        path.join(scriptDir, 'users-api-v1.yaml')
    );

    await addVersion(
        'test-group',
        'test-api',
        '1.1.0',
        path.join(scriptDir, 'users-api-v2.yaml')
    );

    await addVersion(
        'test-group',
        'test-api',
        '2.0.0',
        path.join(scriptDir, 'users-api-v2.yaml')
    );

    console.log('');
    console.log('==========================================');
    console.log('Summary');
    console.log('==========================================');
    console.log('Created groups:');
    console.log('  • ecommerce-apis (3 artifacts, 4 versions total)');
    console.log('  • internal-apis (1 artifact, 1 version)');
    console.log('  • test-group (1 artifact, 3 versions)');
    console.log('');
    console.log(`${colors.green}Test data population complete!${colors.reset}`);
    console.log('');
    console.log('You can now:');
    console.log('  1. Open VSCode and press F5 to launch Extension Development Host');
    console.log(`  2. Connect to registry at: ${REGISTRY_URL}`);
    console.log('  3. Browse groups and test copy/open commands');
    console.log('');
}

main().catch(error => {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
});
