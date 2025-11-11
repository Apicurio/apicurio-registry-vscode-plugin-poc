#!/bin/bash

# Test Setup Script for Apicurio VSCode Extension
# This script helps you quickly set up the testing environment

set -e

echo "🚀 Apicurio VSCode Extension - Test Setup"
echo "=========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the apicurio-vscode-plugin directory.${NC}"
    exit 1
fi

echo "Step 1: Installing dependencies..."
echo "-----------------------------------"
if npm install; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo "Step 2: Compiling TypeScript..."
echo "-------------------------------"
if npm run compile; then
    echo -e "${GREEN}✓ TypeScript compiled successfully${NC}"
else
    echo -e "${RED}❌ Compilation failed${NC}"
    exit 1
fi

echo ""
echo "Step 3: Running linter..."
echo "-------------------------"
if npm run lint; then
    echo -e "${GREEN}✓ No linting errors${NC}"
else
    echo -e "${YELLOW}⚠ Linting warnings/errors found (non-critical)${NC}"
fi

echo ""
echo "Step 4: Checking for local registry..."
echo "---------------------------------------"

# Check if registry is running
if curl -s -f http://localhost:8080/apis/registry/v3/system/info > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Registry is running at http://localhost:8080${NC}"

    # Get registry info
    REGISTRY_INFO=$(curl -s http://localhost:8080/apis/registry/v3/system/info)
    echo "   Registry Info: $REGISTRY_INFO"
else
    echo -e "${YELLOW}⚠ No registry detected at http://localhost:8080${NC}"
    echo ""
    echo "Would you like to start a registry using Docker? (y/n)"
    read -r response

    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo ""
        echo "Starting Apicurio Registry with Docker..."

        # Check if Docker is available
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
            exit 1
        fi

        # Check if registry container is already running
        if docker ps | grep -q apicurio-registry-test; then
            echo -e "${YELLOW}⚠ Registry container already running. Stopping it first...${NC}"
            docker stop apicurio-registry-test
            docker rm apicurio-registry-test
        fi

        # Start registry
        echo "Pulling latest registry image..."
        docker pull apicurio/apicurio-registry:latest-snapshot

        echo "Starting registry container..."
        docker run -d \
            --name apicurio-registry-test \
            -p 8080:8080 \
            apicurio/apicurio-registry:latest-snapshot

        echo "Waiting for registry to start (this may take 30-60 seconds)..."

        # Wait for registry to be ready (max 2 minutes)
        COUNTER=0
        MAX_ATTEMPTS=40
        while [ $COUNTER -lt $MAX_ATTEMPTS ]; do
            if curl -s -f http://localhost:8080/apis/registry/v3/system/info > /dev/null 2>&1; then
                echo -e "${GREEN}✓ Registry started successfully!${NC}"
                break
            fi
            sleep 3
            COUNTER=$((COUNTER + 1))
            echo -n "."
        done

        if [ $COUNTER -eq $MAX_ATTEMPTS ]; then
            echo -e "${RED}❌ Registry failed to start within timeout${NC}"
            echo "Check Docker logs: docker logs apicurio-registry-test"
            exit 1
        fi
    else
        echo ""
        echo -e "${YELLOW}Skipping registry setup. You'll need to start a registry manually before testing.${NC}"
        echo ""
        echo "Quick start options:"
        echo "  1. Docker: docker run -it -p 8080:8080 apicurio/apicurio-registry:latest-snapshot"
        echo "  2. From source: cd ../apicurio-registry/app && ../mvnw quarkus:dev"
    fi
fi

echo ""
echo "Step 5: Creating VSCode settings..."
echo "------------------------------------"

# Create .vscode directory if it doesn't exist
mkdir -p .vscode

# Create settings.json if it doesn't exist
if [ ! -f ".vscode/settings.json" ]; then
    cat > .vscode/settings.json <<EOF
{
    "apicurioRegistry.connections": [
        {
            "name": "Local Registry",
            "url": "http://localhost:8080",
            "authType": "none"
        }
    ]
}
EOF
    echo -e "${GREEN}✓ Created .vscode/settings.json with local registry connection${NC}"
else
    echo -e "${YELLOW}⚠ .vscode/settings.json already exists. Skipping.${NC}"
    echo "   Make sure it includes a registry connection configuration."
fi

echo ""
echo "Step 6: Adding sample data to registry (optional)..."
echo "------------------------------------------------------"

if curl -s -f http://localhost:8080/apis/registry/v3/system/info > /dev/null 2>&1; then
    echo "Would you like to add sample OpenAPI specs to the registry for testing? (y/n)"
    read -r response

    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Adding sample OpenAPI specification..."

        # Create sample OpenAPI spec
        SAMPLE_OPENAPI='{
  "openapi": "3.0.0",
  "info": {
    "title": "Sample Pet Store API",
    "version": "1.0.0",
    "description": "A sample API for testing the VSCode extension"
  },
  "paths": {
    "/pets": {
      "get": {
        "summary": "List all pets",
        "responses": {
          "200": {
            "description": "Success"
          }
        }
      }
    }
  }
}'

        # Add to registry
        curl -X POST "http://localhost:8080/apis/registry/v3/groups/test-group/artifacts" \
            -H "Content-Type: application/json" \
            -H "X-Registry-ArtifactId: sample-petstore-api" \
            -H "X-Registry-ArtifactType: OPENAPI" \
            -d "$SAMPLE_OPENAPI" 2>/dev/null

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Sample data added successfully${NC}"
            echo "   Group: test-group"
            echo "   Artifact: sample-petstore-api"
        else
            echo -e "${YELLOW}⚠ Failed to add sample data (registry may not support this API version)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠ Registry not running. Skipping sample data.${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Open this project in VSCode: code ."
echo "  2. Press F5 to launch Extension Development Host"
echo "  3. In the new window, open the Explorer sidebar"
echo "  4. Look for 'Apicurio Registry' view"
echo "  5. Click 'Connect to Registry' button"
echo "  6. Browse your registry content!"
echo ""
echo "For detailed testing instructions, see:"
echo "  docs/TESTING_GUIDE.md"
echo ""

# Offer to open VSCode
if command -v code &> /dev/null; then
    echo "Would you like to open the project in VSCode now? (y/n)"
    read -r response

    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        code .
    fi
fi

echo ""
echo "Happy testing! 🎉"
