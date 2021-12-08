import { FormKitNode, createError, FormKitTextFragment } from './node'
import { has, token } from '@formkit/utils'

/**
 * The structure of an core FormKitMessage. These messages are used to store
 * information about the state of a node.
 * @public
 */
export interface FormKitMessageProps {
  blocking: boolean
  key: string
  meta: FormKitMessageMeta
  type: string
  value?: string | number | boolean
  visible: boolean
}

/**
 * A FormKit message is immutable, so all properties should be readonly.
 * @public
 */
export type FormKitMessage = Readonly<FormKitMessageProps>

/**
 * Messages have can have any arbitrary meta data attached to them.
 * @public
 */
export interface FormKitMessageMeta {
  [index: string]: any
  /**
   * If this property is set, then message producers (like formkit/i18n) should
   * use this key instead of the message key as the lookup for the proper
   * message to produce.
   */
  messageKey?: string
  /**
   * If this property is set on a message then only the values in this property
   * will be passed as arguments to an i18n message localization function.
   */
  i18nArgs?: any[]
}

/**
 * Defines the actual store of messages (private).
 * @public
 */
export interface FormKitMessageStore {
  [index: string]: FormKitMessage
}

/**
 * The message store contains all of the messages that pertain to a given node.
 * @public
 */
export type FormKitStore = FormKitMessageStore & {
  _n: FormKitNode
  _b: Array<FormKitMessage>
  buffer: boolean
} & FormKitStoreTraps

/**
 * The available traps on the FormKit store.
 */
export interface FormKitStoreTraps {
  set: (message: FormKitMessageProps) => FormKitStore
  remove: (key: string) => FormKitStore
  filter: (
    callback: (message: FormKitMessage) => boolean,
    type?: string
  ) => FormKitStore
  reduce: <T>(
    reducer: (accumulator: T, message: FormKitMessage) => T,
    accumulator: T
  ) => T
  release: () => void
  touch: () => void
}

/**
 * Creates a new FormKitMessage object.
 * @param conf - The message configuration
 * @returns FormKitMessage
 * @public
 */
export function createMessage(
  conf: Partial<FormKitMessage>,
  node?: FormKitNode
): FormKitMessageProps {
  const m = {
    blocking: false,
    key: token(),
    meta: {} as FormKitMessageMeta,
    type: 'state',
    visible: true,
    ...conf,
  }
  if (node && m.value && m.meta.localize !== false) {
    m.value = node.t(m as FormKitTextFragment)
    m.meta.locale = node.config.locale
  }
  return m
}

/**
 * The available traps on the node's store.
 */
const storeTraps: {
  [k in keyof FormKitStoreTraps]: (...args: any[]) => unknown
} = {
  set: setMessage,
  remove: removeMessage,
  filter: filterMessages,
  reduce: reduceMessages,
  release: releaseBuffer,
  touch: touchMessages,
}

/**
 * Creates a new FormKit message store.
 * @returns FormKitStore
 */
export function createStore(_buffer = false): FormKitStore {
  const messages: FormKitMessageStore = {}
  let node: FormKitNode
  let buffer = _buffer
  let _b = [] as Array<FormKitMessage>
  const store = new Proxy(messages, {
    get(...args) {
      const [_target, property] = args
      if (property === 'buffer') return buffer
      if (property === '_b') return _b
      if (has(storeTraps, property)) {
        return storeTraps[property as keyof FormKitStoreTraps].bind(
          null,
          messages,
          store,
          node
        )
      }
      return Reflect.get(...args)
    },
    set(_t, prop, value) {
      if (prop === '_n') {
        node = value
        return true
      } else if (prop === '_b') {
        _b = value
        return true
      } else if (prop === 'buffer') {
        buffer = value
        return true
      }
      createError(node, 2)
      return false
    },
  }) as FormKitStore
  return store
}

/**
 * Adds a new value to a FormKit message bag.
 * @param store - The store itself
 * @param store - The store interface
 * @param node - The node this store belongs to
 * @param message - The message object
 * @returns FormKitStore
 */
function setMessage(
  messageStore: FormKitMessageStore,
  store: FormKitStore,
  node: FormKitNode,
  message: FormKitMessageProps
): FormKitStore {
  if (store.buffer) {
    store._b.push(message)
    return store
  }
  if (messageStore[message.key] !== message) {
    if (typeof message.value === 'string' && message.meta.localize !== false) {
      // Expose the value to translation
      const previous = message.value
      message.value = node.t(message as FormKitTextFragment)
      if (message.value !== previous) {
        message.meta.locale = node.props.locale
      }
    }
    const e = `message-${has(messageStore, message.key) ? 'updated' : 'added'}`
    messageStore[message.key] = Object.freeze(message)
    node.emit(e, message)
  }
  return store
}

/**
 * Run through each message in the store, and ensure it has been translated
 * to the proper language. This most frequently happens after a locale change.
 */
function touchMessages(
  messageStore: FormKitMessageStore,
  store: FormKitStore
): void {
  for (const key in messageStore) {
    const message = { ...messageStore[key] }
    store.set(message)
  }
}

/**
 * Remove a message from the store.
 * @param store - The store itself
 * @param store - The store interface
 * @param node - The node this store belongs to
 * @param key - The message key
 * @returns FormKitStore
 */
function removeMessage(
  messageStore: FormKitMessageStore,
  store: FormKitStore,
  node: FormKitNode,
  key: string
): FormKitStore {
  if (has(messageStore, key)) {
    const message = messageStore[key]
    delete messageStore[key]
    node.emit('message-removed', message)
  }
  if (store.buffer === true) {
    store._b = store._b.filter((m) => m.key !== key)
  }
  return store
}

/**
 * Iterates over all messages removing those that are no longer wanted.
 * @param messageStore - The store itself
 * @param store - The store interface
 * @param node - The node to filter for
 * @param callback - A callback accepting a message and returning a boolean
 * @param type - Pre filtered by a given message type
 */
function filterMessages(
  messageStore: FormKitMessageStore,
  store: FormKitStore,
  node: FormKitNode,
  callback: (message: FormKitMessage) => boolean,
  type: false | string
) {
  for (const key in messageStore) {
    const message = messageStore[key]
    if ((!type || message.type === type) && !callback(message)) {
      removeMessage(messageStore, store, node, key)
    }
  }
}

/**
 * Reduce the message store to some other generic value.
 * @param messageStore - The store itself
 * @param _store - Unused but curried — the store interface itself
 * @param _node - The node owner of this store
 * @param reducer - The callback that performs the reduction
 * @param accumulator - The initial value
 * @returns
 */
function reduceMessages<T>(
  messageStore: FormKitMessageStore,
  _store: FormKitStore,
  _node: FormKitNode,
  reducer: (value: T, message: FormKitMessage) => T,
  accumulator: T
) {
  for (const key in messageStore) {
    const message = messageStore[key]
    accumulator = reducer(accumulator, message)
  }
  return accumulator
}

/**
 * Iterates over all buffered messages and applies them in sequence.
 * @param messageStore - The store itself
 * @param store - The store interface
 * @param node - The node to filter for
 */
function releaseBuffer(
  _messageStore: FormKitMessageStore,
  store: FormKitStore
) {
  store.buffer = false
  store._b.forEach((message) => store.set(message))
  store._b = []
}
