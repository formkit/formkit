# @formkit/validation

Plugin that runs validation rules against FormKit nodes, manages validation state, and emits error messages to the node store.

## Architecture

```
src/
  index.ts         - Public API exports
  validation.ts    - Plugin factory, rule parsing, validation execution
__tests__/
  validation.spec.ts - Unit tests for parsing and rule sequencing
```

## Key Abstractions

### Public API

- **`createValidationPlugin(baseRules)`** - Factory returning plugin function. Pass rules from `@formkit/rules` or custom rules.
- **`getValidationMessages(node)`** - Extract all validation messages from node tree as `Map<FormKitNode, FormKitMessage[]>`.
- **`createMessageName(node)`** - Get display name for messages: `validationLabel` > `label` > `name` > `node.name`.

### Types

- **`FormKitValidation`** - Parsed rule with state: `rule`, `args`, `state`, `queued`, `deps`, `observer`, hints.
- **`FormKitValidationIntent`** - Pre-parsed rule tuple: `[ruleName, ...args]`.
- **`FormKitValidationRule`** - Function `(node, ...args) => boolean | Promise<boolean>`. Can have hint properties.
- **`FormKitValidationRules`** - Object mapping rule names to rule functions.
- **`FormKitValidationHints`** - Behavior modifiers: `blocking`, `debounce`, `force`, `skipEmpty`, `name`.
- **`FormKitValidationMessages`** - Object mapping rule names to message strings/functions.
- **`FormKitValidationI18NArgs`** - Arguments passed to i18n message functions: `[{ node, name, args, message? }]`.

### Internal Functions

- **`parseRules(validation, rules, node)`** - Convert string/intent array to `FormKitValidation[]`.
- **`validate(node, validations, state)`** - Entry point for running validation stack.
- **`run(current, validations, state, removeImmediately, complete)`** - Recursive rule executor with dependency tracking.
- **`runRule(validation, node, after)`** - Execute single rule with optional debounce.
- **`createFailedMessage(validation, removeImmediately)`** - Create and observe validation error message.

## Validation Hints (String Syntax)

Rules accept prefix hints in string validation props:

| Hint | Effect | Example |
|------|--------|---------|
| `*` | `force: true` - Run even if prior rule failed | `*contains:foo` |
| `+` | `skipEmpty: false` - Run on empty values | `+required` |
| `?` | `blocking: false` - Don't block form submission | `?email` |
| `(N)` | `debounce: N` - Wait N ms before running | `(200)email` |

Combine hints: `*(200)?email` = forced, debounced 200ms, non-blocking.

## Rule Execution Flow

1. Plugin installed on node via `createValidationPlugin(rules)`
2. Rules parsed from `node.props.validation` (string or array format)
3. Each rule wrapped in `FormKitObservedNode` for dependency tracking
4. Rules run sequentially; failing rule blocks subsequent unless `force: true`
5. Async rules and debounced rules mark node as `validating`
6. Dependencies (cross-node references like `confirm:password`) trigger re-validation when changed
7. Messages stored with key `rule_${ruleName}`

## Message Store Keys

- **`rule_${name}`** - Validation failure message (type: `validation`)
- **`validating`** - State message while async/debounced rules pending (type: `state`, blocking)
- **`failing`** - State tracking if any rule failed (type: `state`, not visible)

## Integration Points

- **Depends on**: `@formkit/core` (node, messages), `@formkit/observer` (dependency tracking), `@formkit/utils` (helpers)
- **Depended on by**: `@formkit/vue` (defaultConfig), `@formkit/i18n` (message types), `@formkit/rules` (rule type)
- **Root CLAUDE.md section**: "validation (@packages/validation)" under Packages > Core

## Modification Guide

### Adding Features

1. New hint types: Extend `FormKitValidationHints`, update `parseHints()` map
2. New message meta: Modify `createFailedMessage()` message creation
3. Execution behavior: Modify `run()` and `validate()` functions

### Adding Custom Rules

Rules are NOT in this package. See `@formkit/rules` for rule implementations. This package only provides:
- The plugin that runs rules
- Parsing validation strings
- Managing validation state

Custom rules via props:
```ts
validationRules: { myRule: (node, ...args) => boolean }
validationMessages: { myRule: ({ name, args }) => string }
```

### Adding Tests

Location: `__tests__/validation.spec.ts`
Run: `pnpm test` from monorepo root

Test patterns used:
- `parseRules()` for parsing verification
- `createValidationPlugin({...})` with mock rules
- `createNode()` with plugin for integration tests
- `await nextTick()` / `setTimeout` for async rule testing
- Check `node.store` for message presence

### Breaking Changes

- Changing `FormKitValidation` structure affects rule observers
- Modifying hint characters breaks existing validation strings
- Changing message keys breaks CSS selectors and i18n

## Auto-Update Triggers

Update this CLAUDE.md when:
- New export added to `src/index.ts`
- New hint character added to `parseHints()`
- New message store key pattern introduced
- `FormKitValidation` type modified
- Public function signature changes

## Deep Dive References

- Rule parsing: `src/validation.ts` lines 540-730 (`parseRules`, `parseHints`, `extractRules`)
- Execution engine: `src/validation.ts` lines 288-400 (`run`, `runRule`)
- Message creation: `src/validation.ts` lines 424-475 (`createFailedMessage`)
- i18n integration: See `@formkit/i18n/src/locales/en.ts` for message format examples
