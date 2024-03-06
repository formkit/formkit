import { createResolver } from '@nuxt/kit'
import { describe, expect, it } from 'vitest'
import { $fetch, createPage, setup, url } from '@nuxt/test-utils/e2e'
import { resolvePackageJSON } from 'pkg-types'

await resolvePackageJSON('nuxt', { url: createResolver(import.meta.url).resolve('../playground') }).catch((e) => console.log({
  path: createResolver(import.meta.url).resolve('../playground') ,
  e
}))

await setup({
  rootDir: createResolver(import.meta.url).resolve('../playground'),
  browser: true,
  server: true,
})

describe('vite', async () => {
  it('builds and renders', async () => {
    const html = await $fetch('/')
    expect(html.match(/<fieldset.*<\/fieldset>/)?.[0]).toMatchFileSnapshot('./snapshots/index.html')
  })

  it('has no hydration errors', async () => {
    const page = await createPage()
    const logs: string[] = []
    page.on('console', (msg) => {
      logs.push(msg.text())
    })
    await page.goto(url('/'))
    // @ts-expect-error useNuxtApp is not typed - use https://github.com/nuxt/test-utils/pull/739
    await page.waitForFunction(() => window.useNuxtApp?.()._route.fullPath === '/')
    expect(logs).toEqual([])
    await page.close()
  })
})
