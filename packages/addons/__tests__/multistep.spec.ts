import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { FormKit, FormKitSchema, plugin, defaultConfig } from '@formkit/vue'
import { createMultiStepPlugin } from '../src/plugins/multiStep/multiStepPlugin'
import { jest } from '@jest/globals'

const multiStepSchemaBasic = [
  {
    $formkit: 'multi-step',
    children: [
      {
        $formkit: 'step',
        name: 'stepOne',
        children: [
          {
            $formkit: 'text',
            validation: 'required',
          },
        ],
      },
      {
        $formkit: 'step',
        name: 'stepTwo',
      },
      {
        $formkit: 'step',
        name: 'stepThree',
      },
    ],
  },
]

const multiStepSchemaBasicWithProps = [
  {
    $formkit: 'multi-step',
    tabStyle: 'progress',
    hideProgressLabels: true,
    allowIncomplete: true,
    children: [
      {
        $formkit: 'step',
        name: 'stepOne',
        children: [
          {
            $formkit: 'text',
            validation: 'required',
          },
        ],
      },
      {
        $formkit: 'step',
        name: 'stepTwo',
      },
      {
        $formkit: 'step',
        name: 'stepThree',
      },
    ],
  },
]

describe('multistep', () => {
  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks()
  })

  it('it can mount a multi-step input', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'multi-step',
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              plugins: [createMultiStepPlugin()],
            }),
          ],
        ],
      },
    })

    expect(wrapper.html()).toContain('data-type="multi-step"')
  })

  it('it can mount steps inside of a multistep input', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'multi-step',
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              plugins: [createMultiStepPlugin()],
            }),
          ],
        ],
      },
      slots: {
        default() {
          return h(FormKit, {
            type: 'step',
          })
        },
      },
    })
    expect(wrapper.html()).toContain('data-type="step"')
  })

  it('it throws a warning when using a step input outside of a multi-step', () => {
    jest.spyOn(global.console, 'warn').mockImplementation(() => {})

    mount(FormKit, {
      props: {
        type: 'step',
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              plugins: [createMultiStepPlugin()],
            }),
          ],
        ],
      },
    })
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.warn).toBeCalledWith(
      'Invalid use of <FormKit type="step">. <FormKit type="step"> must be an immediate child of a <FormKit type="multi-step"> component.'
    )
  })

  it('it throws a warning when using a non-step input as a direct child of a multi-step', () => {
    jest.spyOn(global.console, 'warn').mockImplementation(() => {})

    mount(FormKit, {
      props: {
        type: 'multi-step',
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              plugins: [createMultiStepPlugin()],
            }),
          ],
        ],
      },
      slots: {
        default() {
          return h(FormKit, {
            type: 'text',
          })
        },
      },
    })
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.warn).toBeCalledWith(
      'Invalid FormKit input location. <FormKit type="multi-step"> should only have <FormKit type="step"> inputs as immediate children. Failure to wrap child inputs in <FormKit type="step"> can lead to undesired behaviors.'
    )
  })

  it('creates 3 step tabs when it has 3 children of type step', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: multiStepSchemaBasic,
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              plugins: [createMultiStepPlugin()],
            }),
          ],
        ],
      },
    })

    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.html().match(/button class=\"formkit-tab\"/g)?.length).toBe(
      3
    )
  })

  it('defaults to expected prop arguments', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: multiStepSchemaBasic,
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              plugins: [createMultiStepPlugin()],
            }),
          ],
        ],
      },
    })

    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.html()).toContain('data-tab-style="tab"')
    expect(wrapper.html()).toContain('data-hide-labels="false"')
  })

  it('accepts new prop argument values', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: multiStepSchemaBasicWithProps,
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              plugins: [createMultiStepPlugin()],
            }),
          ],
        ],
      },
    })

    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.html()).toContain('data-tab-style="progress"')
    expect(wrapper.html()).toContain('data-hide-labels="true"')
  })

  it('Does not allow step advancment when current step is invalid', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: multiStepSchemaBasic,
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              plugins: [
                createMultiStepPlugin({
                  allowIncomplete: false,
                }),
              ],
            }),
          ],
        ],
      },
    })

    await new Promise((r) => setTimeout(r, 5))
    wrapper.find('.formkit-step-next button').trigger('click')
    await new Promise((r) => setTimeout(r, 15))
    expect(wrapper.html()).toContain(
      '<div class="formkit-tabs" role="tablist"><button class="formkit-tab" type="button" data-active="true" data-valid="false" data-visited="true" role="tab" id="input_33_tab_0" aria-selected="true" aria-controls="input_34" tabindex="0"><span class="formkit-tab-label">Step One</span><span class="formkit-badge" role="presentation">1</span>'
    )
  })

  it('Allows step advancment when current step is invalid but allowIncomplete is true', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: multiStepSchemaBasicWithProps,
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              plugins: [
                createMultiStepPlugin({
                  allowIncomplete: true,
                }),
              ],
            }),
          ],
        ],
      },
    })

    await new Promise((r) => setTimeout(r, 5))
    wrapper.find('.formkit-step-next button').trigger('click')
    await new Promise((r) => setTimeout(r, 15))
    // 2nd tab is active (without labels due to props)
    expect(wrapper.html()).toContain(
      '</button><button class="formkit-tab" type="button" data-active="true" data-valid="true" role="tab" id="input_42_tab_1" aria-selected="true" aria-controls="input_45" tabindex="0" data-visited="true">'
    )
    // 2nd step is visible
    expect(wrapper.html()).toContain(
      `</div>
      <div class=\"formkit-step\" data-type=\"step\" id=\"input_45\" role=\"tabpanel\" aria-labelledby=\"input_42_tab_1\">`
    )
  })
})
