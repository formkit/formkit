<p align="center"><a href="https://www.formkit.com" target="_blank" rel="noopener noreferrer"><img width="200" src="https://cdn.formk.it/brand-assets/formkit-logo.png" alt="FormKit Logo"></a></p>

# @formkit/tailwindcss

This package contains tooling to assist with building a comprehensive Tailwind theme for FormKit.

## Installation

```bash
npm install @formkit/tailwindcss
```

```js
// tailwind.config.js
module.exports {
  ...
  plugins: [
    require('@formkit/tailwindcss')
  ]
  ...
}
```

```js
// app.js (or your main entry file)
import { createApp } from 'vue'
import App from './App.vue'
import { plugin, defaultConfig } from '@formkit/vue'
import { generateClasses } from '@formkit/tailwindcss'
import './index.css' // wherever your Tailwind styles exist

createApp(App)
  .use(
    plugin,
    defaultConfig({
      config: {
        classes: generateClasses({
          // Your theme will go here.
          // ...
          // text: {
          //   label: 'font-bold text-gray-300 formkit-invalid:text-red-500',
          //   ...
          // }
          // ...
        }),
      },
    })
  )
  .mount('#app')
```

## Variants

The `@formkit/tailwindcss` package provides a number of variants you can use in your class lists to dynamically respond to input and form state.

The currently provided variants are:

- `formkit-disabled:`
- `formkit-invalid:`
- `formkit-errors:`
- `formkit-complete:`
- `formkit-loading:`
- `formkit-submitted:`
- `formkit-multiple:`
- `formkit-action:`
- `formkit-message-validation:`
- `formkit-message-error:`

## Guide

For a walkthrough on creating a full Tailwind theme for FormKit [read the guide](https://formkit.com/guides/create-a-tailwind-theme) on the official FormKit.com docs.
