# @formkit/themes

Provides theme infrastructure, CSS-based utility classes, and framework-agnostic styling plugins for Tailwind/UnoCSS/WindiCSS.

## Architecture

```
src/
  index.ts              # Core: generateClasses, createThemePlugin, icon handling
  tailwindcss/
    index.ts            # Tailwind plugin with formkit-* state variants
    genesis/index.ts    # Pre-built Tailwind class mappings
  unocss/index.ts       # UnoCSS preset with formkit-* variants
  windicss/index.ts     # WindiCSS plugin (deprecated)
  css/genesis/
    index.ts            # CSS theme entry point
    genesis.css         # Master CSS import file
    variables.css       # CSS custom properties (--fk-*)
    structure.css       # Layout/box model styles
    colors.css          # Color assignments
    typography.css      # Font styles
    animations.css      # Keyframe animations
    formkit-reset.css   # CSS resets
    inputs/             # Input-specific CSS (button, checkbox, color, etc.)
    extras/             # Additional component styles (summary)
    addons/             # Icon integration CSS
```

## Key Abstractions

### Public API

- **`generateClasses(classes)`**: Transforms input-type-keyed class objects into section-key-keyed class functions. Supports `global`, `family:*`, and specific input types. Special `$reset` token clears inherited classes.

- **`createThemePlugin(theme, icons, iconLoaderUrl, iconLoader)`**: Creates FormKit plugin that handles:
  - Theme CSS loading from CDN (if not locally present)
  - Icon registry management and lazy loading
  - Icon click handlers (`on[Section]IconClick` props)
  - CSS variable detection (`--formkit-theme`)

- **`createIconHandler(iconLoader, iconLoaderUrl)`**: Factory for icon resolution. Priority: registry > stylesheet (`--fk-icon-*`) > custom loader > CDN fetch.

- **`iconRegistry`**: Global cache of loaded SVG icons.

### Internal

- **`FormKitIconLoader`**: `(iconName: string) => string | undefined | Promise<string | undefined>`
- **`FormKitIconLoaderUrl`**: `(iconName: string) => string | undefined`

### CSS Framework Plugins

All provide `formkit-*` variants for state-based styling:

| State | Data Attribute | Example |
|-------|---------------|---------|
| `disabled` | `data-disabled` | `formkit-disabled:opacity-50` |
| `invalid` | `data-invalid` | `formkit-invalid:border-red-500` |
| `errors` | `data-errors` | `formkit-errors:text-red-500` |
| `complete` | `data-complete` | `formkit-complete:bg-green-100` |
| `loading` | `data-loading` | `formkit-loading:animate-pulse` |
| `submitted` | `data-submitted` | `formkit-submitted:opacity-75` |
| `checked` | `data-checked` | `formkit-checked:bg-blue-500` |
| `multiple` | `data-multiple` | `formkit-multiple:h-auto` |
| `prefix-icon` | `data-prefix-icon` | `formkit-prefix-icon:pl-10` |
| `suffix-icon` | `data-suffix-icon` | `formkit-suffix-icon:pr-10` |

Tailwind supports group modifiers: `formkit-invalid/mygroup:border-red-500`

## Integration Points

- **Depends on**: `@formkit/core` (types: FormKitNode, FormKitClasses, FormKitEvent, FORMKIT_VERSION)
- **Depended on by**:
  - `@formkit/vue` (createThemePlugin, createIconHandler, icon types)
  - `@formkit/tailwindcss` (re-exports generateClasses)
- **Root CLAUDE.md section**: "Styling" - themes, tailwindcss

## Exports Map

```
@formkit/themes           -> src/index.ts (generateClasses, createThemePlugin, etc.)
@formkit/themes/genesis   -> dist/css/genesis/index.css
@formkit/themes/tailwindcss -> src/tailwindcss/index.ts (FormKitVariants plugin)
@formkit/themes/tailwindcss/genesis -> src/tailwindcss/genesis/index.ts (class config)
@formkit/themes/unocss    -> src/unocss/index.ts (FormKitVariants preset)
@formkit/themes/windicss  -> src/windicss/index.ts (deprecated)
```

## Modification Guide

### Adding CSS State Variants

1. Add attribute to `outerAttributes` array in:
   - `src/tailwindcss/index.ts`
   - `src/unocss/index.ts`
   - `src/windicss/index.ts`

2. Ensure FormKit core emits corresponding `data-*` attribute on outer element.

### Adding Genesis Theme Variables

1. Add CSS custom property to `src/css/genesis/variables.css`
2. Use variable in appropriate CSS file (structure, colors, typography)
3. Follow naming: `--fk-[category]-[element]-[modifier]`

### Adding Tailwind Genesis Classes

1. Edit `src/tailwindcss/genesis/index.ts`
2. Add to appropriate key: `global`, `family:*`, or specific input type
3. Use `$reset` prefix to clear inherited classes
4. Use `formkit-*` variants for state-dependent styles

### Adding New Theme

1. Create `src/css/[themename]/` directory
2. Add `index.ts` that imports main CSS
3. Create CSS following genesis structure
4. Add export to `package.json` exports map

### Adding Icon Defaults

1. Add base64-encoded SVG to `src/css/genesis/variables.css` as `--fk-icon-[name]`
2. Map to location with `--fk-icon-[sectionKey]: var(--fk-icon-[name])`

## CSS Variable Reference

Key variables in genesis theme:

| Category | Examples |
|----------|----------|
| Typography | `--fk-font-family`, `--fk-font-size-*`, `--fk-font-weight-*` |
| Colors | `--fk-color-primary`, `--fk-color-border`, `--fk-color-error` |
| Borders | `--fk-border`, `--fk-border-radius`, `--fk-border-width-*` |
| Spacing | `--fk-padding-input-*`, `--fk-margin-outer-*` |
| Icons | `--fk-icon-check`, `--fk-icon-down`, `--fk-icon-close` |

## Auto-Update Triggers

Update this CLAUDE.md when:
- New export added to package.json exports map
- New state variant added to any CSS framework plugin
- New CSS variable category added to genesis theme
- New public function exported from src/index.ts
- generateClasses signature or behavior changes
- Icon loading priority/strategy changes

## Deep Dive References

- Icon loading flow: `src/index.ts` lines 281-394 (createIconHandler, getIconFromStylesheet, getRemoteIcon)
- Class generation: `src/index.ts` lines 44-100 (generateClasses, addClassesBySection)
- Tailwind genesis config: `src/tailwindcss/genesis/index.ts` (complete class mappings for all inputs)
- CSS variable definitions: `src/css/genesis/variables.css` (all --fk-* properties)
