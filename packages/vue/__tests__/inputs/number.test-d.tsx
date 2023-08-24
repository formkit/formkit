import { describe, it, assertType } from 'vitest'
import FormKit from '../../src/FormKit'
/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('describe number input types', () => {
  it('changes it only allows numbers when the number prop is applied', () => {
    // @ts-expect-error - value cannot be a string
    assertType(<FormKit type="number" number value="string" />)
    // @ts-expect-error - value cannot be a boolean
    assertType(<FormKit type="number" number value={true} />)

    assertType(<FormKit type="number" number value={123431} />)
    assertType(<FormKit type="number" number value={undefined} />)
  })
})
