/**
 * The official FormKit inputs plugin. This package contains the source code for all native HTML input types.
 * Read the inputs documentation for usage instructions.
 */

/**
 * Export the plugin.
 */
export { createLibraryPlugin } from './plugin'

/**
 * Helper function for normalizing options.
 */
export { normalizeOptions } from './features/options'

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
 * Export individual input types.
 */
export * from './inputs'

/**
 * Export again as group.
 */
import * as inputs from './inputs'
export { inputs }
