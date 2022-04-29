import { clone, extend } from '@formkit/utils'
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
  icons = wrapIconsToSchema(icons)

  return function iconPlugin(node: FormKitNode): void {
    // add required props to node
    addProps(node, ['iconPosition', 'iconSuffix', 'iconPrefix'])

    const iconPosition = node.props.iconPosition || 'prefix'
    const iconSchemaProps = getIconAttrsFromNode(node)

    // determine which icons to retrieve
    let inputIcons: Record<any, any> = {
      prefixIcon: !iconSchemaProps.iconPrefix && iconPosition === 'prefix'
        ? iconSchemaProps.icon
        : iconSchemaProps.iconPrefix,
      suffixIcon: !iconSchemaProps.iconSuffix && iconPosition === 'suffix'
        ? iconSchemaProps.icon
        : iconSchemaProps.iconSuffix
    }
    inputIcons = Object.keys(inputIcons).reduce((collectedIcons, key) => {
      if (inputIcons[key]) {
        collectedIcons[key] = inputIcons[key]
      }
      return collectedIcons
    }, {} as Record<any, any>)

    if (!Object.keys(inputIcons).length) return // do nothing else if we have on icons

    Object.keys(inputIcons).forEach(iconKey => {
      let icon = icons[inputIcons[iconKey]] || inputIcons[iconKey]
      if (typeof icon === 'string') {
        if (!icon.startsWith('<svg')) {
          delete inputIcons[iconKey] // we do not have a matching icon and the provided icon string was not an SVG
          return
        }
        icon = wrapIconsToSchema({ inlineSvg: icon }).inlineSvg
      }

      if (node.props.definition) {
        const cloneDefinition = clone(node.props.definition)
        if (typeof cloneDefinition.schema === 'function') {
          const targetPosition = iconKey === 'prefixIcon' ? 'prefix' : 'suffix'
          const originalSchema = cloneDefinition.schema
          cloneDefinition.schema = (extensions: Record<string, any>) => {
            const clonedIcon = clone(icon)
            clonedIcon.attrs.class = `$classes.${targetPosition} + ' ' +` + clonedIcon.attrs.class
            extensions[targetPosition] = extend(clonedIcon, extensions[targetPosition] || {})
            return originalSchema(extensions)
          }
        }
        node.props.definition = cloneDefinition
      }
    })
  }
}

/**
 * Given an object of icons, wraps all the markup in a FormKit provided <div>
 * @param icons - an object of icon names to svg definitions
 * @returns
 */
function wrapIconsToSchema(icons: Record<any, string>): Record<any, Record<any, any>> {
  return Object.keys(icons).reduce((wrappedIcons, key) => {
    wrappedIcons[key] = {
      $el: 'div',
      attrs: {
        class: '$classes.icon',
        'data-icon': key,
        innerHTML: icons[key]
      },
    }
    return wrappedIcons
  }, {} as Record<any, any>)
}

/**
 * Inspects a node for applicable icon props and returns any matches
 * @param node - the node currently being operated on
 * @returns
 */
function getIconAttrsFromNode(node: FormKitNode): Record<any, any> {
  const attrs = node && node.context ? node.context.attrs : {}
  const targetAttrs: Record<any, any> = {
    icon: attrs.icon,
    iconPrefix: attrs['icon-prefix'],
    iconSuffix: attrs['icon-suffix']
  }
  return Object.keys(targetAttrs).reduce((matchingAttrs, key) => {
    if (targetAttrs[key] !== undefined) {
      matchingAttrs[key] = targetAttrs[key]
    }
    return matchingAttrs
  }, {} as Record<any, any>)
}

/**
 * Takes an array of prop names and updates a nodes definitions to include them
 * @param node - the FormKit node to add props to
 * @param props - an array of prop names to be added
 */
function addProps(node: FormKitNode, props: string[]): void {
  if (node.props.definition) {
    const cloneDefinition = clone(node.props.definition)
    if (Array.isArray(cloneDefinition.props)) {
      cloneDefinition.props.concat(props)
    } else {
      cloneDefinition.props = props
    }
    node.props.definition = cloneDefinition
  }
}
