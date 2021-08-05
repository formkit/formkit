import { createNode } from '@formkit/core'
import ends_with from '../src/ends_with'

describe('endsWith', () => {
  it('fails when value ending is not in stack of single value', () => {
    expect(
      ends_with(createNode({ value: 'andrew@wearebraid.com' }), '@gmail.com')
    ).toBe(false)
  })

  it('fails when value ending is not in stack of multiple values', () => {
    expect(
      ends_with(
        createNode({ value: 'andrew@wearebraid.com' }),
        '@gmail.com',
        '@yahoo.com'
      )
    ).toBe(false)
  })

  it('fails when passed value is not a string', () => {
    expect(
      ends_with(createNode({ value: 'andrew@wearebraid.com' }), [
        '@gmail.com',
        '@wearebraid.com',
      ])
    ).toBe(false)
  })

  it('fails when passed value is not a string', () => {
    expect(
      ends_with(createNode({ value: 'andrew@wearebraid.com' }), {
        value: '@wearebraid.com',
      })
    ).toBe(false)
  })

  it('passes when a string value is present and matched even if non-string values also exist as arguments', () => {
    expect(
      ends_with(
        createNode({ value: 'andrew@wearebraid.com' }),
        { value: 'bad data' },
        ['no bueno'],
        '@wearebraid.com'
      )
    ).toBe(true)
  })

  it('passes when stack consists of zero values', () => {
    expect(ends_with(createNode({ value: 'andrew@wearebraid.com' }))).toBe(true)
  })

  it('passes when value ending is in stack of single value', () => {
    expect(
      ends_with(
        createNode({ value: 'andrew@wearebraid.com' }),
        '@wearebraid.com'
      )
    ).toBe(true)
  })

  it('passes when value ending is in stack of multiple values', () => {
    expect(
      ends_with(
        createNode({ value: 'andrew@wearebraid.com' }),
        '@yahoo.com',
        '@wearebraid.com',
        '@gmail.com'
      )
    ).toBe(true)
  })
})
