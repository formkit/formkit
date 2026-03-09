import { getNode } from '@formkit/core'
import { token } from '@formkit/utils'
import { createElement, useState } from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormKit, defaultConfig } from '../../src'
import { renderWithFormKit } from '../helpers'

describe('select (react)', () => {
  it('renders a select with an array of objects', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        options: [
          { label: 'FooBar', value: 'foo' },
          { label: 'BarFoo', value: 'bar' },
        ],
        help: 'I am help text',
      }),
      defaultConfig()
    )

    const select = container.querySelector('select') as HTMLSelectElement
    expect(select).toBeTruthy()
    expect(select.options.length).toBe(2)
    expect(select.options[0].text).toBe('FooBar')
    expect(container.textContent).toContain('I am help text')
  })

  it('renders a select with an array of strings', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        name: 'select_foo',
        options: ['foo', 'bar'],
      }),
      defaultConfig()
    )

    const select = container.querySelector('select') as HTMLSelectElement
    expect(select.options.length).toBe(2)
    expect(select.options[0].value).toBe('foo')
    expect(select.options[1].value).toBe('bar')
  })

  it('renders a select with key/value object options', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        name: 'select_foo',
        id: 'select_foo',
        options: {
          foo: 'Bar',
          baz: 'Bim',
        },
      }),
      defaultConfig()
    )

    const select = container.querySelector('select') as HTMLSelectElement
    expect(select.options.length).toBe(2)
    expect(select.options[0].value).toBe('foo')
    expect(select.options[0].text).toBe('Bar')
  })

  it('selects first value when no value is specified', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        name: 'select_foo',
        id: 'select-defaults',
        options: {
          foo: 'Bar',
          baz: 'Bim',
        },
      }),
      defaultConfig()
    )

    const node = getNode('select-defaults')!
    expect(node.value).toBe('foo')
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('foo')
  })

  it('does not select first value when multiple is enabled', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        name: 'select_foo',
        id: 'select-multiple',
        multiple: '',
        options: {
          foo: 'Bar',
          baz: 'Bim',
        },
      }),
      defaultConfig()
    )

    const node = getNode('select-multiple')!
    expect(node.value).toEqual([])
    const selected = Array.from(
      (container.querySelector('select') as HTMLSelectElement).selectedOptions
    )
    expect(selected).toEqual([])
  })

  it('selects a different value when one is specified', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        name: 'select_foo',
        value: 'jim',
        id: 'select-value',
        options: {
          foo: 'Bar',
          jim: 'Jam',
          baz: 'Bim',
        },
      }),
      defaultConfig()
    )

    const node = getNode('select-value')!
    expect(node.value).toBe('jim')
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('jim')
  })

  it('displays a placeholder when used', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        placeholder: 'Select one',
        options: {
          foo: 'Bar',
          jim: 'Jam',
          bing: 'Bam',
          baz: 'Bim',
        },
      }),
      defaultConfig()
    )

    const select = container.querySelector('select') as HTMLSelectElement
    expect(select.getAttribute('data-placeholder')).toBe('true')
    expect(select.value).toBe('')
    expect(select.options[0].text).toBe('Select one')
  })

  it('can model its value', async () => {
    function Host() {
      const [value, setValue] = useState('bar')
      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          type: 'select',
          delay: 0,
          options: ['foo', 'baz', 'bar'],
          modelValue: value,
          onUpdateModelValue: setValue,
        }),
        createElement('pre', { id: 'value' }, value)
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    const select = container.querySelector('select') as HTMLSelectElement
    expect(select.value).toBe('bar')

    fireEvent.input(select, { target: { value: 'baz' } })

    await waitFor(() => {
      expect(container.querySelector('#value')?.textContent).toBe('baz')
    })
  })

  it('can select multiple values', async () => {
    function Host() {
      const [value, setValue] = useState(['bar', 'baz'])
      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          delay: 0,
          type: 'select',
          multiple: true,
          modelValue: value,
          onUpdateModelValue: setValue,
          options: ['bar', 'foo', 'baz'],
        }),
        createElement('pre', { id: 'value' }, JSON.stringify(value))
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    const select = container.querySelector('select') as HTMLSelectElement
    expect(Array.from(select.selectedOptions).map((option) => option.value)).toEqual([
      'bar',
      'baz',
    ])

    const options = Array.from(select.options)
    options.forEach((option) => {
      option.selected = option.value !== 'bar'
    })
    fireEvent.input(select)

    await waitFor(() => {
      expect(container.querySelector('#value')?.textContent).toBe('["foo","baz"]')
    })
  })

  it('can set value via node after initial render', async () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        id: 'select-via-node',
        delay: 0,
        options: {
          foo: 'Bar',
          jim: 'Jam',
          baz: 'Bim',
        },
      }),
      defaultConfig()
    )

    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('foo')

    getNode('select-via-node')!.input('jim')

    await waitFor(() => {
      expect((container.querySelector('select') as HTMLSelectElement).value).toBe('jim')
    })
  })

  it('allows a select list with no options', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        name: 'select_foo',
        id: 'select_foo',
        options: [],
      }),
      defaultConfig()
    )

    expect((container.querySelector('select') as HTMLSelectElement).options.length).toBe(0)
  })

  it('selects placeholder when multiple is explicitly false', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        multiple: false,
        placeholder: 'Foo bar!',
        options: ['A', 'B'],
        name: 'no-multi',
      }),
      defaultConfig()
    )

    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('')
  })

  it('selects placeholder when value is null and no null option matches', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        multiple: false,
        placeholder: 'My placeholder',
        options: [{ value: 'abc', label: 'abc' }],
        value: null,
      }),
      defaultConfig()
    )

    expect(container.querySelector('[data-placeholder="true"]')).toBeTruthy()
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('')
  })

  it('selects matching null option when value is null', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        multiple: false,
        placeholder: 'My placeholder',
        options: [
          { value: 'abc', label: 'abc' },
          { label: 'def', value: null },
        ],
        value: null,
      }),
      defaultConfig()
    )

    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('__mask_1')
    expect(container.querySelector('[data-placeholder="true"]')).toBeNull()
  })
})

describe('select arbitrary type values (react)', () => {
  it('allows numeric values', async () => {
    const id = token()

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        delay: 0,
        id,
        options: [
          { value: 1, label: 'One' },
          { value: 2, label: 'Two' },
          { value: 3, label: 'Three' },
        ],
      }),
      defaultConfig()
    )

    expect(getNode(id)!.value).toBe(1)

    const select = container.querySelector('select') as HTMLSelectElement
    fireEvent.input(select, { target: { value: select.options[1].value } })

    await waitFor(() => {
      expect(getNode(id)!.value).toBe(2)
    })
  })

  it('allows objects as select option values', async () => {
    const id = token()

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        delay: 0,
        id,
        value: { tool: 'socket' },
        options: [
          { value: { tool: 'hammer' }, label: 'Best' },
          { value: { tool: 'wrench' }, label: 'Worst' },
          { value: { tool: 'socket' }, label: 'Middle' },
        ],
      }),
      defaultConfig()
    )

    expect(getNode(id)!.value).toEqual({ tool: 'socket' })

    const select = container.querySelector('select') as HTMLSelectElement
    fireEvent.input(select, { target: { value: select.options[0].value } })

    await waitFor(() => {
      expect(getNode(id)!.value).toEqual({ tool: 'hammer' })
    })
  })

  it('outputs data-multiple only when multiple attribute is applied', () => {
    const single = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        options: [
          { value: { tool: 'hammer' }, label: 'Best' },
          { value: { tool: 'wrench' }, label: 'Worst' },
        ],
      }),
      defaultConfig()
    )

    expect(single.container.querySelector('.formkit-outer')?.getAttribute('data-multiple')).toBeNull()

    const multiple = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'select',
        multiple: true,
        options: [
          { value: { tool: 'hammer' }, label: 'Best' },
          { value: { tool: 'wrench' }, label: 'Worst' },
        ],
      }),
      defaultConfig()
    )

    expect(multiple.container.querySelector('.formkit-outer')?.getAttribute('data-multiple')).toBe(
      'true'
    )
  })
})
