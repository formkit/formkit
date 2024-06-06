// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generator from '@babel/generator'
import type { NodePath } from '@babel/traverse'
import type { CallExpression, Node, ObjectMethod } from '@babel/types'
import {
  getUsedImports,
  rootPath,
  uniqueVariableName,
  addImport,
  extract,
  extractMethodAsFunction,
} from '../src/utils/ast'
import { usedComponents } from '../src/utils/vue'
import { createOpts, getConfigProperty } from '../src/utils/config'
import { isIdentifier } from '@babel/types'
import { resolve } from 'pathe'

const opts = await createOpts({})

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
  it('can extract imports from a code sample', () => {
    const code = `import { defineComponent, h } from 'vue'
    const y = 123
    const x = 456
    export default {
      y,
      foo: defineComponent({ x })
    }`
    const ast = parse(code, { sourceType: 'module' })
    let extracted: NodePath<Node> | null = null
    traverse(ast, {
      ObjectProperty(path) {
        if (isIdentifier(path.node.key, { name: 'foo' })) {
          extracted = path.get('value')
          path.stop()
        }
      },
    })
    expect(generator(extract(extracted!)).code).toMatchInlineSnapshot(`
      "import { defineComponent } from 'vue';
      const x = 456;
      const __extracted__ = defineComponent({
        x
      });"
    `)
  })

  it('can extract a function declaration', () => {
    const code = `import { defineConfig } from './myConfig'

    function myFunction () {
      return 123
    }

    export default defineConfig({
      y,
      foo: myFunction
    })`
    const ast = parse(code, { sourceType: 'module' })
    let extracted: NodePath<Node> | null = null
    traverse(ast, {
      ObjectProperty(path) {
        if (isIdentifier(path.node.key, { name: 'foo' })) {
          extracted = path.get('value')
          path.stop()
        }
      },
    })
    expect(generator(extract(extracted!)).code).toMatchInlineSnapshot(`
      "function myFunction() {
        return 123;
      }
      const __extracted__ = myFunction;"
    `)
  })

  it('can extract a variable declaration', () => {
    const code = `import { defineConfig } from './myConfig'
    const foo = 123
    export default defineConfig({
      y,
      foo
    })`
    const ast = parse(code, { sourceType: 'module' })
    let extracted: NodePath<Node> | null = null
    traverse(ast, {
      ObjectProperty(path) {
        if (isIdentifier(path.node.key, { name: 'foo' })) {
          extracted = path.get('value')
          path.stop()
        }
      },
    })
    expect(generator(extract(extracted!)).code).toMatchInlineSnapshot(`
      "const foo = 123;
      const __extracted__ = foo;"
    `)
  })

  it('can extract variable declarations with dependencies', () => {
    const code = `import { defineConfig, someValue } from './myConfig'
    const foo = 123 + someValue
    export default defineConfig({
      y,
      foo
    })`
    const ast = parse(code, { sourceType: 'module' })
    let extracted: NodePath<Node> | null = null
    traverse(ast, {
      ObjectProperty(path) {
        if (isIdentifier(path.node.key, { name: 'foo' })) {
          extracted = path.get('value')
          path.stop()
        }
      },
    })
    expect(generator(extract(extracted!)).code).toMatchInlineSnapshot(`
      "import { someValue } from './myConfig';
      const foo = 123 + someValue;
      const __extracted__ = foo;"
    `)
  })

  it('can extract function declarations with dependencies', () => {
    const code = `import { defineConfig, someValue } from './myConfig'
    const x = 123
    const y = 456
    function myFunction () {
      return 123 + someValue + x
    }
    export default defineConfig({
      y,
      foo: myFunction
    })`
    const ast = parse(code, { sourceType: 'module' })
    let extracted: NodePath<Node> | null = null
    traverse(ast, {
      ObjectProperty(path) {
        if (isIdentifier(path.node.key, { name: 'foo' })) {
          extracted = path.get('value')
          path.stop()
        }
      },
    })
    expect(generator(extract(extracted!)).code).toMatchInlineSnapshot(`
      "import { someValue } from './myConfig';
      const x = 123;
      function myFunction() {
        return 123 + someValue + x;
      }
      const __extracted__ = myFunction;"
    `)
  })

  it('can extract an inline function expression', () => {
    const code = `import { defineConfig, someValue } from './myConfig'
    const x = 123
    const y = 456
    export default defineConfig({
      y,
      foo: () => 123 + x
    })`
    const ast = parse(code, { sourceType: 'module' })
    let extracted: NodePath<Node> | null = null
    traverse(ast, {
      ObjectProperty(path) {
        if (isIdentifier(path.node.key, { name: 'foo' })) {
          extracted = path.get('value')
          path.stop()
        }
      },
    })
    expect(generator(extract(extracted!)).code).toMatchInlineSnapshot(`
      "const x = 123;
      const __extracted__ = () => 123 + x;"
    `)
  })

  it('can extract a function that contains a function with scoped variables', () => {
    const code = `import { defineConfig, someValue } from './myConfig'
    const x = 123
    const y = 456
    function myFunc () {
      const z = 789
      return () => 123 + x + z
    }
    export default defineConfig({
      y,
      foo: myFunc
    })`
    const ast = parse(code, { sourceType: 'module' })
    let extracted: NodePath<Node> | null = null
    traverse(ast, {
      ObjectProperty(path) {
        if (isIdentifier(path.node.key, { name: 'foo' })) {
          extracted = path.get('value')
          path.stop()
        }
      },
    })
    expect(generator(extract(extracted!)).code).toMatchInlineSnapshot(`
      "const x = 123;
      function myFunc() {
        const z = 789;
        return () => 123 + x + z;
      }
      const __extracted__ = myFunc;"
    `)
  })

  it('can import multiple specifiers from the same module', () => {
    const code = `import { firstValue, removeMe, secondValue, } from './myConfig'
    const z = 123
    function myFunc () {
      return firstValue + secondValue
    }
    const x = { myFunc }
    `
    const ast = parse(code, { sourceType: 'module' })
    let extracted: NodePath<Node> | null = null
    traverse(ast, {
      VariableDeclarator(path) {
        if (isIdentifier(path.node.id, { name: 'x' })) {
          extracted = path.get('init') as NodePath<Node>
          path.stop()
        }
      },
    })
    expect(generator(extract(extracted!)).code).toMatchInlineSnapshot(`
      "import { firstValue, secondValue } from './myConfig';
      function myFunc() {
        return firstValue + secondValue;
      }
      const __extracted__ = {
        myFunc
      };"
    `)
  })

  it('can extract destructured valued', () => {
    const code = `import { getInputs } from './myConfig'
    const { fiz, buz, bar, bim, bam } = getInputs()
    const x = { fiz, buz, bar }
    `
    const ast = parse(code, { sourceType: 'module' })
    let extracted: NodePath<Node> | null = null
    traverse(ast, {
      VariableDeclarator(path) {
        if (isIdentifier(path.node.id, { name: 'x' })) {
          extracted = path.get('init') as NodePath<Node>
          path.stop()
        }
      },
    })
    expect(generator(extract(extracted!)).code).toMatchInlineSnapshot(`
      "import { getInputs } from './myConfig';
      const {
        fiz,
        buz,
        bar,
        bim,
        bam
      } = getInputs();
      const __extracted__ = {
        fiz,
        buz,
        bar
      };"
    `)
  })

  it('can extract an object literal', () => {
    const code = `import { outer, inner, input, makeRed, memoKey, unused } from '@formkit/inputs'
    const myInput = {
      schema: outer(
        inner(
          input()
        )
      ),
      features: [makeRed],
      memoKey
    }
    const x = myInput
    `
    const ast = parse(code, { sourceType: 'module' })
    let extracted: NodePath<Node> | null = null
    traverse(ast, {
      VariableDeclarator(path) {
        if (isIdentifier(path.node.id, { name: 'x' })) {
          extracted = path.get('init') as NodePath<Node>
          path.stop()
        }
      },
    })
    expect(generator(extract(extracted!)).code).toMatchInlineSnapshot(`
      "import { outer, inner, input, makeRed, memoKey } from '@formkit/inputs';
      const myInput = {
        schema: outer(inner(input())),
        features: [makeRed],
        memoKey
      };
      const __extracted__ = myInput;"
    `)
  })
})

describe('extractMethodAsFunction', () => {
  it('can extract an object’s method as its own function', ({ expect }) => {
    const code = `import { outer, inner, input, makeRed, memoKey, unused } from '@formkit/inputs'
    const myInput = {
      schema: {
        onClick (str) {
          return makeRed(input(str))
        }
      },
      features: [makeRed],
      memoKey
    }
    `
    const ast = parse(code, { sourceType: 'module' })
    let extracted: NodePath<ObjectMethod> | null = null
    traverse(ast, {
      ObjectMethod(path) {
        if (isIdentifier(path.node.key, { name: 'onClick' })) {
          extracted = path as NodePath<ObjectMethod>
          path.stop()
        }
      },
    })
    expect(generator(extractMethodAsFunction(extracted!, '__extracted__')).code)
      .toMatchInlineSnapshot(`
      "import { input, makeRed } from '@formkit/inputs';
      function __extracted__(str) {
        return makeRed(input(str));
      }"
    `)
  })
})

describe('getConfigProperty', () => {
  it('extracts the correct property from the root of the config object', () => {
    const opts = createOpts({
      configFile: resolve(
        __dirname,
        './fixtures/configs/input-deopt-obj.config.ts'
      ),
    })
    const property = getConfigProperty(opts, 'optimize')
    expect(property?.get('value').node.type).toBe('ObjectExpression')
  })
})

describe('determineOptimization', () => {
  it('can determine a single optimization being disabled', () => {
    const opts = createOpts({
      configFile: resolve(
        __dirname,
        './fixtures/configs/input-deopt.config.ts'
      ),
    })
    expect(opts.optimize).toEqual({
      debug: false,
      i18n: true,
      icons: true,
      inputs: false,
      schema: true,
      theme: true,
      validation: true,
    })
    expect(opts.builtins).toEqual({
      debug: true,
      i18n: true,
      icons: true,
      inputs: true,
      schema: true,
      theme: true,
      validation: true,
    })
  })

  it('can determine a single optimization being disabled via object', () => {
    const opts = createOpts({
      configFile: resolve(
        __dirname,
        './fixtures/configs/input-deopt-obj.config.ts'
      ),
    })
    expect(opts.optimize).toEqual({
      debug: false,
      i18n: true,
      icons: true,
      inputs: false,
      schema: true,
      theme: true,
      validation: true,
    })
    expect(opts.builtins).toEqual({
      debug: true,
      i18n: true,
      icons: true,
      inputs: false,
      schema: true,
      theme: true,
      validation: true,
    })
  })

  it('can enable all optimizations', () => {
    const opts = createOpts({
      configFile: resolve(__dirname, './fixtures/configs/full-theme.config.ts'),
    })
    expect(opts.optimize).toEqual({
      debug: false,
      i18n: true,
      icons: true,
      inputs: true,
      schema: true,
      theme: true,
      validation: true,
    })
    expect(opts.builtins).toEqual({
      debug: true,
      i18n: true,
      icons: true,
      inputs: true,
      schema: true,
      theme: true,
      validation: true,
    })
  })
})
