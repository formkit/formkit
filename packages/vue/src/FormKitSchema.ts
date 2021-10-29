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
type Renderable = null | string | VirtualNode
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
  requirements: string[]
) => Record<string, () => any>

type ProviderRegistry = ((
  providerCallback: SchemaProviderCallback,
  key: symbol
) => void)[]

/**
 * Returns a reference as a placeholder to a specific location on an object.
 * @param data - A reactive data object
 * @param token - A dot-syntax string representing the object path
 * @returns
 */
function getRef(data: Record<string, any>, token: string): Ref<unknown> {
  const value = ref<any>(null)
  const path = token.split('.')
  watchEffect(() => {
    path.reduce(
      (obj: Record<string, any> | undefined, segment: string, i, arr) => {
        if (typeof obj !== 'object') {
          value.value = undefined
          return arr.splice(1) // Forces an exit
        }
        if (i === path.length - 1 && segment in obj) {
          value.value = obj[segment]
        }
        return obj[segment]
      },
      data
    )
  })
  return value
}

const memo: Record<string, [RenderChildren, ProviderRegistry]> = {}

let instanceKey: symbol

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
   * Extracts a reference object from a set of (reactive) data.
   * @param data - The formkit context object object for the given path
   * @param token - A dot-notation path like: user.name
   * @returns
   * @internal
   */
  // function getRef(
  //   data: FormKitSchemaContext,
  //   scopes: ScopePath,
  //   token: string
  // ): { value: any } {
  //   const path = token.split('.')
  //   const value = ref<unknown>(null)
  //   const nodeRef = ref<unknown>(undefined)
  //   if (token === 'get') {
  //     value.value = getNode.bind(null, nodeRef)
  //   } else {
  //     watchEffect(() => {
  //       const sets = scopes
  //         .map((scope) => data.__FK_SCP.get(scope) || false)
  //         .filter((s) => s)
  //       sets.push(data)
  //       const foundValue = findValue(sets, path)
  //       if (foundValue !== undefined) {
  //         value.value = foundValue
  //       }
  //     })
  //   }
  //   return value
  // }

  /**
   * Get the node from the global registry
   * @param id - A dot-syntax string where the node is located.
   */
  // function getNode(nodeRef: Ref<unknown>, id?: string) {
  //   if (typeof id !== 'string') return warn(823)
  //   if (nodeRef.value === undefined) {
  //     nodeRef.value = null
  //     const root = get(id)
  //     if (root) nodeRef.value = root.context
  //     // nodeRef.value = root.context
  //     watchRegistry(id, ({ payload: node }) => {
  //       nodeRef.value = isNode(node) ? node.context : node
  //     })
  //   }
  //   return nodeRef.value
  // }

  /**
   * Returns a value inside a set of data objects.
   * @param sets - An array of objects to search through
   * @param path - A array of string paths easily produced by split()
   * @returns
   */
  // function findValue(sets: (false | Record<string, any>)[], path: string[]): any {
  //   for (const set of sets) {
  //     let obj: any = set
  //     for (const i in path) {
  //       const segment = path[i]
  //       const value = obj[segment]
  //       const next = typeof value === 'object' ? value : {}
  //       if (
  //         Number(i) === path.length - 1 &&
  //         (has(obj, segment) || value !== undefined)
  //       ) {
  //         return value
  //       }
  //       obj = next
  //     }
  //   }
  //   return undefined
  // }

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
    const condition = provider(compile(node.if))
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
    const a =
      attr.then && typeof attr.then === 'object'
        ? parseAttrs(attr.then)
        : () => attr.then
    if (has(attr, 'else') && typeof attr.else === 'object') {
      b = parseAttrs(attr.else)
    } else if (has(attr, 'else')) {
      b = () => attr.else
    }
    return () => (condition() ? a() : b())
  }

  /**
   * A global scope object used exclusively in render functions for iteration
   * based scope data like key/value pairs.
   */
  const iterationScopes: Record<string, any>[] = []

  /**
   * Before returning a value in a render function, check to see if there are
   * any local iteration values that should be used.
   * @param value - A value to fallback to
   * @param token - A token to lookup in a global iteration scope
   * @returns
   */
  // function checkScope(value: any, token: string): any {
  //   if (iterationScopes.length) {
  //     const path = token.split('.')
  //     const foundValue = findValue(iterationScopes, path)
  //     return foundValue !== undefined ? foundValue : value
  //   }
  //   return value
  // }

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
    const attrs: FormKitSchemaAttributes = {}
    const setters: Array<() => void> = [
      () => {
        const bound: any = boundAttrs()
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
      for (const attr in unparsedAttrs) {
        attrs[attr] = undefined
        const value = unparsedAttrs[attr]
        if (
          typeof value === 'string' &&
          value.startsWith('$') &&
          value.length > 1
        ) {
          // In this case we have a dynamic value, so we create a "setter"
          // function that will manipulate the value of our attribute at runtime.
          const dynamicValue = provider(compile(value))
          setters.push(() => {
            Object.assign(attrs, { [attr]: dynamicValue() })
          })
        } else if (typeof value === 'object' && isConditional(value)) {
          const condition = parseConditionAttr(value, null)
          setters.push(() => {
            Object.assign(attrs, { [attr]: condition() })
          })
        } else if (typeof value === 'object' && isPojo(value)) {
          // In this case we need to recurse
          const subAttrs = parseAttrs(value)
          setters.push(() => {
            Object.assign(attrs, { [attr]: subAttrs() })
          })
        } else {
          // In all other cases, the value is static
          attrs[attr] = value
        }
      }
      return () => {
        setters.forEach((setter) => setter())
        // Unfortunately this spreading is necessary to trigger reactivity
        return { ...attrs }
      }
    }
    return () => {
      setters.forEach((setter) => setter())
      return { ...attrs }
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
        // if (node.children.startsWith('$slots.')) {
        //   const slot = node.children.substr(7)
        //   if (has(data.slots, slot)) {
        //     element = element === 'text' ? 'slot' : element
        //     children = data.slots[slot]
        //   }
        // } else
        if (node.children.startsWith('$') && node.children.length > 1) {
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
        // const produceChildren = children
        // children = () => ({
        //   default: (slotData?: Record<string, any>) => {
        //     if (slotData) produceChildren
        //     return produceChildren(slotData)
        //   },
        // })
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
        // Handle slots
        // if (element === 'slot' && children) {
        //   return (children as Slot)(data)
        // }
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
        for (const key in values) {
          iterationScopes.unshift({
            [valueName]: values[key],
            ...(keyName !== null ? { [keyName]: key } : {}),
          })
          fragment.push(repeatedNode())
          iterationScopes.shift()
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
  function provider(compiled: FormKitCompilerOutput) {
    const compiledFns: Record<symbol, FormKitCompilerOutput> = {}

    providers.push((callback: SchemaProviderCallback, key: symbol) => {
      compiledFns[key] = compiled.provide(callback)
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

    compiledProviders.forEach((instanceProvider) => {
      instanceProvider(providerCallback, key)
    })
    return () => {
      instanceKey = key
      return render()
    }
  }
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
  return instanceCreator((requirements) => {
    return requirements.reduce((tokens, token) => {
      const value = getRef(data, token)
      tokens[token] = () => value.value
      return tokens
    }, {} as Record<string, any>)
  }, instanceKey)
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
