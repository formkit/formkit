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
 * Options types.
 */
export { FormKitOptionsList } from './features/options'

/**
 * Composable logic.
 */
export {
  composable,
  useSchema,
  extendSchema,
  FormKitInputSchema,
} from './compose'
