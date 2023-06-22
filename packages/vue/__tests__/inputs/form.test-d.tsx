import { describe, it, assertType, expectTypeOf } from 'vitest'
import FormKit, { Slots } from '../../src/FormKit'
import { FormKitFrameworkContext } from '@formkit/core'
import { FormKitGroupValue } from '@formkit/core'

describe('describe form input types', () => {
  it('accepts the correct value type', () => {
    assertType(<FormKit type="form" value={{ name: 'happy.png' }} />)
  })

  it('has a submit event', () => {
    assertType(
      <FormKit
        type="form"
        onSubmit={(foo) => foo}
        value={{ name: 'happy.png' }}
      />
    )
  })

  it('has some of the base slots', () => {
    expectTypeOf<
      Parameters<Slots<{ type: 'form' }>['form']>[0]
    >().toMatchTypeOf<FormKitFrameworkContext<FormKitGroupValue | undefined>>()
  })

  it('has form specific slots', () => {
    expectTypeOf<
      Parameters<Slots<{ type: 'form' }>['default']>[0]
    >().toMatchTypeOf<FormKitFrameworkContext<FormKitGroupValue | undefined>>()
  })

  it('does not allow a string as a value', () => {
    // @ts-expect-error - value cannot be a string
    assertType(<FormKit type="form" value="123" />)
  })

  it('does not allow a number as a value', () => {
    // @ts-expect-error - value cannot be a number
    assertType(<FormKit type="form" value={123} />)
  })

  it('does not require a value', () => {
    assertType(<FormKit type="form" />)
  })
})
