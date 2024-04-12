import { describe, it, expect } from 'vitest'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import type { NodePath } from '@babel/traverse'
import type { CallExpression } from '@babel/types'
import {
  getUsedImports,
  usedComponents,
  rootPath,
} from '../src/utils/ast-utils'

describe('getUsedImports', () => {
  it('can extract used imports', () => {
    const code = `
      import { foo } from 'bar'
      import { bar } from 'foo'
      const other = foo()
    `
    const ast = parse(code, { sourceType: 'module' })
    expect(
      getUsedImports(traverse, ast, [
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
      getUsedImports(traverse, ast, [
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
      usedComponents(traverse, ast, [{ name: 'FormKit', from: '@formkit/vue' }])
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
      usedComponents(traverse, ast, [
        { name: 'FormKit', from: '@formkit/vue', codeMod },
      ])
    ).toEqual([
      {
        name: 'FormKit',
        from: '@formkit/vue',
        path: expect.any(Object),
        codeMod,
      },
    ])
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
