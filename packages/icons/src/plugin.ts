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
export function createIconPlugin(
  icons: Record<any, any>
): (node: FormKitNode) => void {
  return function iconPlugin(node: FormKitNode): void {
    node.addProps(['icon', 'iconSuffix', 'iconPrefix', 'onIconClick'])
    const iconPosition = node.props.iconPosition || 'prefix'

    const defineIcon = () => {
      // assign default icon prop to its specific prop value
      node.props.iconPrefix =
        !node.props.iconPrefix && iconPosition === 'prefix'
          ? node.props.icon
          : node.props.iconPrefix
      node.props.iconSuffix =
        !node.props.iconSuffix && iconPosition === 'suffix'
          ? node.props.icon
          : node.props.iconSuffix

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
          !icons[inputIcons[iconKey]] &&
          !inputIcons[iconKey].startsWith('<svg')
        )
          return
        if (node.props.definition) {
          const definition = node.props.definition
          if (typeof definition.schema === 'function') {
            // add target icon to node context
            if (node && node.context) {
              node.context.classes[
                iconKey === 'iconPrefix' ? 'prefix' : 'suffix'
              ] =
                'formkit-icon ' +
                node.context.classes[
                  iconKey === 'iconPrefix' ? 'prefix' : 'suffix'
                ]
              if (inputIcons[iconKey].startsWith('<svg')) {
                node.context[iconKey] = inputIcons[iconKey]
                node.context[`${iconKey}Name`] = 'inlineIcon'
              } else {
                node.context[iconKey] = icons[inputIcons[iconKey]]
                node.context[`${iconKey}Name`] = inputIcons[iconKey]
              }
            }
          }
        }
      })

      if (node && node.context && node.props.onIconClick) {
        node.context.onIconClick = node.props.onIconClick
        function iconClick(sectionKey: string) {
          console.log('clicked', node, sectionKey)
          if (typeof node.context?.onIconClick === 'function') {
            node.context.onIconClick(node, sectionKey)
          }
        }
        node.context.handlePrefixIconClick = iconClick.bind(null, 'prefix')
        node.context.handleSuffixIconClick = iconClick.bind(null, 'suffix')
      }
    }

    if (
      !node.props.definition ||
      typeof node.props.definition.schema !== 'function'
    )
      return
    const originalSchema = node.props.definition.schema
    node.props.definition.schema = (extensions: Record<string, any>) => {
      extensions.prefix = extend(
        {
          $el: 'div',
          if: '$iconPrefix',
          attrs: {
            class: '$classes.prefix',
            'data-icon': `$iconPrefixName`,
            innerHTML: `$iconPrefix`,
            'data-clickable': {
              if: '$onIconClick',
              then: 'true',
            },
            onClick: {
              if: '$onIconClick',
              then: '$handlePrefixIconClick',
            },
          },
        },
        extensions.prefix || {}
      )
      extensions.suffix = extend(
        {
          $el: 'div',
          if: '$iconSuffix',
          attrs: {
            class: '$classes.suffix',
            'data-icon': `$iconSuffixName`,
            innerHTML: `$iconSuffix`,
            'data-clickable': {
              if: '$onIconClick',
              then: 'true',
            },
            onClick: {
              if: '$onIconClick',
              then: '$handleSuffixIconClick',
            },
          },
        },
        extensions.suffix || {}
      )
      return originalSchema(extensions)
    }

    defineIcon()
    console.log(node.context)
    node.on('prop:icon', defineIcon)
    node.on('prop:iconPrefix', defineIcon)
    node.on('prop:iconSuffix', defineIcon)
  }
}
