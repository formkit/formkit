import { compile } from '../src/compiler'
import { describe, expect, it } from 'vitest'

describe('logic compiler', () => {
  // AND operators only:
  it('parses truthy and comparison operators', () =>
    expect(compile('true && true')()).toBe(true))
  it('parses true and false comparison operators', () =>
    expect(compile('true && false')()).toBe(false))
  it('parses true && true && false comparison operators', () =>
    expect(compile('true && true && false')()).toBe(false))
  it('parses true && true && true comparison operators', () =>
    expect(compile('true && true && true')()).toBe(true))
  it('parses true && false && true comparison operators', () =>
    expect(compile('true && false && true')()).toBe(false))
  it('parses false && true && true && true comparison operators', () =>
    expect(compile('false && true && true && true')()).toBe(false))

  // OR operators only:
  it('parses truthy or comparison operators', () =>
    expect(compile('true || true')()).toBe(true))
  it('parses falsy or comparison operators', () =>
    expect(compile('true || false')()).toBe(true))
  it('parses 2 truthy and one falsy or statements with or comparison operator', () =>
    expect(compile('true || true || false')()).toBe(true))
  it('parses 2 falsy and one truthy statements with or comparison operator', () =>
    expect(compile('false || false || true')()).toBe(true))
  it('parses 3 falsy statements with or comparison operator', () =>
    expect(compile('false || false || false')()).toBe(false))

  // Mixed OR/AND operators:
  it('can mix and with or operators, where or overrides falsy and', () =>
    expect(compile('true && false || true')()).toBe(true))
  it('can mix and with or operators, where all are falsy', () =>
    expect(compile('true && false || false')()).toBe(false))
  it('can mix and with or operators, where and is truthy but combines with falsey or', () =>
    expect(compile('false || false && true')()).toBe(false))

  // Parenthetical:
  it('can use parenthesis to group operators', () => {
    expect(compile('(false && false) && true')()).toBe(false)
  })
  it('can use parenthesis to group complex or falsy operators', () => {
    expect(compile('(true && (false || false)) && true')()).toBe(false)
  })
  it('can use parenthesis to group complex and falsy operators', () => {
    expect(compile('(false || (true && true)) || false')()).toBe(true)
  })

  // Edge cases
  it('can evaluate single values', () => {
    expect(compile('true')()).toBe(true)
  })
  it('can handle unnecessary parenthesis', () => {
    expect(compile('(true && true)')()).toBe(true)
    expect(compile('(true && false)')()).toBe(false)
  })
  it('can handle single bool parenthesis', () => {
    expect(compile('(true) && (false)')()).toBe(false)
    expect(compile('(true) && (true)')()).toBe(true)
  })
  it('throws an error if there nothing at all', () => {
    expect(() => compile('')()).toThrow()
  })
  it('throws an error if an operand is at the beginning of an expression', () => {
    expect(() => compile('>=')).toThrow()
  })
  it('throws an error if an operand is at the end of an expression', () => {
    expect(() => compile('true >=')).toThrow()
  })

  // Comparisons
  it('can evaluate a simple >=', () => {
    expect(compile('123 >= 123')()).toBe(true)
    expect(compile('123 >= 456')()).toBe(false)
  })
  it('can combine boolean operator and comparison operator', () => {
    expect(compile('123 >= 123 && 456 >= 222')()).toBe(true)
    expect(compile('123 >= 123 && 456 <= 222')()).toBe(false)
    expect(compile('123 >= 123 && (456 <= 222 || 5 > 3)')()).toBe(true)
  })
  it('can evaluate quoted parenthesis as strings', () => {
    expect(compile('"(\\")\\"" == "(\\")\\""')()).toBe(true)
  })
  it('ignores quotes for strings', () => {
    expect(compile('"abc" == abc')()).toBe(true)
  })
  it('allows loose type checking', () => {
    expect(compile('"300" == 300')()).toBe(true)
  })
  it('allows strict type checking (===)', () => {
    expect(compile('"300" === 300')()).toBe(false)
  })
  it('allows strict inverse checking (!==)', () => {
    expect(compile('"300" !== 300')()).toBe(true)
  })
  it('can compare multiple strings', () => {
    const condition = compile('bob == bob || fred == "fred"')
    expect(condition()).toBe(true)
  })
  it('can perform multi-step comparisons', () => {
    expect(
      compile('$value > 100 && $value < 200 || $value === "fred"').provide(
        () => {
          return { value: () => 150 }
        }
      )()
    ).toBe(true)
    expect(
      compile('$value > 100 && $value < 200 || $value === "fred"').provide(
        () => {
          return { value: () => 'fred' }
        }
      )()
    ).toBe(true)
    expect(
      compile('$value > 100 && $value < 200 || $value === "fred"').provide(
        () => {
          return { value: () => 'danny' }
        }
      )()
    ).toBe(false)
  })

  // Arithmetic
  it('can add two numbers together', () => {
    expect(compile('3 + 7 == 10')()).toBe(true)
    expect(compile('15 === 5 + 10')()).toBe(true)
    expect(compile('15 === 5 + 11')()).toBe(false)
    expect(compile('15 === 5 + 10 && 5 < 2 + 4')()).toBe(true)
  })

  it('can subtract numbers', () => {
    expect(compile('3 - 7 === -4')()).toBe(true)
    expect(compile('10 < 5 - 1')()).toBe(false)
    expect(compile('12 === (11 + (3 - 2))')()).toBe(true)
    expect(compile('15 - 2 >= 14 - 1')()).toBe(true)
  })

  it('can multiply numbers', () => {
    expect(compile('3 * 7 === 21')()).toBe(true)
    expect(compile('15 * 2 >= 30 - 5')()).toBe(true)
    expect(compile('123 - 3 < 12 * 10')()).toBe(false)
  })

  it('can divide numbers', () => {
    expect(compile('6 / 2 === 3')()).toBe(true)
    expect(compile('5 * 5 === 25 / 5')()).toBe(false)
    expect(compile('13 === 91 / 7')()).toBe(true)
    expect(compile('33 * 2 > 60 && 91 / 7 < 12')()).toBe(false)
    expect(compile('(33 - 3) * 2 - 5 + 1 === 56')()).toBe(true)
  })

  it('can perform modulus', () => {
    expect(compile('6 % 2 === 0')()).toBe(true)
    expect(compile('10 % 3')()).toBe(1)
    expect(compile('10 % 3 + 7')()).toBe(8)
    expect(compile('1 - 437 % 22')()).toBe(-18)
  })

  it('uses parenthesis for the order of operations', () => {
    expect(compile('5 * 3 * (1 + .1)')()).toBe(16.5)
    expect(compile('(1 + .1) * 5 * 3')()).toBe(16.5)
    expect(compile('5 * (1 + .1) === 5.5')()).toBe(true)
    expect(compile('5 + (1 * .1) * 3')()).toBe(5.3)
    expect(compile('5 + (3) * 2')()).toBe(11)
    expect(compile('(3) * 5')()).toBe(15)
  })

  it('can handle double quoted string', () => {
    expect(compile('(andrew === "andrew")')()).toBe(true)
    expect(compile('"(first \\"name\\")"')()).toBe('(first "name")')
  })

  it('can do math and then concatenate strings', () => {
    let padding = 10
    const makePadding = compile('$padding / 5 + em').provide(() => {
      return { padding: () => padding }
    })
    expect(makePadding()).toBe('2em')
    padding = 30
    expect(makePadding()).toBe('6em')
  })

  // Token provider
  it('can use different data on the same compiled function', () => {
    const compiled = compile('$foo')
    const bar = compiled.provide((requirements) => {
      const tokens: Record<string, any> = {}
      for (const token of requirements) {
        tokens[token] = () => 'bar'
      }
      return tokens
    })
    const baz = compiled.provide((requirements) => {
      const tokens: Record<string, any> = {}
      for (const token of requirements) {
        tokens[token] = () => 'baz'
      }
      return tokens
    })
    expect(bar()).toBe('bar')
    expect(baz()).toBe('baz')
    expect(bar()).toBe('bar')
  })

  it('can use variable tokens with operators', () => {
    const compiled = compile('$a + $b + $c')
    const numeric = compiled.provide(() => {
      return { a: () => 12, b: () => 4, c: () => 2 } as Record<string, any>
    })
    const strings = compiled.provide(() => {
      return { a: () => 'a', b: () => 'b', c: () => 'c' } as Record<string, any>
    })
    expect(numeric()).toBe(18)
    expect(strings()).toBe('abc')
  })

  it('can provide tokenized values to condition', () => {
    const compiled = compile('$name === "bob"')
    const data: { [index: string]: any } = {
      name: 'bob',
    }
    const condition = compiled.provide((requirements) => {
      return requirements.reduce((tokens, token) => {
        tokens[token] = () => data[token]
        return tokens
      }, {} as Record<string, any>)
    })
    expect(condition()).toBe(true)
    data.name = 'fred'
    expect(condition()).toBe(false)
  })
  it('can provide numeric type tokenized values', () => {
    const compiled = compile('$account > 2.99 && $price < $account2')
    const data: { [index: string]: any } = {
      account: 5.2,
      account2: 5.2,
      price: 3.22,
    }
    const condition = compiled.provide((reqs) => {
      const values = reqs.reduce(
        (tokens, token) => ({ ...tokens, ...{ [token]: () => data[token] } }),
        {} as Record<string, any>
      )
      return values
    })
    expect(condition()).toBe(true)
  })
  it('can use tokens to do math', () => {
    const condition = compile('$account + 1 > 2.99 + 5').provide(() => {
      return { account: () => 7 }
    })
    expect(condition()).toBe(true)
  })

  it('ignores labeled expressions', () => {
    const evaluate = compile('$: $value * 10').provide(() => ({
      value: () => 23,
    }))
    expect(evaluate()).toBe(230)
  })

  it('can execute functions', () => {
    const data: Record<string, any> = {
      fn: function testFn(value: any) {
        return value + 5
      },
    }
    const evaluate = compile('3 + $fn(1 + 2) + 2').provide((tokens) => {
      return { fn: () => data[tokens[0]] }
    })
    expect(evaluate()).toBe(13)
  })

  it('can execute functions with the correct order of operations', () => {
    const data: Record<string, any> = {
      addFive: (value: any) => value + 5,
    }
    expect(
      compile('3 + $addFive(1 + 2) * 2').provide(([token]) => {
        return { [token]: () => data[token] }
      })()
    ).toBe(19)
    expect(
      compile('3 * $addFive(1 + 2) + 2').provide(([token]) => {
        return { [token]: () => data[token] }
      })()
    ).toBe(26)
  })

  it('can pass multiple arguments to a function', () => {
    const data: Record<string, any> = {
      multiply: (first: number, second: number) => first * second,
    }
    expect(
      compile('$multiply(5 + 2, 6 + 3)').provide(([token]) => {
        return { [token]: () => data[token] }
      })()
    ).toBe(63)
  })

  it('can access properties of a returned object', () => {
    const data: Record<string, any> = {
      fetch: () => ({ value: 'abc' }),
    }
    expect(
      compile('$fetch().value + def').provide(([token]) => {
        return { [token]: () => data[token] }
      })()
    ).toBe('abcdef')
  })

  it('can access sub properties of a returned object', () => {
    const data: Record<string, any> = {
      get: (value: string) => ({ node: { value } }),
    }
    expect(
      compile('$get(foo).node.value').provide(([token]) => {
        return { [token]: () => data[token] }
      })()
    ).toBe('foo')
  })

  it('can call a function on a tail', () => {
    const data: Record<string, any> = {
      add: (a: number) => ({
        to: (b: number) => Number(a) + Number(b),
      }),
    }
    expect(
      compile('2 * $add(5).to(3)').provide(([token]) => {
        return { [token]: () => data[token] }
      })()
    ).toBe(16)
  })

  it('can parse arithmetic inside a tail call', () => {
    const data: Record<string, any> = {
      fetch: () => ({ from: (location: string) => location }),
    }
    expect(
      compile('$fetch().from(1 + 1)').provide(([token]) => {
        return { [token]: () => data[token] }
      })()
    ).toBe(2)
  })

  it('can parse tokens inside a tail call', () => {
    const data: Record<string, any> = {
      fetch: () => ({ from: (location: string) => location }),
    }
    expect(
      compile('$fetch().from(1 + 1)').provide(([token]) => {
        return { [token]: () => data[token] }
      })()
    ).toBe(2)
  })

  it('can parse root tokens, call functions, and tail call inside a tail call', () => {
    const data: Record<string, any> = {
      go: () => ({ north: (location: string) => location }),
      sing: () => ({ oh: 'canada' }),
    }
    expect(
      compile('$go().north($sing().oh)').provide((req) => {
        return req.reduce(
          (tokens, token) =>
            Object.assign(tokens, { [token]: () => data[token] }),
          {} as Record<string, any>
        )
      })()
    ).toBe('canada')
  })

  it('can parse quoted strings inside a function call (#150)', () => {
    const say = (value: string) => value
    expect(
      compile('$say("who are you")').provide(() => {
        return { say: () => say }
      })()
    ).toBe('who are you')
  })
})
