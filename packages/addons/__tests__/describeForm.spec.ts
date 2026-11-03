import { getNode, createMessage } from '@formkit/core'
import { defaultConfig, plugin, FormKit } from '@formkit/vue'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { describeForm } from '../src/plugins/describeForm'

const global = { global: { plugins: [[plugin, defaultConfig]] } } as any

function mountSignup() {
  return mount(
    {
      render: () =>
        h(FormKit, { type: 'form', id: 'signup', actions: false }, () => [
          h(FormKit, {
            type: 'email',
            name: 'email',
            label: 'Email',
            help: 'We never spam',
            validation: 'required|email',
          }),
          h(FormKit, {
            type: 'password',
            name: 'password',
            label: 'Password',
            value: 'hunter2',
            validation: 'required|length:8',
          }),
          h(FormKit, {
            type: 'select',
            name: 'plan',
            label: 'Plan',
            value: 'pro',
            options: [
              { label: 'Free', value: 'free' },
              { label: 'Pro', value: 'pro', attrs: { disabled: true } },
            ],
          }),
          h(FormKit, { type: 'group', name: 'address' }, () => [
            h(FormKit, { type: 'text', name: 'city', label: 'City' }),
          ]),
        ]),
    },
    global
  )
}

describe('describeForm', () => {
  it('describes fields, rules, options and errors without values by default', async () => {
    mountSignup()
    await flushPromises()
    const d = describeForm(getNode('signup')!)
    expect(d.type).toBe('form')
    expect(d.valid).toBe(false)
    const [email, password, plan, address] = d.children!
    expect(email).toMatchObject({
      name: 'email',
      address: 'email',
      type: 'email',
      nodeType: 'input',
      label: 'Email',
      help: 'We never spam',
      required: true,
      valid: false,
      rules: [
        { name: 'required', args: [] },
        { name: 'email', args: [] },
      ],
    })
    expect(email.errors).toEqual(['Email is required.'])
    expect(email).not.toHaveProperty('value')
    expect(password.rules[1]).toEqual({ name: 'length', args: ['8'] })
    expect(plan.options).toEqual([
      { label: 'Free', value: 'free' },
      { label: 'Pro', value: 'pro', disabled: true },
    ])
    expect(d.address).toBe('')
    expect(getNode('signup')!.at(address.children![0].address)?.name).toBe('city')
    expect(address.nodeType).toBe('group')
    expect(address.children![0].address).toBe('address.city')
    // Fully JSON-serializable.
    expect(JSON.parse(JSON.stringify(d))).toEqual(d)
  })

  it('includes values on request but always redacts passwords', async () => {
    mountSignup()
    await flushPromises()
    const d = describeForm(getNode('signup')!, { values: true })
    const [email, password, plan] = d.children!
    expect(email.value).toBe(null)
    expect(plan.value).toBe('pro')
    expect(password).not.toHaveProperty('value')
    expect(password.redacted).toBe(true)
    const all = describeForm(getNode('signup')!, { values: true, redact: [] })
    expect(all.children![1].value).toBe('hunter2')
  })

  it('can limit errors to the visible ones', async () => {
    mountSignup()
    await flushPromises()
    const d = describeForm(getNode('signup')!, { errors: 'visible' })
    // Nothing has been blurred or submitted yet.
    expect(d.children![0].errors).toEqual([])
    expect(d.children![0].valid).toBe(false)
    // Blurring the email input reveals its validation message.
    getNode('signup')!.at('email')!.store.set(
      createMessage({ key: 'blurred', visible: false, value: true })
    )
    await flushPromises()
    const after = describeForm(getNode('signup')!, { errors: 'visible' })
    expect(after.children![0].errors).toEqual(['Email is required.'])
    expect(after.children![1].errors).toEqual([])
  })

  it('flags option loaders instead of calling them', async () => {
    let calls = 0
    mount(FormKit, {
      props: {
        type: 'select',
        id: 'loaded',
        options: async () => {
          calls++
          return []
        },
      },
      ...global,
    })
    await flushPromises()
    const before = calls
    const d = describeForm(getNode('loaded')!)
    expect(d.optionsLoader).toBe(true)
    expect(d).not.toHaveProperty('options')
    expect(calls).toBe(before)
  })
})
