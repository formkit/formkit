import type { FormKitNode } from '@formkit/core'

function key(section: string) {
  return `${section.charAt(0).toUpperCase()}${section.slice(1)}`
}

/**
 * An icon plugin for FormKit.
 * @param node - The FormKitNode to add icons to
 * @returns
 */
export function createIconPlugin() {
  // Reserved for future setup options.
  return (node: FormKitNode) => {
    for (let prop in node.props) {
      if (prop.endsWith('Icon')) {
        const rawKey = `_raw${key(prop)}`
        node.addProps([rawKey, `on${key(prop)}Click`])
        if (node.props[prop].startsWith('<svg')) {
          node.props[rawKey] = node.props[prop]
        }
      }
    }
    node.on('created', () => {
      if (node?.context) {
        node.context.handlers.iconClick = (section: string) => {
          const clickHandlerProp = `on${key(section)}IconClick`
          const handlerFunction = node.props[clickHandlerProp]
          if (handlerFunction && typeof handlerFunction === 'function') {
            return (e: MouseEvent) => handlerFunction(node, e)
          }
          return undefined
        }
        node.context.fns.iconRole = (section: string) => {
          const clickHandlerProp = `on${key(section)}IconClick`
          return typeof node.props[clickHandlerProp] === 'function'
            ? 'button'
            : null
        }
      }
    })
    return false
  }
}
