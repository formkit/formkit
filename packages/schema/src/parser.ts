import {
  FormKitSchemaNode,
  FormKitSchemaContext,
  FormKitSchemaAttributes,
  isDOM,
  isNode,
} from './schema'
import { has } from '@formkit/utils'

export function createParser<ComponentType, VirtualNode>(
  h: (el: any, props?: any, children?: any) => VirtualNode,
  rootNode: ComponentType
): (
  schema: FormKitSchemaNode[],
  context: FormKitSchemaContext<ComponentType>
) => Array<VirtualNode | string | null> {
  function createElements(
    schema: FormKitSchemaNode[],
    context: FormKitSchemaContext<ComponentType>
  ): Array<VirtualNode | string | null> {
    return schema.map(createVueElement.bind(null, context))
  }

  function createVueElement(
    context: FormKitSchemaContext<ComponentType>,
    node: FormKitSchemaNode,
    index: number
  ) {
    // $el — Render DOM elements
    if (isDOM(node)) {
      return h(
        node.$el,
        {
          ...parseAttributes(context, node.attrs),
          key: node.key || index,
        },
        node.children
          ? createElements(createChildren(node.children), context)
          : null
      )
    }
    // $node — Create FormKitNode wrappers
    if (isNode(node)) {
      const { $node, name, value, children, props, key } = node
      return h(rootNode, {
        id: $node,
        name,
        value,
        props,
        schemaContext: context,
        key: key || index,
        children: createChildren(children),
      })
    }
    // string - Render a simple DOM string
    if (typeof node === 'string') {
      return getNodeValue(node, context)
    }
    return null
  }

  function createChildren(
    children?: string | FormKitSchemaNode[]
  ): FormKitSchemaNode[] {
    if (typeof children === 'string') {
      return [children]
    }
    if (Array.isArray(children)) {
      return children
    }
    return children ? [children] : []
  }

  function parseAttributes(
    context: FormKitSchemaContext<ComponentType>,
    attrs: FormKitSchemaAttributes = {}
  ): { [index: string]: any } {
    const parsedAttributes: { [index: string]: any } = {}
    for (const attribute in attrs) {
      const value = attrs[attribute]
      if (typeof value === 'string') {
        const attributeValue = getNodeValue(value, context)
        if (attributeValue !== undefined) {
          parsedAttributes[attribute] = attributeValue
        }
      } else {
        parsedAttributes[attribute] = attrs[attribute]
      }
    }
    return parsedAttributes
  }

  function getNodeValue(
    value: string,
    context: FormKitSchemaContext<ComponentType>
  ): any {
    const key = Object.keys(context.nodes).find((key) =>
      value.startsWith(`$${key}`)
    )
    if (key) {
      const selectors = value.substr(key.length + 2).split('.')
      const node = context.nodes[key]
      return selectors.reduce((obj: any, selector: string) => {
        if (obj !== null && typeof obj === 'object' && has(obj, selector)) {
          return obj[selector]
        }
        return undefined
      }, node)
    }
    return value
  }

  return createElements
}
