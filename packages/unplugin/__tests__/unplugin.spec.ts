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

  it('locates the component when it is explicitly imported', async ({
    expect,
  }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/ExplicitImport.vue')
    )
    expect(code).toMatchInlineSnapshot(`
      "import { selectClasses } from "virtual:formkit/classes:select";
      import { down } from "virtual:formkit/icons:down";
      import { icons } from "virtual:formkit/icons";
      import { library } from "virtual:formkit/inputs:select";
      import { bindings } from "@formkit/vue";
      import { defineComponent as _defineComponent } from "vue";
      import { unref as _unref, createVNode as _createVNode, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue";
      import { FormKit } from "@formkit/vue";
      export default /* @__PURE__ */ _defineComponent({
        __name: "ExplicitImport",
        setup(__props) {
          return (_ctx, _cache) => {
            return _openBlock(), _createElementBlock("div", null, [
              _createVNode(_unref(FormKit), {
                type: "select",

                __config__: ({
                  plugins: ([bindings, library, icons]),

                  config: ({
                    rootClasses: selectClasses
                  }),

                  props: ({
                    __icons__: ({
                      select: down
                    })
                  })
                })
              })
            ]);
          };
        }
      });
      "
    `)
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

  it('can deoptimize themes manually', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/SimpleRender.vue'),
      {
        configFile: resolve(
          __dirname,
          './fixtures/configs/theme-deopt.config.ts'
        ),
      }
    )

    expect(code).not.toContain(
      'import { textClasses } from "virtual:formkit/classes:text";'
    )
  })
})

describe('icons', () => {
  it('can import icons directly with no config', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/IconInputs.vue')
    )
    expect(code).toMatchInlineSnapshot(`
      "import { textClasses } from "virtual:formkit/classes:text";
      import { star } from "virtual:formkit/icons:star";
      import { icons } from "virtual:formkit/icons";
      import { library } from "virtual:formkit/inputs:text";
      import { bindings } from "@formkit/vue";
      import { FormKit } from "@formkit/vue";
      const _sfc_main = {};
      import { resolveComponent as _resolveComponent, openBlock as _openBlock, createBlock as _createBlock } from "vue";
      function _sfc_render(_ctx, _cache) {
        const _component_FormKit = FormKit;
        return _openBlock(), _createBlock(_component_FormKit, {
          "prefix-icon": "star",

          __config__: ({
            plugins: ([bindings, library, icons]),

            config: ({
              rootClasses: textClasses
            }),

            props: ({
              __icons__: ({
                star: star
              })
            })
          })
        });
      }
      import _export_sfc from "\\0plugin-vue:export-helper";
      export default /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "/Users/justinschroeder/Projects/formkit/packages/unplugin/__tests__/fixtures/IconInputs.vue"]]);
      "
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
      import { textClasses } from "virtual:formkit/classes:text";
      import { themes } from "virtual:formkit/themes";
      import { library } from "virtual:formkit/inputs:text";
      import { bindings } from "@formkit/vue";
      import { FormKit } from "@formkit/vue";
      const _sfc_main = {};
      import { resolveComponent as _resolveComponent, openBlock as _openBlock, createBlock as _createBlock } from "vue";
      function _sfc_render(_ctx, _cache) {
        const _component_FormKit = FormKit;
        return _openBlock(), _createBlock(_component_FormKit, {
          "prefix-icon": "star",

          __config__: (nodeOptions(({
            plugins: ([bindings, library, themes]),

            config: ({
              rootClasses: textClasses
            })
          })))
        });
      }
      import _export_sfc from "\\0plugin-vue:export-helper";
      export default /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "/Users/justinschroeder/Projects/formkit/packages/unplugin/__tests__/fixtures/IconInputs.vue"]]);
      "
    `)
  })
})

describe('nested schema features', () => {
  it('loads icons and validation from inside a nested inputs', async ({
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
    expect(code).toMatchInlineSnapshot(`
      "import { nodeOptions } from "virtual:formkit/nodeOptions";
      import { loginClasses } from "virtual:formkit/classes:login";
      import { fileRemove } from "virtual:formkit/icons:fileRemove";
      import { fileItem } from "virtual:formkit/icons:fileItem";
      import { noFiles } from "virtual:formkit/icons:noFiles";
      import { left } from "virtual:formkit/icons:left";
      import { right } from "virtual:formkit/icons:right";
      import { lock } from "virtual:formkit/icons:lock";
      import { person } from "virtual:formkit/icons:person";
      import { icons } from "virtual:formkit/icons";
      import { locales } from "virtual:formkit/locales:required,min,remove,removeAll,noFiles,submit";
      import { i18n } from "virtual:formkit/i18n";
      import { validation } from "virtual:formkit/validation";
      import { min } from "virtual:formkit/rules:min";
      import { required } from "virtual:formkit/rules:required";
      import { library } from "virtual:formkit/inputs:login";
      import { bindings } from "@formkit/vue";
      import { FormKit } from "@formkit/vue";
      const _sfc_main = {};
      import { resolveComponent as _resolveComponent, createVNode as _createVNode, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue";
      function _sfc_render(_ctx, _cache) {
        const _component_FormKit = FormKit;
        return _openBlock(), _createElementBlock("div", null, [
          _createVNode(_component_FormKit, {
            type: "login",

            __config__: (nodeOptions(({
              plugins: ([bindings, library, validation, i18n, icons]),

              config: ({
                rootClasses: loginClasses
              }),

              props: ({
                __rules__: ({
                  required: required,
                  min: min
                }),

                __locales__: locales,

                __icons__: ({
                  person: person,
                  lock: lock,
                  prefix: right,
                  left: left,
                  noFiles: noFiles,
                  fileItem: fileItem,
                  fileRemove: fileRemove
                })
              })
            })))
          })
        ]);
      }
      import _export_sfc from "\\0plugin-vue:export-helper";
      export default /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "/Users/justinschroeder/Projects/formkit/packages/unplugin/__tests__/fixtures/NestedInput.vue"]]);
      "
    `)
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
