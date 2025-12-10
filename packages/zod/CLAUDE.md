# @formkit/zod

Zod schema validation plugin for FormKit forms. Bridges Zod's type-safe validation with FormKit's error display system.

## Architecture

```
src/
  index.ts    # Re-exports createZodPlugin
  zod.ts      # Plugin implementation (~215 lines)
__tests__/
  zod.spec.ts # Vitest tests with Vue mounting
```

## Key Abstractions

### Public API

- **`createZodPlugin(zodSchema, submitCallback)`**: Factory function returning `[FormKitPlugin, submitHandler]` tuple
  - `zodSchema`: Any Zod schema (`z.ZodTypeAny`)
  - `submitCallback`: `(payload: z.infer<typeof zodSchema>, node: FormKitNode | undefined) => void | Promise<void>`
  - Returns: Tuple of plugin and submit handler to use with `@submit`

### Node Extension

- **`node.setZodErrors(zodError)`**: Method added to form nodes via `node.extend()`. Hydrates FormKit errors from a `z.ZodError` object. Useful for server-side validation.

### Internal Functions

- `performZodValidation()`: Runs `safeParse` and maps errors to nodes
- `setFormValidations()`: Distributes errors to matching nodes or form-level
- `zodErrorToFormKitErrors()`: Converts `z.ZodError` to `[formErrors[], fieldErrors{}]`
- `createMessageName()`: Resolves display name from `validationLabel > label > name`

## How It Works

1. Plugin attaches to `type="form"` nodes only (returns `false` for non-forms)
2. Creates ledger counter `existingValidation` to track native FormKit validation
3. On `commit` event: Debounced validation (150ms) with 600ms max interval
4. On `message-added` with `submitted` state: Immediate validation
5. Errors set as blocking validation messages with key pattern `{path}:zod`
6. When native validation appears (`existingValidation` unsettles), zod errors clear for that field

## Integration Points

- **Depends on**: `@formkit/core` (FormKitNode, FormKitPlugin, createMessage)
- **Peer dependency**: `zod ^3.0.0`
- **Dev dependency**: `@formkit/vue` (testing only)
- **Depended on by**: None (leaf package)
- **Root CLAUDE.md section**: "Addons" category

## Usage Pattern

```ts
import { createZodPlugin } from '@formkit/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(3)
})

const [zodPlugin, submitHandler] = createZodPlugin(schema, async (data) => {
  // data is typed as z.infer<typeof schema>
  await api.submit(data)
})
```

```vue
<FormKit type="form" :plugins="[zodPlugin]" @submit="submitHandler">
  <FormKit name="email" />
  <FormKit name="name" />
</FormKit>
```

## Modification Guide

### Adding Features

- All logic lives in `src/zod.ts`
- Follow existing pattern: functions inside `createZodPlugin` closure for access to `zodValidationSet` and `zodValidationListeners`
- New node methods: Add via `node.extend()` in the `created` event handler
- New TypeScript types: Extend `FormKitNodeExtensions` interface in `@formkit/core` module declaration

### Adding Tests

- Location: `__tests__/zod.spec.ts`
- Pattern: Mount Vue components with `@vue/test-utils`, trigger form submission, assert on DOM or spy calls
- Helper: `nextTick(timeout?)` for async settling
- Run: `pnpm test` from monorepo root

### Breaking Changes

- Changing `createZodPlugin` signature or return type
- Changing `setZodErrors` method signature
- Altering error message key format (`{path}:zod`)
- Modifying timing behavior (debounce/throttle values)

## Error Mapping Logic

1. Zod errors parsed via `zodError.issues`
2. Each issue's `path` joined with `.` (e.g., `personalInfo.firstName`)
3. `node.at(path)` locates target FormKit node
4. If node found: Error added to that node's store
5. If node not found: Error added to form-level errors (only on submit)

## Auto-Update Triggers

Update this CLAUDE.md when:
- New export added to `src/index.ts`
- New method added to `FormKitNodeExtensions`
- Validation timing logic changes
- Error mapping behavior changes
- Dependencies updated in `package.json`

## Deep Dive References

- Zod plugin implementation: `src/zod.ts`
- FormKit node API: `packages/core/src/node.ts`
- Ledger system: `packages/core/src/ledger.ts`
- Message creation: `packages/core/src/store.ts`
- Example usage: `examples/src/vue/examples/Zod.vue`
