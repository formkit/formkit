import { describe, assertType, it, expectTypeOf } from 'vitest'
import type { FormKitEvents, FormKitInputSlots, PropType } from '../src/props'
import { createNode } from '@formkit/core'
import type { FormKitTypeDefinition } from '@formkit/core'

const textEvent: FormKitEvents<{ type: 'text' }> = () => {}
const formEvent: FormKitEvents<{ type: 'form' }> = () => {}
const textSlots: FormKitInputSlots<{ type: 'text' }>['text'] = 0 as any
const customInputProps: {
  type: FormKitTypeDefinition<number>
  modelValue: number
} = 0 as any
const customInputPropType: PropType<typeof customInputProps, 'value'> = 0 as any

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

describe('base slots', () => {
  it('has all the base slots', () => {
    assertType(textSlots.outer)
    assertType(textSlots.wrapper)
    assertType(textSlots.label)
    assertType(textSlots.inner)
    assertType(textSlots.input)
    assertType(textSlots.help)
    assertType(textSlots.messages)
    assertType(textSlots.message)
    assertType(textSlots.suffixIcon)
    assertType(textSlots.prefixIcon)
  })
  it('does not allow the default slot', () => {
    // @ts-expect-error - default is not a valid slot
    assertType(textSlots.default)
  })
})

describe('custom inputs', () => {
  it('can infer the correct value type from a custom input definition', () => {
    expectTypeOf(customInputPropType).toMatchTypeOf<number>(123)
  })
})
