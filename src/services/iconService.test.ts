import * as vscode from 'vscode';
import { IconService } from './iconService';
import { ArtifactType, ArtifactState, VersionState } from '../models/registryModels';

describe('IconService', () => {
    describe('getIconForArtifactType', () => {
        it('should return symbol-method icon for OPENAPI', () => {
            const icon = IconService.getIconForArtifactType(ArtifactType.OPENAPI);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('symbol-method');
        });

        it('should return radio-tower icon for ASYNCAPI', () => {
            const icon = IconService.getIconForArtifactType(ArtifactType.ASYNCAPI);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('radio-tower');
        });

        it('should return database icon for AVRO', () => {
            const icon = IconService.getIconForArtifactType(ArtifactType.AVRO);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('database');
        });

        it('should return symbol-class icon for PROTOBUF', () => {
            const icon = IconService.getIconForArtifactType(ArtifactType.PROTOBUF);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('symbol-class');
        });

        it('should return json icon for JSON', () => {
            const icon = IconService.getIconForArtifactType(ArtifactType.JSON);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('json');
        });

        it('should return symbol-interface icon for GRAPHQL', () => {
            const icon = IconService.getIconForArtifactType(ArtifactType.GRAPHQL);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('symbol-interface');
        });

        it('should return plug icon for KCONNECT', () => {
            const icon = IconService.getIconForArtifactType(ArtifactType.KCONNECT);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('plug');
        });

        it('should return globe icon for WSDL', () => {
            const icon = IconService.getIconForArtifactType(ArtifactType.WSDL);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('globe');
        });

        it('should return symbol-namespace icon for XSD', () => {
            const icon = IconService.getIconForArtifactType(ArtifactType.XSD);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('symbol-namespace');
        });

        it('should return file-code icon for unknown type', () => {
            const icon = IconService.getIconForArtifactType('UNKNOWN_TYPE');
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('file-code');
        });

        it('should handle undefined artifact type', () => {
            const icon = IconService.getIconForArtifactType(undefined as any);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('file-code');
        });

        it('should handle lowercase artifact types', () => {
            const icon = IconService.getIconForArtifactType('openapi');
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('symbol-method');
        });
    });

    describe('getIconForState', () => {
        it('should return check icon for ENABLED artifact state', () => {
            const icon = IconService.getIconForState(ArtifactState.ENABLED);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon!.id).toBe('check');
        });

        it('should return circle-slash icon for DISABLED state', () => {
            const icon = IconService.getIconForState(ArtifactState.DISABLED);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon!.id).toBe('circle-slash');
        });

        it('should return warning icon for DEPRECATED state', () => {
            const icon = IconService.getIconForState(ArtifactState.DEPRECATED);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon!.id).toBe('warning');
        });

        it('should return edit icon for DRAFT state', () => {
            const icon = IconService.getIconForState(VersionState.DRAFT);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon!.id).toBe('edit');
        });

        it('should return undefined for unknown state', () => {
            const icon = IconService.getIconForState('UNKNOWN_STATE');
            expect(icon).toBeUndefined();
        });

        it('should handle lowercase state values', () => {
            const icon = IconService.getIconForState('enabled');
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon!.id).toBe('check');
        });
    });

    describe('getGroupIcon', () => {
        it('should return folder icon', () => {
            const icon = IconService.getGroupIcon();
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('folder');
        });
    });

    describe('getVersionIcon', () => {
        it('should return tag icon', () => {
            const icon = IconService.getVersionIcon();
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('tag');
        });
    });

    describe('getConnectionIcon', () => {
        it('should return plug icon', () => {
            const icon = IconService.getConnectionIcon();
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('plug');
        });
    });

    describe('getCombinedIcon', () => {
        it('should return type-based icon', () => {
            const icon = IconService.getCombinedIcon(ArtifactType.OPENAPI, ArtifactState.ENABLED);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('symbol-method');
        });

        it('should work without state parameter', () => {
            const icon = IconService.getCombinedIcon(ArtifactType.AVRO);
            expect(icon).toBeInstanceOf(vscode.ThemeIcon);
            expect(icon.id).toBe('database');
        });
    });

    describe('getArtifactTypeLabel', () => {
        it('should return "OpenAPI Specification" for OPENAPI', () => {
            expect(IconService.getArtifactTypeLabel(ArtifactType.OPENAPI))
                .toBe('OpenAPI Specification');
        });

        it('should return "AsyncAPI Specification" for ASYNCAPI', () => {
            expect(IconService.getArtifactTypeLabel(ArtifactType.ASYNCAPI))
                .toBe('AsyncAPI Specification');
        });

        it('should return "Avro Schema" for AVRO', () => {
            expect(IconService.getArtifactTypeLabel(ArtifactType.AVRO))
                .toBe('Avro Schema');
        });

        it('should return "Protocol Buffers Schema" for PROTOBUF', () => {
            expect(IconService.getArtifactTypeLabel(ArtifactType.PROTOBUF))
                .toBe('Protocol Buffers Schema');
        });

        it('should return "JSON Schema" for JSON', () => {
            expect(IconService.getArtifactTypeLabel(ArtifactType.JSON))
                .toBe('JSON Schema');
        });

        it('should return "GraphQL Schema" for GRAPHQL', () => {
            expect(IconService.getArtifactTypeLabel(ArtifactType.GRAPHQL))
                .toBe('GraphQL Schema');
        });

        it('should return "Kafka Connect Schema" for KCONNECT', () => {
            expect(IconService.getArtifactTypeLabel(ArtifactType.KCONNECT))
                .toBe('Kafka Connect Schema');
        });

        it('should return "WSDL (Web Services)" for WSDL', () => {
            expect(IconService.getArtifactTypeLabel(ArtifactType.WSDL))
                .toBe('WSDL (Web Services)');
        });

        it('should return "XML Schema Definition" for XSD', () => {
            expect(IconService.getArtifactTypeLabel(ArtifactType.XSD))
                .toBe('XML Schema Definition');
        });

        it('should return the input type for unknown types', () => {
            expect(IconService.getArtifactTypeLabel('CUSTOM_TYPE'))
                .toBe('CUSTOM_TYPE');
        });

        it('should return "Unknown Type" for undefined', () => {
            expect(IconService.getArtifactTypeLabel(undefined as any))
                .toBe('Unknown Type');
        });
    });

    describe('getStateLabel', () => {
        it('should return "Enabled" for ENABLED', () => {
            expect(IconService.getStateLabel(ArtifactState.ENABLED))
                .toBe('Enabled');
        });

        it('should return "Disabled" for DISABLED', () => {
            expect(IconService.getStateLabel(ArtifactState.DISABLED))
                .toBe('Disabled');
        });

        it('should return "Deprecated" for DEPRECATED', () => {
            expect(IconService.getStateLabel(ArtifactState.DEPRECATED))
                .toBe('Deprecated');
        });

        it('should return "Draft" for DRAFT', () => {
            expect(IconService.getStateLabel(VersionState.DRAFT))
                .toBe('Draft');
        });

        it('should return input for unknown state', () => {
            expect(IconService.getStateLabel('CUSTOM_STATE'))
                .toBe('CUSTOM_STATE');
        });
    });

    describe('getStateEmoji', () => {
        it('should return ✓ for ENABLED', () => {
            expect(IconService.getStateEmoji(ArtifactState.ENABLED))
                .toBe('✓');
        });

        it('should return ✗ for DISABLED', () => {
            expect(IconService.getStateEmoji(ArtifactState.DISABLED))
                .toBe('✗');
        });

        it('should return ⚠ for DEPRECATED', () => {
            expect(IconService.getStateEmoji(ArtifactState.DEPRECATED))
                .toBe('⚠');
        });

        it('should return 📝 for DRAFT', () => {
            expect(IconService.getStateEmoji(VersionState.DRAFT))
                .toBe('📝');
        });

        it('should return empty string for unknown state', () => {
            expect(IconService.getStateEmoji('UNKNOWN'))
                .toBe('');
        });
    });
});
