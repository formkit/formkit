// @vitest-environment node
import { describe, it } from 'vitest'
import { sfcTransform } from './helpers/transform'
import { resolve } from 'pathe'

describe('ssr', () => {
  it('can render a simple component via SSR', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/SimpleRender.vue'),
      {},
      true // ssr
    )
    expect(code).toMatchInlineSnapshot(`
      "import { textClasses } from "virtual:formkit/classes:text";
      import { locales } from "virtual:formkit/locales:required";
      import { i18n } from "virtual:formkit/i18n";
      import { validation as validation1 } from "virtual:formkit/validation";
      import { required } from "virtual:formkit/rules:required";
      import { library } from "virtual:formkit/inputs:text";
      import { bindings } from "@formkit/vue";
      import { FormKit } from "@formkit/vue";
      const _sfc_main = {};
      import { resolveComponent as _resolveComponent } from "vue";
      import { ssrRenderComponent as _ssrRenderComponent, ssrRenderAttrs as _ssrRenderAttrs } from "vue/server-renderer";
      function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
        const _component_FormKit = FormKit;
        _push(\`<div\${_ssrRenderAttrs(_attrs)}>\`);
        _push(_ssrRenderComponent(_component_FormKit, {
          type: "text",
          validation: "required",

          __config__: ({
            plugins: ([bindings, library, validation1, i18n]),

            config: ({
              rootClasses: textClasses
            }),

            props: ({
              __rules__: ({
                required: required
              }),

              __locales__: locales
            })
          })
        }, null, _parent));
        _push(_ssrRenderComponent(_component_FormKit, {
          type: "text",

          __config__: ({
            plugins: ([bindings, library]),

            config: ({
              rootClasses: textClasses
            })
          })
        }, null, _parent));
        _push(_ssrRenderComponent(_component_FormKit, ({
          __config__: ({
            plugins: ([bindings, library]),

            config: ({
              rootClasses: textClasses
            })
          })
        }), null, _parent));
        _push(\`</div>\`);
      }
      import { useSSRContext as __vite_useSSRContext } from "vue";
      const _sfc_setup = _sfc_main.setup;
      _sfc_main.setup = (props, ctx) => {
        const ssrContext = __vite_useSSRContext();
        (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("packages/unplugin/__tests__/fixtures/SimpleRender.vue");
        return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
      };
      import _export_sfc from "\\0plugin-vue:export-helper";
      export default /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender], ["__file", "/Users/justinschroeder/Projects/formkit/packages/unplugin/__tests__/fixtures/SimpleRender.vue"]]);
      "
    `)
  })
})
