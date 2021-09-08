import { h, defineComponent, PropType, toRef, VNode } from 'vue'
import {
  FormKitSchemaAttributes,
  FormKitSchemaNode,
  isDOM,
  isConditional,
} from '@formkit/schema'

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
type RenderChildren = string | Array<string | (() => VNode<any>)> | null

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
  const attrs: FormKitSchemaAttributes = {}
  let condition: false | (() => boolean) = false
  if (isDOM(node)) {
    element = node.$el
  }

  if (isConditional(node)) {
    const [requirements, conditional] = extractCondition(node.$if)
    const refs = requirements.map((token) => tokenToRef(data, token))
    condition = () => {
      return conditional(...refs.map((token) => token.value))
    }
  }

  return [condition, element, attrs, null]
}

/**
 * Creates an element
 * @param data - The context data available to the node
 * @param node - The schema node to render
 * @returns
 */
function createElement(data: FormKitSchemaContext, node: FormKitSchemaNode) {
  const [condition, element, attrs, children] = parseNode(data, node)
  return () => {
    if (element && (!condition || condition())) {
      return h(element, attrs, unwrap(children))
    }
    return null
  }
}

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
    return () => {
      return elements.map((e) => e())
    }
  },
})

export default FormKitSchema
