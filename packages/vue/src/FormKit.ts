import {
  // error,
  FormKitNode,
  // FormKitSchemaCondition,
  // FormKitSchemaNode,
} from '@formkit/core'
import {
  // h,
  // ref,
  defineComponent,
  InjectionKey,
  // ConcreteComponent,
  SetupContext,
} from 'vue'
import { useInput } from './composables/useInput'
// import { FormKitSchema } from './FormKitSchema'
import { props } from './props'
import { getCurrentInstance } from 'vue'

/**
 * The symbol that represents the formkit parent injection value.
 *
 * @public
 */
export const parentSymbol: InjectionKey<FormKitNode> = Symbol('FormKitParent')

const cleanup = new FinalizationRegistry<unknown>(() => {
  console.log('Did finalize')
})

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
    cleanup.register(getCurrentInstance()!, 'id')
    const node = useInput(props, context as SetupContext<any>)
    // if (!node.props.definition) error(600, node)
    // if (node.props.definition.component) {
    //   return () =>
    //     h(
    //       node.props.definition?.component as any,
    //       {
    //         context: node.context,
    //       },
    //       { ...context.slots }
    //     )
    // }
    // const schema = ref<FormKitSchemaCondition | FormKitSchemaNode[]>([])
    // const generateSchema = () => {
    //   const schemaDefinition = node.props?.definition?.schema
    //   if (!schemaDefinition) error(601, node)
    //   schema.value =
    //     typeof schemaDefinition === 'function'
    //       ? schemaDefinition({ ...props.sectionsSchema })
    //       : schemaDefinition
    // }
    // generateSchema()

    // // If someone emits the schema event, we re-generate the schema
    // node.on('schema', generateSchema)

    // context.emit('node', node)
    // const library = node.props.definition.library as
    //   | Record<string, ConcreteComponent>
    //   | undefined

    // // Expose the FormKitNode to template refs.
    // context.expose({ node })
    return () => node.name
    // return () =>
    //   h(
    //     FormKitSchema,
    //     { schema: schema.value, data: node.context, library },
    //     { ...context.slots }
    //   )
  },
})

export default FormKit
