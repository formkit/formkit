import date_between from '../src/date_between'
import { createNode } from '@formkit/core'

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
        new Date(d.getFullYear() + 1, d.getMonth(), d.getDate())
      )
    ).toBe(true)
  })
})
