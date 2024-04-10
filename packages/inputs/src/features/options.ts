import type { FormKitNode } from '@formkit/core'
import type {
  FormKitOptionsPropWithGroups,
  FormKitOptionsListWithGroups,
  FormKitOptionsItem,
  FormKitOptionsGroupItem,
  FormKitOptionsList,
  FormKitOptionsProp,
} from '../props'
import { isGroupOption } from '../props'
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
            option.options = normalizeOptions(option.options || [], i)
            return option as FormKitOptionsGroupItem
          } else if ('value' in option && typeof option.value !== 'string') {
            Object.assign(option, {
              value: `__mask_${i.count++}`,
              __original: option.value,
            })
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
