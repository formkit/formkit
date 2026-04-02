import { FormKitNode } from '@formkit/core'
import { token } from '@formkit/utils'
import { createElement, useState } from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createInput } from '../src/composables/createInput'
import { FormKit, defaultConfig } from '../src'
import { renderWithFormKit } from './helpers'

describe('schema based inputs (react)', () => {
  it('automatically has labels and help text', () => {
    const foo = createInput('hello')
    const label = token()
    const help = token()

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: foo,
        name: 'custom',
        label,
        help,
      }),
      defaultConfig()
    )

    expect(container.textContent).toContain(label)
    expect(container.textContent).toContain(help)
  })

  it('can output the value of the node', () => {
    const foo = createInput('$_value')
    const value = token()

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: foo,
        name: 'custom',
        value,
      }),
      defaultConfig()
    )

    expect(container.textContent).toContain(value)
  })

  it('can update a groups value', async () => {
    const foo = createInput({
      $el: 'input',
      attrs: {
        onInput: '$handlers.DOMInput',
        value: '$_value',
      },
    })

    function Host() {
      const [group, setGroup] = useState({ wham: token() })
      return createElement(
        'div',
        null,
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => setGroup({ wham: 'bizbaz' }),
          },
          'set'
        ),
        createElement(
          FormKit as any,
          {
            type: 'group',
            delay: 0,
            modelValue: group,
            onUpdateModelValue: setGroup,
          },
          createElement(FormKit as any, { type: 'foo', name: 'wham' })
        )
      )
    }

    const { container } = renderWithFormKit(
      createElement(Host),
      defaultConfig({ inputs: { foo } })
    )

    const input = container.querySelector('input') as HTMLInputElement
    const initialValue = input.value
    expect(initialValue.length).toBeGreaterThan(0)

    fireEvent.click(container.querySelector('button') as HTMLButtonElement)

    await waitFor(() => {
      expect((container.querySelector('input') as HTMLInputElement).value).toBe(
        'bizbaz'
      )
    })
  })

  it('can create an input with a fragment as the schema', () => {
    const foo = createInput([{ $el: 'header' }, { $el: 'footer' }])

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: foo,
        name: 'custom',
      }),
      defaultConfig()
    )

    expect(container.querySelector('header')).toBeTruthy()
    expect(container.querySelector('footer')).toBeTruthy()
  })

  it('has prefix and suffix icon support', async () => {
    const foo = createInput('FooBar')

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: foo,
        name: 'custom',
        prefixIcon: 'happy',
        suffixIcon: 'sad',
      }),
      defaultConfig({
        icons: {
          happy:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 7"><path d="M8,6.5c-.13,0-.26-.05-.35-.15L3.15,1.85c-.2-.2-.2-.51,0-.71,.2-.2,.51-.2,.71,0l4.15,4.15L12.15,1.15c.2-.2,.51-.2,.71,0,.2,.2,.2,.51,0,.71l-4.5,4.5c-.1,.1-.23,.15-.35,.15Z" fill="currentColor"/></svg>',
          sad: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle fill="currentColor" cx="16" cy="16" r="16"/></svg>',
        },
      })
    )

    await waitFor(() => {
      expect(container.querySelectorAll('.formkit-icon').length).toBe(2)
    })
  })
})

describe('react component inputs', () => {
  it('can use a react component input', async () => {
    function CustomInput(props: { context: any }) {
      return createElement('input', {
        value: props.context._value || '',
        onInput: props.context.handlers.DOMInput,
      })
    }

    const box = createInput(CustomInput)

    function Host() {
      const [value, setValue] = useState('hello')
      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          delay: 0,
          modelValue: value,
          onUpdateModelValue: setValue,
          type: 'box',
        }),
        createElement('pre', null, value)
      )
    }

    const { container } = renderWithFormKit(
      createElement(Host),
      defaultConfig({ inputs: { box } })
    )

    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('hello')

    fireEvent.input(input, { target: { value: 'goodbye' } })

    await waitFor(() => {
      expect(container.querySelector('pre')?.textContent).toBe('goodbye')
    })
  })
})

describe('custom input behaviors (react)', () => {
  it('does not emit prop:{property} events for input props', async () => {
    const pseudoPropEvent = vi.fn()
    const nativePropEvent = vi.fn()

    const input = createInput('test input', {
      props: ['bizBaz'],
      features: [
        (node: FormKitNode) => {
          node.on('prop:bizBaz', pseudoPropEvent)
          node.on('prop:delay', nativePropEvent)
        },
      ],
    })

    renderWithFormKit(
      createElement(FormKit as any, {
        type: input,
        bizBaz: 'hello',
        delay: 10,
      }),
      defaultConfig()
    )

    await new Promise((r) => setTimeout(r, 0))

    expect(nativePropEvent).toHaveBeenCalledTimes(0)
    expect(pseudoPropEvent).toHaveBeenCalledTimes(0)
  })
})

describe('schemaMemoKey (react)', () => {
  it('automatically applies a schema memo key if there is none', async () => {
    const componentA = () => createElement('span', null, 'Hello world')
    const componentB = () => createElement('span', null, 'Hello mars')
    const text = createInput(componentA)
    const password = createInput(componentB)

    const { container } = renderWithFormKit(
      createElement(
        'div',
        null,
        createElement(FormKit as any, { type: 'text' }),
        createElement(FormKit as any, { type: 'password' })
      ),
      defaultConfig({ inputs: { text, password } })
    )

    await waitFor(() => {
      expect(container.textContent).toContain('Hello world')
      expect(container.textContent).toContain('Hello mars')
    })
  })
})

describe('createInput sectionSchema (react)', () => {
  it('can create an input without a label', () => {
    const foo = createInput(
      'hello',
      {},
      {
        label: null,
      }
    )

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: foo,
        name: 'custom',
        label: 'Fizzbuzz',
      }),
      defaultConfig()
    )

    expect(container.textContent).toContain('hello')
    expect(container.querySelector('.formkit-label')).toBeNull()
  })
})
