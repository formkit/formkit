import { createNode } from '@formkit/core'
import between from '../src/between'

describe('between rule', () => {
  const node = createNode()

  it('passes with simple number', () =>
    expect(between({ value: 5, node }, 0, 10)).toBe(true))

  it('passes with simple number string', () =>
    expect(between({ value: '5', node }, '0', '10')).toBe(true))

  it('passes with decimal number string', () =>
    expect(between({ value: '0.5', node }, '0', '1')).toBe(true))

  it('fails with number to small', () =>
    expect(between({ value: 0, node }, 3, 10)).toBe(false))

  it('fails with number to large', () =>
    expect(between({ value: 15, node }, 3, 10)).toBe(false))

  it('passes when using upper border inclusive value', () =>
    expect(between({ value: 10, node }, 1, 10)).toBe(true))

  it('passes when using lower border inclusive value', () =>
    expect(between({ value: 1, node }, 1, 10)).toBe(true))

  it('passes when using lower border string inclusive value', () =>
    expect(between({ value: '5', node }, '5', '5.5')).toBe(true))
})
