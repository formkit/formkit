import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { get } from '@formkit/core'

const global: Record<string, Record<string, any>> = {
  global: {
    plugins: [[plugin, defaultConfig]],
  },
}

describe('single checkbox', () => {
  it('can render a single checkbox', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'checkbox',
      },
      ...global,
    })
    expect(wrapper.html()).toContain('<input type="checkbox"')
  })

  it('can check a single checkbox with a true value', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'checkbox',
        value: true,
      },
      ...global,
    })
    expect(wrapper.find('input').element.checked).toBe(true)
  })

  it('can uncheck a single checkbox with a false value', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'checkbox',
        value: false,
      },
      ...global,
    })
    expect(wrapper.find('input').element.checked).toBe(false)
  })

  it('can check/uncheck single checkbox with v-model', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            value: false,
          }
        },
        template: '<FormKit :delay="0" type="checkbox" v-model="value" />',
      },
      {
        ...global,
      }
    )
    const checkbox = wrapper.find('input')
    expect(checkbox.element.checked).toBe(false)
    wrapper.setData({ value: true })
    await nextTick()
    expect(checkbox.element.checked).toBe(true)
    checkbox.element.checked = false
    checkbox.trigger('input')
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.vm.value).toBe(false)
  })

  it('can use custom on-value and off-value', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            value: 'foo',
          }
        },
        template:
          '<FormKit :delay="0" type="checkbox" on-value="foo" off-value="bar" v-model="value" />',
      },
      {
        ...global,
      }
    )
    const checkbox = wrapper.find('input')
    expect(checkbox.element.checked).toBe(true)
    wrapper.setData({ value: 'bar' })
    await nextTick()
    expect(checkbox.element.checked).toBe(false)
    checkbox.element.checked = true
    checkbox.trigger('input')
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.vm.value).toBe('foo')
  })
})

describe('multiple checkboxes', () => {
  it('can render multiple checkboxes with semantic markup', () => {
    const wrapper = mount(FormKit, {
      props: {
        id: 'my-id',
        type: 'checkbox',
        label: 'All checkboxes',
        help: 'help-text',
        options: ['foo', 'bar', 'baz'],
      },
      ...global,
    })
    expect(wrapper.html())
      .toBe(`<div class="formkit-outer" data-type="checkbox">
  <fieldset id="my-id" class="formkit-wrapper" aria-describedby="help-my-id">
    <legend class="formkit-legend">All checkboxes</legend>
    <div id="help-my-id" class="formkit-help">help-text</div>
    <ul class="formkit-options">
      <li class="formkit-option"><label class="formkit-wrapper">
          <div class="formkit-inner"><input type="checkbox" class="formkit-input" name="checkbox_6" id="checkbox_6-option-foo" value="foo"><span class="formkit-decorator" aria-hidden="true"></span></div><span class="formkit-label">foo</span>
        </label>
        <!---->
      </li>
      <li class="formkit-option"><label class="formkit-wrapper">
          <div class="formkit-inner"><input type="checkbox" class="formkit-input" name="checkbox_6" id="checkbox_6-option-bar" value="bar"><span class="formkit-decorator" aria-hidden="true"></span></div><span class="formkit-label">bar</span>
        </label>
        <!---->
      </li>
      <li class="formkit-option"><label class="formkit-wrapper">
          <div class="formkit-inner"><input type="checkbox" class="formkit-input" name="checkbox_6" id="checkbox_6-option-baz" value="baz"><span class="formkit-decorator" aria-hidden="true"></span></div><span class="formkit-label">baz</span>
        </label>
        <!---->
      </li>
    </ul>
  </fieldset>
  <!---->
</div>`)
  })

  it('multi-checkboxes set array values immediately', () => {
    mount(FormKit, {
      props: {
        id: 'my-id',
        type: 'checkbox',
        options: ['foo', 'bar', 'baz'],
      },
      ...global,
    })
    const node = get('my-id')
    expect(node?.value).toEqual([])
  })

  it('can check and uncheck boxes via v-model', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            values: ['foo', 'baz'],
          }
        },
        template:
          '<FormKit :delay="0" type="checkbox" v-model="values" :options="[\'foo\', \'bar\', \'baz\']" />',
      },
      { ...global }
    )
    const inputs = wrapper.findAll('input')
    expect(inputs[0].element.checked).toBe(true)
    expect(inputs[1].element.checked).toBe(false)
    expect(inputs[2].element.checked).toBe(true)
    inputs[0].element.checked = false
    inputs[0].trigger('input')
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.vm.values).toEqual(['baz'])
    wrapper.setData({ values: ['foo', 'bar'] })
    await nextTick()
    expect(inputs[0].element.checked).toBe(true)
    expect(inputs[1].element.checked).toBe(true)
    expect(inputs[2].element.checked).toBe(false)
  })

  it('can render options from an array of objects with ids and help text', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'checkbox',
        name: 'countries',
        options: [
          { value: 'it', label: 'Italy', id: 'italy', help: 'Good food here' },
          {
            value: 'de',
            label: 'Germany',
            id: 'germany',
            help: 'Good cars here',
          },
          { value: 'fr', label: 'France', id: 'france', help: 'Crickets' },
        ],
      },
      ...global,
    })
    expect(wrapper.find('label').html()).toBe(
      '<label class="formkit-wrapper"><div class="formkit-inner"><input type="checkbox" class="formkit-input" name="countries" id="countries-option-it" aria-describedby="help-countries-option-it" value="it"><span class="formkit-decorator" aria-hidden="true"></span></div><!----></label>'
    )
  })
})
