# @formkit/react

FormKit integration for React.

## Install

```bash
pnpm add @formkit/react @formkit/core @formkit/inputs
```

## Basic usage

```tsx
import { FormKit, FormKitProvider, defaultConfig } from '@formkit/react'

export function App() {
  return (
    <FormKitProvider config={defaultConfig()}>
      <FormKit type="text" name="email" label="Email" />
    </FormKitProvider>
  )
}
```

## Local playground

```bash
pnpm -C packages/react dev
```

Runs the package-local React playground from source (`packages/react/src`).
