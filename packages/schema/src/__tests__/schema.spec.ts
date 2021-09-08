import { parseBools } from '../schema'

describe('boolean parser', () => {
  // AND operators only:
  it('parses truthy and comparison operators', () =>
    expect(parseBools('true && true')()).toBe(true))
  it('parses true and false comparison operators', () =>
    expect(parseBools('true && false')()).toBe(false))
  it('parses true && true && false comparison operators', () =>
    expect(parseBools('true && true && false')()).toBe(false))
  it('parses true && true && true comparison operators', () =>
    expect(parseBools('true && true && true')()).toBe(true))
  it('parses true && false && true comparison operators', () =>
    expect(parseBools('true && false && true')()).toBe(false))
  it('parses false && true && true && true comparison operators', () =>
    expect(parseBools('false && true && true && true')()).toBe(false))

  // OR operators only:
  it('parses truthy or comparison operators', () =>
    expect(parseBools('true || true')()).toBe(true))
  it('parses falsy or comparison operators', () =>
    expect(parseBools('true || false')()).toBe(true))
  it('parses 2 truthy and one falsy or statements with or comparison operator', () =>
    expect(parseBools('true || true || false')()).toBe(true))
  it('parses 2 falsy and one truthy statements with or comparison operator', () =>
    expect(parseBools('false || false || true')()).toBe(true))
  it('parses 3 falsy statements with or comparison operator', () =>
    expect(parseBools('false || false || false')()).toBe(false))

  // Mixed OR/AND operators:
  it('can mix and with or operators, where or overrides falsy and', () =>
    expect(parseBools('true && false || true')()).toBe(true))
  it('can mix and with or operators, where all are falsy', () =>
    expect(parseBools('true && false || false')()).toBe(false))
  it('can mix and with or operators, where and is truthy but combines with falsey or', () =>
    expect(parseBools('false || false && true')()).toBe(false))

  // Parenthetical:
  it('can use parenthesis to group operators', () => {
    expect(parseBools('(false && false) && true')()).toBe(false)
  })
  it('can use parenthesis to group complex or falsy operators', () => {
    expect(parseBools('(true && (false || false)) && true')()).toBe(false)
  })
  it('can use parenthesis to group complex and falsy operators', () => {
    expect(parseBools('(false || (true && true)) || false')()).toBe(true)
  })
})
