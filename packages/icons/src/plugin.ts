import type { FormKitNode } from '@formkit/core'

/**
 * The icon plugin function, everything must be bootstrapped here.
 *
 * @param node - The node to apply icons to.
 *
 * @public
 */
export function createIconPlugin(
  icons: Record<any, string>
): (node: FormKitNode) => void {
  wrapIcons(icons)

  return function iconPlugin(node: FormKitNode): void {
    const iconSchemaProps = getIconPropsFromNode(node)
    if (!Object.keys(iconSchemaProps).length) return // do nothing else if we have on matching props
    /** TODO
     * [] Have global config option for default icon placement, prefix (default) or suffix
     * [] take IconSchemaProps and turn them into props on the node
     * [] check if we have 1 or 2 icons
     * [] modify the schema for the icon(s)
     * [] allow for defining a click handler for the icon(s) and pass along context for which type was clicked (prefix or suffix)
     */
  }
}

/**
 * Given an object of icons, wraps all the markup in a FormKit provided <div>
 *
 * @param icons - an object of icon names to svg definitions
 *
 * @returns `Record<any, string>`
 */
function wrapIcons(icons: Record<any, string>): Record<any, string> {
  const wrappedIcons: Record<any, string> = {}
  Object.keys(icons).map((key) => {
    wrappedIcons[
      key
    ] = `<div class="formkit-icon" data-icon="${key}">${icons[key]}</div>`
  })
  return wrappedIcons
}

/**
 * Inspects a node for applicable icon props and returns any matches
 *
 * @param node - the node currently being operated on
 *
 * @returns `Record<any, any>`
 */
function getIconPropsFromNode(node: FormKitNode): Record<any, any> {
  const attrs = node && node.context ? node.context.attrs : {}
  const { icon, iconPrefix, iconSuffix } = attrs
  const targetAttrs: Record<any, any> = { icon, iconPrefix, iconSuffix }
  const matchingAttrs: Record<any, any> = {}
  Object.keys(targetAttrs).map((key) => {
    if (targetAttrs[key] !== undefined) {
      // TODO: this does move the data around but it does not persist
      node.props[key] = targetAttrs[key]
      delete node.props.attrs[key]
      matchingAttrs[key] = targetAttrs[key]
    }
  })
  return matchingAttrs
}
