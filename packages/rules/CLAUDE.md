# @formkit/rules

Built-in validation rule functions for FormKit's validation system. All rules conform to `FormKitValidationRule` type and return `boolean | Promise<boolean>`.

## Architecture

```
src/
├── index.ts          # Re-exports all rules as named exports
├── [rule].ts         # One file per rule (e.g., required.ts, email.ts)
__tests__/
├── [rule].spec.ts    # One test file per rule
```

## Rule Signature

Every rule is a function with this signature:
```ts
type FormKitValidationRule = {
  (node: FormKitNode, ...args: any[]): boolean | Promise<boolean>
  ruleName?: string
  skipEmpty?: boolean    // Default: true - skip validation if value empty
  force?: boolean        // Default: false - run even if prior rules failed
  blocking?: boolean     // Default: true - block form submission on failure
  debounce?: number      // Default: 0 - ms to debounce async rules
}
```

First argument is always the **full node** (not just value). Access `node.value` for the value.

## All Rules (37 total)

### Boolean/Acceptance
- `accepted` - Value is truthy acceptance (`yes`, `on`, `1`, `true`). Sets `skipEmpty: false`
- `required` - Value not empty. Optional `trim` arg. Sets `skipEmpty: false`
- `require_one` - At least one of specified sibling inputs has value. Sets `skipEmpty: false`

### Character Type
- `alpha` - Only alphabetic chars. Optional set: `default` (Unicode) or `latin`
- `alpha_spaces` - Alpha + spaces. Optional set: `default` or `latin`
- `alphanumeric` - Alpha + numeric. Optional set: `default` or `latin`
- `lowercase` - Only lowercase. Sets: `default`, `allow_non_alpha`, `allow_numeric`, `allow_numeric_dashes`, `latin`
- `uppercase` - Only uppercase. Optional set: `default` or `latin`
- `symbol` - Only symbol chars (`!-/:-@[-`{-~`)
- `number` - Value is numeric (passes `!isNaN()`)

### Contains (partial match)
- `contains_alpha` - Contains at least one alpha char
- `contains_alpha_spaces` - Contains alpha or space
- `contains_alphanumeric` - Contains alpha or numeric
- `contains_lowercase` - Contains lowercase char
- `contains_uppercase` - Contains uppercase char
- `contains_numeric` - Contains digit
- `contains_symbol` - Contains symbol char

### String Pattern
- `email` - Valid email format (RFC-ish regex)
- `url` - Valid URL. Optional protocol args (default: `http:`, `https:`)
- `matches` - Matches value or regex pattern. Regex as `/pattern/` string
- `starts_with` - Starts with any of the given strings
- `ends_with` - Ends with any of the given strings

### Comparison
- `is` - Value equals one of given values (loose comparison, deep equality for objects)
- `not` - Value does NOT equal any of given values
- `confirm` - Matches another input's value. Auto-infers `_confirm` suffix sibling. Args: `address?`, `comparison` (`loose`|`strict`)

### Numeric Range
- `min` - Number/array length >= minimum (default: 1)
- `max` - Number/array length <= maximum (default: 10)
- `between` - Number between two values (inclusive)
- `length` - String/array/object key length between min and max

### Date Validation
- `date_format` - Matches date format string (uses `regexForFormat` from utils)
- `date_after` - After given date (default: now)
- `date_after_or_equal` - After or equal to given date
- `date_before` - Before given date (default: now)
- `date_before_or_equal` - Before or equal to given date
- `date_between` - Between two dates
- `date_after_node` - After another input's date value (uses node address)
- `date_before_node` - Before another input's date value (uses node address)

## Cross-Input Validation

Rules like `confirm`, `date_after_node`, `date_before_node`, `require_one` access sibling inputs via `node.at(address)`:

```ts
// In confirm rule
const foreignValue = node.at(address)?.value
```

Address can be:
- Simple name: `password` (sibling)
- Relative: `$parent.password`
- Root-relative: `$root.master_password`

## Integration Points

- **Depends on**: `@formkit/core` (node types), `@formkit/utils` (helpers), `@formkit/validation` (type definitions)
- **Depended on by**: `@formkit/vue` (defaultConfig imports all rules)
- **Root CLAUDE.md section**: "Packages > Core > rules"

## Modification Guide

### Adding a New Rule

1. Create `src/[rule_name].ts`:
```ts
import { FormKitValidationRule } from '@formkit/validation'

const my_rule: FormKitValidationRule = function ({ value }, arg1, arg2) {
  return /* boolean */
}

// Optional: override default hints
// my_rule.skipEmpty = false

export default my_rule
```

2. Export from `src/index.ts`:
```ts
export { default as my_rule } from './my_rule'
```

3. Create test `__tests__/my_rule.spec.ts`:
```ts
import { createNode } from '@formkit/core'
import my_rule from '../src/my_rule'
import { describe, expect, it } from 'vitest'

describe('my_rule', () => {
  it('passes on valid input', () =>
    expect(my_rule(createNode({ value: 'valid' }))).toBe(true))
})
```

4. Add i18n message in `packages/i18n/src/locales/[locale].ts`

### Testing Pattern

Tests call rules directly with `createNode()`:
```ts
// Simple value test
expect(required(createNode({ value: '' }))).toBe(false)

// With arguments
expect(required(createNode({ value: ' ' }), 'trim')).toBe(false)

// Cross-input (create parent group)
const form = createNode({ type: 'group' })
const node = createNode({ name: 'password', parent: form, value: 'abc' })
createNode({ name: 'password_confirm', parent: form, value: 'abc' })
expect(confirm(node)).toBe(true)
```

Run tests: `pnpm test packages/rules`

### Breaking Changes

- Changing rule function signature
- Removing exported rules
- Changing default behavior (e.g., `skipEmpty`)
- Changing validation logic that would fail previously passing values

## Auto-Update Triggers

Update this CLAUDE.md when:
- New rule file added to `src/`
- Rule export added/removed from `src/index.ts`
- Rule signature changes (new required arguments)
- `skipEmpty`, `force`, `blocking`, `debounce` defaults change on any rule
- Dependencies change in `package.json`

## Deep Dive References

- Rule type definition: `/packages/validation/src/validation.ts` lines 103-106
- How rules are registered: `/packages/vue/src/defaultConfig.ts` lines 75-78
- How rules are executed: `/packages/validation/src/validation.ts` `runRule()` function
- Unicode character classes: Rules use `\p{L}` (letter), `\p{Ll}` (lowercase), `\p{Lu}` (uppercase)
