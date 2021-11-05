import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { mount } from '@vue/test-utils'
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
    expect(wrapper.html()).toEqual(`<div class="formkit-outer">
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
        id: 'select-foo',
        options: ['foo', 'bar'],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toEqual(`<div class="formkit-outer">
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
})
