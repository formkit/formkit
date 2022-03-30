import { Ref, watch, toRef, isRef, toRaw } from 'vue'

/**
 *
 * @param obj - An object to observe at depth
 * @param callback - A callback that
 */
export default function watchVerbose<T extends Ref<unknown>>(
  obj: T,
  callback: (keypath?: string[], value?: unknown, obj?: T) => void,
  ...subpath: string[]
): void {
  if (!isRef(obj)) return
  // Add a root watcher
  if (!subpath.length) watch(obj, () => callback([], toRaw(obj)))
  // If there arent any child objects to watch, dont
  if (typeof obj.value !== 'object' || obj.value === null) return

  // TRY:
  // -- Get a collection of all keys at all depths
  // -- watch all keys
  // -- instead of calling callback directly, buffer changes and only call the
  //    most specific key path

  // Watch each property
  for (const key in obj.value) {
    const path = subpath.concat(key)
    watch(touch.bind(null, obj, path), () =>
      callback(path, touch(obj, path), obj)
    )
  }
}

function touch(obj: Ref<any>, paths: string[]) {
  return paths.reduce((value, path) => {
    if (typeof value === null || typeof value !== 'object') {
      return value
    }
    if (typeof value[path] === 'object') {
      return value[path]
    }
    return value[path]
  }, obj.value)
}
