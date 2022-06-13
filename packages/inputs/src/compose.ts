import {
  FormKitExtendableSchemaRoot,
  FormKitSchemaAttributes,
  FormKitSchemaComposable,
  FormKitSchemaNode,
  FormKitSchemaDOMNode,
  FormKitSchemaComponent,
  FormKitSchemaFormKit,
  FormKitSchemaCondition,
  isComponent,
  isDOM,
  isConditional,
} from '@formkit/core'
import { clone, extend, isObject } from '@formkit/utils'
import label from './composables/label'
import outer from './composables/outer'
import wrapper from './composables/wrapper'
import inner from './composables/inner'
import help from './composables/help'
import messages from './composables/messages'
import message from './composables/message'
import prefix from './composables/prefix'
import suffix from './composables/suffix'

/**
 * Either a schema node, or a function that returns a schema node.
 * @public
 */
export type FormKitInputSchema =
  | ((
      children?: string | FormKitSchemaNode[] | FormKitSchemaCondition
    ) => FormKitSchemaNode)
  | FormKitSchemaNode

/**
 * Type guard for schema objects.
 * @param schema - returns true if the node is a schema node but not a string or conditional.
 */
function isSchemaObject(
  schema: Partial<FormKitSchemaNode>
): schema is
  | FormKitSchemaDOMNode
  | FormKitSchemaComponent
  | FormKitSchemaFormKit {
  return (
    typeof schema === 'object' &&
    ('$el' in schema || '$cmp' in schema || '$formkit' in schema)
  )
}

/**
 * Checks if the current schema node is a slot condition like:
 * ```js
 * {
 *  if: '$slot.name',
 *  then: '$slot.name',
 *  else: []
 * }
 * ```
 * @param node - a schema node
 * @returns
 */
function isSlotCondition(node: FormKitSchemaNode): node is {
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
 * Extends a single schema node with an extension. The extension can be any partial node including strings.
 * @param schema - Extend a base schema node.
 * @param extension - The values to extend on the base schema node.
 * @returns
 * @public
 */
export function extendSchema(
  schema: FormKitSchemaNode,
  extension: Partial<FormKitSchemaNode> = {}
): FormKitSchemaNode {
  if (typeof schema === 'string') {
    return isSchemaObject(extension) || typeof extension === 'string'
      ? extension
      : schema
  } else if (Array.isArray(schema)) {
    return isSchemaObject(extension) ? extension : schema
  }
  return extend(schema, extension) as FormKitSchemaNode
}

/**
 * ================================================================
 * NOTE: This function is deprecated. Use `createSection` instead!
 * ================================================================
 *
 * @param key - A new section key name.
 * @param schema - The default schema in this composable slot.
 * @returns
 * @public
 */
export function composable(
  key: string,
  schema: FormKitInputSchema
): FormKitSchemaComposable {
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
 * @param inputSchema - Content to store in the input section key location.
 * @public
 */
export function useSchema(
  inputSchema: FormKitInputSchema
): FormKitExtendableSchemaRoot {
  return (extensions = {}) => {
    const input = composable('input', inputSchema)(extensions.input)
    return [
      outer(extensions.outer, [
        wrapper(extensions.wrapper, [
          label(extensions.label, '$label'),
          inner(extensions.inner, [
            prefix(extensions.prefix),
            ...(Array.isArray(input) ? input : [input]),
            suffix(extensions.suffix),
          ]),
        ]),
        help(extensions.help, '$help'),
        messages(extensions.messages, [
          message(extensions.message, '$message.value'),
        ]),
      ]),
    ]
  }
}

// ========================================================

/**
 * A function that is called with an extensions argument and returns a valid
 * schema node.
 */
export interface FormKitSchemaExtendableSection {
  (extensions: Record<string, Partial<FormKitSchemaNode>>): FormKitSchemaNode
}

/**
 * A function that when called, returns a function that can in turn be called
 * with an extension parameter.
 */
export interface FormKitSection<T = FormKitSchemaExtendableSection> {
  (...children: Array<FormKitSchemaExtendableSection | string>): T
}

/**
 * Creates a new reusable section.
 * @param section - A single section of schema
 * @param el - The element or a function that returns a schema node.
 * @returns
 * @public
 */
export function createSection(
  section: string,
  el: string | null | (() => FormKitSchemaNode),
  root: true
): FormKitSection<FormKitExtendableSchemaRoot>
export function createSection(
  section: string,
  el: string | null | (() => FormKitSchemaNode)
): FormKitSection<FormKitSchemaExtendableSection>
export function createSection(
  section: string,
  el: string | (() => FormKitSchemaNode),
  root: false
): FormKitSection<FormKitSchemaExtendableSection>
export function createSection(
  section: string,
  el: string | null | (() => FormKitSchemaNode),
  root = false
): FormKitSection<
  FormKitExtendableSchemaRoot | FormKitSchemaExtendableSection
> {
  return (...children: Array<FormKitSchemaExtendableSection | string>) => {
    const extendable = (
      extensions: Record<string, Partial<FormKitSchemaNode>>
    ) => {
      const node = !el || typeof el === 'string' ? { $el: el } : el()
      if (isDOM(node) || isComponent(node)) {
        if (!node.meta) {
          node.meta = { section }
        }
        if (children.length && !node.children) {
          node.children = [
            ...children.map((child) =>
              typeof child === 'string' ? child : child(extensions)
            ),
          ]
        }
        if (isDOM(node)) {
          node.attrs = {
            class: `$classes.${section}`,
            ...(node.attrs || {}),
          }
        }
      }
      return {
        if: `$slots.${section}`,
        then: `$slots.${section}`,
        else:
          section in extensions
            ? extendSchema(node, extensions[section])
            : node,
      }
    }
    return root ? createRoot(extendable) : extendable
  }
}

/**
 * Returns an extendable schema root node.
 * @param rootSection - Creates the root node.
 * @returns
 */
export function createRoot(
  rootSection: FormKitSchemaExtendableSection
): FormKitExtendableSchemaRoot {
  return (extensions: Record<string, Partial<FormKitSchemaNode>>) => {
    return [rootSection(extensions)]
  }
}

/**
 * Applies attributes to a given schema section by applying a higher order
 * function that merges a given set of attributes into the node.
 * @param attrs - Apply attributes to a FormKitSchemaExtendableSection
 * @param section - A section to apply attributes to
 * @returns
 */
export function $attrs(
  attrs: FormKitSchemaAttributes | (() => FormKitSchemaAttributes),
  section: FormKitSchemaExtendableSection
): FormKitSchemaExtendableSection {
  return (extensions: Record<string, Partial<FormKitSchemaNode>>) => {
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
}

/**
 *
 * @param condition - A schema condition to apply to a section.
 * @param then - The section that applies if the condition is true.
 * @param otherwise - (else) The section that applies if the condition is false.
 * @returns
 * @public
 */
export function $if(
  condition: string,
  then: FormKitSchemaExtendableSection,
  otherwise?: FormKitSchemaExtendableSection
): FormKitSchemaExtendableSection {
  return (extensions: Record<string, Partial<FormKitSchemaNode>>) => {
    const node = then(extensions)
    if (otherwise) {
      return {
        if: condition,
        then: node,
        else: otherwise(extensions),
      }
    } else if (isSlotCondition(node)) {
      Object.assign(node.else, { if: condition })
    } else if (isSchemaObject(node)) {
      Object.assign(node, { if: condition })
    }
    return node
  }
}

/**
 * Applies a condition to a given schema section.
 * @param varName - The name of the variable that holds the current instance.
 * @param inName - The variable we are iterating over.
 * @param section - A section to repeat
 * @returns
 */
export function $for(
  varName: string,
  inName: string,
  section: FormKitSchemaExtendableSection
) {
  return (extensions: Record<string, Partial<FormKitSchemaNode>>) => {
    const node = section(extensions)
    if (isSlotCondition(node)) {
      Object.assign(node.else, { for: `${varName} in ${inName}` })
    } else if (isSchemaObject(node)) {
      Object.assign(node, { for: `${varName} in ${inName}` })
    }
    return node
  }
}

/**
 * Extends a schema node with a given set of extensions.
 * @param section - A section to apply an extension to.
 * @param extendWith - A partial schema snippet to apply to the section.
 * @returns
 */
export function $extend(
  section: FormKitSchemaExtendableSection,
  extendWith: Partial<FormKitSchemaNode>
): FormKitSchemaExtendableSection {
  return (extensions: Record<string, Partial<FormKitSchemaNode>>) => {
    const node = section({})
    if (isSlotCondition(node)) {
      if (Array.isArray(node.else)) return node
      node.else = extendSchema(extendSchema(node.else, extendWith), extensions)
      return node
    }
    return extendSchema(extendSchema(node, extendWith), extensions)
  }
}

/**
 * Creates a root schema section.
 * @param section - A section to make a root from.
 * @returns
 */
export function $root(
  section: FormKitSchemaExtendableSection
): FormKitExtendableSchemaRoot {
  return createRoot(section)
}
