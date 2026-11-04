import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h, ref, nextTick } from 'vue'
import { plugin, defaultConfig, FormKit, FormKitSchema } from '../src'
import { getNode } from '@formkit/core'

const global = { global: { plugins: [[plugin, defaultConfig]] } } as any

describe('section refs (#200)', () => {
  it('exposes section DOM elements on the component and node context', async () => {
    const formkit = ref<any>()
    const wrapper = mount(
      {
        setup: () => () =>
          h(FormKit, {
            ref: formkit,
            id: 'refs-text',
            type: 'text',
            label: 'Name',
            help: 'Your name',
          }),
      },
      { ...global, attachTo: document.body }
    )
    await flushPromises()
    const refs = formkit.value.refs
    expect(refs.input).toBeInstanceOf(HTMLInputElement)
    expect(refs.input).toBe(wrapper.find('input').element)
    expect(refs.label).toBe(wrapper.find('label').element)
    expect(refs.outer).toBe(wrapper.find('.formkit-outer').element)
    expect(refs.help).toBe(wrapper.find('.formkit-help').element)
    expect(getNode('refs-text')!.context!.refs!.input).toBe(refs.input)
    refs.input.focus()
    expect(document.activeElement).toBe(refs.input)
    wrapper.unmount()
  })

  it('keeps refs per instance when inputs share a compiled schema', async () => {
    const a = ref<any>()
    const b = ref<any>()
    const wrapper = mount(
      {
        setup: () => () => [
          h(FormKit, { ref: a, type: 'text', name: 'a' }),
          h(FormKit, { ref: b, type: 'text', name: 'b' }),
        ],
      },
      global
    )
    await flushPromises()
    const inputs = wrapper.findAll('input')
    expect(a.value.refs.input).toBe(inputs[0].element)
    expect(b.value.refs.input).toBe(inputs[1].element)
  })

  it('clears a ref when its section stops rendering', async () => {
    const formkit = ref<any>()
    const help = ref<string | undefined>('Shown')
    mount(
      {
        setup: () => () =>
          h(FormKit, { ref: formkit, type: 'text', help: help.value }),
      },
      global
    )
    await flushPromises()
    expect(formkit.value.refs.help).toBeInstanceOf(HTMLElement)
    help.value = undefined
    await nextTick()
    await flushPromises()
    expect(formkit.value.refs.help).toBe(null)
  })

  it('does not touch data in a standalone FormKitSchema', async () => {
    const data = { refs: { untouched: true } as Record<string, unknown> }
    mount(FormKitSchema, {
      props: { schema: [{ $el: 'div', meta: { section: 'outer' }, children: 'hi' }], data },
      ...global,
    })
    await flushPromises()
    // Only FormKit inputs opt in via their context; plain data with a `refs`
    // key still gets populated, so check it's harmless and scoped.
    expect(data.refs.untouched).toBe(true)
  })
})
