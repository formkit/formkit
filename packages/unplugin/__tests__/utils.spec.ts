// @vitest-environment node
import { describe, it } from 'vitest'
import { form, select } from '@formkit/inputs'
import {
  createFeats,
  extractInputTypesFromSchema,
  extractUsedFeaturesInSchema,
} from '../src/utils/formkit'
import type { FormKitSchemaDefinition } from '@formkit/core'
import { createOpts, getAllInputs } from '../src/utils/config'
import { resolve } from 'pathe'
import { createCommonJS } from 'mlly'

const { __dirname } = createCommonJS(import.meta.url)

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
    const schema =
      typeof select.schema === 'function'
        ? select.schema({})
        : ({} as FormKitSchemaDefinition)
    const feats = createFeats()
    await extractUsedFeaturesInSchema(schema, feats)
    expect(feats.classes).toEqual(
      new Set([
        'outer',
        'icon',
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

describe('getAllInputs', () => {
  it('can extract all base builtin inputs', async ({ expect }) => {
    const opts = createOpts({})
    expect(await getAllInputs(opts)).toMatchInlineSnapshot(`
      Set {
        "button",
        "submit",
        "checkbox",
        "file",
        "form",
        "group",
        "hidden",
        "list",
        "meta",
        "radio",
        "select",
        "textarea",
        "text",
        "color",
        "date",
        "datetimeLocal",
        "email",
        "month",
        "number",
        "password",
        "search",
        "tel",
        "time",
        "url",
        "week",
        "range",
      }
    `)
  })

  it('can extract all base builtin inputs and custom ones', async ({
    expect,
  }) => {
    const opts = createOpts({
      configFile: resolve(
        __dirname,
        './fixtures/configs/formkit-custom-input.config.ts'
      ),
    })
    expect(await getAllInputs(opts)).toMatchInlineSnapshot(`
      Set {
        "button",
        "submit",
        "checkbox",
        "file",
        "form",
        "group",
        "hidden",
        "list",
        "meta",
        "radio",
        "select",
        "textarea",
        "text",
        "color",
        "date",
        "datetimeLocal",
        "email",
        "month",
        "number",
        "password",
        "search",
        "tel",
        "time",
        "url",
        "week",
        "range",
        "custom",
      }
    `)
  })

  it('can extract inputs without builtins', async ({ expect }) => {
    const opts = createOpts({
      configFile: resolve(
        __dirname,
        './fixtures/configs/no-input-builtins.config.ts'
      ),
    })
    expect(await getAllInputs(opts)).toMatchInlineSnapshot(`
      Set {
        "text",
        "custom",
      }
    `)
  })
})
