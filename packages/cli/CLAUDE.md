# @formkit/cli

Command line tool for scaffolding FormKit projects, exporting inputs, and managing themes.

## Architecture

```
src/
  index.ts        - CLI entry point, command definitions, exports cli()
  createApp.ts    - Scaffolds Vite/Nuxt apps with FormKit + Tailwind
  createTheme.ts  - Scaffolds new themes from @formkit/theme-starter
  exportInput.ts  - Exports input definitions from @formkit/inputs
  theme.ts        - Generates/edits formkit.theme.ts files
  utils.ts        - File utilities (isDirEmpty, package.json helpers, git user)
bin/
  formkit.mjs     - Shebang entry, uses jiti to run dist/index.mjs
```

## Commands

| Command | Action | Key File |
|---------|--------|----------|
| `formkit export [input]` | Export input type to local file | `exportInput.ts` |
| `formkit create-app [name]` | Scaffold Vite/Nuxt app | `createApp.ts` |
| `formkit theme` | Generate/edit formkit.theme.ts | `theme.ts` |
| `formkit create-theme [name]` | Scaffold new theme package | `createTheme.ts` |

## Key Abstractions

### Public Exports
- `cli()` - Main entry, parses commands via Commander
- `buildTheme(options)` - Generate theme file programmatically
- `generate(theme, variables, isTS, semantic, themeName)` - Core theme generation
- `extractThemeData(code)` - Parse checksum/variables/theme from generated file

### Internal Functions
- `exportInput()` - Fetches input source from local dist or CDN, transforms imports
- `createApp()` - Prompts user, runs create-vite/nuxi, adds deps, writes configs
- `createTheme()` - Downloads theme-starter, customizes package.json/LICENSE/meta

### Logging Helpers
- `red()`, `green()`, `info()`, `warning()`, `error()` - Chalk-wrapped console output

## Integration Points

- **Depends on**: `@formkit/core` (version), `@formkit/inputs` (input list), `@formkit/utils` (slugify, token), `@formkit/theme-creator` (Theme types, stylesheetFromTailwind)
- **Depended on by**: `formkit` (wrapper package that re-exports CLI binary)
- **Root CLAUDE.md section**: "Dev/CLI" mentions this package

### External Services
- `themes.formkit.com/api` - Theme registry and generation API
- `pro.formkit.com` - Pro license authentication for create-app
- `cdn.jsdelivr.net` - Fallback for input exports when local unavailable

## Modification Guide

### Adding a New Command

1. Create handler in `src/newCommand.ts`
2. Import handler in `src/index.ts`
3. Add command definition:
```ts
program
  .command('new-command')
  .argument('[arg]', 'Description')
  .option('-o, --option <value>', 'Option description')
  .description('What this command does.')
  .action(newCommandHandler)
```
4. Export from `src/index.ts` if programmatic use needed

### Modifying Theme Generation

- Theme output format: `theme.ts` lines 327-392 (`generate()` function)
- API interaction: `theme.ts` `apiTheme()` function
- Edit mode (live sync): `theme.ts` `editMode()` uses local HTTP server on port 5480-5550

### Adding Features to create-app

- Framework templates: `createApp.ts` line 227 (Vite) and 276 (Nuxt)
- Dependencies added: `addDependency()` calls
- Config generation: `buildFormKitConfig()` and `buildMain()`

## Testing

```bash
# From monorepo root
pnpm test packages/cli

# Tests location
packages/cli/__tests__/cli.spec.ts
```

Tests cover:
- Local theme generation with variables
- Theme checksum extraction
- rootClasses output verification

Mock theme at `__tests__/mocks/localTheme.ts` uses `@formkit/theme-creator`.

## Breaking Changes

What constitutes a breaking change:
- Removing or renaming CLI commands
- Changing command option flags
- Altering generated file formats (formkit.theme.ts, formkit.config.ts)
- Changing required npm version (currently 7+)

## Auto-Update Triggers

Update this CLAUDE.md when:
- New command added to `program` in `src/index.ts`
- New export added to `src/index.ts`
- External API endpoints change (themes.formkit.com, pro.formkit.com)
- Generated file format changes in `theme.ts` or `createApp.ts`
- Dependencies on other @formkit packages change

## Deep Dive References

- **Theme file format**: `src/theme.ts` lines 327-392 (template literal)
- **FormKit Pro OAuth flow**: `src/createApp.ts` `login()` and `selectProProject()`
- **Input export transformation**: `src/exportInput.ts` `transformSource()`
- **Theme edit mode protocol**: `src/theme.ts` `editMode()` - uses nonce-based HTTP callback
