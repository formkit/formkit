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
  FormKitInputSchema,
  FormKitSchemaExtendableSection,
  FormKitSection,
} from './compose'

/**
 * Export the features of the inputs for third party use (#188):
 * Note: As of TS 4.5.5:
 * export * as features from './features' syntax
 * Is not yet supported.
 */
export { default as features } from './features'

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
