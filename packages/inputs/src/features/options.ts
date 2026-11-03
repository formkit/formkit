import { FormKitNode } from '@formkit/core'
import {
  FormKitOptionsPropWithGroups,
  FormKitOptionsListWithGroups,
  FormKitOptionsItem,
  FormKitOptionsGroupItem,
  FormKitOptionsList,
  FormKitOptionsProp,
  isGroupOption,
} from '../props'
import { eq, isPojo } from '@formkit/utils'

/**
 * A function to normalize an array of objects, array of strings, or object of
 * key-values to use an array of objects with value and label properties.
 *
 * @param options - An un-normalized {@link FormKitOptionsProp | FormKitOptionsProp}.
 *
 * @returns A list of {@link FormKitOptionsList | FormKitOptionsList}.
 *
 * @public
 */
export function normalizeOptions<T extends FormKitOptionsPropWithGroups>(
  options: T,
  i = { count: 1 }
): T extends FormKitOptionsProp
  ? FormKitOptionsList
  : FormKitOptionsListWithGroups {
  if (Array.isArray(options)) {
    return options.map(
      (option): FormKitOptionsItem | FormKitOptionsGroupItem => {
        if (typeof option === 'string' || typeof option === 'number') {
          return {
            label: String(option),
            value: String(option),
          }
        }
        if (typeof option == 'object') {
          if ('group' in option) {
            return maskedOption(option, {
              options: normalizeOptions(option.options || [], i),
            }) as FormKitOptionsGroupItem
          } else if ('value' in option && typeof option.value !== 'string') {
            return maskedOption(option, {
              value: `__mask_${i.count++}`,
              __original: option.value,
            }) as FormKitOptionsItem
          }
        }
        return option as FormKitOptionsItem
      }
    ) as any
  }
  return Object.keys(options).map((value: string) => {
    return {
      label: options[value],
      value,
    }
  })
}

/**
 * Returns a view of a user-provided option with some properties overridden,
 * without mutating the user's object (#1550). Every other read is forwarded to
 * the original, so reactive objects (e.g. Vue `reactive()` options whose labels
 * change in place) keep working exactly as before.
 */
function maskedOption<T extends object>(
  option: T,
  overrides: Record<string, unknown>
): T {
  return new Proxy(option, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && prop in overrides) return overrides[prop]
      return Reflect.get(target, prop, receiver)
    },
    has(target, prop) {
      return (typeof prop === 'string' && prop in overrides) || prop in target
    },
    ownKeys(target) {
      return [...new Set([...Reflect.ownKeys(target), ...Object.keys(overrides)])]
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === 'string' && prop in overrides) {
        return {
          value: overrides[prop],
          enumerable: true,
          configurable: true,
          writable: true,
        }
      }
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
  })
}

/**
 * Given an {@link FormKitOptionsList | FormKitOptionsListWithGroups}, find the real value in the options.
 *
 * @param options - The {@link FormKitOptionsList | FormKitOptionsListWithGroups} to check for a given value
 * @param value - The value to return
 *
 * @returns `unknown`
 *
 * @public
 */
export function optionValue(
  options: FormKitOptionsListWithGroups,
  value: string,
  undefinedIfNotFound = false
): unknown {
  if (Array.isArray(options)) {
    for (const option of options) {
      if (typeof option !== 'object' && option) continue
      if (isGroupOption(option)) {
        const found = optionValue(option.options, value, true)
        if (found !== undefined) {
          return found
        }
      } else if (value == option.value) {
        return '__original' in option ? option.__original : option.value
      }
    }
  }
  return undefinedIfNotFound ? undefined : value
}

/**
 * Determines if the value should be selected.
 *
 * @param valueA - Any type of value
 * @param valueB - Any type of value
 *
 * @returns `boolean`
 *
 * @public
 */
export function shouldSelect(valueA: unknown, valueB: unknown): boolean {
  if (
    (valueA === null && valueB === undefined) ||
    (valueA === undefined && valueB === null)
  )
    return false
  if (valueA == valueB) return true
  if (isPojo(valueA) && isPojo(valueB)) return eq(valueA, valueB)
  return false
}

/**
 * A feature that converts the options prop to usable values, to be used by a
 * feature or a plugin.
 *
 * @param node - A {@link @formkit/core#FormKitNode | FormKitNode}.
 *
 * @public
 */
export default function options(node: FormKitNode): void {
  node.hook.prop((prop: any, next: any) => {
    if (prop.prop === 'options') {
      if (typeof prop.value === 'function') {
        node.props.optionsLoader = prop.value
        prop.value = []
      } else {
        node.props._normalizeCounter ??= { count: 1 }
        prop.value = normalizeOptions(prop.value, node.props._normalizeCounter)
      }
    }
    return next(prop)
  })
}
