import createNode from '../packages/core/src/node'

/*
 * Creates a node tree and returns the parent with a nested child
 */
export function createTicketTree() {
  const nestedChild = createNode({ name: 'seat' })
  const parent = createNode({
    name: 'form',
    type: 'group',
    children: [
      createNode({ name: 'email' }),
      createNode({ name: 'password' }),
      createNode({ name: 'confirm_password' }),
      createNode({
        name: 'tickets',
        type: 'list',
        children: [
          createNode({
            type: 'group',
            children: [
              createNode({ name: 'price', value: 499 }),
              createNode({ name: 'row', value: '555' }),
            ],
          }),
          createNode({
            type: 'group',
            children: [createNode({ name: 'price' }), nestedChild],
          }),
        ],
      }),
    ],
  })
  return [parent, nestedChild]
}

/**
 * A tree construction with predictable names
 * @returns FormKitNode (tree)
 */
export function createNameTree() {
  return createNode({
    name: 'tommy',
    type: 'group',
    children: [
      createNode({ name: 'billy' }),
      createNode({ name: 'jane', value: '555' }),
      createNode({
        name: 'stella',
        type: 'group',
        children: [
          createNode({ name: 'wendy' }),
          createNode({ name: 'tommy', value: '555' }),
        ],
      }),
      createNode({ name: 'wendy' }),
    ],
  })
}
