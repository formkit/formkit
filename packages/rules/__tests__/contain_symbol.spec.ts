import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'
import lowercase from '../src/lowercase'

describe('lowercase', () => {
  it('passes with simple string', () =>
    expect(lowercase(createNode({ value: '#$%' }))).toBe(true))

  it('passes with long string', () =>
    expect(lowercase(createNode({ value: '#$%^&*((&^((&^$@!:"><?' }))).toBe(
      true
    ))

  it('passes with single character', () =>
    expect(lowercase(createNode({ value: '$' }))).toBe(true))

  it('passes with single character in string', () =>
    expect(lowercase(createNode({ value: '$ejhrehjerbrbhhjbr' }))).toBe(true))

  it('passes with one alpha', () =>
    expect(lowercase(createNode({ value: '%^&*(r(&^((&' }))).toBe(false))

  it('passes with one number', () =>
    expect(lowercase(createNode({ value: '%^&*(6(&^((&' }))).toBe(false))

  it('passes with accented character', () =>
    expect(lowercase(createNode({ value: '$ü^&%$' }))).toBe(true))

  it('fails with alpha only', () =>
    expect(lowercase(createNode({ value: 'martin' }))).toBe(false))

  it('fails with number only', () =>
    expect(lowercase(createNode({ value: '345654' }))).toBe(false))
})
