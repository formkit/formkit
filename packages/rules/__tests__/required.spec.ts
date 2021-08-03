import { createNode } from '@formkit/core'
import required from '../src/required'

describe('required rule', () => {
  const node = createNode()
  it('fails on an empty string', () =>
    expect(required({ value: '', node })).toBe(false))

  it('passes on some letters', () =>
    expect(required({ value: 'foo', node })).toBe(true))

  it('passes on the value zero', () =>
    expect(required({ value: 0, node })).toBe(true))

  it('passes on the string zero', () =>
    expect(required({ value: '0', node })).toBe(true))

  it('passes on the value false', () =>
    expect(required({ value: false, node })).toBe(true))

  it('fails on the undefined', () =>
    expect(required({ value: undefined, node })).toBe(false))

  it('fails on null', () => expect(required({ value: null, node })).toBe(false))

  it('fails on an empty array', () =>
    expect(required({ value: [], node })).toBe(false))

  it('passes on an array with zero value', () =>
    expect(required({ value: [0], node })).toBe(true))

  it('fails on an empty object', () =>
    expect(required({ value: {}, node })).toBe(false))

  it('passes on an object with a key', () =>
    expect(required({ value: { a: false }, node })).toBe(true))
})
