import { camel, extend, has } from '@formkit/utils'
import { FormKitLibrary, FormKitPlugin, FormKitNode } from '@formkit/core'

/**
 *
 * @param libraries - One or many formkit urls.
 *
 * @returns {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
export function createLibraryPlugin(
  ...libraries: FormKitLibrary[]
): FormKitPlugin {
  /**
   * Merge all provided library items.
   */
  const library = libraries.reduce(
    (merged, lib) => extend(merged, lib) as FormKitLibrary,
    {} as FormKitLibrary
  )
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  const plugin = () => {}
  /**
   * Enables the hook that exposes all library inputs.
   * @param node - The primary plugin
   */
  plugin.library = function (node: FormKitNode) {
    const type = camel(node.props.type)
    if (has(library, type)) {
      node.define(library[type])
    }
  }
  return plugin
}
