import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { FormKit, defaultConfig } from '../../src'
import { renderWithFormKit } from '../helpers'

describe('hidden input (react)', () => {
  it('renders a hidden input without wrapper sections', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        name: 'bar',
        type: 'hidden',
        id: 'baz',
      }),
      defaultConfig()
    )

    const input = container.querySelector('input[type="hidden"]')
    expect(input).toBeTruthy()
    expect(input?.getAttribute('class')).toBe('formkit-input')
    expect(input?.getAttribute('name')).toBe('bar')
    expect(input?.getAttribute('id')).toBe('baz')
    expect(container.querySelector('[data-type]')).toBeNull()
  })
})
