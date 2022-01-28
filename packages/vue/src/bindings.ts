import { reactive, computed } from 'vue'
import {
  FormKitPlugin,
  FormKitFrameworkContext,
  FormKitMessage,
  createClasses,
  createMessage,
  generateClassList,
  FormKitTypeDefinition,
} from '@formkit/core'
import { eq, has, camel } from '@formkit/utils'
import { createObserver } from '@formkit/observer'

/**
 * A plugin that creates Vue-specific context object on each given node.
 * @param node - FormKitNode to create the context on.
 */
const vueBindings: FormKitPlugin = function vueBindings(node) {
  /**
   * Start a validity counter on all blocking messages.
   */
  node.ledger.count('blocking', (m) => m.blocking)

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
   * based on the current message type visibility, like errorVisibility.
   */
  const messages = computed<Record<string, FormKitMessage>>(() => {
    const availableMessages: Record<string, FormKitMessage> = {}
    for (const key in visibleMessages) {
      const message = visibleMessages[key]
      // Once a form is "submitted" all inputs are live.
      if (context.state.submitted) {
        availableMessages[key] = message
        continue
      }
      let visibility = node.props[`${message.type}Visibility`]
      if (!visibility) {
        visibility = message.type === 'validation' ? 'blur' : 'live'
      }
      switch (visibility) {
        case 'live':
          availableMessages[key] = message
          break
        case 'blur':
          if (context.state.blurred) {
            availableMessages[key] = message
          }
          break
        case 'dirty':
          if (context.state.dirty) {
            availableMessages[key] = message
          }
          break
      }
    }
    return availableMessages
  })

  /**
   * UI Messages.
   */
  const ui = reactive(
    node.store.reduce((messages, message) => {
      if (message.type === 'ui' && message.visible)
        messages[message.key] = message
      return messages
    }, {} as Record<string, FormKitMessage>)
  )

  /**
   * This is the reactive data object that is provided to all schemas and
   * forms. It is a subset of data in the core node object.
   */
  let inputElement: null | HTMLInputElement = null

  const cachedClasses = reactive({})
  const classes = new Proxy(cachedClasses as Record<PropertyKey, string>, {
    get(...args) {
      const [target, property] = args
      let className = Reflect.get(...args)
      if (!className && typeof property === 'string') {
        if (!has(target, property) && !property.startsWith('__v')) {
          const observedNode = createObserver(node)
          observedNode.watch((node) => {
            const rootClasses =
              typeof node.config.rootClasses === 'function'
                ? node.config.rootClasses(property, node)
                : {}
            const globalConfigClasses = node.config.classes
              ? createClasses(property, node, node.config.classes[property])
              : {}
            const classesPropClasses = createClasses(
              property,
              node,
              node.props[`_${property}Class`]
            )
            const sectionPropClasses = createClasses(
              property,
              node,
              node.props[`${property}Class`]
            )
            className = generateClassList(
              node,
              property,
              rootClasses,
              globalConfigClasses,
              classesPropClasses,
              sectionPropClasses
            )
            target[property] = className
          })
        }
      }
      return className
    },
  })

  const context: FormKitFrameworkContext = reactive({
    _value: node.value,
    attrs: node.props.attrs,
    disabled: node.props.disabled,
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
    help: node.props.help,
    id: node.props.id as string,
    label: node.props.label,
    messages,
    node,
    options: node.props.options,
    state: {
      blurred: false,
      dirty: false,
      submitted: false,
      valid: !node.ledger.value('blocking'),
    },
    type: node.props.type,
    ui,
    value: node.value,
    classes,
  })

  /**
   * Ensure the context object is properly configured after booting up.
   */
  node.on('created', () => {
    if (!eq(context.value, node.value)) {
      context._value = node.value
      context.value = node.value
    }
  })

  /**
   * Observes node.props properties explicitly and updates them in the context
   * object.
   * @param observe - Props to observe and register as context data.
   */
  function observeProps(observe: string[]) {
    observe.forEach((prop) => {
      prop = camel(prop)
      if (!has(context, prop) && has(node.props, prop)) {
        context[prop] = node.props[prop]
      }
      node.on(`prop:${prop}`, ({ payload }) => {
        context[prop as keyof FormKitFrameworkContext] = payload
      })
    })
  }

  /**
   * We use a node observer to individually observe node props.
   */
  const rootProps = [
    'help',
    'label',
    'disabled',
    'options',
    'type',
    'attrs',
    'id',
  ]
  observeProps(rootProps)

  /**
   * Once the input is defined, deal with it.
   * @param definition - Type definition.
   */
  function definedAs(definition: FormKitTypeDefinition) {
    if (definition.props) observeProps(definition.props)
  }

  node.props.definition
    ? definedAs(node.props.definition)
    : node.on('defined', ({ payload }) => definedAs(payload))

  /**
   * Watch for input events from core.
   */
  node.on('input', ({ payload }) => {
    context._value = payload
    if (inputElement) {
      inputElement.value = context._value
    }
  })

  /**
   * Watch for input commits from core.
   */
  node.on('commit', ({ payload }) => {
    switch (node.type) {
      case 'group':
        context.value = { ...payload }
        break
      case 'list':
        context.value = [...payload]
        break
      default:
        context.value = payload
    }
    // The input is dirty after a value has been input by a user
    if (!context.state.dirty) context.handlers.touch()
  })

  /**
   * Update the local state in response to messages.
   * @param message - A formkit message
   */
  const updateState = (message: FormKitMessage) => {
    if (message.type === 'ui' && message.visible && !message.meta.showAsMessage)
      ui[message.key] = message
    else if (message.visible) visibleMessages[message.key] = message
    else if (message.type === 'state')
      context.state[message.key] = !!message.value
  }

  /**
   * Listen to message events and modify the local message data values.
   */
  node.on('message-added', (e) => updateState(e.payload))
  node.on('message-updated', (e) => updateState(e.payload))
  node.on('message-removed', ({ payload: message }) => {
    delete ui[message.key]
    delete visibleMessages[message.key]
    delete context.state[message.key]
  })
  node.on('settled:blocking', () => {
    context.state.valid = true
  })
  node.on('unsettled:blocking', () => {
    context.state.valid = false
  })

  node.context = context
  // The context is complete
  node.emit('context', node, false)
}

export default vueBindings
