import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { mount } from '@vue/test-utils'
import { get } from '@formkit/core'
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
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html())
      .toEqual(`<div class="formkit-outer" data-type="select">
  <div class="formkit-wrapper">
    <!---->
    <div class="formkit-inner"><select class="formkit-input" name="select_1">
        <option class="formkit-option" value="foo">FooBar</option>
        <option class="formkit-option" value="bar">BarFoo</option>
      </select></div>
  </div>
  <!---->
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
    <div class="formkit-inner"><select class="formkit-input" name="select_foo">
        <option class="formkit-option">foo</option>
        <option class="formkit-option">bar</option>
      </select></div>
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
    <div class="formkit-inner"><select class="formkit-input" name="select_foo">
        <option class="formkit-option" value="foo">Bar</option>
        <option class="formkit-option" value="baz">Bim</option>
      </select></div>
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
    const node = get('select-defaults')!
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
    const node = get('select-multiple')!
    expect(node.context?.value).toBe(undefined)
    expect(node.context?._value).toBe(undefined)
    expect(node.value).toBe(undefined)
    expect(node._value).toBe(undefined)
    expect(wrapper.find('select').element.value).toBe('')
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
    expect(get('group-item')?.value).toEqual({ flavor: 'biz' })
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
    const node = get('select-value')!
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
    const node = get('select-model')!
    expect(node.context?.value).toBe('bing')
    expect(node.context?._value).toBe('bing')
    expect(node.value).toBe('bing')
    expect(node._value).toBe('bing')
    expect(wrapper.find('select').element.value).toBe('bing')
  })

  it('displays a placeholder when available', () => {
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
    const node = get('select-model')!
    expect(node.context?.value).toBe('bing')
    expect(node.context?._value).toBe('bing')
    expect(node.value).toBe('bing')
    expect(node._value).toBe('bing')
    expect(wrapper.find('select').element.value).toBe('bing')
  })
})
