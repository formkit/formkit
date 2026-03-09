import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { FormKit, defaultConfig, useFormKitContext } from '../src/index'
import { renderWithFormKit } from './helpers'

function ChildComponent(props: { address?: string }) {
  const ctx = useFormKitContext<any>(props.address)
  return createElement(
    'div',
    null,
    createElement('p', { id: 'inner-target' }, JSON.stringify(ctx?.value)),
    createElement(FormKit as any, { name: 'child', value: 'initial-value' })
  )
}

describe('useFormKitContext (react)', () => {
  it('renders the child value inside the form', async () => {
    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        { type: 'form' },
        createElement(FormKit as any, {
          type: 'text',
          name: 'name',
          value: 'Mr. FormKit',
        }),
        createElement(ChildComponent)
      ),
      defaultConfig()
    )

    await waitFor(() => {
      expect(container.querySelector('#inner-target')?.textContent).toContain(
        'Mr. FormKit'
      )
      expect(container.querySelector('#inner-target')?.textContent).toContain(
        'initial-value'
      )
    })
  })

  it('traverses to sibling and renders its value by address', async () => {
    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        { type: 'form' },
        createElement(ChildComponent, { address: 'child' }),
        createElement(FormKit as any, {
          type: 'text',
          name: 'name',
          value: 'Mr. FormKit',
        })
      ),
      defaultConfig()
    )

    await waitFor(() => {
      expect(container.querySelector('#inner-target')?.textContent).toContain(
        'initial-value'
      )
    })
  })

  it('calls the effect callback immediately when context is available', async () => {
    const effect = vi.fn()

    function ChildImmediate() {
      useFormKitContext(effect)
      return createElement(FormKit as any, {
        type: 'text',
        name: 'name',
        value: 'Mr. FormKit',
      })
    }

    renderWithFormKit(
      createElement(
        FormKit as any,
        { type: 'form' },
        createElement(ChildImmediate)
      ),
      defaultConfig()
    )

    await waitFor(() => {
      expect(effect).toHaveBeenCalled()
    })
  })

  it('calls the effect callback later when the context is available', async () => {
    const effect = vi.fn()

    function ChildLater() {
      useFormKitContext('later', effect)
      return createElement(FormKit as any, {
        type: 'text',
        name: 'name',
        value: 'Mr. FormKit',
      })
    }

    renderWithFormKit(
      createElement(
        FormKit as any,
        { type: 'form' },
        createElement(ChildLater),
        createElement(FormKit as any, {
          type: 'text',
          name: 'later',
          value: 'Mr. FormKit',
        })
      ),
      defaultConfig()
    )

    await waitFor(() => {
      expect(effect).toHaveBeenCalled()
    })
  })
})
