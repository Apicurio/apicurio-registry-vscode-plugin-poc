# Task 011: Draft Feature Detection

**Phase:** 3.0 - Draft Infrastructure
**Priority:** High
**Effort:** 6-8 hours
**Status:** 📋 Todo
**Created:** 2025-10-28

## Overview

Implement feature detection to determine if the connected Apicurio Registry supports draft functionality. This is the foundation for Phase 3, ensuring the VSCode plugin only shows draft-related features when the registry supports them.

## Context

Apicurio Registry v3 introduced draft support, but this feature can be:
- Disabled via configuration (`apicurio.apis.v3.draft-mutability.enabled=false`)
- Not available in older registry versions
- Configured with specific permissions

The VSCode plugin needs to:
1. Detect if draft features are available
2. Query the draft configuration from `/system/uiConfig`
3. Cache this information per connection
4. Use feature flags to conditionally show/hide draft UI elements

## Goals

✅ Detect draft support from registry `/system/uiConfig` endpoint
✅ Cache draft configuration per connection
✅ Provide service method `isDraftSupportEnabled(): boolean`
✅ Query additional draft config: mutability, permissions
✅ Comprehensive unit tests (TDD approach)

## Technical Approach

### API Endpoint

Query the `/system/uiConfig` endpoint:

```typescript
GET {baseURL}/apis/registry/v3/system/uiConfig

Response:
{
  "features": {
    "draftMutability": true,  // Draft editing enabled
    "readOnly": false         // Registry not in read-only mode
  },
  "ui": {
    "contextPath": "/",
    "editorsUrl": "http://localhost:9011/"  // Studio UI location
  }
}
```

### Implementation Plan

**1. Add UI Config Model** (`src/models/registryModels.ts`)

```typescript
export interface UIConfig {
    features?: {
        draftMutability?: boolean;
        readOnly?: boolean;
    };
    ui?: {
        contextPath?: string;
        editorsUrl?: string;
    };
}
```

**2. Add Service Method** (`src/services/registryService.ts`)

```typescript
export class RegistryService {
    private uiConfig: UIConfig | null = null;

    async getUIConfig(): Promise<UIConfig> {
        this.ensureConnected();

        if (this.uiConfig) {
            return this.uiConfig;  // Return cached config
        }

        const response = await this.client!.get('/system/uiConfig');
        this.uiConfig = response.data;
        return this.uiConfig;
    }

    async isDraftSupportEnabled(): Promise<boolean> {
        try {
            const config = await this.getUIConfig();
            return config.features?.draftMutability === true &&
                   config.features?.readOnly !== true;
        } catch (error) {
            console.warn('Failed to get UI config, assuming no draft support:', error);
            return false;  // Fail safely
        }
    }

    getEditorsUrl(): string | undefined {
        return this.uiConfig?.ui?.editorsUrl;
    }

    // Clear cache when disconnecting
    disconnect(): void {
        this.client = null;
        this.connection = null;
        this.uiConfig = null;  // Clear cached config
    }
}
```

**3. Update Connection Flow**

When connecting to a registry, automatically query UI config:

```typescript
// In registryTreeProvider.ts or extension.ts
async connect(connection: RegistryConnection): Promise<void> {
    registryService.setConnection(connection);

    // Query draft support
    const draftSupported = await registryService.isDraftSupportEnabled();

    // Set context for when clauses in package.json
    vscode.commands.executeCommand('setContext', 'apicurio.draftSupported', draftSupported);

    // Show info to user
    if (draftSupported) {
        console.log('Draft editing is enabled on this registry');
    } else {
        console.log('Draft editing is not available on this registry');
    }

    this.refresh();
}
```

## Testing Strategy (TDD)

### Test File: `src/services/__tests__/registryService.features.test.ts`

**RED Phase: Write failing tests**

```typescript
describe('RegistryService - Feature Detection', () => {
    let service: RegistryService;
    let mockClient: any;

    beforeEach(() => {
        service = new RegistryService();
        mockClient = {
            get: jest.fn(),
            defaults: { headers: { common: {} } }
        };
        mockedAxios.create = jest.fn().mockReturnValue(mockClient);
        service.setConnection({
            name: 'Test',
            url: 'http://localhost:8080',
            authType: 'none'
        });
    });

    describe('getUIConfig', () => {
        it('should fetch UI config from /system/uiConfig', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: { draftMutability: true, readOnly: false },
                    ui: { contextPath: '/', editorsUrl: 'http://localhost:9011/' }
                }
            });

            const config = await service.getUIConfig();

            expect(mockClient.get).toHaveBeenCalledWith('/system/uiConfig');
            expect(config.features?.draftMutability).toBe(true);
            expect(config.ui?.editorsUrl).toBe('http://localhost:9011/');
        });

        it('should cache UI config after first fetch', async () => {
            mockClient.get.mockResolvedValue({
                data: { features: { draftMutability: true } }
            });

            await service.getUIConfig();
            await service.getUIConfig();  // Second call

            expect(mockClient.get).toHaveBeenCalledTimes(1);  // Only called once
        });

        it('should throw error when not connected', async () => {
            const disconnectedService = new RegistryService();
            await expect(disconnectedService.getUIConfig()).rejects.toThrow('Not connected');
        });
    });

    describe('isDraftSupportEnabled', () => {
        it('should return true when draftMutability is enabled', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: { draftMutability: true, readOnly: false }
                }
            });

            const result = await service.isDraftSupportEnabled();
            expect(result).toBe(true);
        });

        it('should return false when draftMutability is disabled', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: { draftMutability: false, readOnly: false }
                }
            });

            const result = await service.isDraftSupportEnabled();
            expect(result).toBe(false);
        });

        it('should return false when registry is read-only', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    features: { draftMutability: true, readOnly: true }
                }
            });

            const result = await service.isDraftSupportEnabled();
            expect(result).toBe(false);
        });

        it('should return false when features are missing', async () => {
            mockClient.get.mockResolvedValue({
                data: { ui: { contextPath: '/' } }
            });

            const result = await service.isDraftSupportEnabled();
            expect(result).toBe(false);
        });

        it('should return false and log warning on API error', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            mockClient.get.mockRejectedValue(new Error('Network error'));

            const result = await service.isDraftSupportEnabled();

            expect(result).toBe(false);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to get UI config'),
                expect.any(Error)
            );

            consoleWarnSpy.mockRestore();
        });
    });

    describe('getEditorsUrl', () => {
        it('should return editors URL from config', async () => {
            mockClient.get.mockResolvedValue({
                data: {
                    ui: { editorsUrl: 'http://localhost:9011/' }
                }
            });

            await service.getUIConfig();
            const url = service.getEditorsUrl();

            expect(url).toBe('http://localhost:9011/');
        });

        it('should return undefined when config not loaded', () => {
            const url = service.getEditorsUrl();
            expect(url).toBeUndefined();
        });
    });

    describe('disconnect', () => {
        it('should clear cached UI config on disconnect', async () => {
            mockClient.get.mockResolvedValue({
                data: { features: { draftMutability: true } }
            });

            await service.getUIConfig();
            service.disconnect();

            expect(service.getEditorsUrl()).toBeUndefined();
        });
    });
});
```

**GREEN Phase: Implement minimal code to pass tests**

Implement the service methods as shown in Implementation Plan.

**REFACTOR Phase: Clean up and optimize**

- Extract constants for endpoint paths
- Add error handling with proper error types
- Add JSDoc comments
- Consider adding timeout for slow responses

## Acceptance Criteria

- [ ] `getUIConfig()` fetches and caches UI configuration
- [ ] `isDraftSupportEnabled()` correctly detects draft support
- [ ] `getEditorsUrl()` returns Studio URL from config
- [ ] Cache cleared when disconnecting
- [ ] All tests passing (minimum 10 test cases)
- [ ] Handles API errors gracefully (no crashes)
- [ ] Works with registries that don't support `/system/uiConfig` (older versions)
- [ ] Proper TypeScript types for UI config

## Dependencies

- None (foundation task)

## Blocked By

- None

## Blocks

- Task 012: Draft Creation Workflow
- Task 013: Draft Management Commands
- Task 014: Draft List View
- All subsequent Phase 3 tasks

## Related Files

- `src/services/registryService.ts` - Add feature detection methods
- `src/models/registryModels.ts` - Add UIConfig interface
- `src/services/__tests__/registryService.features.test.ts` - New test file
- `src/providers/registryTreeProvider.ts` - Query draft support on connect
- `src/extension.ts` - Set VSCode context for when clauses

## Reference Implementation

See Apicurio Registry web UI:
- `ui/ui-app/src/services/useConfigService.ts` - Web UI config service
- `ui/ui-app/src/app/pages/editor/EditorPage.tsx` - Draft detection usage

## Notes

- Feature detection must happen before showing any draft UI
- Cache invalidation happens on disconnect
- Fail safely: if detection fails, assume no draft support
- This is a non-breaking change: plugin works without draft support

## Estimated Breakdown

- Model updates: 0.5h
- Service implementation: 2h
- Test implementation: 2h
- Connection flow updates: 1h
- Documentation: 0.5h
- Manual testing: 1h

**Total: 7 hours**

---

**Task Created:** 2025-10-28
**Task Updated:** 2025-10-28
**Assigned To:** Development
**Branch:** `phase/003-draft-editing` (when started)
