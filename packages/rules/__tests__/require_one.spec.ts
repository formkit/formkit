import { createNode } from '@formkit/core'
import require_one from '../src/require_one'

describe('require_one rule', () => {
  it('fails on an empty string', () =>
    expect(require_one(createNode({ value: '' }))).toBe(false))
})