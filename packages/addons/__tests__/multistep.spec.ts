import { ConcreteComponent, h, reactive } from 'vue'
import { mount } from '@vue/test-utils'
import {
  FormKit,
  FormKitSchema,
  plugin,
  defaultConfig,
  resetCount,
} from '@formkit/vue'
import { getNode } from '@formkit/core'
import { createMultiStepPlugin } from '../src/plugins/multiStep/multiStepPlugin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

const multiStepSchemaWithRequiredSecondStep = [
  {
    $formkit: 'multi-step',
    children: [
      {
        $formkit: 'step',
        name: 'stepOne',
        children: [
          {
            $formkit: 'text',
            name: 'firstName',
            validation: 'required',
          },
        ],
      },
      {
        $formkit: 'step',
        name: 'stepTwo',
        children: [
          {
            $formkit: 'text',
            name: 'lastName',
            validation: 'required',
          },
        ],
      },
    ],
  },
]

describe('multistep', () => {
  beforeEach(() => {
    resetCount()
  })
  afterEach(() => {
    // restore the spy created with spyOn
    vi.restoreAllMocks()
  })

  it('it can mount a multi-step input', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'multi-step',
      },
      attachTo: document.body,
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
    wrapper.unmount()
  })

  it('it can mount steps inside of a multistep input', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'multi-step',
      },
      attachTo: document.body,
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
          return h(FormKit as ConcreteComponent, {
            type: 'step',
          })
        },
      },
    })
    expect(wrapper.html()).toContain('data-type="step"')
    wrapper.unmount()
  })

  it('it throws a warning when using a step input outside of a multi-step', () => {
    vi.spyOn(global.console, 'warn').mockImplementation(() => {})

    const wrapper = mount(FormKit, {
      props: {
        type: 'step',
      },
      attachTo: document.body,
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
    wrapper.unmount()
  })

  it('it throws a warning when using a non-step input as a direct child of a multi-step', () => {
    vi.spyOn(global.console, 'warn').mockImplementation(() => {})

    const wrapper = mount(FormKit, {
      props: {
        type: 'multi-step',
      },
      attachTo: document.body,
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
          return h(FormKit as ConcreteComponent, {
            type: 'text',
          })
        },
      },
    })
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.warn).toBeCalledWith(
      'Invalid FormKit input location. <FormKit type="multi-step"> should only have <FormKit type="step"> inputs as immediate children. Failure to wrap child inputs in <FormKit type="step"> can lead to undesired behaviors.'
    )

    wrapper.unmount()
  })

  it('creates 3 step tabs when it has 3 children of type step', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: multiStepSchemaBasic,
      },
      attachTo: document.body,
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
    wrapper.unmount()
  })

  it('defaults to expected prop arguments', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: multiStepSchemaBasic,
      },
      attachTo: document.body,
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
    wrapper.unmount()
  })

  it('accepts new prop argument values', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: multiStepSchemaBasicWithProps,
      },
      attachTo: document.body,
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
    wrapper.unmount()
  })

  it('does not expose aggregate invalid state on structural containers (#1208)', async () => {
    const wrapper = mount(
      {
        template: `
          <FormKit type="form" id="multistep-form">
            <FormKit type="multi-step" name="steps" allow-incomplete>
              <FormKit type="step" name="stepOne">
                <FormKit
                  type="text"
                  name="name"
                  validation="required"
                  value="Riki"
                />
              </FormKit>
              <FormKit type="step" name="stepTwo">
                <FormKit type="text" name="email" validation="required" />
              </FormKit>
            </FormKit>
          </FormKit>
        `,
      },
      {
        attachTo: document.body,
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
      }
    )

    await new Promise((r) => setTimeout(r, 15))
    await wrapper.find('.formkit-step-next button').trigger('click')
    await new Promise((r) => setTimeout(r, 15))
    await wrapper.find('button[type="submit"]').trigger('click')
    await new Promise((r) => setTimeout(r, 15))

    expect(
      wrapper.find('.formkit-outer[data-type="multi-step"]').attributes()
    ).not.toHaveProperty('data-invalid')
    wrapper.findAll('.formkit-step').forEach((step) => {
      expect(step.attributes()).not.toHaveProperty('data-invalid')
    })
    expect(
      wrapper.find('.formkit-outer[data-type="text"]').attributes()
    ).not.toHaveProperty('data-invalid')
    expect(
      wrapper.findAll('.formkit-outer[data-type="text"]')[1].attributes()
    ).toHaveProperty('data-invalid')
    wrapper.unmount()
  })

  it('Does not allow step advancement when current step is invalid', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: multiStepSchemaBasic,
      },
      attachTo: document.body,
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

    await new Promise((r) => setTimeout(r, 15))
    wrapper.find('.formkit-step-next button').trigger('click')
    await new Promise((r) => setTimeout(r, 15))
    expect(wrapper.html()).toMatchSnapshot()
    wrapper.unmount()
  })

  it('Allows step advancement when current step is invalid but allowIncomplete is true', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: multiStepSchemaBasicWithProps,
      },
      attachTo: document.body,
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
    expect(wrapper.html()).toMatchSnapshot()
    wrapper.unmount()
  })

  it('allows navigation after programmatic input updates settle step conditions (#1135)', async () => {
    const beforeStepChange = vi.fn(() => true)
    const wrapper = mount(FormKitSchema, {
      props: {
        data: { beforeStepChange },
        schema: [
          {
            $formkit: 'multi-step',
            id: 'issue1135MultiStep',
            allowIncomplete: false,
            beforeStepChange: '$beforeStepChange',
            children: [
              {
                $formkit: 'step',
                name: 'stepOne',
                children: [
                  {
                    $formkit: 'radio',
                    id: 'issue1135Answer',
                    name: 'answer',
                    options: { yes: 'Yes', no: 'No' },
                    validation: 'required',
                  },
                ],
              },
              {
                $formkit: 'step',
                name: 'stepTwo',
                if: "$get(issue1135Answer).value === 'yes'",
                children: [
                  {
                    $formkit: 'text',
                    name: 'confirm',
                    validation: 'required',
                  },
                ],
              },
              {
                $formkit: 'step',
                name: 'stepThree',
              },
            ],
          },
        ],
      },
      attachTo: document.body,
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

    await new Promise((r) => setTimeout(r, 15))
    const multistep = getNode('issue1135MultiStep')!
    multistep.input({
      stepOne: { answer: 'yes' },
      stepTwo: { confirm: 'ready' },
    })
    multistep.goTo('stepTwo')
    await new Promise((r) => setTimeout(r, 15))

    expect(beforeStepChange).toHaveBeenCalledTimes(1)
    expect(multistep.props.activeStep).toBe('stepTwo')
    wrapper.unmount()
  })

  it('allows initial goTo after the current step settles (#1362)', async () => {
    const id = 'multi-step-go-to'
    const wrapper = mount(
      {
        data() {
          return { id }
        },
        mounted() {
          getNode(id)?.goTo('favorite')
        },
        template: `
          <FormKit :id="id" type="multi-step" :allow-incomplete="false">
            <FormKit type="step" name="basics">
              <FormKit type="text" name="name" value="Ada" validation="required" />
            </FormKit>
            <FormKit type="step" name="favorite">
              <FormKit type="text" name="color" />
            </FormKit>
          </FormKit>
        `,
      },
      {
        attachTo: document.body,
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
      }
    )

    await new Promise((r) => setTimeout(r, 25))
    expect(getNode(id)?.props.activeStep).toBe('favorite')
    wrapper.unmount()
  })

  it('preserves the order of steps even when a step is conditionally rendered', async () => {
    const data = reactive({
      showStepTwo: true,
    })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $formkit: 'multi-step',
            children: [
              {
                $formkit: 'step',
                name: 'stepAlpha',
                key: 'stepOne',
              },
              {
                $formkit: 'step',
                if: '$showStepTwo',
                name: 'stepBravo',
                key: 'stepTwo',
              },
              {
                $formkit: 'step',
                name: 'stepCharlie',
                key: 'stepThree',
              },
            ],
          },
        ],
      },
      attachTo: document.body,
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

    const stepNameRegex = /Step (.*)?</gm
    await new Promise((r) => setTimeout(r, 15))
    const stepMatches = wrapper.html().match(stepNameRegex)
    expect(stepMatches).toEqual(['Step Alpha<', 'Step Bravo<', 'Step Charlie<'])
    data.showStepTwo = false
    await new Promise((r) => setTimeout(r, 15))
    const stepMatchesAfter = wrapper.html().match(stepNameRegex)
    expect(stepMatchesAfter).toEqual(['Step Alpha<', 'Step Charlie<'])
    data.showStepTwo = true
    await new Promise((r) => setTimeout(r, 20))
    const stepMatchesAfter2 = wrapper.html().match(stepNameRegex)
    expect(stepMatchesAfter2).toEqual([
      'Step Alpha<',
      'Step Bravo<',
      'Step Charlie<',
    ])
    wrapper.unmount()
  })

  it('does not show validation on a later step after navigating back (#1696)', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: multiStepSchemaWithRequiredSecondStep,
      },
      attachTo: document.body,
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

    const lastNameOuter = () =>
      wrapper
        .find('input[name="lastName"]')
        .element.closest('.formkit-outer') as HTMLElement

    await new Promise((r) => setTimeout(r, 15))
    await wrapper.find('input[name="firstName"]').setValue('Ada')
    wrapper.find('.formkit-step-next button').trigger('click')
    await new Promise((r) => setTimeout(r, 15))
    expect(lastNameOuter().getAttribute('data-invalid')).toBe(null)
    expect(lastNameOuter().getAttribute('data-submitted')).toBe(null)

    wrapper.find('.formkit-step-previous button').trigger('click')
    await new Promise((r) => setTimeout(r, 15))
    await wrapper.find('input[name="firstName"]').setValue('')
    wrapper.find('.formkit-step-next button').trigger('click')
    await new Promise((r) => setTimeout(r, 15))

    expect(lastNameOuter().getAttribute('data-invalid')).toBe(null)
    expect(lastNameOuter().getAttribute('data-submitted')).toBe(null)
    wrapper.unmount()
  })
})
