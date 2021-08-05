import { createNode } from '@formkit/core'
import required from '../src/required'

describe('required rule', () => {
  it('fails on an empty string', () =>
    expect(required(createNode({ value: '' }))).toBe(false))

  it('passes on some letters', () =>
    expect(required(createNode({ value: 'foo' }))).toBe(true))

  it('passes on the value zero', () =>
    expect(required(createNode({ value: 0 }))).toBe(true))

  it('passes on the string zero', () =>
    expect(required(createNode({ value: '0' }))).toBe(true))

  it('passes on the value false', () =>
    expect(required(createNode({ value: false }))).toBe(true))

  it('fails on the undefined', () =>
    expect(required(createNode({ value: undefined }))).toBe(false))

  it('fails on null', () =>
    expect(required(createNode({ value: null }))).toBe(false))

  it('fails on an empty array', () =>
    expect(required(createNode({ value: [] }))).toBe(false))

  it('passes on an array with zero value', () =>
    expect(required(createNode({ value: [0] }))).toBe(true))

  it('fails on an empty object', () =>
    expect(required(createNode({ value: {} }))).toBe(false))

  it('passes on an object with a key', () =>
    expect(required(createNode({ value: { a: false } }))).toBe(true))
})
