import { error, FormKitNode, FormKitSchemaDefinition } from '@formkit/core'
import {
  h,
  ref,
  defineComponent,
  InjectionKey,
  ConcreteComponent,
  SetupContext,
} from 'vue'
import { useInput } from './composables/useInput'
import { FormKitSchema } from './FormKitSchema'
import { props } from './props'

/**
 * Flag to determine if we are running on the server.
 */
const isServer = typeof window === 'undefined'

/**
 * The symbol that represents the formkit parent injection value.
 *
 * @public
 */
export const parentSymbol: InjectionKey<FormKitNode> = Symbol('FormKitParent')

/**
 * This variable is set to the node that is currently having its schema created.
 *
 * @internal
 */
let currentSchemaNode: FormKitNode | null = null

/**
 * Returns the node that is currently having its schema created.
 *
 * @public
 */
export const getCurrentSchemaNode = () => currentSchemaNode

/**
 * The root FormKit component.
 *
 * @public
 */
export const FormKit = defineComponent({
  props,
  emits: {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    input: (_value: any, _node: FormKitNode) => true,
    inputRaw: (_value: any, _node: FormKitNode) => true,
    'update:modelValue': (_value: any) => true,
    node: (node: FormKitNode) => !!node,
    submit: (_data: any, _node?: FormKitNode) => true,
    submitRaw: (_event: Event, _node?: FormKitNode) => true,
    submitInvalid: (_node?: FormKitNode) => true,
    /* eslint-enable @typescript-eslint/no-unused-vars */
  },
  inheritAttrs: false,
  setup(props, context) {
    const node = useInput(props as any, context as SetupContext<any>)
    if (!node.props.definition) error(600, node)
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
    const schema = ref<FormKitSchemaDefinition>([])
    let memoKey: string | undefined = node.props.definition.schemaMemoKey
    const generateSchema = () => {
      const schemaDefinition = node.props?.definition?.schema
      if (!schemaDefinition) error(601, node)
      if (typeof schemaDefinition === 'function') {
        currentSchemaNode = node
        schema.value = schemaDefinition({ ...props.sectionsSchema })
        currentSchemaNode = null
        if (
          (memoKey && props.sectionsSchema) ||
          ('memoKey' in schemaDefinition &&
            typeof schemaDefinition.memoKey === 'string')
        ) {
          memoKey =
            (memoKey ?? schemaDefinition?.memoKey) +
            JSON.stringify(props.sectionsSchema)
        }
      } else {
        schema.value = schemaDefinition
      }
    }
    generateSchema()

    // // If someone emits the schema event, we re-generate the schema
    if (!isServer) {
      node.on('schema', generateSchema)
    }

    context.emit('node', node)
    const library = node.props.definition.library as
      | Record<string, ConcreteComponent>
      | undefined

    // // Expose the FormKitNode to template refs.
    context.expose({ node })
    return () =>
      h(
        FormKitSchema,
        { schema: schema.value, data: node.context, library, memoKey },
        { ...context.slots }
      )
  },
})

export default FormKit
