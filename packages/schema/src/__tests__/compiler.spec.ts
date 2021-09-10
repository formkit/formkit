import { compileCondition } from '../compiler'

describe('boolean logic parser', () => {
  // AND operators only:
  it('parses truthy and comparison operators', () =>
    expect(compileCondition('true && true')()).toBe(true))
  it('parses true and false comparison operators', () =>
    expect(compileCondition('true && false')()).toBe(false))
  it('parses true && true && false comparison operators', () =>
    expect(compileCondition('true && true && false')()).toBe(false))
  it('parses true && true && true comparison operators', () =>
    expect(compileCondition('true && true && true')()).toBe(true))
  it('parses true && false && true comparison operators', () =>
    expect(compileCondition('true && false && true')()).toBe(false))
  it('parses false && true && true && true comparison operators', () =>
    expect(compileCondition('false && true && true && true')()).toBe(false))

  // OR operators only:
  it('parses truthy or comparison operators', () =>
    expect(compileCondition('true || true')()).toBe(true))
  it('parses falsy or comparison operators', () =>
    expect(compileCondition('true || false')()).toBe(true))
  it('parses 2 truthy and one falsy or statements with or comparison operator', () =>
    expect(compileCondition('true || true || false')()).toBe(true))
  it('parses 2 falsy and one truthy statements with or comparison operator', () =>
    expect(compileCondition('false || false || true')()).toBe(true))
  it('parses 3 falsy statements with or comparison operator', () =>
    expect(compileCondition('false || false || false')()).toBe(false))

  // Mixed OR/AND operators:
  it('can mix and with or operators, where or overrides falsy and', () =>
    expect(compileCondition('true && false || true')()).toBe(true))
  it('can mix and with or operators, where all are falsy', () =>
    expect(compileCondition('true && false || false')()).toBe(false))
  it('can mix and with or operators, where and is truthy but combines with falsey or', () =>
    expect(compileCondition('false || false && true')()).toBe(false))

  // Parenthetical:
  it('can use parenthesis to group operators', () => {
    expect(compileCondition('(false && false) && true')()).toBe(false)
  })
  it('can use parenthesis to group complex or falsy operators', () => {
    expect(compileCondition('(true && (false || false)) && true')()).toBe(false)
  })
  it('can use parenthesis to group complex and falsy operators', () => {
    expect(compileCondition('(false || (true && true)) || false')()).toBe(true)
  })

  // Edge cases
  it('can evaluate single values', () => {
    expect(compileCondition('true')()).toBe(true)
  })
  it('can handle unnecessary parenthesis', () => {
    expect(compileCondition('(true && true)')()).toBe(true)
    expect(compileCondition('(true && false)')()).toBe(false)
  })
  it('can handle single bool parenthesis', () => {
    expect(compileCondition('(true) && (false)')()).toBe(false)
    expect(compileCondition('(true) && (true)')()).toBe(true)
  })
  it('throws an error if there nothing at all', () => {
    expect(() => compileCondition('')()).toThrow()
  })
  it('throws an error if an operand is at the beginning of an expression', () => {
    expect(() => compileCondition('>=')).toThrow()
  })
  it('throws an error if an operand is at the end of an expression', () => {
    expect(() => compileCondition('true >=')).toThrow()
  })

  // Comparisons
  it('can evaluate a simple >=', () => {
    expect(compileCondition('123 >= 123')()).toBe(true)
    expect(compileCondition('123 >= 456')()).toBe(false)
  })
  it('can combine boolean operator and comparison operator', () => {
    expect(compileCondition('123 >= 123 && 456 >= 222')()).toBe(true)
    expect(compileCondition('123 >= 123 && 456 <= 222')()).toBe(false)
    expect(compileCondition('123 >= 123 && (456 <= 222 || 5 > 3)')()).toBe(true)
  })
  it('can evaluate quoted parenthesis as strings', () => {
    expect(compileCondition('"(\\")\\"" == "(\\")\\""')()).toBe(true)
  })
  it('ignores quotes for strings', () => {
    expect(compileCondition('"abc" == abc')()).toBe(true)
  })
  it('allows loose type checking', () => {
    expect(compileCondition('"300" == 300')()).toBe(true)
  })
  it('allows strict type checking (===)', () => {
    expect(compileCondition('"300" === 300')()).toBe(false)
  })
  it('allows strict inverse checking (!==)', () => {
    expect(compileCondition('"300" !== 300')()).toBe(true)
  })
  it.only('can compare multiple strings', () => {
    const condition = compileCondition(
      '$input == bob || $input == justin'
    ).provide(() => {
      return () => 'bob'
    })
    expect(condition()).toBe(true)
  })

  // Token provider
  it('can provide tokenized values to condition', () => {
    const condition = compileCondition('$name === "bob"')
    const tokens: { [index: string]: any } = {
      name: 'bob',
    }
    condition.provide((token) => () => tokens[token])
    expect(condition()).toBe(true)
    tokens.name = 'fred'
    expect(condition()).toBe(false)
  })
  it('can provide numeric type tokenized values', () => {
    const condition = compileCondition('$account > 2.99 && $price < $account')
    const tokens: { [index: string]: any } = {
      account: 5.2,
      price: 3.22,
    }
    condition.provide((token) => () => tokens[token])
    expect(condition()).toBe(true)
  })
})
