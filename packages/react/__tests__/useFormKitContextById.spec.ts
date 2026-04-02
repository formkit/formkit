import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { waitFor } from '@testing-library/react'
import { token } from '@formkit/utils'
import {
  FormKit,
  defaultConfig,
  useFormKitContextById,
} from '../src/index'
import { renderWithFormKit } from './helpers'

function ChildComponent() {
  return createElement(
    'div',
    null,
    createElement(FormKit as any, { name: 'child', value: 'initial-value' })
  )
}

describe('useFormKitContextById (react)', () => {
  it('renders the value outside the form', async () => {
    const id = `a${token()}`

    function Host() {
      const ctx = useFormKitContextById(id)
      return createElement(
        'div',
        null,
        createElement('pre', { id: 'outer-target' }, JSON.stringify(ctx?.value)),
        createElement(
          FormKit as any,
          { type: 'form', id },
          createElement(FormKit as any, {
            type: 'text',
            name: 'name',
            value: 'Mr. FormKit',
          }),
          createElement(ChildComponent)
        )
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    await waitFor(() => {
      expect(container.querySelector('#outer-target')?.textContent).toContain(
        'Mr. FormKit'
      )
      expect(container.querySelector('#outer-target')?.textContent).toContain(
        'initial-value'
      )
    })
  })

  it('renders the value from inside the form', async () => {
    const id = `a${token()}`

    function Child() {
      const ctx = useFormKitContextById(id)
      return createElement(
        'div',
        { id: 'parent-value' },
        JSON.stringify(ctx?.value),
        createElement(FormKit as any, {
          name: 'child',
          value: 'initial-value',
        })
      )
    }

    function Host() {
      return createElement(
        FormKit as any,
        { type: 'form', id },
        createElement(FormKit as any, {
          type: 'text',
          name: 'name',
          value: 'Mrs. FormKit',
        }),
        createElement(Child)
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    await waitFor(() => {
      expect(container.querySelector('#parent-value')?.textContent).toContain(
        '"name":"Mrs. FormKit"'
      )
      expect(container.querySelector('#parent-value')?.textContent).toContain(
        '"child":"initial-value"'
      )
    })
  })
})
