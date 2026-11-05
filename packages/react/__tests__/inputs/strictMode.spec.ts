import { FormKitNode, getNode } from '@formkit/core'
import { token } from '@formkit/utils'
import { createElement, StrictMode } from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormKit, FormKitProvider, defaultConfig } from '../../src'

/**
 * Regression coverage for #1776: under React StrictMode every <FormKit>
 * created its node twice, leaving an orphaned duplicate attached to the parent
 * and making valid forms fail submission.
 */
describe('React StrictMode (#1776)', () => {
  for (const strict of [false, true]) {
    const mode = strict ? 'strict' : 'non-strict'
    const mount = (tree: any, config = defaultConfig()) => {
      const provided = createElement(FormKitProvider, { config }, tree)
      return render(strict ? createElement(StrictMode, null, provided) : provided)
    }

    it(`submits a valid form whose value comes from the form (${mode})`, async () => {
      const onSubmit = vi.fn()
      const onSubmitInvalid = vi.fn()
      const { container } = mount(
        createElement(
          FormKit as any,
          { type: 'form', value: { name: 'abc' }, onSubmit, onSubmitInvalid },
          createElement(FormKit as any, {
            type: 'text',
            name: 'name',
            validation: 'required',
          })
        )
      )
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
      expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'abc' })
      expect(onSubmitInvalid).not.toHaveBeenCalled()
      expect(container.textContent).not.toContain('not all fields')
    })

    it(`creates exactly one node per component (${mode})`, async () => {
      const created: FormKitNode[] = []
      const id = `form_${token()}`
      mount(
        createElement(
          FormKit as any,
          { type: 'form', id },
          createElement(
            FormKit as any,
            { type: 'group', name: 'address' },
            createElement(FormKit as any, { type: 'text', name: 'street', value: '1 Main' })
          ),
          createElement(
            FormKit as any,
            { type: 'list', name: 'tags', value: ['a', 'b'] },
            createElement(FormKit as any, { type: 'text' }),
            createElement(FormKit as any, { type: 'text' })
          )
        ),
        defaultConfig({ plugins: [(node) => void created.push(node)] })
      )
      await new Promise((r) => setTimeout(r, 20))
      const form = getNode(id)!
      // form, group, street, list, 2 list items (submit button excluded).
      // Count the nodes that ended up in the tree: React 18 StrictMode renders
      // twice with fresh hooks, and its throwaway render's (detached) nodes
      // must never join the form (#1784).
      const inTree = new Set<FormKitNode>([form])
      form.walk((n) => inTree.add(n))
      expect(created.filter((n) => inTree.has(n) && n.props.type !== 'submit').length).toBe(6)
      expect(created.filter((n) => !inTree.has(n) && n.parent).length).toBe(0)
      expect(form.children.length).toBe(2)
      expect(form.value).toEqual({ address: { street: '1 Main' }, tags: ['a', 'b'] })
    })
  }
})
