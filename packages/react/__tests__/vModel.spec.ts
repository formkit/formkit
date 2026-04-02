import { FormKitNode } from '@formkit/core'
import { token } from '@formkit/utils'
import { createElement, useState } from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormKit, defaultConfig } from '../src'
import { renderWithFormKit } from './helpers'

describe('v-model (react)', () => {
  it('emits model updates even when hook normalizes to same final value', async () => {
    const id = token()
    const updatedEventCallback = vi.fn()

    function Host() {
      const [value, setValue] = useState('xyz')
      const setToFoo = (node: FormKitNode) => {
        node.hook.input((_, next) => {
          return next('foo')
        })
      }

      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          id,
          type: 'text',
          modelValue: value,
          onUpdateModelValue: (next: string) => {
            updatedEventCallback(next)
            setValue(next)
          },
          plugins: [setToFoo],
        }),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => setValue('bar'),
          },
          'set-bar'
        ),
        createElement('pre', { id: 'value' }, value)
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    await waitFor(() => {
      expect(updatedEventCallback.mock.calls.length).toBeGreaterThanOrEqual(1)
      expect(updatedEventCallback).toHaveBeenLastCalledWith('foo')
      expect(container.querySelector('#value')?.textContent).toBe('foo')
    })

    fireEvent.click(container.querySelector('button') as HTMLButtonElement)

    await waitFor(() => {
      expect(updatedEventCallback.mock.calls.length).toBeGreaterThanOrEqual(2)
      expect(updatedEventCallback).toHaveBeenLastCalledWith('foo')
      expect(container.querySelector('#value')?.textContent).toBe('foo')
    })
  })

  it('updates rendered model value when input changes at depth', async () => {
    function Host() {
      const [data, setData] = useState<Record<string, any>>({})
      return createElement(
        'div',
        null,
        createElement(
          FormKit as any,
          {
            type: 'form',
            modelValue: data,
            onUpdateModelValue: setData,
          },
          createElement(
            FormKit as any,
            { type: 'group', name: 'group' },
            createElement(FormKit as any, {
              type: 'text',
              name: 'text',
              label: 'FormKit Input',
              help: 'edit me to get started',
              delay: 0,
            })
          )
        ),
        createElement('pre', { id: 'data' }, JSON.stringify(data))
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    fireEvent.input(container.querySelector('input') as HTMLInputElement, {
      target: { value: 'foo' },
    })

    await waitFor(() => {
      expect(container.querySelector('#data')?.textContent).toContain('"group"')
      expect(container.querySelector('#data')?.textContent).toContain('"text":"foo"')
    })
  })

  it('works with both modelValue and value props', async () => {
    function Host() {
      const [data1, setData1] = useState('abc')
      const [data2, setData2] = useState('xyz')

      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          modelValue: data1,
          onUpdateModelValue: setData1,
          type: 'text',
          name: 'text-vmodel',
          delay: 0,
        }),
        createElement(FormKit as any, {
          value: data2,
          onUpdateModelValue: setData2,
          type: 'text',
          name: 'text-value',
          delay: 0,
        }),
        createElement(
          'button',
          {
            id: 'set-values',
            type: 'button',
            onClick: () => {
              setData1('foo')
              setData2('bar')
            },
          },
          'set-values'
        ),
        createElement('pre', { id: 'values' }, JSON.stringify({ data1, data2 }))
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    fireEvent.click(container.querySelector('#set-values') as HTMLButtonElement)

    await waitFor(() => {
      expect(container.querySelector('#values')?.textContent).toContain('"data1":"foo"')
      expect(container.querySelector('#values')?.textContent).toContain('"data2":"bar"')
    })
  })
})
