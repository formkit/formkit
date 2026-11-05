import type { FormKitNode, FormKitMessage } from '@formkit/core'

/**
 * Options for {@link describeForm}.
 *
 * @public
 */
export interface FormKitDescribeOptions {
  /**
   * Include each input's current value. Off by default so a description can
   * be handed to an agent, a log, or a test fixture without leaking user data.
   */
  values?: boolean
  /**
   * Additional input types whose values are never included, even when
   * `values` is on. These are added to the defaults (`password` and
   * `hidden`). Pass `false` to turn redaction off entirely.
   */
  redact?: string[] | false
  /**
   * Which error messages to include: every blocking message (`'all'`, the
   * default) or only the ones currently shown to the user (`'visible'`).
   */
  errors?: 'all' | 'visible'
}

/**
 * A validation rule applied to a field.
 *
 * @public
 */
export interface FormKitRuleDescription {
  name: string
  args: unknown[]
}

/**
 * An option of a select-like input.
 *
 * @public
 */
export interface FormKitOptionDescription {
  label: string
  value: unknown
  disabled?: boolean
  /** The label of the option group this option belongs to, if any. */
  group?: string
}

/**
 * A JSON-serializable description of a FormKit node and its children.
 *
 * @public
 */
export interface FormKitFieldDescription {
  /** The node's name (the key of its value in its parent). */
  name: string
  /**
   * Dot-separated path from the described node, e.g. `users.0.email`, so
   * `form.at(address)` returns this node. Empty for the described node itself.
   */
  address: string
  /** The input type, e.g. `text`, `email`, `select`, `form`, `repeater`. */
  type: string
  /** The node type: `input`, `group`, or `list`. */
  nodeType: 'input' | 'group' | 'list'
  label?: string
  help?: string
  placeholder?: string
  disabled?: boolean
  multiple?: boolean
  required: boolean
  rules: FormKitRuleDescription[]
  /** Options for select-like inputs (when they are a static list). */
  options?: FormKitOptionDescription[]
  /** True when the options are loaded on demand by a function. */
  optionsLoader?: boolean
  /** True when neither this node nor its descendants have blocking messages. */
  valid: boolean
  /** Error messages on this node. */
  errors: string[]
  /** The current value (only when `values: true`, and never when redacted). */
  value?: unknown
  /** True when a value was withheld because of `redact`. */
  redacted?: boolean
  children?: FormKitFieldDescription[]
}

/**
 * Returns a plain, JSON-serializable description of a form (or any FormKit
 * node): every field's name, address, type, label, rules, options and errors.
 * Because it reads the node tree rather than the DOM, it works the same in Vue
 * and React, and is handy for agents ("what does this form want?"), generated
 * tests, documentation, and debugging. Pair it with `node.input()` or
 * `node.at(address)` to drive a form.
 *
 * ```ts
 * import { getNode } from '@formkit/core'
 * import { describeForm } from '@formkit/addons'
 *
 * describeForm(getNode('signup')!, { values: true })
 * ```
 *
 * @param node - The node to describe, usually a form.
 * @param options - {@link FormKitDescribeOptions}
 *
 * @public
 */
export function describeForm(
  node: FormKitNode,
  options: FormKitDescribeOptions = {}
): FormKitFieldDescription {
  const redact = new Set(
    options.redact === false
      ? []
      : [...DEFAULT_REDACTED, ...(options.redact ?? [])]
  )
  return describeNode(
    node,
    {
      values: !!options.values,
      redact,
      visibleOnly: options.errors === 'visible',
    },
    ''
  )
}

/**
 * Input types whose values are redacted by default.
 */
const DEFAULT_REDACTED = ['password', 'hidden']

interface DescribeContext {
  values: boolean
  redact: Set<string>
  visibleOnly: boolean
}

function describeNode(
  node: FormKitNode,
  ctx: DescribeContext,
  address: string
): FormKitFieldDescription {
  const props = node.props
  const type = String(props.type ?? node.type)
  const rules = describeRules(node)
  const description: FormKitFieldDescription = {
    name: String(node.name),
    address,
    type,
    nodeType: node.type,
    required: rules.some((rule) => rule.name === 'required'),
    rules,
    valid: !hasBlocking(node),
    errors: describeErrors(node, ctx.visibleOnly),
  }
  if (isText(props.label)) description.label = String(props.label)
  if (isText(props.help)) description.help = String(props.help)
  const placeholder = props.placeholder ?? props.attrs?.placeholder
  if (isText(placeholder)) description.placeholder = String(placeholder)
  if (isOn(props.disabled)) description.disabled = true
  if (isOn(props.multiple)) description.multiple = true

  if (typeof props.options === 'function' || props.optionsLoader) {
    description.optionsLoader = true
  }
  // Include static options, and options that a loader has already loaded.
  if (Array.isArray(props.options) && props.options.length) {
    description.options = describeOptions(props.options)
  }

  if (ctx.values && node.type === 'input') {
    if (ctx.redact.has(type)) description.redacted = true
    else description.value = toJSONValue(node.value)
  }

  if (node.children.length) {
    description.children = node.children.map((child) =>
      describeNode(
        child as FormKitNode,
        ctx,
        address ? `${address}.${String(child.name)}` : String(child.name)
      )
    )
  }
  return description
}

function describeRules(node: FormKitNode): FormKitRuleDescription[] {
  const parsed: any[] = Array.isArray(node.props.parsedRules)
    ? node.props.parsedRules
    : []
  return parsed.map((validation) => ({
    name: String(
      validation.name || validation.rule?.ruleName || validation.rule?.name
    ),
    args: (validation.args ?? []).map((arg: unknown) => toJSONValue(arg)),
  }))
}

function describeErrors(node: FormKitNode, visibleOnly: boolean): string[] {
  const errors: string[] = []
  // Validation messages are shown according to `validation-visibility`
  // (blur, dirty, submit…), which the framework bindings track.
  const validationVisible = (node.context as any)?.state?.validationVisible
  for (const key in node.store) {
    const message = node.store[key] as FormKitMessage
    if (
      message &&
      message.blocking &&
      (message.type === 'validation' || message.type === 'error') &&
      (!visibleOnly ||
        (message.visible &&
          (message.type !== 'validation' || validationVisible !== false))) &&
      isText(message.value)
    ) {
      errors.push(String(message.value))
    }
  }
  return errors
}

function hasBlocking(node: FormKitNode): boolean {
  for (const key in node.store) {
    if ((node.store[key] as FormKitMessage)?.blocking) return true
  }
  return node.children.some((child) => hasBlocking(child as FormKitNode))
}

function describeOptions(
  options: any[],
  group?: string
): FormKitOptionDescription[] {
  const described: FormKitOptionDescription[] = []
  for (const option of options) {
    if (option && typeof option === 'object' && Array.isArray(option.options)) {
      // An option group: flatten it, but remember the group's label.
      described.push(...describeOptions(option.options, option.group))
    } else if (option && typeof option === 'object' && 'value' in option) {
      // Core masks non-string option values (`__mask_N`) and keeps the real
      // value in `__original` — always report the real one.
      const value = '__original' in option ? option.__original : option.value
      const item: FormKitOptionDescription = {
        label: String(option.label ?? value),
        value: toJSONValue(value),
      }
      if (isOn(option.attrs?.disabled)) item.disabled = true
      if (group !== undefined) item.group = String(group)
      described.push(item)
    } else {
      const item: FormKitOptionDescription = {
        label: String(option),
        value: toJSONValue(option),
      }
      if (group !== undefined) item.group = String(group)
      described.push(item)
    }
  }
  return described
}

function isText(value: unknown): value is string | number {
  return (typeof value === 'string' && value !== '') || typeof value === 'number'
}

function isOn(value: unknown): boolean {
  return (
    value !== undefined && value !== null && value !== false && value !== 'false'
  )
}

/**
 * Coerce a value into something JSON-safe. Plain objects and arrays are copied;
 * dates become ISO strings, regular expressions their source, Maps/Sets
 * arrays, and Files `{ name, size, type }`. Functions, symbols and circular
 * references are dropped. (Lossy for other non-plain objects.)
 */
function toJSONValue(value: unknown, ancestors = new Set<object>()): unknown {
  if (value === null || value === undefined) return value ?? null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'function' || typeof value === 'symbol') return undefined
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString()
  }
  if (value instanceof RegExp) return value.toString()
  if (typeof File !== 'undefined' && value instanceof File) {
    return { name: value.name, size: value.size, type: value.type }
  }
  if (typeof value === 'object') {
    // Only true cycles are dropped: an object may appear more than once.
    if (ancestors.has(value)) return undefined
    ancestors.add(value)
    let result: unknown
    if (value instanceof Map) {
      result = [...value.entries()].map(([k, v]) => [
        toJSONValue(k, ancestors) ?? null,
        toJSONValue(v, ancestors) ?? null,
      ])
    } else if (value instanceof Set || Array.isArray(value)) {
      result = [...value].map((item) => toJSONValue(item, ancestors) ?? null)
    } else {
      const obj: Record<string, unknown> = {}
      for (const key of Object.keys(value)) {
        const item = toJSONValue(
          (value as Record<string, unknown>)[key],
          ancestors
        )
        if (item !== undefined) obj[key] = item
      }
      result = obj
    }
    ancestors.delete(value)
    return result
  }
  return undefined
}
