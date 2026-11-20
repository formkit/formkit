import { getNode } from '@formkit/core'
import { defaultConfig, plugin, FormKit } from '@formkit/vue'
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import {
  createWebMCPPlugin,
  webMCPTextResult,
  type FormKitWebMCPOptions,
  type FormKitWebMCPTool,
} from '../src/plugins/webMCP'

/**
 * A fake model context. `shape: 'handle'` returns `{ unregister() }` from
 * registerTool; `shape: 'method'` exposes `unregisterTool(name)` instead.
 */
function fakeModelContext(shape: 'handle' | 'method' = 'handle') {
  const tools = new Map<string, FormKitWebMCPTool>()
  const signals = new Map<string, AbortSignal>()
  const context: any = {
    tools,
    signals,
    registerTool: vi.fn(
      (tool: FormKitWebMCPTool, opts?: { signal?: AbortSignal }) => {
        if (tools.has(tool.name)) throw new Error(`duplicate ${tool.name}`)
        tools.set(tool.name, tool)
        if (opts?.signal) signals.set(tool.name, opts.signal)
        if (shape === 'handle') {
          return { unregister: () => tools.delete(tool.name) }
        }
        return undefined
      }
    ),
  }
  if (shape === 'method') {
    context.unregisterTool = vi.fn((name: string) => tools.delete(name))
  }
  return context as {
    tools: Map<string, FormKitWebMCPTool>
    signals: Map<string, AbortSignal>
    registerTool: ReturnType<typeof vi.fn>
    unregisterTool?: ReturnType<typeof vi.fn>
  }
}

function withPlugin(options: FormKitWebMCPOptions) {
  return {
    global: {
      plugins: [
        [plugin, defaultConfig({ plugins: [createWebMCPPlugin(options)] })],
      ],
    },
  } as any
}

function signupForm(
  props: Record<string, unknown> = {},
  onSubmit: (...args: any[]) => any = vi.fn()
) {
  return {
    render: () =>
      h(
        FormKit,
        { type: 'form', id: 'sign-Up.Form', onSubmit, actions: false, ...props },
        () => [
          h(FormKit, {
            type: 'email',
            name: 'email',
            label: 'Email',
            help: 'Work address',
            validation: 'required|email',
          }),
          h(FormKit, {
            type: 'password',
            name: 'password',
            label: 'Password',
            value: 'hunter2',
          }),
          h(FormKit, { type: 'hidden', name: 'csrf', value: 'secret' }),
          h(FormKit, {
            type: 'select',
            name: 'plan',
            label: 'Plan',
            options: [
              { label: 'Free', value: 'free' },
              { label: 'Pro', value: 'pro' },
            ],
          }),
          h(FormKit, {
            type: 'checkbox',
            name: 'tags',
            options: ['a', 'b'],
          }),
          h(FormKit, { type: 'checkbox', name: 'terms', label: 'Terms' }),
          h(FormKit, { type: 'number', name: 'age', number: true }),
          h(FormKit, { type: 'text', name: 'locked', disabled: true }),
          h(FormKit, { type: 'group', name: 'address' }, () => [
            h(FormKit, { type: 'text', name: 'city', label: 'City' }),
          ]),
        ]
      ),
  }
}

const ID = 'sign_up_form'

afterEach(() => {
  delete (globalThis.navigator as any).modelContext
})

describe('createWebMCPPlugin', () => {
  it('registers describe and fill tools for a form, with sanitized names', async () => {
    const mc = fakeModelContext()
    mount(signupForm(), withPlugin({ modelContext: mc as any }))
    await flushPromises()
    expect([...mc.tools.keys()].sort()).toEqual([
      `formkit_describe_${ID}`,
      `formkit_fill_${ID}`,
    ])
    const fill = mc.tools.get(`formkit_fill_${ID}`)!
    expect(fill.description).toContain('form')
    expect(fill.inputSchema.type).toBe('object')
    // Registered once even though children are added after creation.
    expect(mc.registerTool).toHaveBeenCalledTimes(2)
  })

  it('includes the form label or name in tool descriptions', async () => {
    const mc = fakeModelContext()
    mount(
      signupForm({ name: 'signup' }),
      withPlugin({ modelContext: mc as any })
    )
    await flushPromises()
    expect(mc.tools.get(`formkit_describe_${ID}`)!.description).toContain(
      '"signup" form'
    )
  })

  it('does not register tools for non-form nodes', async () => {
    const mc = fakeModelContext()
    mount(
      {
        render: () =>
          h(FormKit, { type: 'group', id: 'grp' }, () => [
            h(FormKit, { type: 'text', name: 'a', id: 'txt' }),
          ]),
      },
      withPlugin({ modelContext: mc as any })
    )
    await flushPromises()
    expect(mc.registerTool).not.toHaveBeenCalled()
  })

  it('skips forms opted out by data-agent="off" or the forms option', async () => {
    const mc = fakeModelContext()
    mount(
      {
        render: () => [
          h(FormKit, { type: 'form', id: 'off', 'data-agent': 'off' }),
          h(FormKit, { type: 'form', id: 'filtered' }),
          h(FormKit, { type: 'form', id: 'kept' }),
        ],
      },
      withPlugin({
        modelContext: mc as any,
        forms: (node) => node.props.id !== 'filtered',
      })
    )
    await flushPromises()
    expect([...mc.tools.keys()].sort()).toEqual([
      'formkit_describe_kept',
      'formkit_fill_kept',
    ])
  })

  it('is a no-op without a model context', async () => {
    expect(() => mount(signupForm(), withPlugin({}))).not.toThrow()
    await flushPromises()
    expect(getNode('sign-Up.Form')).toBeTruthy()
  })

  it('uses navigator.modelContext when no modelContext option is given', async () => {
    const mc = fakeModelContext()
    ;(globalThis.navigator as any).modelContext = mc
    mount(signupForm(), withPlugin({}))
    await flushPromises()
    expect(mc.tools.has(`formkit_fill_${ID}`)).toBe(true)
  })

  it('generates a fill inputSchema from the form fields', async () => {
    const mc = fakeModelContext()
    mount(signupForm(), withPlugin({ modelContext: mc as any }))
    await flushPromises()
    const schema = mc.tools.get(`formkit_fill_${ID}`)!.inputSchema as any
    expect(schema.required).toEqual(['values'])
    expect(schema.properties.strict).toEqual(
      expect.objectContaining({ type: 'boolean' })
    )
    const props = schema.properties.values.properties
    expect(Object.keys(props).sort()).toEqual([
      'address.city',
      'age',
      'email',
      'plan',
      'tags',
      'terms',
    ])
    expect(props.email).toEqual({
      type: 'string',
      format: 'email',
      description: 'Email Work address Required. Rules: email.',
    })
    expect(props.plan).toEqual(
      expect.objectContaining({ type: 'string', enum: ['free', 'pro'] })
    )
    expect(props.plan.description).toContain('Pro = "pro"')
    expect(props.tags).toEqual({
      type: 'array',
      items: { type: 'string', enum: ['a', 'b'] },
    })
    expect(props.terms).toEqual({ type: 'boolean', description: 'Terms' })
    expect(props.age).toEqual({ type: 'number' })
    expect(props['address.city']).toEqual({ type: 'string', description: 'City' })
    expect(JSON.parse(JSON.stringify(schema))).toEqual(schema)
  })

  it('fill writes values and returns the fillForm result', async () => {
    const mc = fakeModelContext()
    mount(signupForm(), withPlugin({ modelContext: mc as any }))
    await flushPromises()
    const fill = mc.tools.get(`formkit_fill_${ID}`)!
    const result: any = await fill.execute({
      values: { email: 'ada@example.com', plan: 'Pro', 'address.city': 'Lisbon' },
    })
    const form = getNode('sign-Up.Form')!
    expect(form.value).toEqual(
      expect.objectContaining({
        email: 'ada@example.com',
        plan: 'pro',
        address: { city: 'Lisbon' },
      })
    )
    expect(result.valid).toBe(true)
    expect(result.fields.map((f: any) => f.address)).toEqual([
      'email',
      'plan',
      'address.city',
    ])
    expect(JSON.parse(JSON.stringify(result))).toEqual(result)
  })

  it('fill returns an error object in strict mode instead of throwing', async () => {
    const mc = fakeModelContext()
    mount(signupForm(), withPlugin({ modelContext: mc as any }))
    await flushPromises()
    const fill = mc.tools.get(`formkit_fill_${ID}`)!
    const result: any = await fill.execute({
      values: { email: 'ada@example.com', nope: 1 },
      strict: true,
    })
    expect(result.error).toContain('nope')
    expect(getNode('sign-Up.Form')!.value).toEqual(
      expect.objectContaining({ email: undefined })
    )
    expect(await fill.execute({ values: 'bad' } as any)).toEqual({
      error: '`values` must be an object.',
    })
  })

  it('excludes and refuses password inputs unless sensitive: true', async () => {
    const mc = fakeModelContext()
    mount(signupForm(), withPlugin({ modelContext: mc as any }))
    await flushPromises()
    const fill = mc.tools.get(`formkit_fill_${ID}`)!
    const refused: any = await fill.execute({
      values: { email: 'ada@example.com', password: 'stolen' },
    })
    expect(refused.error).toContain('password')
    expect(getNode('sign-Up.Form')!.value).toEqual(
      expect.objectContaining({ password: 'hunter2', email: undefined })
    )

    const mc2 = fakeModelContext()
    mount(
      signupForm({ id: 'sens' }),
      withPlugin({ modelContext: mc2 as any, sensitive: true })
    )
    await flushPromises()
    const sensitiveFill = mc2.tools.get('formkit_fill_sens')!
    expect(
      (sensitiveFill.inputSchema as any).properties.values.properties.password
    ).toEqual({ type: 'string', description: 'Password' })
    const result: any = await sensitiveFill.execute({
      values: { password: 'correct-horse', csrf: 'forged' },
    })
    // Hidden inputs stay locked even with sensitive: true.
    expect(result.error).toContain('csrf')
    const ok: any = await sensitiveFill.execute({
      values: { password: 'correct-horse' },
    })
    expect(ok.fields.map((f: any) => f.address)).toEqual(['password'])
    expect(getNode('sens')!.value).toEqual(
      expect.objectContaining({ password: 'correct-horse' })
    )
    // Values are still never described.
    const described = JSON.stringify(
      await mc2.tools.get('formkit_describe_sens')!.execute()
    )
    expect(described).not.toContain('correct-horse')
  })

  it('does literally nothing per form without a model context', async () => {
    // A proxy node that records every property access: without WebMCP the
    // plugin may only read props.type (and must not add listeners or
    // describe the form).
    const accessed: PropertyKey[] = []
    const on = vi.fn()
    const node = new Proxy(
      { props: { type: 'form', id: 'zero' }, on, children: [] } as any,
      {
        get(target, key) {
          accessed.push(key)
          return target[key]
        },
      }
    )
    createWebMCPPlugin()(node)
    createWebMCPPlugin({ values: true, submit: true })(node)
    await flushPromises()
    expect(on).not.toHaveBeenCalled()
    expect(accessed).toEqual(['props', 'props'])
  })

  it('fill refuses to write hidden inputs', async () => {
    const mc = fakeModelContext()
    mount(signupForm(), withPlugin({ modelContext: mc as any }))
    await flushPromises()
    const fill = mc.tools.get(`formkit_fill_${ID}`)!
    const result: any = await fill.execute({
      values: { email: 'ada@example.com', csrf: 'forged' },
    })
    expect(result.error).toContain('csrf')
    const form = getNode('sign-Up.Form')!
    expect(form.value).toEqual(
      expect.objectContaining({ csrf: 'secret', email: undefined })
    )
  })

  it('accepts JSON string arguments', async () => {
    const mc = fakeModelContext()
    mount(signupForm(), withPlugin({ modelContext: mc as any }))
    await flushPromises()
    const result: any = await mc.tools
      .get(`formkit_fill_${ID}`)!
      .execute(JSON.stringify({ values: { email: 'a@b.co' } }))
    expect(result.fields[0].address).toBe('email')
  })

  it('describe hides values by default and redacts passwords when values are on', async () => {
    const mc = fakeModelContext()
    mount(signupForm(), withPlugin({ modelContext: mc as any }))
    await flushPromises()
    const result: any = await mc.tools.get(`formkit_describe_${ID}`)!.execute()
    expect(result.type).toBe('form')
    expect(JSON.stringify(result)).not.toContain('hunter2')
    expect(result.children.every((c: any) => !('value' in c))).toBe(true)

    const mc2 = fakeModelContext()
    mount(
      signupForm({ id: 'second' }),
      withPlugin({ modelContext: mc2 as any, values: true })
    )
    await flushPromises()
    const withValues: any = await mc2.tools
      .get('formkit_describe_second')!
      .execute()
    const text = JSON.stringify(withValues)
    expect(text).not.toContain('hunter2')
    expect(text).not.toContain('secret')
    const password = withValues.children.find((c: any) => c.name === 'password')
    expect(password.redacted).toBe(true)
  })

  it('has no submit tool by default; submit runs the submit handler when enabled', async () => {
    const mc = fakeModelContext()
    const onSubmit = vi.fn()
    mount(
      signupForm({}, onSubmit),
      withPlugin({ modelContext: mc as any, submit: true })
    )
    await flushPromises()
    const submit = mc.tools.get(`formkit_submit_${ID}`)!
    expect(submit).toBeTruthy()
    expect(submit.annotations?.consequentialHint).toBe(true)

    // Invalid: email is required, so onSubmit does not run.
    const invalid: any = await submit.execute()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(invalid.valid).toBe(false)
    expect(invalid.submitted).toBe(false)
    expect(invalid.errors.map((e: any) => e.address)).toContain('email')

    await mc.tools
      .get(`formkit_fill_${ID}`)!
      .execute({ values: { email: 'ada@example.com' } })
    const ok: any = await submit.execute()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(ok).toEqual({ valid: true, errors: [], submitted: true })

    const mc2 = fakeModelContext()
    mount(signupForm({ id: 'nosubmit' }), withPlugin({ modelContext: mc2 as any }))
    await flushPromises()
    expect(mc2.tools.has('formkit_submit_nosubmit')).toBe(false)
  })

  it('wraps results with wrapResult', async () => {
    const mc = fakeModelContext()
    mount(
      signupForm(),
      withPlugin({ modelContext: mc as any, wrapResult: webMCPTextResult })
    )
    await flushPromises()
    const result: any = await mc.tools.get(`formkit_describe_${ID}`)!.execute()
    expect(result.content[0].type).toBe('text')
    expect(JSON.parse(result.content[0].text).type).toBe('form')
  })

  it.each(['handle', 'method'] as const)(
    'unregisters tools on unmount (%s API shape)',
    async (shape) => {
      const mc = fakeModelContext(shape)
      const wrapper = mount(
        signupForm(),
        withPlugin({ modelContext: mc as any, submit: true })
      )
      await flushPromises()
      expect(mc.tools.size).toBe(3)
      const signals = [...mc.signals.values()]
      wrapper.unmount()
      await flushPromises()
      expect(mc.tools.size).toBe(0)
      expect(signals.every((signal) => signal.aborted)).toBe(true)
      if (shape === 'method') {
        expect(mc.unregisterTool).toHaveBeenCalledTimes(3)
      }
    }
  )

  it('supports async registerTool and AbortSignal-only unregistration', async () => {
    const tools = new Map<string, FormKitWebMCPTool>()
    const mc = {
      registerTool: async (
        tool: FormKitWebMCPTool,
        opts?: { signal?: AbortSignal }
      ) => {
        tools.set(tool.name, tool)
        opts?.signal?.addEventListener('abort', () => tools.delete(tool.name))
      },
    }
    const wrapper = mount(signupForm(), withPlugin({ modelContext: mc }))
    await flushPromises()
    expect(tools.size).toBe(2)
    wrapper.unmount()
    expect(tools.size).toBe(0)
  })

  it('re-registers the fill tool when fields change', async () => {
    const mc = fakeModelContext()
    const show = ref(false)
    mount(
      {
        render: () =>
          h(FormKit, { type: 'form', id: 'dyn' }, () => [
            h(FormKit, { type: 'text', name: 'a' }),
            show.value ? h(FormKit, { type: 'text', name: 'b' }) : null,
          ]),
      },
      withPlugin({ modelContext: mc as any })
    )
    await flushPromises()
    const before = mc.tools.get('formkit_fill_dyn')!.inputSchema as any
    expect(Object.keys(before.properties.values.properties)).toEqual(['a'])
    show.value = true
    await nextTick()
    await flushPromises()
    const after = mc.tools.get('formkit_fill_dyn')!.inputSchema as any
    expect(Object.keys(after.properties.values.properties)).toEqual(['a', 'b'])
  })
})
