import {
  h,
  defineComponent,
  PropType,
  toRef,
  createTextVNode,
  VNode,
} from 'vue'
import {
  FormKitSchemaAttributes,
  FormKitSchemaNode,
  isDOM,
  isConditional,
  isComponent,
  compileCondition,
} from '@formkit/schema'
import { has, isPojo } from '@formkit/utils'

interface FormKitSchemaContext {
  [index: string]: any
}

/**
 * Defines the structure a parsed node.
 */
type RenderContent = [
  condition: false | (() => boolean),
  element: string | null,
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
  node: FormKitSchemaNode
): RenderContent {
  let element = null
  let attrs: FormKitSchemaAttributes = {}
  let condition: false | (() => boolean) = false
  let children: RenderChildren = () => []

  // Parse DOM nodes
  if (isDOM(node)) {
    element = node.$el
    attrs = node.attrs || {}
  }

  if (isComponent(node)) {
    attrs = node.props || {}
  }

  if (typeof node !== 'string') {
    // Parse conditionals
    if (isConditional(node) && has(node, '$if')) {
      condition = compileCondition(node.$if as string).provide((token) => {
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
        const elements = nodes.map(createElement.bind(null, data))
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
function createElement(data: FormKitSchemaContext, node: FormKitSchemaNode) {
  if (typeof node === 'string') {
    console.log('parsing element')
    const textNode = node.startsWith('$')
      ? getRef(data, node.substr(1))
      : { value: node }
    return () => createTextVNode(textNode.value)
  }
  const [condition, element, attrs, children] = parseNode(data, node)
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
  },
  setup(props) {
    const elements = props.schema.map(createElement.bind(null, props.data))
    return () => elements.map((e) => e())
  },
})

export default FormKitSchema
