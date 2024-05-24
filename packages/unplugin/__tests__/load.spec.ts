// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { load } from './helpers/load'
import { createCommonJS } from 'mlly'
import { resolve } from 'pathe'

const { __dirname } = createCommonJS(import.meta.url)

describe('input config loading', () => {
  it('directly imports the input from @formkit/inputs', async ({ expect }) => {
    const code = await load('virtual:formkit/inputs:text')
    expect(code).toMatchInlineSnapshot(`
      "import { text } from "@formkit/inputs";
      const library = () => false;

      library.library = node => {
          if (node.props.type === "text") {
              return node.define(text);
          }
      };

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
      const __custom__ = createInput(CustomComponent);
      const library = () => false;

      library.library = node => {
          if (node.props.type === "custom") {
              return node.define(__custom__);
          }
      };

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

      const __text__ = {
          type: "input",

          schema: [{
              $el: headingStyle,
              text: "Hello World"
          }]
      };

      const library = () => false;

      library.library = node => {
          if (node.props.type === "text") {
              return node.define(__text__);
          }
      };

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

  it('produces a library for multiple inputs when the input being loaded contains formkit components in the schema', async () => {
    const code = await load('virtual:formkit/inputs:form')
    expect(code).toMatchInlineSnapshot(`
      "import { form } from "@formkit/inputs";
      import { submit } from "@formkit/inputs";
      const library = () => true;

      library.library = node => {
          if (node.props.type === "form") {
              return node.define(form);
          }

          if (node.props.type === "submit") {
              return node.define(submit);
          }
      };

      export { library };"
    `)
  })
})

describe('validation config loading', () => {
  it('can load the validation plugin', async ({ expect }) => {
    const code = await load('virtual:formkit/validation')
    expect(code).toMatchInlineSnapshot(`
      "import { createValidationPlugin } from "@formkit/validation";
      const validation = createValidationPlugin({});
      export { validation };"
    `)
  })

  it('can load a validation rule from @formkit/rules', async ({ expect }) => {
    const code = await load('virtual:formkit/rules:length')
    expect(code).toMatchInlineSnapshot(
      `"export { length } from "@formkit/rules";"`
    )
  })

  it('can load deoptimized validation rules', async ({ expect }) => {
    const code = await load('virtual:formkit/rules', {
      configFile: resolve(
        __dirname,
        './fixtures/configs/validation-deopt.config.ts'
      ),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { rules as builtinRules } from "@formkit/rules";

      function myrule(node) {
          return node.value === "justin";
      }

      const __extracted__ = {
          myrule
      };

      export const rules = {
          ...builtinRules,
          ...__extracted__
      };"
    `)
  })

  it('can load deoptimized validation rules with no builtins', async ({
    expect,
  }) => {
    const code = await load('virtual:formkit/rules', {
      configFile: resolve(
        __dirname,
        './fixtures/configs/validation-deopt-no-builtins.config.ts'
      ),
    })
    expect(code).toMatchInlineSnapshot(`
      "const builtinRules = {};

      function myrule(node) {
          return node.value === "justin";
      }

      const __extracted__ = {
          myrule
      };

      export const rules = {
          ...builtinRules,
          ...__extracted__
      };"
    `)
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

  it('can defer to a users non @formkit/i18n locale', async ({ expect }) => {
    const code = await load('virtual:formkit/locales:required', {
      configFile: resolve(
        __dirname,
        './fixtures/configs/formkit-custom-i18n.config.ts'
      ),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { fr } from "./my-custom-locale";
      const __fr__ = fr;
      import { required } from "@formkit/i18n/locales/de";
      import { remove } from "@formkit/i18n/locales/de";
      import { changeDate } from "@formkit/i18n/locales/de";

      export const locales = {
          de: ({
              validation: {
                  required: required
              },

              ui: {
                  changeDate: changeDate,
                  remove: remove
              }
          }),

          fr: __fr__
      };"
    `)
  })

  it('can extract messages into their own virtual module', async ({
    expect,
  }) => {
    const code = await load('virtual:formkit/messages', {
      configFile: resolve(
        __dirname,
        './fixtures/configs/formkit-custom-i18n-messages.config.ts'
      ),
    })
    expect(code).toMatchInlineSnapshot(`
      "const messages = {
          de: {
              validation: {
                  required: "Dieses Feld ist erforderlich"
              }
          }
      };

      export { messages };"
    `)
  })

  it('can wrap locales in messages overrides', async ({ expect }) => {
    const code = await load('virtual:formkit/locales:required', {
      configFile: resolve(
        __dirname,
        './fixtures/configs/formkit-custom-i18n-messages.config.ts'
      ),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { fr } from "./my-custom-locale";
      const __fr__ = fr;
      import { required } from "@formkit/i18n/locales/de";
      import { messages } from "virtual:formkit/messages";
      import { extend } from "@formkit/utils";

      export const locales = (extend({
          de: ({
              validation: {
                  required: required
              },

              ui: {}
          }),

          fr: __fr__
      }, messages));"
    `)
  })

  it('can load fully deoptimized i18n locales', async ({ expect }) => {
    const code = await load('virtual:formkit/locales', {
      configFile: resolve(__dirname, './fixtures/configs/i18n-deopt.config.ts'),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { de } from "@formkit/i18n";
      const __de__ = de;

      export const locales = {
          de: __de__
      };"
    `)
  })
})

describe('icon config loading', () => {
  it('can preload a specified icon directly', async ({ expect }) => {
    const code = await load('virtual:formkit/icons:check')
    expect(code).toMatchInlineSnapshot(
      `"export { check } from "@formkit/icons";"`
    )
  })

  it('can load an icon from an iconLoader', async ({ expect }) => {
    const code = await load('virtual:formkit/icons:check-badge', {
      configFile: resolve(
        __dirname,
        './fixtures/configs/icon-loader.config.ts'
      ),
    })
    expect(code).toMatchInlineSnapshot(
      `"export const checkBadge = "<svg xmlns=\\"http://www.w3.org/2000/svg\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke-width=\\"1.5\\" stroke=\\"currentColor\\" aria-hidden=\\"true\\" data-slot=\\"icon\\">\\n  <path stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" d=\\"M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z\\"/>\\n</svg>\\n";"`
    )
  })

  it('can load an icon using an iconLoaderUrl', async ({ expect }) => {
    const code = await load(
      'virtual:formkit/icons:chat-bubble-bottom-center-text',
      {
        configFile: resolve(
          __dirname,
          './fixtures/configs/icon-loader-url.config.ts'
        ),
      }
    )
    expect(code).toMatchInlineSnapshot(
      `"export const chatBubbleBottomCenterText = "<svg xmlns=\\"http://www.w3.org/2000/svg\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke-width=\\"1.5\\" stroke=\\"currentColor\\" aria-hidden=\\"true\\" data-slot=\\"icon\\">\\n  <path stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" d=\\"M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z\\"/>\\n</svg>\\n";"`
    )
  })

  it('can use local icons in the config', async ({ expect }) => {
    const code = await load('virtual:formkit/icons:check', {
      configFile: resolve(__dirname, './fixtures/configs/icon-local.config.ts'),
    })
    expect(code).toMatchInlineSnapshot(`
      "const check = \`<svg xmlns="http://www.w3.org/2000/svg" data-attr="from-config" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>\`;"
    `)
  })
  it('can use local icons in the config', async ({ expect }) => {
    const code = await load('virtual:formkit/icons:other', {
      configFile: resolve(__dirname, './fixtures/configs/icon-local.config.ts'),
    })
    expect(code).toMatchInlineSnapshot(`
      "const other = \`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
      </svg>
      \`;

      const other = other;"
    `)
  })

  it('can load a deoptimized icon config', async ({ expect }) => {
    const code = await load('virtual:formkit/themes', {
      configFile: resolve(__dirname, './fixtures/configs/icon-deopt.config.ts'),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { createThemePlugin } from "@formkit/themes";
      export const themes = (createThemePlugin(undefined, undefined, undefined, undefined));"
    `)
  })

  it('can load a deoptimized icon config with arguments', async ({
    expect,
  }) => {
    const code = await load('virtual:formkit/themes', {
      configFile: resolve(
        __dirname,
        './fixtures/configs/icon-deopt-theme-vars.config.ts'
      ),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { createThemePlugin } from "@formkit/themes";
      import { close } from "@formkit/icons";

      const __icons = {
          close,
          fastForward: "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"32\\" height=\\"32\\" viewBox=\\"0 0 256 256\\"><path fill=\\"currentColor\\" d=\\"M248.67 114.66L160.48 58.5A15.91 15.91 0 0 0 136 71.84v37.3L56.48 58.5A15.91 15.91 0 0 0 32 71.84v112.32a15.92 15.92 0 0 0 24.48 13.34L136 146.86v37.3a15.92 15.92 0 0 0 24.48 13.34l88.19-56.16a15.8 15.8 0 0 0 0-26.68M48 183.94V72.07L135.82 128Zm104 0V72.07L239.82 128Z\\"/></svg>"
      };

      import { defineFormKitConfig } from "@formkit/vue";
      import { close } from "@formkit/icons";
      import { materialIconLoader } from "@formkit/inputs";

      export default defineFormKitConfig({
          optimize: false,
          theme: "genesis",

          icons: {
              close,
              fastForward: "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"32\\" height=\\"32\\" viewBox=\\"0 0 256 256\\"><path fill=\\"currentColor\\" d=\\"M248.67 114.66L160.48 58.5A15.91 15.91 0 0 0 136 71.84v37.3L56.48 58.5A15.91 15.91 0 0 0 32 71.84v112.32a15.92 15.92 0 0 0 24.48 13.34L136 146.86v37.3a15.92 15.92 0 0 0 24.48 13.34l88.19-56.16a15.8 15.8 0 0 0 0-26.68M48 183.94V72.07L135.82 128Zm104 0V72.07L239.82 128Z\\"/></svg>"
          },

          iconLoaderUrl: iconName => \`http://google.com/icons/\${iconName}\`,
          iconLoader: materialIconLoader()
      });

      const __iconLoaderUrl = iconName => \`http://google.com/icons/\${iconName}\`;
      import { materialIconLoader } from "@formkit/inputs";
      const __iconLoader = materialIconLoader();
      export const themes = (createThemePlugin("genesis", __icons, __iconLoaderUrl, __iconLoader));"
    `)
  })
})

describe('theme related config loading', () => {
  it('can create an empty global export with no rootClasses', async ({
    expect,
  }) => {
    const code = await load('virtual:formkit/global-classes')
    expect(code).toMatchInlineSnapshot(`""`)
  })

  it('can create a full global classes when using a theme', async ({
    expect,
  }) => {
    const code = await load('virtual:formkit/global-classes', {
      configFile: resolve(__dirname, './fixtures/configs/full-theme.config.ts'),
    })
    expect(code).toMatchInlineSnapshot(`
      "export const outer = {
        "group": true,
        "max-w-[20em]": true,
        "min-w-0": true,
        "grow": true,
        "mb-4": true,
        "data-[disabled]:select-none": true,
        "data-[disabled]:opacity-50": true,
        "text-base": true
      };

      export const message = {
        "text-red-600": true,
        "mb-1.5": true,
        "text-xs": true,
        "dark:text-red-400": true
      };

      export const input = {
        "appearance-none": true,
        "[color-scheme:light]": true,
        "dark:[color-scheme:dark]": true,
        "selection:bg-blue-100": true,
        "selection:text-neutral-700": true,
        "group-data-[has-overlay]:selection:!text-transparent": true
      };

      export const prefixIcon = {
        "flex": true,
        "items-center": true,
        "-ml-1": true,
        "mr-2": true,
        "text-base": true,
        "h-[1em]": true,
        "w-[1em]": true,
        "shrink-0": true,
        "[&>svg]:w-full": true
      };

      export const suffixIcon = {
        "flex": true,
        "items-center": true,
        "-mr-1": true,
        "ml-2": true,
        "text-base": true,
        "h-[1em]": true,
        "w-[1em]": true,
        "shrink-0": true,
        "[&>svg]:w-full": true
      };

      export const help = {
        "text-neutral-500": true,
        "text-xs": true,
        "dark:text-neutral-400": true
      };

      export const label = {
        "block": true,
        "text-neutral-700": true,
        "text-sm": true,
        "font-bold": true,
        "mb-1": true,
        "dark:text-neutral-300": true
      };

      export const legend = {
        "block": true,
        "text-neutral-700": true,
        "text-sm": true,
        "font-bold": true,
        "dark:text-neutral-300": true
      };"
    `)
  })

  it('can load an empty input classes', async ({ expect }) => {
    const code = await load('virtual:formkit/classes:text')
    expect(code).toMatchInlineSnapshot(`
      "import { createRootClasses } from "virtual:formkit/optimized-root-classes";
      const globals = {};
      const familyClasses = {};
      const inputClasses = {};
      export const textClasses = createRootClasses(globals, familyClasses, inputClasses);"
    `)
  })

  it('can load classes for a given family', async ({ expect }) => {
    const code = await load('virtual:formkit/family-classes:text', {
      configFile: resolve(__dirname, './fixtures/configs/full-theme.config.ts'),
    })
    expect(code).toMatchInlineSnapshot(`
      "export const fam_text_outer = {
        "group": true,
        "max-w-[20em]": true,
        "min-w-0": true,
        "grow": true,
        "mb-4": true,
        "data-[disabled]:select-none": true,
        "data-[disabled]:opacity-50": true,
        "text-base": true
      };

      export const fam_text_message = {
        "text-red-600": true,
        "mb-1.5": true,
        "text-xs": true,
        "dark:text-red-400": true
      };

      export const fam_text_wrapper = {
        "flex": true,
        "flex-col": true,
        "items-start": true,
        "justify-start": true,
        "mb-1.5": true,
        "last:mb-0": true
      };

      export const fam_text_input = {
        "appearance-none": true,
        "[color-scheme:light]": true,
        "dark:[color-scheme:dark]": true,
        "selection:text-neutral-700": true,
        "group-data-[has-overlay]:selection:!text-transparent": true,
        "text-base": true,
        "text-neutral-700": true,
        "min-w-0": true,
        "min-h-[1.5em]": true,
        "grow": true,
        "outline-none": true,
        "bg-transparent": true,
        "selection:bg-blue-100": true,
        "placeholder:text-neutral-400": true,
        "group-data-[disabled]:!cursor-not-allowed": true,
        "dark:placeholder-neutral-400/50": true,
        "dark:text-neutral-300": true,
        "border-none": true,
        "p-0": true,
        "focus:ring-0": true
      };

      export const fam_text_prefixIcon = {
        "flex": true,
        "items-center": true,
        "-ml-1": true,
        "mr-2": true,
        "text-base": true,
        "h-[1em]": true,
        "w-[1em]": true,
        "shrink-0": true,
        "[&>svg]:w-full": true,
        "text-neutral-600": true,
        "dark:text-neutral-300": true
      };

      export const fam_text_suffixIcon = {
        "flex": true,
        "items-center": true,
        "-mr-1": true,
        "ml-2": true,
        "text-base": true,
        "h-[1em]": true,
        "w-[1em]": true,
        "shrink-0": true,
        "[&>svg]:w-full": true,
        "text-neutral-600": true,
        "dark:text-neutral-300": true
      };

      export const fam_text_help = {
        "text-neutral-500": true,
        "text-xs": true,
        "dark:text-neutral-400": true
      };

      export const fam_text_inner = {
        "text-base": true,
        "flex": true,
        "items-center": true,
        "w-full": true,
        "py-2": true,
        "px-3": true,
        "rounded": true,
        "border": true,
        "border-neutral-400": true,
        "bg-white": true,
        "focus-within:ring-1": true,
        "focus-within:!ring-blue-500": true,
        "focus-within:!border-blue-500": true,
        "group-data-[invalid]:border-red-500": true,
        "group-data-[invalid]:ring-1": true,
        "group-data-[invalid]:ring-red-500": true,
        "group-data-[disabled]:bg-neutral-100": true,
        "group-data-[disabled]:!cursor-not-allowed": true,
        "shadow": true,
        "group-[]/repeater:shadow-none": true,
        "group-[]/multistep:shadow-none": true,
        "dark:bg-transparent": true,
        "dark:border-neutral-500": true,
        "dark:group-data-[disabled]:bg-neutral-800/5": true,
        "dark:group-data-[invalid]:border-red-500": true,
        "dark:group-data-[invalid]:ring-red-500": true
      };

      export const fam_text_label = {
        "block": true,
        "text-neutral-700": true,
        "text-sm": true,
        "font-bold": true,
        "dark:text-neutral-300": true,
        "!inline-flex": true,
        "mb-1": true
      };

      export const fam_text_legend = {
        "block": true,
        "text-neutral-700": true,
        "text-sm": true,
        "font-bold": true,
        "dark:text-neutral-300": true
      };"
    `)
  })

  it('can load an full theme input classes', async ({ expect }) => {
    const code = await load('virtual:formkit/classes:text', {
      configFile: resolve(__dirname, './fixtures/configs/full-theme.config.ts'),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { createRootClasses } from "virtual:formkit/optimized-root-classes";
      import { outer, label, prefixIcon, input, suffixIcon, help, message } from "virtual:formkit/global-classes";
      import {     fam_text_outer, fam_text_wrapper, fam_text_label, fam_text_inner, fam_text_prefixIcon, fam_text_input, fam_text_suffixIcon, fam_text_help, fam_text_message, } from "virtual:formkit/family-classes:text";

      const globals = {
          outer, label, prefixIcon, input, suffixIcon, help, message
      };

      const familyClasses = {
          fam_text_outer, fam_text_wrapper, fam_text_label, fam_text_inner, fam_text_prefixIcon, fam_text_input, fam_text_suffixIcon, fam_text_help, fam_text_message
      };

      const inputClasses = {};
      export const textClasses = createRootClasses(globals, familyClasses, inputClasses);"
    `)
  })

  it('does not load rootClasses in nodeOptions when optimized', async ({
    expect,
  }) => {
    const code = await load('virtual:formkit/nodeOptions', {
      configFile: resolve(__dirname, './fixtures/configs/full-theme.config.ts'),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { extend } from "@formkit/utils";

      const baseOptions = ({
          config: ({})
      });

      export const nodeOptions = (o = {}) => extend(baseOptions, o, true);"
    `)
  })

  it('loads deoptimized rootClasses in nodeOptions when deoptimized', async ({
    expect,
  }) => {
    const code = await load('virtual:formkit/nodeOptions', {
      configFile: resolve(
        __dirname,
        './fixtures/configs/theme-deopt.config.ts'
      ),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { extend } from "@formkit/utils";
      import { rootClasses } from "./formkit.theme";
      const __rootClasses = rootClasses;

      const baseOptions = ({
          config: ({
              rootClasses: __rootClasses
          })
      });

      export const nodeOptions = (o = {}) => extend(baseOptions, o, true);"
    `)
  })
})
