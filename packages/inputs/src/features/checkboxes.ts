import { FormKitNode } from '@formkit/core'
import { has } from '@formkit/utils'
import normalizeBoxes from './normalizeBoxes'
import { shouldSelect, optionValue } from './options'

/**
 * Event handler when an input is toggled.
 * @param node - The node being toggled
 * @param e - The input even related to the toggling
 */
function toggleChecked(node: FormKitNode, e: Event) {
  const el = e.target
  if (el instanceof HTMLInputElement) {
    const value = Array.isArray(node.props.options)
      ? optionValue(node.props.options, el.value)
      : el.value
    if (Array.isArray(node.props.options) && node.props.options.length) {
      if (!Array.isArray(node._value)) {
        // There is no array value set
        node.input([value])
      } else if (
        !node._value.some((existingValue) => shouldSelect(value, existingValue))
      ) {
        // The value is not in the current set
        node.input([...node._value, value])
      } else {
        // Filter out equivalent values
        node.input(
          node._value.filter(
            (existingValue) => !shouldSelect(value, existingValue)
          )
        )
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
  // We need to force vue’s reactivity to respond when the value is run:
  node.context?.value
  node.context?._value
  if (Array.isArray(node._value)) {
    return node._value.some((existingValue) =>
      shouldSelect(optionValue(node.props.options, value), existingValue)
    )
  }
  return false
}

/**
 * Adds checkbox selection support
 * @param node - Node the feature is added to
 * @public
 */
export default function checkboxes(node: FormKitNode): void {
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

  node.hook.prop(normalizeBoxes(node))
}
