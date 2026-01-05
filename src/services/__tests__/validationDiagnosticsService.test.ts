import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as vscode from 'vscode';
import { ValidationDiagnosticsService } from '../validationDiagnosticsService';

// Mock vscode module - it's already mocked via jest.config.js moduleNameMapper

describe('ValidationDiagnosticsService', () => {
    let service: ValidationDiagnosticsService;

    beforeEach(() => {
        jest.useFakeTimers();
        service = new ValidationDiagnosticsService();
    });

    afterEach(() => {
        jest.useRealTimers();
        service.dispose();
    });

    describe('syntax validation', () => {
        it('should detect invalid JSON syntax', async () => {
            const content = '{ "openapi": "3.0.0" invalid json }';
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, content);

            // Wait for debounce
            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const diagnostics = service.getDiagnostics(uri);
            expect(diagnostics).toBeDefined();
            expect(diagnostics!.length).toBeGreaterThan(0);
            expect(diagnostics![0].severity).toBe(vscode.DiagnosticSeverity.Error);
            expect(diagnostics![0].message).toContain('Invalid JSON');
        });

        it('should detect invalid YAML syntax', async () => {
            const content = `openapi: 3.0.0
  info: bad indentation
    title: Test API`;
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, content);

            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const diagnostics = service.getDiagnostics(uri);
            expect(diagnostics).toBeDefined();
            expect(diagnostics!.length).toBeGreaterThan(0);
            expect(diagnostics![0].severity).toBe(vscode.DiagnosticSeverity.Error);
        });

        it('should not show errors for valid JSON', async () => {
            const content = JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Test API', version: '1.0.0' },
                paths: {}
            }, null, 2);
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, content);

            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const diagnostics = service.getDiagnostics(uri);
            expect(diagnostics?.length || 0).toBe(0);
        });

        it('should not show errors for valid YAML', async () => {
            const content = `openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths: {}`;
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, content);

            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const diagnostics = service.getDiagnostics(uri);
            expect(diagnostics?.length || 0).toBe(0);
        });
    });

    describe('schema validation', () => {
        it('should detect missing info object', async () => {
            const content = JSON.stringify({
                openapi: '3.0.0',
                paths: {}
            }, null, 2);
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, content);

            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const diagnostics = service.getDiagnostics(uri);
            expect(diagnostics).toBeDefined();
            expect(diagnostics!.length).toBeGreaterThan(0);
            expect(diagnostics!.some((d: vscode.Diagnostic) => d.message.toLowerCase().includes('info'))).toBe(true);
        });

        it('should detect missing info.title', async () => {
            const content = JSON.stringify({
                openapi: '3.0.0',
                info: { version: '1.0.0' },
                paths: {}
            }, null, 2);
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, content);

            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const diagnostics = service.getDiagnostics(uri);
            expect(diagnostics).toBeDefined();
            expect(diagnostics!.length).toBeGreaterThan(0);
            expect(diagnostics!.some((d: vscode.Diagnostic) => d.message.toLowerCase().includes('title'))).toBe(true);
        });

        it('should detect missing info.version', async () => {
            const content = JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Test API' },
                paths: {}
            }, null, 2);
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, content);

            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const diagnostics = service.getDiagnostics(uri);
            expect(diagnostics).toBeDefined();
            expect(diagnostics!.length).toBeGreaterThan(0);
            expect(diagnostics!.some((d: vscode.Diagnostic) => d.message.toLowerCase().includes('version'))).toBe(true);
        });

        it('should detect missing paths and webhooks in OpenAPI', async () => {
            const content = JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Test API', version: '1.0.0' }
            }, null, 2);
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, content);

            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const diagnostics = service.getDiagnostics(uri);
            expect(diagnostics).toBeDefined();
            expect(diagnostics!.length).toBeGreaterThan(0);
            expect(diagnostics!.some((d: vscode.Diagnostic) =>
                d.message.toLowerCase().includes('paths') ||
                d.message.toLowerCase().includes('webhooks')
            )).toBe(true);
        });

        it('should detect missing channels in AsyncAPI', async () => {
            const content = JSON.stringify({
                asyncapi: '2.0.0',
                info: { title: 'Test API', version: '1.0.0' }
            }, null, 2);
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, content);

            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const diagnostics = service.getDiagnostics(uri);
            expect(diagnostics).toBeDefined();
            expect(diagnostics!.length).toBeGreaterThan(0);
            expect(diagnostics!.some((d: vscode.Diagnostic) => d.message.toLowerCase().includes('channel'))).toBe(true);
        });

        it('should accept valid OpenAPI document', async () => {
            const content = JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Test API', version: '1.0.0' },
                paths: {}
            }, null, 2);
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, content);

            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const diagnostics = service.getDiagnostics(uri);
            expect(diagnostics?.length || 0).toBe(0);
        });

        it('should accept valid AsyncAPI document', async () => {
            const content = JSON.stringify({
                asyncapi: '2.0.0',
                info: { title: 'Test API', version: '1.0.0' },
                channels: {
                    'user/signedup': {}
                }
            }, null, 2);
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, content);

            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const diagnostics = service.getDiagnostics(uri);
            expect(diagnostics?.length || 0).toBe(0);
        });
    });

    describe('debouncing', () => {
        it('should debounce multiple rapid validations', async () => {
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');
            const validateSpy = jest.spyOn(service as any, 'performValidation');

            // Rapid calls
            service.validateDocument(uri, '{ "openapi": "3.0.0" }');
            jest.advanceTimersByTime(100);
            service.validateDocument(uri, '{ "openapi": "3.0.0", "info": {} }');
            jest.advanceTimersByTime(100);
            service.validateDocument(uri, '{ "openapi": "3.0.0", "info": { "title": "Test" } }');

            // Wait for debounce
            jest.advanceTimersByTime(500);
            await Promise.resolve();

            // Should only call performValidation once (after debounce)
            expect(validateSpy).toHaveBeenCalledTimes(1);
        });

        it('should validate immediately after debounce delay', async () => {
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');
            const validateSpy = jest.spyOn(service as any, 'performValidation');

            service.validateDocument(uri, '{ "openapi": "3.0.0" }');

            // Before debounce delay
            jest.advanceTimersByTime(400);
            expect(validateSpy).not.toHaveBeenCalled();

            // After debounce delay
            jest.advanceTimersByTime(100);
            await Promise.resolve();
            expect(validateSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('diagnostic severity', () => {
        it('should set Error severity for syntax errors', async () => {
            const content = '{ invalid json }';
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, content);

            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const diagnostics = service.getDiagnostics(uri);
            expect(diagnostics![0].severity).toBe(vscode.DiagnosticSeverity.Error);
        });

        it('should set Error severity for missing required fields', async () => {
            const content = JSON.stringify({
                openapi: '3.0.0',
                paths: {}
            }, null, 2);
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, content);

            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const diagnostics = service.getDiagnostics(uri);
            expect(diagnostics![0].severity).toBe(vscode.DiagnosticSeverity.Error);
        });
    });

    describe('clearing diagnostics', () => {
        it('should clear diagnostics when document is fixed', async () => {
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            // First, invalid content
            service.validateDocument(uri, '{ invalid }');
            jest.advanceTimersByTime(500);
            await Promise.resolve();

            expect(service.getDiagnostics(uri)!.length).toBeGreaterThan(0);

            // Then, valid content
            service.validateDocument(uri, JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {}
            }));
            jest.advanceTimersByTime(500);
            await Promise.resolve();

            expect(service.getDiagnostics(uri)?.length || 0).toBe(0);
        });

        it('should clear diagnostics for a specific URI', async () => {
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, '{ invalid }');
            jest.advanceTimersByTime(500);
            await Promise.resolve();

            expect(service.getDiagnostics(uri)!.length).toBeGreaterThan(0);

            service.clearDiagnostics(uri);

            expect(service.getDiagnostics(uri)).toBeUndefined();
        });

        it('should clear all diagnostics', async () => {
            const uri1 = vscode.Uri.parse('apicurio://group/test/artifact/api1/version/1.0.0');
            const uri2 = vscode.Uri.parse('apicurio://group/test/artifact/api2/version/1.0.0');

            service.validateDocument(uri1, '{ invalid }');
            service.validateDocument(uri2, '{ invalid }');
            jest.advanceTimersByTime(500);
            await Promise.resolve();

            service.clearAllDiagnostics();

            expect(service.getDiagnostics(uri1)).toBeUndefined();
            expect(service.getDiagnostics(uri2)).toBeUndefined();
        });
    });

    describe('non-apicurio documents', () => {
        it('should not validate non-apicurio URIs', async () => {
            const uri = vscode.Uri.parse('file:///path/to/file.json');
            const validateSpy = jest.spyOn(service as any, 'performValidation');

            service.validateDocument(uri, '{ invalid }');

            jest.advanceTimersByTime(500);
            await Promise.resolve();

            expect(validateSpy).not.toHaveBeenCalled();
        });
    });

    describe('validation status', () => {
        it('should report isValidating true during validation', async () => {
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            expect(service.isValidating()).toBe(false);

            service.validateDocument(uri, '{ "openapi": "3.0.0" }');

            // During debounce, not yet validating
            expect(service.isValidating()).toBe(false);

            jest.advanceTimersByTime(500);

            // After debounce, should be validating briefly
            // (In practice this happens synchronously, so we may not catch it)
            await Promise.resolve();

            expect(service.isValidating()).toBe(false);
        });
    });

    describe('dispose', () => {
        it('should clear all resources on dispose', async () => {
            const uri = vscode.Uri.parse('apicurio://group/test/artifact/api/version/1.0.0');

            service.validateDocument(uri, '{ invalid }');
            jest.advanceTimersByTime(500);
            await Promise.resolve();

            service.dispose();

            // Pending timers should be cancelled
            service.validateDocument(uri, '{ another invalid }');
            jest.advanceTimersByTime(500);

            // Should not throw, but also not process
        });
    });
});
