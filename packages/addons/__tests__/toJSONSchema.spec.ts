import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'
import { toJSONSchema } from '../src/plugins/toJSONSchema'

function input(
  name: string,
  props: Record<string, unknown> = {},
  value?: unknown
) {
  return createNode({ name, type: 'input', props, value })
}
function rules(...entries: unknown[][]) {
  return entries.map(([name, ...args]) => ({ name, args }))
}
function form(children: any[]) {
  return createNode({
    type: 'group',
    name: 'form',
    props: { type: 'form' },
    children
  })
}

describe('toJSONSchema', () => {
  it('maps nested groups, lists, omission, defaults and strict objects', () => {
    const row = createNode({
      type: 'group',
      name: '0',
      children: [
        input(
          'city',
          { type: 'text', parsedRules: rules(['required']) },
          'Paris'
        )
      ]
    })
    const list = createNode({
      type: 'list',
      name: 'addresses',
      props: { parsedRules: rules(['length', 1, 3]) },
      children: [row]
    })
    const node = form([
      list,
      input('secret', { type: 'password' }, 'private'),
      input('disabled', { disabled: true }),
      input('ignored', { ignore: true })
    ])
    const schema = toJSONSchema(node, { values: true, strict: true }) as any
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
    expect(schema.required).toEqual(['addresses', 'secret'])
    expect(schema.additionalProperties).toBe(false)
    expect(schema.properties.addresses).toMatchObject({
      type: 'array',
      minItems: 1,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['city'],
        properties: { city: { default: 'Paris' } }
      }
    })
    expect(schema.properties.secret).not.toHaveProperty('default')
    expect(schema.properties).not.toHaveProperty('disabled')
    expect(schema.properties).not.toHaveProperty('ignored')
  })
  it('maps validation and preserves rules that cannot be expressed', () => {
    const node = form([
      input('text', {
        type: 'text',
        label: 'Text',
        help: 'Help',
        parsedRules: rules(
          ['required'],
          ['length', '2', '5'],
          ['matches', /^a+$/],
          ['confirm'],
          ['matches', /abc/i],
          ['custom', 'x']
        )
      }),
      input('amount', {
        type: 'number',
        parsedRules: rules(['min', 1], ['max', 8])
      }),
      input('count', {
        type: 'text',
        number: 'integer',
        parsedRules: rules(['between', 9, 2])
      }),
      input('choices', {
        type: 'select',
        options: [
          { label: 'First', value: 'a' },
          { label: 'Second', value: 'b' }
        ]
      }),
      input('allowed', {
        type: 'text',
        parsedRules: rules(['is', 'yes', 'no'])
      })
    ])
    const schema = toJSONSchema(node, {
      labels: true,
      dialect: 'draft-07'
    }) as any
    expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#')
    expect(schema.required).toEqual(['text'])
    expect(schema.properties.text).toMatchObject({
      type: 'string',
      title: 'Text',
      minLength: 2,
      maxLength: 5,
      pattern: '^a+$',
      'x-formkit-rules': [
        { name: 'confirm', args: [] },
        { name: 'matches', args: ['/abc/i'] },
        { name: 'custom', args: ['x'] }
      ]
    })
    expect(schema.properties.text.description).toContain('matches:/abc/i')
    expect(schema.properties.amount).toMatchObject({
      type: 'number',
      minimum: 1,
      maximum: 8
    })
    expect(schema.properties.count).toMatchObject({
      type: 'integer',
      minimum: 2,
      maximum: 9
    })
    expect(schema.properties.choices).toMatchObject({
      enum: ['a', 'b'],
      oneOf: [
        { const: 'a', title: 'First' },
        { const: 'b', title: 'Second' }
      ]
    })
    expect(schema.properties.allowed.enum).toEqual(['yes', 'no'])
    expect((toJSONSchema(node) as any).properties.choices.oneOf).toBeUndefined()
  })
  it('maps formats and multiple choice arrays', () => {
    const node = form(
      ['email', 'url', 'date', 'datetime-local', 'time']
        .map((type) => input(type, { type }))
        .concat([
          input('multi', {
            type: 'select',
            multiple: true,
            options: ['a', 'b'],
            parsedRules: rules(['length', 1, 2])
          })
        ])
    )
    const properties = (toJSONSchema(node) as any).properties
    expect(
      ['email', 'url', 'date', 'datetime-local', 'time'].map(
        (type) => properties[type].format
      )
    ).toEqual(['email', 'uri', 'date', 'date-time', 'time'])
    expect(properties.multi).toMatchObject({
      type: 'array',
      minItems: 1,
      maxItems: 2,
      items: { enum: ['a', 'b'] }
    })
  })
})
