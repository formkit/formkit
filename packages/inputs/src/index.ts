/**
 * Export the plugin.
 */
export { createLibraryPlugin } from './plugin'

/**
 * Options types.
 */
export { FormKitOptionsList } from './features/options'

/**
 * Composable logic.
 */
export * from './compose'

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

/**
 * Export individual input types.
 */
export * from './inputs'

/**
 * Export again as group.
 */
import * as inputs from './inputs'
export { inputs }
