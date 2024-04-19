// @vitest-environment node
import { describe, it } from 'vitest'
import { createCommonJS } from 'mlly'
import { resolve } from 'path'
import { sfcTransform } from './helpers/transform'
import { load } from './helpers/load'

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
})

describe('input config loading', () => {
  it('directly imports the input from @formkit/inputs', async ({ expect }) => {
    const code = await load('virtual:formkit/inputs:text')
    expect(code).toMatchInlineSnapshot(`
      "import { text } from "@formkit/inputs";
      const library = () => {};
      library.library = node => node.define(text);
      export { library };"
    `)
  })

  it('can extract an inline createInput', async ({ expect }) => {
    const code = await load('virtual:formkit/inputs:custom', {
      configFile: resolve(
        __dirname,
        './fixtures/configs/formkit-custom-input.config.ts'
      ),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { createInput } from "@formkit/vue";
      import CustomComponent from "../CustomComponent.vue";
      const __extracted__ = createInput(CustomComponent);
      const library = () => {};
      library.library = node => node.define(__extracted__);
      export { library };"
    `)
  })

  it('can import a replaced text input', async ({ expect }) => {
    const code = await load('virtual:formkit/inputs:text', {
      configFile: resolve(
        __dirname,
        './fixtures/configs/formkit-custom-input.config.ts'
      ),
    })
    expect(code).toMatchInlineSnapshot(`
      "const headingStyle = "h1";

      const __extracted__ = {
          type: "input",

          schema: [{
              $el: headingStyle,
              text: "Hello World"
          }]
      };

      const library = () => {};
      library.library = node => node.define(__extracted__);
      export { library };"
    `)
  })

  it('can import a de-optimized library', async ({ expect }) => {
    const code = await load('virtual:formkit/library', {
      configFile: resolve(
        __dirname,
        './fixtures/configs/formkit-custom-input.config.ts'
      ),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { createLibraryPlugin, inputs } from "@formkit/inputs";
      import { createInput } from "@formkit/vue";
      import CustomComponent from "../CustomComponent.vue";
      const headingStyle = "h1";

      const __extracted__ = {
          text: {
              type: "input",

              schema: [{
                  $el: headingStyle,
                  text: "Hello World"
              }]
          },

          custom: createInput(CustomComponent)
      };

      const library = createLibraryPlugin({
          ...inputs,
          ...__extracted__
      });

      export { library };"
    `)
  })
})
