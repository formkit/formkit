import { FormKitTypeDefinition } from './index'
import textSchema from './classifications/text'
import groupSchema from './classifications/group'
import selectSchema from './classifications/select'

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
export const select: FormKitTypeDefinition = {
  type: 'input',
  schema: selectSchema,
}

/**
 * The group input type.
 * @public
 */
export const group: FormKitTypeDefinition = {
  type: 'group',
  schema: groupSchema,
}

/**
 * The group input type.
 * @public
 */
export const form: FormKitTypeDefinition = {
  type: 'group',
  schema: groupSchema,
}
