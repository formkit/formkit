import { FormKitProps } from './node'
import { has } from '@formkit/utils'

/**
 * The value being listed out. Can be an array, an object, or a number.
 * @public
 */
export type FormKitListValue =
  | string
  | Record<string, any>
  | Array<string | number | Record<string, any>>
  | number

/**
 * A full loop statement in tuple syntax. Can be read like "foreach value, key? in list"
 * @public
 */
export type FormKitListStatement =
  | [value: any, key: number | string, list: FormKitListValue]
  | [value: any, list: FormKitListValue]

/**
 * Properties available in all schema nodes.
 * @public
 */
export interface FormKitSchemaProps {
  children?: string | FormKitSchemaNode[] | FormKitSchemaCondition
  key?: string
  if?: string
  for?: FormKitListStatement
  bind?: string
}

/**
 * Properties available when using a formkit input.
 * @public
 */
export type FormKitSchemaFormKitNode = {
  $node: string
  name?: string
  props: Partial<FormKitProps>
  type: 'input' | 'list' | 'group'
  value?: any
} & FormKitSchemaProps

/**
 * Properties available when using a DOM node.
 * @public
 */
export type FormKitSchemaDOMNode = {
  $el: string | null
  attrs?: FormKitSchemaAttributes
} & FormKitSchemaProps

/**
 * A simple text node.
 * @public
 */
export type FormKitSchemaTextNode = string

/**
 * The possible value types of attributes (in the schema)
 * @public
 */
export type FormKitAttributeValue =
  | string
  | number
  | boolean
  | undefined
  | FormKitSchemaAttributes
  | FormKitSchemaAttributesCondition

/**
 * Conditions nested inside attribute declarations
 * @public
 */
export interface FormKitSchemaAttributesCondition {
  if: string
  then: FormKitAttributeValue
  else?: FormKitAttributeValue
}

/**
 * DOM attributes are simple string dictionaries.
 * @public
 */
export type FormKitSchemaAttributes =
  | {
      [index: string]: FormKitAttributeValue
    }
  | null
  | FormKitSchemaAttributesCondition

/**
 * Properties available when defining a generic non-formkit component.
 * @public
 */
export type FormKitSchemaComponent = {
  $cmp: string
  props?: { [index: string]: any }
} & FormKitSchemaProps

/**
 * A schema node that determines _which_ content to render.
 * @public
 */
export type FormKitSchemaCondition = {
  if: string
  then: FormKitSchemaNode | FormKitSchemaNode[]
  else?: FormKitSchemaNode | FormKitSchemaNode[]
}

/**
 * The context that is passed from one schema render to the next.
 * @public
 */
export interface FormKitSchemaContext {
  [index: string]: any
  __FK_SCP: Map<symbol, Record<string, any>>
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
  | FormKitSchemaCondition

/**
 * Definition for a function that can extend a given schema node.
 * @public
 */
export interface FormKitSchemaComposable {
  (
    extendWith?: Partial<FormKitSchemaNode>,
    children?: string | FormKitSchemaNode[] | FormKitSchemaCondition
  ): FormKitSchemaNode
}

/**
 * Defines a function that allows selectively overriding a given schema.
 * @public
 */
export interface FormKitExtendableSchemaRoot {
  (
    extensions: Record<
      string,
      Partial<FormKitSchemaNode> | FormKitSchemaCondition
    >
  ): FormKitSchemaNode[]
}

/**
 * Type narrow that a node is a DOM node.
 * @param node - A schema node to check
 * @returns
 * @public
 */
export function isDOM(
  node: string | Record<PropertyKey, any>
): node is FormKitSchemaDOMNode {
  return typeof node !== 'string' && has(node, '$el')
}

/**
 * Type narrow that a node is a DOM node.
 * @param node - A schema node to check
 * @returns
 * @public
 */
export function isComponent(
  node: string | Record<PropertyKey, any>
): node is FormKitSchemaComponent {
  return typeof node !== 'string' && has(node, '$cmp')
}

/**
 * Determines if a node is conditionally rendered or not.
 * @param node - A schema node to check
 * @returns
 * @public
 */
export function isConditional(
  node: FormKitSchemaNode
): node is FormKitSchemaCondition
/**
 * Determines if an attribute is a conditional.
 * @param node - A schema node to check
 * @returns
 * @public
 */
export function isConditional(
  node: FormKitSchemaAttributesCondition | FormKitSchemaAttributes
): node is FormKitSchemaAttributesCondition
/**
 * Root declaration.
 * @param node - An object to check
 * @returns
 * @public
 */
export function isConditional(
  node:
    | FormKitSchemaNode
    | FormKitSchemaAttributesCondition
    | FormKitSchemaAttributes
): node is FormKitSchemaNode | FormKitSchemaAttributesCondition {
  if (!node || typeof node === 'string') return false
  return has(node, 'if') && has(node, 'then')
}
