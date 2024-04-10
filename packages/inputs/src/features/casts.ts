import type { FormKitNode } from '@formkit/core'

/**
 * A feature that allows casting to numbers.
 *
 * @param node - A {@link @formkit/core#FormKitNode | FormKitNode}.
 *
 * @public
 */
export default function casts(node: FormKitNode): void {
  if (typeof node.props.number === 'undefined') return
  const strict = ['number', 'range', 'hidden'].includes(node.props.type)
  node.hook.input((value, next) => {
    if (value === '') return next(undefined)
    const numericValue =
      node.props.number === 'integer' ? parseInt(value) : parseFloat(value)
    if (!Number.isFinite(numericValue))
      return strict ? next(undefined) : next(value)
    return next(numericValue)
  })
}
