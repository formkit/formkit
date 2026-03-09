import { createElement, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { waitFor } from '@testing-library/react'
import { token } from '@formkit/utils'
import type { FormKitNode } from '@formkit/core'
import {
  FormKit,
  defaultConfig,
  useFormKitNodeById,
} from '../src/index'
import { renderWithFormKit } from './helpers'

function ChildComponent() {
  return createElement(
    'div',
    null,
    createElement(FormKit as any, { name: 'child', value: 'initial-value' })
  )
}

describe('useFormKitNodeById (react)', () => {
  it('fetches the value outside the form', async () => {
    const a = `a${token()}`
    const b = `b${token()}`

    function Host() {
      const [sum, setSum] = useState(0)
      const add = (node: FormKitNode<string>) => {
        setSum((current) => current + Number(node.value))
      }

      useFormKitNodeById<string>(a, add)
      useFormKitNodeById<string>(b, add)

      return createElement(
        'div',
        null,
        createElement('pre', { id: 'sum' }, String(sum)),
        createElement(
          FormKit as any,
          { type: 'form' },
          createElement(FormKit as any, { type: 'text', id: a, value: '3' }),
          createElement(FormKit as any, { type: 'text', id: b, value: '5' }),
          createElement(ChildComponent)
        )
      )
    }

    const { container } = renderWithFormKit(createElement(Host), defaultConfig())

    await waitFor(() => {
      expect(container.querySelector('#sum')?.textContent).toBe('8')
    })
  })
})
