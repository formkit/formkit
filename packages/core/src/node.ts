import createDispatcher, { FormKitDispatcher } from './dispatcher'
import {
  dedupe,
  eq,
  has,
  camel,
  kebab,
  undefine,
  init,
  cloneAny,
  clone,
} from '@formkit/utils'
import {
  createEmitter,
  FormKitEvent,
  FormKitEventEmitter,
  emit,
  bubble,
  on,
  off,
  FormKitEventListener,
} from './events'
import { error } from './errors'
import {
  createStore,
  FormKitMessageProps,
  FormKitMessage,
  FormKitStore,
} from './store'
import { createLedger, FormKitLedger } from './ledger'
import { deregister, register } from './registry'
import {
  FormKitExtendableSchemaRoot,
  FormKitSchemaNode,
  FormKitSchemaCondition,
} from './schema'
import { FormKitClasses } from './classes'
import { FormKitRootConfig, configChange } from './config'
import { submitForm } from './submitForm'
import { createMessages, ErrorMessages } from './store'
import { reset } from './reset'

/**
 * Definition of a library item — when registering a new library item, these
 * are the required and available properties.
 * @public
 */
export type FormKitTypeDefinition = {
  type: FormKitNodeType
  props?: string[]
  schema?:
    | FormKitExtendableSchemaRoot
    | FormKitSchemaNode[]
    | FormKitSchemaCondition
  component?: unknown
  library?: Record<string, unknown>
  features?: Array<(node: FormKitNode) => void>
}

/**
 * A library of inputs, keyed by the name of the type.
 * @public
 */
export interface FormKitLibrary {
  [index: string]: FormKitTypeDefinition
}

/**
 * The base interface definition for a FormKitPlugin — it's just a function that
 * accepts a node argument.
 * @public
 */
export interface FormKitPlugin {
  (node: FormKitNode): false | any | void
  library?: (node: FormKitNode) => void
}

/**
 * Text fragments are small pieces of text used for things like interface
 * validation messages, or errors that may be exposed for modification or
 * even translation.
 * @public
 */
export type FormKitTextFragment = Partial<FormKitMessageProps> & {
  key: string
  value: string
  type: string
}

/**
 * The available hooks for middleware.
 * @public
 */
export interface FormKitHooks {
  classes: FormKitDispatcher<{
    property: string
    classes: Record<string, boolean>
  }>
  commit: FormKitDispatcher<any>
  error: FormKitDispatcher<string>
  init: FormKitDispatcher<FormKitNode>
  input: FormKitDispatcher<any>
  message: FormKitDispatcher<FormKitMessage>
  prop: FormKitDispatcher<{
    prop: string | symbol
    value: any
  }>
  text: FormKitDispatcher<FormKitTextFragment>
  schema: FormKitDispatcher<FormKitSchemaNode[] | FormKitSchemaCondition>
}

/**
 * The definition of a FormKitTrap — these are somewhat like methods on each
 * FormKitNode — they are always symmetrical (get/set), although it's acceptable
 * for either to throw an Exception.
 * @public
 */
export interface FormKitTrap {
  get: TrapGetter
  set: TrapSetter
}

/**
 * Describes the path to a particular node from the top of the tree.
 * @public
 */
export type FormKitAddress = Array<string | number>

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
  __init?: boolean
}

/**
 * FormKit inputs of type 'list' must have array values by default.
 * @public
 */
export type FormKitListValue<T = any> = Array<T>

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
export type TrapGetter =
  | ((node: FormKitNode, context: FormKitContext, ...args: any[]) => unknown)
  | false

/**
 * The signature for a node's trap setter — these are more rare than getter
 * traps, but can be really useful for blocking access to certain context
 * properties or modifying the behavior of an assignment (ex. see setParent)
 * @public
 */
export type TrapSetter =
  | ((
      node: FormKitNode,
      context: FormKitContext,
      property: string | number | symbol,
      value: any
    ) => boolean | never)
  | false

/**
 * The map signature for a node's traps Map.
 * @public
 */
export type FormKitTraps = Map<string | symbol, FormKitTrap>

/**
 * General "app" like configuration options, these are automatically inherited
 * by all children — they are not reactive.
 * @public
 */
export interface FormKitConfig {
  delimiter: string
  classes?: Record<string, FormKitClasses | string | Record<string, boolean>>
  rootClasses: (
    sectionKey: string,
    node: FormKitNode
  ) => Record<string, boolean>
  rootConfig?: FormKitRootConfig
  [index: string]: any
}

/**
 * The user-land per-instance "props", which are generally akin to the props
 * passed into components on the front end.
 * @public
 */
export type FormKitProps = {
  delay: number
  id: string
  validationLabelStrategy?: (node?: FormKitNode) => string
  validationRules?: Record<
    string,
    (node: FormKitNode) => boolean | Promise<boolean>
  >
  validationMessages?: Record<
    string,
    ((ctx: { name: string; args: any[]; node: FormKitNode }) => string) | string
  >
  definition?: FormKitTypeDefinition
  [index: string]: any
} & FormKitConfig

/**
 * The interface of the a FormKit node's context object. A FormKit node is a
 * proxy of this object.
 * @public
 */
export interface FormKitContext {
  /**
   * A node’s internal disturbance counter.
   */
  _d: number
  /**
   * A node’s internal event emitter.
   */
  _e: FormKitEventEmitter
  /**
   * A node’s internal disturbance counter promise.
   */
  _resolve: ((value: unknown) => void) | false
  /**
   * A node’s internal input timeout.
   */
  _tmo: number | false
  /**
   * A node’s internal pre-commit value.
   */
  _value: unknown
  /**
   * An array of child nodes (groups and lists)
   */
  children: Array<FormKitNode>
  /**
   * Configuration state for a given tree.
   */
  config: FormKitConfig
  /**
   * The context object of the current front end framework being used.
   */
  context?: FormKitFrameworkContext
  /**
   * Set of hooks
   */
  hook: FormKitHooks
  /**
   * Begins as false, set to true when the node is finished being created.
   */
  isCreated: boolean
  /**
   * Boolean determines if the node is in a settled state or not.
   */
  isSettled: boolean
  /**
   * A counting ledger for arbitrary message counters.
   */
  ledger: FormKitLedger
  /**
   * The name of the input — should be treated as readonly.
   */
  name: string | symbol
  /**
   * The parent of a node.
   */
  parent: FormKitNode | null
  /**
   * A Set of plugins registered on this node that can be inherited by children.
   */
  plugins: Set<FormKitPlugin>
  /**
   * An proxied object of props. These are typically provided by the adapter
   * of choice.
   */
  props: Partial<FormKitProps>
  /**
   * A promise that resolves when an input is in a settled state.
   */
  settled: Promise<unknown>
  /**
   * The internal node store.
   */
  store: FormKitStore
  /**
   * The traps available to a node.
   */
  traps: FormKitTraps
  /**
   * The type of node, should only be 'input', 'list', or 'group'.
   */
  type: FormKitNodeType
  /**
   * The actual value of the node.
   */
  value: unknown
}

/**
 * Context object to be created by and used by each respective UI framework. No
 * values are created or output by FormKitCore, but this interface
 * should be followed by each respective plugin.
 * @public
 */
export interface FormKitFrameworkContext {
  [index: string]: unknown
  /**
   * The current "live" value of the input. Not debounced.
   */
  _value: any
  /**
   * An object of attributes that (generally) should be applied to the root
   * <input> element.
   */
  attrs: Record<string, any>
  /**
   * Classes to apply on the various sections.
   */
  classes: Record<string, string>
  /**
   * Event handlers.
   */
  handlers: {
    blur: () => void
    touch: () => void
    DOMInput: (e: Event) => void
  } & Record<string, (...args: any[]) => void>
  /**
   * Utility functions, generally for use in the input’s schema.
   */
  fns: Record<string, (...args: any[]) => any>
  /**
   * The help text of the input.
   */
  help?: string
  /**
   * The unique id of the input. Should also be applied as the id attribute.
   * This is generally required for accessibility reasons.
   */
  id: string
  /**
   * The label of the input.
   */
  label?: string
  /**
   * A list of messages to be displayed on the input. Often these are validation
   * messages and error messages, but other `visible` core node messages do also
   * apply here. This object is only populated when the validation should be
   * actually displayed.
   */
  messages: Record<string, FormKitMessage>
  /**
   * The core node of this input.
   */
  node: FormKitNode
  /**
   * If this input type accepts options (like select lists and checkboxes) then
   * this will be populated with a properly structured list of options.
   */
  options?: Array<Record<string, any> & { label: string; value: any }>
  /**
   * A collection of state trackers/details about the input.
   */
  state: FormKitFrameworkContextState
  /**
   * The type of input "text" or "select" (retrieved from node.props.type). This
   * is not the core node type (input, group, or list).
   */
  type: string
  /**
   * The current committed value of the input. This is the value that should be
   * used for most use cases.
   */
  value: any
}

/**
 * The state inside a node’s framework context. Usually used to track things
 * like blurred, and validity states.
 * @public
 */
export interface FormKitFrameworkContextState {
  /**
   * If the input has been blurred.
   */
  blurred: boolean
  /**
   * True when these conditions are met:
   *
   * Either:
   * - The input has validation rules
   * - The validation rules are all passing
   * - There are no errors on the input
   * Or:
   * - The input has no validation rules
   * - The input has no errors
   * - The input is dirty and has a value
   *
   * This is not intended to be used on forms/groups/lists but instead on
   * individual inputs. Imagine placing a green checkbox next to each input
   * when the user filled it out correctly — thats what these are for.
   */
  complete: boolean
  /**
   * If the input has had a value typed into it or a change made to it.
   */
  dirty: boolean
  /**
   * If the input has explicit errors placed on it, or in the case of a group,
   * list, or form, this is true if any children have errors on them.
   */
  errors: boolean
  /**
   * True when the input has validation rules. Has nothing to do with the
   * state of those validation rules.
   */
  rules: boolean
  /**
   * True when the input has completed its internal debounce cycle and the
   * value was committed to the form.
   */
  settled: boolean
  /**
   * If the form has been submitted.
   */
  submitted: boolean
  /**
   * If the input (or group/form/list) is passing all validation rules. In
   * the case of groups, forms, and lists this includes the validation state
   * of all its children.
   */
  valid: boolean
  /**
   * If the validation-visibility has been satisfied and any validation
   * messages should be displayed.
   */
  validationVisible: boolean
  /**
   * Allow users to add their own arbitrary states.
   */
  [index: string]: boolean
}

/**
 * Options that can be used to instantiate a new node via createNode()
 * @public
 */
export type FormKitOptions = Partial<
  Omit<FormKitContext, 'children' | 'plugins' | 'config' | 'hook'> & {
    config: Partial<FormKitConfig>
    props: Partial<FormKitProps>
    children: FormKitNode[] | Set<FormKitNode>
    index?: number
    plugins: FormKitPlugin[]
    alias: string
    schemaAlias: string
  }
>

/**
 * The callback type for node.each()
 * @public
 */
export interface FormKitChildCallback {
  (child: FormKitNode): any
}

/**
 * A descriptor of a child value, generally passed up a node tree.
 * @public
 */
export interface FormKitChildValue {
  name: string | number | symbol
  value: any
  from?: number | symbol
}

/**
 * FormKit's Node object produced by createNode(). All inputs, forms, and groups
 * are instances of nodes.
 * @public
 */
export type FormKitNode = {
  /**
   * Boolean true indicating this object is a valid FormKitNode
   */
  readonly __FKNode__: true
  /**
   * The value of the input. This should never be directly modified. Any
   * desired mutations should be made through node.input()
   */
  readonly value: unknown
  /**
   * The internal FormKitContext object — this is not a public API and should
   * never be used outside of the core package itself. It is only here for
   * internal use and as an escape hatch.
   */
  _c: FormKitContext
  /**
   * Add a child to a node, the node must be a group or list.
   */
  add: (node: FormKitNode, index?: number) => FormKitNode
  /**
   * Adds props to the given node by removing them from node.props.attrs and
   * moving them to the top-level node.props object.
   */
  addProps: (props: string[]) => FormKitNode
  /**
   * Gets a node at another address. Addresses are dot-syntax paths (or arrays)
   * of node names. For example: form.users.0.first_name There are a few
   * "special" traversal tokens as well:
   * $root - Selects the root node
   * $parent - Selects the parent node
   * $self — Selects the current node
   */
  at: (address: FormKitAddress | string) => FormKitNode | undefined
  /**
   * The address of the current node, from the root of the tree.
   */
  address: FormKitAddress
  /**
   * An internal function used to bubble an event from a child to a parent.
   */
  bubble: (event: FormKitEvent) => FormKitNode
  /**
   * An internal mechanism for calming a disturbance — which is a mechanism
   * used to know the state of input settlement in the tree.
   */
  calm: (childValue?: FormKitChildValue) => FormKitNode
  /**
   * Clears the errors of the node, and optionally all the children.
   */
  clearErrors: (clearChildren?: boolean) => FormKitNode
  /**
   * An object that is shared tree-wide with various configuration options that
   * should be applied to the entire tree.
   */
  config: FormKitConfig
  /**
   * Defines the current input's library type definition including node type,
   * schema, and props.
   */
  define: (definition: FormKitTypeDefinition) => void
  /**
   * Increments a disturbance. A disturbance is a record that the input or a
   * member of its subtree is no longer "settled". Disturbed nodes are ones
   * that have had their value modified, but have not yet committed that value
   * to the rest of the tree.
   */
  disturb: () => FormKitNode
  /**
   * Removes the node from the global registry, removes it from its parent, and
   * emits the 'destroying' event.
   */
  destroy: () => void
  /**
   * Perform given callback on each of the given node's children.
   */
  each: (callback: FormKitChildCallback) => void
  /**
   * Emit an event from the node.
   */
  emit: (event: string, payload?: any, bubble?: boolean) => FormKitNode
  /**
   * Within a given tree, find a node matching a given selector. Selectors
   * can be simple strings or a function.
   */
  find: (
    selector: string,
    searcher?: keyof FormKitNode | FormKitSearchFunction
  ) => FormKitNode | undefined
  /**
   * An internal mechanism to hydrate values down a node tree.
   */
  hydrate: () => FormKitNode
  /**
   * The index of a node compared to its siblings. This is only applicable in
   * cases where a node is a child of a list.
   */
  index: number
  /**
   * The function used to set the value of a node. All changes to a node's value
   * should use this function as it ensures the tree's state is always fully
   * tracked.
   */
  input: (value: unknown, async?: boolean) => Promise<unknown>
  /**
   * The name of the input in the node tree. When a node is a child of a list
   * this automatically becomes its index.
   */
  name: string
  /**
   * Adds an event listener for a given event, and returns a "receipt" which is
   * a random string token. This token should be used to remove the listener
   * in the future. Alternatively you can assign a "receipt" property to the
   * listener function and that receipt will be used instead — this allows
   * multiple listeners to all be de-registered with a single off() call if they
   * share the same receipt.
   */
  on: (eventName: string, listener: FormKitEventListener) => string
  /**
   * Removes an event listener by its token. Receipts can be shared among many
   * event listeners by explicitly declaring the "receipt" property of the
   * listener function.
   */
  off: (receipt: string) => FormKitNode
  /**
   * Remove a child from a node.
   */
  remove: (node: FormKitNode) => FormKitNode
  /**
   * Retrieves the root node of a tree. This is accomplished via tree-traversal
   * on-request, and as such should not be used in frequently called functions.
   */
  root: FormKitNode
  /**
   * Sets the configuration of a node.
   */
  resetConfig: () => void
  /**
   * Reset a node’s value back to its original value.
   */
  reset: () => FormKitNode
  /**
   * Sets errors on the input, and optionally, and child inputs.
   */
  setErrors: (localErrors: ErrorMessages, childErrors?: ErrorMessages) => void
  /**
   * A promise that resolves when a node and its entire subtree is settled.
   * In other words — all the inputs are done committing their values.
   */
  settled: Promise<unknown>
  /**
   * Triggers a submit event on the nearest form.
   */
  submit: () => void
  /**
   * A text or translation function that exposes a given string to the "text"
   * hook — all text shown to users should be passed through this function
   * before being displayed — especially for core and plugin authors.
   */
  t: (key: string | FormKitTextFragment) => string
  /**
   * Boolean reflecting the settlement state of the node and its subtree.
   */
  isSettled: boolean
  /**
   * Registers a new plugin on the node and its subtree.
   * run = should the plugin be executed or not
   * library = should the plugin's library function be executed (if there)
   */
  use: (
    plugin: FormKitPlugin | FormKitPlugin[] | Set<FormKitPlugin>,
    run?: boolean,
    library?: boolean
  ) => FormKitNode
  /**
   * Performs a function on the node and every node in the subtree. This is an
   * expensive operation so it should be done very rarely and only lifecycle
   * events that are relatively rare like boot up and shut down.
   */
  walk: (callback: FormKitChildCallback, stopOnFalse?: boolean) => void
} & Omit<FormKitContext, 'value' | 'name' | 'config'>

/**
 * Breadth and Depth first searches can use a callback of this notation.
 * @public
 */
export type FormKitSearchFunction = (
  node: FormKitNode,
  searchTerm?: string | number
) => boolean

/**
 * Default configuration options.
 */
const defaultConfig: Partial<FormKitConfig> = {
  delimiter: '.',
  delay: 0,
  locale: 'en',
  rootClasses: (key: string) => ({ [`formkit-${kebab(key)}`]: true }),
}

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
 * When creating a new node and having its value injected directly at a specific
 * location.
 * @public
 */
export const valueInserted = Symbol('inserted')

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
 * Determine if a given object is a node
 * @public
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isNode(node: any): node is FormKitNode {
  return node && typeof node === 'object' && node.__FKNode__ === true
}

/**
 * The setter you are trying to access is invalid.
 */
const invalidSetter = (
  node: FormKitNode,
  _context: FormKitContext,
  property: PropertyKey
): never => {
  error(102, [node, property])
}

const traps = {
  _c: trap(getContext, invalidSetter, false),
  add: trap(addChild),
  addProps: trap(addProps),
  address: trap(getAddress, invalidSetter, false),
  at: trap(getNode),
  bubble: trap(bubble),
  clearErrors: trap(clearErrors),
  calm: trap(calm),
  config: trap(false),
  define: trap(define),
  disturb: trap(disturb),
  destroy: trap(destroy),
  hydrate: trap(hydrate),
  index: trap(getIndex, setIndex, false),
  input: trap(input),
  each: trap(eachChild),
  emit: trap(emit),
  find: trap(find),
  on: trap(on),
  off: trap(off),
  parent: trap(false, setParent),
  plugins: trap(false),
  remove: trap(removeChild),
  root: trap(getRoot, invalidSetter, false),
  reset: trap(resetValue),
  resetConfig: trap(resetConfig),
  setErrors: trap(setErrors),
  submit: trap(submit),
  t: trap(text),
  use: trap(use),
  name: trap(getName, false, false),
  walk: trap(walkTree),
}

/**
 * These are all the available "traps" for a given node. You can think of these
 * a little bit like methods, but they are really Proxy interceptors.
 */
function createTraps(): FormKitTraps {
  return new Map<string | symbol, FormKitTrap>(Object.entries(traps))
}

/**
 * Creates a getter/setter trap and curries the context/node pair
 * @param getter - The getter function
 * @param setter - The setter function
 * @param curryGetter - Indicates if the getter should be curried or not
 * @returns
 */
function trap(
  getter?: TrapGetter,
  setter?: TrapSetter,
  curryGetter = true
): FormKitTrap {
  return {
    get: getter
      ? (node, context) =>
          curryGetter
            ? (...args: any[]) => getter(node, context, ...args)
            : getter(node, context)
      : false,
    set: setter !== undefined ? setter : invalidSetter.bind(null),
  }
}

/**
 * Create all of the node's hook dispatchers.
 */
function createHooks(): FormKitHooks {
  const hooks: Map<string, FormKitDispatcher<unknown>> = new Map()
  return new Proxy(hooks, {
    get(_, property: string) {
      if (!hooks.has(property)) {
        hooks.set(property, createDispatcher())
      }
      return hooks.get(property)
    },
  }) as unknown as FormKitHooks
}

/**
 * This is a simple integer counter of every createName() where the name needs
 * to be generated.
 */
let nameCount = 0
/**
 * This is a simple integer counter of every default id created.
 */
let idCount = 0

/**
 * Reports the global number of node registrations, useful for deterministic
 * node naming.
 * @public
 */
export function resetCount(): void {
  nameCount = 0
  idCount = 0
}

/**
 * Create a name based dictionary of all children in an array.
 * @param children -
 * @public
 */
export function names(children: FormKitNode[]): {
  [index: string]: FormKitNode
} {
  return children.reduce(
    (named, child) => Object.assign(named, { [child.name]: child }),
    {}
  )
}

/**
 * This node is responsible for deterministically generating an id for this
 * node. This cannot just be a random id, it _must_ be deterministic to ensure
 * re-hydration of the form (like post-SSR) produces the same names/ids.
 *
 * @param options -
 * @returns string
 */
function createName(options: FormKitOptions): string | symbol {
  if (options.parent?.type === 'list') return useIndex
  return options.name || `${options.props?.type || 'input'}_${++nameCount}`
}

/**
 * Creates the initial value for a node based on the options passed in and the
 * type of the input.
 * @param options -
 * @param type -
 * @returns
 * @internal
 */
export function createValue(options: FormKitOptions): unknown {
  if (options.type === 'group') {
    return init(
      options.value &&
        typeof options.value === 'object' &&
        !Array.isArray(options.value)
        ? options.value
        : {}
    )
  } else if (options.type === 'list') {
    return init(Array.isArray(options.value) ? options.value : [])
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
function input(
  node: FormKitNode,
  context: FormKitContext,
  value: unknown,
  async = true
): Promise<unknown> {
  context._value = validateInput(node, node.hook.input.dispatch(value))
  node.emit('input', context._value)
  if (context.isSettled) node.disturb()
  if (async) {
    if (context._tmo) clearTimeout(context._tmo)
    context._tmo = setTimeout(
      commit,
      node.props.delay,
      node,
      context
    ) as unknown as number
  } else {
    commit(node, context)
  }
  return context.settled
}

/**
 * Validate that the current input is allowed.
 * @param type - The type of node (input, list, group)
 * @param value - The value that is being set
 */
function validateInput<T>(node: FormKitNode, value: T): T {
  switch (node.type) {
    // Inputs are allowed to have any type
    case 'input':
      break
    case 'group':
      if (!value || typeof value !== 'object') error(107, [node, value])
      break
    case 'list':
      if (!Array.isArray(value)) error(108, [node, value])
      break
  }
  return value
}

/**
 * Commits the working value to the node graph as the value of this node.
 * @param node -
 * @param context -
 * @param calm -
 * @param hydrate -
 */
function commit(
  node: FormKitNode,
  context: FormKitContext,
  calm = true,
  hydrate = true
) {
  context._value = context.value = node.hook.commit.dispatch(context._value)
  if (node.type !== 'input' && hydrate) node.hydrate()
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
  if (Object.isFrozen(context._value)) return
  if (isList(context)) {
    const insert: any[] =
      value === valueRemoved
        ? []
        : value === valueMoved && typeof from === 'number'
        ? context._value.splice(from, 1)
        : [value]
    context._value.splice(
      name as number,
      value === valueMoved || from === valueInserted ? 0 : 1,
      ...insert
    )
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
function hydrate(node: FormKitNode, context: FormKitContext): FormKitNode {
  const _value = context._value as KeyedValue
  context.children.forEach((child) => {
    if (typeof _value !== 'object') return
    // if (has(context._value as FormKitGroupValue, child.name)) {
    if (child.name in _value) {
      // In this case, the parent has a value to give to the child, so we
      // perform a down-tree synchronous input which will cascade values down
      // and then ultimately back up.
      const childValue =
        child.type !== 'input' ||
        (_value[child.name] && typeof _value[child.name] === 'object')
          ? init(_value[child.name])
          : _value[child.name]
      child.input(childValue, false)
    } else {
      if (node.type !== 'list' || typeof child.name === 'number') {
        // In this case, the parent’s values have no knowledge of the child
        // value — this typically occurs on the commit at the end of addChild()
        // we need to create a value reservation for this node’s name. This is
        // especially important when dealing with lists where index matters.
        partial(context, { name: child.name, value: child.value })
      }
      if (!_value.__init) {
        // In this case, someone has explicitly set the value to an empty object
        // with node.input({}) so we do not define the __init property:
        if (child.type === 'group') child.input({}, false)
        else if (child.type === 'list') child.input([], false)
        else child.input(undefined, false)
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
function disturb(node: FormKitNode, context: FormKitContext): FormKitNode {
  if (context._d <= 0) {
    context.isSettled = false
    node.emit('settled', false, false)
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
function calm(
  node: FormKitNode,
  context: FormKitContext,
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
    node.emit('settled', true, false)
    if (node.parent)
      node.parent?.calm({ name: node.name, value: context.value })
    if (context._resolve) context._resolve(context.value)
  }
}

/**
 * This node is being removed and needs to be cleaned up.
 * @param node - The node to shut down
 * @param context - The context to clean up
 */
function destroy(node: FormKitNode, context: FormKitContext) {
  node.emit('destroying', node)
  // flush all messages out
  node.store.filter(() => false)
  if (node.parent) {
    node.parent.remove(node)
  }
  deregister(node)
  context._value = context.value = undefined
  node.emit('destroyed', node)
}

/**
 * Defines the current input type concretely.
 * @param definition - The definition of the current input type.
 */
function define(
  node: FormKitNode,
  context: FormKitContext,
  definition: FormKitTypeDefinition
) {
  // Assign the type
  context.type = definition.type
  // Assign the definition
  context.props.definition = clone(definition)
  // Ensure the type is seeded with the `__init` value.
  context.value = context._value = createValue({
    type: node.type,
    value: context.value,
  })
  // Apply any input features before resetting the props.
  if (definition.features) {
    definition.features.forEach((feature) => feature(node))
  }

  // Its possible that input-defined "props" have ended up in the context attrs
  // these should be moved back out of the attrs object.
  if (definition.props) {
    node.addProps(definition.props)
  }
  node.emit('defined', definition)
}

/**
 * Adds props to a given node by stripping them out of the node.props.attrs and
 * then adding them to the nodes.
 *
 * @param node - The node to add props to
 * @param context - The internal context object
 * @param props - An array of prop strings (in camelCase!)
 */
function addProps(
  node: FormKitNode,
  context: FormKitContext,
  props: string[]
): FormKitNode {
  if (node.props.attrs) {
    const attrs = { ...node.props.attrs }
    // Temporarily disable prop emits
    node.props._emit = false
    for (const attr in attrs) {
      const camelName = camel(attr)
      if (props.includes(camelName)) {
        node.props[camelName] = attrs[attr]
        delete attrs[attr]
      }
    }
    const initial = cloneAny(context._value)
    node.props.initial =
      node.type !== 'input' ? init(initial as KeyedValue) : initial
    // Re-enable prop emits
    node.props._emit = true
    node.props.attrs = attrs

    if (node.props.definition) {
      node.props.definition.props = [
        ...(node.props.definition?.props || []),
        ...props,
      ]
    }
  }
  node.emit('added-props', props)
  return node
}

/**
 * (node.add) Adds a child to the node.
 * @param context -
 * @param node -
 * @param child -
 */
function addChild(
  parent: FormKitNode,
  parentContext: FormKitContext,
  child: FormKitNode,
  listIndex?: number
) {
  if (parent.type === 'input') error(100, parent)
  if (child.parent && child.parent !== parent) {
    child.parent.remove(child)
  }
  // Synchronously set the initial value on the parent
  if (!parentContext.children.includes(child)) {
    if (listIndex !== undefined && parent.type === 'list') {
      // Inject the child:
      parentContext.children.splice(listIndex, 0, child)

      if (
        Array.isArray(parent.value) &&
        parent.value.length < parentContext.children.length
      ) {
        // When adding an node or value to a list it is absolutely critical to
        // know if, at the moment of injection, the parent’s value or the node
        // children are the source of truth. For example, if a user pushes or
        // splices a new value onto the lists’s array then we want to use that
        // value as the value of the new node, but if a user adds a node to the
        // list then we want the node’s value. In this specific case, we
        // assume (due to length) that a new node was injected into the list, so
        // we want that new node’s value injected into the parent list value.
        parent.disturb().calm({
          name: listIndex,
          value: child.value,
          from: valueInserted,
        })
      }
    } else {
      parentContext.children.push(child)
    }
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
  parent.ledger.merge(child)
  parent.emit('child', child)
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
function setParent(
  child: FormKitNode,
  context: FormKitContext,
  _property: string | number | symbol,
  parent: FormKitNode
): boolean {
  if (isNode(parent)) {
    if (child.parent && child.parent !== parent) {
      child.parent.remove(child)
    }
    context.parent = parent
    child.resetConfig()
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
function removeChild(
  node: FormKitNode,
  context: FormKitContext,
  child: FormKitNode
) {
  const childIndex = context.children.indexOf(child)
  if (childIndex !== -1) {
    if (child.isSettled) node.disturb()
    context.children.splice(childIndex, 1)
    // If an ancestor uses the preserve prop, then we are expected to not remove
    // our values on this node either, see #53
    let preserve = undefine(child.props.preserve)
    let parent = child.parent
    while (preserve === undefined && parent) {
      preserve = undefine(parent.props.preserve)
      parent = parent.parent
    }
    if (!preserve) {
      node.calm({
        name: node.type === 'list' ? childIndex : child.name,
        value: valueRemoved,
      })
    } else {
      node.calm()
    }
    child.parent = null
    // Remove the child from the config. Is this weird? Yes. Is it ok? Yes.
    child.config._rmn = child
  }
  node.ledger.unmerge(child)
  return node
}

/**
 * Iterate over each immediate child and perform a callback.
 * @param context -
 * @param _node -
 * @param callback -
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
 * @param _node -
 * @param context -
 * @param callback -
 */
function walkTree(
  _node: FormKitNode,
  context: FormKitContext,
  callback: FormKitChildCallback,
  stopIfFalse = false
) {
  context.children.forEach((child) => {
    if (callback(child) !== false || !stopIfFalse) {
      child.walk(callback)
    }
  })
}

/**
 * Set the configuration options of the node and it's subtree.
 * @param node -
 * @param context -
 * @param _property -
 * @param config -
 */
function resetConfig(node: FormKitNode, context: FormKitContext) {
  const parent = node.parent || undefined
  context.config = createConfig(node.config._t, parent)
  node.walk((n) => n.resetConfig())
}

/**
 * Adds a plugin to the node, it’s children, and executes it.
 * @param context -
 * @param node -
 * @param plugin -
 * @public
 */
export function use(
  node: FormKitNode,
  context: FormKitContext,
  plugin: FormKitPlugin | FormKitPlugin[] | Set<FormKitPlugin>,
  run = true,
  library = true
): FormKitNode {
  if (Array.isArray(plugin) || plugin instanceof Set) {
    plugin.forEach((p: FormKitPlugin) => use(node, context, p))
    return node
  }
  if (!context.plugins.has(plugin)) {
    if (library && typeof plugin.library === 'function') plugin.library(node)
    // When plugins return false, they are never added as to the plugins Set
    // meaning they only ever have access to the single node they were added on.
    if (run && plugin(node) !== false) {
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
function setIndex(
  node: FormKitNode,
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
function getIndex(node: FormKitNode) {
  if (node.parent) {
    const index = [...node.parent.children].indexOf(node)
    // If the index is currently -1 then the node isnt finished booting, so it
    // must be the next node.
    return index === -1 ? node.parent.children.length : index
  }
  return -1
}

/**
 * Retrieves the context object of a given node. This is intended to be a
 * private trap and should absolutely not be used in plugins or user-land code.
 * @param _node -
 * @param context -
 */
function getContext(_node: FormKitNode, context: FormKitContext) {
  return context
}

/**
 * Get the name of the current node, allowing for slight mutations.
 * @param node -
 * @param context -
 */
function getName(node: FormKitNode, context: FormKitContext) {
  if (node.parent?.type === 'list') return node.index
  return context.name !== useIndex ? context.name : node.index
}

/**
 * Returns the address of the current node.
 * @param node -
 * @param context -
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
 * @param node - The node to start the search on/under
 * @param _context - The context object
 * @param searchTerm - The term we are searching for
 * @param searcher - Either a key to search on, or a function
 * @returns
 */
function find(
  node: FormKitNode,
  _context: FormKitContext,
  searchTerm: string,
  searcher: keyof FormKitNode | FormKitSearchFunction
): FormKitNode | undefined {
  return bfs(node, searchTerm, searcher)
}

/**
 * Perform a breadth-first-search on a node subtree and locate the first
 * instance of a match.
 * @param node -
 * @param name -
 * @returns FormKitNode
 * @public
 */
export function bfs(
  tree: FormKitNode,
  searchValue: string | number,
  searchGoal: keyof FormKitNode | FormKitSearchFunction = 'name'
): FormKitNode | undefined {
  const search: FormKitSearchFunction =
    typeof searchGoal === 'string'
      ? (n: FormKitNode) => n[searchGoal] == searchValue // non-strict comparison is intentional
      : searchGoal
  const stack = [tree]
  while (stack.length) {
    const node = stack.shift()! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    if (search(node, searchValue)) return node
    stack.push(...node.children)
  }
  return undefined
}

/**
 * Get the root node of the tree.
 */
function getRoot(n: FormKitNode) {
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
  target: Partial<FormKitConfig> = {},
  parent?: FormKitNode | null
): FormKitConfig {
  let node: FormKitNode | undefined = undefined
  return new Proxy(target, {
    get(...args) {
      const prop = args[1]
      if (prop === '_t') return target
      const localValue = Reflect.get(...args)
      // Check our local values first
      if (localValue !== undefined) return localValue
      // Then check our parent values next
      if (parent) {
        const parentVal = parent.config[prop as string]
        if (parentVal !== undefined) return parentVal
      }
      if (target.rootConfig && typeof prop === 'string') {
        const rootValue = target.rootConfig[prop]
        if (rootValue !== undefined) return rootValue
      }
      // The default delay value should be 20
      if (prop === 'delay' && node?.type === 'input') return 20
      // Finally check the default values
      return defaultConfig[prop as string]
    },
    set(...args) {
      const prop = args[1] as string
      const value = args[2]
      if (prop === '_n') {
        node = value as FormKitNode
        if (target.rootConfig) target.rootConfig._add(node)
        return true
      }
      if (prop === '_rmn') {
        if (target.rootConfig) target.rootConfig._rm(node as FormKitNode)
        node = undefined
        return true
      }
      if (!eq(target[prop as string], value, false)) {
        const didSet = Reflect.set(...args)
        if (node) {
          node.emit(`config:${prop}`, value, false)
          configChange(node, prop, value)
          // Walk the node tree and notify of config/prop changes where relevant
          node.walk((n) => configChange(n, prop, value), true)
        }
        return didSet
      }
      return true
    },
  }) as FormKitConfig
}

/**
 * Given a string of text, expose it for modification, translation, or full
 * replacement.
 * @param key - A message key, or generic string of text
 * @returns
 */
function text(
  node: FormKitNode,
  _context: FormKitContext,
  key: string | FormKitTextFragment,
  type = 'ui'
): string {
  const fragment = typeof key === 'string' ? { key, value: key, type } : key
  const value = node.hook.text.dispatch(fragment)
  node.emit('text', value, false)
  return value.value
}

/**
 * Submits the nearest ancestor that is a FormKit "form". It determines which
 * node is a form by locating an ancestor where node.props.isForm = true.
 * @param node - The node to initiate the submit
 */
function submit(node: FormKitNode): void {
  const name = node.name
  do {
    if (node.props.isForm === true) break
    if (!node.parent) error(106, name)
    node = node.parent
  } while (node)
  if (node.props.id) {
    submitForm(node.props.id)
  }
}

/**
 * Reset to the original value.
 * @param node - The node to reset
 * @param _context - The context
 * @param value - The value to reset to
 */
function resetValue(
  node: FormKitNode,
  _context: FormKitContext,
  value?: unknown
) {
  return reset(node, value)
}

/**
 * Sets errors on the node and optionally its children.
 * @param node - The node to set errors on
 * @param _context - Not used
 * @param localErrors - An array of errors to set on this node
 * @param childErrors - An object of name to errors to set on children.
 */
function setErrors(
  node: FormKitNode,
  _context: FormKitContext,
  localErrors: ErrorMessages,
  childErrors?: ErrorMessages
) {
  const sourceKey = `${node.name}-set`
  createMessages(node, localErrors, childErrors).forEach((errors) => {
    node.store.apply(errors, (message) => message.meta.source === sourceKey)
  })
  return node
}

/**
 * Clears errors on the node and optionally its children.
 * @param node - The node to set errors on
 * @param _context - Not used
 * @param localErrors - An array of errors to set on this node
 * @param childErrors - An object of name to errors to set on children.
 */
function clearErrors(
  node: FormKitNode,
  context: FormKitContext,
  clearChildErrors = true
) {
  setErrors(node, context, [])
  if (clearChildErrors) {
    const sourceKey = `${node.name}-set`
    node.walk((child) => {
      child.store.filter((message) => {
        return !(
          message.type === 'error' &&
          message.meta &&
          message.meta.source === sourceKey
        )
      })
    })
  }
  return node
}

/**
 * Middleware to assign default prop values as issued by core.
 * @param node - The node being registered
 * @param next - Calls the next middleware.
 * @returns
 */
function defaultProps(node: FormKitNode): FormKitNode {
  if (!has(node.props, 'id')) node.props.id = `input_${idCount++}`
  return node
}

/**
 * @param options -
 * @param config -
 */
function createProps(initial: unknown) {
  const props: Record<PropertyKey, any> = {
    initial: typeof initial === 'object' ? cloneAny(initial) : initial,
  }
  let node: FormKitNode
  let isEmitting = true
  return new Proxy(props, {
    get(...args) {
      const [_t, prop] = args
      if (has(props, prop)) return Reflect.get(...args)
      if (node && typeof prop === 'string' && node.config[prop] !== undefined)
        return node.config[prop]
      return undefined
    },
    set(target, property, originalValue, receiver) {
      if (property === '_n') {
        node = originalValue
        return true
      }
      if (property === '_emit') {
        isEmitting = originalValue
        return true
      }
      const { prop, value } = node.hook.prop.dispatch({
        prop: property,
        value: originalValue,
      })
      // Typescript compiler cannot handle a symbol index, even though js can:
      if (
        !eq(props[prop as string], value, false) ||
        typeof value === 'object'
      ) {
        const didSet = Reflect.set(target, prop, value, receiver)
        if (isEmitting) {
          node.emit('prop', { prop, value })
          if (typeof prop === 'string') node.emit(`prop:${prop}`, value)
        }
        return didSet
      }
      return true
    },
  })
}

/**
 * A cheap function that iterates over all plugins and stops once node.define
 * is called.
 * @param node - A formkit node
 * @param plugins - An array of plugins
 * @returns
 */
function findDefinition(node: FormKitNode, plugins: Set<FormKitPlugin>): void {
  // If the definition is already there, force call to define.
  if (node.props.definition) return node.define(node.props.definition)
  for (const plugin of plugins) {
    if (node.props.definition) return
    if (typeof plugin.library === 'function') {
      plugin.library(node)
    }
  }
}

/**
 * Create a new context object for our a FormKit node, given default information
 * @param options - An options object to override the defaults.
 * @returns FormKitContext
 */
function createContext(options: FormKitOptions): FormKitContext {
  const value = createValue(options)
  const config = createConfig(options.config || {}, options.parent)
  return {
    _d: 0,
    _e: createEmitter(),
    _resolve: false,
    _tmo: false,
    _value: value,
    children: dedupe(options.children || []),
    config,
    hook: createHooks(),
    isCreated: false,
    isSettled: true,
    ledger: createLedger(),
    name: createName(options),
    parent: options.parent || null,
    plugins: new Set<FormKitPlugin>(),
    props: createProps(value),
    settled: Promise.resolve(value),
    store: createStore(true),
    traps: createTraps(),
    type: options.type || 'input',
    value,
  }
}

/**
 * Initialize a node object's internal properties.
 * @param node - The node to initialize
 * @returns FormKitNode
 */
function nodeInit(node: FormKitNode, options: FormKitOptions): FormKitNode {
  // Set the internal node on the props, config, ledger and store
  node.ledger.init((node.store._n = node.props._n = node.config._n = node))
  // Apply given in options to the node.
  node.props._emit = false
  if (options.props) Object.assign(node.props, options.props)
  node.props._emit = true
  // Attempt to find a definition from the pre-existing plugins.
  findDefinition(
    node,
    new Set([
      ...(options.plugins || []),
      ...(node.parent ? node.parent.plugins : []),
    ])
  )
  // Then we apply each plugin's root code, we do this with an explicit loop
  // for that ity-bitty performance bump.
  if (options.plugins) {
    for (const plugin of options.plugins) {
      use(node, node._c, plugin, true, false)
    }
  }
  // Initialize the default props
  defaultProps(node)
  // Apply the parent to each child.
  node.each((child) => node.add(child))
  // If the node has a parent, ensure it's properly nested bi-directionally.
  if (node.parent) node.parent.add(node, options.index)
  // Inputs are leafs, and cannot have children
  if (node.type === 'input' && node.children.length) error(100, node)
  // Apply the input hook to the initial value.
  input(node, node._c, node._value, false)
  // Release the store buffer
  node.store.release()
  // Register the node globally if someone explicitly gave it an id
  if (options.props?.id) register(node)
  // Our node is finally ready, emit it to the world
  node.emit('created', node)
  node.isCreated = true
  return node
}

/**
 * Creates a new instance of a FormKit Node. Nodes are the atomic unit of
 * a FormKit graph.
 *
 * @param options - An object of options to define the node.
 * @returns FormKitNode
 * @public
 */
export function createNode(options?: FormKitOptions): FormKitNode {
  const ops = options || {}
  const context = createContext(ops) as FormKitContext
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
  }) as unknown as FormKitNode

  return nodeInit(node, ops)
}
