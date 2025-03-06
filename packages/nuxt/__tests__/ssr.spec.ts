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
    expect(html.match(/<fieldset.*<\/fieldset>/)?.[0]).toMatchFileSnapshot(
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

  it('renders form with disabled submit handler on ssr form can be submitted after hydration', async () => {
    // check ssr page has onsubmit
    const html = await $fetch('/')
    expect(html.match(/<form [a-z0-9=_\-/" ]*onsubmit="return false">/).length).toBeGreaterThan(0)
    
    const page = await createPage()
    await page.goto(url('/'))
    await page.getByLabel('I will test submitting').fill('hello')
    await page.getByRole('button', { name: 'Submit' }).click()
    expect(new URL(page.url()).search).toBe('?text_2=&text_3=This+is+hydrated&hydration_test=Testing+hydration&tailwind=lots&submitTest=hello')
    await page.close()
  })
})
