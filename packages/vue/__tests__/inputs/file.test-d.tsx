import { describe, it, assertType } from 'vitest'
import FormKit from '../../src/FormKit'

describe('describe', () => {
  // it('accepts the correct value type', () => {
  //   assertType(formKitComponent({ type: 'form', value: { input: '123' } }))

  //   // @ts-expect-error - value should be an object
  //   assertType(formKitComponent({ type: 'form', value: 123 }))
  // })

  it('accepts a submit handler', () => {
    // assertType(
    //   formKitComponent({
    //     type: 'form',
    //     onSubmit: () => {
    //       return
    //     },
    //   })
    // )

    assertType(<FormKit  />)

    // @ts-expect-error - onSubmit should be a function
    assertType(formKitComponent({ type: 'form' }))
  })
})
