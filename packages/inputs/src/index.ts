/**
 * The official FormKit Inputs plugin. This package contains the source code for
 * all native HTML input types. Read the
 * {@link https://formkit.com/essentials/inputs | inputs documentation} for
 * usage instructions.
 *
 * @packageDocumentation
 */
import { FormKitLibrary } from '@formkit/core'

/**
 * Export the plugin.
 */
export { createLibraryPlugin } from './plugin'

/**
 * Helper function for normalizing options.
 */
export { normalizeOptions } from './features/options'

/**
 * createSection() and related utilities.
 */
export {
  FormKitSchemaExtendableSection,
  FormKitSection,
  createSection,
  isSchemaObject,
  extendSchema,
} from './createSection'

/**
 * Composable logic.
 */
export * from './compose'

/**
 * Prop types.
 */
export * from './props'

/**
 * A single file object in FormKit’s synthetic "FileList".
 *
 * @public
 */
export interface FormKitFile {
  name: string
  file?: File
}

/**
 * A synthetic array-based "FileList".
 *
 * @public
 */
export type FormKitFileValue = FormKitFile[]

/**
 * Export again as group.
 */
import { button } from './inputs/button'
import { button as submit } from './inputs/button'
import { checkbox } from './inputs/checkbox'
import { file } from './inputs/file'
import { form } from './inputs/form'
import { group } from './inputs/group'
import { hidden } from './inputs/hidden'
import { list } from './inputs/list'
import { meta } from './inputs/meta'
import { radio } from './inputs/radio'
import { select } from './inputs/select'
import { textarea } from './inputs/textarea'
import { text } from './inputs/text'
import { text as color } from './inputs/text'
import { text as date } from './inputs/text'
import { text as datetimeLocal } from './inputs/text'
import { text as email } from './inputs/text'
import { text as month } from './inputs/text'
import { text as number } from './inputs/text'
import { text as password } from './inputs/text'
import { text as search } from './inputs/text'
import { text as tel } from './inputs/text'
import { text as time } from './inputs/text'
import { text as url } from './inputs/text'
import { text as week } from './inputs/text'
import { text as range } from './inputs/text'

export {
  button,
  submit,
  checkbox,
  file,
  form,
  group,
  hidden,
  list,
  meta,
  radio,
  select,
  textarea,
  text,
  color,
  date,
  datetimeLocal,
  email,
  month,
  number,
  password,
  search,
  tel,
  time,
  url,
  week,
  range,
}

export const inputs: FormKitLibrary = {
  button,
  submit,
  checkbox,
  file,
  form,
  group,
  hidden,
  list,
  meta,
  radio,
  select,
  textarea,
  text,
  color,
  date,
  datetimeLocal,
  email,
  month,
  number,
  password,
  search,
  tel,
  time,
  url,
  week,
  range,
}
