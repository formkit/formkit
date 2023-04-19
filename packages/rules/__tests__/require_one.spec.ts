import { createNode } from '@formkit/core'
import require_one from '../src/require_one'
import { describe, expect, it } from 'vitest'

describe('require_one rule', () => {
  it('fails on an empty string', () =>
    expect(require_one(createNode({ value: '' }))).toBe(false))

  it('fails on an empty string', () =>
    expect(require_one(createNode({ value: 'test' }))).toBe(true))

})
