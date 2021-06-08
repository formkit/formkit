import { FormKitNode } from './node'

/**
 * Generates a random string.
 * @returns string
 */
export function token(): string {
  return Math.random().toString(36).substring(2, 15)
}
/**
 * Creates a new set of the specified type and uses the values from an Array or
 * an existing Set.
 * @param  {Set<T>|T[]|null} items
 * @returns Set
 */
export function setify<T>(items: Set<T> | T[] | null | undefined): Set<T> {
  return items instanceof Set ? items : new Set<T>(items)
}

/**
 * Given 2 arrays, return them as a combined array with no duplicates.
 * @param  {T} arr1
 * @param  {X} arr2
 * @returns any[]
 */
export function dedupe<T extends any[] | Set<any>, X extends any[] | Set<any>>(
  arr1: T,
  arr2?: X
): any[] {
  const original = arr1 instanceof Set ? arr1 : new Set(arr1)
  if (arr2) arr2.forEach((item: any) => original.add(item))
  return [...original]
}

/**
 * Determine if a given object is a node
 */
export function isNode(node: any): node is FormKitNode {
  return node && typeof node === 'object' && node.__FKNode__
}

/**
 * Wraps any object in a proxy with { value } wrappers.
 * @param  {any} target
 * @returns T
 */
export function unwrapProxy<T>(target: any): T {
  return new Proxy(target, {
    get(...args) {
      const val = Reflect.get(...args)
      return val.value
    },
    set(...args) {
      const [, property, newValue] = args
      const prop = Reflect.get(args[0], args[1], args[3])
      if (prop && prop.value) {
        target[property].value = newValue
        return true
      } else {
      }
      return Reflect.set(args[0], args[1], { value: args[2] }, args[3])
    },
  })
}
