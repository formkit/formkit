import { createElement, createRef } from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FormKitNode } from '@formkit/core'
import { FormKit } from '../src'
import { renderWithFormKit } from './helpers'

describe('section refs (react, #200)', () => {
  it('exposes section DOM elements on node.context.refs', async () => {
    const nodeRef = createRef<FormKitNode>()
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        ref: nodeRef,
        type: 'text',
        name: 'name',
        label: 'Name',
        help: 'Your name',
        delay: 0,
      })
    )
    await waitFor(() => expect(nodeRef.current?.context?.refs?.input).toBeTruthy())
    const refs = nodeRef.current!.context!.refs!
    expect(refs.input).toBe(screen.getByLabelText('Name'))
    expect(refs.label).toBe(container.querySelector('label'))
    expect(refs.outer).toBe(container.querySelector('.formkit-outer'))
    expect(refs.help).toBe(container.querySelector('.formkit-help'))
    ;(refs.input as HTMLInputElement).focus()
    expect(document.activeElement).toBe(refs.input)
    // The managed input still works with the merged ref.
    fireEvent.input(refs.input as HTMLInputElement, { target: { value: 'hi' } })
    await waitFor(() => expect(nodeRef.current!.value).toBe('hi'))
  })

  it('keeps refs per instance and skips repeated (looped) sections', async () => {
    const a = createRef<FormKitNode>()
    const b = createRef<FormKitNode>()
    renderWithFormKit(
      createElement('div', null, [
        createElement(FormKit as any, { key: 'a', ref: a, type: 'text', name: 'a', label: 'A' }),
        createElement(FormKit as any, {
          key: 'b',
          ref: b,
          type: 'checkbox',
          name: 'b',
          options: ['x', 'y'],
        }),
      ])
    )
    await waitFor(() => expect(b.current?.context?.refs?.options).toBeTruthy())
    expect(a.current!.context!.refs!.input).toBe(screen.getByLabelText('A'))
    expect(b.current!.context!.refs!.input).toBe(undefined)
  })
})
