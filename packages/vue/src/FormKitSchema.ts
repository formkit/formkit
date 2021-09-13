import {
  h,
  defineComponent,
  PropType,
  toRef,
  createTextVNode,
  VNode,
  resolveComponent,
  ConcreteComponent,
} from 'vue'
import {
  FormKitSchemaAttributes,
  FormKitSchemaNode,
  isDOM,
  isConditional,
  isComponent,
  compile,
} from '@formkit/schema'
import { has, isPojo } from '@formkit/utils'

interface FormKitSchemaContext {
  [index: string]: any
}

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
  attrs: FormKitSchemaAttributes,
  children: RenderChildren
]

/**
 * The format children elements can be in.
 */
type RenderChildren = () => string | Array<string | VNode | null>

/**
 * Extracts a reference object from a set of (reactive) data.
 * @param data - Returns a Vue ref object for the given path
 * @param token - A dot-notation path like: user.name
 * @returns
 * @internal
 */
function getRef(data: FormKitSchemaContext, token: string): { value: any } {
  const path = token.split('.')
  return path.reduce((obj: any, segment: string) => {
    if (has(obj, segment) && isPojo(obj[segment])) {
      return obj[segment]
    }
    return toRef(obj, segment)
  }, data)
}

/**
 * Given a single schema node, parse it and extract the value.
 * @param data - A state object provided to each node
 * @param node - The schema node being parsed
 * @returns
 */
function parseNode(
  data: FormKitSchemaContext,
  library: FormKitComponentLibrary,
  node: FormKitSchemaNode
): RenderContent {
  let element = null
  let attrs: FormKitSchemaAttributes = {}
  let condition: false | (() => boolean | number | string) = false
  let children: RenderChildren = () => []

  // Parse DOM nodes
  if (isDOM(node)) {
    element = node.$el
    attrs = node.attrs || {}
  }

  if (isComponent(node)) {
    if (typeof node.$cmp === 'string') {
      element = has(library, node.$cmp)
        ? library[node.$cmp]
        : resolveComponent(node.$cmp)
    } else {
      // in this case it must be an actual component
      element = node.$cmp
    }
    attrs = node.props || {}
  }

  if (typeof node !== 'string') {
    // Parse conditionals
    if (isConditional(node) && has(node, '$if')) {
      condition = compile(node.$if as string).provide((token) => {
        const value = getRef(data, token)
        return () => {
          return value.value
        }
      })
    }

    if (has(node, 'children')) {
      const nodes =
        typeof node.children == 'string' ? [node.children] : node.children
      if (Array.isArray(nodes)) {
        const elements = nodes.map(createElement.bind(null, data, library))
        children = () => elements.map((e) => e())
      }
    }
  }

  return [condition, element, attrs, children]
}

/**
 * Creates an element
 * @param data - The context data available to the node
 * @param node - The schema node to render
 * @returns
 */
function createElement(
  data: FormKitSchemaContext,
  library: FormKitComponentLibrary,
  node: FormKitSchemaNode
) {
  if (typeof node === 'string') {
    const value = node.startsWith('$')
      ? compile(node).provide((token: string) => {
          const value = getRef(data, token)
          return () => {
            return value.value
          }
        })
      : () => node
    return () => createTextVNode(String(value()))
  }
  const [condition, element, attrs, children] = parseNode(data, library, node)
  return () => {
    if (element && (!condition || condition())) {
      return h(element, attrs, children())
    }
    return null
  }
}

/**
 * The FormKitSchema vue component:
 */
const FormKitSchema = defineComponent({
  props: {
    schema: {
      type: Array as PropType<FormKitSchemaNode[]>,
      required: true,
    },
    data: {
      type: Object as PropType<FormKitSchemaContext>,
      default: () => ({}),
    },
    library: {
      type: Object as PropType<FormKitComponentLibrary>,
      default: () => ({}),
    },
  },
  setup(props) {
    const elements = props.schema.map(
      createElement.bind(null, props.data, props.library)
    )
    return () => elements.map((e) => e())
  },
})

export default FormKitSchema
