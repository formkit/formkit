import createDispatcher, { FormKitDispatcher } from './dispatcher'
import { FormKitSearchFunction, bfs, dedupe, eq, isNode, has } from './utils'
import {
  createEmitter,
  FormKitEvent,
  FormKitEventEmitter,
  emit,
  bubble,
  on,
  FormKitEventListener,
} from './events'
import { createStore, FormKitStore } from './store'

/**
 * The base interface definition for a FormKitPlugin — it's just a function that
 * accepts a node argument.
 * @public
 */
export interface FormKitPlugin<T = any> {
  (node: FormKitNode<T>): void | boolean
}

/**
 * The available hooks for middleware.
 * @public
 */
export interface FormKitHooks<ValueType> {
  init: FormKitDispatcher<ValueType>
  commit: FormKitDispatcher<ValueType>
  input: FormKitDispatcher<ValueType>
  prop: FormKitDispatcher<{
    prop: string | symbol
    value: any
  }>
  error: FormKitDispatcher<string | false>
}

/**
 * The definition of a FormKitTrap — these are somewhat like methods on each
 * FormKitNode — they are always symmetrical (get/set), although it's acceptable
 * for either to throw an Exception.
 * @public
 */
export interface FormKitTrap<T> {
  get: TrapGetter<T>
  set: TrapSetter<T>
}

/**
 * Describes the path to a particular node from the top of the tree.
 * @public
 */
export type FormKitAddress = Array<string | number>

/**
 * Determines if the 'value' property of an object has been set.
 */
type HasValue = { value: unknown }

/**
 * Determines if the 'type' property of an object exists.
 */
type HasType = { type: FormKitNodeType }

/**
 * Extracts the node type
 */
type ExtractType<T> = T extends HasType ? T['type'] : 'input'

/**
 * Extracts the type of the value from the node
 */
type ExtractValue<T> = T extends HasValue ? T['value'] : void

/**
 * These are the type of nodes that can be created — these are different from
 * the type of inputs available and rather describe their purpose in the tree.
 * @public
 */
export type FormKitNodeType = 'input' | 'list' | 'group'

/**
 * FormKit inputs of type 'group' must have keyed values by default.
 * @public
 */
export interface FormKitGroupValue {
  [index: string]: unknown
}

/**
 * FormKit inputs of type 'list' must have array values by default.
 * @public
 */
export type FormKitListValue<T = any> = Array<T>

/**
 * Given a FormKitNodeType determine what the proper value of the input is.
 * @public
 */
export type ExtractValueType<T extends FormKitNodeType> = T extends 'group'
  ? FormKitGroupValue
  : T extends 'list'
  ? FormKitListValue
  : void

/**
 * Type utility for determining the type of the value property.
 * @public
 */
export type FormKitNodeValue<T> = ExtractValueType<ExtractType<T>> extends void
  ? T extends HasValue // In this case we don’t have a `type` option, so infer from the value object
    ? T['value']
    : any
  : ExtractValue<T> extends ExtractValueType<ExtractType<T>>
  ? ExtractValue<T>
  : ExtractValueType<ExtractType<T>>

/**
 * Arbitrary data that has properties, could be a pojo, could be an array.
 * @public
 */
export interface KeyedValue {
  [index: number]: any
  [index: string]: any
}

/**
 * Define the most basic shape of a context object for type guards trying to
 * reason about a context's value.
 * @public
 */
export interface FormKitContextShape {
  type: FormKitNodeType
  value: unknown
  _value: unknown
}

/**
 * The simplest definition for a context of type "list".
 * @public
 */
export interface FormKitListContext {
  type: 'list'
  value: FormKitListValue
  _value: FormKitListValue
}

/**
 * Signature for any of the node's getter traps. Keep in mind that because these
 * are traps and not class methods, their response types are declared explicitly
 * in the FormKitNode interface.
 * @public
 */
export type TrapGetter<T> =
  | ((
      node: FormKitNode<T>,
      context: FormKitContext<T>,
      ...args: any[]
    ) => unknown)
  | false

/**
 * The signature for a node's trap setter — these are more rare than getter
 * traps, but can be really useful for blocking access to certain context
 * properties or modifying the behavior of an assignment (ex. see setParent)
 * @public
 */
export type TrapSetter<T> =
  | ((
      node: FormKitNode<T>,
      context: FormKitContext<T>,
      property: string | number | symbol,
      value: any
    ) => boolean | never)
  | false

/**
 * The map signature for a node's traps Map.
 * @public
 */
export type FormKitTraps<T> = Map<string | symbol, FormKitTrap<T>>

/**
 * General "app" like configuration options, these are automatically inherited
 * by all children — they are not reactive.
 * @public
 */
export interface FormKitConfig {
  delimiter: string
  [index: string]: any
}

/**
 * The user-land per-instance "props", which are generally akin to the props
 * passed into components on the front end.
 * @public
 */
export type FormKitProps = {
  delay: number
  [index: string]: any
} & FormKitConfig

/**
 * The interface of the a FormKit node's context object. A FormKit node is a
 * proxy of this object.
 * @public
 */
export interface FormKitContext<ValueType = any> {
  _d: number
  _e: FormKitEventEmitter
  _resolve: ((value: ValueType) => void) | false
  _t: number | false
  _value: ValueType
  children: Array<FormKitNode<any>>
  config: FormKitConfig
  hook: FormKitHooks<ValueType>
  isSettled: boolean
  name: string | symbol
  parent: FormKitNode<any> | null
  plugins: Set<FormKitPlugin>
  props: Partial<FormKitProps>
  settled: Promise<ValueType>
  store: FormKitStore
  traps: FormKitTraps<ValueType>
  type: FormKitNodeType
  value: ValueType
}

/**
 * Options that can be used to instantiate a new node via createNode()
 * @public
 */
export type FormKitOptions = Partial<
  Omit<FormKitContext, 'children' | 'plugins' | 'config' | 'hook'> & {
    config: Partial<FormKitConfig>
    props: Partial<FormKitProps>
    children: FormKitNode<any>[] | Set<FormKitNode<any>>
    plugins: FormKitPlugin[] | Set<FormKitPlugin>
  }
>

/**
 * The callback type for node.each()
 * @public
 */
export interface FormKitChildCallback {
  (child: FormKitNode): void
}

/**
 * A descriptor of a child value, generally passed up a node tree.
 * @public
 */
export interface FormKitChildValue {
  name: string | number | symbol
  value: any
  from?: number
}

/**
 * FormKit's Node object produced by createNode(). All inputs, forms, and groups
 * are instances of nodes.
 * @public
 */
export type FormKitNode<T = void> = {
  readonly __FKNode__: true
  readonly value: T extends void ? any : T
  _c: FormKitContext
  add: (node: FormKitNode<any>) => FormKitNode<T>
  at: (address: FormKitAddress | string) => FormKitNode<any> | undefined
  address: FormKitAddress
  bubble: (event: FormKitEvent) => FormKitNode<T>
  calm: (childValue?: FormKitChildValue) => void
  config: FormKitConfig
  disturb: () => FormKitNode<T>
  each: (callback: FormKitChildCallback) => void
  emit: (event: string, payload?: any) => FormKitNode<T>
  find: (
    selector: string,
    searcher?: keyof FormKitNode | FormKitSearchFunction<T>
  ) => FormKitNode | undefined
  hydrate: () => FormKitNode<T>
  index: number
  input: (value: T, async?: boolean) => FormKitNode<T>
  name: string
  on: (eventName: string, listener: FormKitEventListener) => FormKitNode<T>
  remove: (node: FormKitNode<any>) => FormKitNode<T>
  root: FormKitNode<any>
  setConfig: (config: FormKitConfig) => void
  settled: Promise<T>
  isSettled: boolean
  use: (
    plugin: FormKitPlugin | FormKitPlugin[] | Set<FormKitPlugin>
  ) => FormKitNode<T>
  walk: (callback: FormKitChildCallback) => void
} & Omit<FormKitContext, 'value' | 'name' | 'config'>

/**
 * If a node’s name is set to useIndex, it replaces the node’s name with the
 * index of the node relative to its parent’s children.
 * @public
 */
export const useIndex = Symbol('index')

/**
 * When propagating values up a tree, this value indicates the child should be
 * removed.
 * @public
 */
export const valueRemoved = Symbol('removed')

/**
 * When propagating values up a tree, this value indicates the child should be
 * moved.
 * @public
 */
export const valueMoved = Symbol('moved')

/**
 * A simple type guard to determine if the context being evaluated is a list
 * type.
 * @param arg -
 * @returns arg is FormKitListContext
 * @public
 */
export function isList(arg: FormKitContextShape): arg is FormKitListContext {
  return arg.type === 'list' && Array.isArray(arg._value)
}

/**
 * The setter you are trying to access is invalid.
 */
const invalidSetter = (): never => {
  // TODO add log event and error
  throw new Error()
}

/**
 * These are all the available "traps" for a given node. You can think of these
 * a little bit like methods, but they are really Proxy interceptors.
 */
function createTraps<T>(): FormKitTraps<T> {
  return new Map<string | symbol, FormKitTrap<T>>(
    Object.entries({
      _c: trap<T>(getContext, invalidSetter, false),
      add: trap<T>(addChild),
      address: trap<T>(getAddress, invalidSetter, false),
      at: trap<any>(getNode),
      bubble: trap<T>(bubble),
      calm: trap<T>(calm),
      config: trap<T>(false),
      disturb: trap<T>(disturb),
      hydrate: trap<T>(hydrate),
      index: trap<T>(getIndex, setIndex, false),
      input: trap<T>(input),
      each: trap<T>(eachChild),
      emit: trap<T>(emit),
      find: trap<T>(find),
      on: trap<T>(on),
      parent: trap<T>(false, setParent),
      plugins: trap<T>(false),
      remove: trap<T>(removeChild),
      root: trap<T>(getRoot, invalidSetter, false),
      setConfig: trap<T>(setConfig),
      use: trap<T>(use),
      name: trap<T>(getName, false, false),
      walk: trap<T>(walkTree),
    })
  )
}

/**
 * Creates a getter/setter trap and curries the context/node pair
 * @param getter - The getter function
 * @param setter - The setter function
 * @param curryGetter - Indicates if the getter should be curried or not
 * @returns
 */
function trap<T>(
  getter?: TrapGetter<T>,
  setter?: TrapSetter<T>,
  curryGetter = true
): FormKitTrap<T> {
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
 * Create all of the node's hook dispatchers.
 */
function createHooks<T>(): FormKitHooks<FormKitNodeValue<T>> {
  return {
    init: createDispatcher<FormKitNodeValue<T>>(),
    input: createDispatcher<FormKitNodeValue<T>>(),
    commit: createDispatcher<FormKitNodeValue<T>>(),
    prop: createDispatcher<{ prop: string | symbol; value: any }>(),
    error: createDispatcher<string | false>(),
  }
}

/**
 * This is a simple integer counter of every create(), it is used to
 * deterministically name new nodes.
 */
let nodeCount = 0

/**
 * Reports the global number of node registrations, useful for deterministic
 * node naming.
 * @public
 */
export function resetCount(): void {
  nodeCount = 0
}

/**
 * This node is responsible for deterministically generating an id for this
 * node. This cannot just be a random id, it _must_ be deterministic to ensure
 * re-hydration of the form (like post-SSR) produces the same names/ids.
 *
 * @param options -
 * @returns string
 */
function createName(
  options: FormKitOptions,
  type: FormKitNodeType
): string | symbol {
  if (options.parent?.type === 'list') return useIndex
  return options.name || `${type}_${++nodeCount}`
}

/**
 * Creates the initial value for a node based on the options passed in and the
 * type of the input.
 * @param options -
 * @param type -
 * @returns FormKitNodeValue<T>
 */
function createValue<T extends FormKitOptions>(
  options: T
): FormKitNodeValue<T> {
  // TODO there is some question of what should happen in this method for the
  // initial values — do we use the input hook? is the state initially
  // settled? does hydration happen after the fact? etc etc...
  if (options.type === 'group') {
    return typeof options.value === 'object' && !Array.isArray(options.value)
      ? options.value
      : {}
  } else if (options.type === 'list') {
    return (
      Array.isArray(options.value) ? options.value : []
    ) as FormKitNodeValue<T>
  }
  return options.value === null ? '' : options.value
}

/**
 * Sets the internal value of the node.
 * @param node -
 * @param context -
 * @param value -
 * @returns T
 */
function input<T>(
  node: FormKitNode<T>,
  context: FormKitContext,
  value: T,
  async = true
): Promise<T> {
  if (eq(context._value, value)) return context.settled
  context._value = node.hook.input.dispatch(value)
  node.emit('input', context._value)
  if (context.isSettled) node.disturb()
  if (async) {
    if (context._t) clearTimeout(context._t)
    context._t = setTimeout(commit, node.props.delay, node, context)
  } else {
    commit(node, context)
  }
  return context.settled
}

/**
 * Commits the working value to the node graph as the value of this node.
 * @param node -
 * @param context -
 * @param calm -
 * @param hydrate -
 */
function commit<T>(
  node: FormKitNode<T>,
  context: FormKitContext,
  calm = true,
  hydrate = true
) {
  if (node.type !== 'input' && hydrate) node.hydrate()
  context.value = node.hook.commit.dispatch(context._value)
  node.emit('commit', context.value)
  if (calm) node.calm()
}

/**
 * Perform a modification to a single element of a parent aggregate value. This
 * is only performed on the pre-committed value (_value), although typically
 * the value and _value are both linked in memory.
 * @param context -
 * @param name -
 * @param value -
 */
function partial(
  context: FormKitContext,
  { name, value, from }: FormKitChildValue
) {
  if (isList(context)) {
    const insert: any[] =
      value === valueRemoved
        ? []
        : value === valueMoved
        ? context._value.splice(from, 1)
        : [value]
    context._value.splice(name, value === valueMoved ? 0 : 1, ...insert)
    return
  }
  // In this case we know for sure we're dealing with a group, TS doesn't
  // know that however, so we use some unpleasant casting here
  if (value !== valueRemoved) {
    ;(context._value as unknown as FormKitGroupValue)[name as string] = value
  } else {
    delete (context._value as unknown as FormKitGroupValue)[name as string]
  }
}

/**
 * Pass values down to children by calling hydrate on them.
 * @param parent -
 * @param child -
 */
function hydrate<T>(
  node: FormKitNode<T>,
  context: FormKitContext<T>
): FormKitNode<T> {
  context.children.forEach((child) => {
    if (has(context._value, child.name)) {
      if ((context._value as KeyedValue)[child.name] !== undefined) {
        // In this case, the parent has a value to give to the child, so we
        // perform a down-tree synchronous input which will cascade values down
        // and then ultimately back up.
        child.input((context._value as KeyedValue)[child.name], false)
      }
    } else {
      // In this case, the parent’s values have no knowledge of the child
      // value — this typically occurs on the commit at the end of addChild()
      // we need to create a value reservation for this node’s name. This is
      // especially important when dealing with lists where index matters.
      if (node.type !== 'list' || typeof child.name === 'number') {
        partial(context, { name: child.name, value: child.value })
      }
    }
  })
  return node
}

/**
 * Disturbs the state of a node from settled to unsettled — creating appropriate
 * promises and resolutions.
 * @param node -
 * @param context -
 */
function disturb<T>(
  node: FormKitNode<T>,
  context: FormKitContext<T>
): FormKitNode<T> {
  if (context._d <= 0) {
    context.isSettled = false
    context.settled = new Promise((resolve) => {
      context._resolve = resolve
    })
    if (node.parent) node.parent?.disturb()
  }
  context._d++
  return node
}

/**
 * Calms the given node's disturbed state by one.
 * @param node -
 * @param context -
 */
function calm<T>(
  node: FormKitNode<T>,
  context: FormKitContext<T>,
  value?: FormKitChildValue
) {
  if (value !== undefined && node.type !== 'input') {
    partial(context, value)
    // Commit the value up, but do not hydrate back down
    return commit(node, context, true, false)
  }
  if (context._d > 0) context._d--
  if (context._d === 0) {
    context.isSettled = true
    if (node.parent)
      node.parent?.calm({ name: node.name, value: context.value })
    if (context._resolve) context._resolve(context.value)
  }
}

/**
 * (node.add) Adds a child to the node.
 * @param context -
 * @param node -
 * @param child -
 */
function addChild<T>(
  parent: FormKitNode<T>,
  parentContext: FormKitContext,
  child: FormKitNode<any>
) {
  if (parent.type === 'input') createError(parent, 1)
  if (child.parent && child.parent !== parent) {
    child.parent.remove(child)
  }
  // Synchronously set the initial value on the parent
  if (!parentContext.children.includes(child)) {
    parentContext.children.push(child)
    if (!child.isSettled) parent.disturb()
  }
  if (child.parent !== parent) {
    child.parent = parent
    // In this edge case middleware changed the parent assignment so we need to
    // re-add the child
    if (child.parent !== parent) {
      parent.remove(child)
      child.parent.add(child)
      return parent
    }
  } else {
    // When a parent is properly assigned, we inject the parent's plugins on the
    // child.
    child.use(parent.plugins)
  }
  // Finally we call commit here, which sub-calls hydrate(), hydrate() will
  // resolve any conflict between the parent and child values, and also ensure
  // proper "placeholders" are made on the parent.
  commit(parent, parentContext, false)
  return parent
}

/**
 * The setter for node.parent = FormKitNode
 * @param _context -
 * @param node -
 * @param _property -
 * @param parent -
 * @returns boolean
 */
function setParent<T>(
  child: FormKitNode<T>,
  context: FormKitContext,
  _property: string | number | symbol,
  parent: FormKitNode<any>
): boolean {
  if (isNode(parent)) {
    if (child.parent && child.parent !== parent) {
      child.parent.remove(child)
    }
    context.parent = parent
    child.setConfig(parent.config)
    !parent.children.includes(child)
      ? parent.add(child)
      : child.use(parent.plugins)
    return true
  }
  if (parent === null) {
    context.parent = null
    return true
  }
  return false
}

/**
 * (node.remove) Removes a child from the node.
 * @param context -
 * @param node -
 * @param child -
 */
function removeChild<T>(
  node: FormKitNode<T>,
  context: FormKitContext,
  child: FormKitNode<any>
) {
  const childIndex = context.children.indexOf(child)
  if (childIndex !== -1) {
    if (child.isSettled) node.disturb()
    context.children.splice(childIndex, 1)
    node.calm({
      name: node.type === 'list' ? childIndex : child.name,
      value: valueRemoved,
    })
    child.parent = null
  }
  return node
}

/**
 * Iterate over each immediate child and perform a callback.
 * @param context -
 * @param _node -
 * @param callback -
 */
function eachChild<T>(
  _node: FormKitNode<T>,
  context: FormKitContext,
  callback: FormKitChildCallback
) {
  context.children.forEach((child) => callback(child))
}

/**
 * Walk all nodes below this one and execute a callback.
 * @param _node -
 * @param context -
 * @param callback -
 */
function walkTree<T>(
  _node: FormKitNode<T>,
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
 * @param node -
 * @param context -
 * @param _property -
 * @param config -
 */
function setConfig<T>(
  node: FormKitNode<T>,
  context: FormKitContext,
  config: FormKitConfig
) {
  context.config = config
  node.walk((n) => n.setConfig(config))
}

/**
 * Adds a plugin to the node, it’s children, and executes it.
 * @param context -
 * @param node -
 * @param plugin -
 * @public
 */
export function use<T>(
  node: FormKitNode<T>,
  context: FormKitContext,
  plugin: FormKitPlugin<any> | FormKitPlugin<any>[] | Set<FormKitPlugin<any>>
): FormKitNode<T> {
  if (Array.isArray(plugin) || plugin instanceof Set) {
    plugin.forEach((p: FormKitPlugin<any>) => use(node, context, p))
    return node
  }
  if (!context.plugins.has(plugin)) {
    // When plugins return false, they are never added as to the plugins Set
    // meaning they only ever have access to the single node they were added on.
    if (plugin(node) !== false) {
      context.plugins.add(plugin)
      node.children.forEach((child) => child.use(plugin))
    }
  }
  return node
}

/**
 * Moves a node in the parent’s children to the given index.
 * @param node -
 * @param _context -
 * @param _property -
 * @param setIndex -
 */
function setIndex<T>(
  node: FormKitNode<T>,
  _context: FormKitContext,
  _property: string | number | symbol,
  setIndex: number
) {
  if (isNode(node.parent)) {
    const children = node.parent.children
    const index =
      setIndex >= children.length
        ? children.length - 1
        : setIndex < 0
        ? 0
        : setIndex
    const oldIndex = children.indexOf(node)
    if (oldIndex === -1) return false
    children.splice(oldIndex, 1)
    children.splice(index, 0, node)
    node.parent.children = children
    if (node.parent.type === 'list')
      node.parent
        .disturb()
        .calm({ name: index, value: valueMoved, from: oldIndex })
    return true
  }
  return false
}

/**
 * Retrieves the index of a node from the parent’s children.
 * @param node -
 */
function getIndex<T>(node: FormKitNode<T>) {
  return node.parent ? [...node.parent.children].indexOf(node) : -1
}

/**
 * Retrieves the context object of a given node. This is intended to be a
 * private trap and should absolutely not be used in plugins or user-land code.
 * @param _node -
 * @param context -
 */
function getContext<T>(_node: FormKitNode<T>, context: FormKitContext<T>) {
  return context
}

/**
 * Get the name of the current node, allowing for slight mutations.
 * @param node -
 * @param context -
 */
function getName<T>(node: FormKitNode<T>, context: FormKitContext<T>) {
  if (node.parent?.type === 'list') return node.index
  return context.name !== useIndex ? context.name : node.index
}

/**
 * Returns the address of the current node.
 * @param node -
 * @param context -
 */
function getAddress<T>(
  node: FormKitNode<T>,
  context: FormKitContext
): FormKitAddress {
  return context.parent
    ? context.parent.address.concat([node.name])
    : [node.name]
}

/**
 * Fetches a node from the tree by its address.
 * @param context -
 * @param node -
 * @param location -
 * @returns FormKitNode
 */
function getNode(
  node: FormKitNode,
  _context: FormKitContext,
  locator: string | FormKitAddress
): FormKitNode | undefined {
  const address =
    typeof locator === 'string' ? locator.split(node.config.delimiter) : locator
  if (!address.length) return undefined
  const first = address[0]
  let pointer: FormKitNode | null | undefined = node.parent
  if (!pointer) {
    // This address names the root node, remove it to get child name:
    if (String(address[0]) === String(node.name)) address.shift()
    // All root nodes start at themselves ultimately:
    pointer = node
  }
  // Any addresses starting with $parent should discard it
  if (first === '$parent') address.shift()
  while (pointer && address.length) {
    const name = address.shift() as string | number
    switch (name) {
      case '$root':
        pointer = node.root
        break
      case '$parent':
        pointer = pointer.parent
        break
      case '$self':
        pointer = node
        break
      default:
        pointer =
          pointer.children.find((c) => String(c.name) === String(name)) ||
          select(pointer, name)
    }
  }
  return pointer || undefined
}

/**
 * Perform selections on a subtree using the address "selector" methods.
 * @param node -
 * @param selector -
 * @returns FormKitNode | undefined
 */
function select(
  node: FormKitNode,
  selector: string | number
): FormKitNode | undefined {
  const matches = String(selector).match(/^(find)\((.*)\)$/)
  if (matches) {
    const [, action, argStr] = matches
    const args = argStr.split(',').map((arg) => arg.trim())
    switch (action) {
      case 'find':
        return node.find(args[0], args[1] as keyof FormKitNode)
      default:
        return undefined
    }
  }
  return undefined
}

/**
 * Perform a breadth first search and return the first instance of a node that
 * is found in the subtree or undefined.
 * @param node -
 * @param name -
 * @returns FormKitNode | undefined
 */
function find<T>(
  node: FormKitNode<T>,
  _context: FormKitContext,
  searchTerm: string,
  searcher: keyof FormKitNode | FormKitSearchFunction<T>
): FormKitNode | undefined {
  return bfs(node, searchTerm, searcher)
}

/**
 * Get the root node of the tree.
 */
function getRoot<T>(n: FormKitNode<T>) {
  let node = n
  while (node.parent) {
    node = node.parent
  }
  return node
}

/**
 * Creates a new configuration option.
 * @param parent -
 * @param configOptions -
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
    delay: 0,
    ...configOptions,
  }
}

/**
 * Create a new FormKit error.
 * @param node -
 * @param errorCode -
 * @public
 */
export function createError(node: FormKitNode<any>, errorCode: number): void {
  const e: string | false = node.hook.error.dispatch(`E${errorCode}`)
  node.emit('error', e)
  if (e !== false) throw new Error(e)
}

/**
 * @param options -
 * @param config -
 */
function createProps<T>(type: FormKitNodeType) {
  const props = {
    delay: type === 'input' ? 20 : 0,
  }
  let node: FormKitNode<T>
  return new Proxy(props, {
    get(...args) {
      const [_t, prop] = args
      if (has(props, prop)) return Reflect.get(...args)
      if (has(node.config, prop) && typeof prop === 'string')
        return node.config[prop]
      return undefined
    },
    set(target, property, originalValue, receiver) {
      if (property === '_n') {
        node = originalValue
        return true
      }
      const { prop, value } = node.hook.prop.dispatch({
        prop: property,
        value: originalValue,
      })
      const didSet = Reflect.set(target, prop, value, receiver)
      node.emit('prop', { prop, value })
      return didSet
    },
  })
}

/**
 * Create a new context object for our a FormKit node, given default information
 * @param options -
 * @returns FormKitContext
 */
function createContext<T extends FormKitOptions>(
  options: T
): FormKitContext<FormKitNodeValue<T>> {
  const type: FormKitNodeType = options.type || 'input'
  const value = createValue(options)
  const config = createConfig(options.parent, options.config)
  return {
    _d: 0,
    _e: createEmitter(),
    _resolve: false,
    _t: false,
    _value: value,
    children: dedupe(options.children || []),
    config,
    hook: createHooks(),
    isSettled: true,
    name: createName(options, type),
    parent: options.parent || null,
    plugins: new Set<FormKitPlugin>(),
    props: createProps(type),
    settled: Promise.resolve(value),
    store: createStore(),
    traps: createTraps<FormKitNodeValue<T>>(),
    type,
    value,
  }
}

/**
 * Initialize a node object's internal properties.
 * @param node -
 * @returns FormKitNode
 */
function nodeInit<T>(
  node: FormKitNode<T>,
  options: FormKitOptions
): FormKitNode<T> {
  // Inputs are leafs, and cannot have children
  if (node.type === 'input' && node.children.length) createError(node, 1)
  // Set the internal node on the message store
  node.store._n = node
  // If the options has plugins, we apply them
  options.plugins?.forEach((plugin: FormKitPlugin) => node.use(plugin))
  // Apply the input hook to the initial value, we don't need to disturb or
  // calm this because the node has not yet been attached to the parent.
  node._c._value = node._c.value = node.hook.init.dispatch(node._value)
  // Apply the parent to each child.
  node.each((child) => node.add(child))
  // If the node has a parent, ensure it's properly nested bi-directionally.
  if (node.parent) node.parent.add(node)
  // Set the internal node of the props proxy
  node.props._n = node
  // Apply given in options to the node.
  if (options.props) Object.assign(node.props, options.props)
  return node.emit('created', node)
}

/**
 * Creates a new instance of a FormKit Node. Nodes are the atomic unit of
 * a FormKit graph.
 *
 * @param options -
 * @returns FormKitNode
 * @public
 */
export function createNode<T extends FormKitOptions>(
  options?: T
): FormKitNode<FormKitNodeValue<T>> {
  const ops = options || {}
  const context = createContext(ops)
  // Note: The typing for the proxy object cannot be fully modeled, thus we are
  // force-typing to a FormKitNode. See:
  // https://github.com/microsoft/TypeScript/issues/28067
  const node = new Proxy(context, {
    get(...args) {
      const [, property] = args
      if (property === '__FKNode__') return true
      const trap = context.traps.get(property)
      if (trap && trap.get) return trap.get(node, context)
      return Reflect.get(...args)
    },
    set(...args) {
      const [, property, value] = args
      const trap = context.traps.get(property)
      if (trap && trap.set) return trap.set(node, context, property, value)
      return Reflect.set(...args)
    },
  }) as unknown as FormKitNode<FormKitNodeValue<T>>
  return nodeInit<FormKitNodeValue<T>>(node, ops)
}
