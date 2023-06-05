import { error, FormKitNode, FormKitSchemaDefinition } from '@formkit/core'
import {
  h,
  ref,
  defineComponent,
  InjectionKey,
  ConcreteComponent,
  FunctionalComponent,
} from 'vue'
import { useInput } from './composables/useInput'
import { FormKitSchema } from './FormKitSchema'
// import { props } from './props'
import {
  FormKitInputs,
  FormKitInputEvents,
  FormKitInputSlots,
  FormKitBaseEvents,
  runtimeProps,
} from '@formkit/inputs'

// export type Inputs =
//   | FormKitInputs[keyof FormKitInputs]
//   | Exclude<Partial<FormKitInputs['text']>, 'type'>

// type Events<Props extends FormKitInputs<Props>> =
//   Props['type'] extends keyof FormKitInputEvents<Props>
//     ? FormKitInputEvents<Props>[Props['type']] & FormKitBaseEvents<Props>
//     : FormKitBaseEvents<Props>

type Slots<Props extends FormKitInputs<Props>> =
  Props['type'] extends keyof FormKitInputSlots<Props>
    ? FormKitInputSlots<Props>[Props['type']]
    : {}

// type RecordToEventFns<T extends Record<string, (...args: any[]) => any>> = {
//   (event: keyof T, ...args: Parameters<T[keyof T]>): ReturnType<T[keyof T]>
// }

interface FormKit {
  <P extends FormKitInputs<P>>(): FunctionalComponent<
    P,
    FormKitBaseEvents<P>,
    Slots<P>
  >
}
const y: FormKitBaseEvents<FormKitInputs<{ type: 'text'; value: string }>> =
  {} as FormKitBaseEvents<FormKitInputs<{ type: 'text'; value: string }>>
const x: Record<string, (...args: any[]) => any> = y

x

// /**
//  * The TypeScript definition for the FormKit component.
//  */
// export type FormKit = <P extends FormKitInputs>(
//   props: P & VNodeProps & AllowedComponentProps & ComponentCustomProps,
//   context?: Pick<FormKitSetupContext<P>, "attrs" | "emit" | "slots">,
//   setup?: FormKitSetupContext<P>
// ) => VNode<
//   RendererNode,
//   RendererElement,
//   {
//     [key: string]: any
//   }
// > & { __ctx?: FormKitSetupContext<P> }

// /**
//  * Type definition for the FormKit component Vue context.
//  */
// interface FormKitSetupContext<P extends FormKitInputs> {
//   props: {} & P
//   expose(exposed: {}): void
//   attrs: any
//   slots: Slots<P>
//   emit: RecordToEventFns<Events<P>>
// }

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
export const formkitComponent = defineComponent(
  function setup<P extends FormKitInputs>(
    props: P,
    context: FormKitSetupContext<P>
  ) {
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
  { props: runtimeProps, inheritAttrs: false }
) as FormKit satisfies FunctionalComponent<any, any, any>
// ☝️ Type inference for generic props to their slot and event types is not
// yet fully supported as of this release, but this allows us to have nearly
// complete type safety for the FormKit component itself with discriminated
// union types.

export default formkitComponent
