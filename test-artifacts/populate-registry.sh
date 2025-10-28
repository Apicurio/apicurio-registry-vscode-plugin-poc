#!/bin/bash

# Populate Apicurio Registry with test data for VSCode extension testing
# This script creates multiple groups with OpenAPI artifacts and versions

REGISTRY_URL="${REGISTRY_URL:-http://localhost:8080}"
API_BASE="${REGISTRY_URL}/apis/registry/v3"

echo "=========================================="
echo "Apicurio Registry Test Data Population"
echo "=========================================="
echo "Registry URL: $REGISTRY_URL"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to create artifact with version
create_artifact() {
    local group_id="$1"
    local artifact_id="$2"
    local artifact_name="$3"
    local description="$4"
    local version="$5"
    local file_path="$6"

    echo -n "Creating artifact ${artifact_id} (${version})... "

    # Read file content and escape for JSON
    local content=$(cat "$file_path" | jq -Rs .)

    # Create JSON payload
    local payload=$(cat <<EOF
{
    "artifactId": "${artifact_id}",
    "artifactType": "OPENAPI",
    "name": "${artifact_name}",
    "description": "${description}",
    "firstVersion": {
        "version": "${version}",
        "content": {
            "content": ${content},
            "contentType": "application/x-yaml"
        }
    }
}
EOF
)

    # Create artifact
    response=$(curl -s -w "\n%{http_code}" -X POST \
        "${API_BASE}/groups/${group_id}/artifacts" \
        -H "Content-Type: application/create.extended+json" \
        -d "$payload")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗ (HTTP $http_code)${NC}"
        echo "$response" | head -n-1
        return 1
    fi
}

# Function to add version to existing artifact
add_version() {
    local group_id="$1"
    local artifact_id="$2"
    local version="$3"
    local file_path="$4"

    echo -n "Adding version ${version} to ${artifact_id}... "

    # Read file content
    local content=$(cat "$file_path")

    # Create version
    response=$(curl -s -w "\n%{http_code}" -X POST \
        "${API_BASE}/groups/${group_id}/artifacts/${artifact_id}/versions" \
        -H "Content-Type: application/x-yaml" \
        -H "X-Registry-Version: ${version}" \
        -d "$content")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗ (HTTP $http_code)${NC}"
        echo "$response" | head -n-1
        return 1
    fi
}

# Check if registry is accessible
echo "Checking registry connectivity..."
if ! curl -s -f "${API_BASE}/system/info" > /dev/null 2>&1; then
    echo -e "${RED}✗ Cannot connect to registry at ${REGISTRY_URL}${NC}"
    echo "Please ensure the registry is running."
    exit 1
fi
echo -e "${GREEN}✓ Registry is accessible${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Group 1: E-commerce APIs
echo "=========================================="
echo "Group 1: ecommerce-apis"
echo "=========================================="

create_artifact \
    "ecommerce-apis" \
    "users-api" \
    "Users API" \
    "User management API for e-commerce platform" \
    "1.0.0" \
    "${SCRIPT_DIR}/users-api-v1.yaml"

add_version \
    "ecommerce-apis" \
    "users-api" \
    "2.0.0" \
    "${SCRIPT_DIR}/users-api-v2.yaml"

create_artifact \
    "ecommerce-apis" \
    "products-api" \
    "Products API" \
    "Product catalog management API" \
    "1.0.0" \
    "${SCRIPT_DIR}/products-api-v1.yaml"

create_artifact \
    "ecommerce-apis" \
    "orders-api" \
    "Orders API" \
    "Order processing and management API" \
    "1.0.0" \
    "${SCRIPT_DIR}/orders-api-v1.yaml"

echo ""

# Group 2: Internal APIs
echo "=========================================="
echo "Group 2: internal-apis"
echo "=========================================="

# Reuse existing samples for internal group
create_artifact \
    "internal-apis" \
    "openapi-sample" \
    "Sample OpenAPI" \
    "Sample OpenAPI specification for testing" \
    "1.0.0" \
    "${SCRIPT_DIR}/sample-openapi.yaml"

echo ""

# Group 3: Testing Group (for manual tests)
echo "=========================================="
echo "Group 3: test-group"
echo "=========================================="

create_artifact \
    "test-group" \
    "test-api" \
    "Test API" \
    "Multi-version API for testing VSCode extension features" \
    "1.0.0" \
    "${SCRIPT_DIR}/users-api-v1.yaml"

add_version \
    "test-group" \
    "test-api" \
    "1.1.0" \
    "${SCRIPT_DIR}/users-api-v2.yaml"

add_version \
    "test-group" \
    "test-api" \
    "2.0.0" \
    "${SCRIPT_DIR}/users-api-v2.yaml"

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Created groups:"
echo "  • ecommerce-apis (3 artifacts, 4 versions total)"
echo "  • internal-apis (1 artifact, 1 version)"
echo "  • test-group (1 artifact, 3 versions)"
echo ""
echo -e "${GREEN}Test data population complete!${NC}"
echo ""
echo "You can now:"
echo "  1. Open VSCode and press F5 to launch Extension Development Host"
echo "  2. Connect to registry at: ${REGISTRY_URL}"
echo "  3. Browse groups and test copy/open commands"
echo ""
