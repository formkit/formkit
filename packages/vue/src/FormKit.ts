import { FormKitNode } from '@formkit/core'
import { FormKitSchemaNode, FormKitSchemaCondition } from '@formkit/schema'
import { h, defineComponent, InjectionKey, PropType, watchEffect } from 'vue'
import { useInput } from './composables/useInput'
import { useLibrary } from './composables/useLibrary'
import { FormKitSchema } from './FormKitSchema'

/**
 * The symbol that represents the formkit parent injection value.
 */
export const parentSymbol: InjectionKey<FormKitNode> = Symbol('FormKitParent')

/**
 * The root FormKit component.
 * @public
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
  emits: ['value'],
  inheritAttrs: false,
  setup(props, context) {
    const libInput = useLibrary(props.type)
    const schema =
      typeof libInput.schema === 'function'
        ? libInput.schema(props.schema)
        : libInput.schema
    const [data] = useInput(libInput.type, props, context)
    watchEffect(() => context.emit('value', data.value))
    return () => h(FormKitSchema, { schema, data }, { ...context.slots })
  },
})

export default FormKit
