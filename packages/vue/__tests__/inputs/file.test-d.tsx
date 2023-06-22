import { describe, it, assertType, expectTypeOf } from 'vitest'
import FormKit, { Slots } from '../../src/FormKit'
import { FormKitFrameworkContext } from '@formkit/core'
import { FormKitFile } from '@formkit/inputs'

describe('describe file input types', () => {
  it('accepts the correct value type', () => {
    assertType(<FormKit type="file" value={[{ name: 'happy.png' }]} />)
  })

  it('has some of the base slots', () => {
    expectTypeOf<
      Parameters<Slots<{ type: 'file' }>['outer']>[0]
    >().toMatchTypeOf<FormKitFrameworkContext<FormKitFile[] | undefined>>()
    expectTypeOf<
      Parameters<Slots<{ type: 'file' }>['inner']>[0]
    >().toMatchTypeOf<FormKitFrameworkContext<FormKitFile[] | undefined>>()
  })

  it('has file specific slots', () => {
    expectTypeOf<
      Parameters<Slots<{ type: 'file' }>['fileName']>[0]
    >().toMatchTypeOf<
      FormKitFrameworkContext<FormKitFile[] | undefined> & { file: FormKitFile }
    >()
  })

  it('does not allow a string as a value', () => {
    // @ts-expect-error - value cannot be a string
    assertType(<FormKit type="file" value="123" />)
  })

  it('does not allow a number as a value', () => {
    // @ts-expect-error - value cannot be a number
    assertType(<FormKit type="file" value={123} />)
  })

  it('does not require a value', () => {
    assertType(<FormKit type="file" />)
  })
})
