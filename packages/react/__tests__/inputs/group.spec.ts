import { getNode, reset } from '@formkit/core'
import { token } from '@formkit/utils'
import { createElement, useState } from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormKit, defaultConfig } from '../../src'
import { renderWithFormKit } from '../helpers'

describe('group (react)', () => {
  it('can pass values down to children', () => {
    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'group',
          value: { foo: 'abc', baz: 'hello' },
        },
        createElement(FormKit as any, { name: 'foo' }),
        createElement(FormKit as any, { name: 'bar' }),
        createElement(FormKit as any, { name: 'baz' })
      ),
      defaultConfig()
    )

    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[]
    expect(inputs[0].value).toBe('abc')
    expect(inputs[1].value).toBe('')
    expect(inputs[2].value).toBe('hello')
  })

  it('can mutate modelValue values via node.input on child', async () => {
    const groupId = token()

    function Host() {
      const [values, setValues] = useState({ foo: 'abc', baz: 'hello' })
      return createElement(
        'div',
        null,
        createElement(
          FormKit as any,
          {
            id: groupId,
            type: 'group',
            modelValue: values,
            onUpdateModelValue: setValues,
          },
          createElement(FormKit as any, { name: 'foo' }),
          createElement(FormKit as any, { name: 'bar' }),
          createElement(FormKit as any, { name: 'baz' })
        ),
        createElement('pre', { id: 'values' }, JSON.stringify(values))
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    getNode(groupId)?.at('bar')?.input('this works great')

    await waitFor(() => {
      expect(container.querySelector('#values')?.textContent).toContain(
        'this works great'
      )
    })
  })

  it('does not mutate the initial value object', async () => {
    function Host() {
      const [initial] = useState({ foo: 'abc', baz: 'hello' })
      return createElement(
        'div',
        null,
        createElement(
          FormKit as any,
          {
            type: 'group',
            value: initial,
          },
          createElement(FormKit as any, { name: 'foo', delay: 0 }),
          createElement(FormKit as any, { name: 'bar' }),
          createElement(FormKit as any, { name: 'baz' })
        ),
        createElement('pre', { id: 'initial' }, JSON.stringify(initial))
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    fireEvent.input(container.querySelector('input') as HTMLInputElement, {
      target: { value: 'def' },
    })

    await waitFor(() => {
      expect(container.querySelector('#initial')?.textContent).toBe(
        '{"foo":"abc","baz":"hello"}'
      )
    })
  })

  it('can reactively disable and enable all inputs in a group', async () => {
    function Host() {
      const [disabled, setDisabled] = useState(false)
      return createElement(
        'div',
        null,
        createElement(
          FormKit as any,
          {
            type: 'group',
            disabled,
          },
          createElement(FormKit as any, { id: 'disabledEmail', type: 'email' }),
          createElement(FormKit as any, { id: 'disabledSelect', type: 'select' })
        ),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => setDisabled(true),
          },
          'disable'
        )
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    expect(container.querySelector('[data-disabled] input[disabled]')).toBeNull()
    expect(container.querySelector('[data-disabled] select[disabled]')).toBeNull()

    fireEvent.click(container.querySelector('button') as HTMLButtonElement)

    await waitFor(() => {
      expect(container.querySelector('[data-disabled] input[disabled]')).toBeTruthy()
      expect(container.querySelector('[data-disabled] select[disabled]')).toBeTruthy()
    })
  })

  it('can reset values to original state', async () => {
    const groupId = token()

    function Host() {
      const [data, setData] = useState<Record<string, any>>({
        address: {
          street: 'Kiev St.',
        },
      })

      return createElement(
        'div',
        null,
        createElement(
          FormKit as any,
          {
            type: 'group',
            id: groupId,
            modelValue: data,
            onUpdateModelValue: setData,
          },
          createElement(FormKit as any, { name: 'name' }),
          createElement(FormKit as any, {
            name: 'email',
            value: 'example@example.com',
          }),
          createElement(
            FormKit as any,
            { type: 'group', name: 'address' },
            createElement(FormKit as any, { name: 'street' })
          )
        ),
        createElement('pre', { id: 'data' }, JSON.stringify(data))
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    await waitFor(() => {
      expect(container.querySelector('#data')?.textContent).toContain('Kiev St.')
    })

    reset(groupId)

    await waitFor(() => {
      expect(container.querySelector('#data')?.textContent).toContain('Kiev St.')
      expect(container.querySelector('#data')?.textContent).toContain('example@example.com')
    })
  })

  it('can add a fieldset around the group', () => {
    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'group',
          sectionsSchema: { wrapper: { $el: 'fieldset' } },
        },
        'Hello'
      ),
      defaultConfig()
    )

    expect(container.innerHTML).toContain('<fieldset class="formkit-wrapper">Hello</fieldset>')
  })

  it('does not reuse hidden schema for structural inputs', () => {
    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        { type: 'form' },
        createElement(FormKit as any, { type: 'hidden', name: 'hidden_data', value: 'x' }),
        createElement(
          FormKit as any,
          { type: 'group', name: 'group_data' },
          createElement(FormKit as any, { type: 'text', name: 'first_name' })
        ),
        createElement(
          FormKit as any,
          { type: 'list', name: 'list_data' },
          createElement(FormKit as any, { type: 'text' })
        ),
        createElement(FormKit as any, {
          type: 'meta',
          name: 'meta_data',
          value: { source: 'test' },
        })
      ),
      defaultConfig()
    )

    expect(container.querySelector('input[name="group_data"]')).toBeNull()
    expect(container.querySelector('input[name="list_data"]')).toBeNull()
    expect(container.querySelector('input[name="meta_data"]')).toBeNull()
    expect(container.querySelector('input[name="first_name"]')).toBeTruthy()
  })
})
