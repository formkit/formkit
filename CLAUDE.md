# FormKit

Vue.js form building library. Monorepo with framework-agnostic core and Vue-specific integration.

## Architecture

**Node tree**: Every `<FormKit>` component owns a node (`packages/core/src/node.ts`). Three node types:
- `input`: single value (scalar, object, or array)
- `group`: children as object (keys = child names). `<FormKit type="form">` is a group.
- `list`: children as array

**Schema**: JSON-serializable data format for DOM/component structures. Rendered via `<FormKitSchema>`. Four node types:
- **Text**: plain strings
- **$el**: HTML elements (`{ $el: 'div', attrs: {}, children: [] }`)
- **$cmp**: Vue components (`{ $cmp: 'MyComponent', props: {} }`)
- **$formkit**: FormKit inputs (`{ $formkit: 'text', name: 'email' }`)—props flattened to top level

**Schema expressions**: `$`-prefixed references are reactive. `$: (value * 3)` for expressions not starting with reference. Supports arithmetic, comparison, logical operators. NOT JavaScript—compiled templating language with restricted execution.

**Schema features**:
- `if`/`then`/`else`: conditional rendering
- `for`: loops (like v-for)
- `bind`: dynamic attrs/props (like v-bind)
- `$slots`: access scoped slots
- `$get('id')`: access other input contexts by id
- `__raw__` prefix: prevent expression parsing

**Composables** (`packages/inputs/src/compose.ts`): `outer()`, `wrapper()`, `label()`, `inner()`, etc. build schema with user override support via `sectionsSchema` prop.

**Plugins**: Hierarchical—parent plugins apply to children. Most features are plugins: validation, i18n, inputs.

## Packages

### Core (framework-agnostic)
- **core**: Node architecture, state management, plugin system, events, ledgers
- **utils**: Shared utilities (token gen, type checks, object helpers)
- **observer**: Dependency-tracking proxy for reactive node updates
- **inputs**: Input type definitions and schema composition helpers
- **rules**: Validation rules (email, min, max, date_before, etc.)
- **validation**: Validation plugin, manages rules/messages/hints
- **i18n**: Internationalization plugin (30+ languages)
- **icons**: SVG icon library for inputs

### Vue Integration
- **vue**: Vue 3 bindings—`<FormKit>`, `<FormKitSchema>`, composables (`useInput`, `createInput`)
- **nuxt**: Nuxt module with auto-imports

### Styling
- **themes**: Base theme libraries (Tailwind, UnoCSS, WindiCSS)
- **tailwindcss**: Tailwind plugin with FormKit state variants

### Addons
- **addons**: Auto-animate, multi-step forms, floating labels, localStorage, auto-height textarea
- **zod**: Zod schema integration for validation

### Dev/CLI
- **cli**: CLI tool for scaffolding
- **formkit**: Wrapper that exports CLI binary
- **dev**: Internal dev utilities

## Commands

```bash
pnpm build          # Build packages
pnpm test           # Run vitest
pnpm dev            # Dev server (examples)
pnpm lint           # Lint
pnpm playwright     # E2E tests
```
