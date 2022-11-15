import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { getNode } from '@formkit/core'
import { token } from '@formkit/utils'

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
    expect(wrapper.html()).toContain(
      '<input class="formkit-input" type="checkbox"'
    )
  })

  it('Single checkboxes render help text', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'checkbox',
        help: 'hello world',
      },
      ...global,
    })
    expect(wrapper.html()).toContain('hello world')
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

  it('can use an object as an on-value and off-value', () => {
    const wrapper = mount(
      {
        template:
          '<FormKit :delay="0" type="checkbox" :on-value="{ a: 123 }" :off-value="{ b: 456 }" :value="{ a: 123 }" />',
      },
      {
        ...global,
      }
    )
    const checkbox = wrapper.find('input')
    expect(checkbox.element.checked).toBe(true)
  })

  it('outputs a data-disabled on the wrapper', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'checkbox',
        disabled: true,
        value: false,
      },
      ...global,
    })
    expect(wrapper.find('.formkit-wrapper[data-disabled]').exists()).toBe(true)
  })

  it('renders the label slot even when there is no label prop', async () => {
    const wrapper = mount(
      {
        template: `
        <FormKit type="checkbox">
          <template #label>
            <div id="hello-world">Render me anyway</div>
          </template>
        </FormKit>
      `,
      },
      global
    )
    expect(wrapper.find('#hello-world').exists()).toBe(true)
  })

  it('renders the label slot even when there is no label prop', async () => {
    const wrapper = mount(
      {
        template: `
        <FormKit type="checkbox" :options="['A', 'B']">
          <template #label>
            <div class="my-label">Render me anyway</div>
          </template>
        </FormKit>
      `,
      },
      global
    )
    expect(wrapper.find('div').findAll('.my-label').length).toBe(2)
  })

  it('does not render the label when it is not provided', async () => {
    const wrapper = mount(
      {
        template: `
        <FormKit type="checkbox" />
      `,
      },
      global
    )
    expect(wrapper.find('.formkit-label').exists()).toBe(false)
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
        name: 'mybox',
        options: ['foo', 'bar', 'baz'],
      },
      ...global,
    })
    expect(wrapper.html())
      .toBe(`<div class="formkit-outer" data-family="box" data-type="checkbox" data-multiple="true">
  <fieldset class="formkit-fieldset" id="my-id" aria-describedby="help-my-id">
    <legend class="formkit-legend">All checkboxes</legend>
    <div class="formkit-help" id="help-my-id">help-text</div>
    <ul class="formkit-options">
      <li class="formkit-option"><label class="formkit-wrapper">
          <div class="formkit-inner">
            <!----><input class="formkit-input" type="checkbox" name="mybox" id="mybox-option-foo" value="foo"><span class="formkit-decorator" aria-hidden="true"><!----></span>
            <!---->
          </div><span class="formkit-label">foo</span>
        </label>
        <!---->
      </li>
      <li class="formkit-option"><label class="formkit-wrapper">
          <div class="formkit-inner">
            <!----><input class="formkit-input" type="checkbox" name="mybox" id="mybox-option-bar" value="bar"><span class="formkit-decorator" aria-hidden="true"><!----></span>
            <!---->
          </div><span class="formkit-label">bar</span>
        </label>
        <!---->
      </li>
      <li class="formkit-option"><label class="formkit-wrapper">
          <div class="formkit-inner">
            <!----><input class="formkit-input" type="checkbox" name="mybox" id="mybox-option-baz" value="baz"><span class="formkit-decorator" aria-hidden="true"><!----></span>
            <!---->
          </div><span class="formkit-label">baz</span>
        </label>
        <!---->
      </li>
    </ul>
  </fieldset>
  <!---->
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
    const node = getNode('my-id')
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
    // TODO - Remove the .get() here when @vue/test-utils > rc.19
    const inputs = wrapper.get('fieldset').findAll('input')
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
          {
            value: 'it',
            label: 'Italy',
            id: 'italy',
            help: 'Good food here',
            attrs: { disabled: true },
          },
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
    expect(wrapper.find('li').html()).toBe(
      `<li class="formkit-option" data-disabled="true"><label class="formkit-wrapper">
    <div class="formkit-inner">
      <!----><input class="formkit-input" type="checkbox" name="countries" disabled="" id="countries-option-it" aria-describedby="help-countries-option-it" value="it"><span class="formkit-decorator" aria-hidden="true"><!----></span>
      <!---->
    </div><span class="formkit-label">Italy</span>
  </label>
  <div class="formkit-option-help" id="help-countries-option-it">Good food here</div>
</li>`
    )
  })

  it('can set the default value from a v-modeled form', () => {
    const wrapper = mount(
      {
        data() {
          return {
            values: {
              letters: ['A', 'C'],
            },
          }
        },
        template: `
      <FormKit type="form" v-model="values">
        <FormKit type="checkbox" :options="['A', 'B', 'C']" name="letters" />
      </FormKit>`,
      },
      {
        ...global,
      }
    )
    // TODO - Remove the .get() here when @vue/test-utils > rc.19
    const checkboxes = wrapper.get('form').findAll('input')
    const values = checkboxes.map((box) => box.element.checked)
    expect(values).toEqual([true, false, true])
    expect(wrapper.vm.values).toEqual({ letters: ['A', 'C'] })
  })

  it('can have no label and still render its checkbox labels', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'checkbox',
        options: ['A', 'B', 'C'],
      },
      ...global,
    })
    expect(wrapper.find('legend').exists()).toBeFalsy()
    // TODO - Remove the .get() here when @vue/test-utils > rc.19
    expect(wrapper.get('fieldset').findAll('label').length).toBe(3)
    expect(wrapper.html()).toContain('<span class="formkit-label">A</span>')
  })
})

describe('non string values for checkboxes', () => {
  it('can have numbers as values', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        delay: 0,
        type: 'checkbox',
        value: [2, 3],
        options: [
          { value: 1, label: 'One' },
          { value: 2, label: 'Two' },
          { value: 3, label: 'Three' },
        ],
      },
      ...global,
    })
    const checkboxes = wrapper.find('div').findAll('input')
    expect(checkboxes.map((input) => input.element.checked)).toEqual([
      false,
      true,
      true,
    ])
    checkboxes[0].element.checked = false
    checkboxes[0].trigger('input')
    await new Promise((r) => setTimeout(r, 10))
    expect(checkboxes.map((input) => input.element.checked)).toEqual([
      true,
      true,
      true,
    ])
    expect(getNode(id)!.value).toEqual([2, 3, 1])
  })

  it('can have objects as values', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        delay: 0,
        type: 'checkbox',
        value: [{ zip: '02108' }],
        options: [
          { value: null, label: 'Atlanta' },
          { value: { zip: '02108' }, label: 'Boston' },
          { value: { zip: '80014' }, label: 'Denver' },
        ],
      },
      ...global,
    })
    const checkboxes = wrapper.find('div').findAll('input')
    expect(checkboxes.map((input) => input.element.checked)).toEqual([
      false,
      true,
      false,
    ])
    checkboxes[0].element.checked = false
    checkboxes[0].trigger('input')
    await new Promise((r) => setTimeout(r, 10))
    expect(checkboxes.map((input) => input.element.checked)).toEqual([
      true,
      true,
      false,
    ])
    expect(getNode(id)!.value).toEqual([{ zip: '02108' }, null])
  })

  it('renders the help slot a single time', () => {
    const id = token()
    const wrapper = mount(
      {
        template: `<FormKit type="checkbox" id="${id}" :options="['A', 'B', 'C']">
        <template #help><span class="should-appear-once">My help text</span></template>
      </FormKit>`,
      },
      global
    )
    expect(wrapper.find('div').findAll('.should-appear-once').length).toBe(1)
  })
})
