import { getNode } from '@formkit/core'
import { token } from '@formkit/utils'
import { createElement } from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormKit, defaultConfig } from '../../src'
import { renderWithFormKit } from '../helpers'

describe('text classification (react)', () => {
  it('can render a text input', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'text',
        value: 133,
      }),
      defaultConfig()
    )

    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.getAttribute('class')).toBe('formkit-input')
    expect(input.value).toBe('133')
  })

  it('renders arbitrary attributes on the input element', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'text',
        name: 'food',
        id: 'foobar',
        placeholder: 'Favorite food?',
      }),
      defaultConfig()
    )

    const input = container.querySelector('input')
    expect(input?.getAttribute('placeholder')).toBe('Favorite food?')
    expect(input?.getAttribute('name')).toBe('food')
    expect(input?.getAttribute('id')).toBe('foobar')
  })

  it('can disable a text input', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'text',
        disabled: true,
      }),
      defaultConfig()
    )

    expect(container.querySelector('.formkit-outer[data-disabled]')).toBeTruthy()
    expect(container.querySelector('input[disabled]')).toBeTruthy()
  })

  it('throws an error when provided input type is not in library', () => {
    const consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* noop */
    })

    expect(() =>
      renderWithFormKit(createElement(FormKit as any, { type: 'foobar' }), defaultConfig())
    ).toThrow(Error)

    consoleWarnMock.mockRestore()
  })

  it('renders text family for text based types', () => {
    const textInputs = ['email', 'password', 'search', 'tel', 'text', 'url']

    textInputs.forEach((type) => {
      const { container } = renderWithFormKit(
        createElement(FormKit as any, { type }),
        defaultConfig()
      )
      expect(container.querySelector('.formkit-outer')?.getAttribute('data-family')).toBe(
        'text'
      )
    })
  })

  it('can add a blur handler to a text input', async () => {
    const onBlur = vi.fn()

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'text',
        onBlur,
      }),
      defaultConfig()
    )

    fireEvent.blur(container.querySelector('input') as HTMLInputElement)

    await waitFor(() => {
      expect(onBlur).toHaveBeenCalled()
    })
  })

  it('can render a text input with a null value', async () => {
    const id = token()

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        id,
        type: 'text',
        value: null,
      }),
      defaultConfig()
    )

    const node = getNode(id)!
    expect(node.value).toBe(null)

    node.input(null)

    await waitFor(() => {
      expect((container.querySelector('input') as HTMLInputElement).value).toBe('')
    })
  })
})

describe('the number feature (react)', () => {
  it('casts initial values to numbers', () => {
    const id = `a${token()}`

    renderWithFormKit(
      createElement(FormKit as any, {
        id,
        type: 'text',
        number: true,
        value: '123',
      }),
      defaultConfig()
    )

    expect(getNode(id)!.value).toBe(123)
  })

  it('allows strings to be used when they do not cast to numbers', () => {
    const id = `a${token()}`

    renderWithFormKit(
      createElement(FormKit as any, {
        id,
        type: 'text',
        number: true,
        value: 'abc',
      }),
      defaultConfig()
    )

    expect(getNode(id)!.value).toBe('abc')
  })

  it('forces initial values to undefined on a number input', () => {
    const id = `a${token()}`

    renderWithFormKit(
      createElement(FormKit as any, {
        id,
        type: 'number',
        number: true,
        value: 'abc',
      }),
      defaultConfig()
    )

    expect(getNode(id)!.value).toBe(undefined)
  })

  it('forces initial values to a float on number inputs by default', () => {
    const id = `a${token()}`

    renderWithFormKit(
      createElement(FormKit as any, {
        id,
        type: 'number',
        number: true,
        value: '123.123',
      }),
      defaultConfig()
    )

    expect(getNode(id)!.value).toBe(123.123)
  })

  it('forces initial values to an integer when number is integer', async () => {
    const id = `a${token()}`

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        id,
        type: 'text',
        number: 'integer',
        delay: 0,
      }),
      defaultConfig()
    )

    fireEvent.input(container.querySelector('input') as HTMLInputElement, {
      target: { value: '12345.22abcdef' },
    })

    await waitFor(() => {
      expect(getNode(id)!.value).toBe(12345)
    })
  })

  it('knows when it is mounted', async () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'text',
        help: 'what happens next?',
        sectionsSchema: {
          help: {
            children: '$didMount && "Mounted" || "Not mounted"',
          },
        },
      }),
      defaultConfig()
    )

    await waitFor(() => {
      expect(container.querySelector('.formkit-help')?.textContent).toBe('Mounted')
    })
  })
})
