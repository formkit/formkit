/**
 * Properties available in all schema nodes.
 * @public
 */
export interface FormKitSchemaProps {
  value: any
  children: Partial<FormKitSchemaNode>[]
}

/**
 * Properties available when using a formkit input.
 * @public
 */
export type FormKitSchemaFormKitNode = {
  $formkit: string
} & FormKitSchemaProps

/**
 * Properties available when using a DOM node.
 * @public
 */
export type FormKitSchemaDOMNode = {
  $el: string
  content?: string
} & FormKitSchemaProps

/**
 * Properties available when defining a generic non-formkit component.
 * @public
 */
export type FormKitSchemaComponent = {
  $cmp: string
  props?: { [index: string]: any }
} & FormKitSchemaProps

/**
 * Properties available then defining a schema node.
 * @public
 */
export type FormKitSchemaNode =
  | FormKitSchemaFormKitNode
  | FormKitSchemaDOMNode
  | FormKitSchemaComponent

/**
 * The definition for the FormKitLibrary
 * @public
 */
export interface FormKitLibrary {
  [index: string]: FormKitType
}

/**
 * Each library definition includes these properties.
 * @public
 */
export interface FormKitType {
  type: string
  schema: FormKitSchemaNode[]
  alias?: string
}
