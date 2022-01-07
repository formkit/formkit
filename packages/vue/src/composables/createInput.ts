import { FormKitTypeDefinition } from '@formkit/core'
import { FormKitInputSchema, useSchema } from '@formkit/inputs'
import { Component, markRaw } from 'vue'

let totalCreated = 1

/**
 * Determine if the given object is a vue component.
 *
 * @param obj - Object or function
 * @returns
 * @public
 */
function isComponent(obj: any): obj is Component {
  return (
    (typeof obj === 'function' && obj.length === 2) ||
    (typeof obj === 'object' &&
      !Array.isArray(obj) &&
      !('$el' in obj) &&
      !('$cmp' in obj) &&
      !('if' in obj))
  )
}

/**
 * Creates a new input from schema or a Vue component with the "standard"
 * FormKit features in place such as labels, help text, validation messages, and
 * class support.
 *
 * @param schemaOrComponent - The actual schema of the input.
 * @public
 */
export function createInput(
  schemaOrComponent: FormKitInputSchema | Component,
  definitionOptions: Partial<FormKitTypeDefinition> = {}
): FormKitTypeDefinition {
  const definition: FormKitTypeDefinition = {
    type: 'input',
    ...definitionOptions,
  }
  let schema: FormKitInputSchema | undefined = undefined
  if (isComponent(schemaOrComponent)) {
    const cmpName = `SchemaComponent${totalCreated++}`
    schema = () => ({
      $cmp: cmpName,
      props: {
        context: '$node.context',
      },
    })
    definition.library = { [cmpName]: markRaw(schemaOrComponent) }
  } else {
    schema = schemaOrComponent
  }

  // Use the default wrapping schema
  definition.schema = useSchema(schema || 'Schema undefined')
  return definition
}
