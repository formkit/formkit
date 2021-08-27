import { has } from '@formkit/utils'
import { FormKitNode, FormKitProps } from '@formkit/core'

/**
 * Properties available in all schema nodes.
 * @public
 */
export interface FormKitSchemaProps {
  value?: any
  children?: string | FormKitSchemaNode[]
  content?: string | FormKitSchemaNode[]
  key?: string
}

/**
 * Properties available when using a formkit input.
 * @public
 */
export type FormKitSchemaFormKitNode = {
  $node: string
  type: 'input' | 'list' | 'group'
  name?: string
  value?: any
  props: Partial<FormKitProps>
} & FormKitSchemaProps

/**
 * Properties available when using a DOM node.
 * @public
 */
export type FormKitSchemaDOMNode = {
  $el: string
  attrs?: FormKitSchemaAttributes
} & FormKitSchemaProps

/**
 * A simple text node.
 * @public
 */
export type FormKitSchemaTextNode = string

/**
 * DOM attributes are simple string dictionaries.
 * @public
 */
export type FormKitSchemaAttributes = {
  style?: { [index: string]: string | number }
  [index: string]:
    | string
    | number
    | boolean
    | undefined
    | { [index: string]: string | number }
}

/**
 * Properties available when defining a generic non-formkit component.
 * @public
 */
export type FormKitSchemaComponent = {
  $cmp: string
  props?: { [index: string]: any }
} & FormKitSchemaProps

/**
 * The context that is passed from one schema render to the next.
 * @public
 */
export type FormKitSchemaContext<ComponentType> = {
  library: {
    [index: string]: ComponentType
  }
  nodes: {
    [index: string]: FormKitNode<any>
  }
}

/**
 * Properties available then defining a schema node.
 * @public
 */
export type FormKitSchemaNode =
  | FormKitSchemaFormKitNode
  | FormKitSchemaDOMNode
  | FormKitSchemaComponent
  | FormKitSchemaTextNode

/**
 * Type narrow that a node is a DOM node.
 * @param node - A schema node to check
 * @returns
 * @public
 */
export function isDOM(node: FormKitSchemaNode): node is FormKitSchemaDOMNode {
  return typeof node !== 'string' && has(node, '$el')
}

/**
 * Determines if t a node is a $formkit schema node.
 * @param node - A schema node to check
 * @returns
 * @public
 */
export function isNode(
  node: FormKitSchemaNode
): node is FormKitSchemaFormKitNode {
  return typeof node !== 'string' && has(node, '$node')
}
