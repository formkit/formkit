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
