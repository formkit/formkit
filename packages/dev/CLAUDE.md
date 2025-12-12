# @formkit/dev

Human-readable error and warning message decoder for FormKit development.

## Architecture

```
src/
  index.ts     # Error/warning catalogs + middleware registration
__tests__/
  handlers.spec.ts   # Tests for all error/warning codes
```

## Key Abstractions

### Public Exports

- **`errors`**: `Record<number, string | ((payload) => string)>` - Error code catalog
- **`warnings`**: `Record<number, string | ((payload) => string)>` - Warning code catalog
- **`register()`**: Idempotent function that attaches decoders to `@formkit/core` handlers

### Internal

- **`decodeErrors`**: Middleware that transforms error codes into messages
- **`decodeWarnings`**: Middleware that transforms warning codes into messages

## Error Code Ranges

| Range | Domain | Examples |
|-------|--------|----------|
| 100-199 | Core/node errors | E100: children on input, E101: direct store modification |
| 150-199 | Core warnings | W150: invalid schema function, W151/W152: missing form/input id |
| 300-399 | Input errors | E300: overscroll with function options |
| 350-399 | Input warnings | W350: invalid options prop |
| 600-699 | Vue errors | E600: unknown input type, E601: missing schema/component |
| 650-699 | Vue warnings | W650: $get() without id, W651/W652: setErrors/clearErrors on missing id |
| 800-899 | Deprecation warnings | W800: deprecation notice |

## How It Works

1. `@formkit/core` exports `errorHandler` and `warningHandler` dispatchers
2. These emit payloads with numeric codes: `{ code: 100, data: node }`
3. Without `@formkit/dev`, errors show as `E100` (opaque)
4. With `@formkit/dev`, `register()` adds middleware that decodes to human messages
5. `defaultConfig` from `@formkit/vue` calls `register()` automatically

## Integration Points

- **Depends on**: `@formkit/core` (handler registration, types)
- **Depended on by**: `@formkit/vue` (via `defaultConfig`)
- **Root CLAUDE.md section**: Dev/CLI packages

## Modification Guide

### Adding a New Error Code

1. Add entry to `errors` object in `src/index.ts`
2. Use appropriate code range based on domain
3. Add test case in `__tests__/handlers.spec.ts`
4. Value can be string or function receiving `FormKitHandlerPayload`

### Adding a New Warning Code

1. Add entry to `warnings` object in `src/index.ts`
2. Use appropriate code range based on domain
3. Add test case in `__tests__/handlers.spec.ts`

### Code Conventions

- Error functions receive `{ data: ... }` - destructure data to typed payload
- Include node name in messages when available: `(${node.name})`
- Include links to docs when relevant: `See: https://formkit.com/...`

### Running Tests

```bash
pnpm test --filter @formkit/dev
```

## Auto-Update Triggers

Update this CLAUDE.md when:
- New error/warning code range is introduced
- `register()` behavior changes
- New exports added to `src/index.ts`
- Integration with core handlers changes

## Deep Dive References

- Error/warning dispatchers: `/packages/core/src/errors.ts`
- Auto-registration in Vue: `/packages/vue/src/defaultConfig.ts`
- Handler middleware pattern: `/packages/core/src/dispatcher.ts`
