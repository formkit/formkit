import {
  FormKitTypeDefinition,
  FormKitSchemaNode,
  FormKitSectionsSchema,
} from '@formkit/core'
import { cloneAny } from '@formkit/utils'
import { createSection, FormKitSection, useSchema } from '@formkit/inputs'
import type { ComponentType } from 'react'

let totalCreated = 1

function isComponent(obj: any): obj is ComponentType<any> {
  return (
    typeof obj === 'function' ||
    (typeof obj === 'object' &&
      !Array.isArray(obj) &&
      !('$el' in obj) &&
      !('$cmp' in obj) &&
      !('if' in obj))
  )
}

export function createInput<V = unknown>(
  schemaOrComponent: FormKitSchemaNode | FormKitSection | ComponentType<any>,
  definitionOptions: Partial<FormKitTypeDefinition<V>> = {},
  sectionsSchema: FormKitSectionsSchema = {}
): FormKitTypeDefinition<V> {
  const definition: FormKitTypeDefinition<V> = {
    type: 'input',
    ...definitionOptions,
  }

  let schema: FormKitSection

  if (isComponent(schemaOrComponent)) {
    const cmpName = `SchemaComponent${totalCreated++}`
    schema = createSection('input', () => ({
      $cmp: cmpName,
      props: {
        context: '$node.context',
      },
    }))
    definition.library = { [cmpName]: schemaOrComponent }
  } else if (typeof schemaOrComponent === 'function') {
    schema = schemaOrComponent
  } else {
    schema = createSection('input', () => cloneAny(schemaOrComponent))
  }

  definition.schema = useSchema(schema || 'Schema undefined', sectionsSchema)
  if (!definition.schemaMemoKey) {
    definition.schemaMemoKey = `${Math.random()}`
  }
  return definition
}
