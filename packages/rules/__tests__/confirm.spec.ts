import { createNode } from '@formkit/core'
import confirm from '../src/confirm'
import { describe, expect, it } from 'vitest'

describe('confirm rule', () => {
  it('can confirm a sibling address', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({ name: 'password', parent: form, value: 'abc' })
    createNode({ name: 'check_here', parent: form, value: 'abc' })
    expect(confirm(node, 'check_here')).toBe(true)
  })

  it('can infer a sibling ends in _confirm', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({ name: 'password', parent: form, value: 'abc' })
    createNode({ name: 'password_confirm', parent: form, value: 'abc' })
    expect(confirm(node)).toBe(true)
  })

  it('can infer a sibling would not have _confirm', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({
      name: 'password_confirm',
      parent: form,
      value: 'abc',
    })
    createNode({ name: 'password', parent: form, value: 'abc' })
    expect(confirm(node)).toBe(true)
  })

  it('can infer a sibling would not have _confirmed', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({
      name: 'password_confirmed',
      parent: form,
      value: 'abc',
    })
    createNode({ name: 'password', parent: form, value: 'abc' })
    expect(confirm(node)).toBe(true)
  })

  it('performs a loose comparison by default', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({
      name: 'password_confirmed',
      parent: form,
      value: 123,
    })
    createNode({ name: 'password', parent: form, value: '123' })
    expect(confirm(node)).toBe(true)
  })

  it('can perform strict comparison via argument', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({
      name: 'password_confirmed',
      parent: form,
      value: 123,
    })
    createNode({ name: 'password', parent: form, value: '123' })
    expect(confirm(node, 'password', 'strict')).toBe(false)
  })

  it('fails when unable to access sibling', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({
      name: 'password_confirmed',
      parent: form,
      value: '123',
    })
    createNode({ name: 'password_again', parent: form, value: '123' })
    expect(confirm(node)).toBe(false)
  })

  it('can access ancestor values using node addresses', () => {
    const form = createNode({
      type: 'group',
      name: 'form',
      children: [
        createNode({
          name: 'users',
          type: 'list',
          children: [
            createNode({
              type: 'group',
              children: [
                createNode({ name: 'email' }),
                createNode({ name: 'password' }),
              ],
            }),
            createNode({
              type: 'group',
              children: [createNode({ name: 'email' })],
            }),
          ],
        }),
        createNode({
          name: 'master_password',
          value: 'foobar',
        }),
      ],
    })
    const node = createNode({ name: 'password', value: 'foobar' })
    form.at('users.1')!.add(node)
    expect(confirm(node)).toBe(false)
    expect(confirm(node, '$parent.$parent.$parent.master_password')).toBe(true)
    expect(confirm(node, '$root.master_password')).toBe(true)
  })

  // TODO - not sure where this should be but we need sample
  // implementations of watcher/dependency behavior once it is implemented.
})
