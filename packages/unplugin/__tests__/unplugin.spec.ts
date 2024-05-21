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

  it('can deoptimize i18n locales manually', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/SimpleRender.vue'),
      {
        configFile: resolve(
          __dirname,
          './fixtures/configs/i18n-deopt.config.ts'
        ),
      }
    )

    expect(code).toContain('import { locales } from "virtual:formkit/locales";')
  })
})

describe('icons', () => {
  it('can import icons directly with no config', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/IconInputs.vue')
    )
    expect(code).toMatchInlineSnapshot(`
      "import { star } from "virtual:formkit/icons:star";
      import { icons } from "virtual:formkit/icons";
      import { library } from "virtual:formkit/inputs:text";
      import { bindings } from "@formkit/vue";
      import { FormKit } from "@formkit/vue";
      const _sfc_main = {}
      import { resolveComponent as _resolveComponent, openBlock as _openBlock, createBlock as _createBlock } from "vue"

      function _sfc_render(_ctx, _cache) {
        const _component_FormKit = FormKit

        return (_openBlock(), _createBlock(_component_FormKit, {
          "prefix-icon": "star",

          __config__: ({
            plugins: ([bindings, library, icons]),

            props: ({
              __icons__: ({
                star: star
              })
            })
          })
        }));
      }


      import _export_sfc from ' plugin-vue:export-helper'
      export default /*#__PURE__*/_export_sfc(_sfc_main, [['render',_sfc_render],['__file',"/Users/justinschroeder/Projects/formkit/packages/unplugin/__tests__/fixtures/IconInputs.vue"]])"
    `)
  })

  it('loads the themes plugin instead of icons individual icons when deoptimized', async ({
    expect,
  }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/IconInputs.vue'),
      {
        configFile: resolve(
          __dirname,
          './fixtures/configs/icon-deopt.config.ts'
        ),
      }
    )
    expect(code).toMatchInlineSnapshot(`
      "import { nodeOptions } from "virtual:formkit/nodeOptions";
      import { themes } from "virtual:formkit/themes";
      import { library } from "virtual:formkit/inputs:text";
      import { bindings } from "@formkit/vue";
      import { FormKit } from "@formkit/vue";
      const _sfc_main = {}
      import { resolveComponent as _resolveComponent, openBlock as _openBlock, createBlock as _createBlock } from "vue"

      function _sfc_render(_ctx, _cache) {
        const _component_FormKit = FormKit

        return (_openBlock(), _createBlock(_component_FormKit, {
          "prefix-icon": "star",

          __config__: (nodeOptions(({
            plugins: ([bindings, library, themes])
          })))
        }));
      }


      import _export_sfc from ' plugin-vue:export-helper'
      export default /*#__PURE__*/_export_sfc(_sfc_main, [['render',_sfc_render],['__file',"/Users/justinschroeder/Projects/formkit/packages/unplugin/__tests__/fixtures/IconInputs.vue"]])"
    `)
  })
})

describe('nested schema features', () => {
  it.only('loads icons and validation from inside a nested inputs', async ({
    expect,
  }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/NestedInput.vue'),
      {
        configFile: resolve(
          __dirname,
          './fixtures/configs/nested-input-features.config.ts'
        ),
      }
    )
    expect(code).toMatchInlineSnapshot('')
  })
})

describe('nodeOptions', () => {
  it('does not inject nodeOptions when not used', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/SimpleRender.vue')
    )
    expect(code).not.toContain('nodeOptions')
  })
})
