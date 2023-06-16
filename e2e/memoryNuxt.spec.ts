import { test, expect, Page } from '@playwright/test'

async function cycle(
  page: Page,
  total = 50,
  cycleCount = 0,
  callback?: (page: Page) => void
) {
  return new Promise<void>(async (resolve) => {
    try {
      await page.reload()
    } catch {
      resolve()
    }
    if (callback) await callback(page)
    setTimeout(async () => {
      if (cycleCount < total) await cycle(page, total, cycleCount + 1)
      resolve()
    }, 500)
  })
}

async function getMemory(page: Page) {
  // Allow some further GC:
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await page.reload()
  return Number(await page.locator('input').first().inputValue())
}

test('formkit app gets garbage collected in nuxt', async ({ page }) => {
  test.setTimeout(60000)
  await page.goto('http://localhost:8484/')
  await cycle(page, 2) // Warm up
  const initialMemory = await getMemory(page)
  await cycle(page, 20)
  const finalMemory = await getMemory(page)
  expect((finalMemory - initialMemory) / 20).toBeLessThan(0.1)
  expect(finalMemory).toBeLessThan(initialMemory + 5)
})
