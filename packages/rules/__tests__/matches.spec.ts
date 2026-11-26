import matches from '../src/matches'
import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'

describe('matches', () => {
  it('simple strings fail if they aren’t equal', () => {
    expect(matches(createNode({ value: 'third' }), 'first')).toBe(false)
  })

  it('fails on non matching regex', () => {
    expect(matches(createNode({ value: 'third' }), /^thirds/)).toBe(false)
  })

  it('passes if simple strings match', () => {
    expect(matches(createNode({ value: 'second' }), 'third', 'second')).toBe(
      true
    )
  })

  it('passes on matching regex', () => {
    expect(matches(createNode({ value: 'third' }), /^third/)).toBe(true)
  })

  it.each(['g', 'y'])('reuses regular expressions with the %s flag', (flag) => {
    const pattern = new RegExp('^[A-Z]+$', flag)
    const results = ['ABC', 'ABCD', 'ABCDE'].map((value) =>
      matches(createNode({ value }), pattern)
    )
    expect(results).toEqual([true, true, true])
    expect(pattern.lastIndex).toBe(0)
  })

  it('passes on matching mixed regex and string', () => {
    expect(
      matches(
        createNode({ value: 'first-fourth' }),
        'second',
        /^third/,
        /fourth$/
      )
    ).toBe(true)
  })

  it('fails on a regular expression encoded as a string', () => {
    expect(matches(createNode({ value: 'mypassword' }), '/[0-9]/')).toBe(false)
  })

  it('passes on a regular expression encoded as a string', () => {
    expect(matches(createNode({ value: 'mypa55word' }), '/[0-9]/')).toBe(true)
  })

  it('passes on a regular expression containing slashes', () => {
    expect(matches(createNode({ value: 'https://' }), '/https?:///')).toBe(true)
  })
})
