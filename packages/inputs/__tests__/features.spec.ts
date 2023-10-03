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
