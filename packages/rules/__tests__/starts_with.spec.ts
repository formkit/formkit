import { createNode } from '@formkit/core'
import starts_with from '../src/starts_with'

describe('starts_with', () => {
  it('fails when value starting is not in stack of single value', () => {
    expect(starts_with(createNode({ value: 'taco tuesday' }), 'pizza')).toBe(
      false
    )
  })

  it('fails when value starting is not in stack of multiple values', () => {
    expect(
      starts_with(createNode({ value: 'taco tuesday' }), 'pizza', 'coffee')
    ).toBe(false)
  })

  it('fails when passed value is not a string', () => {
    expect(
      starts_with(createNode({ value: 'taco tuesday' }), ['taco', 'pizza'])
    ).toBe(false)
  })

  it('fails when passed value is not a string', () => {
    expect(
      starts_with(createNode({ value: 'taco tuesday' }), { value: 'taco' })
    ).toBe(false)
  })

  it('passes when a string value is present and matched even if non-string values also exist as arguments', () => {
    expect(
      starts_with(
        createNode({ value: 'taco tuesday' }),
        { value: 'taco' },
        ['taco'],
        'taco'
      )
    ).toBe(true)
  })

  it('passes when stack consists of zero values', () => {
    expect(starts_with(createNode({ value: 'taco tuesday' }))).toBe(true)
  })

  it('passes when value starting is in stack of single value', () => {
    expect(starts_with(createNode({ value: 'taco tuesday' }), 'taco')).toBe(
      true
    )
  })

  it('passes when value starting is in stack of multiple values', () => {
    expect(
      starts_with(
        createNode({ value: 'taco tuesday' }),
        'pizza',
        'taco',
        'coffee'
      )
    ).toBe(true)
  })
})
