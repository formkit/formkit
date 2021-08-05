import { createNode } from '@formkit/core'
import accepted from '../src/accepted'

describe('accepted rule', () => {
  const node = createNode()
  it('passes with true', () =>
    expect(accepted({ value: 'yes', node })).toBe(true))

  it('passes with on', () => expect(accepted({ value: 'on', node })).toBe(true))

  it('passes with 1', () => expect(accepted({ value: '1', node })).toBe(true))

  it('passes with number 1', () =>
    expect(accepted({ value: 1, node })).toBe(true))

  it('passes with boolean true', () =>
    expect(accepted({ value: true, node })).toBe(true))

  it('fail with boolean false', () =>
    expect(accepted({ value: false, node })).toBe(false))

  it('fail with "false"', () =>
    expect(accepted({ value: 'false', node })).toBe(false))
})
