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
  Slot,
} from 'vue'
import {
  FormKitSchemaAttributes,
  FormKitSchemaNode,
  FormKitSchemaContext,
  isDOM,
  isConditional,
  isComponent,
  compile,
  FormKitSchemaCondition,
  FormKitSchemaAttributesCondition,
  FormKitAttributeValue,
} from '@formkit/schema'
import { has, isPojo } from '@formkit/utils'
import { warn } from '@formkit/core'

/**
 * A library of components available to the schema (in addition to globally
 * registered ones)
 */
interface FormKitComponentLibrary {
  [index: string]: ConcreteComponent
}

/**
 * The internal path for hierarchical memory scoping.
 */
type ScopePath = symbol[]

/**
 * Defines the structure a parsed node.
 */
type RenderContent = [
  condition: false | (() => boolean | number | string),
  element: string | ConcreteComponent | null,
  attrs: () => FormKitSchemaAttributes,
  children: RenderChildren | null,
  alternate: RenderChildren | null,
  scopes: ScopePath,
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
type RenderChildren = (
  data?: Record<string, any>
) =>
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

/**
 * Extracts a reference object from a set of (reactive) data.
 * @param data - The formkit context object object for the given path
 * @param token - A dot-notation path like: user.name
 * @returns
 * @internal
 */
function getRef(
  data: FormKitSchemaContext,
  scopes: ScopePath,
  token: string
): { value: any } {
  const path = token.split('.')
  const value = ref(null)
  watchEffect(() => {
    const sets = scopes
      .map((scope) => data.__FK_SCP.get(scope) || false)
      .filter((s) => s)
    sets.push(data)
    const foundValue = findValue(sets, path)
    if (foundValue !== undefined) {
      value.value = foundValue
    }
  })
  return value
}

/**
 * Returns a value inside a set of data objects.
 * @param sets - An array of objects to search through
 * @param path - A array of string paths easily produced by split()
 * @returns
 */
function findValue(sets: (false | Record<string, any>)[], path: string[]): any {
  for (const set of sets) {
    let obj: any = set
    for (const i in path) {
      const segment = path[i]
      const value = obj[segment]
      const next = typeof value === 'object' ? value : {}
      if (
        Number(i) === path.length - 1 &&
        (has(obj, segment) || value !== undefined)
      ) {
        return value
      }
      obj = next
    }
  }
  return undefined
}

/**
 * Sets a value (available with the schema) in the current scope.
 * @param data - The formkit context object
 * @param scopes - An array of symbols representing the scope path
 * @param key - A key or "variable name" to set within the given scope
 * @param value - A value to assign to that key
 */
function setValue(
  data: FormKitSchemaContext,
  scopes: ScopePath,
  key: string | Record<string, any>,
  value?: any
): void {
  const scope = scopes[0]
  const newData = typeof key === 'string' ? { [key]: value } : key
  if (data.__FK_SCP.has(scope)) {
    Object.assign(data.__FK_SCP.get(scope), newData)
  } else {
    data.__FK_SCP.set(scope, newData)
  }
}

/**
 * Given an if/then/else schema node, pre-compile the node and return the
 * artifacts for the render function.
 * @param data - The schema context object
 * @param library - The available components
 * @param node - The node to parse
 */
function parseCondition(
  data: FormKitSchemaContext,
  scopes: ScopePath,
  library: FormKitComponentLibrary,
  node: FormKitSchemaCondition
): [RenderContent[0], RenderContent[3], RenderContent[4]] {
  const condition = compile(node.if).provide((token) => {
    const value = getRef(data, scopes, token)
    return () => checkScope(value.value, token)
  })
  const children = parseSchema(data, scopes, library, node.then)
  const alternate = node.else
    ? parseSchema(data, scopes, library, node.else)
    : null
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
  data: FormKitSchemaContext,
  scopes: ScopePath,
  attr: FormKitSchemaAttributesCondition,
  _default: FormKitAttributeValue
): () => FormKitAttributeValue | FormKitSchemaAttributes {
  const condition = compile(attr.if).provide((token) => {
    const value = getRef(data, scopes, token)
    return () => checkScope(value.value, token)
  })
  let b: () => FormKitAttributeValue = () => _default
  const a =
    attr.then && typeof attr.then === 'object'
      ? parseAttrs(data, scopes, attr.then)
      : () => attr.then
  if (has(attr, 'else') && typeof attr.else === 'object') {
    b = parseAttrs(data, scopes, attr.else)
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
function checkScope(value: any, token: string): any {
  if (iterationScopes.length) {
    const path = token.split('.')
    const foundValue = findValue(iterationScopes, path)
    return foundValue !== undefined ? foundValue : value
  }
  return value
}

/**
 * Parse attributes for dynamic content.
 * @param attrs - Object of attributes
 * @returns
 */
function parseAttrs(
  data: FormKitSchemaContext,
  scopes: ScopePath,
  unparsedAttrs?: FormKitSchemaAttributes | FormKitSchemaAttributesCondition,
  bindExp?: string
): () => FormKitSchemaAttributes {
  const explicitAttrs = new Set(Object.keys(unparsedAttrs || {}))
  const boundAttrs = bindExp
    ? compile(bindExp).provide((token) => {
        const value = getRef(data, scopes, token)
        return () => checkScope(value.value, token)
      })
    : () => ({})
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
        data,
        scopes,
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
        const dynamicValue = compile(value).provide((token) => {
          const value = getRef(data, scopes, token)
          return () => checkScope(value.value, token)
        })
        setters.push(() => {
          Object.assign(attrs, { [attr]: dynamicValue() })
        })
      } else if (typeof value === 'object' && isConditional(value)) {
        const condition = parseConditionAttr(data, scopes, value, null)
        setters.push(() => {
          Object.assign(attrs, { [attr]: condition() })
        })
      } else if (typeof value === 'object' && isPojo(value)) {
        // In this case we need to recurse
        const subAttrs = parseAttrs(data, scopes, value)
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
  data: FormKitSchemaContext,
  _scopes: ScopePath,
  library: FormKitComponentLibrary,
  _node: FormKitSchemaNode
): RenderContent {
  let element: RenderContent[1] = null
  let attrs: () => FormKitSchemaAttributes = () => null
  let condition: false | (() => boolean | number | string) = false
  let children: RenderContent[3] = null
  let alternate: RenderContent[4] = null
  let iterator: RenderContent[6] = null
  const scopes = reactive([Symbol(), ..._scopes])
  const node: Exclude<FormKitSchemaNode, string> =
    typeof _node === 'string'
      ? {
          $el: 'text',
          children: _node,
        }
      : _node

  // Assign any explicitly scoped variables
  if ('let' in node && node.let) {
    for (const key in node.let) {
      setValue(data, scopes, key, node.let[key])
    }
  }

  if (isDOM(node)) {
    // This is an actual HTML DOM element
    element = node.$el
    attrs =
      node.$el !== 'text'
        ? parseAttrs(data, scopes, node.attrs, node.bind)
        : () => null
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
    scopes.unshift(Symbol())
    attrs = parseAttrs(data, scopes, node.props, node.bind)
  } else if (isConditional(node)) {
    // This is an if/then schema statement
    ;[condition, children, alternate] = parseCondition(
      data,
      scopes,
      library,
      node
    )
  }

  // This is the same as a "v-if" statement — not an if/else statement
  if (!isConditional(node) && 'if' in node) {
    condition = compile(node.if as string).provide((token) => {
      const value = getRef(data, scopes, token)
      return () => checkScope(value.value, token)
    })
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
        const slot = node.children.substr(7)
        if (has(data.slots, slot)) {
          element = element === 'text' ? 'slot' : element
          children = data.slots[slot]
        }
      } else if (node.children.startsWith('$') && node.children.length > 1) {
        const value = compile(node.children).provide((token: string) => {
          const value = getRef(data, scopes, token)
          return () => checkScope(value.value, token)
        })
        children = () => String(value())
      } else {
        children = () => String(node.children)
      }
    } else if (Array.isArray(node.children)) {
      // We are dealing with node sub-children
      children = parseSchema(data, scopes, library, node.children)
    } else {
      // This is a conditional if/else clause
      const [childCondition, c, a] = parseCondition(
        data,
        scopes,
        library,
        node.children
      )
      children = () =>
        childCondition && childCondition() ? c && c() : a && a()
    }
  }

  if (isComponent(node) && children) {
    const produceChildren = children
    children = () => ({
      default: (slotData?: Record<string, any>) => {
        if (slotData) setValue(data, scopes, slotData)
        return produceChildren()
      },
    })
  }

  // Compile the for loop down
  if ('for' in node && node.for) {
    const values = node.for.length === 3 ? node.for[2] : node.for[1]
    const getValues =
      typeof values === 'string' && values.startsWith('$')
        ? compile(values).provide((token) => {
            const value = getRef(data, scopes, token)
            return () => checkScope(value.value, token)
          })
        : () => values
    iterator = [
      getValues,
      node.for[0],
      node.for.length === 3 ? String(node.for[1]) : null,
    ]
  }
  return [condition, element, attrs, children, alternate, scopes, iterator]
}

/**
 * Creates an element
 * @param data - The context data available to the node
 * @param node - The schema node to render
 * @returns
 */
function createElement(
  data: FormKitSchemaContext,
  parentScope: ScopePath,
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
    _scope,
    iterator,
  ] = parseNode(data, parentScope, library, node)
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
      if (element === 'slot' && children) {
        return (children as Slot)(data)
      }
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
function parseSchema(
  data: FormKitSchemaContext,
  parentScope: ScopePath,
  library: FormKitComponentLibrary,
  nodes: FormKitSchemaNode | FormKitSchemaNode[]
): RenderNodes | RenderChildren {
  if (Array.isArray(nodes)) {
    const els = nodes.map(createElement.bind(null, data, parentScope, library))
    return () => els.map((e) => e())
  }
  // Single node to render
  const element = createElement(data, parentScope, library, nodes)
  return () => element()
}

/**
 * The FormKitSchema vue component:
 * @public
 */
export const FormKitSchema = defineComponent({
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
    let element: RenderNodes | RenderChildren
    watchEffect(() => {
      if ('slots' in props.data) warn(456)
      const data = Object.assign(reactive(props.data), {
        slots: context.slots,
        __FK_SCP: new Map<symbol, Record<string, any>>(),
      })
      element = parseSchema(
        data,
        reactive([Symbol()]),
        props.library,
        props.schema
      )
    })
    return () => element()
  },
})
