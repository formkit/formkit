// @vitest-environment node
import { describe, it } from 'vitest'
import { createCommonJS } from 'mlly'
import { resolve } from 'path'
import { sfcTransform } from './helpers/transform'

const { __dirname } = createCommonJS(import.meta.url)

describe('sfc transform', () => {
  it('injects __config__ at the point of use', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/SimpleRender.vue')
    )
    expect(code).toMatchSnapshot()
  })

  it('imports a custom input at the point of use', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/CustomComponentRender.vue')
    )
    expect(code).toContain(
      'import { library } from "virtual:formkit/inputs:custom'
    )
  })

  it('imports a custom input from config at the point of use', async ({
    expect,
  }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/CustomComponentRender.vue'),
      {
        configFile: resolve(
          __dirname,
          './fixtures/configs/formkit-custom-input.config.ts'
        ),
      }
    )
    expect(code).toMatchSnapshot()
  })

  it('automatically localizes inputs it can import', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/ButtonRender.vue')
    )
    expect(code).toContain(
      'import { locales } from "virtual:formkit/locales:submit"'
    )
  })
})
