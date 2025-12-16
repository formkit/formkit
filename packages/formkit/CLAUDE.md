# formkit

Wrapper package that provides the `formkit` CLI binary by re-exporting `@formkit/cli`.

## Architecture

```
formkit/
├── bin/formkit.mjs    # CLI entry point, imports and runs @formkit/cli
├── src/index.ts       # Warns users to use @formkit/vue for library usage
└── package.json       # Declares bin, depends solely on @formkit/cli
```

**Purpose**: This package exists to claim the `formkit` npm package name and provide a convenient `npx formkit` command. It is NOT the main FormKit library.

## Key Abstractions

- **bin/formkit.mjs**: Shebang script that dynamically imports `@formkit/cli` and calls `cli()`
- **src/index.ts**: Empty export with console warning redirecting users to `@formkit/vue`

## Integration Points

- **Depends on**: `@formkit/cli` (sole dependency)
- **Depended on by**: None (end-user package)
- **Root CLAUDE.md section**: "Dev/CLI" - listed as "Wrapper that exports CLI binary"

## Modification Guide

### Adding Features
Do NOT add features here. All CLI functionality belongs in `@formkit/cli`. This package is intentionally minimal.

### When to Modify This Package
- Updating the warning message in `src/index.ts`
- Changing the CLI entry point behavior (rare)
- Version bumps (automated)

### Adding Tests
No tests exist in this package. CLI tests are in `@formkit/cli/__tests__/`.

### Breaking Changes
- Removing or renaming the `formkit` binary
- Changing the dynamic import target from `@formkit/cli`

## Auto-Update Triggers

Update this CLAUDE.md when:
- The CLI binary name changes
- Dependencies beyond `@formkit/cli` are added
- The warning message purpose changes

## Deep Dive References

- CLI implementation: `/packages/cli/src/index.ts`
- Available commands: `export`, `create-app`, `theme`, `create-theme`
- CLI tests: `/packages/cli/__tests__/cli.spec.ts`
