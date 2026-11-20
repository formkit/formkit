import { getNode } from '@formkit/core'
import { createElement } from 'react'
import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormKit, defaultConfig } from '../src'
import {
  createWebMCPPlugin,
  type FormKitWebMCPTool,
} from '../../addons/src/plugins/webMCP'
import { renderWithFormKit } from './helpers'

function fakeModelContext() {
  const tools = new Map<string, FormKitWebMCPTool>()
  return {
    tools,
    registerTool: vi.fn((tool: FormKitWebMCPTool) => {
      if (tools.has(tool.name)) throw new Error(`duplicate ${tool.name}`)
      tools.set(tool.name, tool)
      return { unregister: () => tools.delete(tool.name) }
    }),
  }
}

describe('createWebMCPPlugin (react)', () => {
  it('registers tools for a form, fills it, submits it, and unregisters on unmount', async () => {
    const mc = fakeModelContext()
    const onSubmit = vi.fn()
    const { unmount } = renderWithFormKit(
      createElement(
        FormKit as any,
        { type: 'form', id: 'react-signup', onSubmit, actions: false },
        createElement(FormKit as any, {
          type: 'email',
          name: 'email',
          label: 'Email',
          validation: 'required|email',
        }),
        createElement(FormKit as any, {
          type: 'select',
          name: 'plan',
          options: [
            { label: 'Free', value: 'free' },
            { label: 'Pro', value: 'pro' },
          ],
        })
      ),
      defaultConfig({
        plugins: [createWebMCPPlugin({ modelContext: mc, submit: true })],
      })
    )

    await waitFor(() => {
      expect([...mc.tools.keys()].sort()).toEqual([
        'formkit_describe_react_signup',
        'formkit_fill_react_signup',
        'formkit_submit_react_signup',
      ])
    })
    await waitFor(() => {
      const schema = mc.tools.get('formkit_fill_react_signup')!.inputSchema as any
      expect(Object.keys(schema.properties.values.properties)).toEqual([
        'email',
        'plan',
      ])
      expect(schema.properties.values.properties.plan.enum).toEqual([
        'free',
        'pro',
      ])
    })

    const result: any = await mc.tools
      .get('formkit_fill_react_signup')!
      .execute({ values: { email: 'ada@example.com', plan: 'Pro' } })
    expect(result.valid).toBe(true)
    expect(result.fields.map((f: any) => f.address)).toEqual(['email', 'plan'])
    expect(getNode('react-signup')!.value).toEqual({
      email: 'ada@example.com',
      plan: 'pro',
    })

    const submitted: any = await mc.tools
      .get('formkit_submit_react_signup')!
      .execute()
    expect(submitted).toEqual({ valid: true, errors: [], submitted: true })
    expect(onSubmit).toHaveBeenCalledTimes(1)

    unmount()
    await waitFor(() => expect(mc.tools.size).toBe(0))
  })
})
