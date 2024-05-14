import {
  h,
  defineComponent,
  ref,
  computed,
  reactive,
  onMounted,
  KeepAlive,
} from 'vue'
import type { FormKitSchemaDefinition } from '@formkit/core'
import { FormKitSchema } from './index'
import type { FormKitNode } from '@formkit/core'
import { getNode } from '@formkit/core'
import type { FormKitSchemaNode } from 'packages/core/src'

let inputList: Record<string, string[]> = {}
const schemas: Record<string, FormKitSchemaDefinition[]> = {}

const classes = {
  container: `
    formkit-kitchen-sink 
    p-8
  `,
  tabs: `
    formkit-tabs 
    mt-4 
    mr-[min(350px,25vw)]
  `,
  tab: `
    formkit-kitchen-sink-tab
    inline-block
    mb-4
    -mr-px
    cursor-pointer
    px-4
    py-2
    border
    border-neutral-200
    text-neutral-800
    data-[active]:bg-neutral-800
    data-[active]:border-neutral-800
    data-[active]:text-neutral-50
    hover:bg-neutral-100
    hover:text-neutral-900
    dark:border-neutral-700
    dark:text-neutral-50
    dark:data-[active]:bg-neutral-100
    dark:data-[active]:border-neutral-100
    dark:data-[active]:text-neutral-800
    dark:hover:bg-neutral-800
    dark:hover:text-neutral-50
  `,
  filterContainer: `
    formkit-filter-container
    grid
    grid-cols-[repeat(auto-fit,300px)]
    mr-[min(350px,25vw)]
    -mt-4
    mb-8
    px-4
    pt-8
    pb-4
    border
    relative
    -translate-y-px
    max-w-[1000px]
    border-neutral-200
    dark:border-neutral-700
  `,
  filterGroup: `
    formkit-filter-group
    mr-8
    mb-8
    [&_legend]:text-lg
    [&_ul]:columns-2
    [&_ul>li:first-child]:[column-span:all]
    [&_ul>li:first-child]:mt-2
    [&_ul>li:first-child]:mb-2
    [&_ul>li:first-child]:pb-2
    [&_ul>li:first-child]:border-b
    [&_ul>li:first-child]:border-neutral-200
    dark:[&_ul>li:first-child]:border-neutral-700
  `,
  formContainer: `
    formkit-form-container
    w-full
    bg-white
    rounded
    border
    border-neutral-100
    shadow-lg
    max-w-[800px]
    p-[min(5vw,5rem)]
    dark:bg-neutral-900
    dark:border-neutral-800
    dark:shadow-3xl
    [&_form>h1]:text-2xl
    [&_form>h1]:mb-4
    [&_form>h1]:font-bold
    [&_form>h1+p]:text-base
    [&_form>h1+p]:mb-4
    [&_form>h1+p]:-mt-2
    [&_form_.double]:flex
    [&_form_.double>*]:w-1/2
    [&_form_.double>*:first-child]:mr-2
    [&_form_.triple]:flex
    [&_form_.triple>*]:w-1/3
    [&_form_.triple>*:first-child]:mr-2
    [&_form_.triple>*:last-child]:ml-2
  `,
  inputs: `formkit-inputs`,
  specimen: `
    formkit-specimen 
    flex 
    flex-col 
    p-2 
    max-w-[75vw]
  `,
  inputSection: `
    group/section
    formkit-input-section 
    mr-[min(325px,25vw)]
  `,
  specimenGroup: `
    formkit-specimen-group
    grid
    mb-16
    grid-cols-[repeat(auto-fit,400px)]
    group-data-[type="transferlist"]/section:grid-cols-[repeat(auto-fit,650px)]
    group-data-[type="multi-step"]/section:grid-cols-[repeat(auto-fit,550px)]
  `,
  inputType: `
    formkit-input-type
    block
    font-bold
    text-neutral-900
    border-b
    border-neutral-100
    text-3xl
    mb-8
    pb-2
    capitalize
    dark:border-neutral-800 
    dark:text-neutral-50
  `,
}

/**
 * Fetches the list of inputs from the remote schema repository
 */
async function fetchInputList() {
  const response = await fetch(
    'https://raw.githubusercontent.com/formkit/input-schemas/master/index.json'
  )
  const json = await response.json()
  return json
}

/**
 * Fetches the list of inputs from the remote schema repository
 */
async function fetchInputSchema(input: string) {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/formkit/input-schemas/master/schemas/${input}.json`
    )
    const json = await response.json()
    return json
  } catch (error) {
    console.error(error)
  }
}

/**
 * Renders FormKit components fetched from a remote schema repository.
 * This is a kitchen sink component that is used for testing purposes.
 * It shows inputs in various states and configurations.
 *
 * @public
 */
export const FormKitKitchenSink = /* #__PURE__ */ defineComponent({
  name: 'FormKitKitchenSink',
  props: {
    schemas: {
      type: Array,
      required: false,
    },
    pro: {
      type: Boolean,
      default: true,
    },
    addons: {
      type: Boolean,
      default: true,
    },
    forms: {
      type: Boolean,
      default: true,
    },
    navigation: {
      type: Boolean,
      default: true,
    },
  },
  async setup(props) {
    onMounted(() => {
      const filterNode = getNode('filter-checkboxes')
      data.filters = computed((): string[] => {
        if (!filterNode?.context) return []
        const filters = filterNode.context.value
        const filterValues: string[] = []
        Object.keys(filters).forEach((key) => {
          filterValues.push(...filters[key])
        })
        return filterValues
      }) as unknown as string[]
    })

    inputList = Object.keys(inputList).length
      ? inputList
      : await fetchInputList()
    const promises = []
    const activeTab = ref('')
    const inputCheckboxes = computed(() => {
      const inputGroups: Record<string, Record<string, string | string[]>> = {
        core: { label: 'Inputs', name: 'core', inputs: inputList.core },
      }
      if (props.pro) {
        inputGroups.pro = {
          label: 'Pro Inputs',
          name: 'pro',
          inputs: inputList.pro,
        }
      }
      if (props.addons) {
        inputGroups.addons = {
          label: 'Add-ons',
          name: 'addons',
          inputs: inputList.addons,
        }
      }
      return inputGroups
    })

    if (!props.schemas) {
      const coreInputPromises = inputList.core.map(async (schema: string) => {
        const response = await fetchInputSchema(schema)
        schemas[schema] = response
      })
      promises.push(...coreInputPromises)

      if (props.forms) {
        const formsPromises = inputList.forms.map(async (schema: string) => {
          const schemaName = `form/${schema}`
          const response = await fetchInputSchema(schemaName)
          schemas[schemaName] = response
        })
        promises.push(...formsPromises)
      }

      if (props.pro) {
        const proInputPromises = inputList.pro.map(async (schema: string) => {
          const response = await fetchInputSchema(schema)
          schemas[schema] = response
        })
        promises.push(...proInputPromises)
      }

      if (props.addons) {
        const addonPromises = inputList.addons.map(async (schema: string) => {
          const response = await fetchInputSchema(schema)
          schemas[schema] = response
        })
        promises.push(...addonPromises)
      }
    } else {
      const schemaPromises = props.schemas.map(async (schema: unknown) => {
        const response = await fetchInputSchema(`${schema}`)
        schemas[`${schema}`] = response
      })
      promises.push(...schemaPromises)
    }

    // a plugin required for the "select all" checkbox functionality
    const selectAll = (node: FormKitNode) => {
      let previousValue: string[] = []
      let skip = false

      if (node.props.type !== 'checkbox') return
      node.on('created', () => {
        // if the only checked item is the "all" checkbox, check all
        const currentValue = node.value
        if (
          Array.isArray(currentValue) &&
          currentValue.length === 1 &&
          currentValue[0] === 'all'
        ) {
          node.input(
            node.props.options.map((option: string | Record<string, any>) => {
              if (typeof option !== 'string') return option.value
              return option
            })
          )
        }
        previousValue = Array.isArray(node.value) ? node.value : []
      })
      node.on('commit', ({ payload }) => {
        if (skip) {
          skip = false
          return
        }
        if (!Array.isArray(payload)) return

        const previousValueHadAll = previousValue.includes('all')
        const currentValueHasAll = payload.includes('all')

        // if "all" was checked, check all
        if (!previousValueHadAll && currentValueHasAll) {
          const computedOptions = node.props.options.map(
            (option: string | Record<string, any>) => {
              if (typeof option !== 'string') return option.value
              return option
            }
          )
          node.input(computedOptions)
          previousValue = computedOptions
          return
        }

        // if "all" was unchecked, uncheck all
        if (previousValueHadAll && !currentValueHasAll) {
          node.input([])
          previousValue = []
          return
        }

        const valueMinusAll = payload.filter((value: string) => value !== 'all')
        // uncheck "all" if we have less than all items checked
        if (
          valueMinusAll.length < node.props.options.length - 1 &&
          currentValueHasAll
        ) {
          node.input(valueMinusAll)
          previousValue = valueMinusAll
          skip = true
          return
        }

        // re-check "all" if we manually check all other items
        if (
          valueMinusAll.length === node.props.options.length - 1 &&
          !currentValueHasAll
        ) {
          const computedOptions = node.props.options.map(
            (option: string | Record<string, any>) => {
              if (typeof option !== 'string') return option.value
              return option
            }
          )
          node.input(computedOptions)
          previousValue = Array.isArray(node.value) ? node.value : []
          return
        }
      })
    }

    // supporting schema functions for async input states
    const data = reactive({
      twClasses: classes,
      basicOptions: Array.from({ length: 15 }, (_, i) => `Option ${i + 1}`),
      asyncLoader: async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return await new Promise<void>(() => {})
      },
      paginatedLoader: async ({
        page,
        hasNextPage,
      }: {
        page: number
        hasNextPage: () => void
      }) => {
        const base = (page - 1) * 10
        hasNextPage()
        return Array.from({ length: 10 }, (_, i) => `Option ${base + i + 1}`)
      },
      formSubmitHandler: async (data: any) => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        alert('Form submitted (fake) — check console for data object')
        console.log('Form data:', data)
      },
      includes: (array: any[], value: any) => {
        if (!Array.isArray(array)) return false
        return array.includes(value)
      },
      checkboxPlugins: [selectAll],
      filters: [] as string[],
    })

    await Promise.all(promises)

    const inputKeys = Object.keys(schemas)

    // create friendly labels for use in tabs
    const formNames = inputKeys.map((key: string) => {
      if (key.startsWith('form/')) {
        switch (key) {
          case 'form/tshirt':
            return {
              id: key,
              name: 'Order Form',
            }
          default:
            const name = key.replace('form/', '')
            return {
              id: key,
              name: name.charAt(0).toUpperCase() + name.slice(1) + ' Form',
            }
        }
      }
      return {
        id: key,
        name: '',
      }
    })
    const filteredFormNames = formNames.filter((form) => form.name !== '')

    const forms = inputKeys.filter((schema: string) => {
      return schema.startsWith('form/')
    })
    const inputs = inputKeys.filter(
      (schema: string) => !schema.startsWith('form/')
    )

    const tabs: Record<string, string>[] = []
    if (inputs.length) {
      tabs.push({
        id: 'kitchen-sink',
        name: 'Kitchen Sink',
      })
    }
    if (forms.length) {
      tabs.push(...filteredFormNames.sort((a, b) => (a.name > b.name ? 1 : -1)))
    }
    if (tabs.length) {
      activeTab.value = tabs[0].id
    }

    // collection of all inputs to be rendered in the "kitchen sink" tab
    const kitchenSinkRenders = computed(() => {
      inputs.sort()

      const schemaDefinitions: FormKitSchemaDefinition = inputs.reduce(
        (schemaDefinitions, inputName: string) => {
          const schemaDefinition = schemas[inputName]
          schemaDefinitions.push({
            $el: 'div',
            if: '$includes($filters, "' + inputName + '")',
            attrs: {
              key: inputName,
              class: '$twClasses.inputSection',
              'data-type': inputName,
            },
            children: [
              {
                $el: 'h2',
                attrs: {
                  class: '$twClasses.inputType',
                },
                children: inputName,
              },
              {
                $el: 'div',
                attrs: {
                  class: '$twClasses.specimenGroup',
                },
                children: [
                  ...((Array.isArray(schemaDefinition)
                    ? schemaDefinition
                    : [schemaDefinition]
                  ).map((specimen) => {
                    return {
                      $el: 'div',
                      attrs: {
                        class: '$twClasses.specimen',
                      },
                      children: [specimen],
                    }
                  }) as FormKitSchemaNode[]),
                ],
              },
            ],
          })
          return schemaDefinitions
        },
        [] as FormKitSchemaNode[]
      )

      return h(
        KeepAlive,
        {},
        {
          default: () => {
            return activeTab.value === 'kitchen-sink'
              ? h(FormKitSchema, { schema: schemaDefinitions, data: data })
              : null
          },
        }
      )
    })

    const formRenders = computed(() => {
      return filteredFormNames
        .map((form) => {
          const schemaDefinition = schemas[form.id]
          return h(
            'div',
            {
              key: form.id,
            },
            activeTab.value === form.id
              ? [
                  h(
                    'div',
                    {
                      class: classes.formContainer,
                    },
                    [
                      h(FormKitSchema, {
                        schema: schemaDefinition[0],
                        data: data,
                      }),
                    ]
                  ),
                ]
              : ''
          )
        })
        .filter((form) => form.children)
    })

    const tabBar = computed(() => {
      return h(
        'div',
        {
          key: 'tab-bar',
          class: classes.tabs,
        },
        tabs.map((tab) => {
          return h(
            'span',
            {
              class: classes.tab,
              key: tab.id,
              'data-tab': tab.id,
              'data-active': activeTab.value === tab.id || undefined,
              onClick: () => {
                activeTab.value = tab.id
              },
            },
            tab.name
          )
        })
      )
    })

    const filterCheckboxes = computed(() => {
      const createCheckboxSchema = (
        inputGroup: Record<string, string | string[]>
      ) => {
        return {
          $el: 'div',
          attrs: {
            class: '$twClasses.filterGroup',
          },
          children: [
            {
              $formkit: 'checkbox',
              name: inputGroup.name,
              label: inputGroup.label,
              plugins: '$checkboxPlugins',
              value: ['all'],
              options: [
                {
                  label: 'All',
                  value: 'all',
                },
                ...(Array.isArray(inputGroup.inputs) ? inputGroup.inputs : []),
              ],
            },
          ],
        }
      }

      // render each set of checkboxes
      const filterSchema = h(FormKitSchema, {
        key: 'filter-checkboxes',
        data: data,
        schema: {
          $formkit: 'group',
          id: 'filter-checkboxes',
          children: [
            {
              $el: 'div',
              attrs: {
                class: '$twClasses.filterContainer',
              },
              children: Object.keys(inputCheckboxes.value).map((key) => {
                const inputGroup = inputCheckboxes.value[key]
                return createCheckboxSchema(inputGroup)
              }),
            },
          ],
        },
      })

      return h(
        KeepAlive,
        {},
        {
          default: () => {
            if (
              !(
                tabs.find((tab) => tab.id === 'kitchen-sink') &&
                activeTab.value === 'kitchen-sink'
              )
            ) {
              return null
            }
            return filterSchema
          },
        }
      )
    })

    return () => {
      return h(
        'div',
        {
          class: classes.container,
        },
        [
          tabs.length > 1 ? tabBar.value : undefined,
          filterCheckboxes.value,
          ...formRenders.value,
          kitchenSinkRenders.value,
        ]
      )
    }
  },
})

export default FormKitKitchenSink
