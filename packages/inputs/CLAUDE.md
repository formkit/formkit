# @formkit/inputs

Input type definitions and schema composition utilities for FormKit. Provides all native HTML input types as `FormKitTypeDefinition` objects.

## Architecture

```
src/
  index.ts          # Public API, exports all inputs and utilities
  plugin.ts         # createLibraryPlugin() - converts definitions to plugin
  compose.ts        # Schema composition helpers ($attrs, $if, $for, $extend, useSchema)
  createSection.ts  # createSection() factory for schema sections
  props.ts          # TypeScript types for all input props, options, slots, events
  inputs/           # Input type definitions (FormKitTypeDefinition objects)
  features/         # Node behavior plugins (options, forms, files, etc.)
  sections/         # Schema section factories (outer, inner, label, etc.)
```

## Key Abstractions

### FormKitTypeDefinition (Public API)
Each input is defined with:
- `schema`: Composed schema sections (or function returning schema)
- `type`: Node type (`'input'` | `'group'` | `'list'`)
- `family`: Styling group (`'text'` | `'box'` | `'button'`)
- `props`: Additional props the input accepts
- `features`: Array of node plugins to apply
- `schemaMemoKey`: Cache key for schema compilation

### Input Types
| Input | Node Type | Family | Features |
|-------|-----------|--------|----------|
| text, email, password, url, tel, search, date, time, month, week, color, range, number | input | text | casts |
| textarea | input | - | initialValue |
| checkbox | input | box | options, checkboxes, defaultIcon |
| radio | input | box | options, radios, defaultIcon |
| select | input | - | options, selects, defaultIcon |
| file | input | text | files, defaultIcon |
| button, submit | input | button | localize, ignores |
| hidden | input | - | casts |
| form | group | - | forms, disablesChildren |
| group | group | - | disablesChildren, renamesRadios |
| list | list | - | disablesChildren, renamesRadios |
| meta | input | - | (none) |

### Features (Internal)
Plugins that add behavior to nodes:
- `options`: Normalizes options prop to `{label, value}[]` format
- `forms`: Submit handling, validation waiting, loading state
- `files`: File input handlers, drag-drop, reset
- `selects`: Selection state, placeholder, multi-select
- `checkboxes`/`radios`: Toggle handlers, checked state
- `casts`: Number casting from `number` prop
- `disablesChildren`: Propagates disabled to children
- `defaultIcon`: Sets default icons for sections
- `localize`: Creates UI messages for i18n

### Sections (Internal)
Schema factories using `createSection()`:
- **Structural**: `outer`, `wrapper`, `inner`, `fragment`, `fieldset`
- **Labels**: `label`, `legend`, `buttonLabel`, `boxLabel`
- **Inputs**: `textInput`, `textareaInput`, `selectInput`, `fileInput`, `buttonInput`, `submitInput`, `box`
- **Options**: `option`, `optGroup`, `optionSlot`, `boxOption`, `boxOptions`, `boxWrapper`
- **Messaging**: `messages`, `message`, `help`, `boxHelp`
- **Decorative**: `prefix`, `suffix`, `icon`, `decorator`
- **File-specific**: `fileList`, `fileItem`, `fileName`, `fileRemove`, `noFiles`
- **Form-specific**: `actions`, `formInput`

### Composition Utilities (Public API)
- `createSection(name, element)`: Creates overridable schema section
- `$attrs(attrs, section)`: Adds attributes to section
- `$if(condition, then, else)`: Conditional schema
- `$for(var, in, section)`: Looped schema
- `$extend(section, extension)`: Extends section with partial schema
- `useSchema(inputSection)`: Wraps input in standard outer/wrapper/inner structure

## Integration Points

- **Depends on**: `@formkit/core` (node, schema types), `@formkit/utils` (helpers)
- **Depended on by**: `@formkit/vue`, `@formkit/nuxt`, custom input libraries
- **Root CLAUDE.md section**: "Composables" and "Packages > inputs"

## Modification Guide

### Adding a New Input Type

1. Create definition in `src/inputs/[name].ts`:
```typescript
import { FormKitTypeDefinition } from '@formkit/core'
import { outer, wrapper, label, inner, /* sections */ } from '../compose'

export const myInput: FormKitTypeDefinition = {
  schema: outer(wrapper(label('$label'), inner(/* your input section */))),
  type: 'input',  // or 'group' or 'list'
  family: 'text', // for styling
  props: ['customProp'],
  features: [/* features */],
  schemaMemoKey: 'unique-key',
}
```

2. Export from `src/index.ts`:
```typescript
import { myInput } from './inputs/myInput'
export { myInput }
// Add to `inputs` object
```

3. Add TypeScript types in `src/props.ts`:
   - Add to `FormKitInputProps` interface
   - Add to `FormKitInputSlots` interface
   - Add any custom events to `FormKitInputEvents`

### Adding a New Feature

1. Create in `src/features/[name].ts`:
```typescript
import { FormKitNode } from '@formkit/core'

export default function myFeature(node: FormKitNode): void {
  node.on('created', () => {
    // Setup handlers, context functions
  })
  node.hook.input((value, next) => next(/* transform */))
}
```

2. Export from `src/features/index.ts`
3. Export from `src/compose.ts` (re-exports features)

### Adding a New Section

1. Create in `src/sections/[name].ts`:
```typescript
import { createSection } from '../createSection'

export const mySection = createSection('mySection', 'div')
// Or with custom schema:
export const mySection = createSection('mySection', () => ({
  $el: 'div',
  attrs: { /* ... */ },
}))
```

2. Export from `src/sections/index.ts`
3. Export from `src/compose.ts` (re-exports sections)

### Adding Tests

- Test file: `__tests__/features.spec.ts`
- Uses vitest: `pnpm test` from repo root
- Pattern: Create node with `createLibraryPlugin()`, test props/behavior

### Breaking Changes

Breaking changes occur when:
- Public export signature changes
- `FormKitTypeDefinition` structure changes
- Props interface changes (affects Vue component types)
- Section names change (affects `sectionsSchema` overrides)
- Feature behavior changes (affects form submission, validation)

## Auto-Update Triggers

Update this CLAUDE.md when:
- New input type added to `src/inputs/`
- New feature added to `src/features/`
- New section added to `src/sections/`
- Public API exported from `src/index.ts` changes
- `FormKitInputProps` or `FormKitInputSlots` in `props.ts` changes
- Dependencies in `package.json` change

## Deep Dive References

- **Input definition pattern**: `src/inputs/text.ts` (simplest), `src/inputs/checkbox.ts` (complex)
- **Form submission flow**: `src/features/forms.ts`
- **Options normalization**: `src/features/options.ts` - `normalizeOptions()`
- **Section creation**: `src/createSection.ts` - slot conditional pattern
- **Schema composition**: `src/compose.ts` - `$if`, `$attrs`, `$extend`
- **Full TypeScript types**: `src/props.ts` - all input props, events, slots
