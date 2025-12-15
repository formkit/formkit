/** @vitest-environment node */
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, createPage, setup, url } from '@nuxt/test-utils/e2e'

const rootDir = fileURLToPath(new URL('../playground', import.meta.url))

await setup({
  rootDir,
  browser: true,
  server: true,
})

describe('vite', async () => {
  it('builds and renders', async () => {
    const html = await $fetch('/')
    await expect(html.match(/<fieldset.*<\/fieldset>/)?.[0]).toMatchFileSnapshot(
      './snapshots/index.html'
    )
  })

  it('has no hydration errors', async () => {
    const page = await createPage()
    const logs: string[] = []
    page.on('console', (msg) => {
      logs.push(msg.text())
    })
    await page.goto(url('/'))
    await page.waitForFunction(
      // @ts-expect-error useNuxtApp is not typed - use https://github.com/nuxt/test-utils/pull/739
      () => window.useNuxtApp?.()._route.fullPath === '/'
    )
    expect(
      logs.filter(
        (log) =>
          log !==
          '<Suspense> is an experimental feature and its API will likely change.'
      )
    ).toEqual([])
    await page.close()
  })
})
