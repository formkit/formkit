import date_between from '../src/date_between'
import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'

describe('date_between', () => {
  it('passes when targeting a single date in the future', () =>
    expect(
      date_between(
        createNode({
          value: `January 1, ${new Date().getFullYear() + 1}`,
        }),
        `${new Date().getFullYear() + 1}-02-01`
      )
    ).toBe(true))

  it('fails when using past date with a single target', () =>
    expect(
      date_between(
        createNode({
          value: `January 1, ${new Date().getFullYear() - 1}`,
        }),
        `${new Date().getFullYear() + 1}-02-01`
      )
    ).toBe(false))

  it('passes when specifying a past target date', () =>
    expect(
      date_between(
        createNode({
          value: `January 1, ${new Date().getFullYear() - 1}`,
        }),
        `${new Date().getFullYear() - 2}-01-01`,
        `${new Date().getFullYear() + 1}-02-01`
      )
    ).toBe(true))

  it('passes when using a date object', () => {
    const d = new Date()
    expect(
      date_between(
        createNode({
          value: d,
        }),
        new Date(d.getFullYear() - 1, d.getMonth(), d.getDate()),
        new Date(d.getFullYear() + 1, d.getMonth(), d.getDate())
      )
    ).toBe(true)
  })

  it.each([
    ['1970-01-01', '1960-01-01', '1980-01-01'],
    ['1980-01-01', '1970-01-01', '1990-01-01'],
    ['1960-01-01', '1950-01-01', '1970-01-01'],
  ])('passes when using 1970-01-01 as an argument', (value, dateA, dateB) => {
    expect(
      date_between(
        createNode({
          value: new Date(value),
        }),
        new Date(dateA),
        new Date(dateB)
      )
    ).toBe(true)
  })
})
