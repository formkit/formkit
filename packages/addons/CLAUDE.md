# @formkit/addons

Optional first-party plugins that extend FormKit inputs with animations, multi-step forms, floating labels, localStorage persistence, and textarea enhancements.

## Architecture

```
src/
├── index.ts                    # Public exports (5 plugin factories)
├── plugins/
│   ├── autoAnimatePlugin.ts    # Auto-animate DOM sections
│   ├── autoHeightTextarea.ts   # Auto-resize textarea height
│   ├── floatingLabels/
│   │   └── floatingLabelsPlugin.ts  # Material-style floating labels
│   ├── inputCount.ts           # Character count display
│   ├── localStoragePlugin.ts   # Form data persistence
│   ├── maxlengthCountdown.ts   # Remaining chars countdown
│   └── multiStep/
│       ├── multiStepPlugin.ts  # Multi-step form logic
│       ├── schema.ts           # Input type definitions
│       └── sections/           # Schema section composables (13 files)
└── css/
    ├── floatingLabels.css      # Floating label styles
    ├── inputCount.css          # Input count styles
    ├── maxlengthCountdown.css  # Countdown styles
    └── multistep.css           # Multi-step form styles
```

## Key Abstractions

### Plugin Factories (Public API)

| Function | Purpose | Target Types |
|----------|---------|--------------|
| `createAutoAnimatePlugin(options?, targets?)` | Adds `@formkit/auto-animate` to schema sections | All with schema |
| `createAutoHeightTextareaPlugin()` | Auto-resize textarea to content | `textarea` only |
| `createFloatingLabelsPlugin(options?)` | Material-style floating labels | `text`, `dropdown`, `datepicker`, `textarea` families |
| `createInputCountPlugin(options?)` | Shows character count in help section | `text`, `password`, `textarea` |
| `createLocalStoragePlugin(options?)` | Persist/restore form data | `group` types (form, group, multi-step) |
| `createMaxLengthCountdownPlugin(options?)` | Shows remaining chars in suffix | `textarea` (configurable) |
| `createMultiStepPlugin(options?)` | Wizard-style multi-step forms | Creates `multi-step` and `step` types |

### Multi-Step System

The multi-step plugin is the most complex addon. It:
1. Registers two new input types via `library` function: `multi-step` (group) and `step` (group)
2. Extends nodes with navigation methods: `next()`, `previous()`, `goTo(target)`
3. Manages step state: `isActiveStep`, `isValid`, `hasBeenVisited`, `errorCount`, `blockingCount`
4. Supports validation gating via `allowIncomplete` prop
5. Provides `beforeStepChange` async guard hook

**Schema sections** (in `sections/`):
- `multiStepOuter`, `wrapper`, `tabs`, `tab`, `tabLabel`, `badge`, `stepIcon` - multi-step container
- `stepOuter`, `stepInner`, `stepActions`, `stepNext`, `stepPrevious`, `steps` - step container

### Plugin Pattern

All plugins follow the same pattern:
```typescript
function createXPlugin(options?): FormKitPlugin {
  return (node: FormKitNode) => {
    // 1. Type guard (skip if wrong input type)
    // 2. Add props via node.addProps([...])
    // 3. Hook into lifecycle: node.on('created'|'mounted', ...)
    // 4. Modify schema if needed via higher-order function
  }
}
```

Schema modification pattern (floating labels, input count, maxlength):
```typescript
const originalSchema = inputDefinition.schema
inputDefinition.schema = (extensions) => {
  extensions.someSection = { /* override */ }
  return originalSchema(extensions)
}
inputDefinition.schemaMemoKey += '-suffix'  // Important: invalidate cache
node.props.definition = inputDefinition
```

## Integration Points

- **Depends on**: `@formkit/core` (node, plugin types), `@formkit/inputs` (createSection, eachSection, findSection), `@formkit/utils` (clone, undefine, whenAvailable), `@formkit/auto-animate`
- **Depended on by**: User applications via plugin registration
- **Root CLAUDE.md section**: "Addons" in Packages list

## Modification Guide

### Adding a New Plugin

1. Create `src/plugins/myPlugin.ts`
2. Export factory function: `export function createMyPlugin(options?): FormKitPlugin`
3. Add export to `src/index.ts`
4. If CSS needed, add to `src/css/myPlugin.css` and export in `package.json`

### Modifying Multi-Step

- **Add section**: Create file in `sections/`, export from `sections/index.ts`, use in `schema.ts`
- **Add step prop**: Add to `props` array in `schema.ts`, add `node.addProps([])` in plugin
- **Add navigation method**: Use `node.extend('methodName', { get: (node) => () => {...} })`

### Adding Tests

- Location: `__tests__/[feature].spec.ts`
- Pattern: Mount with `@vue/test-utils`, pass plugin via `defaultConfig({ plugins: [...] })`
- Run: `pnpm test` from monorepo root

### Breaking Changes

- Removing/renaming exports from `index.ts`
- Changing plugin option interfaces
- Modifying section schema structure (affects user `sectionsSchema` overrides)
- Changing multi-step navigation method signatures

## Auto-Update Triggers

Update this CLAUDE.md when:
- New plugin factory added to `index.ts`
- New section added to `multiStep/sections/`
- Plugin option interface changes
- New CSS file added
- Dependencies change in `package.json`

## Deep Dive References

- **Multi-step navigation logic**: `src/plugins/multiStep/multiStepPlugin.ts` lines 280-410 (`isTargetStepAllowed`, `setActiveStep`, `incrementStep`)
- **Schema section pattern**: `src/plugins/multiStep/sections/stepNext.ts` (shows $cmp usage with FormKit button)
- **Higher-order schema pattern**: `src/plugins/floatingLabels/floatingLabelsPlugin.ts` lines 102-160
- **localStorage hooks**: `src/plugins/localStoragePlugin.ts` lines 60-170 (commit, submit hooks, beforeSave/Load)
- **Auto-animate observer**: `src/plugins/autoAnimatePlugin.ts` lines 25-57 (MutationObserver pattern)
