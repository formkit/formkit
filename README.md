<div align="center">

<a href="https://www.formkit.com#gh-light-mode-only" target="_blank" rel="noopener noreferrer"><img width="200" src="https://cdn.formk.it/brand-assets/formkit-logo.png" alt="FormKit Logo"></a>
<a href="https://www.formkit.com#gh-dark-mode-only" target="_blank" rel="noopener noreferrer"><img width="200" src="https://cdn.formk.it/brand-assets/formkit-logo-white.png" alt="FormKit Logo"></a>

<br>

<a href="https://github.com/formkit/formkit/actions"><img alt="GitHub Build Status" src="https://github.com/formkit/formkit/actions/workflows/tests.yml/badge.svg"></a>&nbsp;
<a href="https://www.npmjs.com/package/@formkit/vue"><img alt="npm" src="https://img.shields.io/npm/v/@formkit/vue"></a>&nbsp;
<a href="https://github.com/formkit/formkit"><img alt="GitHub" src="https://img.shields.io/github/license/formkit/formkit"></a>

**The form framework for coding agents.**

Co-located validation, self-structuring data, composability, and a compact single-component API<br>that makes it easy for coding agents to reason about complex forms without boilerplate or guesswork.

**React** · **Vue** &nbsp;—&nbsp; Trusted by NBC, Nike, Bosch, Walmart, and thousands of teams that ship at scale.

[Documentation](https://formkit.com) &nbsp;&middot;&nbsp; [Get Started](https://formkit.com/getting-started/installation) &nbsp;&middot;&nbsp; [Discord](https://discord.gg/Vhu97pAC76)

</div>

> [!TIP]
> **Set up your coding agent for FormKit**
> ```
> npx formkit skill
> ```
> Supports **Claude Code**, **Codex**, **Cursor**, **Cline**, **Gemini**, **OpenCode**, **Amp**, and more.
> Auto-detects your framework and configures your agent with the right docs and best practices.

<br>

## One primitive. Infinite flexibility.

> *"Forms today remain fundamentally unsolved. We need a new low-level primitive to power the next generation of web applications written with AI. The FormKit Node is that primitive."*
>
> — Justin Schroeder, Creator of FormKit

Every `<FormKit>` component owns a **node**. Nodes automatically structure data across components at any depth — no prop-drilling, event spaghetti, or ad-hoc state stores. The result is a compact representation of form state that agents and humans can both reason about. Generated forms stay structured, editable, and consistent as your product evolves.

```jsx
<FormKit type="form" onSubmit={handleSubmit}>
  <FormKit type="text" name="email" label="Email" validation="required|email" />
  <FormKit type="password" name="password" label="Password" validation="required|length:8" />
</FormKit>
```

That's a fully accessible form with labels, validation, error messages, loading state, and submit handling — all from one component.

<br>

## What you get

| Feature | |
|---|---|
| **One component, every input** | `<FormKit type="text">`, `<FormKit type="select">`, `<FormKit type="checkbox">` — consistent, predictable API across all inputs |
| **Co-located validation** | 30+ built-in rules declared inline. No separate validation schemas, no event listeners, no glue code |
| **Self-structuring data** | `type="group"` nests as objects, `type="list"` nests as arrays. Data shape mirrors component shape automatically |
| **Schema** | Generate entire forms from JSON. Conditional rendering, loops, expressions, dynamic data — all serializable |
| **Theming** | First-class Tailwind CSS support with the Regenesis theme, or bring your own styles |
| **i18n** | 30+ languages included, swap at runtime |
| **Accessibility** | ARIA attributes, labels, and descriptions generated automatically |
| **Plugins** | Extend or override anything — validation, i18n, and even input types are all plugins |

<br>

## FormKit Pro

Premium inputs for complex interfaces — autocomplete, datepicker, repeater, color picker, drag-and-drop, mask, rating, slider, tag list, toggle, and more. Built on the same FormKit Node, same schema, same theming system.

**[Explore Pro inputs &rarr;](https://formkit.com/pro)**

<br>

## Architecture

FormKit cleanly separates its framework-agnostic core from framework bindings. The same core powers every framework — same validation rules, same schemas, same plugins.

```
@formkit/core          →  Node tree, events, plugins, schema compiler
@formkit/validation    →  Validation engine
@formkit/rules         →  Built-in validation rules
@formkit/i18n          →  Internationalization
@formkit/inputs        →  Input type definitions
@formkit/themes        →  Theme utilities
─────────────────────────────────────────────
@formkit/react         →  React 18/19 bindings
@formkit/vue           →  Vue 3 bindings
```

<br>

## Sponsors

FormKit — which supports its whole feature set for _native HTML inputs_ (like `select`, `checkbox`, and `textarea`) — is and will always be an MIT-licensed open source project. Please consider [sponsoring FormKit](https://github.com/sponsors/formkit) so we can sustainably and continually improve it!

#### 💎 Platinum

<a href="https://vueschool.io?friend=formkit"><img src="https://cdn.formk.it/web-assets/sponsors/vueschool.png" alt="Vue School" width="200"></a>

#### 🥇 Gold

<a href="https://fieldman.co?utm_source=formkit&utm_medium=web"><img src="https://cdn.formk.it/web-assets/sponsors/fieldman-logo.svg" alt="Fieldman" width="175"></a>

#### 🥈 Silver

[Become a silver sponsor &rarr;](https://github.com/sponsors/formkit)

#### 🥉 Bronze

<a href="https://www.perbyte.com?utm_source=formkit&utm_medium=web"><img src="https://cdn.formk.it/web-assets/sponsors/bronze-sponsor_perbyte.png" alt="PerByte" width="110"></a>&nbsp;&nbsp;
<a href="https://zammad.com?utm_source=formkit&utm_medium=web"><img src="https://cdn.formk.it/web-assets/sponsors/zammad_logo-transparent.png" alt="Zammad" width="110"></a>&nbsp;&nbsp;
<a href="https://wedgworth.com?utm_source=formkit&utm_medium=web"><img src="https://cdn.formk.it/web-assets/sponsors/bronze-sponsor_wedgworth.png" alt="Wedgworth's Inc" width="70"></a>&nbsp;&nbsp;
<a href="https://www.usemast.com/?utm_source=formkit&utm_medium=web"><img src="https://cdn.formk.it/web-assets/sponsors/bronze-sponsor_mast.png" alt="Mast" width="70"></a>

#### Backers

[uscreen](https://uscreen.de) · [gfenn08](https://github.com/gfenn08) · [Ryan E](https://github.com/VikingDadMedic) · [João Bondim](https://github.com/JesterIruka)

<br>

## Contributing

Thank you for your willingness to contribute to this free and open source project! When contributing, consider first discussing your desired change with the core team via [GitHub issues](https://github.com/formkit/formkit/issues), [Discord](https://discord.gg/Vhu97pAC76), or other method.

<a href="https://github.com/formkit/formkit/graphs/contributors"><img src="https://contributors-img.web.app/image?repo=formkit/formkit" /></a>

## License

[MIT](https://opensource.org/licenses/MIT) · Copyright (c) 2021-2026, [FormKit, Inc.](https://formkit.com)
