import { createNode } from '@formkit/core'
import ends_with from '../src/ends_with'

describe('endsWith', () => {
  const node = createNode()
  it('fails when value ending is not in stack of single value', () => {
    expect(
      ends_with({ value: 'andrew@wearebraid.com', node }, '@gmail.com')
    ).toBe(false)
  })

  it('fails when value ending is not in stack of multiple values', () => {
    expect(
      ends_with(
        { value: 'andrew@wearebraid.com', node },
        '@gmail.com',
        '@yahoo.com'
      )
    ).toBe(false)
  })

  it('fails when passed value is not a string', () => {
    expect(
      ends_with({ value: 'andrew@wearebraid.com', node }, [
        '@gmail.com',
        '@wearebraid.com',
      ])
    ).toBe(false)
  })

  it('fails when passed value is not a string', () => {
    expect(
      ends_with(
        { value: 'andrew@wearebraid.com', node },
        { value: '@wearebraid.com' }
      )
    ).toBe(false)
  })

  it('passes when a string value is present and matched even if non-string values also exist as arguments', () => {
    expect(
      ends_with(
        { value: 'andrew@wearebraid.com', node },
        { value: 'bad data' },
        ['no bueno'],
        '@wearebraid.com'
      )
    ).toBe(true)
  })

  it('passes when stack consists of zero values', () => {
    expect(ends_with({ value: 'andrew@wearebraid.com', node })).toBe(true)
  })

  it('passes when value ending is in stack of single value', () => {
    expect(
      ends_with({ value: 'andrew@wearebraid.com', node }, '@wearebraid.com')
    ).toBe(true)
  })

  it('passes when value ending is in stack of multiple values', () => {
    expect(
      ends_with(
        { value: 'andrew@wearebraid.com', node },
        '@yahoo.com',
        '@wearebraid.com',
        '@gmail.com'
      )
    ).toBe(true)
  })
})
