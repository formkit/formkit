import { describe, it, assertType } from 'vitest'
import formKitComponent from '../../src/FormKit'

describe('describe', () => {
  it('handles', () => {
    assertType(formKitComponent({}))
  })
})
