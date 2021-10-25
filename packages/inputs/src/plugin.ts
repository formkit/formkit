import { has } from '@formkit/utils'
import { FormKitPlugin } from '@formkit/core'
import { FormKitLibrary } from './index'

export const createLibrary = function createLibrary(
  library: FormKitLibrary
): FormKitPlugin {
  const plugin = (node) => {
    if (has(library, node.props.type)) {
      node.define(library[node.props.type])
    }
  }
  return plugin
}
