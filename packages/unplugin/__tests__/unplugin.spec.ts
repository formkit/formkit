// @vitest-environment node
import { describe, it } from 'vitest'
import { createCommonJS } from 'mlly'
import SimpleRender from './fixtures/SimpleRender.vue?raw'
import { resolve } from 'path'
import { sfcTransform } from './helpers/transform'
import { load } from './helpers/load'

const { __dirname } = createCommonJS(import.meta.url)

describe('sfc transform', () => {
  it('injects __config__ at the point of use', async ({ expect }) => {
    const code = await sfcTransform(
      SimpleRender,
      resolve(__dirname, './fixtures/SimpleRender.vue')
    )
    expect(code).toMatchSnapshot()
  })
})

describe('input config loading', () => {
  it('directly imports the input from @formkit/inputs', async ({ expect }) => {
    const code = await load('virtual:formkit/inputs:text')
    expect(code).toMatchInlineSnapshot(`
      "import { text } from '@formkit/inputs';
      const library = () => {};
      library.library = (node) => node.define(text);
      export { library };"
    `)
  })

  it('can extract an inline createInput', async ({ expect }) => {
    const code = await load('virtual:formkit/inputs:custom', {
      configFile: resolve(__dirname, './fixtures/configs/formkit.config.ts'),
    })
    expect(code).toMatchInlineSnapshot(`
      "import { createInput } from "@formkit/vue";
      import CustomComponent from "../CustomComponent.vue";
      export const extracted = createInput(CustomComponent);"
    `)
  })
})
