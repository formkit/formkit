import { createNode } from '@formkit/core'
import require_one from '../src/require_one'
import { describe, expect, it } from 'vitest'

describe('require_one rule', () => {
  it('fails on an empty string', () =>
    expect(require_one(createNode({ value: '' }))).toBe(false))

  it('passes on when it has a value but no argument', () =>
    expect(require_one(createNode({ value: 'test' }))).toBe(true))

  it('can infer a sibling has value', () => {
    const form = createNode({ type: 'group' })
    const childA = createNode({ parent: form, name: 'foo' })
    createNode({ parent: form, name: 'bar', value: 'baz' })
    expect(require_one(childA, 'bar')).toBe(true)
  })

  it('fails to infer a sibling has value', () => {
    const form = createNode({ type: 'group' })
    const childA = createNode({ parent: form, name: 'foo' })
    createNode({ parent: form, name: 'bar' })
    expect(require_one(childA, 'bar')).toBe(false)
  })

  it('fails when argument targets an input that doest exist', () => {
    const form = createNode({ type: 'group' })
    const childA = createNode({ parent: form, name: 'foo' })
    createNode({ parent: form, name: 'bar', value: 'baz' })
    expect(require_one(childA, 'baz')).toBe(false)
  })

  it('passes when target sets a value', () => {
    const form = createNode({ type: 'group' })
    const childA = createNode({ parent: form, name: 'foo' })
    const childB = createNode({ parent: form, name: 'bar', value: 'baz' })
    expect(require_one(childA, 'bar')).toBe(false)
    childB.input('value', false)
    expect(require_one(childA, 'bar')).toBe(true)
  })
})
