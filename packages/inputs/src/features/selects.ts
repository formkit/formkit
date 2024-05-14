import type {
  FormKitOptionsItem,
  FormKitOptionsGroupItem,
  FormKitOptionsListWithGroups,
} from './../props'
import type { FormKitNode } from '@formkit/core'
import { undefine, eq } from '@formkit/utils'
import { shouldSelect, optionValue } from './options'
import type { FormKitOptionsList } from '../props'
import { isGroupOption } from '../props'

/**
 * Checks if a the given option should have the selected attribute.
 * @param node - The node being evaluated.
 * @param option - The option value to check
 * @returns
 * @public
 */
function isSelected(
  node: FormKitNode,
  option: FormKitOptionsItem | FormKitOptionsGroupItem
) {
  if (isGroupOption(option)) return false
  // Here we trick reactivity (if at play) to watch this function.
  node.context && node.context.value
  const optionValue = '__original' in option ? option.__original : option.value
  return Array.isArray(node._value)
    ? node._value.some((optionA) => shouldSelect(optionA, optionValue))
    : (node._value === undefined ||
        (node._value === null && !containsValue(node.props.options, null))) &&
      option.attrs &&
      option.attrs['data-is-placeholder']
    ? true
    : shouldSelect(optionValue, node._value)
}

/**
 * Checks to see if a given value is anywhere in the options list.
 */
function containsValue(
  options: FormKitOptionsListWithGroups,
  value: unknown
): boolean {
  return options.some((option) => {
    if (isGroupOption(option)) {
      return containsValue(option.options, value)
    } else {
      return (
        ('__original' in option ? option.__original : option.value) === value
      )
    }
  })
}

/**
 * Defers the change event till after the next cycle.
 * @param node - The node being evaluated.
 * @param e - The change event.
 */
async function deferChange(node: FormKitNode, e: Event) {
  if (typeof node.props.attrs?.onChange === 'function') {
    await new Promise((r) => setTimeout(r, 0))
    await node.settled
    node.props.attrs.onChange(e)
  }
}

/**
 * Select the correct values.
 * @param e - The input event emitted by the select.
 */
function selectInput(node: FormKitNode, e: Event) {
  const target = e.target as HTMLSelectElement
  const value = target.hasAttribute('multiple')
    ? Array.from(target.selectedOptions).map((o) =>
        optionValue(node.props.options, o.value)
      )
    : optionValue(node.props.options, target.value)
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
 * Given an options list, find the first true value.
 * @param options - An options list (with groups)
 */
function firstValue(options: FormKitOptionsListWithGroups): unknown {
  const option = options.length > 0 ? options[0] : undefined
  if (!option) return undefined
  if (isGroupOption(option)) return firstValue(option.options)
  return '__original' in option ? option.__original : option.value
}

/**
 * Converts the options prop to usable values.
 * @param node - A formkit node.
 * @public
 */
export default function select(node: FormKitNode): void {
  // Set the initial value of a multi-input
  node.on('created', () => {
    const isMultiple = undefine(node.props.attrs?.multiple)

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
      // If this input is (probably) using the default slot, we need to add a
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
      node.context.handlers.onChange = deferChange.bind(null, node)
    }
    if (node.context?.fns) {
      node.context.fns.isSelected = isSelected.bind(null, node)
      node.context.fns.showPlaceholder = (value: unknown, placeholder) => {
        if (!Array.isArray(node.props.options)) return false
        const hasMatchingValue = node.props.options.some(
          (option: FormKitOptionsItem) => {
            if (option.attrs && 'data-is-placeholder' in option.attrs)
              return false
            const optionValue =
              '__original' in option ? option.__original : option.value
            return eq(value, optionValue)
          }
        )
        return placeholder && !hasMatchingValue ? true : undefined
      }
    }
  })

  node.hook.input((value, next) => {
    if (
      !node.props.placeholder &&
      value === undefined &&
      Array.isArray(node.props?.options) &&
      node.props.options.length &&
      !undefine(node.props?.attrs?.multiple)
    ) {
      value = firstValue(node.props.options)
    }
    return next(value)
  })
}
