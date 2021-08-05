import { createNode } from '@formkit/core'
import before from '../src/before'

describe('before rule', () => {
  const today = new Date()
  const tomorrow = new Date()
  const yesterday = new Date()
  tomorrow.setDate(today.getDate() + 1)
  yesterday.setDate(today.getDate() - 1)
  const node = createNode()

  it('fails with tomorrow’s date object', () =>
    expect(before({ value: tomorrow, node })).toBe(false))

  it('fails with future date', () =>
    expect(before({ value: 'January 15, 2999', node })).toBe(false))

  it('fails with long past date', () =>
    expect(before({ value: yesterday, node }, 'Jan 15, 2000')).toBe(false))

  it('passes with yesterday’s date', () =>
    expect(before({ value: yesterday, node })).toBe(true))

  it('passes with old date string', () =>
    expect(before({ value: 'January, 2000', node })).toBe(true))

  it('fails with invalid value', () =>
    expect(before({ value: '', node })).toBe(false))
})
