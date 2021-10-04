import { minConfig, configSymbol } from '../plugin'
import { inject } from 'vue'
import { FormKitTypeDefinition } from '@formkit/inputs'
import { has } from '@formkit/utils'

/**
 * Retrieves a given input definition from the vue plugin configuration.
 * @param type - The input type ("text", "select" etc..)
 * @returns
 */
export function useLibrary(type: string): FormKitTypeDefinition {
  // Extract the library here
  const config = inject(configSymbol, minConfig)
  const library = (config && config.library) || {}
  if (has(library, type)) {
    return library[type]
  }
  throw new Error(`Input “${type}” is not in the library.`)
}
