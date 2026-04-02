import { FormKitMiddleware, getNode } from '@formkit/core'
import { createElement, useState } from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormKit, defaultConfig } from '../../src'
import { renderWithFormKit } from '../helpers'

describe('standard lists (react)', () => {
  it('uses list index as key', () => {
    renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'list',
          id: 'listA',
        },
        createElement(FormKit as any, { value: 'foo', name: 'first' }),
        createElement(FormKit as any, { value: 'bar', name: 'second' }),
        createElement(FormKit as any, { value: 'baz', name: 'third' })
      ),
      defaultConfig()
    )

    expect(getNode('listA')!.value).toStrictEqual(['foo', 'bar', 'baz'])
  })

  it('can show a validation error without validation-label', () => {
    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'list',
          id: 'listA',
        },
        createElement(FormKit as any, { name: 'first' }),
        createElement(FormKit as any, {
          name: 'second',
          validation: 'required',
          validationVisibility: 'live',
        }),
        createElement(FormKit as any, { name: 'third' })
      ),
      defaultConfig()
    )

    expect(container.textContent).toContain('1 is required')
  })

  it('can insert an input between other inputs', async () => {
    function Host() {
      const [showB, setShowB] = useState(false)
      const [values, setValues] = useState<string[]>([])

      return createElement(
        'div',
        null,
        createElement(
          FormKit as any,
          {
            type: 'list',
            modelValue: values,
            onUpdateModelValue: setValues,
          },
          createElement(FormKit as any, { value: 'A' }),
          showB ? createElement(FormKit as any, { value: 'B', index: 1, key: 'b' }) : null,
          createElement(FormKit as any, { value: 'C' })
        ),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => setShowB(true),
          },
          'show-b'
        ),
        createElement('pre', { id: 'values' }, JSON.stringify(values))
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    await waitFor(() => {
      expect(container.querySelector('#values')?.textContent).toBe('["A","C"]')
    })

    fireEvent.click(container.querySelector('button') as HTMLButtonElement)

    await waitFor(() => {
      expect(container.querySelector('#values')?.textContent).toBe('["A","B","C"]')
    })
  })

  it('can replace the value array without warnings', async () => {
    const middleware: FormKitMiddleware<any[]> = (value, next) => {
      return next(Array.isArray(value) ? value.map((childValue: any) => childValue) : value)
    }

    const warn = vi.spyOn(console, 'warn')
    const hookCallback = vi.fn(middleware)

    renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'list',
          modelValue: ['foo'],
          onUpdateModelValue: () => undefined,
        },
        createElement(FormKit as any)
      ),
      defaultConfig({
        plugins: [
          (node) => {
            if (node.type === 'list') {
              node.hook.commit(hookCallback)
            }
          },
        ],
      })
    )

    await waitFor(() => {
      expect(hookCallback).toBeCalled()
      expect(warn).not.toHaveBeenCalled()
    })

    warn.mockRestore()
  })

  it('can initialize a synced list with duplicate initial values', async () => {
    function Host() {
      const [values] = useState(['123', '123'])
      return createElement(
        FormKit as any,
        {
          type: 'list',
          sync: true,
          modelValue: values,
        },
        (slotProps: any) =>
          slotProps.items?.map((item: string, index: number) =>
            createElement(FormKit as any, {
              type: 'text',
              key: index,
              index,
            })
          )
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[]
    expect(inputs.length).toBe(2)
    inputs.forEach((input) => {
      expect(input.value).toBe('123')
    })
  })

  it('reorders synced list inputs when the backing value order changes', async () => {
    function Host() {
      const [books, setBooks] = useState([
        { title: 'The Great Gatsby' },
        { title: 'To Kill A Mockingbird' },
        { title: 'A Farewell to Arms' },
      ])

      return createElement(
        'div',
        null,
        createElement(
          'button',
          {
            type: 'button',
            onClick: () =>
              setBooks(([first, second, third]) => [second, first, third]),
          },
          'swap'
        ),
        createElement(
          FormKit as any,
          {
            type: 'list',
            sync: true,
            modelValue: books,
            onUpdateModelValue: setBooks,
          },
          (slotProps: any) =>
            slotProps.items?.map((item: string, index: number) =>
              createElement(
                FormKit as any,
                {
                  type: 'group',
                  key: item,
                  index,
                },
                createElement(FormKit as any, {
                  type: 'text',
                  name: 'title',
                })
              )
            )
        )
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    const getInputs = () =>
      Array.from(container.querySelectorAll('input[type="text"]')) as HTMLInputElement[]

    await waitFor(() => {
      expect(getInputs().map((input) => input.value)).toEqual([
        'The Great Gatsby',
        'To Kill A Mockingbird',
        'A Farewell to Arms',
      ])
    })

    fireEvent.click(container.querySelector('button') as HTMLButtonElement)

    await waitFor(() => {
      expect(getInputs().map((input) => input.value)).toEqual([
        'To Kill A Mockingbird',
        'The Great Gatsby',
        'A Farewell to Arms',
      ])
    })
  })

  it('keeps list item positions stable across parent rerenders', async () => {
    function Host() {
      const [tick, setTick] = useState(0)
      return createElement(
        'div',
        null,
        createElement('pre', { id: 'tick' }, String(tick)),
        createElement(
          FormKit as any,
          {
            type: 'list',
            id: 'stable-list',
            delay: 0,
            onInput: () => setTick((n) => n + 1),
          },
          createElement(FormKit as any, { type: 'text', value: 'List item 1' }),
          createElement(FormKit as any, { type: 'text', value: 'List item 2' }),
          createElement(FormKit as any, { type: 'text', value: 'List item 3' })
        )
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    const getInputs = () =>
      Array.from(container.querySelectorAll('input[type="text"]')) as HTMLInputElement[]

    await waitFor(() => {
      expect(getInputs().length).toBe(3)
    })

    const initialUids = getNode('stable-list')?.children.map((child) => child.uid)

    fireEvent.input(getInputs()[0], { target: { value: 'this is also working' } })

    await waitFor(() => {
      expect(getNode('stable-list')?.value).toEqual([
        'this is also working',
        'List item 2',
        'List item 3',
      ])
    })

    fireEvent.input(getInputs()[1], { target: { value: 'and so is this' } })

    await waitFor(() => {
      expect(getNode('stable-list')?.value).toEqual([
        'this is also working',
        'and so is this',
        'List item 3',
      ])
    })

    const nextUids = getNode('stable-list')?.children.map((child) => child.uid)
    expect(nextUids).toEqual(initialUids)
    expect(container.querySelector('#tick')?.textContent).not.toBe('0')
  })
})
