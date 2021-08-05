import { createNode } from '@formkit/core'
import before from '../src/before'

describe('before rule', () => {
  const today = new Date()
  const tomorrow = new Date()
  const yesterday = new Date()
  tomorrow.setDate(today.getDate() + 1)
  yesterday.setDate(today.getDate() - 1)

  it('fails with tomorrow’s date object', () =>
    expect(before(createNode({ value: tomorrow }))).toBe(false))

  it('fails with future date', () =>
    expect(before(createNode({ value: 'January 15, 2999' }))).toBe(false))

  it('fails with long past date', () =>
    expect(before(createNode({ value: yesterday }), 'Jan 15, 2000')).toBe(
      false
    ))

  it('passes with yesterday’s date', () =>
    expect(before(createNode({ value: yesterday }))).toBe(true))

  it('passes with old date string', () =>
    expect(before(createNode({ value: 'January, 2000' }))).toBe(true))

  it('fails with invalid value', () =>
    expect(before(createNode({ value: '' }))).toBe(false))
})
