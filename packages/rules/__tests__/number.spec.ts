import { createNode } from '@formkit/core'
import number from '../src/number'

describe('number', () => {
  const node = createNode()
  it('passes with simple number string', () =>
    expect(number({ value: '123', node })).toBe(true))

  it('passes with simple number', () =>
    expect(number({ value: 19832461234, node })).toBe(true))

  it('passes with float', () =>
    expect(number({ value: 198.32464, node })).toBe(true))

  it('passes with decimal in string', () =>
    expect(number({ value: '567.23', node })).toBe(true))

  it('fails with comma in number string', () =>
    expect(number({ value: '123,456', node })).toBe(false))

  it('fails with alpha', () =>
    expect(number({ value: '123sdf', node })).toBe(false))
})
