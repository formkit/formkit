<p align="center"><a href="https://www.formkit.com" target="_blank" rel="noopener noreferrer"><img width="200" src="https://cdn.formk.it/brand-assets/formkit-logo.png" alt="FormKit Logo"></a></p>

# @formkit/unplugin

This package contains the official unplugin for FormKit to allow automatic build optimizations for Vite, Nuxt, Rollup, Webpack, and other build tools.

> **Note:** This plugin is still still experimental and may change in the future.

## What is it?

This plugin eliminates the need to register the global formkit plugin. Instead, it will automatically inject FormKit into your Vue 3 application at the point of use.

By default it will attempt to load a `formkit.config.{ts,js,mjs}` file in the root of your project.

```vue
<script setup>
import { FormKit } from '@formkit/vue'
</script>

<template>
  <FormKit type="form">
    <ForKit type="text" name="username" />
    <ForKit type="password" name="password" />
  </FormKit>
</template>
```

Into the (conceptually) following:

```vue
<script setup>
import { FormKit, FormKitConfigProvider } from '@formkit/vue'
</script>

<template>
  <Suspense>
    <FormKitConfigProvider :config="./formkit.config.ts">
      <FormKit type="form">
        <ForKit
          type="text"
          name="username"
        />
        <ForKit
          type="password"
          name="password"
        />
      </FormKit>
    </FormKit>
  </Suspense>
</template>
```

> [!NOTE]
> The `<Suspense>` boundary and configuration loader is only injected if not already in the component tree. These runtime determinations are part of the `<FormKitLazyProvider>` component, not this plugin.

## Installation

```bash
npm install @formkit/unplugin --save-dev
```

Then add it to your `vite.config.ts` (or `rollup.config.ts` or webpack config etc).

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { formkit } from '@formkit/unplugin'

export default defineConfig({
  plugins: [formkit(), vue()],
})
```

> **Important:** Order matters — this plugin should always be placed _before_ the Vue plugin.

## Usage

Once installed, you can use FormKit in your Vue components without any further configuration — FormKit’s configuration will automatically be injected into your application at the point of use.

> [!WARNING]  
> Because a global plugin is not installed, you will not be able to use the `this.$formkit` API when using options API components.

To add some FormKit configuration to your project, simply create a `formkit.config.ts` (or `.js` or `.mjs`) file in the root of your project (adjacent to your `vite.config.ts` file) and export a configuration object:

```ts
import { DefaultConfigOptions, createInput } from '@formkit/vue'

export default {
  inputs: {
    custom: createInput([
      {
        $el: 'h1',
        children: 'Super Custom Input!',
      },
    ]),
  },
} satisfies DefaultConfigOptions
```
