# @formkit/vue

Vue 3 integration layer for FormKit. The only Vue-specific package in the monorepo. Provides components, composables, and the plugin that connects Vue's reactivity to FormKit's core node system.

## Architecture

```
src/
├── FormKit.ts           # Main <FormKit> component - creates nodes, renders schema
├── FormKitSchema.ts     # Schema renderer - compiles JSON schema to Vue VNodes
├── FormKitProvider.ts   # Config provider components (FormKitProvider, FormKitLazyProvider)
├── FormKitMessages.ts   # Standalone message rendering component
├── FormKitSummary.ts    # Form error summary component
├── FormKitIcon.ts       # Icon rendering component
├── FormKitRoot.ts       # ShadowRoot/Document context provider
├── FormKitKitchenSink.ts # Dev testing component (fetches remote schemas)
├── plugin.ts            # Vue plugin - registers components, provides config
├── bindings.ts          # Core plugin that creates Vue reactive context on nodes
├── defaultConfig.ts     # Default config factory (validation, i18n, inputs, themes)
├── index.ts             # Public exports
├── composables/
│   ├── useInput.ts      # Creates FormKitNode from component props/attrs
│   ├── createInput.ts   # Factory for custom input type definitions
│   ├── useContext.ts    # useFormKitContext, useFormKitContextById, useFormKitNodeById
│   ├── defineFormKitConfig.ts  # Config definition helper
│   └── onSSRComplete.ts # SSR cleanup utilities
└── utilities/
    └── resetCount.ts    # Test utility - resets ID counters
```

## Key Abstractions

### Components (Public API)

- **FormKit**: Main component. Props become node config. `type` prop looks up input definition. Renders via `FormKitSchema`.
- **FormKitSchema**: Renders JSON schema to VNodes. Memoizes compiled schemas. Handles `$el`, `$cmp`, `$formkit` nodes.
- **FormKitProvider**: Provides config to descendants via Vue `provide/inject`.
- **FormKitLazyProvider**: Auto-loads config with Suspense, skips if config already provided.
- **FormKitMessages**: Renders messages for a node (auto-injects parent or accepts `node` prop).
- **FormKitSummary**: Shows form-wide error summary with jump links.
- **FormKitIcon**: Renders icons from icon registry/loader.
- **FormKitRoot**: Detects Document vs ShadowRoot context for DOM queries.

### Composables (Public API)

- **useInput(props, context, options?)**: Creates and manages a FormKitNode. Handles v-model, watchers, lifecycle.
- **createInput(schemaOrComponent, definitionOptions?, sectionsSchema?)**: Creates input type definition from Vue component or schema.
- **useFormKitContext(addressOrEffect?, effect?)**: Access parent FormKit context reactively.
- **useFormKitContextById(id, effect?)**: Access any FormKit context by node id globally.
- **useFormKitNodeById(id, effect?)**: Access any FormKitNode by id globally.
- **useConfig(config)**: Provide config to descendants (used internally by FormKitProvider).
- **defineFormKitConfig(config)**: Type-safe config definition wrapper.

### Symbols (Internal)

- **parentSymbol**: Injection key for parent FormKitNode
- **componentSymbol**: Injection key for component callback (HMR support)
- **optionsSymbol**: Injection key for FormKitOptions
- **configSymbol**: Injection key for FormKitRootConfig
- **rootSymbol**: Injection key for Document/ShadowRoot ref

### Core Integration

- **bindings.ts**: Plugin that creates `node.context` (FormKitFrameworkContext). Contains reactive refs for value, messages, state, classes. This is what templates bind to.
- **plugin.ts**: Vue plugin. Registers `<FormKit>` and `<FormKitSchema>` globally. Creates `$formkit` global property.
- **defaultConfig.ts**: Factory function. Assembles validation, i18n, library, and theme plugins.

## Integration Points

- **Depends on**: `@formkit/core`, `@formkit/utils`, `@formkit/observer`, `@formkit/inputs`, `@formkit/rules`, `@formkit/validation`, `@formkit/i18n`, `@formkit/themes`, `@formkit/dev`
- **Depended on by**: `@formkit/nuxt`, `@formkit/addons`, `@formkit/zod`, `@formkit/dev` (dev only)
- **Root CLAUDE.md section**: "Vue Integration" and "Architecture" sections

## Modification Guide

### Adding a New Component

1. Create `src/ComponentName.ts` using `defineComponent`
2. Export from `src/index.ts`
3. If it should be globally registered, add to `plugin.ts`

### Adding a New Composable

1. Create in `src/composables/`
2. Export from `src/index.ts`
3. Composables that need node access should inject `parentSymbol` or use `getNode()`

### Modifying FormKit Component Behavior

- Props handling: `src/composables/useInput.ts`
- Reactive context: `src/bindings.ts`
- Schema rendering: `src/FormKitSchema.ts`

### Modifying Schema Compilation

Schema parsing is in `FormKitSchema.ts`:
- `parseSchema()`: Entry point, returns SchemaProvider
- `parseNode()`: Handles individual schema nodes
- `createElement()`: Creates render functions
- Memoization via `memo` object and `memoKey` prop

### Adding Tests

Tests in `__tests__/`:
- Component tests: `FormKit.spec.ts`, `FormKitSchema.spec.ts`, etc.
- Input-specific: `__tests__/inputs/*.spec.ts`
- Type tests: `*.test-d.tsx` files (type checking only)

Run tests:
```bash
pnpm test packages/vue
```

### Breaking Changes

Breaking if:
- Public export removed/renamed in `index.ts`
- Component prop removed/type changed
- Composable signature changed
- Symbol key changed (affects injection)
- `node.context` shape changed (affects all templates)

## Auto-Update Triggers

Update this CLAUDE.md when:
- New component added to `src/`
- New composable added to `src/composables/`
- Export added/removed from `src/index.ts`
- Injection symbol added/changed
- `FormKitFrameworkContext` shape changes in `bindings.ts`
- Dependencies change in `package.json`

## Deep Dive References

- **Node creation flow**: `src/composables/useInput.ts` - trace from props to `createNode()` call
- **Schema compilation**: `src/FormKitSchema.ts` - `parseSchema()` and `createElements()` functions
- **Reactive context binding**: `src/bindings.ts` - see `vueBindings` plugin function
- **v-model handling**: `src/composables/useInput.ts` - search for `isVModeled`
- **Class generation**: `src/bindings.ts` - see `classes` Proxy and `createObserver()` usage
- **Message visibility**: `src/bindings.ts` - see `validationVisible` computed and `messages` computed
- **SSR support**: `src/composables/onSSRComplete.ts` and `ssrComplete()` export
