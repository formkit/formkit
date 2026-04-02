import { createElement } from 'react'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { FormKit, FormKitProvider, defaultConfig } from '../../src'

describe('memory (react)', () => {
  beforeEach(() => {
    ;(globalThis as any).__FORMKIT_CONFIGS__ = undefined
  })

  afterEach(() => {
    ;(globalThis as any).__FORMKIT_CONFIGS__ = undefined
  })

  it('cleans up __FORMKIT_CONFIGS__ when FormKitProvider is unmounted', () => {
    expect(globalThis.__FORMKIT_CONFIGS__).toBeUndefined()

    const mounted = render(
      createElement(
        FormKitProvider,
        { config: defaultConfig() },
        createElement(FormKit as any, { type: 'text', name: 'foo' })
      )
    )

    expect(globalThis.__FORMKIT_CONFIGS__).toBeDefined()
    expect(globalThis.__FORMKIT_CONFIGS__?.length).toBe(1)

    mounted.unmount()

    expect(globalThis.__FORMKIT_CONFIGS__?.length).toBe(0)
  })

  it('does not accumulate configs when mounting/unmounting repeatedly', () => {
    expect(globalThis.__FORMKIT_CONFIGS__).toBeUndefined()

    for (let i = 0; i < 5; i++) {
      const mounted = render(
        createElement(
          FormKitProvider,
          { config: defaultConfig() },
          createElement(FormKit as any, { type: 'text', name: `foo-${i}` })
        )
      )

      expect(globalThis.__FORMKIT_CONFIGS__?.length).toBe(1)

      mounted.unmount()

      expect(globalThis.__FORMKIT_CONFIGS__?.length).toBe(0)
    }
  })
})
