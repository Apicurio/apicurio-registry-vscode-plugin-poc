#!/bin/bash

# Test Script for Phase 2.1a - Custom Icons
# This script adds sample artifacts of all 9 types to test icon rendering

set -e

REGISTRY_URL="http://localhost:8080/apis/registry/v3"
GROUP_ID="icon-test-group"

echo "🎨 Testing Custom Icons for Apicurio VSCode Extension"
echo "======================================================"
echo ""

# Check if registry is running
if ! curl -s -f "${REGISTRY_URL}/system/info" > /dev/null 2>&1; then
    echo "❌ Registry not running at ${REGISTRY_URL}"
    echo "Please start the registry first:"
    echo "  docker run -it -p 8080:8080 apicurio/apicurio-registry:latest-snapshot"
    exit 1
fi

echo "✅ Registry is running"
echo ""

# Function to create an artifact
create_artifact() {
    local artifact_id=$1
    local artifact_type=$2
    local content=$3
    local state=${4:-"ENABLED"}
    local description=$5

    echo "Creating ${artifact_type}: ${artifact_id}..."

    curl -s -X POST "${REGISTRY_URL}/groups/${GROUP_ID}/artifacts" \
        -H "Content-Type: application/json" \
        -H "X-Registry-ArtifactId: ${artifact_id}" \
        -H "X-Registry-ArtifactType: ${artifact_type}" \
        -H "X-Registry-Name: ${artifact_id}" \
        ${description:+-H "X-Registry-Description: ${description}"} \
        -d "${content}" > /dev/null

    # Set state if not ENABLED
    if [ "${state}" != "ENABLED" ]; then
        echo "  Setting state to ${state}..."
        curl -s -X PUT "${REGISTRY_URL}/groups/${GROUP_ID}/artifacts/${artifact_id}/state" \
            -H "Content-Type: application/json" \
            -d "{\"state\": \"${state}\"}" > /dev/null
    fi

    echo "  ✓ Created ${artifact_id}"
}

echo "📝 Creating test artifacts..."
echo ""

# 1. OPENAPI - REST API specification
create_artifact "petstore-api" "OPENAPI" '{
  "openapi": "3.0.0",
  "info": {
    "title": "Pet Store API",
    "version": "1.0.0",
    "description": "A sample REST API for a pet store"
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
}' "ENABLED" "REST API for pet store operations"

# 2. ASYNCAPI - Event-driven API
create_artifact "events-api" "ASYNCAPI" '{
  "asyncapi": "2.0.0",
  "info": {
    "title": "Event Notification API",
    "version": "1.0.0",
    "description": "Asynchronous event notifications"
  },
  "channels": {
    "user/signedup": {
      "subscribe": {
        "message": {
          "payload": {
            "type": "object",
            "properties": {
              "user": {
                "type": "string"
              }
            }
          }
        }
      }
    }
  }
}' "ENABLED" "Event-driven messaging API"

# 3. AVRO - Data schema
create_artifact "user-schema" "AVRO" '{
  "type": "record",
  "name": "User",
  "namespace": "com.example",
  "fields": [
    {"name": "id", "type": "long"},
    {"name": "username", "type": "string"},
    {"name": "email", "type": "string"}
  ]
}' "ENABLED" "Avro schema for user records"

# 4. PROTOBUF - Protocol Buffers
create_artifact "product-proto" "PROTOBUF" 'syntax = "proto3";
package example;

message Product {
  int64 id = 1;
  string name = 2;
  double price = 3;
  string description = 4;
}' "DEPRECATED" "Product schema (deprecated - use v2)"

# 5. JSON - JSON Schema
create_artifact "order-schema" "JSON" '{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Order",
  "type": "object",
  "properties": {
    "orderId": {"type": "string"},
    "amount": {"type": "number"},
    "status": {"type": "string"}
  },
  "required": ["orderId", "amount"]
}' "ENABLED" "JSON Schema for orders"

# 6. GRAPHQL - GraphQL Schema
create_artifact "blog-graphql" "GRAPHQL" 'type Query {
  posts: [Post]
  post(id: ID!): Post
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: Author!
}

type Author {
  id: ID!
  name: String!
  email: String!
}' "ENABLED" "GraphQL schema for blog"

# 7. KCONNECT - Kafka Connect Schema
create_artifact "db-connector" "KCONNECT" '{
  "type": "struct",
  "fields": [
    {"field": "id", "type": "int64"},
    {"field": "name", "type": "string"},
    {"field": "timestamp", "type": "int64"}
  ]
}' "DISABLED" "Database connector config (disabled for maintenance)"

# 8. WSDL - Web Services
create_artifact "payment-service" "WSDL" '<?xml version="1.0"?>
<definitions name="PaymentService"
  targetNamespace="http://example.com/payment"
  xmlns="http://schemas.xmlsoap.org/wsdl/">
  <message name="ProcessPaymentRequest">
    <part name="amount" type="xsd:decimal"/>
  </message>
  <message name="ProcessPaymentResponse">
    <part name="transactionId" type="xsd:string"/>
  </message>
</definitions>' "DEPRECATED" "Legacy payment service (use REST API)"

# 9. XSD - XML Schema
create_artifact "invoice-xsd" "XSD" '<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="invoice">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="id" type="xs:string"/>
        <xs:element name="amount" type="xs:decimal"/>
        <xs:element name="date" type="xs:date"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>' "ENABLED" "XML schema for invoices"

echo ""
echo "======================================================"
echo "✅ All 9 artifact types created successfully!"
echo ""
echo "📋 Summary:"
echo "  Group: ${GROUP_ID}"
echo "  Artifacts created:"
echo "    1. 🌐 petstore-api (OPENAPI) - ✓ ENABLED"
echo "    2. 📡 events-api (ASYNCAPI) - ✓ ENABLED"
echo "    3. 🗄️  user-schema (AVRO) - ✓ ENABLED"
echo "    4. 📦 product-proto (PROTOBUF) - ⚠ DEPRECATED"
echo "    5. 📄 order-schema (JSON) - ✓ ENABLED"
echo "    6. 🔷 blog-graphql (GRAPHQL) - ✓ ENABLED"
echo "    7. 🔌 db-connector (KCONNECT) - ✗ DISABLED"
echo "    8. 🌍 payment-service (WSDL) - ⚠ DEPRECATED"
echo "    9. 📋 invoice-xsd (XSD) - ✓ ENABLED"
echo ""
echo "🧪 Testing Instructions:"
echo "  1. In VSCode Extension Development Host window"
echo "  2. Click the Refresh button in APICURIO REGISTRY view"
echo "  3. Expand the '${GROUP_ID}' group"
echo "  4. Verify each artifact has a unique icon"
echo "  5. Hover over artifacts to see tooltips with type info"
echo "  6. Check state indicators: ✓ (enabled), ⚠ (deprecated), ✗ (disabled)"
echo ""
echo "🔍 To view in browser:"
echo "  http://localhost:8080/ui/explore/${GROUP_ID}"
echo ""
