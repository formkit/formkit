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
  isObject,
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
 *
 * @public
 */
export type FormKitTypeDefinition = {
  /**
   * The FormKit core node type. Can only be input | list | group.
   */
  type: FormKitNodeType
  /**
   * Groups the input into a given family of inputs, generally for styling
   * purposes only. For example the "text" family would apply to all text-like
   * inputs.
   */
  family?: string
  /**
   * An optional name for the input’s type (e.g. "select" for a select input).
   * If used, this value takes precedence over the "type" prop string.
   */
  forceTypeProp?: string
  /**
   * Custom props that should be added to the input.
   */
  props?: string[]
  /**
   * The schema used to create the input. Either this or the component is
   * required.
   */
  schema?:
    | FormKitExtendableSchemaRoot
    | FormKitSchemaNode[]
    | FormKitSchemaCondition
  /**
   * A component to use to render the input. Either this or the schema is
   * required.
   */
  component?: unknown
  /**
   * A library of components to provide to the internal input schema.
   */
  library?: Record<string, unknown>
  /**
   * An array of additional feature functions to load when booting the input.
   */
  features?: Array<(node: FormKitNode) => void>
  /**
   * An optional string to use as a comparison key for memoizing the schema.
   */
  schemaMemoKey?: string
}

/**
 * A library of inputs, keyed by the name of the type.
 *
 * @public
 */
export interface FormKitLibrary {
  [index: string]: FormKitTypeDefinition
}

/**
 * The base interface definition for a FormKitPlugin. It's just a function that
 * accepts a node argument.
 *
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
 *
 * @public
 */
export type FormKitTextFragment = Partial<FormKitMessageProps> & {
  key: string
  value: string
  type: string
}

/**
 * The available hooks for middleware.
 *
 * @public
 */
export interface FormKitHooks {
  classes: FormKitDispatcher<{
    property: string
    classes: Record<string, boolean>
  }>
  commit: FormKitDispatcher<any>
  error: FormKitDispatcher<string>
  setErrors: FormKitDispatcher<{
    localErrors: ErrorMessages
    childErrors?: ErrorMessages
  }>
  init: FormKitDispatcher<FormKitNode>
  input: FormKitDispatcher<any>
  submit: FormKitDispatcher<Record<string, any>>
  message: FormKitDispatcher<FormKitMessage>
  prop: FormKitDispatcher<{
    prop: string | symbol
    value: any
  }>
  text: FormKitDispatcher<FormKitTextFragment>
  schema: FormKitDispatcher<FormKitSchemaNode[] | FormKitSchemaCondition>
}

/**
 * The definition of a FormKitTrap. These are somewhat like methods on each
 * FormKitNode. They are always symmetrical (get/set) — although it's acceptable
 * for either to throw an Exception.
 *
 * @public
 */
export interface FormKitTrap {
  get: TrapGetter
  set: TrapSetter
}

/**
 * Describes the path to a particular node from the top of the tree.
 *
 * @public
 */
export type FormKitAddress = Array<string | number>

/**
 * These are the types of nodes that can be created. These are different from
 * the type of inputs available and rather describe their purpose in the tree.
 *
 * @public
 */
export type FormKitNodeType = 'input' | 'list' | 'group'

/**
 * FormKit inputs of type 'group' must have keyed values by default.
 *
 * @public
 */
export interface FormKitGroupValue {
  [index: string]: unknown
  __init?: boolean
}

/**
 * FormKit inputs of type 'list' must have array values by default.
 *
 * @public
 */
export type FormKitListContextValue<T = any> = Array<T>

/**
 * Arbitrary data that has properties. Could be a POJO, could be an array.
 *
 * @public
 */
export interface KeyedValue {
  [index: number]: any
  [index: string]: any
}

/**
 * Define the most basic shape of a context object for type guards trying to
 * reason about a context's value.
 *
 * @public
 */
export interface FormKitContextShape {
  type: FormKitNodeType
  value: unknown
  _value: unknown
}

/**
 * The simplest definition for a context of type "list".
 *
 * @public
 */
export interface FormKitListContext {
  type: 'list'
  value: FormKitListContextValue
  _value: FormKitListContextValue
}

/**
 * Signature for any of the node's getter traps. Keep in mind that because these
 * are traps and not class methods, their response types are declared explicitly
 * in the FormKitNode interface.
 *
 * @public
 */
export type TrapGetter =
  | ((node: FormKitNode, context: FormKitContext, ...args: any[]) => unknown)
  | false

/**
 * The signature for a node's trap setter — these are more rare than getter
 * traps, but can be useful for blocking access to certain context properties
 * or modifying the behavior of an assignment (ex. see setParent).
 *
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
 *
 * @public
 */
export type FormKitTraps = Map<string | symbol, FormKitTrap>

/**
 * General "app" like configuration options, these are automatically inherited
 * by all children — they are not reactive.
 *
 * @public
 */
export interface FormKitConfig {
  delimiter: string
  classes?: Record<string, FormKitClasses | string | Record<string, boolean>>
  rootClasses:
    | ((sectionKey: string, node: FormKitNode) => Record<string, boolean>)
    | false
  rootConfig?: FormKitRootConfig
  [index: string]: any
}

/**
 * The user-land per-instance "props", which are generally akin to the props
 * passed into components on the front end.
 *
 * @public
 */
export type FormKitProps = {
  __root?: Document | ShadowRoot
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
  context?: FormKitFrameworkContext
  [index: string]: any
} & FormKitConfig

/**
 * The interface of a FormKit node's context object. A FormKit node is a
 * proxy of this object.
 *
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
   * A unique identifier for a node.
   */
  uid: symbol
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
  children: Array<FormKitNode | FormKitPlaceholderNode>
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
   * Only used on list nodes, this flag determines whether or not the list
   * should sync its values with the underlying node children.
   */
  sync: boolean
  /**
   * The actual value of the node.
   */
  value: unknown
}

/**
 * Context object to be created by and used by each respective UI framework. No
 * values are created or output by FormKitCore, but this interface
 * should be followed by each respective plugin.
 *
 * @public
 */
export interface FormKitFrameworkContext<T = any> {
  [index: string]: unknown
  /**
   * The current "live" value of the input. Not debounced.
   */
  _value: T
  /**
   * The root document or shadow root the input is inside. This can be set by
   * using a higher-order `<FormKitRoot>` component.
   */
  __root?: Document | ShadowRoot
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
   * An array of symbols that represent the a child’s nodes. These are not the
   * child’s nodes but are just symbols representing them. They are used to
   * iterate over the children for rendering purposes.
   */
  items: symbol[]
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
   * Whether or not to render messages in the standard location.
   */
  defaultMessagePlacement: boolean
  /**
   * A record of slots that have been passed into the top level component
   * responsible for creating the node.
   */
  slots: Record<string, CallableFunction>
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
  value: T
}

/**
 * The state inside a node’s framework context. Usually used to track things
 * like blurred and validity states.
 *
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
 * Options that can be used to instantiate a new node via `createNode()`.
 *
 * @public
 */
export type FormKitOptions = Partial<
  Omit<FormKitContext, 'children' | 'plugins' | 'config' | 'hook'> & {
    /**
     * Config settings for the node, these are automatically exposed as props
     * but are also checked in during hierarchical for prop checking.
     */
    config: Partial<FormKitConfig>
    /**
     * Props directly set on this node, these are not inherited.
     */
    props: Partial<FormKitProps>
    /**
     * The children of the node.
     */
    children: FormKitNode[] | Set<FormKitNode>
    /**
     * The explicit index of this node when used in a list. If specified, this
     * node will be created at this index atomically.
     */
    index?: number
    /**
     * Should only be specified on list nodes — when true this indicates if the
     * list node should automatically sync its child nodes with the value of
     * the list node. In other words, if the list node’s value is an array of
     * strings, and one string is popped off, the corresponding node should be
     * removed the list and destroyed.
     */
    sync: boolean
    /**
     * Any plugins that should be registered on this node explicitly. These will
     * automatically be inherited by any children.
     */
    plugins: FormKitPlugin[]
    /**
     * For internal use only.
     */
    alias: string
    /**
     * For internal use only.
     */
    schemaAlias: string
  }
>

/**
 * The callback type for node.each().
 *
 * @public
 */
export interface FormKitChildCallback {
  (child: FormKitNode): any
}

/**
 * A descriptor of a child value, generally passed up a node tree.
 *
 * @public
 */
export interface FormKitChildValue {
  name: string | number | symbol
  value: any
  from?: number | symbol
}

/**
 * An empty interface for adding FormKit node extensions.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FormKitNodeExtensions {}

/**
 * FormKit's Node object produced by createNode(). Every `<FormKit />` input has
 * 1 FormKitNode ("core node") associated with it. All inputs, forms, and groups
 * are instances of nodes. Read more about core nodes in the
 * {@link https://formkit.com/essentials/architecture#node | architecture
 * documentation.}
 *
 * @param add -
 * Add a child to a node. The node must be a group or list.
 *
 * #### Signature
 *
 * ```typescript
 * add: (node: FormKitNode, index?: number) => FormKitNode
 * ```
 *
 * #### Parameters
 *
 * - node — A {@link FormKitNode | FormKitNode}.
 * - index *optional* — A index to where it will added to.
 *
 * #### Returns
 *
 * The added {@link FormKitNode | FormKitNode}.
 *
 * @param address -
 * The address of the current node from the root of the tree.
 *
 * #### Signature
 *
 * ```typescript
 * address: FormKitAddress
 * ```
 *
 * #### Returns
 *
 * A {@link FormKitAddress | FormKitAddress}.
 *
 * @param addProps -
 * Adds props to the given node by removing them from node.props.attrs and
 * moving them to the top-level node.props object.
 *
 * #### Signature
 *
 * ```typescript
 * addProps: (props: string[]) => FormKitNode
 * ```
 *
 * #### Parameters
 *
 * - `props` — An array of strings to be added as keys for props.
 *
 * #### Returns
 *
 * The {@link FormKitNode | FormKitNode}.
 *
 * @param at -
 * Gets a node at another address. Addresses are dot-syntax paths (or arrays) of node names.
 * For example: `form.users.0.first_name`. There are a few "special" traversal tokens as well:
 *
 * - `$root` — Selects the root node.
 * - `$parent` — Selects the parent node.
 * - `$self` — Selects the current node.
 *
 * #### Signature
 *
 * ```typescript
 * at: (address: FormKitAddress | string) => FormKitNode | undefined
 * ```
 *
 * #### Parameters
 *
 * - `address` — An valid string or {@link FormKitAddress | FormKitAddress}.
 *
 * #### Returns
 *
 * The found {@link FormKitNode | FormKitNode} or `undefined`.
 *
 * @param children -
 * An array of child nodes (groups and lists).
 *
 * #### Signature
 *
 * ```typescript
 * children: Array<FormKitNode>
 * ```
 *
 * #### Returns
 *
 * An array of {@link FormKitNode | FormKitNode}.
 *
 * @param clearErrors -
 * Clears the errors of the node, and optionally all the children.
 *
 * #### Signature
 *
 * ```typescript
 * clearErrors: (clearChildren?: boolean, sourceKey?: string) => FormKitNode
 * ```
 *
 * #### Parameters
 *
 * - `clearChildren` *optional* — If it should clear the children.
 * - `sourceKey` *optional* — A source key to use for reset.
 *
 * #### Returns
 *
 * The {@link FormKitNode | FormKitNode}.
 *
 * @param config -
 * An object of {@link FormKitConfig | FormKitConfig} that is shared tree-wide
 * with various configuration options that should be applied to the entire tree.
 *
 * #### Signature
 *
 * ```typescript
 * config: FormKitConfig
 * ```
 *
 * #### Returns
 *
 * A {@link FormKitConfig | FormKitConfig}.
 *
 * @param define -
 * Defines the current input's library type definition including node type,
 * schema, and props.
 *
 * #### Signature
 *
 * ```typescript
 * define: (definition: FormKitTypeDefinition) => void
 * ```
 *
 * #### Parameters
 *
 * - `definition` — A {@link FormKitTypeDefinition | FormKitTypeDefinition}.
 *
 * @param destroy -
 * Removes the node from the global registry, its parent, and emits the
 * 'destroying' event.
 *
 * #### Signature
 *
 * ```typescript
 * destroy: () => void
 * ```
 *
 * @param each -
 * Perform given callback on each of the given node's children.
 *
 * #### Signature
 *
 * ```typescript
 * each: (callback: FormKitChildCallback) => void
 * ```
 *
 * #### Parameters
 *
 * - `callback` — A {@link FormKitChildCallback | FormKitChildCallback} to be called for each child.
 *
 * @param emit -
 * Emit an event from the node so it can be listened by {@link FormKitNode | on}.
 *
 * #### Signature
 *
 * ```typescript
 * emit: (event: string, payload?: any, bubble?: boolean, meta: Record<string, unknown>) => FormKitNode
 * ```
 *
 * #### Parameters
 *
 * - `event` — The event name to be emitted.
 * - `payload` *optional* — A value to be passed together with the event.
 * - `bubble` *optional* — If the event should bubble to the parent.
 *
 * #### Returns
 *
 * The {@link FormKitNode | FormKitNode}.
 *
 * @param extend -
 * Extend a {@link FormKitNode | FormKitNode} by adding arbitrary properties
 * that are accessible via `node.{property}()`.
 *
 * #### Signature
 *
 * ```typescript
 * extend: (property: string, trap: FormKitTrap) => FormKitNode
 * ```
 *
 * #### Parameters
 *
 * - `property` — The property to add the core node (`node.{property}`).
 * - `trap` — An object with a get and set property.
 *
 * #### Returns
 *
 * The {@link FormKitNode | FormKitNode}.
 *
 * @param find -
 * Within a given tree, find a node matching a given selector. Selectors can be simple strings or a function.
 *
 * #### Signature
 *
 * ```typescript
 * find: (
 *  selector: string,
 *  searcher?: keyof FormKitNode | FormKitSearchFunction
 * ) => FormKitNode | undefined
 * ```
 *
 * #### Parameters
 *
 * - `selector` — A selector string.
 * - `searcher` *optional* — A keyof {@link FormKitNode | FormKitNode} or {@link FormKitSearchFunction | FormKitSearchFunction}.
 *
 * #### Returns
 *
 * The found {@link FormKitNode | FormKitNode} or `undefined`.
 *
 * @param hook -
 * Set of hooks.
 *
 * #### Signature
 *
 * ```typescript
 * hook: FormKitHooks
 * ```
 *
 * #### Returns
 *
 * The {@link FormKitHooks | FormKitHooks}.
 *
 * @param index -
 * The index of a node compared to its siblings. This is only applicable in cases where a node is a child of a list.
 *
 * #### Signature
 *
 * ```typescript
 * index: number
 * ```
 *
 * #### Returns
 *
 * A `number`.
 *
 * @param input -
 * The function used to set the value of a node. All changes to a node's value
 * should use this function as it ensures the tree's state is always fully tracked.
 *
 * #### Signature
 *
 * ```typescript
 * input: (value: unknown, async?: boolean) => Promise<unknown>
 * ```
 *
 * #### Parameters
 *
 * - `value` — Any value to used for the node.
 * - `async` *optional* — If the input should happen asynchronously.
 *
 * #### Returns
 *
 * A `Promise<unknown>`.
 *
 * @param isCreated -
 * Begins as false, set to true when the node is finished being created.
 *
 * #### Signature
 *
 * ```typescript
 * isCreated: boolean
 * ```
 *
 * #### Returns
 *
 * A `boolean`.
 *
 * @param isSettled -
 * Boolean reflecting the settlement state of the node and its subtree.
 *
 * #### Signature
 *
 * ```typescript
 * isSettled: boolean
 * ```
 *
 * #### Returns
 *
 * A `boolean`.
 *
 * @param ledger -
 * A counting ledger for arbitrary message counters.
 *
 * #### Signature
 *
 * ```typescript
 * ledger: FormKitLedger
 * ```
 *
 * #### Returns
 *
 * A {@link FormKitLedger | FormKitLedger}.
 *
 * @param name -
 * The name of the input in the node tree. When a node is a child of a list,
 * this automatically becomes its index.
 *
 * #### Signature
 *
 * ```typescript
 * name: string
 * ```
 *
 * #### Returns
 *
 * A `string`.
 *
 * @param off -
 * Removes an event listener by its token.
 * Receipts can be shared among many event listeners by explicitly declaring the "receipt" property of the listener function.
 *
 * #### Signature
 *
 * ```typescript
 * off: (receipt: string) => FormKitNode
 * ```
 *
 * #### Parameters
 *
 * - `receipt` — A receipt generated by the `on` function.
 *
 * #### Returns
 *
 * A receipt `string`.
 *
 * @param on -
 * Adds an event listener for a given event, and returns a "receipt" which is a random string token.
 * This token should be used to remove the listener in the future.
 * Alternatively you can assign a "receipt" property to the listener function and that receipt will be used instead.
 * This allows multiple listeners to all be de-registered with a single off() call if they share the same receipt.
 *
 * #### Signature
 *
 * ```typescript
 * on: (eventName: string, listener: FormKitEventListener) => string
 * ```
 *
 * #### Parameters
 *
 * - `eventName` — The event name to listen to.
 * - `listener` — A {@link FormKitEventListener | FormKitEventListener} to run when the event happens.
 *
 * #### Returns
 *
 * A receipt `string`.
 *
 * @param parent -
 * The parent of a node.
 *
 * #### Signature
 *
 * ```typescript
 * parent: FormKitNode | null
 * ```
 *
 * #### Returns
 *
 * If found a {@link FormKitNode | FormKitNode} or `null`.
 *
 * @param props -
 * An proxied object of props. These are typically provided by the adapter
 * of choice.
 *
 * #### Signature
 *
 * ```typescript
 * props: Partial<FormKitProps>
 * ```
 *
 * #### Returns
 *
 * An optional list of {@link FormKitProps | FormKitProps}.
 *
 * @param remove -
 * Removes a child from the node.
 *
 * #### Signature
 *
 * ```typescript
 * remove: (node: FormKitNode) => FormKitNode
 * ```
 *
 * #### Parameters
 *
 * - `node` — A {@link FormKitNode | FormKitNode} to be removed.
 *
 * #### Returns
 *
 * The {@link FormKitNode | FormKitNode}.
 *
 * @param reset -
 * Resets the node’s value back to its original value.
 *
 * #### Signature
 *
 * ```typescript
 * reset: () => FormKitNode
 * ```
 *
 * #### Returns
 *
 * The {@link FormKitNode | FormKitNode}.
 *
 * @param root -
 * Retrieves the root node of a tree. This is accomplished via tree-traversal
 * on-request, and as such should not be used in frequently called functions.
 *
 * #### Signature
 *
 * ```typescript
 * root: FormKitNode
 * ```
 *
 * #### Returns
 *
 * The {@link FormKitNode | FormKitNode}.
 *
 * @param setErrors -
 * Sets errors on the input, and optionally to child inputs.
 *
 * #### Signature
 *
 * ```typescript
 * setErrors: (localErrors: ErrorMessages, childErrors?: ErrorMessages) => void
 * ```
 *
 * #### Parameters
 *
 * - `localErrors` — A {@link ErrorMessages | ErrorMessages} to be used.
 * - `childErrors` *optional* — A {@link ErrorMessages | ErrorMessages} to be used for children.
 *
 * @param settled -
 * A promise that resolves when a node and its entire subtree is settled.
 * In other words — all the inputs are done committing their values.
 *
 * #### Signature
 *
 * ```typescript
 * settled: Promise<unknown>
 * ```
 *
 * #### Returns
 *
 * A `Promise<unknown>`.
 *
 * @param store -
 * The internal node store.
 *
 * #### Signature
 *
 * ```typescript
 * store: FormKitStore
 * ```
 *
 * #### Returns
 *
 * A {@link FormKitStore | FormKitStore}.
 *
 * @param submit -
 * Triggers a submit event on the nearest form.
 *
 * #### Signature
 *
 * ```typescript
 * submit: () => void
 * ```
 *
 * @param t -
 * A text or translation function that exposes a given string to the "text"
 * hook. All text shown to users should be passed through this function
 * before being displayed — especially for core and plugin authors.
 *
 * #### Signature
 *
 * ```typescript
 * t: (key: string | FormKitTextFragment) => string
 * ```
 *
 * #### Parameters
 *
 * - `key` — A key or a {@link FormKitTextFragment | FormKitTextFragment} to find the translation for.
 *
 * #### Returns
 *
 * The translated `string`.
 *
 * @param type -
 * The type of node, should only be 'input', 'list', or 'group'.
 *
 * #### Signature
 *
 * ```typescript
 * type: FormKitNodeType
 * ```
 *
 * #### Returns
 *
 * A {@link FormKitNodeType | FormKitNodeType}.
 *
 * @param use -
 * Registers a new plugin on the node and its subtree.
 *
 * #### Signature
 *
 * ```typescript
 * use: (
 *  plugin: FormKitPlugin | FormKitPlugin[] | Set<FormKitPlugin>,
 *  run?: boolean,
 *  library?: boolean
 * ) => FormKitNode
 * ```
 *
 * #### Parameters
 *
 * - `plugin` — A {@link FormKitPlugin | FormKitPlugin} or an Array or Set of {@link FormKitPlugin | FormKitPlugin}.
 * - `run` *optional* — Should the plugin be executed on creation.
 * - `library` *optional* — Should the plugin's library function be executed on creation.
 *
 * #### Returns
 *
 * The {@link FormKitNode | FormKitNode}.
 *
 * @param value -
 * The value of the input. This should never be directly modified. Any
 * desired mutations should be made through {@link FormKitNode | input}.
 *
 * #### Signature
 *
 * ```typescript
 * readonly value: unknown
 * ```
 *
 * @param walk -
 * Performs a function on every node in its subtree (but not the node itself).
 * This is an expensive operation so it should be done very rarely and only lifecycle events that are relatively rare like boot up and shut down.
 *
 * #### Signature
 *
 * ```typescript
 * walk: (callback: FormKitChildCallback, stopOnFalse?: boolean, recurseOnFalse?: boolean) => void
 * ```
 *
 * #### Parameters
 *
 * - `callback` — A {@link FormKitChildCallback | FormKitChildCallback} to be executed for each child.
 * - `stopOnFalse` *optional* — If it should stop when the return is false.
 *
 * @public
 */
export type FormKitNode<V = unknown> = {
  /**
   * Boolean true indicating this object is a valid FormKitNode
   */
  readonly __FKNode__: true
  /**
   * The value of the input. This should never be directly modified. Any
   * desired mutations should be made through node.input()
   */
  readonly value: V
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
   * of node names. For example: form.users.0.first_name. There are a few
   * "special" traversal tokens as well:
   * - $root - Selects the root node
   * - $parent - Selects the parent node
   * - $self — Selects the current node
   */
  at: (address: FormKitAddress | string) => FormKitNode | undefined
  /**
   * The address of the current node from the root of the tree.
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
  clearErrors: (clearChildren?: boolean, sourceKey?: string) => FormKitNode
  /**
   * An object that is shared tree-wide with various configuration options that
   * should be applied to the entire tree.
   */
  config: FormKitConfig
  /**
   * Defines the current input's library type definition — including node type,
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
   * Removes the node from the global registry, its parent, and emits the
   * 'destroying' event.
   */
  destroy: () => void
  /**
   * Perform given callback on each of the given node's children.
   */
  each: (callback: FormKitChildCallback) => void
  /**
   * Emit an event from the node.
   */
  emit: (
    event: string,
    payload?: any,
    bubble?: boolean,
    meta?: Record<string, unknown>
  ) => FormKitNode
  /**
   * Extend the core node by giving it a key and a trap.
   */
  extend: (key: string, trap: FormKitTrap) => FormKitNode
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
   * The name of the input in the node tree. When a node is a child of a list,
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
  remove: (node: FormKitNode | FormKitPlaceholderNode) => FormKitNode
  /**
   * Retrieves the root node of a tree. This is accomplished via tree-traversal
   * on-request, and as such should not be used in frequently called functions.
   */
  root: FormKitNode
  /**
   * Resets the configuration of a node.
   */
  resetConfig: () => void
  /**
   * Reset a node’s value back to its original value.
   */
  reset: (value?: unknown) => FormKitNode
  /**
   * Sets errors on the input, and optionally to child inputs.
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
   * hook. All text shown to users should be passed through this function
   * before being displayed — especially for core and plugin authors.
   */
  t: (key: string | FormKitTextFragment) => string
  /**
   * Boolean reflecting the settlement state of the node and its subtree.
   */
  isSettled: boolean
  /**
   * A unique identifier for the node.
   */
  uid: symbol
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
   * Performs a function on every node in the subtree (not itself). This is an
   * expensive operation so it should be done very rarely and only lifecycle
   * events that are relatively rare like boot up and shut down.
   */
  walk: (
    callback: FormKitChildCallback,
    stopOnFalse?: boolean,
    skipSubtreeOnFalse?: boolean
  ) => void
} & Omit<FormKitContext, 'value' | 'name' | 'config'> &
  FormKitNodeExtensions

/**
 * A faux node that is used as a placeholder in the children node array during
 * various node manipulations.
 * @public
 */
export interface FormKitPlaceholderNode<V = unknown> {
  /**
   * Flag indicating this is a placeholder.
   */
  __FKP: true
  /**
   * A unique symbol identifying this placeholder.
   */
  uid: symbol
  /**
   * The type of placeholder node, if relevant.
   */
  type: FormKitNodeType
  /**
   * A value at the placeholder location.
   */
  value: V
  /**
   * The uncommitted value, in a placeholder will always be the same
   * as the value.
   */
  _value: V
  /**
   * Artificially use a plugin (performs no-op)
   */
  use: (...args: any[]) => void
  /**
   * A name to use.
   */
  name: string
  /**
   * Sets the value of the placeholder.
   */
  input: (value: unknown, async?: boolean) => Promise<unknown>
  /**
   * A placeholder is always settled.
   */
  isSettled: boolean
}

/**
 * Breadth and depth-first searches can use a callback of this notation.
 *
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
 *
 * @internal
 */
export const useIndex = Symbol('index')

/**
 * When propagating values up a tree, this value indicates the child should be
 * removed.
 *
 * @internal
 */
export const valueRemoved = Symbol('removed')

/**
 * When propagating values up a tree, this value indicates the child should be
 * moved.
 *
 * @internal
 */
export const valueMoved = Symbol('moved')

/**
 * When creating a new node and having its value injected directly at a specific
 * location.
 *
 * @internal
 */
export const valueInserted = Symbol('inserted')

/**
 * A simple type guard to determine if the context being evaluated is a list
 * type.
 *
 * @param arg - A {@link FormKitContextShape | FormKitContextShape}.
 *
 * @returns Returns a `boolean`.
 *
 * @public
 */
export function isList(arg: FormKitContextShape): arg is FormKitListContext {
  return arg.type === 'list' && Array.isArray(arg._value)
}

/**
 * Determine if a given object is a node.
 *
 * @example
 *
 * ```javascript
 * import { isNode, createNode } from '@formkit/core'
 *
 * const input = createNode({
 *   type: 'input', // defaults to 'input' if not specified
 *   value: 'hello node world',
 * })
 *
 * const obj = {};
 *
 * isNode(obj)
 * // false
 *
 * isNode(input)
 * // true
 * ```
 *
 * @param node - Any value.
 *
 * @returns Returns a `boolean`.
 *
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
  extend: trap(extend),
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
 *
 * @param getter - The getter function
 * @param setter - The setter function
 * @param curryGetter - Indicates if the getter should be curried or not
 *
 * @returns A {@link FormKitTrap | FormKitTrap}
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
 * Resets the global number of node registrations, useful for deterministic
 * node naming.
 *
 * @public
 */
export function resetCount(): void {
  nameCount = 0
  idCount = 0
}

/**
 * Create a name-based dictionary of all children in an array.
 *
 * @param children - An array of {@link FormKitNode | FormKitNode}.
 *
 * @returns A dictionary of named {@link FormKitNode | FormKitNode}.
 *
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
 * @param options - A {@link FormKitOptions | FormKitOptions}
 *
 * @returns `string | symbol`
 *
 * @internal
 */
function createName(options: FormKitOptions): string | symbol {
  if (options.parent?.type === 'list') return useIndex
  return options.name || `${options.props?.type || 'input'}_${++nameCount}`
}

/**
 * Creates the initial value for a node based on the options passed in and the
 * type of the input.
 *
 * @param options - A {@link FormKitOptions | FormKitOptions}.
 *
 * @returns `unknown`
 *
 * @public
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
  return options.value
}
/**
 * Sets the internal value of the node.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 * @param value - A input value to the node
 * @param async - If its an async call
 *
 * @returns `Promise<unknown>`
 *
 * @internal
 */
function input(
  node: FormKitNode,
  context: FormKitContext,
  value: unknown,
  async = true
): Promise<unknown> {
  context._value = validateInput(node, node.hook.input.dispatch(value))
  node.emit('input', context._value)
  if (
    node.isCreated &&
    node.type === 'input' &&
    eq(context._value, context.value)
  ) {
    node.emit('commitRaw', context.value)
    // Perform an early return if the value hasn't changed during this input.
    return context.settled
  }
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
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param value - The value that is being validated
 *
 * @returns `T`
 *
 * @internal
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
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 * @param calm - If it calms the node
 * @param hydrate - If it hydrates the node
 *
 * @internal
 */
function commit(
  node: FormKitNode,
  context: FormKitContext,
  calm = true,
  hydrate = true
) {
  context._value = context.value = node.hook.commit.dispatch(context._value)
  if (node.type !== 'input' && hydrate) node.hydrate()
  node.emit('commitRaw', context.value)
  node.emit('commit', context.value)
  if (calm) node.calm()
}

/**
 * Perform a modification to a single element of a parent aggregate value. This
 * is only performed on the pre-committed value (_value), although typically
 * the value and _value are both linked in memory.
 *
 * @param context - A {@link FormKitContext | FormKitContext}
 *
 * @internal
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
 * Hydrate node and its children
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 *
 * @returns A {@link FormKitNode | FormKitNode}
 *
 * @internal
 */
function hydrate(node: FormKitNode, context: FormKitContext): FormKitNode {
  const _value = context._value as KeyedValue
  // For "synced" lists the underlying nodes need to be synced to their values
  // before hydration.
  if (node.type === 'list' && node.sync) syncListNodes(node, context)
  context.children.forEach((child) => {
    if (typeof _value !== 'object') return
    if (child.name in _value) {
      // In this case, the parent has a value to give to the child, so we
      // perform a down-tree synchronous input which will cascade values down
      // and then ultimately back up.
      const childValue =
        child.type !== 'input' ||
        (_value[child.name] && typeof _value[child.name] === 'object')
          ? init(_value[child.name])
          : _value[child.name]
      // If the two are already equal or the child is currently disturbed then
      // don’t send the value down since it will squash the child’s value.
      if (
        !child.isSettled ||
        (!isObject(childValue) && eq(childValue, child._value))
      )
        return
      // If there is a change to the child, push the new value down.
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
 * Hydrate a list node and its children. There are some assumptions about the
 * child nodes that are made here:
 * 1. The child nodes are either:
 *    - Are scalars and their values can be exchanged.
 *    - Are groups and should maintain node identity.
 * 2. The value of the list will be a 1-1 representation of the children.
 * 3. If new values are *added* to the list, those nodes must be created by some
 *   other means — adding a value does not add a node automatically.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 */
function syncListNodes(node: FormKitNode, context: FormKitContext) {
  const _value = node._value
  if (!Array.isArray(_value)) return

  const newChildren: Array<FormKitNode | FormKitPlaceholderNode | null> = []
  const unused = new Set(context.children)
  const placeholderValues = new Map<unknown, number[]>()

  // 1. Iterate over the values and if the values at the same index are equal
  //    then we can reuse the node. Otherwise we add a `null` placeholder.
  _value.forEach((value, i) => {
    if (context.children[i] && context.children[i]._value === value) {
      newChildren.push(context.children[i])
      unused.delete(context.children[i])
    } else {
      newChildren.push(null)

      const indexes = placeholderValues.get(value) || []
      indexes.push(i)
      placeholderValues.set(value, indexes)
    }
  })

  // 2. If there are unused nodes, and there are null nodes in the new children
  //    then we attempt to match those irregardless of their index.
  if (unused.size && placeholderValues.size) {
    unused.forEach((child) => {
      if (placeholderValues.has(child._value)) {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        const indexes = placeholderValues.get(child._value)!
        const index = indexes.shift()!
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
        newChildren[index] = child
        unused.delete(child)
        if (!indexes.length) placeholderValues.delete(child._value)
      }
    })
  }

  // 3. If there are still unused nodes, and unused placeholders, we assign the
  //    unused nodes to the unused placeholders in order.
  const emptyIndexes: number[] = []
  placeholderValues.forEach((indexes) => {
    emptyIndexes.push(...indexes)
  })

  while (unused.size && emptyIndexes.length) {
    const child = unused.values().next().value
    const index = emptyIndexes.shift()
    if (index === undefined) break
    newChildren[index] = child
    unused.delete(child)
  }

  // 4. If there are placeholders in the children, we create true placeholders.
  emptyIndexes.forEach((index, value) => {
    newChildren[index] = createPlaceholder({ value })
  })

  // 5. If there are unused nodes, we remove them. To ensure we don’t remove any
  //    values we explicitly remove each child’s parent and manually unmerge the
  //    child from the parent’s ledger before destroying the subtree.
  if (unused.size) {
    unused.forEach((child) => {
      if (!('__FKP' in child)) {
        const parent = child._c.parent
        if (!parent || isPlaceholder(parent)) return
        parent.ledger.unmerge(child)
        child._c.parent = null
        child.destroy()
      }
    })
  }

  // 6. Finally, we assign the new children to the context.
  context.children = newChildren as Array<FormKitNode | FormKitPlaceholderNode>
}

/**
 * Disturbs the state of a node from settled to unsettled — creating appropriate
 * promises and resolutions.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 *
 * @returns A {@link FormKitNode | FormKitNode}
 *
 * @internal
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
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 * @param value - A {@link FormKitChildValue | FormKitChildValue}
 *
 * @internal
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
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 *
 * @internal
 */
function destroy(node: FormKitNode, context: FormKitContext) {
  node.emit('destroying', node)
  // flush all messages out
  node.store.filter(() => false)
  if (node.parent) {
    node.parent.emit('childRemoved', node)
    node.parent.remove(node)
  }
  deregister(node)
  node.emit('destroyed', node)
  context._e.flush()
  context._value = context.value = undefined
  for (const property in context.context) {
    delete context.context[property]
  }
  context.plugins.clear()
  context.context = null! // eslint-disable-line @typescript-eslint/no-non-null-assertion
}

/**
 * Defines the current input type concretely.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 * @param definition - A {@link FormKitTypeDefinition | FormKitTypeDefinition}
 *
 * @internal
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
  /**
   * If the user has a typename defined, use it here.
   */
  if (definition.forceTypeProp) {
    if (node.props.type) node.props.originalType = node.props.type
    context.props.type = definition.forceTypeProp
  }
  /**
   * If the input is part of a family of inputs, add that prop.
   */
  if (definition.family) {
    context.props.family = definition.family
  }
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
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 * @param props - An array of prop strings (in camelCase!)
 *
 * @returns A {@link FormKitNode | FormKitNode}
 *
 * @internal
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
 * Adds a child to the node.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A parent {@link FormKitContext | FormKitContext}
 * @param child - A {@link FormKitNode | FormKitNode}
 * @param listIndex - A index number to be added at
 *
 * @internal
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
      const existingNode = parentContext.children[listIndex]
      if (existingNode && '__FKP' in existingNode) {
        // The node index is populated by a placeholderNode so we need to
        // remove that replace it with the real node (the current child).
        child._c.uid = existingNode.uid
        parentContext.children.splice(listIndex, 1, child)
      } else {
        parentContext.children.splice(listIndex, 0, child)
      }

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
 * @param child - A child {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 * @param _property - A property to be setted
 * @param parent - A parent {@link FormKitNode | FormKitNode}
 *
 * @returns `boolean`
 *
 * @internal
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
 * Removes a child from the node.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 * @param child - A child {@link FormKitNode | FormKitNode}
 *
 * @internal
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
 *
 * @param _node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 * @param callback - A {@link FormKitChildCallback | FormKitChildCallback}
 *
 * @internal
 */
function eachChild(
  _node: FormKitNode,
  context: FormKitContext,
  callback: FormKitChildCallback
) {
  context.children.forEach((child) => !('__FKP' in child) && callback(child))
}

/**
 * Walk all nodes below this one and execute a callback.
 *
 * @param _node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 * @param callback - A {@link FormKitChildCallback | FormKitChildCallback}
 * @param stopIfFalse - Boolean to stop running on children
 * @param skipSubtreeOnFalse - Boolean that when true prevents recursion into a deeper node when the callback returns false
 *
 * @internal
 */
function walkTree(
  _node: FormKitNode,
  context: FormKitContext,
  callback: FormKitChildCallback,
  stopIfFalse = false,
  skipSubtreeOnFalse = false
) {
  context.children.some((child) => {
    if ('__FKP' in child) return false
    const val = callback(child)
    // return true to stop the walk early
    if (stopIfFalse && val === false) return true
    if (skipSubtreeOnFalse && val === false) return false
    return child.walk(callback, stopIfFalse, skipSubtreeOnFalse)
  })
}

/**
 * Set the configuration options of the node and it's subtree.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 *
 * @internal
 */
function resetConfig(node: FormKitNode, context: FormKitContext) {
  const parent = node.parent || undefined
  context.config = createConfig(node.config._t, parent)
  node.walk((n) => n.resetConfig())
}

/**
 * Adds a plugin to the node, its children, and executes it.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 * @param plugin -
 * {@link FormKitPlugin | FormKitPlugin}
 * {@link FormKitPlugin | FormKitPlugin[]}
 * {@link FormKitPlugin | Set<FormKitPlugin>}
 * @param run - If it will run on creation
 * @param library - If it will run on library creation
 *
 * @returns A {@link FormKitNode | FormKitNode}
 *
 * @internal
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
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param _context - A {@link FormKitContext | FormKitContext}
 * @param _property - A property to add
 * @param setIndex - The index to move the node
 *
 * @internal
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
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 *
 * @internal
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
 *
 * @param _node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 *
 * @internal
 */
function getContext(_node: FormKitNode, context: FormKitContext) {
  return context
}

/**
 * Get the name of the current node, allowing for slight mutations.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 *
 * @internal
 */
function getName(node: FormKitNode, context: FormKitContext) {
  if (node.parent?.type === 'list') return node.index
  return context.name !== useIndex ? context.name : node.index
}

/**
 * Returns the address of the current node.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 *
 * @internal
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
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param _context - A {@link FormKitContext | FormKitContext}
 * @param locator - A string or {@link FormKitAddress | FormKitAddress} to find in the tree.
 *
 * @returns A {@link FormKitNode | FormKitNode}
 *
 * @internal
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
          (pointer.children.find(
            (c) => !('__FKP' in c) && String(c.name) === String(name)
          ) as FormKitNode | undefined) || select(pointer, name)
    }
  }
  return pointer || undefined
}

/**
 * Perform selections on a subtree using the address "selector" methods.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param selector - A `string | number` to find in the node
 *
 * @returns A {@link FormKitNode | FormKitNode} or `undefined`
 *
 * @internal
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
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param _context - A {@link FormKitContext | FormKitContext}
 * @param searchTerm - The term we are searching for
 * @param searcher - Either a key of {@link FormKitNode | FormKitNode}, or a {@link FormKitSearchFunction | FormKitSearchFunction}
 *
 * @returns A {@link FormKitNode | FormKitNode} or `undefined`
 *
 * @internal
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
 * Perform a breadth-first search on a node subtree and locate the first
 * instance of a match.
 *
 * @param tree - A {@link FormKitNode | FormKitNode} to start from.
 * @param searchValue - A value to be searched.
 * @param searchGoal - A goal value.
 *
 * @returns A {@link FormKitNode | FormKitNode } or `undefined`.
 *
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
  const stack: Array<FormKitNode | FormKitPlaceholderNode> = [tree]
  while (stack.length) {
    const node = stack.shift()! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    if ('__FKP' in node) continue
    if (search(node, searchValue)) return node
    stack.push(...node.children)
  }
  return undefined
}

/**
 * Get the root node of the tree.
 *
 * @param n - A {@link FormKitNode | FormKitNode}
 *
 * @internal
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
 *
 * @param target - An object of optional properties of {@link FormKitConfig | FormKitConfig}
 * @param parent - A parent {@link FormKitNode | FormKitNode}
 *
 * @returns {@link FormKitNode | FormKitNode}
 *
 * @internal
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
          node.walk((n) => configChange(n, prop, value), false, true)
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

 * @param node - A {@link FormKitNode | FormKitNode}
 * @param _context - A {@link FormKitContext | FormKitContext}
 * @param key - A {@link FormKitTextFragment | FormKitTextFragment}, or generic string of text
 * @param type - A string to represent the text type
 *
 * @returns `string`
 *
 * @internal
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
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 *
 * @internal
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
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param _context - A {@link FormKitContext | FormKitContext}
 * @param value - The value to reset to
 *
 * @internal
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
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param _context - A {@link FormKitContext | FormKitContext}
 * @param localErrors - An array of {@link ErrorMessages | ErrorMessages} to set on this node
 * @param childErrors - An object of name of {@link ErrorMessages | ErrorMessages} to set on children.
 *
 * @internal
 */
function setErrors(
  node: FormKitNode,
  _context: FormKitContext,
  localErrors: ErrorMessages,
  childErrors?: ErrorMessages
) {
  const sourceKey = `${node.name}-set`
  const errors = node.hook.setErrors.dispatch({ localErrors, childErrors })
  createMessages(node, errors.localErrors, errors.childErrors).forEach(
    (errors) => {
      node.store.apply(errors, (message) => message.meta.source === sourceKey)
    }
  )
  return node
}

/**
 * Clears errors on the node and optionally its children.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param _context - A {@link FormKitContext | FormKitContext}
 * @param clearChildErrors - A boolean to clear children error or not.
 * @param sourceKey - The source key string to reset.
 *
 * @internal
 */
function clearErrors(
  node: FormKitNode,
  context: FormKitContext,
  clearChildErrors = true,
  sourceKey?: string
) {
  setErrors(node, context, [])
  if (clearChildErrors) {
    sourceKey = sourceKey || `${node.name}-set`
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
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 *
 * @returns A {@link FormKitNode | FormKitNode}
 *
 * @internal
 */
function defaultProps(node: FormKitNode): FormKitNode {
  if (!has(node.props, 'id')) node.props.id = `input_${idCount++}`
  return node
}

/**
 * Create props based on initial values
 *
 * @param initial - An initial value to be transformed
 *
 * @internal
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
 * Applies a new trap to the FormKitNode allowing plugins to extend the
 * base functionality of a FormKitNode.
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param context - A {@link FormKitContext | FormKitContext}
 * @param property - A string of the property name
 * @param trap - A {@link FormKitTrap | FormKitTrap}
 * @returns
 */
function extend(
  node: FormKitNode,
  context: FormKitContext,
  property: string,
  trap: FormKitTrap
) {
  context.traps.set(property, trap)
  return node
}

/**
 * A cheap function that iterates over all plugins and stops once node.define
 * is called.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param plugins - An array of {@link FormKitPlugin | FormKitPlugin}
 *
 * @internal
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
 *
 * @param options - An options object of {@link FormKitOptions | FormKitOptions} to override the defaults.
 *
 * @returns A {@link FormKitContext | FormKitContext}
 *
 * @internal
 */
function createContext(options: FormKitOptions): FormKitContext {
  const value = createValue(options)
  const config = createConfig(options.config || {}, options.parent)
  return {
    _d: 0,
    _e: createEmitter(),
    uid: Symbol(),
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
    sync: options.sync || false,
    traps: createTraps(),
    type: options.type || 'input',
    value,
  }
}

/**
 * Initialize a node object's internal properties.
 *
 * @param node - A {@link FormKitNode | FormKitNode}
 * @param options - An options object of {@link FormKitOptions | FormKitOptions} to override the defaults.
 *
 * @returns A {@link FormKitNode | FormKitNode}
 *
 * @internal
 */
function nodeInit<V>(
  node: FormKitNode,
  options: FormKitOptions
): FormKitNode<V> {
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
  return node as FormKitNode<V>
}

/**
 * Creates a placeholder node that can be used to hold a place in a the children
 * array until the actual node is created.
 * @param options - FormKitOptions
 * @internal
 */
export function createPlaceholder(
  options?: FormKitOptions & { name?: string }
): FormKitPlaceholderNode {
  return {
    __FKP: true,
    uid: Symbol(),
    name: options?.name ?? `p_${nameCount++}`,
    value: options?.value ?? null,
    _value: options?.value ?? null,
    type: options?.type ?? 'input',
    use: () => {
      // noop
    },
    input(value: unknown) {
      this._value = value
      this.value = value
      return Promise.resolve()
    },
    isSettled: true,
  }
}

/**
 * Determines if a node is a placeholder node.
 * @param node - A {@link FormKitNode | FormKitNode}
 * @returns
 * @public
 */
export function isPlaceholder(
  node: FormKitNode | FormKitPlaceholderNode
): node is FormKitPlaceholderNode {
  return '__FKP' in node
}

/**
 * Creates a new instance of a FormKit Node. Nodes are the atomic unit of a FormKit graph.
 *
 * @example
 *
 * ```javascript
 * import { createNode } from '@formkit/core'
 *
 * const input = createNode({
 *   type: 'input', // defaults to 'input' if not specified
 *   value: 'hello node world',
 * })
 *
 * console.log(input.value)
 * // 'hello node world'
 * ```
 *
 * @param options - An options object of {@link FormKitOptions | FormKitOptions} to override the defaults.
 *
 * @returns A {@link @formkit/core#FormKitNode | FormKitNode}.
 *
 * @public
 */
export function createNode<V = unknown>(
  options?: FormKitOptions
): FormKitNode<V> {
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
