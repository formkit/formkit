import date_format from '../src/date_format'
import { createNode } from '@formkit/core'

describe('date', () => {
  const node = createNode()
  it('passes with month day year', () =>
    expect(date_format({ value: 'December 17, 2020', node })).toBe(true))

  it('passes with month day', () =>
    expect(date_format({ value: 'December 17', node })).toBe(true))

  it('passes with short month day', () =>
    expect(date_format({ value: 'Dec 17', node })).toBe(true))

  it('passes with short month day', () =>
    expect(date_format({ value: 'Dec 17 12:34:15', node })).toBe(true))

  it('passes with out of bounds number', () =>
    expect(date_format({ value: 'January 77', node })).toBe(true))

  it('passes with only month', () =>
    expect(date_format({ value: 'January', node })).toBe(false))

  it('passes with valid date format', () =>
    expect(date_format({ value: '12/10/1987', node }, 'MM/DD/YYYY')).toBe(true))

  it('passes with date ending in zero', () =>
    expect(date_format({ value: '12/10/1987', node }, 'MM/D/YYYY')).toBe(true))

  it('fails with simple number and date format', () =>
    expect(date_format({ value: '1234', node }, 'MM/DD/YYYY')).toBe(false))

  it('fails with only day of week', () =>
    expect(date_format({ value: 'saturday', node })).toBe(false))

  it('fails with random string', () =>
    expect(date_format({ value: 'Pepsi 17', node })).toBe(false))

  it('fails with random number', () =>
    expect(date_format({ value: '1872301237', node })).toBe(false))
})
