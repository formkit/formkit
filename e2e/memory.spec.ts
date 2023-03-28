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

test('FormKit text nodes get garbage collected', async ({ page }) => {
  await page.goto('http://localhost:8787/#/e2e/memory?type=text')
  await expect(async () => {
    const value = await page.getByTestId('collectionData').textContent()
    expect(value).toBe('1/1')
  }).toPass({ intervals: [100], timeout: 20000 })
})

test('FormKit checkbox nodes get garbage collected', async ({ page }) => {
  await page.goto(
    'http://localhost:8787/#/e2e/memory?type=checkbox&options=["abc","def"]'
  )
  await expect(async () => {
    const value = await page.getByTestId('collectionData').textContent()
    expect(value).toBe('1/1')
  }).toPass({ intervals: [100], timeout: 20000 })
})

test('FormKit radio nodes get garbage collected', async ({ page }) => {
  await page.goto(
    'http://localhost:8787/#/e2e/memory?type=radio&options=["abc","def"]'
  )
  await expect(async () => {
    const value = await page.getByTestId('collectionData').textContent()
    expect(value).toBe('1/1')
  }).toPass({ intervals: [100], timeout: 20000 })
})

test('FormKit select nodes get garbage collected', async ({ page }) => {
  await page.goto(
    'http://localhost:8787/#/e2e/memory?type=select&options=["abc","def"]'
  )
  await expect(async () => {
    const value = await page.getByTestId('collectionData').textContent()
    expect(value).toBe('1/1')
  }).toPass({ intervals: [100], timeout: 40000 })
})
