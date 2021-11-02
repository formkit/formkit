import { sentence, list } from '../src/formatters'

describe('sentence case', () => {
  it('caps the first word', () =>
    expect(sentence('hello world')).toBe('Hello world'))
  it('doesn’t change capped words', () =>
    expect(sentence('Hello world')).toBe('Hello world'))
  it('doesn’t uncap words', () =>
    expect(sentence('Hello World')).toBe('Hello World'))
})

describe('list', () => {
  it('handles single items', () => expect(list(['foo'])).toBe('foo'))
  it('handles two items', () => expect(list(['foo', 'bar'])).toBe('foo or bar'))
  it('handles three items', () =>
    expect(list(['foo', 'bar', 'baz'])).toBe('foo, bar, or baz'))
  it('handles many items', () =>
    expect(list(['foo', 'bar', 'baz', 'whiz'])).toBe('foo, bar, baz, or whiz'))
})
