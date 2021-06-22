import { createNameTree } from '../../../.jest/helpers'
import { bfs, eq } from '../src/utils'
import { FormKitNode } from '../src/node'
import { jest } from '@jest/globals'

describe('bfs', () => {
  it('searches the parent node first', () => {
    const parent = createNameTree()
    expect(bfs(parent, 'tommy')).toBe(parent)
  })

  it('searches for a name in the children', () => {
    const parent = createNameTree()
    expect(bfs(parent, 'wendy')).toBe(parent.at('wendy'))
  })

  it('allows changing the searched property', () => {
    const parent = createNameTree()
    expect(bfs(parent, '555', 'value')).toBe(parent.at('jane'))
  })

  it('allows a callback to determine the search parameters', () => {
    const parent = createNameTree()
    expect(
      bfs(
        parent,
        'radio',
        (node) => node.name !== 'jane' && node.value === '555'
      )
    ).toBe(parent.at('stella.tommy'))
  })

  it('returns undefined when unable to find a match', () => {
    const parent = createNameTree()
    expect(bfs(parent, 'jim')).toBe(undefined)
  })

  it('searches the entire tree', () => {
    const parent = createNameTree()
    const searcher = jest.fn((_node: FormKitNode) => false)
    bfs(parent, 'jim', searcher)
    expect(searcher.mock.calls.length).toBe(7)
  })
})

describe('eq', () => {
  it('evaluates simple primitives correctly', () => {
    expect(eq('123', '123')).toBe(true)
    expect(eq('123', 123)).toBe(false)
    expect(eq(true, true)).toBe(true)
    expect(eq(false, true)).toBe(false)
    expect(eq(function () {}, {})).toBe(false)
  })

  it('evaluates single depth objects correctly', () => {
    const t = { first: 'first', second: 'second' }
    expect(eq(t, t)).toBe(true)
    expect(eq({}, {})).toBe(true)
    expect(eq({ a: '123' }, { a: '123' })).toBe(true)
    expect(eq({ abc: 'abc' }, { abc: 'abc', def: 'def' })).toBe(false)
    expect(eq({ abc: 'abc' }, { abc: 'abcd' })).toBe(false)
    expect(eq(['first'], ['first'])).toBe(true)
    expect(eq(['first'], ['first', 'second'])).toBe(false)
    expect(eq([0, 2, 4, 6], [0, 2, 4, 6])).toBe(true)
  })

  it('evaluates deep objects correctly', () => {
    const t = { first: 'first', second: { name: 'second' } }
    expect(eq(t, t)).toBe(true)
    expect(
      eq(
        {
          name: {
            first: 'jane',
            last: 'flair',
          },
          age: 20,
        },
        {
          name: {
            first: 'jane',
            last: 'flair',
          },
          age: 20,
        }
      )
    ).toBe(true)
  })
  expect(
    eq(
      {
        name: {
          first: 'jane',
          last: 'DIFFERENT',
        },
        age: 20,
      },
      {
        name: {
          first: 'jane',
          last: 'flair',
        },
        age: 20,
      },
      false // Disable depth
    )
  ).toBe(false)
  expect(
    eq(
      {
        name: {
          first: 'jane',
          last: 'DIFFERENT',
        },
        age: 20,
      },
      {
        name: {
          first: 'jane',
          last: 'flair',
        },
        age: 20,
      }
    )
  ).toBe(false)
  expect(eq([{}], [{}])).toBe(true)
  expect(eq([{ a: 250 }], [{ b: { value: 250 } }])).toBe(false)
})
