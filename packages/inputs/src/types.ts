import { FormKitTypeDefinition } from '@formkit/core'
import textSchema from './classifications/text'
import hiddenSchema from './classifications/hidden'
import groupSchema from './classifications/group'
import listSchema from './classifications/list'
import selectSchema from './classifications/select'
import boxSchema from './classifications/box'
import formatsOptions from './features/options'
import selectFeatures from './features/select'
import multiSelect from './features/checkboxes'
/**
 * Default classifications that are available.
 */
const textClassification: FormKitTypeDefinition = {
  type: 'input',
  schema: textSchema,
}

/**
 * The color input.
 * @public
 */
export const color = textClassification

/**
 * The date input.
 * @public
 */
export const date = textClassification

/**
 * The datetime-local input.
 * @public
 */
export const datetimeLocal = textClassification

/**
 * The email input.
 * @public
 */
export const email = textClassification

/**
 * The month input.
 * @public
 */
export const month = textClassification

/**
 * The number input.
 * @public
 */
export const number = textClassification

/**
 * The password input.
 * @public
 */
export const password = textClassification

/**
 * The search input.
 * @public
 */
export const search = textClassification

/**
 * The tel input.
 * @public
 */
export const tel = textClassification

/**
 * The time input.
 * @public
 */
export const time = textClassification

/**
 * The text input.
 * @public
 */
export const text = textClassification

/**
 * The url input.
 * @public
 */
export const url = textClassification

/**
 * The week input.
 * @public
 */
export const week = textClassification

/**
 * The hidden input.
 * @public
 */
export const hidden: FormKitTypeDefinition = {
  type: 'input',
  schema: hiddenSchema,
}

/**
 * The group input type.
 * @public
 */
export const select: FormKitTypeDefinition = {
  type: 'input',
  schema: selectSchema,
  props: ['options', 'placeholder'],
  features: [formatsOptions, selectFeatures],
}

/**
 * The checkbox input type.
 * @public
 */
export const checkbox: FormKitTypeDefinition = {
  type: 'input',
  schema: boxSchema,
  props: ['options'],
  features: [formatsOptions, multiSelect],
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

/**
 * The group input type.
 * @public
 */
export const list: FormKitTypeDefinition = {
  type: 'list',
  schema: listSchema,
}
