import {
  eq,
  empty,
  extend,
  isPojo,
  isQuotedString,
  assignDeep,
  rmEscapes,
  parseArgs,
  except,
  camel,
  clone,
  only,
  getAt,
  kebab,
  undefine,
  token,
  slugify,
  shallowClone,
  spread,
  boolProp,
} from '../src/index'
import { describe, expect, it } from 'vitest'

describe('eq', () => {
  it('evaluates simple primitives correctly', () => {
    expect(eq('123', '123')).toBe(true)
    expect(eq('123', 123)).toBe(false)
    expect(eq(true, true)).toBe(true)
    expect(eq(false, true)).toBe(false)
    expect(eq(function () {}, {})).toBe(false)
  })

  it('handles null and undefined vales', () => {
    expect(eq(null, [])).toBe(false)
    expect(eq([], null)).toBe(false)
    expect(eq(null, null)).toBe(true)
    expect(eq(undefined, undefined)).toBe(true)
    expect(eq(undefined, null)).toBe(false)
    expect(eq(undefined, [])).toBe(false)
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

  it('can compare date objects', () => {
    const date = new Date()
    expect(eq(date, date)).toBe(true)
    expect(eq(new Date('2012-01-01'), new Date('2012-01-01'))).toBe(true)
    expect(
      eq(new Date('2012-01-01T01:00:01'), new Date('2012-01-0101:00:02'))
    ).toBe(false)
    expect(
      eq(
        new Date('2012-01-01T01:00:01'),
        new Date('2012-01-01T01:00:01').getTime()
      )
    ).toBe(false)
  })

  it('can explicitly look at certain keys that are not enumerable', () => {
    const a = Object.defineProperty({ foo: 'bar' }, '_id', { value: 'foo' })
    const b = Object.defineProperty({ foo: 'bar' }, '_id', { value: 'bar' })
    expect(eq(a, b)).toBe(true)
    expect(eq(a, b, true, ['_id'])).toBe(false)
  })

  it('can compare regex', () => {
    expect(eq(/^foo/, /^foo/)).toBe(true)
    expect(eq({ a: /^foo/ }, { a: /^foo/ })).toBe(true)
    expect(eq({ a: /^foo/g }, { a: /^foo/ })).toBe(false)
    expect(eq({ a: /^foo/g }, { a: /^foo/g })).toBe(true)
    expect(eq({ a: /^fo[o]/g }, { a: /^foo/g })).toBe(false)
  })
})

describe('empty', () => {
  it('considers empty strings empty', () => expect(empty('')).toBe(true))
  it('considers spaces not empty', () => expect(empty('  ')).toBe(false))
  it('considers the string zero not empty', () =>
    expect(empty('0')).toBe(false))
  it('considers the number zero not empty', () => expect(empty(0)).toBe(false))
  it('considers empty arrays empty', () => expect(empty([])).toBe(true))
  it('considers empty objects empty', () => expect(empty({})).toBe(true))
  it('considers null empty', () => expect(empty(null)).toBe(true))
  it('considers undefined empty', () => expect(empty(undefined)).toBe(true))
  it('considers an array with value zero not empty', () =>
    expect(empty(['a'])).toBe(false))
  it('considers an object with key not empty', () =>
    expect(empty({ a: undefined })).toBe(false))
  it('considers regex not empty', () => expect(empty(/^foo/)).toBe(false))
  it('considers a date object to not be empty', () =>
    expect(empty(new Date())).toBe(false))
})

describe('isPojo', () => {
  it('does not consider a FormKitNode a pojo', () => {
    expect(isPojo({ __FKNode__: true })).toBe(false)
  })
  it('checks the __POJO__ property', () => {
    expect(isPojo({ __POJO__: false })).toBe(false)
  })
})

describe('shallowClone', () => {
  it('returns a scalar value passed in', () => {
    expect(shallowClone('a')).toBe('a')
  })

  it('returns a new object when passed a pojo', () => {
    const x = { a: 123 }
    expect(shallowClone(x)).not.toBe(x)
    expect(shallowClone(x)).toStrictEqual({ a: 123 })
  })

  it('nested objects are left alone', () => {
    const z = { foo: 'bar' }
    const x = { a: z }
    expect(shallowClone(x).a).toBe(z)
  })

  it('returns new arrays', () => {
    const z = [1, 2, 3]
    expect(shallowClone(z)).not.toBe(z)
    expect(shallowClone(z)).toStrictEqual([1, 2, 3])
  })

  it('preserves non-enumerable keys', () => {
    const z: { foo: string; __key?: boolean } = Object.defineProperty(
      { foo: 'bar' },
      '__key',
      { value: true }
    )
    expect(shallowClone(z).__key).toBe(true)
  })
})

describe('extend', () => {
  it('adds properties to objects as base depth', () =>
    expect(extend({ a: 123 }, { b: 123 })).toEqual({ a: 123, b: 123 }))

  it('changes properties to objects as base depth', () =>
    expect(extend({ a: 123 }, { a: 345 })).toEqual({ a: 345 }))

  it('removes properties to objects as base depth', () =>
    expect(extend({ a: 123 }, { a: undefined })).toEqual({}))

  it('can preserve initial values against undefined values by setting ignoreUndefined to true', () =>
    expect(
      extend({ a: 123, b: 'foo' }, { a: undefined, b: 'bar' }, false, true)
    ).toStrictEqual({
      a: 123,
      b: 'bar',
    }))

  it('replaces array values completely', () =>
    expect(extend({ a: ['first'] }, { a: ['second'] })).toEqual({
      a: ['second'],
    }))

  it('can concatenate array values', () => {
    expect(extend({ a: ['first'] }, { a: ['second'] }, true)).toEqual({
      a: ['first', 'second'],
    })
  })

  it('can change a property at depth', () => {
    expect(
      extend(
        {
          a: 123,
          b: {
            first: {
              third: 3,
            },
            second: {
              z: 'fire',
            },
          },
          c: 'boop',
        },
        {
          b: { second: { z: 'ice' } },
        }
      )
    ).toEqual({
      a: 123,
      b: {
        first: {
          third: 3,
        },
        second: {
          z: 'ice',
        },
      },
      c: 'boop',
    })
  })

  it('can completely replace with a string', () => {
    expect(extend({ foo: 123 }, 'bar')).toBe('bar')
  })
})

describe('isQuotedString', () => {
  it('properly detects simple single quoted strings', () =>
    expect(isQuotedString("'hello world'")).toBe(true))

  it('properly detects simple double quoted strings', () =>
    expect(isQuotedString('"hello world"')).toBe(true))

  it('detects non quotes', () =>
    expect(isQuotedString('hello world"')).toBe(false))

  it('detects unterminated quotes', () =>
    expect(isQuotedString('"hello world')).toBe(false))

  it('detects multiple quotes', () =>
    expect(isQuotedString('"hello" "world"')).toBe(false))

  it('allows escaped quotes', () =>
    expect(isQuotedString('"hello\\"this\\"world"')).toBe(true))

  it('allows escaped quotes inside of quotes inside of parens', () =>
    expect(isQuotedString('"(first \\"name\\")"')).toBe(true))
})

describe('rmEscapes', () => {
  it('performs no operation on non escaped strings', () => {
    expect(rmEscapes('"Hello world"')).toBe('"Hello world"')
    expect(rmEscapes("*P(*&)*&^%*&'$GJHASDFHKJ")).toBe(
      "*P(*&)*&^%*&'$GJHASDFHKJ"
    )
  })
  it('removes extra escape characters that are in the string literal', () => {
    expect(rmEscapes('\\"Hello \\"world\\""')).toBe('"Hello "world""')
  })
  it('does not remove escape characters that are actually escaped', () => {
    expect(rmEscapes('\\\\"Hello \\"world\\""')).toBe('\\"Hello "world""')
  })
})

describe('assignDeep', () => {
  it('assigns on the original object', () => {
    const a = { a: 123 }
    const b = { a: 456 }
    const refA = a
    assignDeep(a, b)
    expect(a).toBe(refA)
    expect(a.a).toBe(456)
  })

  it('child objects are the same reference', () => {
    const c = { b: 123 }
    const a = { a: c }
    const b = { a: { b: 345 } }
    assignDeep(a, b)
    expect(a.a).toBe(c)
    expect(a.a.b).toBe(345)
  })

  it('can add new properties', () => {
    const a = { a: 123 }
    const b = { b: 456 }
    assignDeep(a, b)
    expect(a).toEqual({ a: 123, b: 456 })
  })
})

describe('parseArgs', () => {
  it('can parse simple numbers and characters', () => {
    expect(parseArgs('abc, 123')).toEqual(['abc', '123'])
  })
  it('can parse simple strings with quotes containing commas', () => {
    expect(parseArgs('"abc,123", 123')).toEqual(['"abc,123"', '123'])
  })
  it('can parse arguments that contain parenthetical with commas', () => {
    expect(parseArgs('1, (1 + 2, "345, 678"), 500')).toEqual([
      '1',
      '(1+2,"345, 678")',
      '500',
    ])
  })
  it('can parse single arguments', () => {
    expect(parseArgs("'hello world'")).toEqual(["'hello world'"])
  })
  it('can use escaped quotes', () => {
    expect(parseArgs("'this isn\\'t counted', 456")).toEqual([
      "'this isn\\'t counted'",
      '456',
    ])
  })
})

describe('except', () => {
  it('can remove a simple string', () => {
    expect(except({ a: 123, b: 456 }, ['b'])).toEqual({ a: 123 })
  })

  it('can remove nothing if the input is undefined', () => {
    expect(except({ a: 123, b: 123 }, [])).toEqual({ a: 123, b: 123 })
  })

  it('can remove keys via regular expression', () => {
    expect(
      except({ baa: 123, boo: 456, foo: 789, barFoo: 542 }, ['foo', /^ba/])
    ).toEqual({ boo: 456 })
  })
})

describe('camel', () => {
  it('converts a single kebab to camel case', () => {
    expect(camel('hello-world')).toBe('helloWorld')
  })
  it('converts multi kebab to camel case', () => {
    expect(camel('this-Is-awesome')).toBe('thisIsAwesome')
  })
  it('leaves spaces alone', () => {
    expect(camel('lets-do this thing')).toBe('letsDo this thing')
  })
})

describe('clone', () => {
  it('does not return the same object', () => {
    const arr = ['foo']
    expect(clone(arr)).not.toBe(arr)
    expect(clone(arr)).toEqual(arr)
  })

  it('returns different nested array objects', () => {
    const arr = ['foo']
    const bar = [arr]
    const postClone = clone(bar)
    expect(postClone[0]).not.toBe(arr)
    expect(postClone[0]).toEqual(arr)
  })

  it('return different nested objects', () => {
    const x = {
      a: 'b',
    }
    const z = {
      g: 'y',
      x,
    }
    expect(clone(z)).toEqual({
      g: 'y',
      x: {
        a: 'b',
      },
    })
    expect(clone(z)).not.toBe(z)
    expect(clone(z).x).not.toBe(x)
  })

  it('skips cloning regex', () => {
    const regex = /^a/
    expect(clone({ regex }).regex).toBe(regex)
  })

  it('skips cloning dates', () => {
    const date = new Date()
    expect(clone({ date }).date).toBe(date)
  })

  it('clones explicitly named non enumerable properties', () => {
    const a: { a: number; __key?: string } = Object.defineProperty(
      { a: 123 },
      '__key',
      { value: 'yes' }
    )
    const cloned = clone(a)
    expect(cloned === a).toBe(false)
    expect(cloned.__key).toBe('yes')
  })

  it('does not clone standard non enumerable properties', () => {
    const a: { a: number; __foo?: string } = Object.defineProperty(
      { a: 123 },
      '__foo',
      { value: 'yes' }
    )
    const cloned = clone(a)
    expect(cloned === a).toBe(false)
    expect(cloned.__foo).toBe(undefined)
  })

  it('clones explicit properties on deep objects', () => {
    const world: { hello: string; planet: { a: 123; __init?: string } } = {
      hello: 'world',
      planet: Object.defineProperty({ a: 123 }, '__init', { value: 'yes' }),
    }
    const cloned = clone(world)
    expect(cloned === world).toBe(false)
    expect(cloned.planet.__init).toBe('yes')
  })

  it('clones explicit non-standard properties on deep objects', () => {
    const world: { hello: string; planet: { a: 123; __index?: number } } = {
      hello: 'world',
      planet: Object.defineProperty({ a: 123 }, '__index', { value: 456 }),
    }
    const cloned = clone(world, ['__index'])
    expect(cloned === world).toBe(false)
    expect(cloned.planet.__index).toBe(456)
  })
})

describe('only', () => {
  it('can remove values from an object', () => {
    const foo = {
      a: 1,
      b: 5,
      c: 3,
    }
    expect(only(foo, ['a', 'd'])).toEqual({
      a: 1,
      d: undefined,
    })
  })

  it('preserves values that match a regex', () => {
    const bar = {
      foo: 123,
      faa: 456,
      bar: 'bar',
      boz: 'biz',
    }
    expect(only(bar, ['faa', /^[bf]o/])).toEqual({
      foo: 123,
      faa: 456,
      boz: 'biz',
    })
  })
})

describe('getAt', () => {
  it('can access a single level deep', () => {
    expect(getAt({ a: 123 }, 'a')).toBe(123)
  })

  it('returns null when going too deep', () => {
    expect(getAt({ a: 123 }, 'a.b')).toBe(null)
  })

  it('returns null when first argument is not an object', () => {
    expect(getAt('foobar', 'a.b')).toBe(null)
  })

  it('can access array indexes', () => {
    expect(getAt({ a: ['foo', 'bar'] }, 'a.0')).toBe('foo')
    expect(getAt({ a: ['foo', 'bar'] }, 'a.1')).toBe('bar')
  })
})

describe('kebab', () => {
  it('can convert a simple camelCase', () => {
    expect(kebab('camelCase')).toBe('camel-case')
  })

  it('keeps capital letters together', () => {
    expect(kebab('selectedOptionUI')).toBe('selected-option-ui')
  })

  it('can convert a multi-hump camelCase', () => {
    expect(kebab('camelCaseThatIsGood')).toBe('camel-case-that-is-good')
  })

  it('forces all characters to lowercase ', () => {
    expect(kebab('CamelCase')).toBe('camel-case')
  })

  it('can have a trailing number', () => {
    expect(kebab('camel99Case')).toBe('camel99-case')
  })

  it('can replace whitespace', () => {
    expect(kebab('foo Bar')).toBe('foo-bar')
  })
})

describe('undefine', () => {
  it('undefines undefined', () => {
    expect(undefine(undefined)).toBe(undefined)
  })
  it('undefines the string false', () => {
    expect(undefine('false')).toBe(undefined)
  })
  it('undefines the boolean false', () => {
    expect(undefine(false)).toBe(undefined)
  })
  it('defines an empty string', () => {
    expect(undefine('')).toBe(true)
  })
  it('defines an truthy string', () => {
    expect(undefine('true')).toBe(true)
  })
  it('defines an random string', () => {
    expect(undefine(token())).toBe(true)
  })
})

describe('slugify', () => {
  it('removes caps', () => expect(slugify('FooBar')).toBe('foobar'))
  it('removes spaces', () => expect(slugify('this That')).toBe('this-that'))
  it('removes symbols', () =>
    expect(slugify('This!-is*&%#@^up!')).toBe('this-is-up'))
  it('converts non-standard unicode', () =>
    expect(slugify('Amélie')).toBe('amelie'))
})

describe('spread', () => {
  it('returns the same string values', () => expect(spread('foo')).toBe('foo'))
  it('returns the same number values', () => expect(spread(123)).toBe(123))
  it('returns the same RegExp values', () => {
    const pattern = /^foo_$/
    expect(spread(pattern)).toBe(pattern)
  })
  it('returns the same Date values', () => {
    const date = new Date()
    expect(spread(date)).toBe(date)
  })
  it('returns the same shape, but not the same value for POJOs', () => {
    const obj = { a: 123, b: 'bar' }
    const spreadObj = spread(obj)
    expect(spreadObj).toStrictEqual(obj)
    expect(spreadObj).not.toBe(obj)
  })
  it('returns the same shape, but not the same value for POJOs when using explicit non enumerable properties', () => {
    const obj: any = Object.defineProperty({ a: 123, b: 'bar' }, '__index', {
      value: 123,
    })
    const spreadObj = spread(obj, ['__index'])
    expect(spreadObj).toStrictEqual(obj)
    expect(spreadObj).not.toBe(obj)
    expect(spreadObj.__index).toBe(123)
  })
  it('returns the same shape, but not the same value for POJOs when using default non enumerable properties', () => {
    const obj: any = Object.defineProperty({ a: 123, b: 'bar' }, '__key', {
      value: 45645,
    })
    const spreadObj = spread(obj)
    expect(spreadObj).toStrictEqual(obj)
    expect(spreadObj).not.toBe(obj)
    expect(spreadObj.__key).toBe(45645)
  })
  it('returns the same shape, but not the same value for Arrays', () => {
    const arr = ['a', 'b', 'c']
    const spreadArr = spread(arr)
    expect(spreadArr).toStrictEqual(arr)
    expect(spreadArr).not.toBe(arr)
  })
})

describe('boolProp', () => {
  it('returns true for true', () => expect(boolProp(true)).toBe(true))
  it('returns true for "true"', () => expect(boolProp('true')).toBe(true))
  it('returns true for "yes"', () => expect(boolProp('yes')).toBe(true))
  it('returns true for "on"', () => expect(boolProp('on')).toBe(true))
  it('returns true for "1"', () => expect(boolProp('1')).toBe(true))
  it('returns undefined for false', () =>
    expect(boolProp(false)).toBe(undefined))
  it('returns undefined for "false"', () =>
    expect(boolProp('false')).toBe(undefined))
  it('returns true for empty string', () => expect(boolProp('')).toBe(true))
  it('returns true for undefined', () => expect(boolProp(undefined)).toBe(true))
})
