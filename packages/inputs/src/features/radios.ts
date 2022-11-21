import type { FormKitNode} from '@formkit/core';
import { warn } from '@formkit/core'
import normalizeBoxes from './normalizeBoxes'
import { optionValue, shouldSelect } from './options'

/**
 * Sets the value of a radio button when checked.
 * @param node - FormKitNode
 * @param value - Value
 * @public
 */
function toggleChecked(node: FormKitNode, event: Event) {
  if (event.target instanceof HTMLInputElement) {
    node.input(optionValue(node.props.options, event.target.value))
  }
}

/**
 * Checks if the value being checked is the current value.
 * @param node - The node to check against.
 * @param value - The value to check
 * @returns
 */
function isChecked(node: FormKitNode, value: string) {
  // We need to force vue’s reactivity to respond when the value is run:
  node.context?.value
  node.context?._value
  return shouldSelect(optionValue(node.props.options, value), node._value)
}

/**
 * Determines if a given radio input is being evaluated.
 * @param node - The radio input group.
 * @public
 */
export default function radios(node: FormKitNode): void {
  node.on('created', () => {
    if (!Array.isArray(node.props.options)) {
      warn(350, node)
    }
    if (node.context?.handlers) {
      node.context.handlers.toggleChecked = toggleChecked.bind(null, node)
    }
    if (node.context?.fns) {
      node.context.fns.isChecked = isChecked.bind(null, node)
    }
  })
  node.hook.prop(normalizeBoxes(node))
}
