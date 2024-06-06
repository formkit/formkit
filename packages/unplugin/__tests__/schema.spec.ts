// @vitest-environment node

import { describe, it } from 'vitest'
import { createCommonJS } from 'mlly'
import { resolve } from 'path'
import { sfcTransform } from './helpers/transform'

const { __dirname } = createCommonJS(import.meta.url)

describe('sfc schema transform', () => {
  it('injects nothing if schema prop is not used', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/NoSchema.vue')
    )
    expect(code).toMatchInlineSnapshot(`
      "import { FormKitSchema } from "@formkit/vue";
      const _sfc_main = {};
      import { resolveComponent as _resolveComponent, createVNode as _createVNode, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue";
      function _sfc_render(_ctx, _cache) {
        const _component_FormKitSchema = FormKitSchema;
        return _openBlock(), _createElementBlock("div", null, [
          _createVNode(_component_FormKitSchema, ({}))
        ]);
      }
      import _export_sfc from "\\0plugin-vue:export-helper";
      export default /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "/Users/justinschroeder/Projects/formkit/packages/unplugin/__tests__/fixtures/NoSchema.vue"]]);
      "
    `)
  })

  it('injects __config__ at the point of schema use', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/SimpleSchema.vue'),
      {
        configFile: resolve(__dirname, './fixtures/configs/formkit-debug.ts'),
      }
    )
    expect(code).toMatchInlineSnapshot(`
      "import { nodeOptions } from "virtual:formkit/nodeOptions";
      import { mergeRootClasses } from "virtual:formkit/merge-rootClasses";
      import { textClasses } from "virtual:formkit/classes:text";
      import { locales } from "virtual:formkit/locales:required,min";
      import { i18n } from "virtual:formkit/i18n";
      import { validation as validation1 } from "virtual:formkit/validation";
      import { min } from "virtual:formkit/rules:min";
      import { required } from "virtual:formkit/rules:required";
      import { library } from "virtual:formkit/inputs:text";
      import { bindings } from "@formkit/vue";
      import { FormKitSchema } from "@formkit/vue";
      import { defineComponent as _defineComponent } from "vue";
      import { resolveComponent as _resolveComponent, createVNode as _createVNode, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue";
      export default /* @__PURE__ */ _defineComponent({
        __name: "SimpleSchema",
        setup(__props) {
          const schema = [
            {
              $formkit: "text",
              validation: "required|min:5"
            }
          ];
          return (_ctx, _cache) => {
            const _component_FormKitSchema = FormKitSchema;
            return _openBlock(), _createElementBlock("div", null, [
              _createVNode(_component_FormKitSchema, {
                schema,

                __config__: (nodeOptions(({
                  config: ({
                    rootClasses: (mergeRootClasses(([textClasses])))
                  }),

                  props: ({
                    __rules__: ({
                      required: required,
                      min: min
                    }),

                    __locales__: locales
                  }),

                  plugins: ([bindings, library, validation1, i18n])
                })))
              })
            ]);
          };
        }
      });
      "
    `)
  })
})
