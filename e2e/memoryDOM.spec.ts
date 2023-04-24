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
test('FormKit form nodes get garbage collected', async ({ page }) => {
  await page.goto('http://localhost:8787/#/e2e/memory?type=form')
  await expect(async () => {
    const value = await page.getByTestId('collectionData').textContent()
    expect(value).toBe('1/1')
  }).toPass({ intervals: [100], timeout: 40000 })
})

test('clears memory footprint when unmounted in the DOM (control)', async ({
  page,
}) => {
  await page.goto('http://localhost:8787/#/e2e/memory-unmount/control')
  await page.getByRole('link', { name: 'Blank page' }).click()
  await new Promise((r) => setTimeout(r, 1000))
  const initialMemory = Number(
    await page.locator('#currentMemory').first().inputValue()
  )
  await page.getByRole('link', { name: 'Control page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Blank page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Control page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Blank page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Control page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Blank page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Control page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Blank page' }).click()
  await expect(async () => {
    // Should be within a couple megs of the initial of the initial memory
    expect(
      Number(await page.locator('#currentMemory').first().inputValue())
    ).toBeLessThan(initialMemory + 2)
  }).toPass({ intervals: [100], timeout: 20000 })
})

test('FormKit and FormKitSchema clear their memory footprint when unmounted in the DOM', async ({
  page,
}) => {
  await page.goto('http://localhost:8787/#/e2e/memory-unmount/blank')
  await new Promise((r) => setTimeout(r, 4000))
  const initialMemory = Number(
    await page.locator('#currentMemory').first().inputValue()
  )
  await page.getByRole('link', { name: 'Schema page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Blank page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Schema page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Blank page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Schema page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Blank page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Schema page' }).click()
  await new Promise((r) => setTimeout(r, 500))
  await page.getByRole('link', { name: 'Blank page' }).click()
  await new Promise((r) => setTimeout(r, 4000))

  await expect(async () => {
    const memoryAfter = Number(
      await page.locator('#currentMemory').first().inputValue()
    )
    // Should be within a couple megs of the initial of the initial memory
    expect(memoryAfter).toBeLessThan(initialMemory + 2)
  }).toPass({ intervals: [100], timeout: 25000 })
})
