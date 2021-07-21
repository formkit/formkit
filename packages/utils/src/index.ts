/**
 * Generates a random string.
 * @returns string
 * @public
 */
export function token(): string {
  return Math.random().toString(36).substring(2, 15)
}
/**
 * Creates a new set of the specified type and uses the values from an Array or
 * an existing Set.
 * @param items -
 * @returns Set
 * @public
 */
export function setify<T>(items: Set<T> | T[] | null | undefined): Set<T> {
  return items instanceof Set ? items : new Set<T>(items)
}

/**
 * Given 2 arrays, return them as a combined array with no duplicates.
 * @param arr1 -
 * @param arr2 -
 * @returns any[]
 * @public
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
 * Checks if the given property exists on the given object.
 * @param obj -
 * @param property -
 * @public
 */
export function has(
  obj: { [index: string]: any; [index: number]: any },
  property: string | symbol | number
): boolean {
  return Object.prototype.hasOwnProperty.call(obj, property)
}

/**
 * Compare two values for equality optionally at depth.
 * @param valA -
 * @param valB -
 * @param deep -
 * @returns boolean
 * @public
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function eq(valA: any, valB: any, deep = true): boolean {
  if (valA === valB) return true
  if (typeof valA === typeof valB && typeof valA === 'object') {
    if (valA instanceof Map) return false
    if (valA instanceof Set) return false
    if (Object.keys(valA).length !== Object.keys(valB).length) return false
    for (const key in valA) {
      if (!has(valB, key)) return false
      if (valA[key] !== valB[key] && !deep) return false
      if (deep && !eq(valA[key], valB[key], true)) return false
    }
    return true
  }
  return false
}
