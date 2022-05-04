import { extend } from '@formkit/utils'
import { FormKitNode } from '@formkit/core'

/** TODO
 * [x] Have global config option for default icon placement, prefix (default) or suffix
 * [] take IconSchemaProps and turn them into props on the node
 * [x] check if we have 1 or 2 icons
 * [x] modify the schema for the icon(s)
 * [] allow for defining a click handler for the icon(s) and pass along context for which type was clicked (prefix or suffix)
 */

/**
 * The icon plugin function, everything must be bootstrapped here.
 * @param node - The node to apply icons to.
 * @public
 */
export function createIconPlugin(icons: Record<any, any>): (node: FormKitNode) => void {
  return function iconPlugin(node: FormKitNode): void {
    node.addProps(['icon', 'iconSuffix', 'iconPrefix'])
    const iconPosition = node.props.iconPosition || 'prefix'

    // determine which icons to retrieve
    let inputIcons: Record<any, any> = {
      prefixIcon: !node.props.iconPrefix && iconPosition === 'prefix'
        ? node.props.icon
        : node.props.iconPrefix,
      suffixIcon: !node.props.iconSuffix && iconPosition === 'suffix'
        ? node.props.icon
        : node.props.iconSuffix
    }
    inputIcons = Object.keys(inputIcons).reduce((collectedIcons, key) => {
      if (inputIcons[key]) {
        collectedIcons[key] = inputIcons[key]
      }
      return collectedIcons
    }, {} as Record<any, any>)

    if (!Object.keys(inputIcons).length) return // do nothing else if we have on icons

    Object.keys(inputIcons).forEach(iconKey => {
      if (!icons[inputIcons[iconKey]] && !inputIcons[iconKey].startsWith('<svg')) return
      if (node.props.definition) {
        const definition = node.props.definition
        if (typeof definition.schema === 'function') {
          const targetPosition = iconKey === 'prefixIcon' ? 'prefix' : 'suffix'
          const originalSchema = definition.schema

          // add target icon to node context
          if (node && node.context) {
            if (inputIcons[iconKey].startsWith('<svg')) {
              node.context[iconKey] = inputIcons[iconKey]
              node.context[`${iconKey}Name`] = 'inlineIcon'
            } else {
              node.context[iconKey] = icons[inputIcons[iconKey]]
              node.context[`${iconKey}Name`] = inputIcons[iconKey]
            }
          }

          definition.schema = (extensions: Record<string, any>) => {
            extensions[targetPosition] = extend({
              $el: 'div',
              attrs: {
                class: `formkit-${targetPosition} formkit-icon`,
                'data-icon': `$${iconKey}Name`,
                innerHTML: `$${iconKey}`
              },
            }, extensions[targetPosition] || {})
            return originalSchema(extensions)
          }
        }
      }
    })
  }
}
