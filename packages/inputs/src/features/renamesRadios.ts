import type { FormKitNode } from '@formkit/core'

/**
 * A simple counter to keep track of how many radios have been placed.
 */
let radioInstance = 0

/**
 * Automatically rename any radio inputs.
 * @param node - A formkit node.
 * @returns
 */
export default function renamesRadios(node: FormKitNode) {
  if (node.type === 'group' || node.type === 'list') {
    node.plugins.add(renamesRadiosPlugin)
  }
}

function renamesRadiosPlugin(node: FormKitNode) {
  if (node.props.type === 'radio') {
    node.addProps(['altName'])
    node.props.altName = `${node.name}_${radioInstance++}`
  }
}
