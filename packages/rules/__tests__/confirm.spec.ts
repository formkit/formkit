import { createNode } from '@formkit/core'
import confirm from '../src/confirm'

describe('confirm rule', () => {
  it('can confirm a sibling address', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({ name: 'password', parent: form })
    createNode({ name: 'check_here', parent: form, value: 'abc' })
    expect(confirm({ value: 'abc', node }, 'check_here')).toBe(true)
  })

  it('can infer a sibling ends in _confirm', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({ name: 'password', parent: form })
    createNode({ name: 'password_confirm', parent: form, value: 'abc' })
    expect(confirm({ value: 'abc', node })).toBe(true)
  })

  it('can infer a sibling would not have _confirm', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({ name: 'password_confirm', parent: form })
    createNode({ name: 'password', parent: form, value: 'abc' })
    expect(confirm({ value: 'abc', node })).toBe(true)
  })

  it('can infer a sibling would not have _confirmed', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({ name: 'password_confirmed', parent: form })
    createNode({ name: 'password', parent: form, value: 'abc' })
    expect(confirm({ value: 'abc', node })).toBe(true)
  })

  it('performs a loose comparison by default', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({ name: 'password_confirmed', parent: form })
    createNode({ name: 'password', parent: form, value: '123' })
    expect(confirm({ value: 123, node })).toBe(true)
  })

  it('can perform strict comparison via argument', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({ name: 'password_confirmed', parent: form })
    createNode({ name: 'password', parent: form, value: '123' })
    expect(confirm({ value: 123, node }, 'password', 'strict')).toBe(false)
  })

  it('fails when unable to access sibling', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({ name: 'password_confirmed', parent: form })
    createNode({ name: 'password_again', parent: form, value: '123' })
    expect(confirm({ value: '123', node })).toBe(false)
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
    const node = createNode({ name: 'password' })
    form.at('users.1')!.add(node)
    expect(confirm({ value: 'foobar', node })).toBe(false)
    expect(
      confirm(
        { value: 'foobar', node },
        '$parent.$parent.$parent.master_password'
      )
    ).toBe(true)
    expect(confirm({ value: 'foobar', node }, '$root.master_password')).toBe(
      true
    )
  })
})
