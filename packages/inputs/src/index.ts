import * as inputs from './inputs'

/**
 * Export the entire input library as a single object.
 */
export { inputs }

/**
 * Export individual input types.
 */
export * from './inputs'

/**
 * Export the plugin.
 */
export { createLibraryPlugin } from './plugin'

/**
 * Export the localize.
 */
export { default as localize } from './features/localize'

/**
 * Options types.
 */
export { FormKitOptionsList } from './features/options'

/**
 * Composable logic.
 */
export {
  createSection,
  useSchema,
  extendSchema,
  composable,
  $if,
  $for,
  $attrs,
  $extend,
  FormKitInputSchema,
  FormKitSchemaExtendableSection,
  FormKitSection,
} from './compose'

/**
 * All features, must maintain namespace clearance
 */
export * from './features'

/**
 * Exports all sections.
 */
export * from './sections'

/**
 * A single file object in FormKit’s synthetic "FileList".
 * @public
 */
export interface FormKitFile {
  name: string
  file?: File
}

/**
 * A synthetic array-based "FileList".
 * @public
 */
export type FormKitFileValue = FormKitFile[]
