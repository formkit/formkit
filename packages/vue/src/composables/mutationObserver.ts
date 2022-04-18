import { isObject } from '@formkit/utils'

/**
 * Mutation observers typing.
 *
 */
type MutationObserver<T> = T & {
  __fk_mut: number
  __fk_trg: T
  __fk_rst: () => void
}

/**
 * Observes objects and knows if/when they have been modified.
 * @param obj - Object to potentially wrap in an observer
 * @returns
 */
export function observe<T>(obj: T): T {
  return isObject(obj) ? createObserver(obj) : obj
}

/**
 * Observe a formkit object.
 * @param obj - An object that might be an observed object.o
 * @returns
 */
export function isObserver<T>(obj: T): obj is MutationObserver<T> {
  return !!(
    isObject(obj) && typeof (obj as MutationObserver<T>).__fk_mut === 'number'
  )
}

/**
 * Wrap in a proxy object
 * @param obj - Object to
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function createObserver<T extends object>(obj: T): MutationObserver<T> {
  let count = 0
  return new Proxy(obj, {
    get(...args) {
      const [target, property] = args
      if (Array.isArray(target) && property in Array.prototype) count++
      else if (property === '__fk_mut') return count
      else if (property === '__fk_trg') return obj
      else if (property === '__fk_rst')
        return () => {
          count = 0
        }
      return Reflect.get(...args)
    },
    set(...args) {
      count++
      return Reflect.set(...args)
    },
  }) as MutationObserver<T>
}
