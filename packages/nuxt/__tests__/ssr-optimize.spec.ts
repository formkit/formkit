/** @vitest-environment node */
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, createPage, setup, url } from '@nuxt/test-utils/e2e'
import { resolve } from 'pathe'

const rootDir = fileURLToPath(new URL('../playground', import.meta.url))

await setup({
  rootDir,
  configFile: resolve(rootDir, 'nuxt-optimize.config.ts'),
  browser: true,
  server: true,
})

describe('vite with optimizer enabled', async () => {
  it('builds and renders', async ({ expect }) => {
    const html = await $fetch('/')
    expect(html.match(/<fieldset.*<\/fieldset>/)?.[0]).toMatchFileSnapshot(
      './snapshots/index.html'
    )
  })
})
