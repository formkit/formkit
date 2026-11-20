import type { FormKitNode, FormKitPlugin } from '@formkit/core'
import {
  describeForm,
  type FormKitFieldDescription,
} from './describeForm'
import { fillForm, type FormKitFillResult } from './fillForm'

/**
 * A JSON schema object (loosely typed — WebMCP accepts any JSON schema).
 *
 * @public
 */
export type FormKitJSONSchema = Record<string, unknown>

/**
 * A tool as handed to `modelContext.registerTool()`.
 *
 * @public
 */
export interface FormKitWebMCPTool {
  name: string
  description: string
  inputSchema: FormKitJSONSchema
  annotations?: {
    readOnlyHint?: boolean
    consequentialHint?: boolean
    untrustedContentHint?: boolean
  }
  execute: (args?: Record<string, unknown> | string) => Promise<unknown>
}

/**
 * The subset of the WebMCP `ModelContext` interface this plugin uses. Both
 * draft shapes are supported: `registerTool()` returning `{ unregister() }`,
 * `modelContext.unregisterTool(name)`, and `registerTool(tool, { signal })`
 * with an `AbortSignal` (current Chrome origin trial).
 *
 * @public
 */
export interface FormKitModelContext {
  registerTool: (
    tool: FormKitWebMCPTool,
    options?: { signal?: AbortSignal }
  ) => unknown
  unregisterTool?: (name: string) => unknown
}

/**
 * The tool kinds the plugin registers.
 *
 * @public
 */
export type FormKitWebMCPToolKind = 'describe' | 'fill' | 'submit'

/**
 * Options for {@link createWebMCPPlugin}.
 *
 * @public
 */
export interface FormKitWebMCPOptions {
  /**
   * The model context to register tools with. Defaults to
   * `document.modelContext`, then `navigator.modelContext`. When none is
   * found the plugin does nothing.
   */
  modelContext?: FormKitModelContext
  /**
   * Return `false` to keep a form from being exposed. Forms with
   * `data-agent="off"` are always skipped.
   */
  forms?: (node: FormKitNode) => boolean | undefined | void
  /**
   * Include current values in the `describe` tool's result (password and
   * hidden values are always redacted). Defaults to `false`.
   */
  values?: boolean
  /**
   * Register a `formkit_submit_<id>` tool. Defaults to `false`.
   */
  submit?: boolean
  /**
   * Let agents fill sensitive inputs (`password`). By default they are left
   * out of the fill schema and fills to them are refused. Their values are
   * never returned either way. Defaults to `false`.
   */
  sensitive?: boolean
  /**
   * Transform a tool's JSON result before it is returned to the agent, e.g.
   * to wrap it as MCP content with {@link webMCPTextResult}. By default the
   * plain JSON object is returned.
   */
  wrapResult?: (result: unknown, tool: FormKitWebMCPToolKind) => unknown
}

/**
 * Wraps a result as MCP-style text content:
 * `{ content: [{ type: 'text', text: JSON.stringify(result) }] }`. Pass it as
 * `wrapResult` for agents/polyfills that expect MCP `CallToolResult`s.
 *
 * @public
 */
export function webMCPTextResult(result: unknown): {
  content: Array<{ type: 'text'; text: string }>
} {
  return { content: [{ type: 'text', text: JSON.stringify(result) }] }
}

/**
 * **Experimental.** Exposes every `type="form"` node to in-browser AI agents
 * through the [WebMCP](https://github.com/webmachinelearning/webmcp) proposal
 * (`document.modelContext` / `navigator.modelContext`). Each form registers
 * `formkit_describe_<id>`, `formkit_fill_<id>` and (with `submit: true`)
 * `formkit_submit_<id>` tools built on {@link describeForm} and
 * {@link fillForm}. Tools are unregistered when the form is destroyed.
 * Does nothing when WebMCP is unavailable (including during SSR).
 *
 * The WebMCP API is still a draft, so this plugin may change in minor
 * releases.
 *
 * ```ts
 * import { createWebMCPPlugin } from '@formkit/addons'
 *
 * defaultConfig({ plugins: [createWebMCPPlugin({ submit: true })] })
 * ```
 *
 * @param options - {@link FormKitWebMCPOptions}
 *
 * @public
 */
export function createWebMCPPlugin(
  options: FormKitWebMCPOptions = {}
): FormKitPlugin {
  return function webMCPPlugin(node: FormKitNode) {
    if (node.props.type !== 'form') return
    const modelContext = options.modelContext ?? findModelContext()
    if (!modelContext || typeof modelContext.registerTool !== 'function') return

    let registered: Array<() => void> = []
    let signature = ''
    let scheduled = false
    let destroyed = false

    const unregisterAll = () => {
      for (const unregister of registered) unregister()
      registered = []
      signature = ''
    }

    const sync = () => {
      scheduled = false
      if (destroyed) return
      if (!isExposed(node, options)) return unregisterAll()
      const tools = createTools(node, options)
      // Only re-register when something an agent would see has changed.
      const next = JSON.stringify(
        tools.map(({ name, description, inputSchema }) => [
          name,
          description,
          inputSchema,
        ])
      )
      if (next === signature) return
      unregisterAll()
      signature = next
      for (const tool of tools) {
        const unregister = register(modelContext, tool)
        if (unregister) registered.push(unregister)
      }
    }

    // Children, ids and options arrive after the form node is created, so
    // registration is batched into a microtask and refreshed on changes.
    const schedule = () => {
      if (scheduled || destroyed) return
      scheduled = true
      Promise.resolve().then(sync)
    }

    schedule()
    node.on('child', schedule)
    node.on('childRemoved', schedule)
    node.on('prop', ({ payload }) => {
      if (WATCHED_PROPS.has(payload?.prop)) schedule()
    })
    node.on('destroyed', () => {
      destroyed = true
      unregisterAll()
    })
  }
}

/**
 * Props (on the form or any descendant — prop events bubble) that change
 * the generated tools.
 */
const WATCHED_PROPS = new Set<unknown>([
  'id',
  'label',
  'help',
  'options',
  'disabled',
  'multiple',
  'attrs',
  'parsedRules',
])

function findModelContext(): FormKitModelContext | undefined {
  const g = globalThis as any
  return g.document?.modelContext ?? g.navigator?.modelContext
}

function isExposed(node: FormKitNode, options: FormKitWebMCPOptions): boolean {
  if (node.props.attrs?.['data-agent'] === 'off') return false
  return options.forms?.(node) !== false
}

/**
 * Register a tool and return a function that unregisters it, whichever
 * draft API shape the model context implements.
 */
function register(
  modelContext: FormKitModelContext,
  tool: FormKitWebMCPTool
): (() => void) | undefined {
  const controller =
    typeof AbortController !== 'undefined' ? new AbortController() : undefined
  let handle: unknown
  try {
    handle = modelContext.registerTool(
      tool,
      controller ? { signal: controller.signal } : undefined
    )
  } catch {
    // Duplicate names (two forms with the same id) or a rejected schema.
    return undefined
  }
  let resolved: unknown = handle
  if (handle && typeof (handle as Promise<unknown>).then === 'function') {
    resolved = undefined
    ;(handle as Promise<unknown>).then(
      (value) => (resolved = value),
      () => undefined
    )
  }
  return () => {
    controller?.abort()
    const unregister = (resolved as { unregister?: unknown } | undefined)
      ?.unregister
    try {
      if (typeof unregister === 'function') unregister.call(resolved)
      else if (typeof modelContext.unregisterTool === 'function') {
        modelContext.unregisterTool(tool.name)
      }
    } catch {
      // Already unregistered.
    }
  }
}

/**
 * Sanitize a form id for use in a tool name: lowercase `[a-z0-9_]`.
 */
export function webMCPToolId(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9_]/g, '_')
}

function createTools(
  node: FormKitNode,
  options: FormKitWebMCPOptions
): FormKitWebMCPTool[] {
  const id = webMCPToolId(String(node.props.id ?? node.name))
  const notFillable = new Set(
    options.sensitive === true ? NOT_FILLABLE : [...NOT_FILLABLE, ...SENSITIVE]
  )
  const shape = describeForm(node)
  const title = formTitle(node, shape)
  const wrap = (kind: FormKitWebMCPToolKind, result: unknown) =>
    options.wrapResult ? options.wrapResult(result, kind) : result

  const tools: FormKitWebMCPTool[] = [
    {
      name: `formkit_describe_${id}`,
      description: `Describe the ${title}: every field's address, type, label, validation rules, options, validity and error messages${
        options.values ? ', and current values (passwords are never included)' : ''
      }. Call this before filling the form.`,
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true },
      execute: async () =>
        wrap('describe', describeForm(node, { values: options.values ?? false })),
    },
    {
      name: `formkit_fill_${id}`,
      description: `Fill in the ${title}. Pass \`values\` keyed by field address (from formkit_describe_${id}); for fields with options, give an option value or its label. Values are entered as if a user typed them, then validated. Returns which fields were written and any validation errors. Does not submit the form.`,
      inputSchema: fillSchema(shape, notFillable),
      execute: async (args) => {
        const { values, strict } = parseArgs(args)
        if (!values || typeof values !== 'object' || Array.isArray(values)) {
          return wrap('fill', { error: '`values` must be an object.' })
        }
        const blocked = blockedAddresses(
          node,
          notFillable,
          values as Record<string, unknown>
        )
        if (blocked.length) {
          return wrap('fill', {
            error: `These fields cannot be filled by an agent: ${blocked.join(', ')}`,
          })
        }
        try {
          const result: FormKitFillResult = await fillForm(
            node,
            values as Record<string, unknown>,
            { strict: strict === true }
          )
          return wrap('fill', result)
        } catch (err) {
          return wrap('fill', {
            error: err instanceof Error ? err.message : String(err),
          })
        }
      },
    },
  ]

  if (options.submit === true) {
    tools.push({
      name: `formkit_submit_${id}`,
      description: `Submit the ${title} through its normal submit handler (validation runs first; an invalid form is not submitted). Returns whether it is valid, whether it was submitted, and any errors.`,
      inputSchema: { type: 'object', properties: {} },
      annotations: { consequentialHint: true },
      execute: async () => wrap('submit', await submitNode(node)),
    })
  }
  return tools
}

function formTitle(node: FormKitNode, shape: FormKitFieldDescription): string {
  const name = shape.label ?? node.props.attrs?.['aria-label'] ?? node.name
  return `"${String(name)}" form`
}

function parseArgs(args: unknown): Record<string, unknown> {
  // Early drafts passed arguments as a JSON string.
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args)
    } catch {
      return {}
    }
  }
  return args && typeof args === 'object' ? (args as Record<string, unknown>) : {}
}

async function submitNode(node: FormKitNode) {
  let submitted: boolean | undefined
  let submitError: string | undefined
  if (typeof node.context?.handlers?.submit === 'function') {
    // fillForm with no values runs the form's own submit handler (and
    // waits for it), so validation and onSubmit behave as for a user.
    const result = await fillForm(node, {}, { submit: true })
    submitted = result.submitted
    submitError = result.submitError
  } else {
    node.submit()
    await node.settled
  }
  const shape = describeForm(node)
  const result: Record<string, unknown> = {
    valid: shape.valid,
    errors: collectErrors(shape),
  }
  if (submitted !== undefined) result.submitted = submitted
  if (submitError !== undefined) result.submitError = submitError
  return result
}

function collectErrors(
  shape: FormKitFieldDescription
): Array<{ address: string; errors: string[] }> {
  const out: Array<{ address: string; errors: string[] }> = []
  const walk = (field: FormKitFieldDescription) => {
    if (field.errors.length) {
      out.push({ address: field.address, errors: field.errors })
    }
    field.children?.forEach(walk)
  }
  walk(shape)
  return out
}

/**
 * Input types an agent may never fill: app-controlled or not values at all.
 */
const NOT_FILLABLE = ['hidden', 'button', 'submit']
/**
 * Input types an agent may fill only with `sensitive: true`.
 */
const SENSITIVE = ['password']
/**
 * Addresses in `values` (flat dot addresses or nested objects/arrays) that
 * point at non-fillable inputs like `hidden` — app-controlled values such as
 * tokens or ids that an agent must not overwrite.
 */
function blockedAddresses(
  node: FormKitNode,
  notFillable: Set<string>,
  values: Record<string, unknown>
): string[] {
  const locked: string[] = []
  const walk = (field: FormKitFieldDescription) => {
    if (field.nodeType === 'input') {
      if (field.address && notFillable.has(field.type)) locked.push(field.address)
    } else field.children?.forEach(walk)
  }
  walk(describeForm(node))
  if (!locked.length) return []
  const blocked: string[] = []
  const visit = (value: unknown, prefix: string) => {
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      const address = prefix ? `${prefix}.${key}` : key
      if (locked.includes(address)) blocked.push(address)
      else if (locked.some((a) => a.startsWith(`${address}.`))) visit(child, address)
    }
  }
  visit(values, '')
  return blocked
}

const NUMERIC = new Set(['number', 'range', 'slider', 'rating'])
const BOOLEAN = new Set(['toggle'])
const FORMATS: Record<string, string> = {
  email: 'email',
  url: 'uri',
  date: 'date',
  'datetime-local': 'date-time',
  time: 'time',
}

function fillSchema(
  shape: FormKitFieldDescription,
  notFillable: Set<string>
): FormKitJSONSchema {
  const properties: Record<string, FormKitJSONSchema> = {}
  const walk = (field: FormKitFieldDescription) => {
    if (field.disabled) return
    if (field.nodeType === 'input') {
      if (field.address && !notFillable.has(field.type)) {
        properties[field.address] = fieldSchema(field)
      }
      return
    }
    field.children?.forEach(walk)
  }
  walk(shape)
  return {
    type: 'object',
    properties: {
      values: {
        type: 'object',
        description:
          'Field values keyed by field address (e.g. "email", "address.city").',
        properties,
        additionalProperties: false,
      },
      strict: {
        type: 'boolean',
        description:
          'When true, nothing is written if any address is unknown, any option does not match, or any field would be skipped.',
      },
    },
    required: ['values'],
  }
}

function fieldSchema(field: FormKitFieldDescription): FormKitJSONSchema {
  const options = field.options?.filter((option) => !option.disabled)
  const enumValues = options?.length
    ? options.map((option) => option.value)
    : undefined
  const isArray =
    field.multiple ||
    (field.type === 'checkbox' && !!field.options?.length) ||
    field.type === 'taglist' ||
    field.type === 'transferlist'
  let scalar: FormKitJSONSchema
  if (enumValues) {
    scalar = { enum: enumValues }
    const type = commonType(enumValues)
    if (type) scalar = { type, enum: enumValues }
  } else if (NUMERIC.has(field.type)) {
    scalar = { type: 'number' }
  } else if (BOOLEAN.has(field.type) || field.type === 'checkbox') {
    scalar = { type: 'boolean' }
  } else {
    scalar = { type: 'string' }
    if (FORMATS[field.type]) scalar.format = FORMATS[field.type]
  }
  const schema: FormKitJSONSchema = isArray
    ? { type: 'array', items: scalar }
    : scalar
  const description = describeField(field, options)
  if (description) schema.description = description
  return schema
}

function commonType(values: unknown[]): string | undefined {
  const types = new Set(
    values.map((v) =>
      v === null ? 'null' : typeof v === 'number' ? 'number' : typeof v
    )
  )
  if (types.size !== 1) return undefined
  const [type] = types
  return type === 'string' || type === 'number' || type === 'boolean'
    ? type
    : undefined
}

function describeField(
  field: FormKitFieldDescription,
  options?: FormKitFieldDescription['options']
): string {
  const parts: string[] = []
  if (field.label) parts.push(field.label)
  if (field.help) parts.push(field.help)
  if (field.required) parts.push('Required.')
  const rules = field.rules
    .filter((rule) => rule.name !== 'required')
    .map((rule) =>
      rule.args.length ? `${rule.name}:${rule.args.join(',')}` : rule.name
    )
  if (rules.length) parts.push(`Rules: ${rules.join(', ')}.`)
  if (options?.some((option) => option.label !== String(option.value))) {
    parts.push(
      `Options: ${options
        .map((option) => `${option.label} = ${JSON.stringify(option.value)}`)
        .join('; ')}.`
    )
  }
  return parts.join(' ')
}
