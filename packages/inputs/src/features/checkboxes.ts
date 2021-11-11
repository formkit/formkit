import { FormKitNode } from '@formkit/core'
import { extend, kebab, has } from '@formkit/utils'

/**
 * Event handler when an input is toggled.
 * @param node - The node being toggled
 * @param e - The input even related to the toggling
 */
function toggleChecked(node: FormKitNode, e: Event) {
  const el = e.target
  if (el instanceof HTMLInputElement) {
    if (Array.isArray(node.props.options) && node.props.options.length) {
      if (!Array.isArray(node._value)) {
        node.input([el.value])
      } else if (!node._value.includes(el.value)) {
        node.input([...node._value, el.value])
      } else {
        node.input(node._value.filter((val) => val !== el.value))
      }
    } else {
      if (el.checked) {
        node.input(node.props.onValue)
      } else {
        node.input(node.props.offValue)
      }
    }
  }
}

/**
 * Checks if a given option is present in the node value.
 * @param node - The node being checked
 * @param value - The value of any option
 * @returns
 */
function isChecked(node: FormKitNode, value: any) {
  return Array.isArray(node._value) ? node._value.includes(value) : false
}

/**
 * Adds multi-select functionality (like with checkboxes)
 * @param node - Node the feature is added to
 */
export default function (node: FormKitNode): void {
  node.on('created', () => {
    if (node.context?.handlers) {
      node.context.handlers.toggleChecked = toggleChecked.bind(null, node)
    }
    if (node.context?.fns) {
      node.context.fns.isChecked = isChecked.bind(null, node)
    }
    // Configure our default onValue and offValue
    if (!has(node.props, 'onValue')) node.props.onValue = true
    if (!has(node.props, 'offValue')) node.props.offValue = false
  })

  node.hook.prop((prop, next) => {
    if (prop.prop === 'options' && Array.isArray(prop.value)) {
      prop.value = prop.value.map((option) => {
        if (!option.attrs?.id) {
          return extend(option, {
            attrs: { id: `${node.name}-option-${kebab(option.value)}` },
          })
        }
        return option
      })
      if (node.value === undefined) {
        // Force the value to an array
        node.input([], false)
      }
    }
    return next(prop)
  })
}
