import { describe, it, expect } from 'vitest'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generator from '@babel/generator'
import type { NodePath } from '@babel/traverse'
import type { CallExpression, Node } from '@babel/types'
import {
  getUsedImports,
  rootPath,
  uniqueVariableName,
  addImport,
  extract,
} from '../src/utils/ast'
import { usedComponents } from '../src/utils/vue'
import { createOpts } from '../src/utils/config'

const opts = createOpts({})

describe('getUsedImports', () => {
  it('can extract used imports', () => {
    const code = `
      import { foo } from 'bar'
      import { bar } from 'foo'
      const other = foo()
    `
    const ast = parse(code, { sourceType: 'module' })
    expect(
      getUsedImports(opts, ast, [
        { name: 'fizz', from: 'buzz' },
        { name: 'foo', from: 'bar' },
      ])
    ).toEqual([{ name: 'foo', from: 'bar', local: 'foo' }])
  })
  it('can extract multiple imports that are aliased', () => {
    const code = `
      import { resolveComponent as _resolveComponent2, createVNode as _createVNode, ref } from 'vue'
      import { bar } from 'foo'
      const other = foo()
    `
    const ast = parse(code, { sourceType: 'module' })
    expect(
      getUsedImports(opts, ast, [
        { name: 'resolveComponent', from: 'vue' },
        { name: 'createVNode', from: 'vue' },
      ])
    ).toEqual([
      { name: 'resolveComponent', from: 'vue', local: '_resolveComponent2' },
      { name: 'createVNode', from: 'vue', local: '_createVNode' },
    ])
  })
})

describe('usedComponents', () => {
  it('wont locate components that are imported but not used', () => {
    const code = `
      import { resolveComponent } from 'vue'
      import { FormKit } from '@formkit/vue'
      const form = resolveComponent('FormKit')
    `
    const ast = parse(code, { sourceType: 'module' })
    expect(
      usedComponents(opts, ast, [{ name: 'FormKit', from: '@formkit/vue' }])
    ).toEqual([])
  })

  it('will locate components that are imported and used', () => {
    const code = `
      import { resolveComponent as _r, h } from 'vue'
      import { FormKit } from '@formkit/vue'
      const _myComponent = _r('FormKit')
      export default () => h('div', null, { default: () => h(_myComponent) })
    `
    const ast = parse(code, { sourceType: 'module' })
    const codeMod = () => {}
    expect(
      usedComponents(opts, ast, [
        { name: 'FormKit', from: '@formkit/vue', codeMod },
      ])
    ).toEqual([
      {
        name: 'FormKit',
        from: '@formkit/vue',
        path: expect.any(Object),
        opts: expect.any(Object),
        root: expect.any(Object),
        codeMod,
      },
    ])
  })

  it('will locate components that are imported and auto import them', () => {
    const code = `import { resolveComponent as _r, h } from 'vue'
const _myComponent = _r('FormKit')
export default () => h('div', null, { default: () => h(_myComponent) })
    `
    const ast = parse(code, { sourceType: 'module' })
    const codeMod = () => {}
    usedComponents(
      opts,
      ast,
      [{ name: 'FormKit', from: '@formkit/vue', codeMod }],
      true
    )
    expect(generator(ast).code).toMatchInlineSnapshot(`
      "import { FormKit } from "@formkit/vue";
      import { resolveComponent as _r, h } from 'vue';
      const _myComponent = FormKit;
      export default (() => h('div', null, {
        default: () => h(_myComponent)
      }));"
    `)
  })
})

describe('rootPath', () => {
  it('can locate the root path', () => {
    const code = `
      import { resolveComponent as _r, h } from 'vue'
      import { FormKit } from '@formkit/vue'
      const _myComponent = _r('FormKit')
      export default () => h('div', null, { default: () => h(_myComponent) })
    `
    const ast = parse(code, { sourceType: 'module' })
    let child: NodePath<CallExpression> | null = null
    traverse(ast, {
      CallExpression(path) {
        if (
          path.node.callee.type === 'Identifier' &&
          path.node.callee.name === 'h'
        ) {
          path.stop()
          child = path
        }
      },
    })
    expect(child).toBeDefined()
    expect(rootPath(child!).type).toBe('Program')
  })
})

describe('uniqueVariableName', () => {
  it('can generate a unique variable name', () => {
    const code = `
    import { foo } from 'bar'
    import * as foo1 from 'bar'
    const foo2 = 'hello world'
    function foo4() {
      let foo3 = 'foo5'
    }
    `
    const ast = parse(code, { sourceType: 'module' })
    expect(uniqueVariableName(opts, ast, 'foo')).toBe('foo5')
    expect(uniqueVariableName(opts, ast, 'location')).toBe('location')
  })
})

describe('addImport', () => {
  it('can add an import to the top of the file', () => {
    const code = `import { defineComponent, h as FormKit } from 'vue'
export const render = () => FormKit('div', { dataFoo: 'bar' })`
    const ast = parse(code, { sourceType: 'module' })
    addImport(opts, ast, { name: 'FormKit', from: '@formkit/vue' })
    expect(generator(ast).code).toMatchInlineSnapshot(`
      "import { FormKit as FormKit1 } from "@formkit/vue";
      import { defineComponent, h as FormKit } from 'vue';
      export const render = () => FormKit('div', {
        dataFoo: 'bar'
      });"
    `)
  })

  it('does not add an import if it is already being used', () => {
    const code = `import { FormKit } from '@formkit/vue';
import { defineComponent, h } from 'vue';
export const component = defineComponent({
  render() {
    return h(FormKit, {
      type: 'text'
    });
  }
});`
    const ast = parse(code, { sourceType: 'module' })
    addImport(opts, ast, { name: 'FormKit', from: '@formkit/vue' })
    expect(generator(ast).code).toBe(code)
  })
})

describe('extract', () => {
  it('can extract a node from an AST', () => {
    const code = `import { defineComponent, h } from 'vue'
    export default {
      foo: defineComponent({})
    }`
    const ast = parse(code, { sourceType: 'module' })
    let extracted: Node | null = null
    traverse(ast, {
      ObjectProperty(path) {
        if (
          path.node.key.type === 'Identifier' &&
          path.node.key.name === 'foo'
        ) {
          extracted = path.node.value
        }
      },
    })
    expect(
      generator(extract(opts, extracted!, ast)).code
    ).toMatchInlineSnapshot(``)
  })
})
