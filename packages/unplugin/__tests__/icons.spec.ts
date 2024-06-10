// @vitest-environment node

import { describe, it } from 'vitest'
import { sfcTransform } from './helpers/transform'
import { resolve } from 'pathe'

describe('formkit icon injection', () => {
  it('does not inject anything if the icon is an svg', async ({ expect }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/IconSVGRender.vue')
    )
    expect(code).toMatchInlineSnapshot(`
      "import { FormKitIcon } from "@formkit/vue";
      const _sfc_main = {};
      import { resolveComponent as _resolveComponent, createVNode as _createVNode, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue";
      function _sfc_render(_ctx, _cache) {
        const _component_FormKitIcon = FormKitIcon;
        return _openBlock(), _createElementBlock("div", null, [
          _createVNode(_component_FormKitIcon, { icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">\\n  <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />\\n</svg>' })
        ]);
      }
      import _export_sfc from "\\0plugin-vue:export-helper";
      export default /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "/Users/justinschroeder/Projects/formkit/packages/unplugin/__tests__/fixtures/IconSVGRender.vue"]]);
      "
    `)
  })

  it('can import an icon from the icon library and inject it', async ({
    expect,
  }) => {
    const code = await sfcTransform(
      resolve(__dirname, './fixtures/IconRender.vue')
    )
    expect(code).toMatchInlineSnapshot(`
      "import { time } from "virtual:formkit/icons:time";
      import { FormKitIcon } from "@formkit/vue";
      const _sfc_main = {};
      import { resolveComponent as _resolveComponent, createVNode as _createVNode, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue";
      function _sfc_render(_ctx, _cache) {
        const _component_FormKitIcon = FormKitIcon;
        return _openBlock(), _createElementBlock("div", null, [
          _createVNode(_component_FormKitIcon, { icon: time })
        ]);
      }
      import _export_sfc from "\\0plugin-vue:export-helper";
      export default /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "/Users/justinschroeder/Projects/formkit/packages/unplugin/__tests__/fixtures/IconRender.vue"]]);
      "
    `)
  })
})
