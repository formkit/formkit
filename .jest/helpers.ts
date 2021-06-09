import createNode, { useIndex } from '../packages/core/src/node'

/*
 * Creates a node tree and returns the parent with a nested child
 */
export function createTicketTree() {
  const nestedChild = createNode({ name: 'seat' })
  const parent = createNode({
    name: 'form',
    children: [
      createNode({ name: 'email' }),
      createNode({ name: 'password' }),
      createNode({ name: 'confirm_password' }),
      createNode({
        name: 'tickets',
        children: [
          createNode({
            name: useIndex,
            children: [
              createNode({ name: 'price', value: 499 }),
              createNode({ name: 'row', type: 'select' }),
            ],
          }),
          createNode({
            name: useIndex,
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
    children: [
      createNode({ name: 'billy' }),
      createNode({ name: 'jane', type: 'radio' }),
      createNode({
        name: 'stella',
        children: [
          createNode({ name: 'wendy' }),
          createNode({ name: 'tommy', type: 'radio' }),
        ],
      }),
      createNode({ name: 'wendy' }),
    ],
  })
}
