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
      if (typeof option === 'string') {
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
 */
export default function (node: FormKitNode): void {
  node.hook.prop((prop, next) => {
    if (prop.prop === 'options') {
      const options = normalizeOptions(prop.value)
      if (node.props.placeholder && !('multiple' in node.props?.attrs)) {
        options.unshift({
          label: node.props.placeholder,
          value: '',
          attrs: {
            hidden: true,
            disabled: true,
          },
        })
      }
      prop.value = options
    }
    return next(prop)
  })
  node.hook.input((value, next) => {
    if (
      !node.props.placeholder &&
      value === undefined &&
      node.props?.options &&
      !('multiple' in node.props?.attrs)
    ) {
      value = node.props.options[0].value
    }
    return next(value)
  })
}
