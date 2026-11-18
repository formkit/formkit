import { createElement, useState } from 'react'
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FormKitNode } from '@formkit/core'
import { FormKit } from '../src'
import { FormKitMessages } from '../src/FormKitMessages'
import { FormKitProvider } from '../src/FormKitProvider'
import { defaultConfig } from '../src/defaultConfig'

describe('FormKitMessages (react)', () => {
  it('renders message ids that match the input aria-describedby', async () => {
    function App() {
      const [node, setNode] = useState<FormKitNode>()
      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          id: 'msgId',
          type: 'text',
          validation: 'required',
          validationVisibility: 'live',
          onNode: (n: FormKitNode) => setNode(() => n),
        }),
        node ? createElement(FormKitMessages, { node }) : null,
      )
    }
    const { container } = render(
      createElement(
        FormKitProvider,
        { config: defaultConfig() },
        createElement(App),
      ),
    )
    await waitFor(() => {
      const input = container.querySelector('#msgId')!
      const described = input.getAttribute('aria-describedby')
      expect(described).toBe('msgId-rule_required')
      expect(
        container.querySelector(`[id="${described}"]`)?.textContent,
      ).toContain('required')
    })
    expect(container.innerHTML).not.toContain('id="undefined-')
  })
})
