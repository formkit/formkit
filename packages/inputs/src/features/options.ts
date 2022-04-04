import { FormKitNode } from '@formkit/core'

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
  if (Array.isArray(options)) {
    return options.map((option) => {
      if (typeof option === 'string' || typeof option === 'number') {
        return {
          label: option,
          value: option,
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
