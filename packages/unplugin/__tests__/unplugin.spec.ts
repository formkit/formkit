import { describe, it, expect } from 'vitest'
import { getTransformedSource } from '../../../.tests/viteSpy'
import { resolvePathSync } from 'mlly'

describe('vite plugin transform', () => {
  it('has transformed the code', async () => {
    const path = resolvePathSync('./fixtures/SimpleRender.vue', {
      url: import.meta.url,
    })
    await import('./fixtures/SimpleRender.vue')
    expect(getTransformedSource(path)).toBe('foobar')
  })
})
