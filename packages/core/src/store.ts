import { FormKitNode, createError } from './node'
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
  value?: string
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
  _n: FormKitNode<any>
} & FormKitStoreTraps

/**
 * The available traps on the FormKit store.
 */
export interface FormKitStoreTraps {
  set: (message: FormKitMessage) => FormKitStore
  remove: (key: string) => FormKitStore
  filter: (
    callback: (message: FormKitMessage) => boolean,
    type?: string
  ) => FormKitStore
  reduce: <T>(
    reducer: (accumulator: T, message: FormKitMessage) => T,
    accumulator: T
  ) => T
}

/**
 * Creates a new FormKitMessage object.
 * @param conf -
 * @returns FormKitMessage
 * @public
 */
export function createMessage(conf: Partial<FormKitMessage>): FormKitMessage {
  return {
    blocking: false,
    key: token(),
    meta: {},
    type: 'state',
    visible: true,
    ...conf,
  }
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
}

/**
 * Creates a new FormKit message store.
 * @returns FormKitStore
 */
export function createStore(): FormKitStore {
  const messages: FormKitMessageStore = {}
  let node: FormKitNode<any>
  const store = new Proxy(messages, {
    get(...args) {
      const [_target, property] = args
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
      }
      createError(node, 2)
      return false
    },
  }) as FormKitStore
  return store
}

/**
 * Adds a new value to a FormKit message bag.
 * @param store -
 * @param bag -
 * @param node -
 * @param message -
 * @returns FormKitStore
 */
function setMessage(
  messageStore: FormKitMessageStore,
  store: FormKitStore,
  node: FormKitNode,
  message: FormKitMessage
): FormKitStore {
  if (messageStore[message.key] !== message) {
    const e = `message-${has(messageStore, message.key) ? 'updated' : 'added'}`
    messageStore[message.key] = Object.freeze(message)
    node.emit(e, message)
  }
  return store
}

/**
 * Remove a message from the store.
 * @param messageStore -
 * @param store -
 * @param node -
 * @param key -
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
  return store
}

/**
 * Iterates over all messages removing those that are no longer wanted.
 * @param messageStore -
 * @param store -
 * @param node -
 * @param callback - A callback accepting a message and returning a boolean
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
 * @param messageStore - The message store object
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
