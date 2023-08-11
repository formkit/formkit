import { describe, assertType, it } from 'vitest'
import { FormKitEvents } from '../src/props'
import { createNode } from '@formkit/core'

declare const textEvent: FormKitEvents<{ type: 'text' }>
declare const formEvent: FormKitEvents<{ type: 'form' }>

describe('base events', () => {
  it('has an input event', () => {
    assertType(textEvent('input', 'foo', createNode()))
  })

  it('the input event provides the correct value', () => {
    // @ts-expect-error - string is not assignable to number
    assertType(textEvent('input', 123, createNode()))
  })

  it('does not have foobar event', () => {
    // @ts-expect-error - foobar is not a valid event
    assertType(textEvent('foobar', 'foo', createNode()))
  })

  it('does not have submit event', () => {
    // @ts-expect-error - submit is not a valid event
    assertType(textEvent('submit', 'foo', createNode()))
  })
})

describe('form events', () => {
  it('should have input event', () => {
    assertType(formEvent('input', {}, createNode()))
  })

  it('should have input event that does not allow strings', () => {
    // @ts-expect-error - string is not assignable to object
    assertType(formEvent('input', '12312', createNode()))
  })

  it('should have a submit event', () => {
    assertType(formEvent('submit', {}, createNode()))
  })
})
