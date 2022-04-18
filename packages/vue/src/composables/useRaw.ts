import { isRef, toRaw, isReactive } from 'vue'
/**
 * Gets the raw underlying target object from a Vue Ref or Reactive object.
 * @param obj - Get the underlying target object, or no-op.
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export default function useRaw<T extends unknown>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (isReactive(obj)) {
    obj = toRaw(obj)
  } else if (isRef(obj)) {
    obj = (isReactive(obj.value) ? useRaw(obj.value as T) : obj.value) as T
  }
  return obj
}
