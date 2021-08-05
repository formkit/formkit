import matches from '../src/matches'
import { createNode } from '@formkit/core'

describe('matches', () => {
  const node = createNode()
  it('simple strings fail if they aren’t equal', () => {
    expect(matches({ value: 'third', node }, 'first')).toBe(false)
  })

  it('fails on non matching regex', () => {
    expect(matches({ value: 'third', node }, /^thirds/)).toBe(false)
  })

  it('passes if simple strings match', () => {
    expect(matches({ value: 'second', node }, 'third', 'second')).toBe(true)
  })

  it('passes on matching regex', () => {
    expect(matches({ value: 'third', node }, /^third/)).toBe(true)
  })

  it('passes on matching mixed regex and string', () => {
    expect(
      matches({ value: 'first-fourth', node }, 'second', /^third/, /fourth$/)
    ).toBe(true)
  })

  it('fails on a regular expression encoded as a string', () => {
    expect(matches({ value: 'mypassword', node }, '/[0-9]/')).toBe(false)
  })

  it('passes on a regular expression encoded as a string', () => {
    expect(matches({ value: 'mypa55word', node }, '/[0-9]/')).toBe(true)
  })

  it('passes on a regular expression containing slashes', () => {
    expect(matches({ value: 'https://', node }, '/https?:///')).toBe(true)
  })
})
