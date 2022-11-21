import type { FormKitNode } from '@formkit/core'

/**
 * @param sectionKey - the location the icon should be loaded
 * @param defaultIcon - the icon that should be loaded if a match is found in the user's CSS
 * @public
 */
export default function defaultIcon(sectionKey: string, defaultIcon: string) {
  return (node: FormKitNode): void => {
    if (node.props[`${sectionKey}Icon`] === undefined) {
      node.props[`${sectionKey}Icon`] = `default:${defaultIcon}`
    }
  }
}
