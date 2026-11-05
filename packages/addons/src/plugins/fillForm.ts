import type { FormKitNode } from '@formkit/core'
import { describeForm } from './describeForm'

/**
 * Options for {@link fillForm}.
 *
 * @public
 */
export interface FormKitFillOptions {
  /**
   * Submit the form (through its regular submit handler) after filling it.
   * Only applies when the node is a `form`.
   */
  submit?: boolean
  /**
   * Throw instead of reporting addresses that don't match any input.
   */
  strict?: boolean
}

/**
 * The outcome for one filled field.
 *
 * @public
 */
export interface FormKitFillField {
  /** The address that was filled, relative to the node passed to fillForm. */
  address: string
  /** True when the field has no blocking messages after filling. */
  valid: boolean
  /** The field's error messages after filling. */
  errors: string[]
}

/**
 * The result of {@link fillForm}. JSON-serializable.
 *
 * @public
 */
export interface FormKitFillResult {
  /** True when the whole node (form) has no blocking messages. */
  valid: boolean
  /** Only present with `submit: true`: whether the submit went through. */
  submitted?: boolean
  /** One entry per filled input. */
  fields: FormKitFillField[]
  /** Addresses that didn't match any input. */
  unknown: string[]
}

/**
 * Fills a form (or any FormKit node) from a values object and reports what
 * happened: the write side of {@link describeForm}. Built for AI agents and
 * tests, it reads and writes the node tree (not the DOM), so it works the same
 * in Vue and React.
 *
 * - Keys are addresses relative to `node` (`'email'`, `'address.city'`,
 *   `'users.0.name'`) — the same `address` that `describeForm()` returns — or
 *   nested objects that mirror groups.
 * - For select-like inputs, an option's **label** may be given instead of its
 *   value (`plan: 'Pro'` sets the option whose label is "Pro").
 * - Waits for the form to settle (debounces, async validation) before
 *   reporting.
 *
 * ```ts
 * const result = await fillForm(
 *   getNode('signup')!,
 *   { email: 'ada@example.com', plan: 'Pro' },
 *   { submit: true }
 * )
 * // { valid: false, submitted: false, unknown: [],
 * //   fields: [{ address: 'email', valid: true, errors: [] }, …] }
 * ```
 *
 * @param node - The node to fill, usually a form.
 * @param values - Values by address, or nested objects mirroring the form.
 * @param options - {@link FormKitFillOptions}
 *
 * @public
 */
export async function fillForm(
  node: FormKitNode,
  values: Record<string, unknown>,
  options: FormKitFillOptions = {}
): Promise<FormKitFillResult> {
  const filled: Array<{ address: string; node: FormKitNode }> = []
  const unknown: string[] = []
  fill(node, values, '', filled, unknown)
  if (options.strict && unknown.length) {
    throw new Error(`fillForm: no input at ${unknown.join(', ')}`)
  }
  await settle(node)

  const result: FormKitFillResult = {
    valid: describeForm(node).valid,
    fields: filled.map(({ address, node: field }) => {
      const description = describeForm(field)
      return { address, valid: description.valid, errors: description.errors }
    }),
    unknown,
  }

  if (options.submit) {
    const submit = node.context?.handlers?.submit as
      | ((e: Event) => Promise<void>)
      | undefined
    if (node.props.type === 'form' && typeof submit === 'function') {
      await submit(new Event('submit', { cancelable: true }))
      await settle(node)
      result.valid = describeForm(node).valid
      result.submitted = result.valid
    } else {
      result.submitted = false
    }
  }
  return result
}

function fill(
  node: FormKitNode,
  values: Record<string, unknown>,
  prefix: string,
  filled: Array<{ address: string; node: FormKitNode }>,
  unknown: string[]
) {
  for (const key of Object.keys(values)) {
    const value = values[key]
    const address = prefix ? `${prefix}.${key}` : key
    // `$self.` resolves relative to this node's own children (a plain
    // `node.at('city')` on a nested group would not).
    const target = node.at(`$self.${key}`)
    if (!target || target === node) {
      unknown.push(address)
      continue
    }
    // Nested objects fill groups field by field.
    if (target.type === 'group' && isPlainObject(value)) {
      fill(target, value, address, filled, unknown)
      continue
    }
    target.input(resolveOptionValue(target, value), false)
    if (target.type === 'input') filled.push({ address, node: target })
  }
}

/**
 * Lets callers pass an option's label instead of its value.
 */
function resolveOptionValue(node: FormKitNode, value: unknown): unknown {
  const options = node.props.options
  if (!Array.isArray(options) || !options.length) return value
  const flat = flattenOptions(options)
  const resolve = (v: unknown) => {
    const byValue = flat.find((option) => realValue(option) === v)
    if (byValue) return realValue(byValue)
    if (typeof v !== 'string') return v
    const needle = v.trim().toLowerCase()
    const byLabel = flat.find(
      (option) =>
        typeof option.label === 'string' &&
        option.label.trim().toLowerCase() === needle
    )
    return byLabel ? realValue(byLabel) : v
  }
  return Array.isArray(value) ? value.map(resolve) : resolve(value)
}

function realValue(option: any): unknown {
  // Core masks non-string option values (`__mask_N`) and keeps the original.
  return option && typeof option === 'object' && '__original' in option
    ? option.__original
    : option?.value
}

function flattenOptions(options: any[]): any[] {
  const flat: any[] = []
  for (const option of options) {
    if (option && typeof option === 'object' && Array.isArray(option.options)) {
      flat.push(...flattenOptions(option.options))
    } else if (option && typeof option === 'object') {
      flat.push(option)
    }
  }
  return flat
}

/**
 * Wait for debounced values and any pending (async) validation.
 */
async function settle(node: FormKitNode) {
  await node.settled
  if (hasPendingValidation(node)) {
    await new Promise<void>((resolve) => {
      const check = () => {
        if (!hasPendingValidation(node)) return resolve()
        setTimeout(check, 10)
      }
      check()
    })
    await node.settled
  }
}

function hasPendingValidation(node: FormKitNode): boolean {
  if (node.store.validating?.value) return true
  return node.children.some((child) =>
    hasPendingValidation(child as FormKitNode)
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    !!value &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

