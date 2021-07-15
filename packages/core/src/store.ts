import { FormKitNode, createError } from './node'
import { has, token } from './utils'

/**
 * The structure of an core FormKitMessage. These messages are used to store
 * information about the state of a node.
 */
interface FormKitMessageProps {
  blocking: boolean
  key: string
  meta: FormKitMessageMeta
  type: string
  value?: string
}

/**
 * A FormKit message is immutable, so all properties should be readonly.
 */
export type FormKitMessage = Readonly<FormKitMessageProps>

/**
 * Messages have can have any arbitrary meta data attached to them.
 */
export interface FormKitMessageMeta {
  [index: string]: any
}

/**
 * Defines the actual store of messages (private).
 */
interface FormKitMessageStore {
  [index: string]: FormKitMessage
}

/**
 * The message bag stores all of the messages that pertain to a given node.
 */
export type FormKitStore = FormKitMessageStore & {
  _n: FormKitNode<any>
  set: (message: FormKitMessage) => FormKitStore
  remove: (key: string) => FormKitStore
}

/**
 * Creates a new FormKitMessage object.
 * @param  {Partial<FormKitMessage>} conf
 * @returns FormKitMessage
 */
export function createMessage(conf: Partial<FormKitMessage>): FormKitMessage {
  return Object.freeze(
    Object.assign(
      {
        blocking: false,
        key: token(),
        meta: {},
        type: 'state',
      },
      conf
    )
  )
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
      if (property === 'set')
        return setMessage.bind(null, messages, store, node)
      if (property === 'remove')
        return removeMessage.bind(null, messages, store, node)
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
 * @param  {FormKitMessageStore} store
 * @param  {FormKitStore} bag
 * @param  {FormKitNode} node
 * @param  {FormKitMessage} message
 * @returns FormKitStore
 */
function setMessage(
  messageStore: FormKitMessageStore,
  store: FormKitStore,
  node: FormKitNode,
  message: FormKitMessage
): FormKitStore {
  if (messageStore[message.key] !== message) {
    messageStore[message.key] = message
    node.emit('message', message)
  }
  return store
}

/**
 * Remove a message from the store.
 * @param  {FormKitMessageStore} messageStore
 * @param  {FormKitStore} store
 * @param  {FormKitNode} node
 * @param  {string} key
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
