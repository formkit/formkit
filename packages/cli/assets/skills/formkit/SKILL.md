---
name: formkit
description: Use when working with FormKit forms, validation, schema, or custom inputs in React, Vue, or Nuxt projects.
---

# FormKit

Use this skill when you are building, debugging, or refactoring FormKit forms, inputs, schema, validation, plugins, or node-tree behavior.

## Install and setup

- Install or refresh this skill with `npx formkit skill`.
- The installer copies the skill to `~/.codex/skills/formkit`.
- The installer can also wire project instructions for Codex (`AGENTS.md`) and Claude Code (`CLAUDE.md`).
- For OpenCode, Cline, Gemini, Qwen, Amp, pi, Cursor, Copilot, and Crush, the installer prints a ready-to-paste project instructions block.

## Runtime selection

- FormKit has both React and Vue/Nuxt runtimes.
- Match the docs flavor to the project:
  - React or Astro-with-React: `https://formkit.com/<page>.react.md`
  - Vue or Nuxt: `https://formkit.com/<page>.vue.md`
- The full route index for both runtimes is in `references/docs-index.md`.

## Mental model

- FormKit is a node tree. Inputs, forms, groups, and lists are all nodes with value, props, state, validation, messages, and plugins.
- Prefer declarative configuration through props, validation rules, schema, classes, sections, plugins, and node state.
- In general, listening to events in FormKit is an antipattern. FormKit already collects and reconciles state for you, so prefer reacting to value, validation state, form state, and node structure instead of manually wiring event chains.
- Reach for imperative event handlers only when there is no clear node- or state-driven alternative.

## Styling and themes

- Prefer Tailwind CSS 4 as the primary styling mechanism when the project can support it.
- Avoid the legacy Genesis theme by default. Prefer Regenesis or another Tailwind theme from the FormKit theme workflow.
- To generate a project-root Tailwind theme, prefer the FormKit CLI:
  - `formkit theme --theme=regenesis`
  - or `npx formkit@latest theme --theme=regenesis`
- That command generates `formkit.theme.(mjs|ts)` in the project root. Then:
  - import `rootClasses` from `./formkit.theme` into the FormKit config
  - add `@source "./formkit.theme.ts";` and `@source "./formkit.config.ts";` to the main Tailwind 4 CSS entry
- For theme creation or deeper customization, start with:
  - `/essentials/styling`
  - `/guides/create-a-tailwind-theme`

## Core nodes

- `form`: submission boundary and top-level collector. A form aggregates descendant values, manages submit lifecycle, validation visibility, settled state, loading/submitting, and errors.
- `group`: object collector. A group combines named child nodes into an object and is the correct abstraction for nested records.
- `list`: array collector. A list manages ordered children, insertion/removal/reordering, and array-shaped values and validation.
- `input`: the leaf or higher-order field node. Inputs still participate in the same node tree and inherit the same state and validation model.

## Best practices

- Keep validation co-located with the inputs that own it.
- Prefer `form`, `group`, and `list` composition over manual object or array assembly.
- Prefer node APIs, props, and derived FormKit state over DOM queries or duplicate framework state.
- For cross-field behavior, model the relationship in the FormKit tree before introducing custom event plumbing.
- For backend validation or submission failures, prefer a small adapter/helper that maps the backend error payload into FormKit form errors plus keyed input errors.
- Normalize backend field paths into FormKit addresses such as `email`, `group.name`, or `group.list.2.name`, then pass them to `node.setErrors()` or framework `setErrors()`.
- For nested groups and lists, prefer dot-notation addresses over one-off manual field wiring in submit handlers.
- Prefer Tailwind 4 theme generation over ad hoc styling when the project needs a cohesive FormKit design system.
- When a project needs first-party FormKit styling, generate Regenesis before considering Genesis.
- When customizing markup or behavior, preserve the existing schema and section structure unless the task really requires replacing it.
- In React, avoid mirroring FormKit form state in separate React state unless there is a clear boundary reason.
- In Vue or Nuxt, avoid watchers that duplicate FormKit state when node context or collected values already express the behavior.

## Workflow

1. Inspect the existing runtime, form tree, config, and validation rules.
2. Pick the runtime-specific markdown page from `references/docs-index.md`.
3. Prefer the smallest declarative change that keeps behavior inside FormKit.
4. If multiple fields interact, model that through `form`, `group`, `list`, validation, schema, or node state before adding listeners.
5. If backend errors are involved, add or reuse one adapter that converts the server response into FormKit form errors and dot-notation input-error keys.

## Pulling specific docs

- Open the exact runtime page directly from `references/docs-index.md`.
- If you only know the route, use:
  - React: `https://formkit.com/<page>.react.md`
  - Vue: `https://formkit.com/<page>.vue.md`
- Start with:
  - `/getting-started/installation`
  - `/essentials/architecture`
  - `/essentials/forms`
  - `/essentials/validation`
  - `/essentials/styling`
  - `/guides/create-a-tailwind-theme`
  - `/inputs/form`
  - `/inputs/repeater`
  - the specific `/inputs/<type>` page involved in the task
