import { isRef, isReactive, toRaw } from 'vue'

/**
 * A mutual exclusion map of objects that have been emitted by core. The issue
 * this solves is knowing when an input had its value changed via v-model and
 * when it was changed via input(). This doesn't matter much for standard inputs
 * with scalar values, but it gets really important for objects that can be
 * deeply linked/referenced.
 */
const mutex = new Map<object, boolean>() // eslint-disable-line @typescript-eslint/ban-types

/**
 * Gets the raw underlying target object from a Vue Ref or Reactive object.
 * @param obj - Get the underlying target object, or no-op.
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function getRaw<T extends object>(obj: T): object {
  if (isReactive(obj)) {
    obj = toRaw(obj)
  } else if (isRef(obj)) {
    obj = obj.value as T
  }
  return obj
}

/**
 * Locks the current object, meaning a v-model should not re-transmit this value
 * back into FormKit’s core. This is an idempotent operation.
 * @param obj - An object to lock
 */
export function lock(obj: unknown): void {
  if (typeof obj === 'object' && obj !== null) mutex.set(getRaw(obj), false)
}

/**
 * Unlocks a given object meaning `@formkit/vue` has handled it and is ready for
 * another mutation. This also returns the value of the lock before it sets it
 * back to unlocked. This is an idempotent operation.
 * @param obj - an value to unlock (no-op if it isn’t an object)
 * @returns boolean
 */
export function unlock(obj: unknown): boolean {
  if (typeof obj === 'object' && obj !== null) {
    const rawObject = getRaw(obj)
    if (mutex.has(rawObject)) {
      const value = mutex.get(rawObject)
      mutex.set(rawObject, true)
      return !!value
    }
  }
  return true
}
