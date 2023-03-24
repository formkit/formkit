import { clone, isObject, token } from '@formkit/utils'
import {
  FormKitExtendableSchemaRoot,
  FormKitSchemaAttributes,
  FormKitSchemaNode,
  FormKitSchemaDOMNode,
  FormKitSchemaComponent,
  FormKitSchemaFormKit,
  FormKitSchemaCondition,
  FormKitSchemaComposable,
  isComponent,
  isDOM,
  isConditional,
  warn,
} from '@formkit/core'
import {
  isSchemaObject,
  extendSchema,
  FormKitSection,
  FormKitSchemaExtendableSection,
  createRoot,
} from './createSection'
import {
  outer,
  wrapper,
  prefix,
  suffix,
  label,
  inner,
  messages,
  message,
  help,
} from './sections'

/**
 * Either a schema node, or a function that returns a schema node.
 *
 * @public
 */
export type FormKitInputSchema =
  | ((
      children?: string | FormKitSchemaNode[] | FormKitSchemaCondition
    ) => FormKitSchemaNode)
  | FormKitSchemaNode

/**
 * Checks if the current schema node is a slot condition.
 *
 * @example
 *
 * ```js
 * {
 *  if: '$slot.name',
 *  then: '$slot.name',
 *  else: []
 * } // this schema node would return true.
 * ```
 *
 * @param node - A {@link @formkit/core#FormKitSchemaNode | FormKitSchemaNode}.
 *
 * @returns `boolean`
 *
 * @public
 */
export function isSlotCondition(node: FormKitSchemaNode): node is {
  if: string
  then: string
  else: FormKitSchemaNode | FormKitSchemaNode[]
} {
  if (
    isConditional(node) &&
    node.if &&
    node.if.startsWith('$slots.') &&
    typeof node.then === 'string' &&
    node.then.startsWith('$slots.') &&
    'else' in node
  ) {
    return true
  }
  return false
}

/**
 * Finds a seciton by name in a schema.
 *
 * @param schema - A {@link @formkit/core#FormKitSchemaNode | FormKitSchemaNode} array.
 * @param target - The name of the section to find.
 *
 * @returns a tuple of the schema and the section or a tuple of `false` and `false` if not found.
 *
 * @public
 */
export function findSection(
  schema: FormKitSchemaNode[],
  target: string
): [false, false] | [FormKitSchemaNode[], FormKitSchemaCondition] {
  for (let index = 0; index < schema.length; index++) {
    const section = schema[index]
    if (isSlotCondition(section)) {
      if (isComponent(section.else) || isDOM(section.else)) {
        if (section.else.meta?.section === target) {
          return [schema, section]
        } else if (
          section.else.children &&
          Array.isArray(section.else.children) &&
          section.else.children.length
        ) {
          const found = findSection(section.else.children, target)
          if (found[0]) {
            return found
          }
        }
      }
    }
  }
  return [false, false]
}

/**
 * @deprecated This function is deprecated. Use `createSection` instead!
 *
 * @param key - A new section key name.
 * @param schema - The default schema in this composable slot.
 *
 * @returns {@link @formkit/core#FormKitSchemaComposable | FormKitSchemaComposable}
 *
 * @public
 */
export function composable(
  key: string,
  schema: FormKitInputSchema
): FormKitSchemaComposable {
  warn(800, 'composable function')
  return (extendWith = {}, children = undefined) => {
    const root =
      typeof schema === 'function'
        ? schema(children)
        : typeof schema === 'object'
        ? (clone(schema as Record<string, unknown>) as
            | FormKitSchemaDOMNode
            | FormKitSchemaComponent
            | FormKitSchemaFormKit
            | FormKitSchemaCondition)
        : schema
    const isObj = isSchemaObject(root)
    if (isObj && !('children' in root) && children) {
      if (Array.isArray(children)) {
        if (children.length) {
          root.children = children
        }
      } else {
        root.children = [children]
      }
    }
    const extended = extendSchema(root, extendWith)
    return {
      if: `$slots.${key}`,
      then: `$slots.${key}`,
      else: Array.isArray(extended) ? extended : [extended],
    }
  }
}

/**
 * Creates an input schema with all of the wrapping base schema.
 *
 * @param inputSection - Content to store in the input section key location.
 *
 * @returns {@link @formkit/core#FormKitExtendableSchemaRoot | FormKitExtendableSchemaRoot}
 *
 * @public
 */
export function useSchema(
  inputSection: FormKitSection
): FormKitExtendableSchemaRoot {
  return outer(
    wrapper(label('$label'), inner(prefix(), inputSection(), suffix())),
    help('$help'),
    messages(message('$message.value'))
  )
}

// ========================================================

/**
 * Applies attributes to a given schema section by applying a higher order
 * function that merges a given set of attributes into the node.
 *
 * @param attrs - Attributes to apply to a {@link FormKitSchemaExtendableSection
 * | FormKitSchemaExtendableSection}.
 * @param section - A section to apply attributes to.
 *
 * @returns {@link FormKitSchemaExtendableSection | FormKitSchemaExtendableSection}
 *
 * @public
 */
export function $attrs(
  attrs: FormKitSchemaAttributes | (() => FormKitSchemaAttributes),
  section: FormKitSchemaExtendableSection
): FormKitSchemaExtendableSection {
  const extendable = (
    extensions: Record<string, Partial<FormKitSchemaNode>>
  ) => {
    const node = section(extensions)
    const attributes = typeof attrs === 'function' ? attrs() : attrs
    if (!isObject(attributes)) return node
    if (isSlotCondition(node) && isDOM(node.else)) {
      node.else.attrs = { ...node.else.attrs, ...attributes }
    } else if (isDOM(node)) {
      node.attrs = { ...node.attrs, ...attributes }
    }
    return node
  }
  extendable._s = section._s
  return extendable
}

/**
 * Applies a condition to a given schema section.
 *
 * @param condition - A schema condition to apply to a section.
 * @param then - The section that applies if the condition is true.
 * @param otherwise - (else) The section that applies if the condition is false.
 *
 * @returns {@link FormKitSchemaExtendableSection | FormKitSchemaExtendableSection}
 *
 * @public
 */
export function $if(
  condition: string,
  then: FormKitSchemaExtendableSection,
  otherwise?: FormKitSchemaExtendableSection
): FormKitSchemaExtendableSection {
  const extendable = (
    extensions: Record<string, Partial<FormKitSchemaNode>>
  ) => {
    const node = then(extensions)
    if (
      otherwise ||
      (isSchemaObject(node) && 'if' in node) ||
      isSlotCondition(node)
    ) {
      const conditionalNode: FormKitSchemaCondition = {
        if: condition,
        then: node,
      }
      if (otherwise) {
        conditionalNode.else = otherwise(extensions)
      }
      return conditionalNode
    } else if (isSlotCondition(node)) {
      Object.assign(node.else, { if: condition })
    } else if (isSchemaObject(node)) {
      Object.assign(node, { if: condition })
    }
    return node
  }
  extendable._s = token()
  return extendable
}

/**
 * Applies a condition to a given schema section.
 *
 * @param varName - The name of the variable that holds the current instance.
 * @param inName - The variable we are iterating over.
 * @param section - A section to repeat.
 *
 * @returns {@link FormKitSchemaExtendableSection | FormKitSchemaExtendableSection}
 *
 * @public
 */
export function $for(
  varName: string,
  inName: string,
  section: FormKitSchemaExtendableSection
) {
  return (
    extensions: Record<string, Partial<FormKitSchemaNode>>
  ): FormKitSchemaNode => {
    const node = section(extensions)
    if (isSlotCondition(node)) {
      Object.assign(node.else, { for: [varName, inName] })
    } else if (isSchemaObject(node)) {
      Object.assign(node, { for: [varName, inName] })
    }
    return node
  }
}

/**
 * Extends a schema node with a given set of extensions.
 *
 * @param section - A section to apply an extension to.
 * @param extendWith - A partial schema snippet to apply to the section.
 *
 * @returns {@link FormKitSchemaExtendableSection | FormKitSchemaExtendableSection}
 *
 * @public
 */
export function $extend(
  section: FormKitSchemaExtendableSection,
  extendWith: Partial<FormKitSchemaNode>
): FormKitSchemaExtendableSection {
  const extendable = (
    extensions: Record<string, Partial<FormKitSchemaNode>>
  ) => {
    const node = section({})
    if (isSlotCondition(node)) {
      if (Array.isArray(node.else)) return node
      node.else = extendSchema(
        extendSchema(node.else, extendWith),
        section._s ? extensions[section._s] : {}
      )
      return node
    }
    return extendSchema(
      extendSchema(node, extendWith),
      section._s ? extensions[section._s] : {}
    )
  }
  extendable._s = section._s
  return extendable
}

/**
 * Creates a root schema section.
 *
 * @param section - A section to make a root from.
 *
 * @returns {@link FormKitSchemaExtendableSection | FormKitSchemaExtendableSection}
 *
 * @public
 */
export function $root(
  section: FormKitSchemaExtendableSection
): FormKitExtendableSchemaRoot {
  return createRoot(section)
}

export * from './features'
export * from './sections'
