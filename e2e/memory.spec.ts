import { test, expect } from '@playwright/test'

test('vue component dom nodes get garbage collected (control)', async ({
  page,
}) => {
  await page.goto('http://localhost:8787/#/e2e/memory-control')
  await expect(async () => {
    const value = await page.getByTestId('collectionData').textContent()
    expect(value).toBe('1/1')
  }).toPass({ intervals: [100], timeout: 20000 })
})

test('FormKit dom nodes get garbage collected', async ({ page }) => {
  await page.goto('http://localhost:8787/#/e2e/memory')
  await expect(async () => {
    const value = await page.getByTestId('collectionData').textContent()
    console.log(value)
    expect(value).toBe('1/1')
  }).toPass({ intervals: [100], timeout: 20000 })
})
