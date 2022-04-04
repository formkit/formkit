import { FormKitNode } from '@formkit/core'
import type { FormKitOptionsList } from './options'

/**
 * Checks if a the given option should have the selected attribute.
 * @param node - The node being evaluated.
 * @param option - The option value to check
 * @returns
 */
function isSelected(node: FormKitNode, option: string) {
  // Here we trick reactivity (if at play) to watch this function.
  node.context && node.context.value
  return Array.isArray(node._value)
    ? node._value.includes(option)
    : (node.value === undefined && !option) || node._value == option
}

/**
 * Select the correct values.
 * @param e - The input event emitted by the select.
 */
function selectInput(node: FormKitNode, e: Event) {
  const target = e.target as HTMLSelectElement
  const value = target.hasAttribute('multiple')
    ? Array.from(target.selectedOptions).map((o) => o.value)
    : target.value
  node.input(value)
}

/**
 * Appends a placeholder to the options list.
 * @param options - An options list
 * @param placeholder - A placeholder string to append
 * @returns
 */
function applyPlaceholder(options: FormKitOptionsList, placeholder: string) {
  if (
    !options.some(
      (option) => option.attrs && option.attrs['data-is-placeholder']
    )
  ) {
    return [
      {
        label: placeholder,
        value: '',
        attrs: {
          hidden: true,
          disabled: true,
          'data-is-placeholder': 'true',
        },
      },
      ...options,
    ]
  }
  return options
}

/**
 * Converts the options prop to usable values.
 * @param node - A formkit node.
 * @public
 */
export default function select(node: FormKitNode): void {
  // Set the initial value of a multi-input
  node.on('created', () => {
    const isMultiple = node.props.attrs?.multiple !== undefined
    if (
      !isMultiple &&
      node.props.placeholder &&
      Array.isArray(node.props.options)
    ) {
      node.hook.prop(({ prop, value }, next) => {
        if (prop === 'options') {
          value = applyPlaceholder(value, node.props.placeholder)
        }
        return next({ prop, value })
      })
      node.props.options = applyPlaceholder(
        node.props.options,
        node.props.placeholder
      )
    }
    if (isMultiple) {
      if (node.value === undefined) {
        node.input([], false)
      }
    } else if (node.context && !node.context.options) {
      // If this input us (probably) using the default slot, we need to add a
      // "value" attribute to get bound
      node.props.attrs = Object.assign({}, node.props.attrs, {
        value: node._value,
      })
      node.on('input', ({ payload }) => {
        node.props.attrs = Object.assign({}, node.props.attrs, {
          value: payload,
        })
      })
    }
    if (node.context?.handlers) {
      node.context.handlers.selectInput = selectInput.bind(null, node)
    }
    if (node.context?.fns) {
      node.context.fns.isSelected = isSelected.bind(null, node)
    }
  })

  node.hook.input((value, next) => {
    if (
      !node.props.placeholder &&
      value === undefined &&
      Array.isArray(node.props?.options) &&
      node.props.options.length &&
      !('multiple' in node.props?.attrs)
    ) {
      value = node.props.options[0].value
    }
    return next(value)
  })
}
