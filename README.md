<p align="center">
  <a href="https://www.formkit.com#gh-light-mode-only" target="_blank" rel="noopener noreferrer"><img width="200" src="https://cdn.formk.it/brand-assets/formkit-logo.png" alt="FormKit Logo"></a>
  <a href="https://www.formkit.com#gh-dark-mode-only" target="_blank" rel="noopener noreferrer"><img width="200" src="https://cdn.formk.it/brand-assets/formkit-logo-white.png" alt="FormKit Logo"></a>
</p>

<p align="center">
  <a href="https://github.com/formkit/formkit/actions"><img title="Build Badge" alt="GitHub Build Status" src="https://github.com/formkit/formkit/actions/workflows/tests.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@formkit/vue"><img alt="npm" src="https://img.shields.io/npm/v/@formkit/vue"></a>
  <a href="https://github.com/formkit/formkit"><img alt="GitHub" src="https://img.shields.io/github/license/formkit/formkit"></a>
</p>

<h1 align="center">The form framework for coding agents.</h1>

<p align="center">
Co-located validation, self-structuring data, composability, and a compact single-component API<br>that makes it easy for coding agents to reason about complex forms without boilerplate or guesswork.
</p>

<p align="center">
  <b>Vue</b> · <b>React</b> · <b>Nuxt</b>&nbsp;&nbsp;—&nbsp;&nbsp;Trusted by NBC, Nike, Bosch, Walmart, and thousands of teams that ship at scale.
</p>

<br>

<p align="center">
  <code>npx formkit skill</code>
</p>

<p align="center">
  Install the FormKit skill for your coding agent.<br>
  Supports <b>Claude Code</b>, <b>Codex</b>, <b>Cursor</b>, <b>Cline</b>, <b>Gemini</b>, <b>OpenCode</b>, <b>Amp</b>, and more.<br>
  Auto-detects your framework and configures your agent with FormKit docs and best practices.
</p>

<p align="center">
  <a href="https://formkit.com">Documentation</a> · <a href="https://formkit.com/getting-started/installation">Get Started</a> · <a href="https://discord.gg/Vhu97pAC76">Discord</a>
</p>

<br>
Every `<FormKit>` component owns a **node**. Nodes automatically structure data across components at any depth — no prop-drilling, event spaghetti, or ad-hoc state stores. The result is a compact representation of form state that agents and humans can both reason about.

```jsx
<FormKit type="form" onSubmit={handleSubmit}>
  <FormKit type="text" name="email" label="Email" validation="required|email" />
  <FormKit
    type="password"
    name="password"
    label="Password"
    validation="required|length:8"
  />
</FormKit>
```

That's a fully accessible form with labels, validation, error messages, loading state, and submit handling. All generated from one component.

## Predictable structure, increased efficacy.

FormKit automatically structures data across components — at any depth — providing your agent with a stable structure for composition without prop-drilling, event spaghetti, or ad-hoc state stores. Generated forms stay structured, editable, and consistent as your product evolves.

- **One component, every input** — `<FormKit type="text">`, `<FormKit type="select">`, `<FormKit type="checkbox">` — a consistent, predictable API across all inputs
- **Co-located validation** — 30+ built-in rules declared inline. No separate validation schemas, no event listeners, no glue code
- **Self-structuring data** — `type="group"` nests as objects, `type="list"` nests as arrays. Data shape mirrors component shape automatically
- **Schema** — generate entire forms from JSON. Conditional rendering, loops, expressions, dynamic data — all serializable
- **Theming** — first-class Tailwind CSS support with the Regenesis theme, or bring your own styles
- **i18n** — 30+ languages included, swap at runtime
- **Accessibility** — proper ARIA attributes, labels, and descriptions generated automatically
- **Plugins** — extend or override anything. Validation, i18n, and even input types are all plugins

## FormKit Pro

Premium inputs for complex interfaces — autocomplete, datepicker, repeater, color picker, drag-and-drop, mask, rating, slider, tag list, toggle, and more. Built on the same FormKit Node, same schema, same theming system. Get your project key at **[pro.formkit.com](https://pro.formkit.com)**.

## Get Started

Follow the installation guide for your framework:

- **[FormKit Installation Guide](https://formkit.com/getting-started/installation)**

## Architecture

FormKit cleanly separates its framework-agnostic core from framework bindings:

```
@formkit/core          →  Node tree, events, plugins, schema compiler
@formkit/validation    →  Validation engine
@formkit/rules         →  Built-in validation rules
@formkit/i18n          →  Internationalization
@formkit/inputs        →  Input type definitions
@formkit/themes        →  Theme utilities
─────────────────────────────────────────────
@formkit/vue           →  Vue 3 bindings
@formkit/react         →  React 18/19 bindings
```

## Sponsors

FormKit — which supports its whole feature set for _native HTML inputs_ (like `select`, `checkbox`, and `textarea`) — is and will always be an MIT-licensed
open source project. Please consider [sponsoring FormKit](https://github.com/sponsors/formkit) so we can sustainably
and continually improve it! There are a variety of sponsor tiers and benefits for each sponsor.

### 💎 Platinum sponsors

<p style="margin-bottom: 1em;">
  <a href="https://vueschool.io?friend=formkit">
    <img src="https://cdn.formk.it/web-assets/sponsors/vueschool.png" alt="Vue School logo" style="width: 25%;">
  </a>
</p>

### 🥇 Gold sponsors

<p style="margin-bottom: 1em;">
  <a href="https://fieldman.co?utm_source=formkit&utm_medium=web">
    <img src="https://cdn.formk.it/web-assets/sponsors/fieldman-logo.svg" alt="Fieldman logo" style="width: 22%;">
  </a>
</p>

### 🥈 Silver sponsors

<p><a href="https://github.com/sponsors/formkit"><img width="180" src="https://cdn.formk.it/web-assets/your-logo-here.svg" /></a></p>

### 🥉 Bronze sponsors

<p style="margin-bottom: 1em;">
  <a href="https://www.perbyte.com?utm_source=formkit&utm_medium=web">
    <img src="https://cdn.formk.it/web-assets/sponsors/bronze-sponsor_perbyte.png" alt="PerByte logo" style="width: 14%;">
  </a>
</p>

<p style="margin-bottom: 1em;">
  <a href="https://zammad.com?utm_source=formkit&utm_medium=web">
    <img src="https://cdn.formk.it/web-assets/sponsors/zammad_logo-transparent.png" alt="Zammad logo" style="width: 14%;">
  </a>
</p>

<p style="margin-bottom: 1em;">
  <a href="https://wedgworth.com?utm_source=formkit&utm_medium=web">
    <img src="https://cdn.formk.it/web-assets/sponsors/bronze-sponsor_wedgworth.png" alt="Wedgworth's Inc logo" style="width: 9%;">
  </a>
</p>

<p style="margin-bottom: 1em;">
  <a href="https://www.usemast.com/?utm_source=formkit&utm_medium=web">
    <img src="https://cdn.formk.it/web-assets/sponsors/bronze-sponsor_mast.png" alt="Mast's logo" style="width: 9%;">
  </a>
</p>

### Backers

[uscreen](https://uscreen.de), [gfenn08](https://github.com/gfenn08), [Ryan E](https://github.com/VikingDadMedic), [João Bondim](https://github.com/JesterIruka)

## Contributing

Thank you for your willingness to contribute to this free and open source project! When contributing, consider first discussing your desired change with the core team via [GitHub issues](https://github.com/formkit/formkit/issues), [Discord](https://discord.gg/Vhu97pAC76), or other method.

### Contributors

This project exists thanks to all the people who volunteer their time to contribute!

<a href="https://github.com/formkit/formkit/graphs/contributors"><img src="https://contributors-img.web.app/image?repo=formkit/formkit" /></a>

## License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2021-2026, [FormKit, Inc.](https://formkit.com)
