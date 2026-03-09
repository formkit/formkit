import { FormKitNode, getNode } from '@formkit/core'
import { token } from '@formkit/utils'
import { createElement } from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormKit, defaultConfig } from '../../src'
import { renderWithFormKit } from '../helpers'

describe('form structure (react)', () => {
  it('renders a form with a submit button', () => {
    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'form',
          name: 'test_form',
          id: 'foo',
          submitAttrs: {
            id: 'button',
          },
        },
        createElement('h1', null, 'in the form')
      ),
      defaultConfig()
    )

    expect(container.querySelector('form#foo')).toBeTruthy()
    expect(container.querySelector('button#button')).toBeTruthy()
    expect(container.textContent).toContain('in the form')
  })

  it('outputs the id of the form', () => {
    const id = token()

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'form',
        id,
      }),
      defaultConfig()
    )

    expect(container.querySelector('form')?.getAttribute('id')).toBe(id)
  })
})

describe('form submission (react)', () => {
  it('does not submit when form has errors', async () => {
    const submitHandler = vi.fn()

    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'form',
          onSubmit: submitHandler,
        },
        createElement(FormKit as any, {
          validation: 'required|email',
        })
      ),
      defaultConfig()
    )

    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    await new Promise((r) => setTimeout(r, 5))
    expect(submitHandler).not.toHaveBeenCalled()
  })

  it('calls submit when form has no errors', async () => {
    const submitHandler = vi.fn()

    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'form',
          onSubmit: submitHandler,
        },
        createElement(FormKit as any, {
          validation: 'required|email',
          value: 'foo@bar.com',
          id: 'foo',
        })
      ),
      defaultConfig()
    )

    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1)
    })
  })

  it('sets submitted state when submitted', async () => {
    const submitHandler = vi.fn()

    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'form',
          id: 'form',
          onSubmit: submitHandler,
        },
        createElement(FormKit as any, {
          id: 'email',
          validation: 'required|email',
        })
      ),
      defaultConfig()
    )

    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    await new Promise((r) => setTimeout(r, 10))

    const node = getNode('email')
    const form = getNode('form')

    expect(node?.context?.state?.submitted).toBe(true)
    expect(form?.context?.state?.submitted).toBe(true)
    expect(container.querySelector('.formkit-message')).toBeTruthy()
  })

  it('fires submit-raw even with validation errors', async () => {
    const submitHandler = vi.fn()
    const rawHandler = vi.fn()

    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'form',
          id: 'login',
          onSubmitRaw: rawHandler,
          onSubmit: submitHandler,
        },
        createElement(FormKit as any, {
          validation: 'required|email',
        })
      ),
      defaultConfig()
    )

    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    await new Promise((r) => setTimeout(r, 10))

    expect(submitHandler).not.toHaveBeenCalled()
    expect(rawHandler).toHaveBeenCalledTimes(1)
  })

  it('sets loading state if handler is async', async () => {
    const submitHandler = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 20)
        })
    )

    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'form',
          id: 'form',
          onSubmit: submitHandler,
        },
        createElement(FormKit as any, {
          name: 'email',
        })
      ),
      defaultConfig()
    )

    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(getNode('form')?.context?.state?.loading).toBe(true)
    })

    await waitFor(() => {
      expect(getNode('form')?.context?.state?.loading).toBe(undefined)
    })
  })

  it('does not register submit button as value', async () => {
    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'form',
          id: 'submitButtonForm',
          onSubmit: () => undefined,
        },
        createElement(FormKit as any, {
          validation: 'email',
          name: 'email',
          value: 'foo@bar.com',
        }),
        createElement(FormKit as any, {
          validation: 'required',
          name: 'country',
          value: 'de',
          type: 'select',
          options: { us: 'usa', de: 'germany' },
        })
      ),
      defaultConfig()
    )

    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    await new Promise((r) => setTimeout(r, 5))
    expect(getNode('submitButtonForm')?.value).toStrictEqual({
      email: 'foo@bar.com',
      country: 'de',
    })
  })

  it('allows adding an attribute to submit button', () => {
    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'form',
          id: 'submitButtonForm',
          onSubmit: () => undefined,
          submitAttrs: { 'data-foo': 'bar bar' },
        },
        'Content'
      ),
      defaultConfig()
    )

    expect(container.querySelector('button[data-foo="bar bar"]')).toBeTruthy()
  })

  it('can disable all inputs in a form', () => {
    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'form',
          disabled: true,
        },
        createElement(FormKit as any, { id: 'disabledEmail', type: 'email' }),
        createElement(FormKit as any, { id: 'disabledSelect', type: 'select' })
      ),
      defaultConfig()
    )

    expect(container.querySelector('[data-disabled] input[disabled]')).toBeTruthy()
    expect(container.querySelector('[data-disabled] select[disabled]')).toBeTruthy()
  })

  it('can reset form on submit via node.reset', async () => {
    const submit = vi.fn(async (data: any, node: FormKitNode) => {
      await new Promise((r) => setTimeout(r, 5))
      node.reset(data)
    })

    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'form',
          id: 'reset-form',
          onSubmit: submit,
          value: { users: ['Foobar', 'Biz baz'] },
        },
        createElement(
          FormKit as any,
          {
            type: 'list',
            name: 'users',
            dynamic: true,
          },
          createElement(FormKit as any, {
            type: 'text',
            name: 'name',
            index: 0,
          }),
          createElement(FormKit as any, {
            type: 'text',
            name: 'name',
            index: 1,
          })
        )
      ),
      defaultConfig()
    )

    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(submit).toHaveBeenCalledTimes(1)
    })
  })
})
