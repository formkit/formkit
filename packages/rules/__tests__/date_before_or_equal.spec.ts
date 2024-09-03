import { createNode } from '@formkit/core'
import beforeOrEqual from '../src/date_before_or_equal'
import { describe, expect, it } from 'vitest'

describe('before or equal rule', () => {
  const today = new Date()
  const tomorrow = new Date()
  const yesterday = new Date()
  tomorrow.setDate(today.getDate() + 1)
  yesterday.setDate(today.getDate() - 1)

  it('passes with today’s date object', () =>
    expect(beforeOrEqual(createNode({ value: today }))).toBe(true))

  it('fails with tomorrow’s date object', () =>
    expect(beforeOrEqual(createNode({ value: tomorrow }))).toBe(false))

  it('fails with future date', () =>
    expect(beforeOrEqual(createNode({ value: 'January 15, 2999' }))).toBe(false))

  it('fails with long past date', () =>
    expect(beforeOrEqual(createNode({ value: yesterday }), 'Jan 15, 2000')).toBe(
      false
    ))

  it('passes with yesterday’s date', () =>
    expect(beforeOrEqual(createNode({ value: yesterday }))).toBe(true))

  it('passes with old date string', () =>
    expect(beforeOrEqual(createNode({ value: 'January, 2000' }))).toBe(true))

  it('fails with invalid value', () =>
    expect(beforeOrEqual(createNode({ value: '' }))).toBe(false))
})
