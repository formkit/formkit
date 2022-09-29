import { createNode } from '@formkit/core'
import accepted from '../src/accepted'

describe('accepted rule', () => {
  it('passes with true', () =>
    expect(accepted(createNode({ value: 'yes' }))).toBe(true))

  it('passes with on', () =>
    expect(accepted(createNode({ value: 'on' }))).toBe(true))

  it('passes with 1', () =>
    expect(accepted(createNode({ value: '1' }))).toBe(true))

  it('passes with number 1', () =>
    expect(accepted(createNode({ value: 1 }))).toBe(true))

  it('passes with boolean true', () =>
    expect(accepted(createNode({ value: true }))).toBe(true))

  it('fail with boolean false', () =>
    expect(accepted(createNode({ value: false }))).toBe(false))

  it('fail with "false"', () =>
    expect(accepted(createNode({ value: 'false' }))).toBe(false))

  it('fail when empty', () =>
    expect(accepted(createNode({ value: '' }))).toBe(false))
})
