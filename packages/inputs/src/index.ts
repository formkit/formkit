/**
 * Export the plugin.
 */
export { createLibraryPlugin } from './plugin'

/**
 * Helper function for normalizing options.
 * @internal
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
