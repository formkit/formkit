import { getNode } from '@formkit/core'
import { defaultConfig, plugin, FormKit } from '@formkit/vue'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { fillForm } from '../src/plugins/fillForm'

const global = { global: { plugins: [[plugin, defaultConfig]] } } as any

function mountSignup(onSubmit = vi.fn()) {
  mount(
    {
      render: () =>
        h(FormKit, { type: 'form', id: 'fill', onSubmit, actions: false }, () => [
          h(FormKit, { type: 'email', name: 'email', validation: 'required|email' }),
          h(FormKit, {
            type: 'select',
            name: 'plan',
            options: [
              { label: 'Free', value: 'free' },
              { label: 'Pro', value: 2 },
            ],
          }),
          h(FormKit, { type: 'checkbox', name: 'tags', options: ['a', 'b', 'c'] }),
          h(FormKit, { type: 'group', name: 'address' }, () => [
            h(FormKit, { type: 'text', name: 'city', validation: 'required' }),
          ]),
        ]),
    },
    global
  )
  return onSubmit
}

describe('fillForm', () => {
  it('fills by address and nested objects, resolving option labels', async () => {
    mountSignup()
    await flushPromises()
    const form = getNode('fill')!
    const result = await fillForm(form, {
      email: 'ada@example.com',
      plan: 'pro',
      tags: ['a', 'c'],
      address: { city: 'Lisbon' },
    })
    expect(form.value).toEqual({
      email: 'ada@example.com',
      plan: 2,
      tags: ['a', 'c'],
      address: { city: 'Lisbon' },
    })
    expect(result.valid).toBe(true)
    expect(result.unknown).toEqual([])
    expect(result.fields.map((f) => f.address)).toEqual([
      'email',
      'plan',
      'tags',
      'address.city',
    ])
    expect(JSON.parse(JSON.stringify(result))).toEqual(result)
  })

  it('reports invalid fields, unknown addresses, and supports dot addresses', async () => {
    mountSignup()
    await flushPromises()
    const result = await fillForm(getNode('fill')!, {
      email: 'not-an-email',
      'address.city': '',
      nope: 1,
    })
    expect(result.valid).toBe(false)
    expect(result.unknown).toEqual(['nope'])
    const email = result.fields.find((f) => f.address === 'email')!
    expect(email.valid).toBe(false)
    expect(email.errors.length).toBe(1)
    expect(result.fields.find((f) => f.address === 'address.city')!.valid).toBe(false)
  })

  it('throws on unknown addresses in strict mode', async () => {
    mountSignup()
    await flushPromises()
    await expect(
      fillForm(getNode('fill')!, { nope: 1 }, { strict: true })
    ).rejects.toThrow('nope')
  })

  it('submits through the form and reports whether it went through', async () => {
    const onSubmit = mountSignup()
    await flushPromises()
    const blocked = await fillForm(getNode('fill')!, { email: 'x' }, { submit: true })
    expect(blocked.submitted).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
    const ok = await fillForm(
      getNode('fill')!,
      { email: 'ada@example.com', address: { city: 'Lisbon' } },
      { submit: true }
    )
    expect(ok.submitted).toBe(true)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ email: 'ada@example.com' })
  })
})

describe('fillForm (review cases)', () => {
  const mountWith = (children: () => any[], formProps: Record<string, unknown> = {}) =>
    mount(
      { render: () => h(FormKit, { type: 'form', id: 'fill2', actions: false, ...formProps }, children) },
      global
    )

  it('does not write unmatched option labels, and reports them', async () => {
    mountWith(() => [h(FormKit, { type: 'select', name: 'plan', options: ['Free', 'Pro'] })])
    await flushPromises()
    const form = getNode('fill2')!
    const before = form.value as any
    const result = await fillForm(form, { plan: 'Enterprise' })
    expect(result.unmatched).toEqual([{ address: 'plan', reason: 'no-such-option' }])
    expect((form.value as any).plan).toBe(before.plan)
  })

  it('matches string-typed numbers, wraps scalars for multi-value inputs', async () => {
    mountWith(() => [
      h(FormKit, { type: 'select', name: 'n', options: [{ label: 'One', value: 1 }, { label: 'Two', value: 2 }] }),
      h(FormKit, { type: 'checkbox', name: 'c', options: ['a', 'b'] }),
    ])
    await flushPromises()
    const form = getNode('fill2')!
    await fillForm(form, { n: '2', c: 'a' })
    expect(form.value).toMatchObject({ n: 2, c: ['a'] })
  })

  it('strict mode throws before writing anything', async () => {
    mountWith(() => [h(FormKit, { type: 'text', name: 'a' })])
    await flushPromises()
    const form = getNode('fill2')!
    await expect(fillForm(form, { a: 'x', nope: 1 }, { strict: true })).rejects.toThrow('nope')
    expect((form.value as any).a).toBeUndefined()
  })

  it('does not escape the node via $parent/$root/find()', async () => {
    mountWith(() => [
      h(FormKit, { type: 'text', name: 'top' }),
      h(FormKit, { type: 'group', name: 'g' }, () => [h(FormKit, { type: 'text', name: 'inner' })]),
    ])
    await flushPromises()
    const group = getNode('fill2')!.at('g')!
    const result = await fillForm(group, { '$parent.top': 'x', '$root.top': 'y', 'find(inner)': 'z' })
    expect(result.unknown.sort()).toEqual(['$parent.top', '$root.top', 'find(inner)'].sort())
    expect((getNode('fill2')!.value as any).top).toBeUndefined()
  })

  it('skips disabled fields and non-inputs, reports form-wide invalid fields', async () => {
    mountWith(() => [
      h(FormKit, { type: 'text', name: 'a' }),
      h(FormKit, { type: 'text', name: 'locked', disabled: true }),
      h(FormKit, { type: 'text', name: 'req', validation: 'required' }),
      h(FormKit, { type: 'group', name: 'g' }, () => [h(FormKit, { type: 'text', name: 'x' })]),
    ])
    await flushPromises()
    const result = await fillForm(getNode('fill2')!, { a: 'ok', locked: 'x', g: null })
    expect(result.skipped).toEqual([
      { address: 'locked', reason: 'disabled' },
      { address: 'g', reason: 'not-an-input' },
    ])
    expect(result.valid).toBe(false)
    expect(result.invalid.map((i) => i.address)).toEqual(['req'])
  })

  it('fills existing list items by index and nested arrays', async () => {
    mountWith(() => [
      h(FormKit, { type: 'list', name: 'users' }, () => [
        h(FormKit, { type: 'group' }, () => [h(FormKit, { type: 'text', name: 'name' })]),
      ]),
    ])
    await flushPromises()
    const form = getNode('fill2')!
    const r1 = await fillForm(form, { users: [{ name: 'Ada' }] })
    expect(r1.fields.map((f) => f.address)).toEqual(['users.0.name'])
    const r2 = await fillForm(form, { 'users.0.name': 'Grace', 'users.5.name': 'x' })
    expect((form.value as any).users[0].name).toBe('Grace')
    expect(r2.unknown).toEqual(['users.5.name'])
  })

  it('times out instead of hanging on validation that never resolves', async () => {
    mountWith(() => [
      h(FormKit, {
        type: 'text',
        name: 'slow',
        validation: 'never',
        validationRules: { never: () => new Promise<boolean>(() => {}) },
      }),
    ])
    await flushPromises()
    const result = await fillForm(getNode('fill2')!, { slow: 'x' }, { timeout: 100 })
    expect(result.settled).toBe(false)
  })

  it('reports submit errors and setErrors instead of rejecting', async () => {
    mountWith(() => [h(FormKit, { type: 'text', name: 'email' })], {
      onSubmit: async (_data: any, node: any) => {
        node.setErrors(['Email taken'])
        throw new Error('Server said no')
      },
    })
    await flushPromises()
    const result = await fillForm(getNode('fill2')!, { email: 'a@b.co' }, { submit: true })
    expect(result.submitted).toBe(false)
    expect(result.submitError).toBe('Server said no')
    expect(result.errors).toContain('Email taken')
  })

  it('submitted is false when there is no onSubmit to run', async () => {
    mountWith(() => [h(FormKit, { type: 'text', name: 'a' })])
    await flushPromises()
    const result = await fillForm(getNode('fill2')!, { a: 'x' }, { submit: true })
    expect(result.submitted).toBe(false)
  })
})

describe('fillForm (final review cases)', () => {
  const mountWith = (children: () => any[], formProps: Record<string, unknown> = {}) =>
    mount(
      { render: () => h(FormKit, { type: 'form', id: 'fill3', actions: false, ...formProps }, children) },
      global
    )

  it('does not hang submitting when validation never settles', async () => {
    mountWith(() => [
      h(FormKit, {
        type: 'text',
        name: 'a',
        validation: 'never',
        validationRules: { never: () => new Promise<boolean>(() => {}) },
      }),
    ], { onSubmit: vi.fn() })
    await flushPromises()
    const result = await fillForm(getNode('fill3')!, { a: 'x' }, { submit: true, timeout: 100 })
    expect(result.settled).toBe(false)
    expect(result.submitted).toBe(false)
    expect(result.submitError).toMatch(/settle/)
  })

  it('does not hang when onSubmit never resolves', async () => {
    mountWith(() => [h(FormKit, { type: 'text', name: 'a' })], {
      onSubmit: () => new Promise(() => {}),
    })
    await flushPromises()
    const result = await fillForm(getNode('fill3')!, { a: 'x' }, { submit: true, timeout: 100 })
    expect(result.submitted).toBe(false)
    expect(result.submitError).toMatch(/finish/)
  })

  it('reports field-level server errors from setErrors after submit', async () => {
    mountWith(() => [h(FormKit, { type: 'email', name: 'email' })], {
      onSubmit: async (_data: any, node: any) => {
        node.setErrors([], { email: 'Email taken' })
      },
    })
    await flushPromises()
    const result = await fillForm(getNode('fill3')!, { email: 'a@b.co' }, { submit: true })
    expect(result.submitted).toBe(true)
    expect(result.valid).toBe(false)
    expect(result.invalid).toEqual([{ address: 'email', errors: ['Email taken'] }])
    expect(result.fields[0]).toEqual({ address: 'email', valid: false, errors: ['Email taken'] })
  })

  it('treats disabled: null as enabled and lets null clear an option input', async () => {
    mountWith(() => [
      h(FormKit, { type: 'text', name: 't', disabled: null }),
      h(FormKit, { type: 'radio', name: 'r', value: 'a', options: ['a', 'b'] }),
    ])
    await flushPromises()
    const form = getNode('fill3')!
    const result = await fillForm(form, { t: 'x', r: null })
    expect(result.skipped).toEqual([])
    expect(result.unmatched).toEqual([])
    expect((form.value as any).t).toBe('x')
    expect((form.value as any).r).toBe(null)
  })

  it('lists group-level errors in invalid', async () => {
    mountWith(() => [h(FormKit, { type: 'group', name: 'g' }, () => [h(FormKit, { type: 'text', name: 'x' })])])
    await flushPromises()
    const form = getNode('fill3')!
    form.at('g')!.setErrors(['Group problem'])
    const result = await fillForm(form, { 'g.x': 'ok' })
    expect(result.invalid).toEqual([{ address: 'g', errors: ['Group problem'] }])
    expect(result.valid).toBe(false)
  })
})
