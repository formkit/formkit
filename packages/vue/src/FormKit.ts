import { error, FormKitNode, FormKitSchemaDefinition } from '@formkit/core'
import {
  h,
  ref,
  defineComponent,
  InjectionKey,
  ConcreteComponent,
  VNode,
  RendererNode,
  RendererElement,
  SetupContext,
  RenderFunction,
  VNodeProps,
  AllowedComponentProps,
  ComponentCustomProps,
  markRaw,
} from 'vue'
import { useInput } from './composables/useInput'
import { FormKitSchema } from './FormKitSchema'
import {
  FormKitInputs,
  FormKitInputSlots,
  FormKitEvents,
  InputType,
  runtimeProps,
} from '@formkit/inputs'
import { getCurrentInstance } from 'vue'

/**
 * The type definition for the FormKit’s slots, this is not intended to be used
 * directly.
 * @public
 */
export type Slots<Props extends FormKitInputs<Props>> =
  InputType<Props> extends keyof FormKitInputSlots<Props>
    ? FormKitInputSlots<Props>[InputType<Props>]
    : {}

/**
 * The TypeScript definition for the FormKit component.
 * @public
 */
export type FormKitComponent = <Props extends FormKitInputs<Props>>(
  props: Props & VNodeProps & AllowedComponentProps & ComponentCustomProps,
  context?: Pick<FormKitSetupContext<Props>, 'attrs' | 'emit' | 'slots'>,
  setup?: FormKitSetupContext<Props>
) => VNode<
  RendererNode,
  RendererElement,
  {
    [key: string]: any
  }
> & { __ctx?: FormKitSetupContext<Props> }

/**
 * Type definition for the FormKit component Vue context.
 * @public
 */
export interface FormKitSetupContext<Props extends FormKitInputs<Props>> {
  props: {} & Props
  expose(exposed: {}): void
  attrs: any
  slots: Slots<Props>
  emit: FormKitEvents<Props>
}

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
 * The symbol that represents the formkit component callback injection value.
 * This is used by tooling to know which component "owns" this node — some
 * effects are linked to that component, for example, hot module reloading.
 *
 * @internal
 */
export const componentSymbol: InjectionKey<(node: FormKitNode) => void> =
  Symbol('FormKitComponentCallback')

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
 * The actual runtime setup function for the FormKit component.
 *
 * @param props - The props passed to the component.
 * @param context - The context passed to the component.
 */
function FormKit<Props extends FormKitInputs<Props>>(
  props: Props,
  context: SetupContext<{}, {}>
): RenderFunction {
  const node = useInput<Props, any>(props, context)
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
  if (__DEV__ && import.meta.hot) {
    const instance = getCurrentInstance()
    let initPreserve: boolean | undefined
    import.meta.hot?.on('vite:beforeUpdate', () => {
      initPreserve = node.props.preserve
      node.props.preserve = true
    })
    import.meta.hot?.on('vite:afterUpdate', () => {
      instance?.proxy?.$forceUpdate()
      node.props.preserve = initPreserve
    })
  }
  const schema = ref<FormKitSchemaDefinition>([])
  let memoKey: string | undefined = node.props.definition.schemaMemoKey
  const generateSchema = () => {
    const schemaDefinition = node.props?.definition?.schema
    if (!schemaDefinition) error(601, node)
    if (typeof schemaDefinition === 'function') {
      currentSchemaNode = node
      schema.value = schemaDefinition({ ...(props.sectionsSchema || {}) })
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

  // If someone emits the schema event, we re-generate the schema
  if (!isServer) {
    node.on('schema', () => {
      memoKey += '♻️'
      generateSchema()
    })
  }

  context.emit('node', node)
  const definitionLibrary = node.props.definition.library as
    | Record<string, ConcreteComponent>
    | undefined

  const library = {
    FormKit: markRaw(formkitComponent),
    ...definitionLibrary,
    ...(props.library ?? {}),
  }

  /**
   * Emit the mounted event.
   */
  function didMount() {
    node.emit('mounted')
  }

  // // Expose the FormKitNode to template refs.
  context.expose({ node })
  return () =>
    h(
      FormKitSchema,
      {
        schema: schema.value,
        data: node.context,
        onMounted: didMount,
        library,
        memoKey,
      },
      { ...context.slots }
    )
}

/**
 * The root FormKit component. Use it to craft all inputs and structure of your
 * forms. For example:
 *
 * ```vue
 * <FormKit
 *  type="text"
 *  label="Name"
 *  help="Please enter your name"
 *  validation="required|length:2"
 * />
 * ```
 *
 * @public
 */
export const formkitComponent = /* #__PURE__ */ defineComponent(
  FormKit as any,
  {
    props: runtimeProps as any,
    inheritAttrs: false,
  }
) as unknown as FormKitComponent

// ☝️ We need to cheat here a little bit since our runtime props and our
// public prop interface are different (we treat some attrs as props to allow
// for runtime "prop" creation).

export default formkitComponent
