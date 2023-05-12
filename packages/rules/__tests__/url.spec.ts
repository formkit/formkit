import { createNode } from '@formkit/core'
import url from '../src/url'
import { describe, expect, it } from 'vitest'

describe('url rule', () => {
  it('passes with http://google.com', () =>
    expect(url(createNode({ value: 'http://google.com' }))).toBe(true))

  it('fails with ftp protocol', () =>
    expect(url(createNode({ value: 'ftp://google.com' }))).toBe(false))

  it('can pass with alternate protocols', () =>
    expect(url(createNode({ value: 'ftp://google.com' }), 'ftp:')).toBe(true))

  it('can pass with localhost', () =>
    expect(url(createNode({ value: 'http://localhost:3000' }))).toBe(true))

  it('can pass with fancy TLD', () =>
    expect(url(createNode({ value: 'http://coke.coke' }))).toBe(true))

  it('fails without an address', () =>
    expect(url(createNode({ value: 'http://' }))).toBe(false))

  it('fails with google.com', () =>
    expect(url(createNode({ value: 'google.com' }))).toBe(false))
})
