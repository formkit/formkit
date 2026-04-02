import { getNode } from '@formkit/core'
import { token } from '@formkit/utils'
import { createElement, useState } from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormKit, defaultConfig } from '../../src'
import { renderWithFormKit } from '../helpers'

describe('radios (react)', () => {
  it('can render radio inputs', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'radio',
        options: ['Foo', 'Bar'],
      }),
      defaultConfig()
    )

    expect(container.querySelectorAll('input[type="radio"]').length).toBe(2)
  })

  it('can select and unselect radio inputs', async () => {
    function Host() {
      const [value, setValue] = useState('bar')
      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          delay: 0,
          modelValue: value,
          onUpdateModelValue: setValue,
          type: 'radio',
          options: {
            foo: 'Foo',
            bar: 'Bar',
            fiz: 'Fiz',
            buzz: 'Buzz',
          },
        }),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => setValue('fiz'),
          },
          'set-fiz'
        ),
        createElement('pre', { id: 'value' }, value)
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    const radios = Array.from(container.querySelectorAll('fieldset input')) as HTMLInputElement[]
    expect(radios[0].checked).toBe(false)
    expect(radios[1].checked).toBe(true)
    expect(radios[2].checked).toBe(false)
    expect(radios[3].checked).toBe(false)

    fireEvent.click(container.querySelector('button') as HTMLButtonElement)

    await waitFor(() => {
      const latest = Array.from(
        container.querySelectorAll('fieldset input')
      ) as HTMLInputElement[]
      expect(latest[0].checked).toBe(false)
      expect(latest[1].checked).toBe(false)
      expect(latest[2].checked).toBe(true)
      expect(latest[3].checked).toBe(false)
    })

    fireEvent.click(radios[3])

    await waitFor(() => {
      expect(container.querySelector('#value')?.textContent).toBe('buzz')
    })
  })

  it('throws a warning if no options are provided', () => {
    const warning = vi.fn()
    const consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(warning)

    renderWithFormKit(createElement(FormKit as any, { type: 'radio' }), defaultConfig())

    consoleWarnMock.mockRestore()
    expect(warning).toHaveBeenCalledTimes(1)
  })

  it('changes selected radios when value is set on node', async () => {
    const id = token()

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        id,
        delay: 0,
        type: 'radio',
        value: 'B',
        options: ['A', 'B', 'C'],
      }),
      defaultConfig()
    )

    const inputs = Array.from(
      container.querySelectorAll('input[type="radio"]')
    ) as HTMLInputElement[]

    expect(inputs.map((input) => input.checked)).toStrictEqual([false, true, false])

    getNode(id)?.input('C')

    await waitFor(() => {
      expect(inputs.map((input) => input.checked)).toStrictEqual([false, false, true])
    })

    getNode(id)?.input('A')

    await waitFor(() => {
      expect(inputs.map((input) => input.checked)).toStrictEqual([true, false, false])
    })
  })

  it('can have an object value', async () => {
    const id = token()

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        id,
        delay: 0,
        type: 'radio',
        value: { foo: 'bar' },
        options: [
          { value: { foo: 'bar' }, label: 'foobar' },
          { value: { fruit: 'banana' }, label: 'fruit' },
        ],
      }),
      defaultConfig()
    )

    const radios = Array.from(container.querySelectorAll('input')) as HTMLInputElement[]
    expect(radios.map((radio) => radio.checked)).toEqual([true, false])

    fireEvent.click(radios[1])

    await waitFor(() => {
      expect(getNode(id)!.value).toEqual({ fruit: 'banana' })
      expect(radios.map((radio) => radio.checked)).toEqual([false, true])
    })
  })

  it('can have a null value', async () => {
    const id = token()

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        id,
        delay: 0,
        type: 'radio',
        value: false,
        options: [
          { value: null, label: 'foobar' },
          { value: false, label: 'fruit' },
          { value: true, label: 'todd' },
        ],
      }),
      defaultConfig()
    )

    const radios = Array.from(container.querySelectorAll('input')) as HTMLInputElement[]
    expect(radios.map((radio) => radio.checked)).toEqual([false, true, false])

    fireEvent.click(radios[0])

    await waitFor(() => {
      expect(radios.map((radio) => radio.checked)).toEqual([true, false, false])
      expect(getNode(id)!.value).toEqual(null)
    })
  })

  it('applies undefined to a false disabled prop', async () => {
    function Host() {
      const [disabled, setDisabled] = useState('false')
      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          type: 'radio',
          disabled,
          options: [
            { value: null, label: 'foobar' },
            { value: false, label: 'fruit' },
            { value: true, label: 'todd' },
          ],
        }),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => setDisabled('true'),
          },
          'disable'
        )
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    expect(container.querySelector('.formkit-outer')?.getAttribute('data-disabled')).toBeNull()

    fireEvent.click(container.querySelector('button') as HTMLButtonElement)

    await waitFor(() => {
      expect(container.querySelector('.formkit-outer')?.getAttribute('data-disabled')).toBe('true')
    })
  })

  it('can differentiate between undefined and null option values', async () => {
    const id = token()

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        id,
        delay: 0,
        type: 'radio',
        value: undefined,
        options: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
          { value: null, label: 'N/A' },
        ],
      }),
      defaultConfig()
    )

    const radios = Array.from(container.querySelectorAll('input')) as HTMLInputElement[]

    fireEvent.click(radios[1])

    await waitFor(() => {
      expect(getNode(id)!.value).toBe(false)
    })
  })
})
