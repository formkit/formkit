import {
  error,
  FormKitNode,
  FormKitPlugin,
  FormKitClasses,
  FormKitSchemaNode,
  FormKitSchemaCondition,
} from '@formkit/core'
import { h, defineComponent, InjectionKey, PropType } from 'vue'
import { useInput } from './composables/useInput'
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
    config: {
      type: Object as PropType<Record<string, any>>,
      default: {},
    },
    classes: {
      type: Object as PropType<
        Record<string, string | Record<string, boolean> | FormKitClasses>
      >,
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
    id: {
      type: String,
      required: false,
    },
    modelValue: {
      required: false,
    },
    name: {
      type: String,
      required: false,
    },
    plugins: {
      type: Array as PropType<FormKitPlugin[]>,
      default: [],
    },
    schema: {
      type: Object as PropType<
        Record<string, Partial<FormKitSchemaNode> | FormKitSchemaCondition>
      >,
      default: {},
    },
    type: {
      type: String,
      default: 'text',
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
          | ((ctx: { node: FormKitNode; name: string; args: any[] }) => string)
        >
      >,
      required: false,
    },
    validationRules: {
      type: Object as PropType<
        Record<string, (node: FormKitNode) => boolean | Promise<boolean>>
      >,
      required: false,
    },
    validationLabel: {
      type: [String, Function] as PropType<
        string | ((node: FormKitNode) => string)
      >,
      required: false,
    },
    ignore: {
      type: [String, Boolean],
      default: false,
    },
  },
  emits: {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    input: (_value: any) => true,
    'update:modelValue': (_value: any) => true,
    node: (node: FormKitNode) => !!node,
    /* eslint-enable @typescript-eslint/no-unused-vars */
  },
  inheritAttrs: false,
  setup(props, context) {
    const node = useInput(props, context)
    if (!node.props.definition) error(990)
    if (node.props.definition.component) {
      return () =>
        h(
          node.props.definition?.component as any,
          {
            context: node.context,
          },
          { ...context.slots }
        )
    }
    const schemaDefinition = node.props.definition.schema
    if (!schemaDefinition) error(991)
    const schema =
      typeof schemaDefinition === 'function'
        ? schemaDefinition(props.schema)
        : schemaDefinition
    context.emit('node', node)
    return () =>
      h(FormKitSchema, { schema, data: node.context }, { ...context.slots })
  },
})

export default FormKit
