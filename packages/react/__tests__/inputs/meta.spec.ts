import { createElement } from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormKit, defaultConfig } from '../../src'
import { renderWithFormKit } from '../helpers'

describe('meta input (react)', () => {
  it('passes value through form submit', async () => {
    const submitHandler = vi.fn()
    const formData = {
      meta_input: {
        trainsPlainsAndArrays: [1, 2, 3],
      },
      text_input: 'Hello World',
    }

    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        {
          type: 'form',
          value: formData,
          id: 'form',
          onSubmit: submitHandler,
        },
        createElement(FormKit as any, { type: 'meta', name: 'meta_input' }),
        createElement(FormKit as any, { type: 'text', name: 'text_input' })
      ),
      defaultConfig()
    )

    await new Promise((r) => setTimeout(r, 15))
    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalled()
    })

    expect(submitHandler.mock.calls[0][0]).toEqual({
      meta_input: {
        trainsPlainsAndArrays: [1, 2, 3],
      },
      text_input: 'Hello World',
    })
  })
})
