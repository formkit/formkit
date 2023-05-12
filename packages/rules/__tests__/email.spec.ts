import email from '../src/email'
import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'

describe('email', () => {
  it('passes normal email', () =>
    expect(email(createNode({ value: 'dev+123@wearebraid.com' }))).toBe(true))

  it('passes numeric email', () =>
    expect(email(createNode({ value: '12345@google.com' }))).toBe(true))

  it('passes unicode email', () =>
    expect(email(createNode({ value: 'àlphä@❤️.ly' }))).toBe(true))

  it('passes numeric with new tld', () =>
    expect(email(createNode({ value: '12345@google.photography' }))).toBe(true))

  it('fails string without tld', () =>
    expect(email(createNode({ value: '12345@localhost' }))).toBe(false))

  it('fails string without invalid name', () =>
    expect(email(createNode({ value: '1*(123)2345@localhost' }))).toBe(false))
})
