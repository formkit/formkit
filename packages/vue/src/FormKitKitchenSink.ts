import { h, defineComponent } from 'vue'
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
    const inputs: Record<string, FormKitSchemaDefinition[]> = {}
    const promises = []

    if (!props.schemas) {
      const coreInputPromises = inputList.core.map(async (input: string) => {
        const response = await fetchInputSchema(input)
        inputs[input] = response
      })
      promises.push(...coreInputPromises)

      if (props.pro) {
        const proInputPromises = inputList.pro.map(async (input: string) => {
          const response = await fetchInputSchema(input)
          inputs[input] = response
        })
        promises.push(...proInputPromises)
      }
    } else {
      const schemaPromises = props.schemas.map(async (value: unknown) => {
        const response = await fetchInputSchema(`${value}`)
        inputs[`${value}`] = response
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

    const inputKeys = Object.keys(inputs).sort()
    const inputComponents = inputKeys.map((input: string) => {
      const schemas = inputs[input]
      const schemaRenders = schemas.map((schema: FormKitSchemaDefinition) => {
        return h(
          'div',
          {
            class: 'formkit-specimen',
          },
          [
            h(FormKitSchema, {
              schema: schema,
              data: data,
            }),
          ]
        )
      })
      return h('div', { class: 'formkit-input-section', 'data-type': input }, [
        h('span', { class: 'formkit-input-type' }, input),
        h('div', { class: 'formkit-specimen-group' }, schemaRenders),
      ])
    })

    return () => {
      return h(
        'div',
        {
          class: 'formkit-kitchen-sink',
        },
        inputComponents
      )
    }
  },
})

export default FormKitKitchenSink
