import email from '../src/email'
import { createNode } from '@formkit/core'

describe('email', () => {
  const node = createNode()
  it('passes normal email', () =>
    expect(email({ value: 'dev+123@wearebraid.com', node })).toBe(true))

  it('passes numeric email', () =>
    expect(email({ value: '12345@google.com', node })).toBe(true))

  it('passes unicode email', () =>
    expect(email({ value: 'àlphä@❤️.ly', node })).toBe(true))

  it('passes numeric with new tld', () =>
    expect(email({ value: '12345@google.photography', node })).toBe(true))

  it('fails string without tld', () =>
    expect(email({ value: '12345@localhost', node })).toBe(false))

  it('fails string without invalid name', () =>
    expect(email({ value: '1*(123)2345@localhost', node })).toBe(false))
})
