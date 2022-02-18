import { error, FormKitNode, FormKitGroupValue } from '@formkit/core'
import { h, defineComponent, InjectionKey, ConcreteComponent } from 'vue'
import { useInput } from './composables/useInput'
import { FormKitSchema } from './FormKitSchema'
import { props } from './props'

/**
 * The symbol that represents the formkit parent injection value.
 */
export const parentSymbol: InjectionKey<FormKitNode> = Symbol('FormKitParent')

/**
 * The root FormKit component.
 * @public
 */
const FormKit = defineComponent({
  props,
  emits: {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    input: (_value: any) => true,
    'update:modelValue': (_value: any) => true,
    node: (node: FormKitNode) => !!node,
    submit: (_data: FormKitGroupValue) => true,
    submitRaw: (_event: Event) => true,
    /* eslint-enable @typescript-eslint/no-unused-vars */
  },
  inheritAttrs: false,
  setup(props, context) {
    const node = useInput(props, context)
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
    const schemaDefinition = node.props.definition.schema
    if (!schemaDefinition) error(601, node)
    const schema =
      typeof schemaDefinition === 'function'
        ? schemaDefinition({ ...props.sectionsSchema })
        : schemaDefinition
    context.emit('node', node)
    const library = node.props.definition.library as
      | Record<string, ConcreteComponent>
      | undefined
    return () =>
      h(
        FormKitSchema,
        { schema, data: node.context, library },
        { ...context.slots }
      )
  },
})

export default FormKit
