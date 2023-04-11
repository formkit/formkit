import { test, expect, Page } from '@playwright/test'

async function cycle(page: Page, total = 50, cycleCount = 0) {
  return new Promise<void>(async (resolve) => {
    await page.reload()
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

test('standard vue source app gets garbage collected (control)', async ({
  page,
}) => {
  await page.goto('http://localhost:8585/')
  await cycle(page, 2) // Warm up
  const initialMemory = await getMemory(page)
  await cycle(page, 10)
  const finalMemory = await getMemory(page)
  expect(finalMemory).toBeLessThan(initialMemory + 5)
})

test('formkit app gets garbage collected', async ({ page }) => {
  await page.goto('http://localhost:8686/')
  await cycle(page, 2) // Warm up
  const initialMemory = await getMemory(page)
  await cycle(page, 10)
  const finalMemory = await getMemory(page)
  expect(finalMemory).toBeLessThan(initialMemory + 5)
})
