import { FormKitNode } from '@formkit/core'
import { FormKitOptionsProp, FormKitOptionsList } from '../props'
import { eq, isPojo } from '@formkit/utils'

/**
 * Accepts an array of objects, array of strings, or object of key-value pairs.
 * and returns an array of objects with value and label properties.
 * @param options - Options to normalize
 * @public
 */
export function normalizeOptions(
  options: FormKitOptionsProp
): FormKitOptionsList {
  let i = 1
  if (Array.isArray(options)) {
    return options.map((option) => {
      if (typeof option === 'string' || typeof option === 'number') {
        return {
          label: String(option),
          value: String(option),
        }
      }
      if (typeof option == 'object') {
        if ('value' in option && typeof option.value !== 'string') {
          Object.assign(option, {
            value: `__mask_${i++}`,
            __original: option.value,
          })
        }
      }
      return option
    })
  }
  return Object.keys(options).map((value) => {
    return {
      label: options[value],
      value,
    }
  })
}

/**
 * Given an option list, find the "true" value in the options.
 * @param options - The options to check for a given value
 * @param value - The value to return
 * @returns
 */
export function optionValue(
  options: FormKitOptionsList,
  value: string
): unknown {
  if (Array.isArray(options)) {
    for (const option of options) {
      if (value == option.value) {
        return '__original' in option ? option.__original : option.value
      }
    }
  }
  return value
}

/**
 * Determines if the value should be selected.
 * @param valueA - Any type of value
 * @param valueB - Any type of value
 */
export function shouldSelect(valueA: unknown, valueB: unknown): boolean {
  if (valueA == valueB) return true
  if (isPojo(valueA) && isPojo(valueB)) return eq(valueA, valueB)
  return false
}

/**
 * Converts the options prop to usable values.
 * @param node - A formkit node.
 * @public
 */
export default function options(node: FormKitNode): void {
  node.hook.prop((prop: any, next: any) => {
    if (prop.prop === 'options') {
      if (typeof prop.value === 'function') {
        node.props.optionsLoader = prop.value
        prop.value = []
      } else {
        prop.value = normalizeOptions(prop.value)
      }
    }
    return next(prop)
  })
}
