import { isPojo } from '@formkit/utils'
import { Ref, watch, isRef, WatchStopHandle } from 'vue'

type ObjectPath = string[] & {
  __str: string
  __deep?: true
}

/**
 * Indicates that the path that was requested is no longer valid in the object.
 */
const invalidGet = Symbol()

/**
 *
 * @param obj - An object to observe at depth
 * @param callback - A callback that
 * @public
 */
export default function watchVerbose<
  T extends Ref<unknown> | Record<string, any>
>(
  obj: T,
  callback: (keypath: string[], value?: unknown, obj?: T) => void
): void {
  const watchers: Record<string, WatchStopHandle> = {}

  const applyWatch = (paths: ObjectPath[]): void => {
    // Watch each property
    for (const path of paths) {
      // Stops pre-existing watchers at a given location to prevent dupes:
      if (path.__str in watchers) watchers[path.__str]()
      watchers[path.__str] = watch(
        touch.bind(null, obj, path),
        dispatcher.bind(null, path),
        { deep: false }
      )
    }
  }

  /**
   * Clear any watchers deeper than this path.
   * @param path - The path to start from
   */
  const clearWatch = (path: ObjectPath) => {
    for (const key in watchers) {
      if (`${key}`.startsWith(`${path.__str}.`)) {
        watchers[key]()
        delete watchers[key]
      }
    }
  }

  const dispatcher = createDispatcher(obj, callback, applyWatch, clearWatch)
  applyWatch(getPaths(obj))
}

/**
 * This function synchronously dispatches to the watch callbacks. It uses the
 * knowledge that the getPath function is a depth-first-search thus lower
 * specificity (lower tree nodes) will always have their watchers called first.
 * If a lower specificity watcher is triggered we want to ignore the higher
 * specificity watcher.
 * @param obj - The object to dispatch
 * @param callback - The callback function to emit
 * @param applyWatch - A way to apply watchers to update objects
 * @returns
 */
function createDispatcher<T extends Ref<unknown> | Record<string, any>>(
  obj: T,
  callback: (keypath: string[], value?: unknown, obj?: T) => void,
  applyWatch: (paths: ObjectPath[]) => void,
  clearChildWatches: (paths: ObjectPath) => void
): (path: ObjectPath) => void {
  // let dispatchedPaths: Record<string, ObjectPath> = {}
  // let clear: Promise<void> | null = null

  return (path: ObjectPath) => {
    const value = get(obj, path)
    if (value === invalidGet) return
    if (path.__deep) clearChildWatches(path)
    if (typeof value === 'object') applyWatch(getPaths(value, [path], ...path))
    callback(path, value, obj)
  }
}

/**
 * "Touches" a given property for reactivity tracking purposes, if the value at
 * the given path is an object, we flatten it to just its keys since we will
 * already be tracking sub properties independently.
 * @param obj - A ref to traverse for a given path
 * @param path - An array of strings representing the path to locate
 * @returns
 */
function touch(obj: Ref<any> | Record<string, any>, path: ObjectPath) {
  const value = get(obj, path)
  return value && typeof value === 'object' ? Object.keys(value) : value
}

/**
 * "Touches" a given property for reactivity tracking purposes.
 * @param obj - A ref to traverse for a given path
 * @param path - An array of strings representing the path to locate
 * @returns
 */
function get(obj: unknown, path: string[]) {
  if (isRef(obj)) {
    if (path.length === 0) return obj.value
    obj = obj.value
  }
  return path.reduce((value, segment) => {
    if (value === invalidGet) return value
    if (value === null || typeof value !== 'object') {
      return invalidGet
    }
    return (value as any)[segment]
  }, obj)
}

/**
 * Recursively retrieves all enumerable property paths from the origination
 * object. For example:
 * ```js
 * const obj = {
 *   a: {
 *     b: 123
 *   },
 *   c: 567
 * }
 * const paths = getPaths(obj)
 * // [
 * //   ['a'],
 * //   ['a', 'b'],
 * //   ['c']
 * // ]
 * ```
 * @param obj - An object to retrieve paths for.
 * @param parents - An array of parent paths.
 * @returns
 * @internal
 */
export function getPaths(
  obj: unknown,
  paths: Array<ObjectPath> = [],
  ...parents: string[]
): ObjectPath[] {
  if (obj === null) return paths
  if (!parents.length) {
    const path = Object.defineProperty([], '__str', {
      value: '',
    }) as unknown as ObjectPath
    obj = isRef(obj) ? obj.value : obj
    if (obj && typeof obj === 'object') {
      Object.defineProperty(path, '__deep', { value: true })
      paths.push(path)
    } else {
      return [path]
    }
  }
  if (obj === null || typeof obj !== 'object') return paths

  for (const key in obj) {
    const path = parents.concat(key) as ObjectPath
    Object.defineProperty(path, '__str', { value: path.join('.') })
    const value = (obj as Record<string, unknown>)[key]
    if (isPojo(value) || Array.isArray(value)) {
      paths.push(Object.defineProperty(path, '__deep', { value: true }))
      paths = paths.concat(getPaths(value, [], ...path))
    } else {
      paths.push(path)
    }
  }
  return paths
}
