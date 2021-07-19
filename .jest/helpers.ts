import { createNode, FormKitNode } from '../packages/core/src/node'

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

/**
 * A sample shipping form-like tree.
 */
export function createShippingTree() {
  return createNode({
    type: 'group',
    name: 'form',
    children: [
      createNode({ name: 'name' }),
      createNode({
        name: 'address',
        type: 'group',
        children: [
          createNode({ name: 'street', value: '694 Boise St' }),
          createNode({ name: 'city' }),
          createNode({ name: 'state' }),
          createNode({ name: 'zip' }),
        ],
      }),
      createNode({
        name: 'products',
        type: 'list',
        children: [
          createNode({
            type: 'group',
            children: [
              createNode({ name: 'product', value: 'T-shirt' }),
              createNode({ name: 'price', value: 2199 }),
            ],
          }),
          createNode({
            type: 'group',
            children: [
              createNode({ name: 'product', value: 'Pants' }),
              createNode({ name: 'price', value: 5429 }),
            ],
          }),
        ],
      }),
    ],
  })
}

/**
 * Example middleware for masking a phone input.
 * @param value -
 * @param next -
 */
export function phoneMask(
  value: string | undefined,
  next: (payload?: string) => string
): string {
  if (value === undefined) {
    return next()
  }
  const digits = value.replace(/[^0-9]/g, '')
  let phone = ''
  if (digits.length >= 3) {
    phone = `(${digits.substr(0, 3)}) `
  }
  if (digits.length >= 6) {
    phone += `${digits.substr(3, 3)}-${digits.substr(6)}`
  }
  if (digits.length < 3) {
    phone = digits
  }
  return next(phone)
}

/**
 * Defines the event counter plugin, which counts the number of times a given
 * event is called.
 */
export interface EventCounterPlugin {
  (node: FormKitNode): void | boolean
  calls: number
}

/**
 * @param eventName -
 * @returns EventCounterPlugin
 */
export function eventCounter(eventName: string): EventCounterPlugin {
  const plugin = function (node: FormKitNode) {
    node.on(eventName, (event) => {
      if (event.origin === node) plugin.calls++
    })
    return false
  }
  plugin.calls = 0
  return plugin
}
