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
   * Input types whose values are never included, even when `values` is on.
   * Defaults to `['password']`.
   */
  redact?: string[]
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
  const redact = new Set(options.redact ?? ['password'])
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
  } else if (Array.isArray(props.options) && props.options.length) {
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
    args: (validation.args ?? []).map(toJSONValue),
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

function describeOptions(options: any[]): FormKitOptionDescription[] {
  const described: FormKitOptionDescription[] = []
  for (const option of options) {
    if (option && typeof option === 'object' && Array.isArray(option.options)) {
      // An option group: flatten it.
      described.push(...describeOptions(option.options))
    } else if (option && typeof option === 'object' && 'value' in option) {
      const item: FormKitOptionDescription = {
        label: String(option.label ?? option.value),
        value: toJSONValue(option.value),
      }
      if (isOn(option.attrs?.disabled)) item.disabled = true
      described.push(item)
    } else {
      described.push({ label: String(option), value: toJSONValue(option) })
    }
  }
  return described
}

function isText(value: unknown): value is string | number {
  return (typeof value === 'string' && value !== '') || typeof value === 'number'
}

function isOn(value: unknown): boolean {
  return value !== undefined && value !== false && value !== 'false'
}

/**
 * Coerce a value into something JSON-safe (functions, symbols, and cycles are
 * dropped; dates become ISO strings).
 */
function toJSONValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value ?? null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'function' || typeof value === 'symbol') return undefined
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString()
  }
  if (typeof value === 'object') {
    if (seen.has(value)) return undefined
    seen.add(value)
    if (Array.isArray(value)) {
      return value.map((item) => toJSONValue(item, seen) ?? null)
    }
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(value)) {
      const item = toJSONValue((value as Record<string, unknown>)[key], seen)
      if (item !== undefined) result[key] = item
    }
    return result
  }
  return undefined
}
