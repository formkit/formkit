import { describe, expect, it } from 'vitest'
import { formKitAutoImportPlugin } from '../src/autoImport'

describe('auto-import transform', () => {
  it('wraps root components instead of their named slots (#1300)', async () => {
    const plugin = formKitAutoImportPlugin({
      defaultConfig: true,
      configFile: '/missing/formkit.config',
    })
    const result = await plugin.transform(
      `<template>
  <Dialog>
    <template #header>
      <h1>Create event</h1>
    </template>
    <template #default>
      <FormKit type="text" />
    </template>
    <template #footer>
      <button>Create</button>
    </template>
  </Dialog>
</template>`,
      '/components/MyWrapperComponent.vue'
    )

    expect(result?.code).toMatch(
      /<template>\s*<FormKitLazyProvider[^>]*>\s*<Dialog>/
    )
    expect(result?.code).toMatch(
      /<\/Dialog>\s*<\/FormKitLazyProvider>\s*<\/template>/
    )
    expect(result?.code).not.toMatch(
      /<Dialog>\s*<FormKitLazyProvider[^>]*>\s*<template #header>/
    )
  })
})
