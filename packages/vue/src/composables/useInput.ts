import { parentSymbol } from '../FormKit'
import {
  createNode,
  FormKitNode,
  warn,
  FormKitClasses,
  FormKitOptions,
} from '@formkit/core'
import { nodeProps, except, camel, extend, only } from '@formkit/utils'
import { FormKitTypeDefinition } from '@formkit/inputs'
import { watchEffect, inject, provide, watch, SetupContext } from 'vue'
import { configSymbol } from '../plugin'
import { minConfig } from '../plugin'

interface FormKitComponentProps {
  type?: string
  name?: string
  validation?: any
  modelValue?: any
  errors: string[]
  config: Record<string, any>
  classes?: Record<string, string | Record<string, boolean> | FormKitClasses>
}

/**
 * Props that are extracted from the attrs object.
 * TODO: Currently local, this should probably exported to a inputs or another
 * package.
 */
const pseudoProps = [
  'help',
  'label',
  'options',
  /^[a-z]+(?:-behavior|Behavior)$/,
]

/**
 * Given some props, map those props to individualized props internally.
 * @param node - A formkit node
 * @param props - Some props that may include a classes object
 */
function classesToNodeProps(
  node: FormKitNode<any>,
  props: Record<string, any>
) {
  if (props.classes) {
    Object.keys(props.classes).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      node.props[`_${key}Class`] = props.classes![key]
    })
  }
}

/**
 * A composable for creating a new FormKit node.
 * @param type - The type of node (input, group, list)
 * @param attrs - The FormKit "props" — which is really the attrs list.
 * @returns
 * @public
 */
export function useInput(
  input: FormKitTypeDefinition,
  props: FormKitComponentProps,
  context: SetupContext<any>
): FormKitNode<any> {
  const type = input.type

  /**
   * The configuration options, these are provided by either the plugin or by
   * explicit props.
   */
  const config = inject(configSymbol, minConfig)

  /**
   * The parent node.
   */
  const parent = inject(parentSymbol, null)

  /**
   * Define the initial component
   */
  let value: any =
    props.modelValue !== undefined ? props.modelValue : context.attrs.value
  if (value === undefined) {
    if (type === 'input') value = ''
    if (type === 'group') value = {}
    if (type === 'list') value = []
  }

  const propNames = pseudoProps.concat(input.props || [])

  /**
   * Creates the node's initial props from the context, props, and definition
   * @returns
   */
  function createInitialProps(): Record<string, any> {
    const initialProps: Record<string, any> = nodeProps(props)
    const attrs = except(nodeProps(context.attrs), propNames)
    initialProps.attrs = attrs
    const propValues = only(nodeProps(context.attrs), propNames)
    for (const propName in propValues) {
      initialProps[camel(propName)] = propValues[propName]
    }
    const classesProps = { props: {} }
    classesToNodeProps(classesProps as FormKitNode, props)
    Object.assign(initialProps, classesProps.props)
    initialProps.definition = input
    return initialProps
  }

  /**
   * Create the FormKitNode.
   */
  const node = createNode(
    extend(config.nodeOptions || {}, {
      type,
      name: props.name || undefined,
      value,
      parent,
      config: props.config,
      props: createInitialProps(),
    }) as Partial<FormKitOptions>
  ) as FormKitNode<any>

  /* Splits Classes object into discrete props for each key */
  watchEffect(() => classesToNodeProps(node, props))

  /**
   * The props object already has properties even if they start as "undefined"
   * so we can loop over them and individual watchEffect to prevent responding
   * inappropriately.
   */
  const passThrough = nodeProps(props)
  for (const prop in passThrough) {
    watchEffect(() => {
      node.props[prop] = props[prop as keyof FormKitComponentProps]
    })
  }

  /**
   * Watch "pseudoProp" attributes explicitly.
   */
  const pseudoPropsValues = only(nodeProps(context.attrs), propNames)
  for (const prop in pseudoPropsValues) {
    const camelName = camel(prop)
    watchEffect(() => {
      node.props[camelName] = context.attrs[prop]
    })
  }

  /**
   * Watch and dynamically set attribute values, those values that are not
   * props and are not pseudoProps
   */
  watchEffect(() => {
    const attrs = except(nodeProps(context.attrs), propNames)
    node.props.attrs = attrs
  })

  /**
   * Add any/all "prop" errors to the store.
   */
  watchEffect(() => {
    // Remove any that are not in the set
    node.store.filter(
      (message) => props.errors.includes(message.value as string),
      'error'
    )
    props.errors.forEach((error) => {
      node.store.set({
        key: error,
        type: 'error',
        value: error,
        visible: true,
        blocking: false,
        meta: {},
      })
    })
  })

  /**
   * Watch the config prop for any changes.
   */
  watchEffect(() => Object.assign(node.config, props.config))

  /**
   * Produce another parent object.
   */
  if (node.type !== 'input') {
    provide(parentSymbol, node)
  }

  /**
   * Explicitly watch the input value, and emit changes (lazy)
   */
  watch(
    () => node.context?.value,
    () => {
      // Emit the values after commit
      context.emit('input', node.context?.value)
      context.emit('update:modelValue', node.context?.value)
    }
  )

  /**
   * Enabled support for v-model, using this for groups/lists is not recommended
   */
  if (props.modelValue !== undefined) {
    watch(
      () => props.modelValue,
      (value) => {
        if (node.type !== 'input') warn(678)
        node.input(value, false)
      },
      {
        deep: true,
      }
    )
  }

  return node
}
