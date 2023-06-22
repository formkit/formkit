import { describe, it, expectTypeOf, assertType } from 'vitest'
import FormKit, { Slots } from '../../src/FormKit'
import { FormKitFrameworkContext } from '@formkit/core'
import { BaseSlots } from '../../../../.tests/helpers'
/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('describe text input types', () => {
  it('accepts the correct value type', () => {
    assertType(<FormKit type="text" value="132" />)
  })

  it('has some of the the base slots', () => {
    expectTypeOf<
      Parameters<Slots<{ type: 'text' }>[BaseSlots]>[0]
    >().toMatchTypeOf<FormKitFrameworkContext<string | undefined>>()
  })

  it('does not have a default slot', () => {
    expectTypeOf<
      // @ts-expect-error - default slot does not exist
      Parameters<Slots<{ type: 'text' }>['default']>
    >().toMatchTypeOf<any>()
  })

  it('defaults to a text input', () => {
    assertType(<FormKit />)
    assertType(<FormKit value="132" />)
    // @ts-expect-error - value cannot be a number
    assertType(<FormKit value={132} />)
  })

  it('does not allow object values', () => {
    // @ts-expect-error - value cannot be a string
    assertType(<FormKit type="text" value={123} />)
  })

  it('has an input event', () => {
    assertType(<FormKit type="text" onInput={(foo) => foo} />)
  })
})
