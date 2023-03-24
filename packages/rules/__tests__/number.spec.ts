import { createNode } from '@formkit/core'
import number from '../src/number'
import { describe, expect, it } from 'vitest'

describe('number', () => {
  it('passes with simple number string', () =>
    expect(number(createNode({ value: '123' }))).toBe(true))

  it('passes with simple number', () =>
    expect(number(createNode({ value: 19832461234 }))).toBe(true))

  it('passes with float', () =>
    expect(number(createNode({ value: 198.32464 }))).toBe(true))

  it('passes with decimal in string', () =>
    expect(number(createNode({ value: '567.23' }))).toBe(true))

  it('fails with comma in number string', () =>
    expect(number(createNode({ value: '123,456' }))).toBe(false))

  it('fails with alpha', () =>
    expect(number(createNode({ value: '123sdf' }))).toBe(false))
})
