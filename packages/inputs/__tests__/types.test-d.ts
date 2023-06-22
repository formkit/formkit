import { describe, assertType, it } from 'vitest'
import { FormKitEvents } from '../src/props'

describe('base events', () => {
  it('has an input event', () => {
    const inputEvent = (event: 'input', value: string | undefined) =>
      event && value
    assertType<FormKitEvents<{}>>(inputEvent)
  })

  it('the input event provides the correct value', () => {
    const inputEvent = (event: 'input', value: number | undefined) =>
      event && value
    // @ts-expect-error - string is not assignable to number
    assertType<FormKitEvents<{}>>(inputEvent)
  })

  it('does not have foobar event', () => {
    const inputEvent = (event: 'foobar', value: string | undefined) =>
      event && value
    // @ts-expect-error - foobar is not a valid event
    assertType<FormKitEvents<{}>>(inputEvent)
  })

  it('does not have submit event', () => {
    const inputEvent = (event: 'submit', value: string | undefined) =>
      event && value
    // @ts-expect-error - foobar is not a valid event
    assertType<FormKitEvents<{ type: 'select' }>>(inputEvent)
  })
})

describe('form events', () => {
  it('should have input event', () => {
    const inputEvent = (event: 'submit', value: string | undefined) =>
      event && value
    assertType<FormKitEvents<{ type: 'form' }>>(inputEvent)
  })
})
