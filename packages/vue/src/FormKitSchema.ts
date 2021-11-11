import {
  ConcreteComponent,
  PropType,
  RendererElement,
  RendererNode,
  VNode,
  createTextVNode,
  defineComponent,
  h,
  ref,
  reactive,
  resolveComponent,
  watchEffect,
  watch,
  Ref,
} from 'vue'
import { has, isPojo } from '@formkit/utils'
import {
  FormKitSchemaAttributes,
  FormKitSchemaNode,
  isDOM,
  isConditional,
  isComponent,
  compile,
  FormKitSchemaCondition,
  FormKitSchemaAttributesCondition,
  FormKitAttributeValue,
  FormKitCompilerOutput,
  get,
  warn,
  watchRegistry,
  isNode,
} from '@formkit/core'

/**
 * A library of components available to the schema (in addition to globally
 * registered ones)
 */
interface FormKitComponentLibrary {
  [index: string]: ConcreteComponent
}

/**
 * Defines the structure a parsed node.
 */
type RenderContent = [
  condition: false | (() => boolean | number | string),
  element: string | ConcreteComponent | null,
  attrs: () => FormKitSchemaAttributes,
  children: RenderChildren | null,
  alternate: RenderChildren | null,
  iterator:
    | null
    | [
        getValues: () =>
          | number
          | string
          | boolean
          | any[]
          | Record<string, any>,
        valueName: string,
        keyName: string | null
      ]
]
/**
 * The actual signature of a VNode in Vue.
 */
type VirtualNode = VNode<RendererNode, RendererElement, { [key: string]: any }>
/**
 * The types of values that can be rendered by Vue.
 */
type Renderable = null | string | number | boolean | VirtualNode
/**
 * Describes renderable children.
 */
type RenderChildren = () =>
  | Renderable
  | Renderable[]
  | (Renderable | Renderable[])[]
  | Record<string, RenderChildren>

/**
 * The format children elements can be in.
 */
interface RenderNodes {
  (): Renderable | Renderable[]
}

type SchemaProvider = (
  providerCallback: SchemaProviderCallback,
  instanceKey: symbol
) => RenderChildren

type SchemaProviderCallback = (
  requirements: string[],
  hints?: Record<string, boolean>
) => Record<string, () => any>

type ProviderRegistry = ((
  providerCallback: SchemaProviderCallback,
  key: symbol
) => void)[]

/**
 * A registry of memoized schemas (in JSON) to their respective render function
 * and provider registry.
 */
const memo: Record<string, [RenderChildren, ProviderRegistry]> = {}

/**
 * This symbol represents the current component instance during render. It is
 * critical for linking the current instance to the data required for render.
 */
let instanceKey: symbol

/**
 * A registry of scoped data produced during runtime that is keyed by the
 * instance symbol. For example data from: for-loop instances and slot data.
 */
const instanceScopes = new Map<symbol, Record<string, any>[]>()

/**
 * Returns a reference as a placeholder to a specific location on an object.
 * @param data - A reactive data object
 * @param token - A dot-syntax string representing the object path
 * @returns
 */
function getRef(token: string, data: Record<string, any>): Ref<unknown> {
  const value = ref<any>(null)
  const nodeRef = ref<unknown>(undefined)
  if (token === 'get') {
    value.value = getNode.bind(null, nodeRef)
    return value
  }
  const path = token.split('.')
  watchEffect(() => (value.value = getValue(data, path)))
  return value
}

/**
 * Returns a value inside a set of data objects.
 * @param sets - An array of objects to search through
 * @param path - A array of string paths easily produced by split()
 * @returns
 */
function getValue(
  set: (false | Record<string, any>)[] | Record<string, any>,
  path: string[]
): any {
  if (Array.isArray(set)) {
    for (const subset of set) {
      const value = subset !== false && getValue(subset, path)
      if (value !== undefined) return value
    }
    return undefined
  }
  let foundValue: any = undefined
  path.reduce(
    (obj: Record<string, any> | undefined, segment: string, i, arr) => {
      if (typeof obj !== 'object') {
        foundValue = undefined
        return arr.splice(1) // Forces an exit
      }
      const currentValue = obj[segment]
      if (i === path.length - 1 && currentValue !== undefined) {
        foundValue = currentValue
      }
      return obj[segment]
    },
    set
  )
  return foundValue
}

/**
 * Get the node from the global registry
 * @param id - A dot-syntax string where the node is located.
 */
function getNode(nodeRef: Ref<unknown>, id?: string) {
  if (typeof id !== 'string') return warn(823)
  if (nodeRef.value === undefined) {
    nodeRef.value = null
    const root = get(id)
    if (root) nodeRef.value = root.context
    // nodeRef.value = root.context
    watchRegistry(id, ({ payload: node }) => {
      nodeRef.value = isNode(node) ? node.context : node
    })
  }
  return nodeRef.value
}

/**
 *
 * @param library - A library of concrete components to use
 * @param schema -
 * @returns
 */
function parseSchema(
  library: FormKitComponentLibrary,
  schema: FormKitSchemaNode | FormKitSchemaNode[]
): SchemaProvider {
  /**
   * Given an if/then/else schema node, pre-compile the node and return the
   * artifacts for the render function.
   * @param data - The schema context object
   * @param library - The available components
   * @param node - The node to parse
   */
  function parseCondition(
    library: FormKitComponentLibrary,
    node: FormKitSchemaCondition
  ): [RenderContent[0], RenderContent[3], RenderContent[4]] {
    const condition = provider(compile(node.if), { if: true })
    const children = createElements(library, node.then)
    const alternate = node.else ? createElements(library, node.else) : null
    return [condition, children, alternate]
  }

  /**
   * Parses a conditional if/then/else attribute statement.
   * @param data - The data object
   * @param attr - The attribute
   * @param _default - The default value
   * @returns
   */
  function parseConditionAttr(
    attr: FormKitSchemaAttributesCondition,
    _default: FormKitAttributeValue
  ): () => FormKitAttributeValue | FormKitSchemaAttributes {
    const condition = provider(compile(attr.if))
    let b: () => FormKitAttributeValue = () => _default
    let a: () => FormKitAttributeValue = () => _default

    if (typeof attr.then === 'object') {
      a = parseAttrs(attr.then)
    } else if (typeof attr.then === 'string' && attr.then?.startsWith('$')) {
      a = provider(compile(attr.then))
    } else {
      a = () => attr.then
    }

    if (has(attr, 'else')) {
      if (typeof attr.else === 'object') {
        b = parseAttrs(attr.else)
      } else if (typeof attr.else === 'string' && attr.else?.startsWith('$')) {
        b = provider(compile(attr.else))
      } else {
        b = () => attr.else
      }
    }
    return () => (condition() ? a() : b())
  }

  /**
   * Parse attributes for dynamic content.
   * @param attrs - Object of attributes
   * @returns
   */
  function parseAttrs(
    unparsedAttrs?: FormKitSchemaAttributes | FormKitSchemaAttributesCondition,
    bindExp?: string
  ): () => FormKitSchemaAttributes {
    const explicitAttrs = new Set(Object.keys(unparsedAttrs || {}))
    const boundAttrs = bindExp ? provider(compile(bindExp)) : () => ({})
    const staticAttrs: FormKitSchemaAttributes = {}
    const setters: Array<(obj: Record<string, any>) => void> = [
      (attrs) => {
        const bound: Record<string, any> = boundAttrs()
        for (const attr in bound) {
          if (!explicitAttrs.has(attr)) {
            attrs[attr] = bound[attr]
          }
        }
      },
    ]
    if (unparsedAttrs) {
      if (isConditional(unparsedAttrs)) {
        // This is a root conditional object that must produce an object of
        // attributes.
        const condition = parseConditionAttr(
          unparsedAttrs,
          {}
        ) as () => FormKitSchemaAttributes
        return condition
      }
      // Some attributes are explicitly bound, we need to parse those ones
      // using the compiler and create a dynamic "setter".
      for (const attr in unparsedAttrs) {
        const value = unparsedAttrs[attr]
        let getValue: () => any
        if (
          typeof value === 'string' &&
          value.startsWith('$') &&
          value.length > 1
        ) {
          getValue = provider(compile(value))
        } else if (typeof value === 'object' && isConditional(value)) {
          getValue = parseConditionAttr(value, null)
        } else if (typeof value === 'object' && isPojo(value)) {
          getValue = parseAttrs(value)
        } else {
          // In all other cases, the value is static
          getValue = () => value
          staticAttrs[attr] = value
        }
        setters.push((attrs) => {
          attrs[attr] = getValue()
        })
      }
    }
    return () => {
      const attrs = {}
      setters.forEach((setter) => setter(attrs))
      return attrs
    }
  }

  /**
   * Given a single schema node, parse it and extract the value.
   * @param data - A state object provided to each node
   * @param node - The schema node being parsed
   * @returns
   */
  function parseNode(
    library: FormKitComponentLibrary,
    _node: FormKitSchemaNode
  ): RenderContent {
    let element: RenderContent[1] = null
    let attrs: () => FormKitSchemaAttributes = () => null
    let condition: false | (() => boolean | number | string) = false
    let children: RenderContent[3] = null
    let alternate: RenderContent[4] = null
    let iterator: RenderContent[5] = null
    const node: Exclude<FormKitSchemaNode, string> =
      typeof _node === 'string'
        ? {
            $el: 'text',
            children: _node,
          }
        : _node

    if (isDOM(node)) {
      // This is an actual HTML DOM element
      element = node.$el
      attrs =
        node.$el !== 'text' ? parseAttrs(node.attrs, node.bind) : () => null
    } else if (isComponent(node)) {
      // This is a Vue Component
      if (typeof node.$cmp === 'string') {
        element = has(library, node.$cmp)
          ? library[node.$cmp]
          : resolveComponent(node.$cmp)
      } else {
        // in this case it must be an actual component
        element = node.$cmp
      }
      attrs = parseAttrs(node.props, node.bind)
    } else if (isConditional(node)) {
      // This is an if/then schema statement
      ;[condition, children, alternate] = parseCondition(library, node)
    }

    // This is the same as a "v-if" statement — not an if/else statement
    if (!isConditional(node) && 'if' in node) {
      condition = provider(compile(node.if as string))
    } else if (!isConditional(node) && element === null) {
      // In this odd case our element is actually a partial and
      // we only want to render the children.
      condition = () => true
    }

    // Compile children down to a function
    if ('children' in node && node.children) {
      if (typeof node.children === 'string') {
        // We are dealing with a raw string value
        if (node.children.startsWith('$slots.')) {
          // this is a lone text node, turn it into a slot
          element = element === 'text' ? 'slot' : element
          children = provider(compile(node.children))
        } else if (node.children.startsWith('$') && node.children.length > 1) {
          const value = provider(compile(node.children))
          children = () => String(value())
        } else {
          children = () => String(node.children)
        }
      } else if (Array.isArray(node.children)) {
        // We are dealing with node sub-children
        children = createElements(library, node.children)
      } else {
        // This is a conditional if/else clause
        const [childCondition, c, a] = parseCondition(library, node.children)
        children = () =>
          childCondition && childCondition() ? c && c() : a && a()
      }
    }

    if (isComponent(node)) {
      if (children) {
        // Children of components need to be provided as an object of slots
        // so we provide an object with the default slot provided as children.
        // We also create a new scope for this default slot, and then on each
        // render pass the scoped slot props to the scope.
        const produceChildren = children
        children = () => ({
          default: (slotData?: Record<string, any>) => {
            if (slotData) instanceScopes.get(instanceKey)?.unshift(slotData)
            const instance = instanceKey
            const c = produceChildren()
            // Ensure our instance key never changed during runtime
            instanceKey = instance
            instanceScopes.get(instanceKey)?.shift()
            return c
          },
        })
      } else {
        // If we dont have any children, we still need to provide an object
        // instead of an empty array (which raises a warning in vue)
        children = () => ({})
      }
    }

    // Compile the for loop down
    if ('for' in node && node.for) {
      const values = node.for.length === 3 ? node.for[2] : node.for[1]
      const getValues =
        typeof values === 'string' && values.startsWith('$')
          ? provider(compile(values))
          : () => values
      iterator = [
        getValues,
        node.for[0],
        node.for.length === 3 ? String(node.for[1]) : null,
      ]
    }
    return [condition, element, attrs, children, alternate, iterator]
  }

  /**
   * Creates an element
   * @param data - The context data available to the node
   * @param node - The schema node to render
   * @returns
   */
  function createElement(
    library: FormKitComponentLibrary,
    node: FormKitSchemaNode
  ): RenderNodes {
    // Parses the schema node into pertinent parts
    const [
      condition,
      element,
      attrs,
      children,
      alternate,
      iterator,
    ] = parseNode(library, node)
    // This is a sub-render function (called within a render function). It must
    // only use pre-compiled features, and be organized in the most efficient
    // manner possible.
    let createNodes: RenderNodes = (() => {
      if (condition && element === null && children) {
        // Handle conditional if/then statements
        return condition() ? children() : alternate && alternate()
      }

      if (element && (!condition || condition())) {
        // handle text nodes
        if (element === 'text' && children) {
          return createTextVNode(String(children()))
        }
        // Handle lone slots
        if (element === 'slot' && children) return children()
        // Handle dom elements and components
        return h(element, attrs(), children ? (children() as Renderable[]) : [])
      }

      return typeof alternate === 'function' ? alternate() : alternate
    }) as RenderNodes

    if (iterator) {
      const repeatedNode = createNodes
      const [getValues, valueName, keyName] = iterator
      createNodes = (() => {
        const _v = getValues()
        const values = !isNaN(_v as number)
          ? Array(Number(_v))
              .fill(0)
              .map((_, i) => i)
          : _v
        const fragment = []
        if (typeof values !== 'object') return null
        const instanceScope = instanceScopes.get(instanceKey) || []
        for (const key in values) {
          instanceScope.unshift({
            [valueName]: values[key],
            ...(keyName !== null ? { [keyName]: key } : {}),
          })
          fragment.push(repeatedNode())
          instanceScope.shift()
        }
        return fragment
      }) as RenderNodes
    }
    return createNodes as RenderNodes
  }

  /**
   * Given a schema, parse it and return the resulting renderable nodes.
   * @param data - The schema context object
   * @param library - The available components
   * @param node - The node to parse
   * @returns
   */
  function createElements(
    library: FormKitComponentLibrary,
    schema: FormKitSchemaNode | FormKitSchemaNode[]
  ): RenderChildren {
    if (Array.isArray(schema)) {
      const els = schema.map(createElement.bind(null, library))
      return () => els.map((element) => element())
    }
    // Single node to render
    const element = createElement(library, schema)
    return () => element()
  }

  /**
   * Data providers produced as a result of the compiler.
   */
  const providers: ProviderRegistry = []

  /**
   * Append the requisite compiler provider and return the compiled function.
   * @param compiled - A compiled function
   * @returns
   */
  function provider(
    compiled: FormKitCompilerOutput,
    hints: Record<string, boolean> = {}
  ) {
    const compiledFns: Record<symbol, FormKitCompilerOutput> = {}
    providers.push((callback: SchemaProviderCallback, key: symbol) => {
      compiledFns[key] = compiled.provide((r) => callback(r, hints))
    })
    return () => compiledFns[instanceKey]()
  }

  return function createInstance(
    providerCallback: SchemaProviderCallback,
    key
  ) {
    const memoKey = JSON.stringify(schema)
    const [render, compiledProviders] = has(memo, memoKey)
      ? memo[memoKey]
      : [createElements(library, schema), providers]
    memo[memoKey] = [render, compiledProviders]
    compiledProviders.forEach((compiledProvider) => {
      compiledProvider(providerCallback, key)
    })
    return () => {
      instanceKey = key
      return render()
    }
  }
}

/**
 * Checks the current runtime scope for data.
 * @param token - The token to lookup in the current scope
 * @param defaultValue - The default ref value to use if no scope is found.
 */
function useScope(token: string, defaultValue: any) {
  const scopedData = instanceScopes.get(instanceKey) || []
  let scopedValue: any = undefined
  if (scopedData.length) {
    scopedValue = getValue(scopedData, token.split('.'))
  }
  return scopedValue === undefined ? defaultValue : scopedValue
}

/**
 * Get the current scoped data and flatten it.
 */
function slotData(data: Record<string, any>, key: symbol) {
  return new Proxy(data, {
    get(...args) {
      let data: any = undefined
      const property = args[1]
      if (typeof property === 'string') {
        const prevKey = instanceKey
        instanceKey = key
        data = useScope(property, undefined)
        instanceKey = prevKey
      }
      return data !== undefined ? data : Reflect.get(...args)
    },
  })
}

/**
 * Provides data to a parsed schema.
 * @param provider - The SchemaProvider (output of calling parseSchema)
 * @param data - Data to fetch values from
 * @returns
 */
function createRenderFn(
  instanceCreator: SchemaProvider,
  data: Record<string, any>,
  instanceKey: symbol
) {
  return instanceCreator(
    (requirements, hints: Record<string, boolean> = {}) => {
      return requirements.reduce((tokens, token) => {
        if (token.startsWith('slots.')) {
          const slot = token.substr(6)
          const hasSlot = data.slots && has(data.slots, slot)
          if (hints.if) {
            // If statement — dont render the slot, check if it exists
            tokens[token] = () => hasSlot
          } else if (data.slots && hasSlot) {
            // Render the slot with current scope data
            const scopedData = slotData(data, instanceKey)
            tokens[token] = () => data.slots[slot](scopedData)
            return tokens
          }
        }
        const value = getRef(token, data)
        tokens[token] = () => useScope(token, value.value)
        return tokens
      }, {} as Record<string, any>)
    },
    instanceKey
  )
}

let i = 0

/**
 * The FormKitSchema vue component:
 * @public
 */
export const FormKitSchema = defineComponent({
  name: 'FormKitSchema',
  props: {
    schema: {
      type: [Array, Object] as PropType<
        FormKitSchemaNode[] | FormKitSchemaCondition
      >,
      required: true,
    },
    data: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    library: {
      type: Object as PropType<FormKitComponentLibrary>,
      default: () => ({}),
    },
  },
  setup(props, context) {
    const instanceKey = Symbol(String(i++))
    instanceScopes.set(instanceKey, [])
    let provider = parseSchema(props.library, props.schema)
    let render: RenderChildren
    let data: Record<string, any>
    // Re-parse the schema if it changes:
    watch(
      () => props.schema,
      () => {
        provider = parseSchema(props.library, props.schema)
        render = createRenderFn(provider, data, instanceKey)
      }
    )

    // Watch the data object explicitly
    watchEffect(() => {
      data = Object.assign(reactive(props.data), {
        slots: context.slots,
      })
      render = createRenderFn(provider, data, instanceKey)
    })
    return () => render()
  },
})
