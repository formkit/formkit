import { FormKitNodeType } from '@formkit/core'
import { FormKitSchemaNode, FormKitSchemaCondition } from '@formkit/schema'
import * as library from './types'

/**
 * Definition of a library item — when registering a new library item, these
 * are the required and available properties.
 * @public
 */
export type FormKitTypeDefinition = {
  type: FormKitNodeType
  schema: FormKitSchemaNode[] | FormKitSchemaCondition
}

/**
 * The full library of available FormKit inputs.
 * @public
 */
export interface FormKitLibrary {
  [index: string]: FormKitTypeDefinition
}

/**
 * Export the entire library as a single object.
 */
export { library }

/**
 * Export individual input types.
 */
export * from './types'
