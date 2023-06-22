import { describe, it, assertType } from 'vitest'
import FormKit from '../../src/FormKit'

describe('describe file input types', () => {
  it('accepts the correct value type', () => {
    assertType(
      <FormKit
        type="select"
        value={2}
        options={[
          { label: 'A', value: 1 },
          { label: 'B', value: 2 },
        ]}
      />
    )
  })

  it('does not allow a string as a value', () => {
    assertType(
      <FormKit
        type="select"
        // @ts-expect-error - value cannot be a string if options are numbers
        value="1"
        options={[
          { label: 'A', value: 1 },
          { label: 'B', value: 2 },
        ]}
      />
    )
  })

  it('does not allow a number as a value', () => {
    // @ts-expect-error - value cannot be a number
    assertType(<FormKit type="select" value={123} />)
  })

  it('does not require a value', () => {
    assertType(<FormKit type="select" />)
  })
})
