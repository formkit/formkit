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

      const library = () => {
          return false;
      };

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

      const library = () => {
          return false;
      };

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

describe('validation config loading', () => {
  it('can load the validation plugin', async ({ expect }) => {
    const code = await load('virtual:formkit/validation')
    expect(code).toMatchInlineSnapshot(`
      "import { createValidationPlugin } from '@formkit/validation'
      const validation = createValidationPlugin({})
      export { validation }
      "
    `)
  })

  it('can load a validation rule from @formkit/rules', async ({ expect }) => {
    const code = await load('virtual:formkit/rules:length')
    expect(code).toMatchInlineSnapshot(
      `"export { length } from "@formkit/rules";"`
    )
  })

  it('can load a validation rule from a custom config', async ({ expect }) => {
    const code = await load('virtual:formkit/rules:length', {
      configFile: resolve(
        __dirname,
        './fixtures/configs/formkit-custom-input.config.ts'
      ),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { empty } from "@formkit/utils";

      function __extracted__(node) {
          if (empty(node.value))
              return false;

          if (typeof node.value === "string" || Array.isArray(node.value)) {
              return node.value.length > 0;
          }

          return false;
      }

      export const length = __extracted__;"
    `)
  })
})

describe('i18n config loading', () => {
  it('can load the i18n plugin', async ({ expect }) => {
    const code = await load('virtual:formkit/i18n')
    expect(code).toMatchInlineSnapshot(`
      "import { createI18nPlugin } from "@formkit/i18n/i18n";
      export const i18n = createI18nPlugin({});"
    `)
  })
  it('can load a single message from a single locale', async ({ expect }) => {
    const code = await load('virtual:formkit/locales:required')
    expect(code).toMatchInlineSnapshot(`
      "import { required } from "@formkit/i18n/locales/en";

      export const locales = {
          en: ({
              validation: {
                  required: required
              },

              ui: {}
          })
      };"
    `)
  })
  it('can load a multiple messages from the default locale', async ({
    expect,
  }) => {
    const code = await load('virtual:formkit/locales:required,length,remove')
    expect(code).toMatchInlineSnapshot(`
      "import { length } from "@formkit/i18n/locales/en";
      import { required } from "@formkit/i18n/locales/en";
      import { remove } from "@formkit/i18n/locales/en";

      export const locales = {
          en: ({
              validation: {
                  required: required,
                  length: length
              },

              ui: {
                  remove: remove
              }
          })
      };"
    `)
  })
  it('can load a multiple messages from multiple locales', async ({
    expect,
  }) => {
    const code = await load('virtual:formkit/locales:required,length,remove', {
      configFile: resolve(
        __dirname,
        './fixtures/configs/formkit-custom-input.config.ts'
      ),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { length as length1 } from "@formkit/i18n/locales/ar";
      import { required as required1 } from "@formkit/i18n/locales/ar";
      import { remove as remove1 } from "@formkit/i18n/locales/ar";
      import { length } from "@formkit/i18n/locales/de";
      import { required } from "@formkit/i18n/locales/de";
      import { remove } from "@formkit/i18n/locales/de";

      export const locales = {
          de: ({
              validation: {
                  required: required,
                  length: length
              },

              ui: {
                  remove: remove
              }
          }),

          ar: ({
              validation: {
                  required: required1,
                  length: length1
              },

              ui: {
                  remove: remove1
              }
          })
      };"
    `)
  })
})
