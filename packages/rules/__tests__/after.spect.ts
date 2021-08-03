import { createNode } from '@formkit/core'
import after from '../src/after'

describe('after rule', () => {
  const today = new Date()
  const tomorrow = new Date()
  const yesterday = new Date()
  tomorrow.setDate(today.getDate() + 1)
  yesterday.setDate(today.getDate() - 1)
  const node = createNode()

  it('passes with tomorrow’s date object', () =>
    expect(after({ value: tomorrow, node })).toBe(true))

  it('passes with future date', () =>
    expect(after({ value: 'January 15, 2999', node })).toBe(true))

  it('passes with long past date', () =>
    expect(after({ value: yesterday, node }, 'Jan 15, 2000')).toBe(true))

  it('fails with yesterday’s date', () =>
    expect(after({ value: yesterday, node })).toBe(false))

  it('fails with old date string', () =>
    expect(after({ value: 'January, 2000', node })).toBe(false))

  it('fails with invalid value', () =>
    expect(after({ value: '', node })).toBe(false))
})
