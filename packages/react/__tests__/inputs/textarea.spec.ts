import { createElement, useState } from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormKit, defaultConfig } from '../../src'
import { renderWithFormKit } from '../helpers'

describe('textarea input (react)', () => {
  it('can render a textarea input', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'textarea',
      }),
      defaultConfig()
    )

    expect(container.innerHTML).toContain('<textarea')
  })

  it('renders arbitrary attributes on the textarea element', () => {
    const props: Record<string, unknown> = {
      type: 'textarea',
      name: 'textarea',
      id: 'foobar',
      'data-foo': 'bar',
    }

    const { container } = renderWithFormKit(
      createElement(FormKit as any, props),
      defaultConfig()
    )

    const textarea = container.querySelector('textarea')
    expect(textarea).toBeTruthy()
    expect(textarea?.getAttribute('data-foo')).toBe('bar')
    expect(textarea?.getAttribute('class')).toBe('formkit-input')
    expect(textarea?.getAttribute('name')).toBe('textarea')
    expect(textarea?.getAttribute('id')).toBe('foobar')
  })

  it('can control its data with modelValue', async () => {
    function Host() {
      const [value, setValue] = useState('bar')
      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          type: 'textarea',
          delay: 0,
          modelValue: value,
          onUpdateModelValue: setValue,
        }),
        createElement('pre', null, value)
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    expect(container.querySelector('pre')?.textContent).toBe('bar')

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.input(textarea, { target: { value: 'baz' } })

    await waitFor(() => {
      expect(container.querySelector('pre')?.textContent).toBe('baz')
    })
  })
})
