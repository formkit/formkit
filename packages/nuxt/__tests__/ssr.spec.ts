/** @vitest-environment node */
import { fileURLToPath } from 'node:url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { $fetch, createPage, createTest, url } from '@nuxt/test-utils/e2e'

const rootDir = fileURLToPath(new URL('../playground', import.meta.url))

// Register the e2e hooks synchronously. `setup()` awaits a dynamic
// import before registering them, which Vitest 4 can't attribute to a suite.
const hooks = createTest({ rootDir, browser: true, server: true })
beforeAll(hooks.beforeAll, hooks.ctx.options.setupTimeout)
beforeEach(hooks.beforeEach)
afterEach(hooks.afterEach)
afterAll(hooks.afterAll, hooks.ctx.options.teardownTimeout)

describe('vite', () => {
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
