import { FormKitNode, FormKitClasses } from '@formkit/core'
import { FormKitSchemaNode, FormKitSchemaCondition } from '@formkit/schema'
import { h, defineComponent, InjectionKey, PropType } from 'vue'
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
      default: 'text',
    },
    name: {
      type: String,
      required: false,
    },
    delay: {
      type: Number,
      required: false,
    },
    errors: {
      type: Array as PropType<string[]>,
      default: [],
    },
    schema: {
      type: Object as PropType<
        Record<string, Partial<FormKitSchemaNode> | FormKitSchemaCondition>
      >,
      default: {},
    },
    config: {
      type: Object as PropType<Record<string, any>>,
      default: {},
    },
    validation: {
      type: [String, Array] as PropType<
        string | Array<[rule: string, ...args: any]>
      >,
      required: false,
    },
    validationMessages: {
      type: Object as PropType<
        Record<
          string,
          | string
          | ((ctx: {
              node: FormKitNode<any>
              name: string
              args: any[]
            }) => string)
        >
      >,
      required: false,
    },
    validationRules: {
      type: Object as PropType<
        Record<string, (node: FormKitNode<any>) => boolean | Promise<boolean>>
      >,
      required: false,
    },
    validationLabel: {
      type: [String, Function] as PropType<
        string | ((node: FormKitNode<any>) => string)
      >,
      required: false,
    },
    modelValue: {
      required: false,
    },
    classes: {
      type: Object as PropType<
        Record<string, string | Record<string, boolean> | FormKitClasses>
      >,
      required: false,
    },
  },
  emits: {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    input: (_value: any) => true,
    'update:modelValue': (_value: any) => true,
    node: (node: FormKitNode<any>) => !!node,
    /* eslint-enable @typescript-eslint/no-unused-vars */
  },
  inheritAttrs: false,
  setup(props, context) {
    const libInput = useLibrary(props.type)
    const schema =
      typeof libInput.schema === 'function'
        ? libInput.schema(props.schema)
        : libInput.schema
    const node = useInput(libInput, props, context)
    context.emit('node', node)
    return () =>
      h(FormKitSchema, { schema, data: node.context }, { ...context.slots })
  },
})

export default FormKit
