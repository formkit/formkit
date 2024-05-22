// @vitest-environment node
import { describe, it } from 'vitest'
import { form, select } from '@formkit/inputs'
import {
  createFeats,
  extractInputTypesFromSchema,
  extractUsedFeaturesInSchema,
} from '../src/utils/formkit'

describe('extractInputTypesFromSchema', () => {
  it('can extract input types from existing schemas', async ({ expect }) => {
    const schema =
      typeof form.schema === 'function' ? form.schema({}) : form.schema
    expect(await extractInputTypesFromSchema(schema!)).toEqual(
      new Set(['submit'])
    )
  })
})

describe('extractUsedFeaturesInSchema', () => {
  it('can extract all the sections in a given input', async ({ expect }) => {
    const schema = select.schema({})
    const feats = createFeats()
    await extractUsedFeaturesInSchema(schema, feats)
    expect(feats.sections).toEqual(
      new Set([
        'outer',
        'wrapper',
        'label',
        'inner',
        'prefixIcon',
        'prefix',
        'input',
        'options',
        'optGroup',
        'option',
        'selectIcon',
        'suffix',
        'suffixIcon',
        'help',
        'messages',
        'message',
      ])
    )
  })
})
