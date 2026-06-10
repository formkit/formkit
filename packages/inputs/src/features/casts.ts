import { FormKitNode } from '@formkit/core'

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
    if (typeof value === 'number' && Number.isFinite(value)) {
      // Already a number — preserve it (including -0, which parseFloat would
      // collapse to 0 via string coercion).
      return next(node.props.number === 'integer' ? Math.trunc(value) : value)
    }
    if (
      strict &&
      typeof value === 'string' &&
      (value === '-' ||
        value === '+' ||
        value === '-0' ||
        // A numeric prefix ending in a decimal separator (".", "-.", "5.")
        // is an in-progress value — anything else (e.g. "abc.") is not.
        /^[-+]?\d*\.$/.test(value))
    ) {
      // Transient strings that may become valid numbers as the user types
      // are passed through so typing isn't interrupted (#1671, #1262). They
      // are normalized to numbers when the input blurs.
      return next(value)
    }
    const numericValue =
      node.props.number === 'integer' ? parseInt(value) : parseFloat(value)
    if (!Number.isFinite(numericValue))
      return strict ? next(undefined) : next(value)
    return next(numericValue)
  })
}
