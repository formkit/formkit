import { extend } from '@formkit/utils'
import { FormKitNode, FormKitSchemaComponent } from '@formkit/core'

export const iconRegistry: Record<string, string> = {}

/**
 * The icon plugin function, everything must be bootstrapped here.
 * @param node - The node to apply icons to.
 * @public
 */
export function createIconPlugin(
  iconsOrFunction: Record<string, string> | ((location: string) => FormKitSchemaComponent)
): ((node: FormKitNode) => any) {
  const icons = typeof iconsOrFunction === 'object' && iconsOrFunction !== undefined ? iconsOrFunction : {}
  const userSchemaFunction = typeof iconsOrFunction === 'function' ? iconsOrFunction : false

  // add icons to icon registry
  if (icons) Object.assign(iconRegistry, icons)

  return function iconPlugin(node: FormKitNode): void {
    // bail if we're an incompatible input type
    if (
      node && node.context &&
      ['radio', 'checkbox', 'hidden', 'list', 'group', 'form'].includes(node.context.type)
    ) {
      return
    }

    node.addProps(['icon', 'iconSuffix', 'iconPrefix', 'onIconClick'])
    const iconPosition = node.props.iconPosition || 'prefix'
    let isUpdating = false

    const defineIcon = () => {
      if (isUpdating) return
      isUpdating = true

      // assign default icon prop to its specific prop value
      node.props.iconPrefix =
        !node.props.iconPrefix && iconPosition === 'prefix'
          ? node.props.icon
          : node.props.iconPrefix
      node.props.iconSuffix =
        !node.props.iconSuffix && iconPosition === 'suffix'
          ? node.props.icon
          : node.props.iconSuffix

      isUpdating = false
      if (!node.props.iconPrefix && !node.props.iconSuffix) return // do nothing else if we have on icons

      let inputIcons: Record<any, any> = {
        iconPrefix: node.props.iconPrefix,
        iconSuffix: node.props.iconSuffix,
      }

      inputIcons = Object.keys(inputIcons).reduce((collectedIcons, key) => {
        if (inputIcons[key]) {
          collectedIcons[key] = inputIcons[key]
        }
        return collectedIcons
      }, {} as Record<any, any>)

      Object.keys(inputIcons).forEach((iconKey) => {
        if (
          !userSchemaFunction &&
          !icons[inputIcons[iconKey]] &&
          !inputIcons[iconKey].startsWith('<svg')
        ) {
          return
        }
        if (node.props.definition) {
          const definition = node.props.definition
          if (typeof definition.schema === 'function') {
            // add target icon to node context
            if (node && node.context) {
              // add classes for style targeting
              const target = iconKey === 'iconPrefix' ? 'prefix' : 'suffix'
              if (node.context.classes[target].indexOf('formkit-icon') === -1) {
                node.context.classes[target] = 'formkit-icon ' + node.context.classes[target]
              }
              if (!userSchemaFunction) {
                if (inputIcons[iconKey].startsWith('<svg')) {
                  node.context[iconKey] = inputIcons[iconKey]
                  node.context[`${iconKey}Name`] = 'inlineIcon'
                } else {
                  node.context[iconKey] = icons[inputIcons[iconKey]]
                  node.context[`${iconKey}Name`] = inputIcons[iconKey]
                }
              } else {
                // if the user provided a schema definition then use the
                // prop values as the icon values, not their names
                node.context[iconKey] = inputIcons[iconKey]
              }
            }
          }
        }
      })

      if (node && node.context && node.props.onIconClick) {
        node.context.onIconClick = node.props.onIconClick
        function iconClick(sectionKey: string) {
          if (typeof node.context?.onIconClick === 'function') {
            node.context.onIconClick(node, sectionKey)
          }
        }
        node.context.handlePrefixIconClick = iconClick.bind(null, 'prefix')
        node.context.handleSuffixIconClick = iconClick.bind(null, 'suffix')
      }
    }
    defineIcon()

    if (
      !node.props.definition ||
      typeof node.props.definition.schema !== 'function'
    ) {
      return
    }

    const originalSchema = node.props.definition.schema
    node.props.definition.schema = (extensions: Record<string, any>) => {
      const createIconSchema = (sectionKey: string) => {
        const capSectionKey = `${sectionKey[0].toUpperCase()}${sectionKey.slice(1)}`
        if (node.context && node.context[`icon${capSectionKey}`]) {
          const newOuterSchema = {
            attrs: {
              [`data-has-${sectionKey}-icon`]: true
            }
          }
          const newSchema = {
            $el: 'label',
            attrs: {
              class: `$classes.${sectionKey}`,
              'data-icon': `$icon${capSectionKey}Name`,
              'for': '$id',
              'data-clickable': {
                if: '$onIconClick',
                then: 'true',
              },
              onClick: {
                if: '$onIconClick',
                then: `$handle${capSectionKey}IconClick`,
              },
            },
          } as Record<any, any>
          if (userSchemaFunction) {
            newSchema.children = [userSchemaFunction(`$icon${capSectionKey}`)]
          } else if (newSchema && newSchema.attrs) {
            newSchema.attrs.innerHTML = `$icon${capSectionKey}`
          }
          extensions.outer = extend(newOuterSchema, extensions.outer || {})
          extensions[sectionKey] = extend(newSchema, extensions[sectionKey] || {})
        }
      }
      createIconSchema('prefix')
      createIconSchema('suffix')
      return originalSchema(extensions)
    }

    node.on('prop:icon', defineIcon)
    node.on('prop:iconPrefix', defineIcon)
    node.on('prop:iconSuffix', defineIcon)
  }
}

export function getIcon(iconName: string): string | undefined {
  return iconRegistry[iconName]
}
