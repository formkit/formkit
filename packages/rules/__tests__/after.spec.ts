import { createNode } from '@formkit/core'
import after from '../src/after'

describe('after rule', () => {
  const today = new Date()
  const tomorrow = new Date()
  const yesterday = new Date()
  tomorrow.setDate(today.getDate() + 1)
  yesterday.setDate(today.getDate() - 1)

  it('passes with tomorrow’s date object', () =>
    expect(after(createNode({ value: tomorrow }))).toBe(true))

  it('passes with future date', () =>
    expect(after(createNode({ value: 'January 15, 2999' }))).toBe(true))

  it('passes with long past date', () =>
    expect(after(createNode({ value: yesterday }), 'Jan 15, 2000')).toBe(true))

  it('fails with yesterday’s date', () =>
    expect(after(createNode({ value: yesterday }))).toBe(false))

  it('fails with old date string', () =>
    expect(after(createNode({ value: 'January, 2000' }))).toBe(false))

  it('fails with invalid value', () =>
    expect(after(createNode({ value: '' }))).toBe(false))
})
