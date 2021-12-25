import {
  FormKitExtendableSchemaRoot,
  FormKitSchemaComposable,
  FormKitSchemaNode,
  FormKitSchemaDOMNode,
  FormKitSchemaComponent,
  FormKitSchemaFormKit,
} from '@formkit/core'
import { clone, extend } from '@formkit/utils'
import label from './composables/label'
import outer from './composables/outer'
import wrapper from './composables/wrapper'
import inner from './composables/inner'
import help from './composables/help'
import messages from './composables/messages'
import message from './composables/message'
import { FormKitSchemaCondition } from 'packages/core/src'

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
  schema:
    | ((
        children?: string | FormKitSchemaNode[] | FormKitSchemaCondition
      ) => FormKitSchemaNode)
    | FormKitSchemaNode
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
    return {
      if: `$slots.${key}`,
      then: `$slots.${key}`,
      else: [extendSchema(root, extendWith)],
    }
  }
}

/**
 * Creates a new input with the base schema still attached.
 * @param inputSchema - Content to store in the input composition key location.
 * @public
 */
export function createInput(
  inputSchema:
    | ((
        children?: string | FormKitSchemaNode[] | FormKitSchemaCondition
      ) => FormKitSchemaNode)
    | FormKitSchemaNode
): FormKitExtendableSchemaRoot {
  return (extensions = {}) => [
    outer(extensions.outer, [
      wrapper(extensions.wrapper, [
        label(extensions.label, '$label'),
        inner(extensions.inner, [
          composable('input', inputSchema)(extensions.input),
        ]),
      ]),
      help(extensions.help, '$help'),
      messages(extensions.messages, [
        message(extensions.message, '$message.value'),
      ]),
    ]),
  ]
}
