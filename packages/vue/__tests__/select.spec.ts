import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { mount } from '@vue/test-utils'
import { getNode } from '@formkit/core'
import { nextTick } from 'vue'
// import { jest } from '@jest/globals'

describe('select', () => {
  it('renders a select list with an array of objects', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        options: [
          { label: 'FooBar', value: 'foo' },
          { label: 'BarFoo', value: 'bar' },
        ],
        help: 'I am help text',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html())
      .toEqual(`<div class="formkit-outer" data-type="select">
  <div class="formkit-wrapper">
    <!---->
    <div class="formkit-inner">
      <!----><select id="input_0" class="formkit-input" name="select_1" aria-describedby="help-input_0">
        <option class="formkit-option" value="foo">FooBar</option>
        <option class="formkit-option" value="bar">BarFoo</option>
      </select>
      <!---->
    </div>
  </div>
  <div id="help-input_0" class="formkit-help">I am help text</div>
  <!---->
</div>`)
  })

  it('renders a select list with an array of objects containing attributes', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        name: 'select_d',
        help: 'This is help text',
        options: [
          { label: 'FooBar', value: 'foo', attrs: { disabled: true } },
          { label: 'BarFoo', value: 'bar' },
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html())
      .toEqual(`<div class="formkit-outer" data-type="select">
  <div class="formkit-wrapper">
    <!---->
    <div class="formkit-inner">
      <!----><select id="input_1" class="formkit-input" name="select_d" aria-describedby="help-input_1">
        <option disabled="" class="formkit-option" value="foo">FooBar</option>
        <option class="formkit-option" value="bar">BarFoo</option>
      </select>
      <!---->
    </div>
  </div>
  <div id="help-input_1" class="formkit-help">This is help text</div>
  <!---->
</div>`)
  })

  it('renders a select list with an array of strings', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        name: 'select_foo',
        options: ['foo', 'bar'],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html())
      .toEqual(`<div class="formkit-outer" data-type="select">
  <div class="formkit-wrapper">
    <!---->
    <div class="formkit-inner">
      <!----><select id="input_2" class="formkit-input" name="select_foo">
        <option class="formkit-option" value="foo">foo</option>
        <option class="formkit-option" value="bar">bar</option>
      </select>
      <!---->
    </div>
  </div>
  <!---->
  <!---->
</div>`)
  })

  it('renders a select list with an array of numbers', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        name: 'select_foo',
        options: [1, 2, 3],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html())
      .toEqual(`<div class="formkit-outer" data-type="select">
  <div class="formkit-wrapper">
    <!---->
    <div class="formkit-inner">
      <!----><select id="input_3" class="formkit-input" name="select_foo">
        <option class="formkit-option" value="1">1</option>
        <option class="formkit-option" value="2">2</option>
        <option class="formkit-option" value="3">3</option>
      </select>
      <!---->
    </div>
  </div>
  <!---->
  <!---->
</div>`)
  })

  it('renders a select list with key/value pairs', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        name: 'select_foo',
        id: 'select_foo',
        options: {
          foo: 'Bar',
          baz: 'Bim',
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html())
      .toEqual(`<div class="formkit-outer" data-type="select">
  <div class="formkit-wrapper">
    <!---->
    <div class="formkit-inner">
      <!----><select id="select_foo" class="formkit-input" name="select_foo">
        <option class="formkit-option" value="foo">Bar</option>
        <option class="formkit-option" value="baz">Bim</option>
      </select>
      <!---->
    </div>
  </div>
  <!---->
  <!---->
</div>`)
  })

  it('selects the first value when no value is specified', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        name: 'select_foo',
        id: 'select-defaults',
        options: {
          foo: 'Bar',
          baz: 'Bim',
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode('select-defaults')!
    expect(node.context?.value).toBe('foo')
    expect(node.context?._value).toBe('foo')
    expect(node.value).toBe('foo')
    expect(node._value).toBe('foo')
    expect(wrapper.find('select').element.value).toBe('foo')
  })

  it('does not select the first value when multiple', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        name: 'select_foo',
        id: 'select-multiple',
        multiple: '',
        options: {
          foo: 'Bar',
          baz: 'Bim',
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode('select-multiple')!
    expect(node.context?.value).toEqual([])
    expect(node.context?._value).toEqual([])
    expect(node.value).toEqual([])
    expect(node._value).toEqual([])
    expect(Array.from(wrapper.find('select').element.selectedOptions)).toEqual(
      []
    )
  })

  it('default selected value propagates to parent', () => {
    mount(
      {
        template: `<FormKit type="group" id="group-item">
          <FormKit type="select" name="flavor" :options="['biz', 'baz', 'bar']" />
        </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(getNode('group-item')?.value).toEqual({ flavor: 'biz' })
  })

  it('selects a different value when one is specified', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        name: 'select_foo',
        value: 'jim',
        id: 'select-value',
        options: {
          foo: 'Bar',
          jim: 'Jam',
          baz: 'Bim',
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode('select-value')!
    expect(node.context?.value).toBe('jim')
    expect(node.context?._value).toBe('jim')
    expect(node.value).toBe('jim')
    expect(node._value).toBe('jim')
    expect(wrapper.find('select').element.value).toBe('jim')
  })

  it('selects a different value when one is v-modeled', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        name: 'select_foo',
        modelValue: 'bing',
        id: 'select-model',
        options: {
          foo: 'Bar',
          jim: 'Jam',
          bing: 'Bam',
          baz: 'Bim',
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode('select-model')!
    expect(node.context?.value).toBe('bing')
    expect(node.context?._value).toBe('bing')
    expect(node.value).toBe('bing')
    expect(node._value).toBe('bing')
    expect(wrapper.find('select').element.value).toBe('bing')
  })

  it('displays a placeholder when used', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        placeholder: 'Select one',
        options: {
          foo: 'Bar',
          jim: 'Jam',
          bing: 'Bam',
          baz: 'Bim',
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('select').element.innerHTML).toBe(
      `<option hidden=\"\" disabled=\"\" data-is-placeholder=\"true\" class=\"formkit-option\" value=\"\">Select one</option><option class=\"formkit-option\" value=\"foo\">Bar</option><option class=\"formkit-option\" value=\"jim\">Jam</option><option class=\"formkit-option\" value=\"bing\">Bam</option><option class=\"formkit-option\" value=\"baz\">Bim</option>`
    )
    expect(wrapper.find('select').attributes('data-placeholder')).toBe('true')
    expect(wrapper.find('select').element.selectedOptions[0]).toBe(
      wrapper.find('option').element
    )
  })

  it('order of the placeholder prop doesn’t matter', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        options: {
          foo: 'Bar',
        },
        placeholder: 'Select one',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('select').element.innerHTML).toBe(
      `<option hidden=\"\" disabled=\"\" data-is-placeholder=\"true\" class=\"formkit-option\" value=\"\">Select one</option><option class=\"formkit-option\" value=\"foo\">Bar</option>`
    )
    expect(wrapper.find('select').attributes('data-placeholder')).toBe('true')
    expect(wrapper.find('select').element.selectedOptions[0]).toBe(
      wrapper.find('option').element
    )
  })

  it('can render options using default slot', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            value: 'Bar',
          }
        },
        template: `
          <FormKit :delay="0" type="select" v-model="value">
            <option>Foo</option>
            <option>Bar</option>
            <option>Baz</option>
          </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    const select = wrapper.find('select')
    expect(select.element.value).toBe('Bar')
    await select.setValue('Baz')
    await select.trigger('input')
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.vm.value).toBe('Baz')
  })

  it('can render individual options using options slot', async () => {
    const wrapper = mount(
      {
        template: `
          <FormKit :delay="0" type="select" :options="{ v: 'venus', m: 'mars' }">
            <template #option="{ option }">
              <option :value="option.value">{{ option.label }}</option>
            </template>
          </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.html()).toContain('<option value="v">venus</option>')
    expect(wrapper.html()).toContain('<option value="m">mars</option>')
  })

  it('can v-model its data', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            value: 'bar',
          }
        },
        template:
          '<FormKit type="select" :delay="0" :options="[\'foo\', \'baz\', \'bar\']" v-model="value" />',
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.vm.value).toBe('bar')
    const select = wrapper.find('select')
    await select.setValue('baz')
    await select.trigger('input')
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.vm.value).toBe('baz')
  })

  it('can select multiple values', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            value: ['bar', 'baz'],
          }
        },
        template: `
          <FormKit
            :delay="0"
            type="select"
            multiple
            v-model="value"
            :options="['bar', 'foo', 'baz']"
          />`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    const select = wrapper.find('select')
    expect(
      Array.from(select.element.selectedOptions).map((value) => value.value)
    ).toEqual(['bar', 'baz'])
    wrapper.find('option').element.selected = false
    select.trigger('input')
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.vm.value).toEqual(['baz'])
    wrapper.setData({ value: ['baz', 'foo'] })
    await new Promise((r) => setTimeout(r, 10))
    expect(
      Array.from(select.element.selectedOptions).map((value) => value.value)
    ).toEqual(['foo', 'baz'])
  })

  it('shows error messages on blur', async () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        name: 'select_foo',
        id: 'select-value',
        validation: 'required',
        options: {
          foo: 'Bar',
          jim: 'Jam',
          baz: 'Bim',
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    wrapper.find('select').trigger('blur')
    await nextTick()
    expect(wrapper.find('.formkit-message').exists()).toBe(true)
  })

  it('can set the value of an input after initial render via node', async () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        id: 'select-via-node',
        validation: 'required',
        delay: 0,
        options: {
          foo: 'Bar',
          jim: 'Jam',
          baz: 'Bim',
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('select').element.value).toBe('foo')
    await new Promise((r) => setTimeout(r, 50))
    const node = getNode('select-via-node')!
    node.input('jim')
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.find('select').element.value).toBe('jim')
  })

  it('allows a select list with no options', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        options: [],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('select').html()).toBe(
      '<select id="input_11" class="formkit-input" name="select_10"></select>'
    )
  })
})
