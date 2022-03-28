import { parentSymbol } from '../FormKit'
import {
  error,
  createNode,
  FormKitNode,
  FormKitClasses,
  FormKitOptions,
  FormKitPlugin,
  FormKitMessage,
  createMessage,
  FormKitTypeDefinition,
} from '@formkit/core'
import {
  nodeProps,
  except,
  camel,
  extend,
  only,
  kebab,
  cloneAny,
  slugify,
} from '@formkit/utils'
import {
  watchEffect,
  inject,
  provide,
  watch,
  SetupContext,
  onUnmounted,
  getCurrentInstance,
} from 'vue'
import { optionsSymbol } from '../plugin'
import { FormKitGroupValue } from 'packages/core/src'

interface FormKitComponentProps {
  type?: string | FormKitTypeDefinition
  name?: string
  validation?: any
  modelValue?: any
  parent?: FormKitNode
  errors: string[]
  inputErrors: Record<string, string | string[]>
  index?: number
  config: Record<string, any>
  classes?: Record<string, string | Record<string, boolean> | FormKitClasses>
  plugins: FormKitPlugin[]
}

interface FormKitComponentListeners {
  onSubmit?: (payload?: FormKitGroupValue) => Promise<unknown> | unknown
  onSubmitRaw?: (event?: Event) => unknown
}

/**
 * Props that are extracted from the attrs object.
 * TODO: Currently local, this should probably exported to a inputs or another
 * package.
 */
const pseudoProps = [
  'help',
  'label',
  'ignore',
  'disabled',
  'preserve',
  /^[a-z]+(?:-visibility|Visibility)$/,
  /^[a-zA-Z-]+(?:-class|Class)$/,
]

/**
 * Given some props, map those props to individualized props internally.
 * @param node - A formkit node
 * @param props - Some props that may include a classes object
 */
function classesToNodeProps(node: FormKitNode, props: Record<string, any>) {
  if (props.classes) {
    Object.keys(props.classes).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      node.props[`_${key}Class`] = props.classes![key]
    })
  }
}

/**
 * Extracts known FormKit listeners.
 * @param props - Extract known FormKit listeners.
 * @returns
 */
function onlyListeners(
  props: Record<string, unknown> | null | undefined
): FormKitComponentListeners {
  if (!props) return {}
  const knownListeners = ['Submit', 'SubmitRaw'].reduce(
    (listeners, listener) => {
      const name = `on${listener}`
      if (name in props) {
        if (typeof props[name] === 'function') {
          listeners[name] = props[name] as CallableFunction
        }
      }
      return listeners
    },
    {} as Record<string, CallableFunction>
  )
  return knownListeners as FormKitComponentListeners
}

/**
 * A composable for creating a new FormKit node.
 * @param type - The type of node (input, group, list)
 * @param attrs - The FormKit "props" — which is really the attrs list.
 * @returns
 * @public
 */
export function useInput(
  props: FormKitComponentProps,
  context: SetupContext<any>,
  options: FormKitOptions = {}
): FormKitNode {
  /**
   * The configuration options, these are provided by either the plugin or by
   * explicit props.
   */
  const config = Object.assign({}, inject(optionsSymbol) || {}, options)

  /**
   * The current instance.
   */
  const instance = getCurrentInstance()

  /**
   * Extracts the listeners.
   */
  const listeners = onlyListeners(instance?.vnode.props)

  /**
   * Define the initial component
   */
  const value: any =
    props.modelValue !== undefined
      ? props.modelValue
      : cloneAny(context.attrs.value)

  /**
   * Creates the node's initial props from the context, props, and definition
   * @returns
   */
  function createInitialProps(): Record<string, any> {
    const initialProps: Record<string, any> = {
      ...nodeProps(props),
      ...listeners,
    }
    const attrs = except(nodeProps(context.attrs), pseudoProps)
    initialProps.attrs = attrs
    const propValues = only(nodeProps(context.attrs), pseudoProps)
    for (const propName in propValues) {
      initialProps[camel(propName)] = propValues[propName]
    }
    const classesProps = { props: {} }
    classesToNodeProps(classesProps as FormKitNode, props)
    Object.assign(initialProps, classesProps.props)
    if (typeof initialProps.type !== 'string') {
      initialProps.definition = initialProps.type
      delete initialProps.type
    }
    return initialProps
  }

  /**
   * Create the FormKitNode.
   */
  const initialProps = createInitialProps()

  /**
   * The parent node.
   */
  const parent = initialProps.ignore
    ? null
    : props.parent || inject(parentSymbol, null)

  const node = createNode(
    extend(
      config || {},
      {
        name: props.name || undefined,
        value,
        parent,
        plugins: (config.plugins || []).concat(props.plugins),
        config: props.config,
        props: initialProps,
        index: props.index,
      },
      false,
      true
    ) as Partial<FormKitOptions>
  ) as FormKitNode

  /**
   * If no definition has been assigned at this point — we're out!
   */
  if (!node.props.definition) error(600, node)

  /**
   * These prop names must be assigned.
   */
  const pseudoPropNames = pseudoProps
    .concat(node.props.definition.props || [])
    .reduce((names, prop) => {
      if (typeof prop === 'string') {
        names.push(camel(prop))
        names.push(kebab(prop))
      } else {
        names.push(prop)
      }
      return names
    }, [] as Array<string | RegExp>)

  /* Splits Classes object into discrete props for each key */
  watchEffect(() => classesToNodeProps(node, props))

  /**
   * The props object already has properties even if they start as "undefined"
   * so we can loop over them and individual watchEffect to prevent responding
   * inappropriately.
   */
  const passThrough = nodeProps(props)
  for (const prop in passThrough) {
    watch(
      () => props[prop as keyof FormKitComponentProps],
      () => {
        if (props[prop as keyof FormKitComponentProps] !== undefined) {
          node.props[prop] = props[prop as keyof FormKitComponentProps]
        }
      }
    )
  }

  /**
   * Watch "pseudoProp" attributes explicitly.
   */
  const pseudoPropsValues = only(nodeProps(context.attrs), pseudoPropNames)
  for (const prop in pseudoPropsValues) {
    const camelName = camel(prop)
    watch(
      () => context.attrs[prop],
      () => {
        node.props[camelName] = context.attrs[prop]
      }
    )
  }

  /**
   * Watch and dynamically set attribute values, those values that are not
   * props and are not pseudoProps
   */
  watchEffect(() => {
    const attrs = except(nodeProps(context.attrs), pseudoPropNames)
    node.props.attrs = Object.assign({}, node.props.attrs || {}, attrs)
  })

  /**
   * Add any/all "prop" errors to the store.
   */
  watchEffect(() => {
    const messages = props.errors.map((error) =>
      createMessage({
        key: slugify(error),
        type: 'error',
        value: error,
        meta: { source: 'prop' },
      })
    )
    node.store.apply(
      messages,
      (message) => message.type === 'error' && message.meta.source === 'prop'
    )
  })

  /**
   * Add input errors.
   */
  if (node.type !== 'input') {
    const sourceKey = `${node.name}-prop`
    watchEffect(() => {
      const keys = Object.keys(props.inputErrors)
      const messages = keys.reduce((messages, key) => {
        let value = props.inputErrors[key]
        if (typeof value === 'string') value = [value]
        if (Array.isArray(value)) {
          messages[key] = value.map((error) =>
            createMessage({
              key: error,
              type: 'error',
              value: error,
              meta: { source: sourceKey },
            })
          )
        }
        return messages
      }, {} as Record<string, FormKitMessage[]>)
      node.store.apply(
        messages,
        (message) =>
          message.type === 'error' && message.meta.source === sourceKey
      )
    })
  }

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
    // Warning that v-model isnt the most performant for non-inputs:
    // if (node.type !== 'input') warn()
    watch(
      () => props.modelValue,
      (value) => {
        node.input(value, false)
      },
      {
        deep: true,
      }
    )
  }

  /**
   * When this input shuts down, we need to "delete" the node too.
   */
  onUnmounted(() => node.destroy())

  return node
}
