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

describe('manual deoptimizations', async () => {
  it('can disable input optimizations', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/SimpleRender.vue'),
      {
        configFile: resolve(
          __dirname,
          './fixtures/configs/input-deopt.config.ts'
        ),
      }
    )
    expect(code).toContain('import { library } from "virtual:formkit/library";')
    expect(code).not.toContain('virtual:formkit/inputs:text')
  })

  it('can disable input optimizations w/ object', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/SimpleRender.vue'),
      {
        configFile: resolve(
          __dirname,
          './fixtures/configs/input-deopt-obj.config.ts'
        ),
      }
    )
    expect(code).toContain('import { library } from "virtual:formkit/library";')
    expect(code).not.toContain('virtual:formkit/inputs:text')
  })

  it('can disable validation optimizations', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/SimpleRender.vue'),
      {
        configFile: resolve(
          __dirname,
          './fixtures/configs/validation-deopt.config.ts'
        ),
      }
    )
    expect(code).toContain(
      'import { validation as validation1 } from "virtual:formkit/validation'
    )
    expect(code).toContain('import { rules } from "virtual:formkit/rules";')
    expect(code).not.toContain('virtual:formkit/rules:required')
  })

  it('can automatically disable validation optimizations when bound', async ({
    expect,
  }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/ValidationDeopt.vue'),
      {
        configFile: resolve(
          __dirname,
          './fixtures/configs/validation-deopt.config.ts'
        ),
      }
    )
    expect(code).toContain(
      'import { validation as validation1 } from "virtual:formkit/validation'
    )
    expect(code).toContain('import { rules } from "virtual:formkit/rules";')
  })
})
