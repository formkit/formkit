# @formkit/nuxt

Nuxt 3 module that integrates FormKit with automatic configuration, SSR support, and optional auto-imports.

## Architecture

```
src/
  module.ts           # Main Nuxt module definition (all logic here)
  runtime/
    formkitSSRPlugin.mjs  # SSR cleanup plugin (resetCount, ssrComplete)
```

**Single file module**: All module logic is in `module.ts`. Three internal functions:
- `useAutoImport()` - Lazy-load mode with component/function auto-imports
- `useFormKitPlugin()` - Traditional global plugin mode (generates `formkitPlugin.mjs`)
- `useIntegrations()` - Third-party hooks (currently: Tailwind CSS config integration)

## Key Abstractions

### ModuleOptions (public API)
```ts
interface ModuleOptions {
  defaultConfig?: boolean    // Use @formkit/vue defaultConfig (default: true)
  configFile?: string        // Path to formkit.config.{ts,mjs,js} (default: 'formkit.config')
  autoImport?: boolean       // Enable lazy-loading mode (default: false, experimental)
}
```

### Installation Modes

**Global Plugin Mode** (`autoImport: false`, default):
- Generates `formkitPlugin.mjs` template at build time
- Watches config file in dev mode for hot reload
- Registers FormKit globally via `nuxtApp.vueApp.use(plugin, config)`
- Adds `@formkit/vue` types to Nuxt

**Auto-Import Mode** (`autoImport: true`, experimental):
- Uses `unplugin-formkit` for lazy `<FormKitLazyProvider>` wrapping
- Auto-imports components: `FormKit`, `FormKitProvider`, `FormKitMessages`, `FormKitSummary`, `FormKitIcon`, `FormKitSchema`
- Auto-imports functions: `getNode`, `createInput`, `setErrors`, `clearErrors`, `submitForm`, `reset`, `useFormKitContext`, `useFormKitContextById`, `useFormKitNodeById`
- Auto-imports types: `FormKitNode`
- Better tree-shaking, smaller initial bundle

### SSR Handling

Both modes run `formkitSSRPlugin.mjs` on server:
```ts
nuxtApp.hook('app:rendered', () => {
  resetCount()        // Reset node ID counter for hydration match
  ssrComplete(nuxtApp.vueApp)  // Cleanup SSR state
})
```

### Tailwind Integration

Hooks into `tailwindcss:config` to add `formkit.theme.{ts,mjs,js}` to Tailwind content array if file exists.

## Integration Points

- **Depends on**: `@formkit/core`, `@formkit/vue`, `@formkit/i18n`, `unplugin-formkit`
- **Depended on by**: None (end-user module)
- **Root CLAUDE.md section**: "Vue Integration" > "nuxt"

## User Files

Module looks for these files in project root:
- `formkit.config.{ts,mjs,js}` - FormKit configuration (export default or function returning config)
- `formkit.theme.{ts,mjs,js}` - Theme file for Tailwind integration

## Modification Guide

### Adding Features

1. Add new options to `ModuleOptions` interface
2. Handle in `setup()` function, typically calling a new `use*()` function
3. For runtime behavior, add files to `src/runtime/` and register via `addPlugin()`

### Adding Auto-Imports

In `useAutoImport()`:
- Components: Use `addComponent()` with `filePath: '@formkit/vue'`
- Functions: Use `addImports()` with source package and name
- Types: Use `addImports()` with `type: true`

### Adding Tests

- Test file: `__tests__/ssr.spec.ts`
- Uses `@nuxt/test-utils/e2e` with browser/server
- Snapshot testing for SSR output
- Hydration error detection via console log monitoring
- Run: `pnpm test` (uses vitest)
- Playground at `playground/` serves as test fixture

### Breaking Changes

- Changing `ModuleOptions` defaults
- Changing generated plugin template structure
- Removing auto-imported components/functions
- Changing config file resolution logic

## Auto-Update Triggers

Update this CLAUDE.md when:
- New option added to `ModuleOptions`
- New component/function added to auto-imports
- New runtime plugin added to `src/runtime/`
- New integration hook added (like Tailwind)
- Config file naming convention changes

## Deep Dive References

- Module configuration: `src/module.ts:45-67` (setup function)
- Auto-import list: `src/module.ts:73-179` (useAutoImport)
- Generated plugin template: `src/module.ts:230-249` (getContents)
- SSR handling: `src/runtime/formkitSSRPlugin.mjs`
- Test patterns: `__tests__/ssr.spec.ts`
