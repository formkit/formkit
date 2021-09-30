import { FormKitTypeDefinition } from './index'
import textSchema from './classifications/text'
import groupSchema from './classifications/group'

/**
 * Default classifications that are available.
 */
const textClassification: FormKitTypeDefinition = {
  type: 'input',
  schema: textSchema,
}

/**
 * The text input.
 * @public
 */
export const text = textClassification

/**
 * The number input.
 * @public
 */
export const number = textClassification

/**
 * The group input type.
 * @public
 */
export const group = {
  type: 'group',
  schema: groupSchema,
}
