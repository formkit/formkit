import { parseLogicals } from '../schema'

describe('boolean logic parser', () => {
  // AND operators only:
  it('parses truthy and comparison operators', () =>
    expect(parseLogicals('true && true')()).toBe(true))
  it('parses true and false comparison operators', () =>
    expect(parseLogicals('true && false')()).toBe(false))
  it('parses true && true && false comparison operators', () =>
    expect(parseLogicals('true && true && false')()).toBe(false))
  it('parses true && true && true comparison operators', () =>
    expect(parseLogicals('true && true && true')()).toBe(true))
  it('parses true && false && true comparison operators', () =>
    expect(parseLogicals('true && false && true')()).toBe(false))
  it('parses false && true && true && true comparison operators', () =>
    expect(parseLogicals('false && true && true && true')()).toBe(false))

  // OR operators only:
  it('parses truthy or comparison operators', () =>
    expect(parseLogicals('true || true')()).toBe(true))
  it('parses falsy or comparison operators', () =>
    expect(parseLogicals('true || false')()).toBe(true))
  it('parses 2 truthy and one falsy or statements with or comparison operator', () =>
    expect(parseLogicals('true || true || false')()).toBe(true))
  it('parses 2 falsy and one truthy statements with or comparison operator', () =>
    expect(parseLogicals('false || false || true')()).toBe(true))
  it('parses 3 falsy statements with or comparison operator', () =>
    expect(parseLogicals('false || false || false')()).toBe(false))

  // Mixed OR/AND operators:
  it('can mix and with or operators, where or overrides falsy and', () =>
    expect(parseLogicals('true && false || true')()).toBe(true))
  it('can mix and with or operators, where all are falsy', () =>
    expect(parseLogicals('true && false || false')()).toBe(false))
  it('can mix and with or operators, where and is truthy but combines with falsey or', () =>
    expect(parseLogicals('false || false && true')()).toBe(false))

  // Parenthetical:
  it('can use parenthesis to group operators', () => {
    expect(parseLogicals('(false && false) && true')()).toBe(false)
  })
  it('can use parenthesis to group complex or falsy operators', () => {
    expect(parseLogicals('(true && (false || false)) && true')()).toBe(false)
  })
  it('can use parenthesis to group complex and falsy operators', () => {
    expect(parseLogicals('(false || (true && true)) || false')()).toBe(true)
  })

  // Edge cases
  it('can evaluate single values', () => {
    expect(parseLogicals('true')()).toBe(true)
  })
  it('can handle unnecessary parenthesis', () => {
    expect(parseLogicals('(true && true)')()).toBe(true)
    expect(parseLogicals('(true && false)')()).toBe(false)
  })
  it('can handle single bool parenthesis', () => {
    expect(parseLogicals('(true) && (false)')()).toBe(false)
    expect(parseLogicals('(true) && (true)')()).toBe(true)
  })
  it('throws an error if there nothing at all', () => {
    expect(() => parseLogicals('')()).toThrow()
  })
  it('throws an error if an operand is at the beginning of an expression', () => {
    expect(() => parseLogicals('>=')).toThrow()
  })
  it('throws an error if an operand is at the end of an expression', () => {
    expect(() => parseLogicals('true >=')).toThrow()
  })

  // Comparisons
  it('can evaluate a simple >=', () => {
    expect(parseLogicals('123 >= 123')()).toBe(true)
    expect(parseLogicals('123 >= 456')()).toBe(false)
  })
  it('can combine boolean operator and comparison operator', () => {
    expect(parseLogicals('123 >= 123 && 456 >= 222')()).toBe(true)
    expect(parseLogicals('123 >= 123 && 456 <= 222')()).toBe(false)
    expect(parseLogicals('123 >= 123 && (456 <= 222 || 5 > 3)')()).toBe(true)
  })
  it('can evaluate quoted parenthesis as strings', () => {
    expect(parseLogicals('"(\\")\\"" == "(\\")\\""')()).toBe(true)
  })
  it('ignores quotes for strings', () => {
    expect(parseLogicals('"abc" == abc')()).toBe(true)
  })
})

// describe('comparison parser', () => {
//   expect(parseComparison('123 > 456')()).toBe(false)
// })
