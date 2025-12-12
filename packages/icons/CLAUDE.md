# @formkit/icons

SVG icon library for FormKit inputs. Provides ~145 icons across 8 categories plus a plugin system for icon registration.

## Architecture

```
src/
  index.ts       # All icon imports, category exports, and `icons` master export
  plugin.ts      # createIconPlugin (incomplete/WIP)
  icons/
    application/ # UI icons: check, close, spinner, trash, etc. (~50)
    brand/       # Social: github, twitter, facebook, etc. (~19)
    crypto/      # Cryptocurrency: bitcoin, ethereum, etc. (~9)
    currency/    # Money symbols: dollar, euro, yen, etc. (~15)
    directional/ # Arrows and carets (~13)
    file/        # File types and actions (~12)
    input/       # FormKit input type icons (~27)
    payment/     # Card brands: visa, mastercard, etc. (~7)
```

Each icon file exports a default string containing raw SVG markup using `currentColor` for fill.

## Key Abstractions

### Icon Format
```ts
// Individual icon file pattern (e.g., Check.ts)
export default `<svg xmlns="..." viewBox="..."><path fill="currentColor" .../></svg>`
```

### Exported Collections (Public API)
- `icons` - Master object with all icons (use for full registration)
- `genesisIcons` - Curated set for Genesis theme (default FormKit theme)
- `applicationIcons`, `brandIcons`, `cryptoIcons`, `currencyIcons`, `directionalIcons`, `fileIcons`, `inputIcons`, `paymentIcons` - Category-specific bundles

### Plugin (WIP)
- `createIconPlugin(icons)` - Returns a FormKit plugin. Currently incomplete (see TODOs in plugin.ts)

## Integration Points

- **Depends on**: `@formkit/core` (for `FormKitNode` type in plugin)
- **Depended on by**:
  - `@formkit/themes` - Fetches icons from CDN at `dist/icons/{name}.svg`
  - `@formkit/vue` - Uses icons in tests
  - `@formkit/cli` - Imports `genesisIcons` in generated configs
- **Root CLAUDE.md section**: Listed under "Core (framework-agnostic)" packages

### CDN Usage
Built icons are published to `dist/icons/{iconName}.svg`. The themes package fetches icons remotely via:
```
https://cdn.jsdelivr.net/npm/@formkit/icons@{version}/dist/icons/{iconName}.svg
```

## Modification Guide

### Adding a New Icon
1. Create `src/icons/{category}/{IconName}.ts`:
   ```ts
   export default `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 X Y">...</svg>`
   ```
2. Add import and export in `src/index.ts`:
   - Import at top with category group
   - Add to relevant category export (`applicationIcons`, etc.)
   - Add to `icons` master export
   - Add to named exports at bottom
3. If UI-critical, consider adding to `genesisIcons`

### Adding a New Category
1. Create directory `src/icons/{newcategory}/`
2. Add icon files
3. Create `{newcategory}Icons` export object in `index.ts`
4. Add icons to `icons` master export

### Icon Requirements
- Use `fill="currentColor"` for theme compatibility
- Keep viewBox consistent within categories when possible
- SVG must be valid, self-contained string

### Adding Tests
No test infrastructure currently exists. Package uses `jest` (see package.json) but no test files present.

### Breaking Changes
- Removing or renaming an icon in `icons` or `genesisIcons`
- Changing export structure of category bundles
- Modifying SVG viewBox (affects sizing in themes)

## Auto-Update Triggers

Update this CLAUDE.md when:
- New icon category directory added under `src/icons/`
- New export added to `index.ts` (category bundle or individual icon)
- `createIconPlugin` implementation completed
- Dependency on `@formkit/core` changes
- Build output structure changes (`dist/icons/` format)

## Deep Dive References

- Icon registration/loading: `/Users/justinschroeder/Projects/formkit/packages/themes/src/index.ts` (see `createIconHandler`, `iconRegistry`)
- Genesis theme icon requirements: `genesisIcons` export in `src/index.ts`
- Plugin pattern (WIP): `src/plugin.ts`
