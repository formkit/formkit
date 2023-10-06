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
  async setup() {
    const inputList = await fetchInputList()
    const inputs: Record<string, FormKitSchemaDefinition[]> = {}

    const coreInputPromises = inputList.core.map(async (input: string) => {
      const response = await fetchInputSchema(input)
      inputs[input] = response
    })
    // const proInputPromises = inputList.pro.map(async (input: string) => {
    //   const response = await fetchInputSchema(input)
    //   inputs[input] = response
    // })

    await Promise.all([
      ...coreInputPromises,
      // ...proInputPromises
    ])

    const inputKeys = Object.keys(inputs).sort()
    const inputComponents = inputKeys.map((input: string) => {
      const schemas = inputs[input]
      return schemas.map((schema: FormKitSchemaDefinition) => {
        return h(FormKitSchema, {
          schema,
        })
      })
    })

    return () => {
      return h('div', inputComponents)
    }
  },
})

export default FormKitKitchenSink
