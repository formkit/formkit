import { describe, it, vi, afterEach, expect } from 'vitest'
import { createTypeboxPlugin } from '../src'
import { getNode } from '@formkit/core'
import { mount } from '@vue/test-utils'
import { defaultConfig, plugin as formKitPlugin } from '@formkit/vue'

import { Type } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { FormatRegistry } from '@sinclair/typebox'

// http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
FormatRegistry.Set('email', (value) => emailPattern.test(value))

const global: Record<string, Record<string, any>> = {
  global: {
    plugins: [[formKitPlugin, defaultConfig]],
  },
}

const nextTick = (timeout = 0) =>
  new Promise<void>((r) => setTimeout(r, timeout))

describe('typebox validation', () => {
  const spy = vi.fn()

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('blocks submit when typebox validation fails', async () => {
    const [plugin, submit] = createTypeboxPlugin(
      Type.Object({
        email: Type.String({format: 'email'}),
      }),
      spy
    )
    const wrapper = mount(
      {
        methods: {
          submitHandler: submit,
          plugin,
        },
        template: `
        <FormKit type="form" @submit="submitHandler" :plugins="[plugin]">
          <FormKit name="email" value="foobar" />
        </FormKit>
      `,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await nextTick()
    expect(spy).not.toHaveBeenCalled()
  })

  it('blocks submit when typebox validation fails for nested input', async () => {
    const [plugin, submit] = createTypeboxPlugin(
      Type.Object({
        personalInfo: Type.Object({
          firstName: Type.String({ minLength: 3, maxLength: 25 }),
          lastName: Type.String({ minLength: 3, maxLength: 25 }),
        })
      }),
      spy
    )
    const wrapper = mount(
      {
        methods: {
          submitHandler: submit,
          plugin,
        },
        template: `
          <FormKit type="form" @submit="submitHandler" :plugins="[plugin]">
            <FormKit type="group" name="personalInfo">
              <FormKit type="text" name="firstName" label="First Name" value="Foo" />
              <FormKit type="text" name="lastName" label="Last Name" value="B"/>
            </FormKit>
          </FormKit>
      `,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await nextTick()
    expect(spy).not.toHaveBeenCalled()
  })

  it('continues with submit when typebox validation succeeds', async () => {
    const [plugin, submit] = createTypeboxPlugin(
      Type.Object({
        email: Type.String({format: 'email'}),
      }),
      spy
    )
    const wrapper = mount(
      {
        methods: {
          submitHandler: submit,
          plugin,
        },
        template: `
        <FormKit id="form" type="form" @submit="submitHandler" :plugins="[plugin]">
          <FormKit name="email" value="foo@bar.com" />
        </FormKit>
      `,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await nextTick()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('shows validation on affected inputs and non-matching errors on form', async () => {
    const [plugin, submit] = createTypeboxPlugin(
      Type.Object({
        name: Type.String({minLength: 3, maxLength: 25}),
        email: Type.String({format: 'email'}),
        missing: Type.Number(),
      }),
      spy
    )
    const wrapper = mount(
      {
        methods: {
          submitHandler: submit,
          plugin,
        },
        template: `
        <FormKit type="form" @submit="submitHandler" :plugins="[plugin]">
          <FormKit id="name" name="name" value="a" />
          <FormKit id="email" type="email" name="email" value="foo" />
        </FormKit>
      `,
      },
      global
    )
    const form = wrapper.find('form')
    form.trigger('submit')
    await nextTick()
    const name = wrapper.find('[data-type="text"]')
    const email = wrapper.find('[data-type="email"]')
    expect(name.find('.formkit-message').exists()).toBe(true)
    expect(email.find('.formkit-message').exists()).toBe(true)
    expect(
      form.find('.formkit-form > .formkit-messages > .formkit-message').exists()
    ).toBe(true)
  })

  it('can hydrate errors with node.setTypeboxErrors', async () => {
    const typeboxSchema = Type.Object({
      name: Type.String({minLength: 3, maxLength: 25}),
      email: Type.String({format: 'email'}),
      missing: Type.Number(),
    })
    const invalidValues = {
      name: 'a',
      email: 'andrew',
      missing: 'foo',
    }
    const checker = TypeCompiler.Compile(typeboxSchema)
    const errors = checker.Errors(invalidValues)
    const [plugin, submit] = createTypeboxPlugin(typeboxSchema, spy)
    const wrapper = mount(
      {
        methods: {
          submitHandler: submit,
          plugin,
        },
        template: `
        <FormKit id="form" type="form" @submit="submitHandler" :plugins="[plugin]">
          <FormKit id="name" name="name" value="a" />
          <FormKit id="email" type="email" name="email" value="foo" />
        </FormKit>
      `,
      },
      global
    )
    const formNode = getNode('form')
    formNode?.setTypeboxErrors(errors)
    const form = wrapper.find('form')
    form.trigger('submit')
    await nextTick()
    const name = wrapper.find('[data-type="text"]')
    const email = wrapper.find('[data-type="email"]')
    expect(name.find('.formkit-message').exists()).toBe(true)
    expect(email.find('.formkit-message').exists()).toBe(true)
    expect(
      form.find('.formkit-form > .formkit-messages > .formkit-message').exists()
    ).toBe(true)
  })
})
