# Test Artifacts

This directory contains sample artifacts and scripts for populating Apicurio Registry with test data.

## Contents

### Sample OpenAPI Specifications

#### E-commerce APIs (Group: `ecommerce-apis`)
- **users-api-v1.yaml** - Users API v1.0.0 (basic CRUD operations)
- **users-api-v2.yaml** - Users API v2.0.0 (enhanced with pagination and additional fields)
- **products-api-v1.yaml** - Products API v1.0.0 (product catalog management)
- **orders-api-v1.yaml** - Orders API v1.0.0 (order processing)

#### Other Samples
- **sample-openapi.yaml** - Generic OpenAPI sample
- **sample-json-schema.json** - JSON Schema example
- **sample-avro.avsc** - Avro schema example

## Population Script

### `populate-registry.js`

Node.js script that populates the registry with test data organized into 3 groups:

**Group 1: ecommerce-apis**
- users-api (versions: 1.0.0, 2.0.0)
- products-api (version: 1.0.0)
- orders-api (version: 1.0.0)

**Group 2: internal-apis**
- openapi-sample (version: 1.0.0)

**Group 3: test-group**
- test-api (versions: 1.0.0, 1.1.0, 2.0.0)

### Usage

```bash
# Make sure Apicurio Registry is running at http://localhost:8080
cd test-artifacts
node populate-registry.js

# Or specify a different registry URL
REGISTRY_URL=http://localhost:9090 node populate-registry.js
```

### Output

The script will:
1. Check registry connectivity
2. Create artifacts with their first version
3. Add additional versions to artifacts
4. Display colored success/error messages
5. Show a summary of created data

## Testing with VSCode Extension

After populating the registry:

1. Open VSCode with the `apicurio-vscode-plugin` project
2. Press **F5** to launch Extension Development Host
3. In the new window, open the Apicurio Registry view
4. Click "Connect to Registry" and configure:
   - Name: `Local Registry`
   - URL: `http://localhost:8080`
   - Auth Type: `none`
5. Expand groups to see artifacts and versions

## Test Scenarios

### Testing Copy Commands
- Right-click on **ecommerce-apis** group → Copy Group ID
- Right-click on **users-api** artifact → Copy Artifact ID, Copy Full Reference
- Right-click on version **1.0.0** → Copy Version, Copy Full Reference

### Testing Open Commands
- Right-click on **users-api** → Open Artifact (opens latest version)
- Expand **users-api** → Right-click version **1.0.0** → Open Version
- Verify YAML syntax highlighting

### Testing Multiple Versions
- Use **test-api** in **test-group** (has 3 versions)
- Test opening different versions
- Verify version labels and content differences

## Repopulating Data

If you need to start fresh:

```bash
# The registry is running in-memory mode, so restart it to clear all data
# Then run the population script again
node populate-registry.js
```

## API Version

This test data is compatible with:
- Apicurio Registry v3.0.x
- Apicurio Registry v3.1.x

The API endpoint used is: `/apis/registry/v3`
