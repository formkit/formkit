# @formkit/utils

Zero-dependency utility library shared across all FormKit packages.

## Architecture

```
src/
  index.ts      # All exports (single file package)
__tests__/
  utils.spec.ts # Vitest test suite
```

Single-file package. All utilities exported from `src/index.ts`.

## Key Abstractions

### Type Checking
- `isRecord(o)` - True if plain `[object Object]`
- `isObject(o)` - True if record OR array
- `isPojo(o)` - True if plain object (excludes `__FKNode__`, `__POJO__: false`)
- `empty(value)` - Emptiness check (handles strings, arrays, objects, null, undefined, Date, RegExp)

### Object Manipulation
- `extend(original, additional, extendArrays?, ignoreUndefined?)` - Deep merge, returns new object
- `assignDeep(a, b)` - Mutates `a` with values from `b`
- `clone(obj, explicit?)` - Deep clone POJOs/arrays (preserves Date, RegExp, Map, Set, File)
- `shallowClone(obj, explicit?)` - Single-level clone
- `cloneAny(obj)` - Clone if object, passthrough otherwise
- `spread(obj, explicit?)` - Shallow spread preserving explicit non-enumerable keys
- `only(obj, include)` - Keep only specified keys (strings or RegExp)
- `except(obj, toRemove)` - Remove specified keys (strings or RegExp)
- `getAt(obj, addr)` - Dot-notation accessor (`getAt(obj, 'a.b.0')`)
- `has(obj, property)` - Safe `hasOwnProperty` check

### Equality
- `eq(valA, valB, deep?, explicit?)` - Deep equality with Date/RegExp support
- `eqRegExp(x, y)` - RegExp equality (source + flags)

### String Utilities
- `token()` - Random alphanumeric string (13 chars)
- `camel(str)` - kebab-case to camelCase
- `kebab(str)` - camelCase to kebab-case
- `slugify(str)` - URL-safe slug (normalizes unicode)
- `escapeExp(str)` - Escape for RegExp use
- `rmEscapes(str)` - Remove escape characters
- `isQuotedString(str)` - Detect fully quoted string
- `parseArgs(str)` - Parse comma-separated args respecting quotes/parens

### Date Utilities
- `regexForFormat(format)` - Build regex from date format tokens (MM, M, DD, D, YYYY, YY)
- `FormKitDateTokens` - Type for date format tokens

### FormKit-Specific
- `nodeType(type)` - Normalize input type to `'list' | 'group' | 'input'`
- `nodeProps(...sets)` - Filter out `value`, `name`, `modelValue`, `config`, `plugins`
- `init(obj)` - Mark object with non-enumerable `__init: true`
- `undefine(value)` - Returns `true` unless value is `undefined`, `false`, or `'false'`
- `boolGetter(value)` - Returns `true` unless value is `false` or `'false'`
- `dedupe(arr1, arr2?)` - Combine arrays removing duplicates
- `setify(items)` - Convert array/Set/null to Set

### DOM/Browser
- `whenAvailable(childId, callback, root?)` - MutationObserver-based element wait
- `oncePerTick(fn)` - Debounce to single call per microtask

### Internal Constants
- `explicitKeys` - Non-enumerable keys preserved during cloning: `['__key', '__init', '__shim', '__original', '__index', '__prevKey']`
- `isBrowser` - Browser environment detection

## Integration Points

- **Depends on**: Nothing (zero dependencies)
- **Depended on by**: core, observer, inputs, validation, rules, i18n, vue, addons, cli, dev
- **Root CLAUDE.md section**: Listed under "Core (framework-agnostic)" packages

## Modification Guide

### Adding Utilities
1. Add function to `src/index.ts` with JSDoc including `@public` tag
2. Export function (all exports are named)
3. Add tests to `__tests__/utils.spec.ts`
4. Use `/*#__NO_SIDE_EFFECTS__*/` comment for tree-shaking optimization (see `extend`)

### Testing
```bash
pnpm test packages/utils
```
Tests use Vitest. Pattern: `describe('functionName', () => { it('behavior', ...) })`

### Breaking Changes
Any signature change to exported functions. This package is foundational; changes cascade to all dependents.

## Auto-Update Triggers

Update this CLAUDE.md when:
- New function exported from `src/index.ts`
- Function signature changes
- New non-enumerable explicit key added to `explicitKeys`
- Package gains dependencies

## Deep Dive References

- **Cloning behavior**: See `clone()`, `shallowClone()`, `spread()` and `explicitKeys` for non-enumerable key handling
- **Object merging**: `extend()` vs `assignDeep()` - extend returns new object, assignDeep mutates
- **POJO detection**: `isPojo()` checks for `__FKNode__` and `__POJO__` markers used by core
