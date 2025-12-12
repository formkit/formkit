# @formkit/observer

Dependency-tracking proxy wrapper for FormKitNode enabling reactive re-execution when accessed properties change.

## Architecture

```
src/
  index.ts          # Single file: all exports, proxy implementation, watcher logic
__tests__/
  observer.spec.ts  # Comprehensive tests covering all features
```

Core concept: Wrap a `FormKitNode` in a `Proxy` that tracks which properties are accessed during a "watched" code block, then automatically re-runs that block when any tracked dependency emits a change event.

## Key Abstractions

### Public API

| Export | Type | Purpose |
|--------|------|---------|
| `createObserver(node, deps?)` | function | Creates proxy wrapper around node |
| `diffDeps(prev, curr)` | function | Returns `[toAdd, toRemove]` dependency maps |
| `applyListeners(node, [add, remove], cb, pos?)` | function | Subscribes/unsubscribes to node events |
| `removeListeners(receipts)` | function | Bulk unsubscribe all tracked listeners |
| `isKilled(node)` | function | Check if observer was destroyed |

### Types

| Type | Purpose |
|------|---------|
| `FormKitObservedNode` | Extended FormKitNode with observer methods |
| `FormKitDependencies` | `Map<FormKitNode, Set<string>>` of node-to-events |
| `FormKitObserverReceipts` | Tracks event listener receipts for cleanup |
| `FormKitWatchable<T>` | Callback signature `(node: FormKitObservedNode) => T` |

### FormKitObservedNode Methods

| Method | Behavior |
|--------|----------|
| `observe()` | Start tracking; clears existing deps, sets `deps.active = true` |
| `stopObserve()` | Stop tracking; returns captured dependencies |
| `watch(block, after?, pos?)` | Auto-rerun `block` when deps change; `after` runs with result |
| `kill()` | Remove all listeners, revoke proxy (throws on future access) |
| `_node` | Access underlying unwrapped FormKitNode |
| `deps` | Current dependency map |
| `receipts` | Event listener receipt registry |

## Dependency Tracking

When `deps.active = true`, property access triggers `addDependency(eventName)`:

| Property Accessed | Event Tracked |
|-------------------|---------------|
| `node.value` | `commit` |
| `node._value` | `input` |
| `node.props.X` | `prop:X` |
| `node.ledger.value('X')` | `count:X` |
| `node.children` | `child`, `childRemoved` |
| Any method returning a node | Recursively wrapped in observer |

## Integration Points

- **Depends on**: `@formkit/core` (FormKitNode, isNode, events), `@formkit/utils` (has)
- **Depended on by**: `@formkit/vue` (reactive class generation), `@formkit/validation` (cross-node rule deps)
- **Root CLAUDE.md section**: "Packages > Core" - listed as "observer: Dependency-tracking proxy for reactive node updates"

### Usage in @formkit/vue

`packages/vue/src/bindings.ts` uses `createObserver` to reactively compute CSS classes. When node config/props change, class strings auto-regenerate.

### Usage in @formkit/validation

`packages/validation/src/validation.ts` uses full observer API for cross-node validation rules (e.g., `confirm` rule watching another field). Each validation rule gets its own observer that re-runs when dependencies change.

## Modification Guide

### Adding Features

1. All code lives in `src/index.ts` - add new tracked properties in the `observe()` function's switch cases
2. New events to track: add case in the proxy getter's observe function
3. New observer methods: add to the proxy getter's switch statement for special properties

### Tracking New Properties

```ts
// In observe() function, add:
if (property === 'yourProp') addDependency('your-event-name')
```

### Adding Tests

- Test file: `__tests__/observer.spec.ts`
- Pattern: Create node with `createNode()`, wrap with `createObserver()`, use `vi.fn()` for watchers
- Key assertions: `toHaveBeenCalledTimes()`, check `deps` map contents

Run tests:
```bash
pnpm test packages/observer
```

### Breaking Changes

- Changing `FormKitObservedNode` interface methods
- Modifying which events are tracked for existing properties
- Changing `diffDeps` return structure
- Altering `watch()` callback timing or signature

## Implementation Notes

### Proxy.revocable

Uses `Proxy.revocable()` for the node wrapper. On `kill()`:
1. All listeners removed via `removeListeners(receipts)`
2. Observer added to `revokedObservers` WeakSet
3. Proxy revoked (future access throws TypeError)

### Recursive Observation

When a method returns another FormKitNode (e.g., `node.at('child')`), the result is automatically wrapped in a new observer sharing the same `deps` map. This enables cross-node dependency tracking.

### Event Listener Positioning

`watch()` accepts `pos` parameter (`'push'` | `'unshift'`) passed through to `applyListeners()`. Validation uses `'unshift'` to ensure validating state is set before other handlers run.

## Auto-Update Triggers

Update this CLAUDE.md when:
- New property tracking added to proxy getter
- New methods added to FormKitObservedNode interface
- Event mapping changes (property -> event name)
- New exports added to index.ts
- Dependencies change in package.json

## Deep Dive References

- Proxy implementation: `src/index.ts:151-202` (main proxy handler)
- Watch loop: `src/index.ts:264-285` (watch function)
- Dependency diffing: `src/index.ts:295-326` (diffDeps function)
- Vue integration example: `/packages/vue/src/bindings.ts:196-224` (class computation)
- Validation integration: `/packages/validation/src/validation.ts:288-380` (run function)
