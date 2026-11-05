import type { FormKitNode, FormKitMessage } from '@formkit/core'
import { eq } from '@formkit/utils'

/**
 * Options for {@link fillForm}.
 *
 * @public
 */
export interface FormKitFillOptions {
  /**
   * Submit the form through its normal submit handler (validation,
   * `onSubmit`, loading state) after filling it. Only applies to `form` nodes.
   */
  submit?: boolean
  /**
   * Throw — before writing anything — when an address doesn't match an input,
   * a value doesn't match any option, or a field would be skipped.
   */
  strict?: boolean
  /**
   * How long (ms) to wait for debounces and async validation to settle.
   * Defaults to 5000. When exceeded, the result has `settled: false`.
   */
  timeout?: number
}

/**
 * A filled field.
 *
 * @public
 */
export interface FormKitFillField {
  /** Address relative to the node passed to fillForm (e.g. `address.city`). */
  address: string
  /** True when the field has no blocking messages. */
  valid: boolean
  /** The field's error messages. */
  errors: string[]
}

/**
 * The result of {@link fillForm}. JSON-serializable; never echoes values
 * that were filled.
 *
 * @public
 */
export interface FormKitFillResult {
  /** True when the whole node has no blocking messages. */
  valid: boolean
  /** False when the form didn't settle within `timeout`. */
  settled: boolean
  /** One entry per input that was written. */
  fields: FormKitFillField[]
  /** Every input in the node that currently has blocking messages. */
  invalid: Array<{ address: string; errors: string[] }>
  /** Messages on the node itself (e.g. `setErrors()` form errors). */
  errors: string[]
  /** Addresses that don't match any input. */
  unknown: string[]
  /**
   * Values that didn't match an option. `no-such-option`: not written.
   * `options-not-loaded`: written as-is (options load asynchronously).
   */
  unmatched: Array<{
    address: string
    reason: 'no-such-option' | 'options-not-loaded'
  }>
  /** Addresses that were not written, with why. */
  skipped: Array<{ address: string; reason: 'disabled' | 'not-an-input' }>
  /** With `submit: true`: whether `onSubmit` ran and completed. */
  submitted?: boolean
  /** With `submit: true`: the error thrown/rejected by `onSubmit`, if any. */
  submitError?: string
}

interface PlannedWrite {
  address: string
  node: FormKitNode
  value: unknown
}

/**
 * Fills a form (or any FormKit node) from a values object and reports what
 * happened — the write side of {@link describeForm}, built for AI agents and
 * tests. It reads and writes the node tree (not the DOM), so it works the same
 * in Vue and React.
 *
 * - Keys are the `address` values `describeForm()` returns (`'email'`,
 *   `'address.city'`, `'users.0.name'`), or nested objects/arrays that mirror
 *   groups and lists. Addresses are matched by literal child names separated
 *   by `.` (a child whose own name contains `.` is matched whole).
 * - For inputs with options, give an option's value or its label
 *   (case-insensitive; values win over labels, the first match wins). Values
 *   that match no option are not written and are listed in `unmatched`.
 * - Disabled inputs are skipped. Existing list items can be filled; new list
 *   items (repeater rows) can't be created by address.
 *
 * ```ts
 * const result = await fillForm(
 *   getNode('signup')!,
 *   { email: 'ada@example.com', plan: 'Pro', 'address.city': 'Lisbon' },
 *   { submit: true }
 * )
 * ```
 *
 * @param node - The node to fill, usually a form.
 * @param values - Values by address, or nested objects/arrays.
 * @param options - {@link FormKitFillOptions}
 *
 * @public
 */
export async function fillForm(
  node: FormKitNode,
  values: Record<string, unknown>,
  options: FormKitFillOptions = {}
): Promise<FormKitFillResult> {
  const writes: PlannedWrite[] = []
  const unknown: string[] = []
  const unmatched: FormKitFillResult['unmatched'] = []
  const skipped: FormKitFillResult['skipped'] = []

  // 1. Resolve everything first, so nothing is written if strict mode throws.
  plan(node, values, '', { writes, unknown, unmatched, skipped })
  if (options.strict) {
    const problems = [
      ...unknown.map((a) => `${a} (unknown)`),
      ...unmatched
        .filter((u) => u.reason === 'no-such-option')
        .map((u) => `${u.address} (no such option)`),
      ...skipped.map((s) => `${s.address} (${s.reason})`),
    ]
    if (problems.length) {
      throw new Error(`fillForm: ${problems.join(', ')}`)
    }
  }

  // 2. Write.
  for (const write of writes) write.node.input(write.value, false)
  let settled = await settle(node, options.timeout ?? 5000)

  const result: FormKitFillResult = {
    valid: false,
    settled,
    fields: [],
    invalid: [],
    errors: [],
    unknown,
    unmatched,
    skipped,
  }

  // 3. Submit through the form's own handler.
  if (options.submit) {
    result.submitted = false
    const submit = node.context?.handlers?.submit as
      | ((e: Event) => Promise<void>)
      | undefined
    if (!settled) {
      result.submitError = 'The form did not settle within the timeout'
    } else if (node.props.type === 'form' && typeof submit === 'function') {
      let dispatched = false
      const watch = (payload: any, next: any) => {
        dispatched = true
        return next(payload)
      }
      node.hook.submit(watch)
      try {
        const outcome = await raceTimeout(
          submit(new Event('submit', { cancelable: true })),
          options.timeout ?? 5000
        )
        if (outcome === TIMED_OUT) {
          result.submitError = 'Submit did not finish within the timeout'
        } else {
          result.submitted = dispatched
        }
      } catch (err) {
        result.submitError =
          err instanceof Error ? err.message : String(err ?? 'Submit failed')
      } finally {
        node.hook.submit.remove(watch)
      }
      settled = (await settle(node, options.timeout ?? 5000)) && settled
      result.settled = settled
    }
  }

  // 4. Report.
  result.fields = writes.map(({ address, node: field }) => {
    const errors = errorsOf(field)
    return { address, valid: !hasBlocking(field) && !errors.length, errors }
  })
  result.invalid = collectInvalid(node)
  result.errors = nodeMessages(node)
  result.valid = !hasBlocking(node) && !result.invalid.length && !hasErrorMessages(node)
  return result
}

interface Plan {
  writes: PlannedWrite[]
  unknown: string[]
  unmatched: FormKitFillResult['unmatched']
  skipped: FormKitFillResult['skipped']
}

function plan(
  node: FormKitNode,
  values: Record<string, unknown> | unknown[],
  prefix: string,
  out: Plan
) {
  const entries: Array<[string, unknown]> = Array.isArray(values)
    ? values.map((v, i) => [String(i), v])
    : Object.entries(values)
  for (const [key, value] of entries) {
    const address = prefix ? `${prefix}.${key}` : key
    const target = resolve(node, key)
    if (!target) {
      out.unknown.push(address)
      continue
    }
    if (target.type !== 'input') {
      // Groups take objects, lists take arrays — filled child by child.
      if (target.type === 'group' && isPlainObject(value)) {
        plan(target, value, address, out)
      } else if (target.type === 'list' && Array.isArray(value)) {
        plan(target, value, address, out)
      } else {
        out.skipped.push({ address, reason: 'not-an-input' })
      }
      continue
    }
    if (isOn(target.props.disabled)) {
      out.skipped.push({ address, reason: 'disabled' })
      continue
    }
    const resolved = resolveOptionValue(target, value)
    if (resolved.unmatched === 'no-such-option') {
      out.unmatched.push({ address, reason: 'no-such-option' })
      continue
    }
    if (resolved.unmatched) out.unmatched.push({ address, reason: resolved.unmatched })
    out.writes.push({ address, node: target, value: resolved.value })
  }
}

/**
 * Find a descendant by literal child names (no `$parent`/`$root`/`find()`
 * traversal). A child whose own name contains `.` is matched whole first.
 */
function resolve(node: FormKitNode, key: string): FormKitNode | undefined {
  const direct = childNamed(node, key)
  if (direct) return direct
  const dot = key.indexOf('.')
  if (dot === -1) return undefined
  // Try the longest matching child name first (names may contain dots).
  for (let i = key.lastIndexOf('.'); i > 0; i = key.lastIndexOf('.', i - 1)) {
    const child = childNamed(node, key.slice(0, i))
    if (child) return resolve(child, key.slice(i + 1))
  }
  return undefined
}

function childNamed(node: FormKitNode, name: string): FormKitNode | undefined {
  // Lists address children by position; groups by name.
  if (node.type === 'list') {
    const child = node.children[Number(name)]
    return /^\d+$/.test(name) && child ? (child as FormKitNode) : undefined
  }
  return node.children.find((child) => String(child.name) === name) as
    | FormKitNode
    | undefined
}

function resolveOptionValue(
  node: FormKitNode,
  value: unknown
): { value: unknown; unmatched?: 'no-such-option' | 'options-not-loaded' } {
  const options = node.props.options
  const multiple =
    isOn(node.props.multiple) ||
    (node.props.type === 'checkbox' && Array.isArray(options)) ||
    Array.isArray(node.value)
  const asList = (v: unknown) =>
    multiple && !Array.isArray(v) ? (v == null || v === '' ? [] : [v]) : v
  // null / undefined / '' clear the input rather than looking for an option.
  if (value === null || value === undefined || value === '') {
    return { value: asList(value) }
  }
  if (!Array.isArray(options) || !options.length) {
    const asyncOptions =
      typeof options === 'function' || typeof node.props.optionsLoader === 'function'
    return {
      value: asList(value),
      unmatched: asyncOptions ? 'options-not-loaded' : undefined,
    }
  }
  const flat = flattenOptions(options)
  const allowNew = isOn(node.props.allowNewValues)
  let missing = false
  const match = (v: unknown) => {
    const byValue = flat.find((option) => sameValue(realValue(option), v))
    if (byValue) return realValue(byValue)
    if (typeof v === 'string') {
      const needle = v.trim().toLowerCase()
      const byLabel = flat.find(
        (option) =>
          typeof option.label === 'string' &&
          option.label.trim().toLowerCase() === needle
      )
      if (byLabel) return realValue(byLabel)
    }
    if (!allowNew) missing = true
    return v
  }
  const listed = asList(value)
  const resolved = Array.isArray(listed) ? listed.map(match) : match(listed)
  return missing ? { value, unmatched: 'no-such-option' } : { value: resolved }
}

function sameValue(a: unknown, b: unknown): boolean {
  if (eq(a, b)) return true
  // Agents often send strings: '2' matches 2, 'true' matches true.
  return (
    (typeof a === 'number' || typeof a === 'boolean') &&
    typeof b === 'string' &&
    String(a) === b.trim()
  )
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
 * Every input, group or list (below the filled node) with blocking messages
 * or error messages — including non-blocking `setErrors()` field errors.
 */
function collectInvalid(
  root: FormKitNode
): Array<{ address: string; errors: string[] }> {
  const out: Array<{ address: string; errors: string[] }> = []
  const walk = (node: FormKitNode, address: string) => {
    const errors = errorsOf(node)
    const ownBlocking = [...storeMessages(node)].some((m) => m.blocking)
    if (errors.length || (node.type === 'input' && ownBlocking)) {
      out.push({ address, errors })
    }
    node.children.forEach((child, i) => {
      const name = node.type === 'list' ? String(i) : String(child.name)
      walk(child as FormKitNode, address ? `${address}.${name}` : name)
    })
  }
  root.children.forEach((child, i) =>
    walk(child as FormKitNode, root.type === 'list' ? String(i) : String(child.name))
  )
  return out
}

function* storeMessages(node: FormKitNode): Generator<FormKitMessage> {
  for (const key in node.store) {
    const message = node.store[key] as FormKitMessage
    if (message && typeof message === 'object' && 'type' in message) yield message
  }
}

/**
 * A node's error messages: blocking validation messages plus every `error`
 * message (server errors from `setErrors()` are non-blocking).
 */
function errorsOf(node: FormKitNode): string[] {
  const errors: string[] = []
  for (const message of storeMessages(node)) {
    if (
      ((message.type === 'validation' && message.blocking) ||
        message.type === 'error') &&
      (typeof message.value === 'string' || typeof message.value === 'number')
    ) {
      errors.push(String(message.value))
    }
  }
  return errors
}

function hasBlocking(node: FormKitNode): boolean {
  for (const message of storeMessages(node)) if (message.blocking) return true
  return node.children.some((child) => hasBlocking(child as FormKitNode))
}

function hasErrorMessages(node: FormKitNode): boolean {
  for (const message of storeMessages(node)) if (message.type === 'error') return true
  return node.children.some((child) => hasErrorMessages(child as FormKitNode))
}

/**
 * Messages on the node itself that a user would see: errors (including
 * non-blocking `setErrors()` form errors) and UI messages like "Form
 * incomplete."
 */
function nodeMessages(node: FormKitNode): string[] {
  const messages: string[] = []
  for (const key in node.store) {
    const message = node.store[key] as FormKitMessage
    if (
      message &&
      (message.type === 'error' ||
        message.type === 'validation' ||
        (message.type === 'ui' && message.meta?.showAsMessage)) &&
      (typeof message.value === 'string' || typeof message.value === 'number')
    ) {
      messages.push(String(message.value))
    }
  }
  return messages
}

const TIMED_OUT = Symbol('timed out')

async function raceTimeout<T>(
  promise: Promise<T>,
  timeout: number
): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), timeout)
  })
  try {
    return await Promise.race([promise, timedOut])
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Wait for debounced values and pending (async) validation, up to `timeout`.
 * Resolves to false if it timed out.
 */
async function settle(node: FormKitNode, timeout: number): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), timeout)
  })
  const done = (async () => {
    await node.settled
    while (hasPendingValidation(node)) {
      await new Promise((r) => setTimeout(r, 10))
      if (timer === undefined) break
    }
    await node.settled
    return true as const
  })()
  const result = await Promise.race([done, timedOut])
  clearTimeout(timer)
  timer = undefined
  return result
}

function hasPendingValidation(node: FormKitNode): boolean {
  if (node.store.validating?.value) return true
  return node.children.some((child) => hasPendingValidation(child as FormKitNode))
}

function isOn(value: unknown): boolean {
  return (
    value !== undefined && value !== null && value !== false && value !== 'false'
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    !!value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype
  )
}
