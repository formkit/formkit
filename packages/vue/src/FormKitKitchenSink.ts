import { h, defineComponent } from 'vue'
import { FormKitSchemaDefinition } from '@formkit/core'
import { FormKitSchema } from './FormKitSchema'

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
  },
  async setup(props) {
    const inputList = await fetchInputList()
    const inputs: Record<string, FormKitSchemaDefinition[]> = {}
    const promises = []

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

    await Promise.all(promises)

    const inputKeys = Object.keys(inputs).sort()
    const inputComponents = inputKeys.map((input: string) => {
      const schemas = inputs[input]
      const schemaRenders = schemas.map((schema: FormKitSchemaDefinition) => {
        return h(
          'div',
          {
            class: 'formkit-schema-section',
            'data-type': input,
          },
          [
            h(FormKitSchema, {
              schema: schema,
            }),
          ]
        )
      })
      return h('div', { class: 'formkit-kitchen-sink' }, [
        h('span', { class: 'formkit-input-type' }, input),
        h('div', schemaRenders),
      ])
    })

    return () => {
      return h('div', inputComponents)
    }
  },
})

export default FormKitKitchenSink
