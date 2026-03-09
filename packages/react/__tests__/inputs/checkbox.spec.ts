import { getNode } from '@formkit/core'
import { token } from '@formkit/utils'
import { createElement, useState } from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormKit, defaultConfig } from '../../src'
import { renderWithFormKit } from '../helpers'

const testIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="currentColor" d="M2 8h12v1H2z"/></svg>'

describe('single checkbox (react)', () => {
  it('can render a single checkbox', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, { type: 'checkbox' }),
      defaultConfig()
    )

    expect(container.querySelector('input[type="checkbox"]')).toBeTruthy()
  })

  it('can render a single checkbox with an extended label', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'checkbox',
        label: '<h1>Hello world</h1>',
        sectionsSchema: {
          label: {
            attrs: {
              innerHTML: '$label',
            },
          },
        },
      }),
      defaultConfig()
    )

    expect(container.innerHTML).toContain('<span class="formkit-label"><h1>Hello world</h1></span>')
  })

  it('renders help text', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'checkbox',
        help: 'hello world',
      }),
      defaultConfig()
    )

    expect(container.textContent).toContain('hello world')
  })

  it('can check a single checkbox with a true value', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'checkbox',
        value: true,
      }),
      defaultConfig()
    )

    expect((container.querySelector('input') as HTMLInputElement).checked).toBe(true)
  })

  it('can uncheck a single checkbox with a false value', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'checkbox',
        value: false,
      }),
      defaultConfig()
    )

    expect((container.querySelector('input') as HTMLInputElement).checked).toBe(false)
  })

  it('can check/uncheck single checkbox with modelValue', async () => {
    function Host() {
      const [value, setValue] = useState(false)
      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          delay: 0,
          type: 'checkbox',
          modelValue: value,
          onUpdateModelValue: setValue,
        }),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => setValue(true),
          },
          'check'
        ),
        createElement('pre', { id: 'value' }, String(value))
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    const checkbox = container.querySelector('input') as HTMLInputElement
    expect(checkbox.checked).toBe(false)

    fireEvent.click(container.querySelector('button') as HTMLButtonElement)

    await waitFor(() => {
      expect((container.querySelector('input') as HTMLInputElement).checked).toBe(true)
    })

    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(container.querySelector('#value')?.textContent).toBe('false')
    })
  })

  it('can use custom on-value and off-value', async () => {
    function Host() {
      const [value, setValue] = useState('foo')
      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          delay: 0,
          type: 'checkbox',
          onValue: 'foo',
          offValue: 'bar',
          modelValue: value,
          onUpdateModelValue: setValue,
        }),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => setValue('bar'),
          },
          'set-off'
        ),
        createElement('pre', { id: 'value' }, value)
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    const checkbox = container.querySelector('input') as HTMLInputElement
    expect(checkbox.checked).toBe(true)

    fireEvent.click(container.querySelector('button') as HTMLButtonElement)

    await waitFor(() => {
      expect((container.querySelector('input') as HTMLInputElement).checked).toBe(false)
    })

    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(container.querySelector('#value')?.textContent).toBe('foo')
    })
  })

  it('can use object on-value and off-value', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        delay: 0,
        type: 'checkbox',
        onValue: { a: 123 },
        offValue: { b: 456 },
        value: { a: 123 },
      }),
      defaultConfig()
    )

    expect((container.querySelector('input') as HTMLInputElement).checked).toBe(true)
  })

  it('outputs data-disabled on the wrapper', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'checkbox',
        disabled: true,
        value: false,
      }),
      defaultConfig()
    )

    expect(container.querySelector('.formkit-wrapper[data-disabled]')).toBeTruthy()
  })

  it('renders the label slot even when no label prop is provided', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'checkbox',
        slots: {
          label: () => createElement('div', { id: 'hello-world' }, 'Render me anyway'),
        },
      }),
      defaultConfig()
    )

    expect(container.querySelector('#hello-world')).toBeTruthy()
  })

  it('does not render label when it is not provided', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, { type: 'checkbox' }),
      defaultConfig()
    )

    expect(container.querySelector('.formkit-label')).toBeNull()
  })

  it('adds data-checked to single checkbox when checked', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, { type: 'checkbox', value: true }),
      defaultConfig()
    )

    expect(container.querySelector('[data-checked]')).toBeTruthy()
  })
})

describe('multiple checkboxes (react)', () => {
  it('can render multiple checkboxes with options', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        id: 'my-id',
        type: 'checkbox',
        label: 'All checkboxes',
        help: 'help-text',
        name: 'mybox',
        options: ['foo', 'bar', 'baz'],
      }),
      defaultConfig()
    )

    expect(container.querySelectorAll('input[type="checkbox"]').length).toBe(3)
    expect(container.textContent).toContain('All checkboxes')
  })

  it('does not let non-clickable decorator icons consume pointer events', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        id: 'my-id',
        type: 'checkbox',
        options: ['foo', 'bar', 'baz'],
        decoratorIcon: testIcon,
      }),
      defaultConfig()
    )

    const icon = container.querySelector(
      '.formkit-decoratorIcon, .formkit-decorator-icon'
    ) as HTMLElement | null
    expect(icon).toBeTruthy()
    expect(icon?.style.pointerEvents).toBe('none')
  })

  it('keeps decorator icons clickable when an icon click handler is provided', () => {
    const onDecoratorIconClick = vi.fn()
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        id: 'my-id',
        type: 'checkbox',
        decoratorIcon: testIcon,
        onDecoratorIconClick,
      }),
      defaultConfig()
    )

    const icon = container.querySelector(
      '.formkit-decoratorIcon, .formkit-decorator-icon'
    ) as HTMLElement | null
    expect(icon).toBeTruthy()
    expect(icon?.style.pointerEvents).not.toBe('none')

    fireEvent.click(icon as HTMLElement)

    expect(onDecoratorIconClick).toHaveBeenCalledTimes(1)
  })

  it('multi-checkboxes set array values immediately', () => {
    renderWithFormKit(
      createElement(FormKit as any, {
        id: 'my-id',
        type: 'checkbox',
        options: ['foo', 'bar', 'baz'],
      }),
      defaultConfig()
    )

    expect(getNode('my-id')?.value).toEqual([])
  })

  it('can check and uncheck boxes via modelValue', async () => {
    function Host() {
      const [values, setValues] = useState(['foo', 'baz'])
      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          delay: 0,
          type: 'checkbox',
          modelValue: values,
          onUpdateModelValue: setValues,
          options: ['foo', 'bar', 'baz'],
        }),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => setValues(['foo', 'bar']),
          },
          'set-values'
        ),
        createElement('pre', { id: 'values' }, JSON.stringify(values))
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    const inputs = Array.from(container.querySelectorAll('fieldset input')) as HTMLInputElement[]
    expect(inputs[0].checked).toBe(true)
    expect(inputs[1].checked).toBe(false)
    expect(inputs[2].checked).toBe(true)

    fireEvent.click(inputs[0])

    await waitFor(() => {
      expect(container.querySelector('#values')?.textContent).toBe('["baz"]')
    })

    fireEvent.click(container.querySelector('button') as HTMLButtonElement)

    await waitFor(() => {
      const latest = Array.from(
        container.querySelectorAll('fieldset input')
      ) as HTMLInputElement[]
      expect(latest[0].checked).toBe(true)
      expect(latest[1].checked).toBe(true)
      expect(latest[2].checked).toBe(false)
    })
  })

  it('can have no group label and still render checkbox labels', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'checkbox',
        options: ['A', 'B', 'C'],
      }),
      defaultConfig()
    )

    expect(container.querySelector('legend')).toBeNull()
    expect(container.querySelectorAll('fieldset label').length).toBe(3)
    expect(container.textContent).toContain('A')
  })

  it('adds data-checked to box wrappers', async () => {
    function Host() {
      const [value, setValue] = useState<string[]>(['B'])
      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          type: 'checkbox',
          delay: 0,
          options: ['A', 'B', 'C'],
          modelValue: value,
          onUpdateModelValue: setValue,
        }),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => setValue(['A', 'B']),
          },
          'set-two'
        ),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => setValue([]),
          },
          'clear'
        )
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    expect(container.querySelectorAll('fieldset [data-checked]').length).toBe(1)

    const buttons = container.querySelectorAll('button')
    fireEvent.click(buttons[0] as HTMLButtonElement)

    await waitFor(() => {
      expect(container.querySelectorAll('fieldset [data-checked]').length).toBe(2)
    })

    fireEvent.click(buttons[1] as HTMLButtonElement)

    await waitFor(() => {
      expect(container.querySelectorAll('fieldset [data-checked]').length).toBe(0)
    })
  })

  it('can set default value from a modelValue form', () => {
    function Host() {
      const [values] = useState({ letters: ['A', 'C'] })
      return createElement(
        FormKit as any,
        {
          type: 'form',
          modelValue: values,
        },
        createElement(FormKit as any, {
          type: 'checkbox',
          options: ['A', 'B', 'C'],
          name: 'letters',
        })
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    const checkboxes = Array.from(container.querySelectorAll('form input')) as HTMLInputElement[]
    const values = checkboxes.map((box) => box.checked)
    expect(values).toEqual([true, false, true])
  })

  it('can render object options with ids and help text', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'checkbox',
        name: 'countries',
        options: [
          {
            value: 'it',
            label: 'Italy',
            id: 'italy',
            help: 'Good food here',
            attrs: { disabled: true },
          },
          {
            value: 'de',
            label: 'Germany',
            id: 'germany',
            help: 'Good cars here',
          },
          { value: 'fr', label: 'France', id: 'france', help: 'Crickets' },
        ],
      }),
      defaultConfig()
    )

    expect(container.querySelectorAll('input[type="checkbox"]').length).toBe(3)
    expect(container.querySelectorAll('input[type="checkbox"][disabled]').length).toBe(1)
    expect(container.textContent).toContain('Good food here')
  })
})
