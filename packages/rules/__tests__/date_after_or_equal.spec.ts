import { createNode } from '@formkit/core'
import afterOrEqual from '../src/date_after_or_equal'
import { describe, expect, it } from 'vitest'

describe('date_after rule', () => {
  const today = new Date()
  const tomorrow = new Date()
  const yesterday = new Date()
  tomorrow.setDate(today.getDate() + 1)
  yesterday.setDate(today.getDate() - 1)

  it("passes with today's date object", () =>
    expect(afterOrEqual(createNode({ value: today }), today)).toBe(true))

  it("passes with tomorrow's date object", () =>
    expect(afterOrEqual(createNode({ value: tomorrow }))).toBe(true))

  it('passes with future date', () =>
    expect(afterOrEqual(createNode({ value: 'January 15, 2999' }))).toBe(true))

  it('passes with long past date', () =>
    expect(afterOrEqual(createNode({ value: yesterday }), 'Jan 15, 2000')).toBe(true))

  it("fails with yesterday's date", () =>
    expect(afterOrEqual(createNode({ value: yesterday }))).toBe(false))

  it('fails with old date string', () =>
    expect(afterOrEqual(createNode({ value: 'January, 2000' }))).toBe(false))

  it('fails with invalid value', () =>
    expect(afterOrEqual(createNode({ value: '' }))).toBe(false))
})
