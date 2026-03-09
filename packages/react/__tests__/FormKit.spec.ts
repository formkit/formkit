import { createElement } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormKit } from '../src'
import { FormKitProvider } from '../src/FormKitProvider'
import { defaultConfig } from '../src/defaultConfig'

describe('FormKit (react)', () => {
  it('renders a text input and emits input updates', async () => {
    const onInput = vi.fn()

    const { container } = render(
      createElement(
        FormKitProvider,
        { config: defaultConfig() },
        createElement(FormKit as any, {
          type: 'text',
          name: 'email',
          label: 'Email',
          delay: 0,
          onInput,
        })
      )
    )

    const input = screen.getByLabelText('Email')
    fireEvent.input(input, { target: { value: 'hello@formkit.com' } })

    await waitFor(() => {
      expect(onInput).toHaveBeenCalled()
    })
  })

  it('does not warn about read-only controlled fields', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const { container } = render(
        createElement(
          FormKitProvider,
          { config: defaultConfig() },
          createElement(FormKit as any, {
            type: 'text',
            name: 'email',
            label: 'Email',
            value: 'hello@formkit.com',
          })
        )
      )

      await waitFor(() => {
        expect(container.querySelector('input[name="email"]')).toBeTruthy()
      })

      const readOnlyWarning = consoleError.mock.calls.some((call) =>
        call.some((arg) =>
          String(arg).includes(
            'You provided a `value` prop to a form field without an `onChange` handler.'
          )
        )
      )

      expect(readOnlyWarning).toBe(false)
    } finally {
      consoleError.mockRestore()
    }
  })

  it('submits a valid form without showing an incomplete message', async () => {
    const onSubmit = vi.fn()

    const { container } = render(
      createElement(
        FormKitProvider,
        { config: defaultConfig() },
        createElement(
          FormKit as any,
          {
            type: 'form',
            id: 'valid-submit-form',
            submitLabel: 'Submit',
            onSubmit,
          },
          createElement(FormKit as any, {
            type: 'text',
            name: 'email',
            label: 'Email',
            delay: 0,
            validation: 'required|email',
          }),
          createElement(FormKit as any, {
            type: 'select',
            name: 'country',
            label: 'Country',
            options: [
              { label: 'United States', value: 'US' },
              { label: 'Canada', value: 'CA' },
            ],
          })
        )
      )
    )

    const scope = within(container)

    fireEvent.input(scope.getByLabelText('Email'), {
      target: { value: 'hello@formkit.com' },
    })
    fireEvent.change(scope.getByLabelText('Country'), {
      target: { value: 'CA' },
    })
    fireEvent.click(scope.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })

    expect(scope.queryByText('Sorry, not all fields are filled out correctly.')).toBeNull()
  })
})
