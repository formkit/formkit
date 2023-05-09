import { describe, it, vi, afterEach, expect } from 'vitest'
import { createZodPlugin } from '../src'
import { getNode } from '@formkit/core'
import { mount } from '@vue/test-utils'
import { defaultConfig, plugin as formKitPlugin } from 'packages/vue/dist'

import { z } from 'zod'

const global: Record<string, Record<string, any>> = {
  global: {
    plugins: [[formKitPlugin, defaultConfig]],
  },
}

const nextTick = (timeout = 0) =>
  new Promise<void>((r) => setTimeout(r, timeout))

describe('zod validation', () => {
  const spy = vi.fn()

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('blocks submit when zod validation fails', async () => {
    const [plugin, submit] = createZodPlugin(
      z.object({
        email: z.string().email(),
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

  it('continues with submit when zod validation succeeds', async () => {
    const [plugin, submit] = createZodPlugin(
      z.object({
        email: z.string().email(),
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
    const [plugin, submit] = createZodPlugin(
      z.object({
        name: z.string().min(3).max(25),
        email: z.string().email(),
        missing: z.number(),
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

  it('can hydrate errors with node.setZodErrors', async () => {
    const zodSchema = z.object({
      name: z.string().min(3).max(25),
      email: z.string().email(),
      missing: z.number(),
    })
    const invalidValues = {
      name: 'a',
      email: 'andrew',
      missing: 'foo',
    }
    const errors = await zodSchema.safeParseAsync(invalidValues)
    const [plugin, submit] = createZodPlugin(zodSchema, spy)
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
    formNode?.setZodErrors(errors.success === false ? errors.error : undefined)
    const form = wrapper.find('form')
    form.trigger('submit')
    await nextTick()
    const name = wrapper.find('[data-type="text"]')
    const email = wrapper.find('[data-type="email"]')
    console.log(form.html())
    expect(name.find('.formkit-message').exists()).toBe(true)
    expect(email.find('.formkit-message').exists()).toBe(true)
    expect(
      form.find('.formkit-form > .formkit-messages > .formkit-message').exists()
    ).toBe(true)
  })
})
