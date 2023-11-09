import { h, defineComponent, ref, computed } from 'vue'
import { FormKitSchemaDefinition } from '@formkit/core'
import { FormKitSchema } from './index'

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
    pro: {
      type: Boolean,
      default: true,
    },
    schemas: {
      type: Array,
      required: false,
    },
  },
  async setup(props) {
    const inputList = await fetchInputList()
    const schemas: Record<string, FormKitSchemaDefinition[]> = {}
    const promises = []
    const activeTab = ref('')

    if (!props.schemas) {
      const coreInputPromises = inputList.core.map(async (schema: string) => {
        const response = await fetchInputSchema(schema)
        schemas[schema] = response
      })
      promises.push(...coreInputPromises)

      if (props.pro) {
        const proInputPromises = inputList.pro.map(async (schema: string) => {
          const response = await fetchInputSchema(schema)
          schemas[schema] = response
        })
        promises.push(...proInputPromises)
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
      tabs.push(...filteredFormNames)
    }
    if (tabs.length) {
      activeTab.value = tabs[0].id
    }

    // collection of all inputs to be rendered in the "kitchen sink" tab
    const kitchenSinkRenders = inputs.map((inputName: string) => {
      const schemaDefinitions = schemas[inputName]
      const schemaRenders = schemaDefinitions.map(
        (schema: FormKitSchemaDefinition) => {
          return h(
            'div',
            {
              class: 'formkit-specimen flex flex-col p-2 max-w-[75vw]',
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
          class: 'formkit-input-section mr-[min(350px,25vw)]',
          'data-type': inputName,
        },
        [
          h(
            'span',
            {
              class: `
                formkit-input-type block font-bold text-neutral-900 border-b border-neutral-100 text-3xl mb-8 pb-2 capitalize
                dark:border-neutral-800 dark:text-neutral-50
            `,
            },
            inputName
          ),
          h(
            'div',
            {
              class:
                'formkit-specimen-group grid grid-cols-[repeat(auto-fit,400px)] mb-16',
            },
            schemaRenders
          ),
        ]
      )
    })

    const formRenders = computed(() => {
      return filteredFormNames.map((form) => {
        const schemaDefinition = schemas[form.id]
        return h(
          'div',
          {},
          activeTab.value === form.id
            ? [
                h(
                  'div',
                  {
                    class:
                      'w-full bg-white rounded border border-neutral-100 shadow-lg max-w-[800px] p-[min(5vw,5rem)] dark:bg-neutral-900 dark:border-neutral-800 dark:shadow-3xl',
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
    })

    const tabBar = computed(() => {
      return h(
        'div',
        {
          class: 'formkit-kitchen-sink-tabs mt-4 mb-8',
        },
        tabs.map((tab) => {
          return h(
            'span',
            {
              class:
                'formkit-kitchen-sink-tab inline-block mr-4 cursor-pointer px-4 py-2 border border-neutral-100 text-neutral-800 rounded data-[active]:bg-neutral-800 data-[active]:text-neutral-50 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-50 dark:data-[active]:bg-neutral-100 dark:data-[active]:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-50',
              'data-tab': tab.id,
              'data-active': activeTab.value === tab.id || undefined,
              onClick: () => {
                console.log(tab.id)
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
          class: 'formkit-kitchen-sink my-12',
        },
        [
          tabs.length > 1 ? tabBar.value : '',
          h(
            'div',
            {
              class: 'formkit-inputs',
            },
            kitchenSinkRenders.length && activeTab.value === 'kitchen-sink'
              ? kitchenSinkRenders
              : []
          ),
          ...formRenders.value,
        ]
      )
    }
  },
})

export default FormKitKitchenSink
