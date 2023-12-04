import { h, defineComponent, ref, computed } from 'vue'
import { FormKitSchemaDefinition } from '@formkit/core'
import { FormKitSchema } from './index'

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
    mb-8
  `,
  tab: `
    formkit-kitchen-sink-tab
    inline-block
    mr-4
    cursor-pointer
    px-4
    py-2
    border
    border-neutral-100
    text-neutral-800
    rounded
    data-[active]:bg-neutral-800
    data-[active]:text-neutral-50
    hover:bg-neutral-100
    hover:text-neutral-900
    dark:border-neutral-800
    dark:text-neutral-50
    dark:data-[active]:bg-neutral-100
    dark:data-[active]:text-neutral-800
    dark:hover:bg-neutral-800
    dark:hover:text-neutral-50
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
    inputList = Object.keys(inputList).length
      ? inputList
      : await fetchInputList()
    const promises = []
    const activeTab = ref('')

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

    // supporting schema functions for async input states
    const data = {
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
    }

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
      if (activeTab.value !== 'kitchen-sink') return []
      return inputs.sort().map((inputName: string) => {
        const schemaDefinitions = schemas[inputName]
        if (!schemaDefinitions) {
          return
        }
        const schemaRenders = schemaDefinitions.map(
          (schema: FormKitSchemaDefinition) => {
            return h(
              'div',
              {
                class: classes.specimen,
              },
              [
                h(FormKitSchema, {
                  schema: schema,
                  data: data,
                }),
              ]
            )
          }
        )
        return h(
          'div',
          {
            key: inputName,
            class: classes.inputSection,
            'data-type': inputName,
          },
          [
            h(
              'span',
              {
                class: classes.inputType,
              },
              inputName
            ),
            h(
              'div',
              {
                class: classes.specimenGroup,
              },
              schemaRenders
            ),
          ]
        )
      })
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

    return () => {
      return h(
        'div',
        {
          class: classes.container,
        },
        [
          tabs.length > 1 ? tabBar.value : undefined,
          ...formRenders.value,
          ...kitchenSinkRenders.value,
        ]
      )
    }
  },
})

export default FormKitKitchenSink
