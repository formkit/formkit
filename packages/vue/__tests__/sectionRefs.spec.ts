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

  it('never writes into user schema data that has a refs key', async () => {
    const userRefs = Object.freeze({ mine: true })
    const data = { refs: userRefs }
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: [{ $el: 'div', meta: { section: 'outer' }, children: 'hi' }],
        data,
      },
      ...global,
    })
    await flushPromises()
    expect(wrapper.text()).toBe('hi')
    expect(data.refs).toEqual({ mine: true })
  })

  it('does not ref sections repeated in a loop (checkbox options)', async () => {
    const formkit = ref<any>()
    mount(
      {
        setup: () => () =>
          h(FormKit, {
            ref: formkit,
            type: 'checkbox',
            options: ['a', 'b', 'c'],
          }),
      },
      global
    )
    await flushPromises()
    const refs = formkit.value.refs
    expect(refs.outer).toBeInstanceOf(HTMLElement)
    expect(refs.options).toBeInstanceOf(HTMLElement)
    // The per-option `input` section is repeated, so it has no single ref.
    expect(refs.input).toBe(undefined)
  })
})
