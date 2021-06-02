import { setify, isNode } from './utils'
import { usePlugin } from './plugins'

/**
 * The base interface definition for a FormKitPlugin — it's just a function that
 * accepts a node argument.
 */
export interface FormKitPlugin {
  (node: FormKitNode): void | boolean
}

/**
 * The definition of a FormKitTrap — these are somewhat like methods on each
 * FormKitNode — they are always symmetrical (get/set), although it's acceptable
 * for either to throw an Exception.
 */
export interface FormKitTrap {
  get: TrapGetter
  set: TrapSetter
}

/**
 * Describes the path to a particular node from the top of the tree.
 */
type FormKitAddress = string[]

/**
 * Determines if the 'value' property of an object has been set.
 */
type HasValue = { value: unknown }

/**
 * Type utility for determining the type of the value property.
 */
type TypeOfValue<T> = T extends HasValue ? T['value'] : any

/**
 * Signature for any of the node's getter traps. Keep in mind that because these
 * are traps and not class methods, their response types are declared explicitly
 * in the FormKitNode interface.
 */
type TrapGetter =
  | ((node: FormKitNode, context: FormKitContext, ...args: any[]) => unknown)
  | false

/**
 * The signature for a node's trap setter — these are more rare than getter
 * traps, but can be really useful for blocking access to certain context
 * properties or modifying the behavior of an assignment (ex. see setParent)
 */
type TrapSetter =
  | ((
      node: FormKitNode,
      context: FormKitContext,
      property: string | symbol,
      value: any
    ) => boolean | never)
  | false

/**
 * The map signature for a node's traps Map.
 */
export type FormKitTraps = Map<string | symbol, FormKitTrap>

/**
 * General "app" like configuration options, these are automatically inherited
 * by all children — they are not reactive.
 */
export interface FormKitConfig {
  delimiter: string | false
  [index: string]: any
}

/**
 * The interface of the a FormKit node's context object. A FormKit node is a
 * proxy of this object.
 */
export interface FormKitContext<ValueType = void> {
  name: string | symbol
  type: string
  parent: FormKitNode | null
  config: FormKitConfig
  children: Set<FormKitNode>
  dependents: Set<FormKitNode>
  plugins: Set<FormKitPlugin>
  value: ValueType extends void ? any : ValueType
  traps: FormKitTraps
}

/**
 * Options that can be used to instantiate a new node via createNode()
 */
export type FormKitOptions = Partial<
  Omit<FormKitContext, 'children' | 'dependents' | 'plugins' | 'config'> & {
    config: Partial<FormKitConfig>
    children: FormKitNode[] | Set<FormKitNode>
    dependents: FormKitNode[] | Set<FormKitNode>
    plugins: FormKitPlugin[] | Set<FormKitPlugin>
  }
>

/**
 * The callback type for node.each()
 */
export interface FormKitChildCallback {
  (child: FormKitNode): void
}

/**
 * FormKit's Node object produced by createNode(). All inputs, forms, and groups
 * are instances of nodes.
 */
export type FormKitNode<T = void> = {
  readonly __FKNode__: true
  add: (node: FormKitNode) => FormKitNode
  address: FormKitAddress
  config: FormKitConfig
  each: (callback: FormKitChildCallback) => void
  index: number
  name: string
  remove: (node: FormKitNode) => FormKitNode
  setConfig: (config: FormKitConfig) => void
  use: (plugin: FormKitPlugin) => FormKitNode
  value: T extends void ? any : T
  walk: (callback: FormKitChildCallback) => void
} & Omit<FormKitContext, 'value' | 'name' | 'config'>

/**
 * If a node’s name is set to useIndex, it replaces the node’s name with the
 * index of the node relative to its parent’s children.
 */
export const useIndex = Symbol('index')

/**
 * The setter you are trying to access is invalid.
 */
const invalidSetter = (): never => {
  throw new Error()
}

/**
 * These are all the available "traps" for a given node. You can think of these
 * a little bit like methods, but they are really Proxy interceptors rather
 * than actual methods.
 */
const nodeTraps = {
  add: trap(addChild),
  address: trap(getAddress, invalidSetter, false),
  // at: trap(getNode),
  config: trap(false, invalidSetter),
  index: trap(getIndex, setIndex, false),
  each: trap(eachChild),
  parent: trap(false, setParent),
  remove: trap(removeChild),
  setConfig: trap(setConfig),
  use: trap(usePlugin),
  name: trap(getName, false, false),
  walk: trap(walkTree),
}

/**
 * Create a new set of proxy traps for a node.
 */
function createTraps(): FormKitTraps {
  return new Map<string | symbol, FormKitTrap>(Object.entries(nodeTraps))
}

/**
 * Creates a getter/setter trap and curries the context/node pair.
 * @param  {TrapGetter} getter
 * @param  {TrapSetter} setter?
 * @returns FormKitTrap
 */
function trap(
  getter?: TrapGetter,
  setter?: TrapSetter,
  curryGetter: boolean = true
): FormKitTrap {
  return {
    get: getter
      ? (node, context) =>
          curryGetter
            ? (...args: any[]) => getter(node, context, ...args)
            : getter(node, context)
      : false,
    set: setter !== undefined ? setter : invalidSetter,
  }
}

/**
 * Create a new context object for our a FormKit node, given default information
 * @param  {T} options
 * @returns FormKitContext
 */
function createContext<T extends FormKitOptions>(
  options: T
): FormKitContext<TypeOfValue<T>> {
  const type = options.type || 'text'
  return {
    name: createName(options, type),
    type,
    parent: options.parent || null,
    config: createConfig(options.parent, options.config),
    // consider using a proxies to block external modification on these?
    children: setify<FormKitNode>(options.children),
    dependents: setify<FormKitNode>(options.dependents),
    plugins: setify<FormKitPlugin>(options.plugins),
    traps: createTraps(),
    value: options.value || '',
  }
}

/**
 * This is a simple integer counter of every create(), it is used to
 * deterministically name new nodes.
 */
let nodeCount = 0
export function resetCount(): void {
  nodeCount = 0
}

/**
 * This node is responsible for deterministically generating an id for this
 * node. This cannot just be a random id, it _must_ be deterministic to ensure
 * re-hydration of the form (like post-SSR) produces the same names/ids.
 *
 * @param  {FormKitOptions} options
 * @returns string
 */
function createName(options: FormKitOptions, type: string): string | symbol {
  return options.name || `${type}_${++nodeCount}`
}

/**
 * (node.add) Adds a child to the node.
 * @param  {FormKitContext} context
 * @param  {FormKitNode} node
 * @param  {FormKitNode} child
 */
function addChild(
  node: FormKitNode,
  context: FormKitContext,
  child: FormKitNode
) {
  if (child.parent && child.parent !== node) {
    child.parent.remove(child)
  }
  context.children.add(child)
  child.parent = node
  return node
}

/**
 * (node.remove) Removes a child from the node.
 * @param  {FormKitContext} context
 * @param  {FormKitNode} node
 * @param  {FormKitNode} child
 */
function removeChild(
  node: FormKitNode,
  context: FormKitContext,
  child: FormKitNode
) {
  if (context.children.delete(child)) {
    child.parent = null
  }
  return node
}

/**
 * Iterate over each immediate child and perform a callback.
 * @param  {FormKitContext} context
 * @param  {FormKitNode} _node
 * @param  {FormKitChildCallback} callback
 */
function eachChild(
  _node: FormKitNode,
  context: FormKitContext,
  callback: FormKitChildCallback
) {
  context.children.forEach((child) => callback(child))
}

/**
 * Walk all nodes below this one and execute a callback.
 * @param  {FormKitNode} _node
 * @param  {FormKitContext} context
 * @param  {FormKitChildCallback} callback
 */
function walkTree(
  _node: FormKitNode,
  context: FormKitContext,
  callback: FormKitChildCallback
) {
  context.children.forEach((child) => {
    callback(child)
    child.walk(callback)
  })
}
/**
 * Set the configuration options of the node and it's subtree.
 * @param  {FormKitNode} node
 * @param  {FormKitContext} context
 * @param  {string} _property
 * @param  {FormKitConfig} config
 */
function setConfig(
  node: FormKitNode,
  context: FormKitContext,
  config: FormKitConfig
) {
  context.config = config
  node.walk((n) => n.setConfig(config))
}

/**
 * Moves a node in the parent’s children to the given index.
 * @param  {FormKitNode} node
 * @param  {FormKitContext} _context
 * @param  {string|symbol} _property
 * @param  {number} setIndex
 */
function setIndex(
  node: FormKitNode,
  _context: FormKitContext,
  _property: string | symbol,
  setIndex: number
) {
  if (isNode(node.parent)) {
    const children = [...node.parent.children]
    let index =
      setIndex >= children.length
        ? children.length - 1
        : setIndex < 0
        ? 0
        : setIndex
    const oldIndex = children.indexOf(node)
    if (oldIndex === -1) return false
    children.splice(oldIndex, 1)
    children.splice(index, 0, node)
    node.parent.children = new Set(children)
    return true
  }
  return false
}

/**
 * Retrieves the index of a node from the parent’s children.
 * @param  {FormKitNode} node
 */
function getIndex(node: FormKitNode) {
  return node.parent ? [...node.parent.children].indexOf(node) : -1
}

/**
 * Get the name of the current node, allowing for slight mutations.
 * @param  {FormKitNode} node
 * @param  {FormKitContext} context
 */
function getName(node: FormKitNode, context: FormKitContext) {
  return context.name !== useIndex ? context.name : node.index
}

/**
 * Returns the address of the current node.
 * @param  {FormKitNode} node
 * @param  {FormKitContext} context
 */
function getAddress(
  node: FormKitNode,
  context: FormKitContext
): FormKitAddress {
  return context.parent
    ? context.parent.address.concat([node.name])
    : [node.name]
}

/**
 * Fetches a node from the tree by its address.
 * @param  {FormKitContext} context
 * @param  {FormKitNode} node
 * @param  {string|FormKitAddress} location
 * @returns FormKitNode
 */
// function getNode(
//   node: FormKitNode,
//   _context: FormKitContext,
//   locator: string | FormKitAddress
// ): FormKitNode | false {
//   const address = typeof locator === 'string' && node.config
// }

/**
 * The setter for node.parent = FormKitNode
 * @param  {FormKitContext} _context
 * @param  {FormKitNode} node
 * @param  {string|symbol} _property
 * @param  {FormKitNode} parent
 * @returns boolean
 */
function setParent(
  child: FormKitNode,
  context: FormKitContext,
  _property: string | symbol,
  parent: FormKitNode
): boolean {
  if (isNode(parent)) {
    if (child.parent && child.parent !== parent) {
      child.parent.remove(child)
    }
    context.parent = parent
    child.setConfig(parent.config)
    if (!parent.children.has(child)) {
      parent.add(child)
    }
    return true
  }
  if (parent === null) {
    context.parent = null
    return true
  }
  return false
}

/**
 * Creates a new configuration option.
 * @param  {FormKitNode} parent?
 * @param  {Partial<FormKitConfig>} configOptions
 * @returns FormKitConfig
 */
function createConfig(
  parent?: FormKitNode | null,
  configOptions?: Partial<FormKitConfig>
): FormKitConfig {
  if (parent && !configOptions) {
    return parent.config
  }
  if (parent && configOptions) {
    return Object.assign(parent.config, configOptions)
  }
  return {
    delimiter: '.',
    ...configOptions,
  }
}

/**
 * Initialize a node object's internal properties.
 * @param  {FormKitNode} node
 * @returns FormKitNode
 */
function nodeInit(node: FormKitNode): FormKitNode {
  // Apply the parent to each child.
  node.each((child) => {
    child.parent = node
  })
  // If the node has a parent, ensure it's properly nested bi-directionally.
  if (node.parent) {
    node.parent.add(node)
  }
  return node
}

/**
 * Creates a new instance of a FormKit Node. Nodes are the atomic unit of
 * a FormKit graph.
 *
 * @param  {FormKitOptions={}} options
 * @returns FormKitNode
 */
export default function createNode<T extends FormKitOptions>(
  options: FormKitOptions = {}
): FormKitNode<TypeOfValue<T>> {
  const context = createContext(options)
  // Note: The typing for the proxy object cannot be fully modeled, thus we are
  // force-typing to a FormKitNode. See:
  // https://github.com/microsoft/TypeScript/issues/28067
  const node = new Proxy(context, {
    get(...args) {
      const [, property] = args
      const trap = context.traps.get(property)
      if (trap && trap.get) return trap.get(node, context)
      if (property === '__FKNode__') return true
      return Reflect.get(...args)
    },
    set(...args) {
      const [, property, value] = args
      const trap = context.traps.get(property)
      if (trap && trap.set) return trap.set(node, context, property, value)
      return Reflect.set(...args)
    },
  }) as unknown as FormKitNode<TypeOfValue<T>>
  return nodeInit(node)
}
