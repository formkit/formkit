import { FormKitNode } from '@formkit/core'
import { eq, isPojo } from '@formkit/utils'

/**
 * Options should always be formated as an array of objects with label and value
 * properties.
 * @public
 */
export type FormKitOptionsList = Array<
  {
    label: string
    value: string | number
  } & { [index: string]: any }
>

/**
 * Accepts an array of objects, array of strings, or object of key-value pairs.
 * and returns an array of objects with value and label properties.
 * @param options -
 */
function normalizeOptions(
  options: string[] | FormKitOptionsList | { [value: string]: string }
): FormKitOptionsList {
  let i = 1
  if (Array.isArray(options)) {
    return options.map((option) => {
      if (typeof option === 'string' || typeof option === 'number') {
        return {
          label: option,
          value: option,
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
  for (const option of options) {
    if (value == option.value) {
      return '__original' in option ? option.__original : option.value
    }
  }
  return false
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
  node.hook.prop((prop, next) => {
    if (prop.prop === 'options') {
      const options = normalizeOptions(prop.value)
      prop.value = options
    }
    return next(prop)
  })
}
