# @formkit/tailwindcss

**DEPRECATED**: Tailwind CSS plugin providing FormKit state variants. Use `@formkit/themes` instead.

## Architecture

```
src/index.ts        # Single-file package: exports Tailwind plugin + re-exports generateClasses
playground/         # Dev testing environment with sample theme
```

## Key Abstractions

### Public API

- **`default` export** (`formKitVariants`): Tailwind plugin that registers `formkit-*` variants
- **`generateClasses`**: Re-exported from `@formkit/themes` for backward compatibility

### Variants Provided

All variants match `data-*` attributes on FormKit outer wrapper:

| Variant | Matches |
|---------|---------|
| `formkit-disabled:` | `[data-disabled]` |
| `formkit-invalid:` | `[data-invalid]` |
| `formkit-errors:` | `[data-errors]` |
| `formkit-complete:` | `[data-complete]` |
| `formkit-loading:` | `[data-loading]` |
| `formkit-submitted:` | `[data-submitted]` |
| `formkit-multiple:` | `[data-multiple]` |
| `formkit-action:` | `.formkit-actions` |
| `formkit-message-validation:` | `[data-message-type="validation"]` |
| `formkit-message-error:` | `[data-message-type="error"]` |

Each variant generates 3 selectors: `&[data-*]`, `[data-*] &`, `[data-*]&` to match element itself, children, and direct attachment.

## Integration Points

- **Depends on**: `tailwindcss` (peer), `@formkit/themes` (runtime dependency)
- **Depended on by**: User projects (deprecated, should migrate to `@formkit/themes/tailwindcss`)
- **Root CLAUDE.md section**: Packages > Styling

### Migration Path

This package wraps and re-exports from `@formkit/themes`. The `@formkit/themes/tailwindcss` export provides the same plugin with additional features:

```js
// OLD (deprecated)
require('@formkit/tailwindcss')

// NEW (recommended)
require('@formkit/themes/tailwindcss')
```

The `@formkit/themes/tailwindcss` version uses `matchVariant` for more flexible selectors and supports additional attributes (`checked`, `prefix-icon`, `suffix-icon`).

## Modification Guide

### Adding Features

**Do not add features here.** This package is deprecated. Add new variants to `packages/themes/src/tailwindcss/index.ts` instead.

### Adding Tests

No tests exist. Test via playground:
```bash
cd packages/tailwindcss/playground
pnpm dev
```

### Breaking Changes

Any change to variant names or selectors is breaking. Since deprecated, avoid all changes except critical fixes.

## Auto-Update Triggers

Update this CLAUDE.md when:
- Package is un-deprecated
- Migration guidance changes
- `@formkit/themes` export structure changes

## Deep Dive References

- Variant implementation: `/Users/justinschroeder/Projects/formkit/packages/tailwindcss/src/index.ts`
- Replacement implementation: `/Users/justinschroeder/Projects/formkit/packages/themes/src/tailwindcss/index.ts`
- Theme class generation: `/Users/justinschroeder/Projects/formkit/packages/themes/src/index.ts` (`generateClasses` function)
- Example theme structure: `/Users/justinschroeder/Projects/formkit/packages/tailwindcss/playground/src/theme.js`
