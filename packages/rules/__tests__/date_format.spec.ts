import date_format from '../src/date_format'
import { createNode } from '@formkit/core'

describe('date', () => {
  it('passes with month day year', () =>
    expect(date_format(createNode({ value: 'December 17, 2020' }))).toBe(true))

  it('passes with month day', () =>
    expect(date_format(createNode({ value: 'December 17' }))).toBe(true))

  it('passes with short month day', () =>
    expect(date_format(createNode({ value: 'Dec 17' }))).toBe(true))

  it('passes with short month day', () =>
    expect(date_format(createNode({ value: 'Dec 17 12:34:15' }))).toBe(true))

  it('passes with out of bounds number', () =>
    expect(date_format(createNode({ value: 'January 77' }))).toBe(true))

  it('passes with only month', () =>
    expect(date_format(createNode({ value: 'January' }))).toBe(false))

  it('passes with valid date format', () =>
    expect(date_format(createNode({ value: '12/10/1987' }), 'MM/DD/YYYY')).toBe(
      true
    ))

  it('passes with date ending in zero', () =>
    expect(date_format(createNode({ value: '12/10/1987' }), 'MM/D/YYYY')).toBe(
      true
    ))

  it('fails with simple number and date format', () =>
    expect(date_format(createNode({ value: '1234' }), 'MM/DD/YYYY')).toBe(
      false
    ))

  it('fails with only day of week', () =>
    expect(date_format(createNode({ value: 'saturday' }))).toBe(false))

  it('fails with random string', () =>
    expect(date_format(createNode({ value: 'Pepsi 17' }))).toBe(false))

  it('fails with random number', () =>
    expect(date_format(createNode({ value: '1872301237' }))).toBe(false))
})
