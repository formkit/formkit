import {
  FormKitPlugin,
  FormKitFrameworkContext,
  FormKitMessage,
  createClasses,
  createMessage,
  generateClassList,
  FormKitTypeDefinition,
  FormKitPseudoProps,
} from '@formkit/core'
import {
  eq,
  has,
  camel,
  empty,
  undefine,
  cloneAny,
  shallowClone,
} from '@formkit/utils'
import { createObserver } from '@formkit/observer'
import {
  ensureReactiveStore,
  notifyReactiveStore,
  clearReactiveStore,
} from './reactiveStore'

function computeValidationVisible(
  context: FormKitFrameworkContext,
  validationVisibility: string,
  hasShownErrors: boolean
): boolean {
  if (!context.state) return false
  if (context.state.submitted) return true
  if (!hasShownErrors && !context.state.settled) {
    return false
  }
  // Several modes can be combined, e.g. "blur dirty": messages show as soon
  // as any of them applies (#973).
  return visibilityModes(validationVisibility).some((mode) => {
    switch (mode) {
      case 'live':
        return true
      case 'blur':
        return context.state.blurred
      case 'dirty':
        return context.state.dirty
      default:
        return false
    }
  })
}

/**
 * The validation-visibility modes in a (possibly combined) value like
 * "blur dirty".
 */
function visibilityModes(value: unknown): string[] {
  return String(value ?? '')
    .split(/[\s,|]+/)
    .filter(Boolean)
}

function createReactiveContextBag<T extends Record<string, any>>(
  value: T,
  onMutate: () => void
): T {
  return new Proxy(value, {
    set(target, property, next, receiver) {
      const previous = Reflect.get(target, property, receiver)
      const didSet = Reflect.set(target, property, next, receiver)
      if (didSet && previous !== next) {
        onMutate()
      }
      return didSet
    },
    deleteProperty(target, property) {
      const had = Reflect.has(target, property)
      const didDelete = Reflect.deleteProperty(target, property)
      if (didDelete && had) {
        onMutate()
      }
      return didDelete
    },
  })
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

function shallowEqualObjects(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if (!Object.is(a[key], b[key])) return false
  }
  return true
}

function hasContextValueChanged(current: unknown, next: unknown): boolean {
  if (Object.is(current, next)) return false
  if (Array.isArray(current) && Array.isArray(next)) {
    if (current.length !== next.length) return true
    for (let i = 0; i < current.length; i++) {
      if (!Object.is(current[i], next[i])) return true
    }
    return false
  }
  if (isPlainObject(current) && isPlainObject(next)) {
    return !shallowEqualObjects(current, next)
  }
  return true
}

const listItemKeys = new Map<symbol, string>()
let nextListItemKey = 0

function getReactListItems(node: {
  children: Array<{ uid: symbol }>
}): string[] {
  return node.children.map((child) => {
    if (!listItemKeys.has(child.uid)) {
      listItemKeys.set(child.uid, `fk-item-${nextListItemKey++}`)
    }
    return listItemKeys.get(child.uid) as string
  })
}

/**
 * React bindings plugin — creates a mutable framework context and reactive
 * store notifications for React subscribers.
 */
const reactBindings: FormKitPlugin = function reactBindings(node) {
  node.ledger.count('blocking', (m) => m.blocking)
  node.ledger.count('errors', (m) => m.type === 'error')

  let hasTicked = false
  queueMicrotask(() => {
    hasTicked = true
  })

  const availableMessages: Record<string, FormKitMessage> = node.store.reduce(
    (store, message) => {
      if (message.visible) {
        store[message.key] = message
      }
      return store
    },
    {} as Record<string, FormKitMessage>
  )

  let validationVisibility: string =
    node.props.validationVisibility ||
    (node.props.type === 'checkbox' ? 'dirty' : 'blur')

  let hasShownErrors = visibilityModes(validationVisibility).includes('live')

  let isRequired = false
  const checkForRequired = (parsedRules?: Array<{ name: string }>) => {
    isRequired = (parsedRules ?? []).some((rule) => rule.name === 'required')
  }
  checkForRequired(node.props.parsedRules)

  let hasValidation =
    Array.isArray(node.props.parsedRules) && node.props.parsedRules.length > 0

  const ui: Record<string, FormKitMessage> = node.store.reduce((messages, msg) => {
    if (msg.type === 'ui' && msg.visible) {
      messages[msg.key] = msg
    }
    return messages
  }, {} as Record<string, FormKitMessage>)

  const cachedClasses: Record<string, string> = {}
  const classes = new Proxy(cachedClasses as Record<PropertyKey, string>, {
    get(target, property, receiver) {
      if (!node) return ''
      let className = Reflect.get(target, property, receiver)
      if (!className && typeof property === 'string') {
        if (!has(target, property)) {
          const observedNode = createObserver(node)
          let initialized = false
          observedNode.watch((observed) => {
            const rootClasses =
              typeof observed.config.rootClasses === 'function'
                ? observed.config.rootClasses(property, observed)
                : {}
            const globalConfigClasses = observed.config.classes
              ? createClasses(
                  property,
                  observed,
                  observed.config.classes[property]
                )
              : {}
            const classesPropClasses = createClasses(
              property,
              observed,
              observed.props[`_${property}Class`]
            )
            const sectionPropClasses = createClasses(
              property,
              observed,
              observed.props[`${property}Class`]
            )
            const generatedClassName =
              generateClassList(
                observed,
                property,
                rootClasses,
                globalConfigClasses,
                classesPropClasses,
                sectionPropClasses
              ) ?? ''
            className = generatedClassName
            target[property] = generatedClassName
            if (initialized) {
              notifyReactiveStore(context)
            } else {
              initialized = true
            }
          })
        }
      }
      return className ?? ''
    },
  })

  let committedValue = node.value
  let inputValue = node.value
  let pendingDOMInputValue: string | undefined

  const domInputValue = (payload: unknown) => {
    if (
      typeof pendingDOMInputValue === 'string' &&
      typeof node.props.number !== 'undefined' &&
      node.props.number !== 'integer' &&
      typeof payload === 'number' &&
      Number.isFinite(payload) &&
      pendingDOMInputValue.includes('.') &&
      pendingDOMInputValue !== String(payload)
    ) {
      return pendingDOMInputValue
    }
    return payload
  }

  let contextRef: FormKitFrameworkContext | undefined
  const notifyContextMutation = () => {
    if (contextRef) notifyReactiveStore(contextRef)
  }

  const fns = createReactiveContextBag(
    {
      length: (obj: Record<PropertyKey, any>) => Object.keys(obj).length,
      number: (value: any) => Number(value),
      string: (value: any) => String(value),
      json: (value: any) => JSON.stringify(value),
      eq,
    },
    notifyContextMutation
  )

  const handlers = createReactiveContextBag(
    {
      blur: (e?: FocusEvent) => {
        if (!node) return
        node.store.set(
          createMessage({ key: 'blurred', visible: false, value: true })
        )
        const onBlur = node.props.attrs?.onBlur
        if (typeof onBlur === 'function') {
          onBlur(e)
        }
      },
      touch: () => {
        const doCompare = context.dirtyBehavior === 'compare'
        if (node.store.dirty?.value && !doCompare) return
        const dirty = !eq(node.props._init, node._value)
        if (!dirty && !doCompare) return
        node.store.set(
          createMessage({ key: 'dirty', visible: false, value: dirty })
        )
      },
      DOMInput: (e: Event) => {
        pendingDOMInputValue = (e.target as HTMLInputElement).value
        node.input(pendingDOMInputValue)
        node.emit('dom-input-event', e)
      },
    },
    notifyContextMutation
  )

  const sectionRefs: Record<string, Element | null> = {}
  const context: FormKitFrameworkContext = {
    _value: inputValue,
    attrs: node.props.attrs,
    disabled: node.props.disabled,
    describedBy: undefined,
    fns,
    handlers,
    help: node.props.help,
    id: node.props.id as string,
    items: getReactListItems(node),
    label: node.props.label,
    messages: {},
    didMount: false,
    node,
    options: node.props.options,
    defaultMessagePlacement: true,
    slots: node.props.__slots,
    state: {
      blurred: false,
      complete: false,
      dirty: false,
      empty: empty(committedValue),
      submitted: false,
      settled: node.isSettled,
      valid: !node.ledger.value('blocking'),
      invalid: false,
      errors: !!node.ledger.value('errors'),
      rules: hasValidation,
      validationVisible: false,
      required: isRequired,
      failing: false,
      passing: true,
    },
    type: node.props.type,
    family: node.props.family,
    ui,
    value: committedValue,
    classes,
    // Section DOM elements (#200). Plain object: writing a ref never
    // notifies the reactive store, so it can't cause re-renders.
    refs: sectionRefs,
  }
  // Private alias the schema renderer writes through (user schema data with
  // its own `refs` key is never touched). Non-enumerable: hidden from
  // Object.keys, devtools and serializers.
  Object.defineProperty(context, '__fkSectionRefs', {
    value: sectionRefs,
    enumerable: false,
  })

  // A group/list commits once per child commit, and empty() walks every key of
  // an object (for...in), so computing `state.empty` eagerly on each commit is
  // O(n²) when mounting a large form. Compute it lazily (once per read).
  let emptyDirty = false
  let emptyCache = context.state.empty
  if (node.type !== 'input') {
    Object.defineProperty(context.state, 'empty', {
      enumerable: true,
      configurable: true,
      get() {
        if (emptyDirty) {
          emptyCache = empty(context.value)
          emptyDirty = false
        }
        return emptyCache
      },
      set(value: boolean) {
        emptyCache = value
        emptyDirty = false
      },
    })
  }
  const markEmptyDirty = (payload: unknown) => {
    if (node.type !== 'input') emptyDirty = true
    else context.state.empty = empty(payload)
  }

  // Same O(n²) shape for the value itself: a group/list used to shallowClone
  // its whole value on every child commit/input. Instead remember the latest
  // payload and clone it once, on first read (React reads during render, which
  // is batched). After a commit `_value` is the same object as `value`, as
  // before. Direct writes replace the cached clone.
  let valuePayload: unknown
  let valueDirty = false
  let valueCache: unknown = context.value
  let _valuePayload: unknown
  let _valueDirty = false
  let _valueCache: unknown = context._value
  let _valueLinked = false
  if (node.type !== 'input') {
    Object.defineProperty(context, 'value', {
      enumerable: true,
      configurable: true,
      get() {
        if (valueDirty) {
          valueCache = shallowClone(valuePayload)
          valueDirty = false
        }
        return valueCache
      },
      set(value: unknown) {
        valueCache = value
        valueDirty = false
      },
    })
    Object.defineProperty(context, '_value', {
      enumerable: true,
      configurable: true,
      get() {
        if (_valueLinked) return context.value
        if (_valueDirty) {
          _valueCache = shallowClone(_valuePayload)
          _valueDirty = false
        }
        return _valueCache
      },
      set(value: unknown) {
        _valueLinked = false
        _valueCache = value
        _valueDirty = false
      },
    })
  }
  const markAggregateCommitted = (payload: unknown) => {
    valuePayload = payload
    valueDirty = true
    _valueLinked = true
    _valueDirty = false
  }
  const markAggregateInput = (payload: unknown) => {
    _valueLinked = false
    _valuePayload = payload
    _valueDirty = true
  }

  contextRef = context

  ensureReactiveStore(context)

  function recalculateContextState(): void {
    context.state.required = isRequired
    context.state.rules = hasValidation
    context.state.passing = !context.state.failing
    context.state.validationVisible = computeValidationVisible(
      context,
      validationVisibility,
      hasShownErrors
    )
    if (context.state.validationVisible) {
      hasShownErrors = true
    }

    const visibleMessages: Record<string, FormKitMessage> = {}
    for (const key in availableMessages) {
      const message = availableMessages[key]
      if (message.type !== 'validation' || context.state.validationVisible) {
        visibleMessages[key] = message
      }
    }
    context.messages = visibleMessages

    context.state.invalid = context.state.failing && context.state.validationVisible
    context.state.complete = hasValidation
      ? context.state.valid && !context.state.errors
      : context.state.dirty && !empty(context.value)

    const describers: string[] = []
    if (context.help) {
      describers.push(`help-${node.props.id}`)
    }
    for (const key in context.messages) {
      describers.push(`${node.props.id}-${key}`)
    }
    context.describedBy = describers.length ? describers.join(' ') : undefined
  }

  function flush(): void {
    recalculateContextState()
    notifyReactiveStore(context)
  }

  node.on('prop:validationVisibility', ({ payload }) => {
    validationVisibility = payload
    flush()
  })

  node.on('prop:parsedRules', ({ payload }) => {
    checkForRequired(payload)
    hasValidation = Array.isArray(payload) && payload.length > 0
    flush()
  })

  node.on('prop:rootClasses', () => {
    for (const key of Object.keys(cachedClasses)) {
      delete cachedClasses[key]
    }
    flush()
  })

  node.on('created', () => {
    if (!eq(context.value, node.value)) {
      inputValue = node.value
      committedValue = node.value
      context._value = inputValue
      context.value = committedValue
    }
    ;(async () => {
      await node.settled
      if (node) node.props._init = cloneAny(node.value)
    })()
    flush()
  })

  node.on('mounted', () => {
    context.didMount = true
    flush()
  })

  node.on('settled', ({ payload: isSettled }) => {
    context.state.settled = isSettled
    flush()
  })

  const observedContextProps = new Set<string>()
  function observeProps(observe: FormKitPseudoProps) {
    const propNames = Array.isArray(observe) ? observe : Object.keys(observe)
    propNames.forEach((prop) => {
      prop = camel(prop)
      if (observedContextProps.has(prop)) return
      observedContextProps.add(prop)
      if (!has(context, prop)) {
        context[prop] = node.props[prop]
      }
      node.on(`prop:${prop}`, ({ payload }) => {
        const key = prop as keyof FormKitFrameworkContext
        if (!hasContextValueChanged(context[key], payload)) return
        context[key] = payload
        flush()
      })
    })
  }

  const rootProps = () => {
    const props = [
      '__root',
      'help',
      'label',
      'disabled',
      'options',
      'type',
      'attrs',
      'preserve',
      'preserveErrors',
      'id',
      'dirtyBehavior',
    ]
    const iconPattern = /^[a-zA-Z-]+(?:-icon|Icon)$/
    const matchingProps = Object.keys(node.props).filter((prop) => {
      return iconPattern.test(prop)
    })
    return props.concat(matchingProps)
  }

  observeProps(rootProps())

  function definedAs<V = unknown>(definition: FormKitTypeDefinition<V>) {
    if (definition.props) observeProps(definition.props)
  }

  node.props.definition && definedAs(node.props.definition)

  node.on('added-props', ({ payload }) => observeProps(payload))

  node.on('input', ({ payload }) => {
    if (node.type !== 'input') {
      markAggregateInput(payload)
    } else {
      context._value = domInputValue(payload)
    }
    flush()
  })

  node.on('commitRaw', ({ payload }) => {
    if (node.type !== 'input') {
      markAggregateCommitted(payload)
    } else {
      context.value = payload
      context._value = domInputValue(payload)
    }
    pendingDOMInputValue = undefined
    markEmptyDirty(payload)
    queueMicrotask(() => {
      if (node) node.emit('modelUpdated')
    })
    flush()
  })

  node.on('commit', ({ payload }) => {
    if (
      (!context.state.dirty || context.dirtyBehavior === 'compare') &&
      node.isCreated &&
      hasTicked
    ) {
      if (!node.store.validating?.value) {
        context.handlers.touch()
      } else {
        const receipt = node.on('message-removed', ({ payload: message }) => {
          if (message.key === 'validating') {
            context.handlers.touch()
            node.off(receipt)
          }
        })
      }
    }

    if (
      node.type === 'input' &&
      context.state.complete &&
      context.state.errors &&
      !undefine(node.props.preserveErrors)
    ) {
      node.store.filter(
        (message) =>
          !(message.type === 'error' && message.meta?.autoClear === true)
      )
    }

    if (node.type === 'list' && node.sync) {
      context.items = getReactListItems(node)
    }

    markEmptyDirty(payload)
    flush()
  })

  const updateState = (message: FormKitMessage) => {
    if (message.type === 'ui' && message.visible && !message.meta.showAsMessage) {
      ui[message.key] = message
    } else if (message.visible) {
      availableMessages[message.key] = message
    } else if (message.type === 'state') {
      context.state[message.key] = !!message.value
    }
    flush()
  }

  node.on('message-added', (e) => updateState(e.payload))
  node.on('message-updated', (e) => updateState(e.payload))
  node.on('message-removed', ({ payload: message }) => {
    delete ui[message.key]
    delete availableMessages[message.key]
    delete context.state[message.key]
    flush()
  })

  node.on('settled:blocking', () => {
    context.state.valid = true
    flush()
  })

  node.on('unsettled:blocking', () => {
    context.state.valid = false
    flush()
  })

  node.on('settled:errors', () => {
    context.state.errors = false
    flush()
  })

  node.on('unsettled:errors', () => {
    context.state.errors = true
    flush()
  })

  node.context = context

  flush()

  node.emit('context', node, false)

  node.on('destroyed', () => {
    clearReactiveStore(context)
    node.context = undefined
  })
}

export default reactBindings
