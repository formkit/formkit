import { FormKitNode } from './node'

/**
 * Breadth and Depth first searches can use a callback of this notation.
 */
export type FormKitSearchFunction = (
  node: FormKitNode,
  searchTerm?: string | number
) => boolean

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
 * Perform a breadth-first-search on a node subtree and locate the first
 * instance of a match.
 * @param  {FormKitNode} node
 * @param  {FormKitNode} name
 * @returns FormKitNode
 */
export function bfs(
  tree: FormKitNode,
  searchValue: string | number,
  searchGoal: keyof FormKitNode | FormKitSearchFunction = 'name'
): FormKitNode | undefined {
  const search: FormKitSearchFunction =
    typeof searchGoal === 'string'
      ? (n: FormKitNode) => n[searchGoal] == searchValue // non-strict comparison is intentional
      : searchGoal
  const stack = [tree]
  while (stack.length) {
    const node = stack.shift()!
    if (search(node, searchValue)) return node
    stack.push(...node.children)
  }
  return undefined
}
