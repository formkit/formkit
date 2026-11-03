import { createNode } from '@formkit/core'
import { createLibraryPlugin } from '../src/index'
import formatsOptions, { normalizeOptions } from '../src/features/options'
import { describe, expect, it } from 'vitest'

describe('options', () => {
  it('can convert an array of strings', () => {
    const node = createNode({
      plugins: [
        createLibraryPlugin({
          foo: {
            type: 'input',
            features: [formatsOptions],
            props: ['options'],
          },
        }),
      ],
      props: {
        type: 'foo',
        attrs: {
          options: ['foo', 'bar'],
        },
      },
    })
    expect(node.props.options).toEqual([
      {
        label: 'foo',
        value: 'foo',
      },
      {
        label: 'bar',
        value: 'bar',
      },
    ])
  })
  it('can recursively handle options with nested groups', () => {
    const testOptionsWithGroups = [
      {
        group: 'FormKit',
        options: ['#ff985d', '#f7ce68', '#FFFFFF', '#2b2b35'],
      },
      {
        group: 'Other',
        options: [
          {
            label: 'Red',
            value: '#ff0000',
          },
        ],
      },
    ]
    const normalizedOptionsWithGroups = normalizeOptions(testOptionsWithGroups)
    expect(normalizedOptionsWithGroups).toEqual([
      {
        group: 'FormKit',
        options: [
          {
            label: '#ff985d',
            value: '#ff985d',
          },
          {
            label: '#f7ce68',
            value: '#f7ce68',
          },
          {
            label: '#FFFFFF',
            value: '#FFFFFF',
          },
          {
            label: '#2b2b35',
            value: '#2b2b35',
          },
        ],
      },
      {
        group: 'Other',
        options: [
          {
            label: 'Red',
            value: '#ff0000',
          },
        ],
      },
    ])
  })
  it('can recursively handle options with groups of masked values', () => {
    expect(
      normalizeOptions([
        {
          group: 'Foo',
          options: [
            { label: 'A', value: 0 },
            { label: 'B', value: 1 },
          ],
        },
        {
          group: 'Bar',
          options: [
            { label: 'D', value: 3 },
            { label: 'E', value: 4 },
          ],
        },
      ])
    ).toEqual([
      {
        group: 'Foo',
        options: [
          { __original: 0, label: 'A', value: '__mask_1' },
          { __original: 1, label: 'B', value: '__mask_2' },
        ],
      },
      {
        group: 'Bar',
        options: [
          { __original: 3, label: 'D', value: '__mask_3' },
          { __original: 4, label: 'E', value: '__mask_4' },
        ],
      },
    ])
  })

  it('can take a function and sets the optionsLoader prop and assigns an empty array', () => {
    const node = createNode({
      plugins: [
        createLibraryPlugin({
          foo: {
            type: 'input',
            features: [formatsOptions],
            props: ['options'],
          },
        }),
      ],
      props: {
        type: 'foo',
        attrs: {
          options: () => new Promise(() => {}),
        },
      },
    })
    expect(node.props.options).toEqual([])
    expect(node.props.optionsLoader).toBeDefined()
  })
})

describe('normalizeOptions does not mutate user options (#1550)', () => {
  it('leaves non-string option values and groups untouched', () => {
    const original = [
      { label: 'One', value: 1 },
      { label: 'Obj', value: { id: 2 } },
      { group: 'G', options: [{ label: 'Three', value: 3 }] },
      { label: 'Str', value: 's' },
    ]
    const snapshot = JSON.parse(JSON.stringify(original))
    const normalized = normalizeOptions(original as any) as any[]
    expect(original).toEqual(snapshot)
    expect(normalized[0].value).toMatch(/^__mask_\d+$/)
    expect(normalized[0].__original).toBe(1)
    expect('__original' in normalized[0]).toBe(true)
    expect(normalized[1].__original).toEqual({ id: 2 })
    expect(normalized[2].options[0].__original).toBe(3)
    expect(original[2].options![0]).toEqual({ label: 'Three', value: 3 })
    // String values are passed through as-is (same object).
    expect(normalized[3]).toBe(original[3])
    // Spreading / serializing the normalized option shows the masked view.
    expect({ ...normalized[0] }).toEqual({ label: 'One', value: normalized[0].value, __original: 1 })
  })

  it('forwards other reads to the original (e.g. labels changed in place)', () => {
    const option = { label: 'Before', value: 1 }
    const [normalized] = normalizeOptions([option]) as any[]
    option.label = 'After'
    expect(normalized.label).toBe('After')
  })
})
