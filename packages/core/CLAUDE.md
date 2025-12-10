# @formkit/core

Framework-agnostic foundation for FormKit: node trees, state management, events, plugins, schema types, and the expression compiler.

## Architecture

```
src/
  node.ts        # Core node system: createNode(), FormKitNode, traps, tree operations
  store.ts       # Message store for validation/errors/state per node
  ledger.ts      # Aggregate message counting across subtrees
  events.ts      # Event emitter with bubble/deep modifiers
  dispatcher.ts  # Middleware dispatcher for hooks
  compiler.ts    # Schema expression compiler ($references, arithmetic, logic)
  schema.ts      # Schema type definitions and type guards
  config.ts      # Root config creation and propagation
  registry.ts    # Global node registry by id
  classes.ts     # CSS class generation utilities
  errors.ts      # Error/warning handlers with codes
  setErrors.ts   # Set errors by node id
  reset.ts       # Reset node values
  submitForm.ts  # Programmatic form submission
  index.ts       # Public API exports
```

## Key Abstractions

### FormKitNode (public)
Central abstraction. Proxy wrapping `FormKitContext` with trap-based methods.

- **Types**: `input` (any value), `group` (object of children), `list` (array of children)
- **Tree**: `parent`, `children`, `root`, `at(address)`, `walk()`, `each()`, `find()`
- **Value**: `value` (committed), `_value` (pre-commit), `input()` to set
- **Events**: `on()`, `off()`, `emit()`, `bubble()`
- **State**: `isSettled`, `settled` (promise), `disturb()`, `calm()`
- **Hooks**: `hook.input`, `hook.commit`, `hook.message`, `hook.prop`, `hook.text`, `hook.classes`, `hook.schema`, `hook.submit`, `hook.setErrors`, `hook.error`, `hook.init`
- **Creation**: `createNode(options)` factory function

### FormKitStore (public)
Message bag per node. Proxied object with traps.

- `set(message)`, `remove(key)`, `filter(callback)`, `reduce()`, `apply()`
- Messages have: `key`, `type`, `value`, `blocking`, `visible`, `meta`
- Common types: `validation`, `error`, `ui`, `state`

### FormKitLedger (public)
Counts messages across subtrees efficiently.

- `count(name, condition)` - register a counter
- `value(name)` - get current count
- `settled(name)` - promise resolving when count reaches 0
- Listens to `message-added.deep` / `message-removed.deep`

### FormKitDispatcher (public)
Middleware chain pattern for hooks.

- Call dispatcher to add middleware: `hook.input(middleware)`
- `dispatch(payload)` runs the chain
- Middleware signature: `(payload, next) => next(payload)`

### Schema Types (public)
JSON-serializable DOM/component definitions:

- `FormKitSchemaDOMNode`: `{ $el: 'div', attrs: {}, children: [] }`
- `FormKitSchemaComponent`: `{ $cmp: 'Component', props: {} }`
- `FormKitSchemaFormKit`: `{ $formkit: 'text', name: 'email' }` (sugar)
- `FormKitSchemaCondition`: `{ if: '$expr', then: [], else: [] }`
- Type guards: `isDOM()`, `isComponent()`, `isConditional()`, `isSugar()`, `sugar()`

### Compiler (public)
`compile(expr)` parses `$`-prefixed expressions into executable functions.

- `$foo` - token reference
- `$foo.bar` - nested access
- `$fn()` - function calls
- Operators: `&&`, `||`, `==`, `!=`, `===`, `!==`, `>`, `<`, `>=`, `<=`, `+`, `-`, `*`, `/`, `%`
- Returns `{ provide: (callback) => compiledFn }`

## Integration Points

- **Depends on**: `@formkit/utils` (token gen, clone, eq, type checks)
- **Depended on by**: `@formkit/vue`, `@formkit/inputs`, `@formkit/validation`, `@formkit/i18n`, `@formkit/observer`, `@formkit/zod`
- **Root CLAUDE.md section**: "Packages > Core", "Architecture > Node tree"

## Modification Guide

### Adding a New Hook
1. Add type to `FormKitHooks` interface in `node.ts`
2. Hooks auto-create on first access via proxy in `createHooks()`
3. Document when the hook fires and expected payload shape

### Adding a Node Trap (method)
1. Create trap function: `function myTrap(node, context, ...args)`
2. Add to `traps` object: `myTrap: trap(myTrap)`
3. Add type signature to `FormKitNode` type
4. Add JSDoc with signature/params/returns sections

### Adding Message Types
1. Define message shape via `createMessage()` in `store.ts`
2. Set `type` property (e.g., `validation`, `error`, `ui`, `state`)
3. Use `node.store.set(message)` to add
4. Messages emit: `message-added`, `message-updated`, `message-removed`

### Modifying Schema Types
1. Update type definitions in `schema.ts`
2. Add type guard if new node type
3. Update `sugar()` if adding syntactic sugar
4. Schema is rendered by `@formkit/vue` - coordinate changes

### Adding Tests
```bash
pnpm test packages/core
```
- Tests in `__tests__/*.spec.ts`
- Use `createNode()` directly
- Helpers in `/.tests/helpers.ts`
- Use `vi.fn()` for event/callback assertions

## Internal Patterns

### Proxy Trap Pattern
Node and Store use ES6 Proxy. Traps defined in `traps` object:
```ts
const traps = {
  methodName: trap(getter, setter?, curryGetter?)
}
```
- `curryGetter=true` (default): returns bound function
- `curryGetter=false`: returns value directly

### Settlement Pattern
Tracks when tree values are "done" changing:
- `disturb()` increments `_d`, creates `settled` promise
- `calm()` decrements `_d`, resolves when 0
- Propagates up tree automatically

### Config Inheritance
- `config` is proxied, changes emit `config:{prop}` events
- Props checked before config: `node.props.foo ?? node.config.foo`
- Children inherit unless they define their own value

### Plugin Pattern
```ts
const plugin: FormKitPlugin = (node) => {
  // Setup logic
  // return false to prevent inheritance to children
}
plugin.library = (node) => {
  // Input type registration
}
```

## Breaking Changes

What constitutes a breaking change:
- Removing/renaming public exports from `index.ts`
- Changing `FormKitNode` method signatures
- Changing hook payload shapes
- Modifying schema type structures
- Changing message type/key conventions
- Altering config inheritance behavior

## Auto-Update Triggers

Update this CLAUDE.md when:
- New export added to `index.ts`
- New hook type added to `FormKitHooks`
- New trap added to `traps` object
- New schema type or type guard added
- New message type convention introduced
- Public API signature changes

## Deep Dive References

- **Node lifecycle**: `node.ts` lines 1600-2400 (createNode, traps implementation)
- **Value flow**: `input()`, `commit()`, `hydrate()`, `partial()` in `node.ts`
- **Tree traversal**: `at()`, `walk()`, `find()` trap implementations
- **Expression parsing**: `compile()` in `compiler.ts`
- **Message system**: `createStore()`, trap implementations in `store.ts`
