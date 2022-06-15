import { FormKitNode } from '@formkit/core'

/**
 * @param node - The node
 * @public
 */
export default function defaultIcon(sectionKey: string, defaultIcon: string) {
  return (node: FormKitNode): void => {
    if (node.props[`${sectionKey}Icon`] === undefined) {
      node.props[`${sectionKey}Icon`] = defaultIcon
    }
  }
}
