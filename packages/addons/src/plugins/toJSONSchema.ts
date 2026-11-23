import type { FormKitNode } from '@formkit/core'
import { describeForm, type FormKitFieldDescription } from './describeForm'

/** A JSON Schema object. @public */
export type FormKitJSONSchema = Record<string, unknown>

/** Options for {@link toJSONSchema}. @public */
export interface FormKitToJSONSchemaOptions {
  /** Include current input values as defaults, except passwords and hidden inputs. */
  values?: boolean
  /** Close objects and require all their properties. */
  strict?: boolean
  /** JSON Schema dialect; defaults to 2020-12. */
  dialect?: '2020-12' | 'draft-07'
  /** Include option labels as oneOf titles. */
  labels?: boolean
}

/**
 * Allow `null` for an optional field (strict mode).
 */
function nullable(schema: FormKitJSONSchema): FormKitJSONSchema {
  const out: FormKitJSONSchema = { ...schema }
  if (typeof out.type === 'string') out.type = [out.type, 'null']
  else if (Array.isArray(out.type) && !out.type.includes('null'))
    out.type = [...out.type, 'null']
  if (Array.isArray(out.enum) && !out.enum.includes(null))
    out.enum = [...out.enum, null]
  if (!out.type && !out.enum) return { anyOf: [schema, { type: 'null' }] }
  return out
}

/** Convert a FormKit node into a JSON Schema. @public */
export function toJSONSchema(
  node: FormKitNode,
  options: FormKitToJSONSchemaOptions = {}
): FormKitJSONSchema {
  return {
    $schema:
      options.dialect === 'draft-07'
        ? 'http://json-schema.org/draft-07/schema#'
        : 'https://json-schema.org/draft/2020-12/schema',
    ...fieldToJSONSchema(
      describeForm(node, { values: options.values }),
      options
    )
  }
}

const NUMERIC = new Set(['number', 'range', 'slider', 'rating'])
const FORMATS: Record<string, string> = {
  email: 'email',
  url: 'uri',
  date: 'date',
  'datetime-local': 'date-time',
  time: 'time'
}

/** Shared by the public exporter and WebMCP's address-based fill schema. @internal */
export function fieldToJSONSchema(
  field: FormKitFieldDescription,
  options: FormKitToJSONSchemaOptions = {},
  webMCP = false
): FormKitJSONSchema {
  let schema: FormKitJSONSchema
  const choices = field.options?.filter((option) => !option.disabled)
  const isArray =
    field.nodeType === 'list' ||
    field.multiple ||
    (field.type === 'checkbox' && !!field.options?.length) ||
    field.type === 'taglist' ||
    field.type === 'transferlist'
  if (field.nodeType === 'group') {
    const properties: Record<string, FormKitJSONSchema> = {}
    const required: string[] = []
    for (const child of field.children ?? []) {
      if (child.disabled || child.ignore) continue
      const childSchema = fieldToJSONSchema(child, options)
      // Strict structured-output modes require every property to be listed in
      // `required`, so optional fields are made nullable instead.
      properties[child.name] =
        options.strict && !child.required ? nullable(childSchema) : childSchema
      if (child.required || options.strict) required.push(child.name)
    }
    schema = { type: 'object', properties }
    if (required.length) schema.required = required
    if (options.strict) schema.additionalProperties = false
  } else if (field.nodeType === 'list') {
    const items = (field.children ?? [])
      .filter((child) => !child.disabled && !child.ignore)
      .map((child) => fieldToJSONSchema(child, options))
    const unique = [
      ...new Map(items.map((item) => [JSON.stringify(item), item])).values()
    ]
    schema = {
      type: 'array',
      items:
        unique.length === 0
          ? {}
          : unique.length === 1
            ? unique[0]
            : { anyOf: unique }
    }
  } else {
    const isRule = field.rules.find(
      (rule) => rule.name === 'is' && rule.args.length
    )
    const values = choices?.length
      ? choices.map((choice) => choice.value)
      : isRule?.args
    let scalar: FormKitJSONSchema = {}
    if (values?.length) {
      const types = new Set(
        values.map((value) => (value === null ? 'null' : typeof value))
      )
      const type = [...types][0]
      if (
        types.size === 1 &&
        ['string', 'number', 'boolean', 'null'].includes(type)
      )
        scalar.type = type
      scalar.enum = values
      if (
        options.labels &&
        choices?.some((choice) => choice.label !== String(choice.value))
      ) {
        scalar.oneOf = choices.map((choice) => ({
          const: choice.value,
          title: choice.label
        }))
      }
    } else if (field.number || NUMERIC.has(field.type)) {
      scalar.type = field.number === 'integer' ? 'integer' : 'number'
    } else if (field.type === 'toggle' || field.type === 'checkbox') {
      scalar.type = 'boolean'
    } else {
      scalar.type = 'string'
      if (FORMATS[field.type]) scalar.format = FORMATS[field.type]
    }
    schema = isArray ? { type: 'array', items: scalar } : scalar
  }
  if (field.label && !webMCP) schema.title = field.label
  if (
    options.values &&
    'value' in field &&
    !field.redacted &&
    field.type !== 'password'
  )
    schema.default = field.value
  const unmapped: typeof field.rules = []
  for (const rule of field.rules) {
    const [a, b] = rule.args
    const number = (value: unknown) =>
      value !== undefined && value !== '' && Number.isFinite(Number(value))
        ? Number(value)
        : undefined
    const x = number(a),
      y = number(b)
    let mapped = false
    if (rule.name === 'required') mapped = true
    else if (rule.name === 'is' && rule.args.length && !choices?.length)
      mapped = true
    else if (
      rule.name === 'length' &&
      (schema.type === 'string' || schema.type === 'array')
    ) {
      const first = a === undefined ? 0 : parseInt(String(a), 10)
      const second = b === undefined ? Infinity : parseInt(String(b), 10)
      if (
        Number.isFinite(first) &&
        (Number.isFinite(second) || b === undefined) &&
        first >= 0 &&
        second >= 0
      ) {
        const min = Math.min(first, second),
          max = Math.max(first, second)
        schema[schema.type === 'array' ? 'minItems' : 'minLength'] = min
        if (Number.isFinite(max))
          schema[schema.type === 'array' ? 'maxItems' : 'maxLength'] = max
        mapped = true
      }
    } else if (
      (schema.type === 'number' || schema.type === 'integer') &&
      ['min', 'max', 'between'].includes(rule.name)
    ) {
      if (rule.name === 'min' && (x !== undefined || a === undefined)) {
        schema.minimum = x ?? 1
        mapped = true
      }
      if (rule.name === 'max' && (x !== undefined || a === undefined)) {
        schema.maximum = x ?? 10
        mapped = true
      }
      if (rule.name === 'between' && x !== undefined && y !== undefined) {
        schema.minimum = Math.min(x, y)
        schema.maximum = Math.max(x, y)
        mapped = true
      }
    } else if (
      rule.name === 'matches' &&
      schema.type === 'string' &&
      rule.args.length === 1 &&
      typeof a === 'string'
    ) {
      const regex = /^\/(.*)\/([a-z]*)$/.exec(a)
      if (regex && !regex[2]) {
        schema.pattern = regex[1]
        mapped = true
      }
    } else if (rule.name === field.type && FORMATS[field.type]) mapped = true
    if (!mapped) unmapped.push(rule)
  }
  if (unmapped.length) schema['x-formkit-rules'] = unmapped
  const descriptions = [field.help]
  if (unmapped.length)
    descriptions.push(
      `Rules: ${unmapped.map((rule) => (rule.args.length ? `${rule.name}:${rule.args.join(',')}` : rule.name)).join(', ')}.`
    )
  if (descriptions.filter(Boolean).length)
    schema.description = descriptions.filter(Boolean).join(' ')
  return schema
}
