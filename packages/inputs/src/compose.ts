import { extend, isObject, token } from '@formkit/utils'
import type {
  FormKitExtendableSchemaRoot,
  FormKitSchemaAttributes,
  FormKitSchemaNode,
  FormKitSchemaCondition,
  FormKitSchemaDefinition,
  FormKitSchemaComponent,
  FormKitSchemaDOMNode,
  FormKitSectionsSchema,
} from '@formkit/core'
import { isComponent, isDOM, isConditional, warn } from '@formkit/core'
import type {
  FormKitSection,
  FormKitSchemaExtendableSection,
} from './createSection'
import { isSchemaObject, extendSchema, createRoot } from './createSection'
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
  icon,
} from './sections'
import { resetRadio } from './features/renamesRadios'

/**
 * Either a schema node, or a function that returns a schema node.
 *
 * @public
 */
export type FormKitInputSchema =
  | ((children?: FormKitSchemaDefinition) => FormKitSchemaNode)
  | FormKitSchemaNode

/**
 * A type narrowed type that represents a formkit schema "section". These are
 * always in the shape:
 * ```js
 * {
 *   if: string,
 *   then: '$slots.sectionName',
 *   else: {
 *    meta: {
 *      section: 'sectionName'
 *    },
 *    $el: 'div' // or $cmp...
 *   }
 * }
 * ```
 *
 * @public
 */
export type FormKitSchemaSection = FormKitSchemaCondition & {
  else:
    | FormKitSchemaDOMNode
    | (FormKitSchemaComponent & { meta: { section: string } })
}

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
/*@__NO_SIDE_EFFECTS__*/
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
 * Finds a section by name in a schema.
 *
 * @param schema - A {@link @formkit/core#FormKitSchemaDefinition | FormKitSchemaDefinition} array.
 * @param target - The name of the section to find.
 *
 * @returns a tuple of the schema and the section or a tuple of `false` and `false` if not found.
 *
 * @public
 */
/*@__NO_SIDE_EFFECTS__*/
export function findSection(
  schema: FormKitSchemaDefinition,
  target: string
):
  | [false, false]
  | [
      FormKitSchemaNode[] | FormKitSchemaCondition | false | undefined,
      FormKitSchemaCondition
    ] {
  return (
    eachSection(
      schema,
      (section, sectionCondition, parent) => {
        if (section.meta?.section === target) {
          return [parent, sectionCondition]
        }
        return
      },
      true
    ) ?? [false, false]
  )
}

/**
 * Runs a callback over every section in a schema. if stopOnCallbackReturn is true
 * and the callback returns a value, the iteration will stop and return that value.
 *
 * @param schema - A {@link @formkit/core#FormKitSchemaNode | FormKitSchemaNode} array.
 * @param callback - A callback to run on every section.
 * @param stopOnCallbackReturn - If true, the loop will stop if the callback returns a value.
 * @param schemaParent - The parent of the current schema node.
 *
 * @returns
 *
 * @public
 */
export function eachSection<T>(
  schema: FormKitSchemaDefinition,
  callback: (
    section: FormKitSchemaComponent | FormKitSchemaDOMNode,
    sectionConditional: FormKitSchemaCondition,
    sectionParent: FormKitSchemaNode[] | FormKitSchemaCondition | undefined
  ) => T,
  stopOnCallbackReturn = false,
  schemaParent?: FormKitSchemaNode[] | FormKitSchemaCondition
): T | void {
  if (Array.isArray(schema)) {
    for (const node of schema) {
      const callbackReturn = eachSection(
        node,
        callback,
        stopOnCallbackReturn,
        schema
      )
      if (callbackReturn && stopOnCallbackReturn) {
        return callbackReturn
      }
    }
    return
  }
  if (isSection(schema)) {
    const callbackReturn = callback(schema.else, schema, schemaParent)
    if (callbackReturn && stopOnCallbackReturn) {
      return callbackReturn
    }
    return eachSection(schema.else, callback, stopOnCallbackReturn, schema)
  } else if ((isComponent(schema) || isDOM(schema)) && schema.children) {
    return eachSection(
      schema.children as FormKitSchemaNode,
      callback,
      stopOnCallbackReturn
    )
  } else if (isConditional(schema)) {
    let callbackReturn: T | void = undefined

    if (schema.then && typeof schema.then !== 'string') {
      callbackReturn = eachSection(
        schema.then,
        callback,
        stopOnCallbackReturn,
        schema
      )
    }

    if (!callbackReturn && schema.else && typeof schema.else !== 'string') {
      callbackReturn = eachSection(
        schema.else,
        callback,
        stopOnCallbackReturn,
        schema
      )
    }

    if (callbackReturn && stopOnCallbackReturn) {
      return callbackReturn
    }
  }
}

/**
 * Check if a schema node is conditional, has an else clause, and that else
 * clause contains a section in the meta.
 * @param section - A schema node to check.
 * @public
 */
function isSection(
  section: FormKitSchemaNode
): section is FormKitSchemaSection {
  if (
    isConditional(section) &&
    typeof section.then === 'string' &&
    section.else &&
    typeof section.else !== 'string' &&
    !Array.isArray(section.else) &&
    !isConditional(section.else) &&
    section.else.meta?.section
  ) {
    return true
  }
  return false
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
/*@__NO_SIDE_EFFECTS__*/
export function useSchema(
  inputSection: FormKitSection,
  sectionsSchema: FormKitSectionsSchema = {}
): FormKitSchemaExtendableSection {
  const schema = outer(
    wrapper(
      label('$label'),
      inner(icon('prefix'), prefix(), inputSection(), suffix(), icon('suffix'))
    ),
    help('$help'),
    messages(message('$message.value'))
  )
  return (propSectionsSchema: FormKitSectionsSchema = {}) =>
    schema(extend(sectionsSchema, propSectionsSchema) as FormKitSectionsSchema)
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
/*@__NO_SIDE_EFFECTS__*/
export function $attrs(
  attrs: FormKitSchemaAttributes | (() => FormKitSchemaAttributes),
  section: FormKitSchemaExtendableSection
): FormKitSchemaExtendableSection {
  const extendable = (extensions: FormKitSectionsSchema) => {
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
/*@__NO_SIDE_EFFECTS__*/
export function $if(
  condition: string,
  then: FormKitSchemaExtendableSection,
  otherwise?: FormKitSchemaExtendableSection
): FormKitSchemaExtendableSection {
  const extendable = (extensions: FormKitSectionsSchema) => {
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
/*@__NO_SIDE_EFFECTS__*/
export function $for(
  varName: string,
  inName: string,
  section: FormKitSchemaExtendableSection
) {
  return (extensions: FormKitSectionsSchema): FormKitSchemaNode => {
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
/*@__NO_SIDE_EFFECTS__*/
export function $extend(
  section: FormKitSchemaExtendableSection,
  extendWith: Partial<FormKitSchemaNode>
): FormKitSchemaExtendableSection {
  const extendable = (extensions: FormKitSectionsSchema) => {
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
/*@__NO_SIDE_EFFECTS__*/
export function $root(
  section: FormKitSchemaExtendableSection
): FormKitExtendableSchemaRoot {
  warn(800, '$root')
  return createRoot(section)
}

export function resetCounts() {
  resetRadio()
}

export * from './features'
export * from './sections'
