import { eq } from '../src/index'

describe('eq', () => {
  it('evaluates simple primitives correctly', () => {
    expect(eq('123', '123')).toBe(true)
    expect(eq('123', 123)).toBe(false)
    expect(eq(true, true)).toBe(true)
    expect(eq(false, true)).toBe(false)
    expect(eq(function () {}, {})).toBe(false)
  })

  it('evaluates single depth objects correctly', () => {
    const t = { first: 'first', second: 'second' }
    expect(eq(t, t)).toBe(true)
    expect(eq({}, {})).toBe(true)
    expect(eq({ a: '123' }, { a: '123' })).toBe(true)
    expect(eq({ abc: 'abc' }, { abc: 'abc', def: 'def' })).toBe(false)
    expect(eq({ abc: 'abc' }, { abc: 'abcd' })).toBe(false)
    expect(eq(['first'], ['first'])).toBe(true)
    expect(eq(['first'], ['first', 'second'])).toBe(false)
    expect(eq([0, 2, 4, 6], [0, 2, 4, 6])).toBe(true)
  })

  it('evaluates deep objects correctly', () => {
    const t = { first: 'first', second: { name: 'second' } }
    expect(eq(t, t)).toBe(true)
    expect(
      eq(
        {
          name: {
            first: 'jane',
            last: 'flair',
          },
          age: 20,
        },
        {
          name: {
            first: 'jane',
            last: 'flair',
          },
          age: 20,
        }
      )
    ).toBe(true)
  })
  expect(
    eq(
      {
        name: {
          first: 'jane',
          last: 'DIFFERENT',
        },
        age: 20,
      },
      {
        name: {
          first: 'jane',
          last: 'flair',
        },
        age: 20,
      },
      false // Disable depth
    )
  ).toBe(false)
  expect(
    eq(
      {
        name: {
          first: 'jane',
          last: 'DIFFERENT',
        },
        age: 20,
      },
      {
        name: {
          first: 'jane',
          last: 'flair',
        },
        age: 20,
      }
    )
  ).toBe(false)
  expect(eq([{}], [{}])).toBe(true)
  expect(eq([{ a: 250 }], [{ b: { value: 250 } }])).toBe(false)
})
