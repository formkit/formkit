import { FormKitNode, getNode } from '@formkit/core'
import { token } from '@formkit/utils'
import * as React from 'react'
import {
  createElement,
  startTransition,
  Suspense,
  useState,
  type ReactElement,
} from 'react'
import { act, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormKit, defaultConfig } from '../../src'
import { UNCLAIMED_NODE_TTL } from '../../src/composables/nodeClaims'
import { renderWithFormKit } from '../helpers'

const isReact19 = Number(React.version.split('.')[0]) >= 19

/**
 * Discarded renders (Suspense retries, interrupted transitions) used to leave
 * "ghost" nodes attached to the parent form, which could block submission
 * forever, even in production (see #1776 review).
 */
describe('render lifecycle: discarded renders (#1776)', () => {
  it.runIf(isReact19)(
    'does not accumulate ghost nodes when a sibling suspends in a transition',
    async () => {
      const id = `form_${token()}`
      let resolve!: () => void
      const pending = new Promise<void>((r) => (resolve = r))
      let done = false
      pending.then(() => (done = true))
      const created: FormKitNode[] = []

      function Suspender(): ReactElement | null {
        if (!done) (React as any).use(pending)
        return null
      }

      let show!: () => void
      function Host() {
        const [visible, setVisible] = useState(false)
        show = () => startTransition(() => setVisible(true))
        return createElement(
          Suspense,
          { fallback: null },
          createElement(
            FormKit as any,
            { type: 'form', id, onSubmit: () => {} },
            visible
              ? [
                  createElement(FormKit as any, {
                    key: 'name',
                    type: 'text',
                    name: 'name',
                    value: 'abc',
                    validation: 'required',
                  }),
                  createElement(Suspender, { key: 'suspender' }),
                ]
              : null
          )
        )
      }

      renderWithFormKit(
        createElement(Host),
        defaultConfig({
          plugins: [
            (node) => {
              if (node.props.type === 'text') created.push(node)
            },
          ],
        })
      )
      await act(async () => show())
      await new Promise((r) => setTimeout(r, 100))
      // Re-renders of the same element must reuse the pending node.
      expect(created.length).toBeLessThanOrEqual(2)
      await act(async () => {
        resolve()
        await pending
      })
      await waitFor(() => expect(getNode(id)!.children.length).toBe(1))
      expect(getNode(id)!.value).toEqual({ name: 'abc' })
      expect(getNode(id)!.ledger.value('blocking')).toBe(0)
    }
  )

  it('destroys nodes from renders that never commit', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    try {
      const id = `form_${token()}`
      let suspend = true
      const never = new Promise<void>(() => {})
      function MaybeSuspend(): ReactElement | null {
        if (suspend) throw never
        return null
      }
      let setWithChild!: (v: boolean) => void
      function Host() {
        const [withChild, _set] = useState(false)
        setWithChild = _set
        return createElement(
          FormKit as any,
          { type: 'form', id },
          withChild
            ? createElement(
                Suspense,
                { fallback: null },
                createElement(FormKit as any, {
                  type: 'text',
                  name: 'ghost',
                }),
                createElement(MaybeSuspend)
              )
            : null
        )
      }
      renderWithFormKit(createElement(Host))
      const form = getNode(id)!
      await act(async () => setWithChild(true))
      // The suspended boundary never commits its children.
      await act(async () => {
        vi.advanceTimersByTime(UNCLAIMED_NODE_TTL + 50)
      })
      expect(form.children.map((c) => c.name)).not.toContain('ghost')
      suspend = false
    } finally {
      vi.useRealTimers()
    }
  })

  it.runIf(isReact19 && 'Activity' in React)(
    'recreates a usable node after an <Activity> hides and shows it',
    async () => {
      const id = `text_${token()}`
      const Activity = (React as any).Activity
      let setMode!: (m: 'visible' | 'hidden') => void
      function Host() {
        const [mode, _setMode] = useState<'visible' | 'hidden'>('visible')
        setMode = _setMode
        return createElement(
          Activity,
          { mode },
          createElement(FormKit as any, { type: 'text', id, value: 'abc' })
        )
      }
      const { container } = renderWithFormKit(createElement(Host))
      await waitFor(() => expect(getNode(id)?.value).toBe('abc'))
      await act(async () => setMode('hidden'))
      await new Promise((r) => setTimeout(r, 20))
      await act(async () => setMode('visible'))
      await waitFor(() => expect(getNode(id)?.context).toBeTruthy())
      const input = container.querySelector('input') as HTMLInputElement
      fireEvent.input(input, { target: { value: 'def' } })
      await waitFor(() => expect(getNode(id)?.value).toBe('def'))
    }
  )
})
