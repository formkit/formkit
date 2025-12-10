# @formkit/i18n

Internationalization plugin providing locale-aware UI text and validation messages for FormKit nodes.

## Architecture

- `src/i18n.ts` - Core plugin factory and locale parsing logic
- `src/formatters.ts` - Text formatting utilities (sentence case, oxford comma lists, dates)
- `src/index.ts` - Exports all locales and re-exports plugin/formatters
- `src/locales/` - 45+ locale files (ISO 639-1 codes: `en.ts`, `de.ts`, `zh-TW.ts`, etc.)

## Key Abstractions

### Public API

- **`createI18nPlugin(registry)`** - Factory returning `FormKitPlugin`. Hooks into `node.hook.text` to intercept and translate text fragments.
- **`changeLocale(locale)`** - Globally changes locale for all registered nodes.
- **`locales`** - Object containing all locale definitions keyed by ISO code.
- Individual locale exports (`en`, `de`, `fr`, etc.) for tree-shaking.

### Types

- **`FormKitLocale`** - Locale definition with `ui` namespace + arbitrary namespaces (`validation`, etc.)
- **`FormKitLocaleMessages`** - Key-value map: string keys to string or function returning string.
- **`FormKitLocaleRegistry`** - Map of locale codes to `FormKitLocale` objects.

### Formatters (used in locale message functions)

- `sentence(str)` - Capitalize first character
- `list(items, conjunction)` - Oxford comma list ("a, b, or c")
- `date(date)` - Intl.DateTimeFormat with medium dateStyle
- `order(a, b)` - Returns [smaller, larger] tuple

### Locale Structure

```ts
// Each locale exports { ui, validation }
const ui: FormKitLocaleMessages = {
  add: 'Add',
  remove: 'Remove',
  submit: 'Submit',
  // ... 20+ UI strings
}

const validation: FormKitValidationMessages = {
  required({ name }) { return `${name} is required.` },
  email: 'Please enter a valid email address.',
  // ... 40+ validation messages (string or function)
}
```

## Integration Points

- **Depends on**: `@formkit/core` (node, plugin types), `@formkit/utils` (has), `@formkit/validation` (message types)
- **Depended on by**: `@formkit/vue` (defaultConfig creates i18n plugin), `@formkit/nuxt`
- **Root CLAUDE.md section**: "Packages > Core (framework-agnostic)" mentions i18n

### How it connects

1. `createI18nPlugin()` returns a plugin that registers with each node
2. Plugin hooks `node.hook.text` to intercept `FormKitTextFragment` objects
3. Fragments have `type` (namespace) and `key` - matched against locale registry
4. Validation messages come from `@formkit/validation` which emits fragments with `type: 'validation'`
5. UI strings use `type: 'ui'` (accessed via `node.t('add')`)

## Modification Guide

### Adding a New Locale

1. Copy `src/locales/en.ts` to `src/locales/{code}.ts`
2. Translate all `ui` strings and `validation` message functions
3. Update `src/index.ts`:
   - Add import: `import { xx } from './locales/xx'`
   - Add to `locales` object
   - Add to individual exports
4. Preserve `/* <i18n case="..."> */` comment markers (used for translation tooling)

### Adding UI Strings

1. Add to `src/locales/en.ts` in `ui` object
2. Add translations to all other locale files (or leave untranslated - falls back to key)

### Adding Validation Messages

1. Validation messages live in `@formkit/rules` first - the rule must exist
2. Add message to `validation` object in `src/locales/en.ts`
3. Messages can be string or function: `({ name, args, node, value }) => string`
4. Add translations to other locales

### Modifying Formatters

Edit `src/formatters.ts`. Used by locale message functions for consistent formatting.

## Testing

```bash
pnpm test --filter=@formkit/i18n
```

- `__tests__/i18n.spec.ts` - Plugin integration, locale switching
- `__tests__/formatters.spec.ts` - Formatter unit tests

## Auto-Update Triggers

Update this CLAUDE.md when:
- New locale file added to `src/locales/`
- New export added to `src/index.ts`
- `FormKitLocale` or `FormKitLocaleMessages` types change
- New formatter function added to `src/formatters.ts`
- New UI string key added across all locales

## Deep Dive References

- Plugin mechanics: `src/i18n.ts` lines 70-109
- Locale fallback logic: `parseLocale()` in `src/i18n.ts` lines 125-140
- Complete UI key list: `src/locales/en.ts` lines 18-104
- Complete validation message list: `src/locales/en.ts` lines 110-525
