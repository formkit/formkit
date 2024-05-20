// @vitest-environment node
import { describe, it } from 'vitest'
import { form } from '@formkit/inputs'
import { extractInputTypesFromSchema } from '../src/utils/formkit'

describe('extractInputTypesFromSchema', () => {
  it('can extract input types from existing schemas', async ({ expect }) => {
    const schema =
      typeof form.schema === 'function' ? form.schema({}) : form.schema
    expect(await extractInputTypesFromSchema(schema!)).toEqual(
      new Set(['submit'])
    )
  })
})
