import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { getNode } from '@formkit/core'
import { plugin, defaultConfig } from '../src'

describe('context.state.empty on groups (lazy)', () => {
  it('tracks the group value across inputs', async () => {
    const wrapper = mount(
      { template: `<FormKit type="group" id="g" />` },
      { global: { plugins: [[plugin, defaultConfig]] } }
    )
    await nextTick()
    const g = getNode('g')!
    expect(g.context!.state.empty).toBe(true)
    g.input({ a: 1 }, false)
    await g.settled
    expect(g.context!.state.empty).toBe(false)
    g.input({}, false)
    await g.settled
    expect(g.context!.state.empty).toBe(true)
    wrapper.unmount()
  })

  it('is false once children register their keys', async () => {
    const wrapper = mount(
      { template: `<FormKit type="group" id="gc"><FormKit name="a" /></FormKit>` },
      { global: { plugins: [[plugin, defaultConfig]] } }
    )
    await nextTick()
    expect(getNode('gc')!.context!.state.empty).toBe(false)
    wrapper.unmount()
  })

  it('is reactive for templates reading it', async () => {
    const wrapper = mount(
      {
        template: `<FormKit type="group" id="g2" v-slot="{ state }">
          <span id="e">{{ state.empty }}</span>
        </FormKit>`,
      },
      { global: { plugins: [[plugin, defaultConfig]] } }
    )
    await nextTick()
    expect(wrapper.find('#e').text()).toBe('true')
    getNode('g2')!.input({ x: 1 }, false)
    await getNode('g2')!.settled
    await nextTick()
    expect(wrapper.find('#e').text()).toBe('false')
    wrapper.unmount()
  })
})
