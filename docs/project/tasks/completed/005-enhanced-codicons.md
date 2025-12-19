# Task 005: Custom SVG Icons

**Status:** 📋 Todo
**Priority:** 🟡 Medium
**Effort Estimate:** 2-3 hours
**Target Date:** TBD

---

## Description

Replace ThemeIcon artifact type icons with custom SVG icons for more distinctive, professional look. Use hybrid approach: custom SVGs for artifact types, keep ThemeIcon state indicators.

## Motivation

Reference plugin has custom, professionally designed SVG icons that are more visually distinctive than built-in VSCode icons. This improves visual polish for marketplace release.

## Implementation Plan

### 1. Copy Icon Files

Copy SVG files from reference plugin to our project:

```bash
mkdir -p resources/icons/dark
mkdir -p resources/icons/light

# Copy from reference plugin
cp reference/apicurio-registry-vscode-plugin/resources/dark/*.svg resources/icons/dark/
cp reference/apicurio-registry-vscode-plugin/resources/light/*.svg resources/icons/light/
```

**Icons needed:**
- asyncapi.svg
- avro.svg
- graphql.svg
- json.svg
- kconnect.svg
- openapi.svg
- protobuf.svg
- wsdl.svg
- xml.svg
- xsd.svg

### 2. Update IconService

**File:** `src/services/iconService.ts`

```typescript
static getIconForArtifactType(
    artifactType: string,
    extensionUri: vscode.Uri
): vscode.Uri | vscode.ThemeIcon {
    const typeMap: { [key: string]: string } = {
        [ArtifactType.OPENAPI]: 'openapi',
        [ArtifactType.ASYNCAPI]: 'asyncapi',
        [ArtifactType.AVRO]: 'avro',
        [ArtifactType.PROTOBUF]: 'protobuf',
        [ArtifactType.JSON]: 'json',
        [ArtifactType.GRAPHQL]: 'graphql',
        [ArtifactType.KCONNECT]: 'kconnect',
        [ArtifactType.WSDL]: 'wsdl',
        [ArtifactType.XSD]: 'xsd',
        [ArtifactType.XML]: 'xml'
    };

    const iconName = typeMap[artifactType];
    if (iconName) {
        return {
            dark: vscode.Uri.joinPath(extensionUri, 'resources', 'icons', 'dark', `${iconName}.svg`),
            light: vscode.Uri.joinPath(extensionUri, 'resources', 'icons', 'light', `${iconName}.svg`)
        };
    }

    // Fallback to ThemeIcon
    return new vscode.ThemeIcon('file');
}

// Keep existing state icon methods (use ThemeIcon with colors)
```

### 3. Update Tree Provider

**File:** `src/providers/registryTreeProvider.ts`

Pass extensionUri to icon service:

```typescript
constructor(
    private registryService: RegistryService,
    private extensionUri: vscode.Uri
) {}

// In getTreeItem() for artifacts:
const icon = IconService.getIconForArtifactType(
    element.metadata?.type || ArtifactType.OPENAPI,
    this.extensionUri
);
treeItem.iconPath = icon;
```

### 4. Update Extension Activation

**File:** `src/extension.ts`

```typescript
export function activate(context: vscode.ExtensionContext) {
    // Pass extension URI to tree provider
    registryTreeProvider = new RegistryTreeDataProvider(
        registryService,
        context.extensionUri
    );
    // ...
}
```

### 5. Update Webpack Config

**File:** `webpack.config.js`

Ensure icon files are copied to bundle:

```javascript
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    // ...
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'resources/icons', to: 'resources/icons' }
            ]
        })
    ]
};
```

Or update `.vscodeignore` to include icons:

```
!resources/icons/**
```

## Testing Plan

- [ ] Verify icons appear for all artifact types
- [ ] Test in both light and dark themes
- [ ] Verify fallback for unknown types
- [ ] Check bundle size increase (should be minimal, ~20KB)
- [ ] Test that state indicators still work

## Reference

- **Reference plugin:** `/resources/` directory
- **UX Comparison:** [docs/UX_COMPARISON.md](../../UX_COMPARISON.md) Section 2

## Success Criteria

- [ ] Custom SVG icons display for all artifact types
- [ ] Icons adapt to light/dark theme
- [ ] State emoji indicators remain visible
- [ ] No bundle size issues
- [ ] Icons look professional and distinctive

---

## Implementation Summary

**Status:** ✅ Complete
**Actual Effort:** 30 minutes
**Completed:** 2025-12-19
**Approach:** Option 1 - Enhanced Codicons (instead of custom SVGs)

### What Was Done

**Decision:** After reviewing the original plan, reference plugin SVG files were not available in the codebase. Presented 4 implementation options to user, who selected **Option 1: Enhanced Codicons**.

**Changes Made:**

Enhanced `src/services/iconService.ts` with:

1. **Better Codicon Selections:**
   - AsyncAPI: `radio-tower` → `broadcast` (more appropriate for messaging)
   - Protobuf: `symbol-class` → `file-binary` (better represents binary serialization)
   - WSDL: `globe` → `symbol-interface` (consistent with service interfaces)
   - GraphQL: `symbol-interface` → `symbol-misc` (distinguishes from WSDL)

2. **Semantic Theme Colors Added (all artifact types):**
   - OpenAPI: `symbolIcon.methodForeground` (HTTP methods)
   - AsyncAPI: `symbolIcon.eventForeground` (events/messaging)
   - Avro: `symbolIcon.structForeground` (data structures)
   - Protobuf: `symbolIcon.numberForeground` (binary data)
   - JSON: `symbolIcon.objectForeground` (JSON objects)
   - GraphQL: `symbolIcon.interfaceForeground` (graph APIs)
   - Kafka Connect: `symbolIcon.propertyForeground` (connectors)
   - WSDL: `symbolIcon.interfaceForeground` (SOAP services)
   - XSD: `symbolIcon.namespaceForeground` (XML structures)
   - Default: `symbolIcon.fileForeground` (unknown types)

### Benefits

- ✅ Icons automatically adapt to light/dark themes (no manual theme variants needed)
- ✅ Visual distinction between artifact types using semantic colors
- ✅ Consistent with VSCode design language (uses official codicons)
- ✅ Zero bundle size increase (no SVG files to package)
- ✅ Improved user experience with better visual hierarchy
- ✅ Maintainable - no custom icon management needed

### Success Criteria Met

- ✅ Icons display for all artifact types with visual distinction
- ✅ Icons automatically adapt to light/dark theme (via ThemeColor)
- ✅ State emoji indicators remain functional
- ✅ No bundle size impact (0 KB vs. ~20KB for SVGs)
- ✅ Icons look professional and follow VSCode UX patterns

### Files Modified

- `src/services/iconService.ts` (+30 lines, enhanced `getIconForArtifactType` method)

### Lessons Learned

- **VSCode ThemeColors provide excellent semantic coloring** - Using `symbolIcon.*Foreground` colors gives professional results without custom SVG management
- **Codicon library is extensive** - VSCode's built-in icon library (`broadcast`, `file-binary`, etc.) provides excellent options for most use cases
- **Zero maintenance burden** - No need to maintain separate light/dark SVG files or handle icon updates
- **Option 1 (Enhanced Codicons) was the right choice** - Delivered professional look in 30 minutes vs. 2-3 hours for custom SVGs

---

_Created: 2025-10-24_
_Completed: 2025-12-19_
