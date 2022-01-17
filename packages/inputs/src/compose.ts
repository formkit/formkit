import {
  FormKitExtendableSchemaRoot,
  FormKitSchemaComposable,
  FormKitSchemaNode,
  FormKitSchemaDOMNode,
  FormKitSchemaComponent,
  FormKitSchemaFormKit,
  FormKitSchemaCondition,
} from '@formkit/core'
import { clone, extend } from '@formkit/utils'
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
 * Creates a new composition key.
 *
 * @param key - A new composition key name.
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
 * @param inputSchema - Content to store in the input composition key location.
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
            suffix(extensions.prefix),
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
