import { parentSymbol } from '../FormKit'
import {
  createNode,
  FormKitNode,
  FormKitMessage,
  FormKitProps,
  warn,
  createMessage,
} from '@formkit/core'
import { createObserver } from '@formkit/observer'
import { nodeProps, except, camel, has } from '@formkit/utils'
import { FormKitTypeDefinition } from '@formkit/inputs'
import {
  reactive,
  inject,
  provide,
  watchEffect,
  watch,
  toRef,
  SetupContext,
  computed,
  ref,
} from 'vue'
import { configSymbol } from '../plugin'
import { minConfig } from '../plugin'

interface FormKitComponentProps {
  type?: string
  name?: string
  validation?: any
  modelValue?: any
  errors: string[]
  config: Record<string, any>
}

/**
 * Props that are extracted from the attrs object.
 * TODO: Currently local, this should probably exported to a inputs or another
 * package.
 */
const universalProps = [
  'help',
  'label',
  'options',
  'errorBehavior',
  'validationBehavior',
]

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
): [Record<string, any>, FormKitNode<any>] {
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

  const p = nodeProps(context.attrs, props)
  const initialProps: Partial<FormKitProps> = {}
  for (const propName in p) {
    initialProps[camel(propName)] = p[propName]
  }

  /**
   * Create the FormKitNode.
   */
  const node = createNode({
    ...config.nodeOptions,
    type,
    name: props.name || undefined,
    value,
    parent,
    config: props.config,
    props: initialProps,
  }) as FormKitNode<any>

  /**
   * Start a validity counter on all blocking messages.
   */
  node.ledger.count('blocking', (m) => m.blocking)

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
   * Watch and dynamically set node prop values so both core and vue states are
   * reactive. First we do this with attributes.
   */
  watchEffect(() => {
    const attrProps = nodeProps(context.attrs)
    for (const propName in attrProps) {
      node.props[camel(propName)] = attrProps[propName]
    }
  })

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
   * All messages with the visibility state set to true.
   */
  const visibleMessages = reactive<Record<string, FormKitMessage>>(
    node.store.reduce((store, message) => {
      if (message.visible) {
        store[message.key] = message
      }
      return store
    }, {} as Record<string, FormKitMessage>)
  )

  /**
   * All messages that are currently on display to an end user. This changes
   * based on the current message type behavior, like errorBehavior.
   */
  const messages = computed<Record<string, FormKitMessage>>(() => {
    const availableMessages: Record<string, FormKitMessage> = {}
    for (const key in visibleMessages) {
      const message = visibleMessages[key]
      let behavior = node.props[`${message.type}Behavior`]
      if (!behavior) {
        behavior = message.type === 'validation' ? 'blur' : 'live'
      }
      switch (behavior) {
        case 'live':
          availableMessages[key] = message
          break
        case 'blur':
          if (data.state.blurred) {
            availableMessages[key] = message
          }
          break
        case 'dirty':
          if (data.state.dirty) {
            availableMessages[key] = message
          }
          break
      }
    }
    return availableMessages
  })

  const cachedClasses = reactive({})
  const classes = new Proxy(cachedClasses as Record<PropertyKey, string>, {
    get(...args) {
      const [target, property] = args
      let className = Reflect.get(...args)
      if (typeof property === 'string') {
        if (!has(target, property) && !property.startsWith('__v_')) {
          const observedNode = createObserver(node)
          observedNode.watch((node) => {
            className = node.props[`${property}Class`]
            target[property] = className
          })
        }
      }
      return className
    },
  })

  Object.assign(window, { type: reactive({}), ref: ref(0) })

  /**
   * This is the reactive data object that is provided to all schemas and
   * forms. It is a subset of data in the core node object.
   */
  let inputElement: null | HTMLInputElement = null
  const data = reactive({
    _value: node.value,
    attrs: except(
      context.attrs,
      new Set(universalProps.concat(input.props || []))
    ),
    fns: {
      length: (obj: Record<PropertyKey, any>) => Object.keys(obj).length,
      number: (value: any) => Number(value),
      string: (value: any) => String(value),
      json: (value: any) => JSON.stringify(value),
    },
    handlers: {
      blur: () =>
        node.store.set(
          createMessage({ key: 'blurred', visible: false, value: true })
        ),
      touch: () => {
        node.store.set(
          createMessage({ key: 'dirty', visible: false, value: true })
        )
      },
      DOMInput: (e: Event) => {
        inputElement = e.target as HTMLInputElement
        node.input((e.target as HTMLInputElement).value)
      },
    },
    help: toRef(context.attrs, 'help'),
    label: toRef(context.attrs, 'label'),
    messages,
    node,
    options: toRef(context.attrs, 'options'),
    state: {
      valid: !node.ledger.value('blocking'),
    } as Record<string, any>,
    type: toRef(props, 'type'),
    value: node.value,
    classes,
  })

  /**
   * Watch for input events from core.
   */
  node.on('input', ({ payload }) => {
    data._value = payload
    if (inputElement) {
      inputElement.value = data._value
    }
  })

  /**
   * Watch for input commits from core.
   */
  node.on('commit', ({ payload }) => {
    switch (type) {
      case 'group':
        data.value = { ...payload }
        break
      case 'list':
        data.value = [...payload]
        break
      default:
        data.value = payload
    }
    // The input is dirty after a value has been input by a user
    if (!data.state.dirty) data.handlers.touch()
    // Emit the values after commit
    context.emit('input', data.value)
    context.emit('update:modelValue', data.value)
  })

  /**
   * Update the local state in response to messages.
   * @param message - A formkit message
   */
  const updateState = (message: FormKitMessage) => {
    if (message.visible) visibleMessages[message.key] = message
    if (message.type === 'state') data.state[message.key] = message.value
  }

  /**
   * Listen to message events and modify the local message data values.
   */
  node.on('message-added', (e) => updateState(e.payload))
  node.on('message-updated', (e) => updateState(e.payload))
  node.on('message-removed', ({ payload: message }) => {
    delete visibleMessages[message.key]
    delete data.state[message.key]
  })
  node.on('settled:blocking', () => {
    data.state.valid = true
  })
  node.on('unsettled:blocking', () => {
    data.state.valid = false
  })

  if (node.type !== 'input') {
    provide(parentSymbol, node)
  }

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

  return [data, node]
}
