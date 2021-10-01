import { FormKitNode } from '@formkit/core'
import { FormKitSchemaNode, FormKitSchemaCondition } from '@formkit/schema'
import { h, defineComponent, InjectionKey, PropType } from 'vue'
import { useLibrary, useInput } from './composables/index'
import { FormKitSchema } from './FormKitSchema'

/**
 * The symbol that represents the formkit parent injection value.
 */
export const parentSymbol: InjectionKey<FormKitNode> = Symbol('FormKitParent')

/**
 * The root FormKit component.
 */
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
    schema: {
      type: Object as PropType<
        Record<string, Partial<FormKitSchemaNode> | FormKitSchemaCondition>
      >,
      default: {},
    },
  },
  inheritAttrs: false,
  setup(props, context) {
    const libInput = useLibrary(props.type)
    const schema =
      typeof libInput.schema === 'function'
        ? libInput.schema(props.schema)
        : libInput.schema
    const [data] = useInput(libInput.type, props, context)
    return () => {
      return [
        h(FormKitSchema, { schema, data }, { ...context.slots }),
        h(
          'pre',
          {},
          typeof data.value === 'string'
            ? data.value
            : JSON.stringify(data.value)
        ),
      ]
    }
  },
})

export default FormKit
