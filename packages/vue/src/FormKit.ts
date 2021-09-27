import { h } from 'examples/node_modules/vue/dist/vue'
import { has } from 'packages/utils/dist'
import { defineComponent } from 'vue'
import { useLibrary, useInput } from './composables/index'
import { FormKitSchema } from './FormKitSchema'

const FormKit = defineComponent({
  props: {
    type: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const library = useLibrary()
    const inputType = has(library, props.type) ? library[props.type] : null
    if (!inputType)
      throw new Error(`The input type ${props.type} is not in the library.`)
    const [data] = useInput(inputType.type, props.name)
    return () => h(FormKitSchema, { schema: inputType.schema, data })
  },
})

export default FormKit
