import { createNode } from '@formkit/core'
import url from '../src/url'

describe('url rule', () => {
  const node = createNode()
  it('passes with http://google.com', () =>
    expect(url({ value: 'http://google.com', node })).toBe(true))

  it('fails with ftp protocol', () =>
    expect(url({ value: 'ftp://google.com', node })).toBe(false))

  it('can pass with alternate protocols', () =>
    expect(url({ value: 'ftp://google.com', node }, 'ftp:')).toBe(true))

  it('can pass with localhost', () =>
    expect(url({ value: 'http://localhost:3000', node })).toBe(true))

  it('can pass with fancy TLD', () =>
    expect(url({ value: 'http://coke.coke', node })).toBe(true))

  it('fails without an address', () =>
    expect(url({ value: 'http://', node })).toBe(false))

  it('fails with google.com', () =>
    expect(url({ value: 'google.com', node })).toBe(false))
})
