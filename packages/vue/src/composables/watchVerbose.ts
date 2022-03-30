import { isPojo } from '@formkit/utils'
import { Ref, watch, isRef, WatchStopHandle } from 'vue'

type ObjectPath = string[] & {
  __str: string
  __deep?: true
}

/**
 *
 * @param obj - An object to observe at depth
 * @param callback - A callback that
 */
export default function watchVerbose<T extends Ref<unknown>>(
  obj: T,
  callback: (keypath?: string[], value?: unknown, obj?: T) => void
): void {
  if (!isRef(obj)) return
  // If there arent any child objects to watch, dont
  if (typeof obj.value !== 'object' || obj.value === null) return
  const watchers: Record<string, WatchStopHandle> = {}

  const applyWatch = (paths: ObjectPath[]): void => {
    // Watch each property
    for (const path of paths) {
      if (path.__str in watchers) watchers[path.__str]()
      watchers[path.__str] = watch(
        touch.bind(null, obj, path),
        buffer.bind(null, path),
        {
          deep: false,
          flush: 'sync',
        }
      )
    }
  }
  const buffer = createBuffer(obj, callback, applyWatch)
  applyWatch(getPaths(obj.value))
}

/**
 * Creates a buffer that automatically flushes on the next tick — but ensures
 * that only the least-specific of a given path set are flushed.
 *
 * @param obj - The ref to observe
 * @param callback - The callback used when flushing the buffer
 * @returns
 */
function createBuffer<T extends Ref<unknown>>(
  obj: T,
  callback: (keypath?: string[], value?: unknown, obj?: T) => void,
  applyWatch: (paths: ObjectPath[]) => void
): (path: ObjectPath) => void {
  let bufferedPaths: Record<string, ObjectPath> = {}
  let flushTimer: any
  const buffer = (path: ObjectPath) => {
    bufferedPaths[path.__str] = path
    clearTimeout(flushTimer)
    flushTimer = setTimeout(flush, 0)
  }
  const flush = () => {
    const lowestSpecificity: Record<string, ObjectPath> = {}
    for (const candidatePath in bufferedPaths) {
      let isNewMutation = true
      for (const currentLowest in lowestSpecificity) {
        if (currentLowest.startsWith(candidatePath)) {
          // in this case our candidate is a lower specificity so we should use
          // that for our callback instead
          delete lowestSpecificity[currentLowest]
          lowestSpecificity[candidatePath] = bufferedPaths[candidatePath]
          isNewMutation = false
        } else if (isNewMutation && candidatePath.startsWith(currentLowest)) {
          isNewMutation = false
        }
      }
      if (isNewMutation) {
        lowestSpecificity[candidatePath] = bufferedPaths[candidatePath]
      }
    }
    bufferedPaths = {}
    Object.values(lowestSpecificity).forEach((keypath) => {
      const value = get(obj, keypath)
      if (typeof value === 'object')
        applyWatch(getPaths(value, [keypath], ...keypath))
      callback(keypath, value, obj)
    })
  }
  return buffer
}

/**
 * "Touches" a given property for reactivity tracking purposes, if the value at
 * the given path is an object, we flatten it to just its keys since we will
 * already be tracking sub properties independently.
 * @param obj - A ref to traverse for a given path
 * @param path - An array of strings representing the path to locate
 * @returns
 */
function touch(obj: Ref<any>, path: ObjectPath) {
  const value = get(obj, path)
  return path.__deep ? Object.keys(value) : value
}

/**
 * "Touches" a given property for reactivity tracking purposes.
 * @param obj - A ref to traverse for a given path
 * @param path - An array of strings representing the path to locate
 * @returns
 */
function get(obj: Ref<any>, path: string[]) {
  return path.reduce((value, segment) => {
    if (typeof value === null || typeof value !== 'object') {
      return value
    }
    return value[segment]
  }, obj.value)
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
  obj: Record<string, any>,
  paths: Array<ObjectPath> = [],
  ...parents: string[]
): ObjectPath[] {
  if (obj === null) return paths
  for (const key in obj) {
    const path = parents.concat(key) as ObjectPath
    Object.defineProperty(path, '__str', { value: path.join('.') })
    const value = obj[key]
    if (isPojo(value) || Array.isArray(value)) {
      paths.push(Object.defineProperty(path, '__deep', { value: true }))
      paths = paths.concat(getPaths(value, [], ...path))
    } else {
      paths.push(path)
    }
  }
  return paths
}
